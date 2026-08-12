'use strict';

const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { spawn, spawnSync } = require('node:child_process');

const ROOT = __dirname;
const LAN_ONLY = process.argv.includes('--lan-only');

function runNode(label, args, env = process.env) {
  console.log(`\n[baseline] ${label}`);
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    env,
    stdio: 'inherit'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label}失败（退出码 ${result.status}）`);
}

async function getFreePort() {
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  listener.close();
  await once(listener, 'close');
  return port;
}

async function waitForServer(url, child, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`局域网测试服务提前退出（退出码 ${child.exitCode}）`);
    try {
      const response = await new Promise((resolve, reject) => {
        const request = http.get(url, resolve);
        request.setTimeout(1000, () => request.destroy(new Error('timeout')));
        request.on('error', reject);
      });
      response.resume();
      if (response.statusCode === 200) return;
    } catch {
      // 服务仍在启动，继续等待。
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('局域网测试服务启动超时');
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    once(child, 'exit'),
    new Promise(resolve => setTimeout(resolve, 5000))
  ]);
  if (child.exitCode === null) {
    child.kill('SIGKILL');
    await once(child, 'exit');
  }
}

function cleanupTestRoot(testRoot) {
  const resolvedTemp = path.resolve(os.tmpdir());
  const resolvedRoot = path.resolve(testRoot);
  const safeTarget = path.dirname(resolvedRoot) === resolvedTemp && path.basename(resolvedRoot).startsWith('zhuxu-lan-test-');
  if (!safeTarget) throw new Error(`拒绝清理非测试目录：${resolvedRoot}`);
  fs.rmSync(resolvedRoot, { recursive: true, force: true });
}

async function runLanTest() {
  const port = await getFreePort();
  const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zhuxu-lan-test-'));
  const env = {
    ...process.env,
    ZHUXU_HOST: '127.0.0.1',
    ZHUXU_PORT: String(port),
    ZHUXU_TEST_URL: `http://127.0.0.1:${port}`,
    ZHUXU_DB_PATH: path.join(testRoot, 'test.sqlite'),
    ZHUXU_UPLOAD_DIR: path.join(testRoot, 'uploads')
  };
  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  let serverOutput = '';
  server.stdout.on('data', chunk => { serverOutput += chunk.toString(); });
  server.stderr.on('data', chunk => { serverOutput += chunk.toString(); });

  try {
    await waitForServer(env.ZHUXU_TEST_URL, server);
    runNode('局域网多人协同测试', ['_test_lan.js'], env);
  } catch (error) {
    if (serverOutput.trim()) console.error(`\n[baseline] 服务日志：\n${serverOutput.trim()}`);
    throw error;
  } finally {
    await stopServer(server);
    cleanupTestRoot(testRoot);
  }
}

async function main() {
  if (!LAN_ONLY) {
    const syntaxFiles = ['app.js', 'server.js', 'server-bridge.js', '_test_app.js', '_test_new_features.js', '_test_lan.js', '_test_all.js'];
    for (const file of syntaxFiles) runNode(`语法检查：${file}`, ['--check', file]);
    runNode('桌面端与移动端离线流程', ['_test_app.js']);
    runNode('材料审批与隐蔽验收流程', ['_test_new_features.js']);
  }
  await runLanTest();
  console.log('\nPASS: 项目开发基线全部验证通过');
}

main().catch(error => {
  console.error(`\nFAIL: ${error.stack || error.message}`);
  process.exit(1);
});
