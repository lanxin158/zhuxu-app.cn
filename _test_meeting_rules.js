// Focused test; disposable database, uploads and browser profiles only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const rules = require('./meeting-rules');

(async () => {
  assert.equal(rules.confirm({}, { id: 1, dailyTarget: 80 }, 50, 'test', 'now').achievedTarget, 40);
  assert.equal(rules.progress({ progress: 100, confirmed: true }), 0, 'ordinary feedback is not meeting confirmation');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zhuxu-meeting-test-'));
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const baseURL = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['server.js'], { cwd: __dirname, windowsHide: true,
    env: { ...process.env, ZHUXU_HOST: '127.0.0.1', ZHUXU_PORT: String(port), ZHUXU_DB_PATH: path.join(root, 'test.sqlite'), ZHUXU_UPLOAD_DIR: path.join(root, 'uploads') }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '', browser;
  child.stderr.on('data', data => { logs += data; });
  try {
    for (let i = 0; i < 80; i++) {
      try { if ((await fetch(baseURL + '/api/bootstrap')).ok) break; } catch {}
      if (child.exitCode !== null) throw new Error(logs);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
    const pm = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
    const init = await pm.request.post('/api/projects/init', { data: { projectName: '例会隔离测试', projectCode: 'meeting-test', adminName: '测试经理', adminAccount: 'meeting.pm', adminPhone: '13900000101', adminPassword: 'MeetingTest2026' } });
    assert(init.ok(), await init.text());
    const projectId = (await init.json()).user.project.id;
    const put = async (key, value, expected = 200) => {
      const res = await pm.request.put(`/api/state/${key}`, { data: { value } });
      assert.equal(res.status(), expected, await res.text());
    };
    const date = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const plan = { id: 9001, level: 'day', title: '测试梁板钢筋', dailyTarget: 80, start: date, end: date, team: '测试钢筋班组', owners: ['测试经理 · 项目经理'], taskId: 9002 };
    await put('zhuxu-plans', [plan]);
    await put('zhuxu-tasks', [{ id: 9002, dayPlanId: 9001, title: plan.title, zone: '测试区', owner: '测试经理 · 项目经理', status: 'todo', priority: 'normal', time: '17:00' }]);
    await put('zhuxu-daily-execution', []);
    await put('zhuxu-daily-coordination', []);
    await put('zhuxu-resource-plans', []);
    await put('zhuxu-document-state', {});
    await put('zhuxu-quality-checks', []);
    await put('zhuxu-followups', [
      { id: 1, title: '测试材料待办', owner: '测试材料员 · 材料员', status: 'pending' },
      { id: 2, title: '测试资料待办', owner: '测试资料员 · 资料员', status: 'pending' },
      { id: 3, title: '已办不显示', owner: '测试材料员 · 材料员', status: 'done' }
    ]);
    const page = await pm.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.locator('body.authenticated').waitFor();
    await page.locator('[data-view="schedule"]').click();
    assert.equal(await page.locator('#schedule [data-open-daily-meeting]').count(), 0);
    await page.locator('[data-view="intake"]').click();
    assert.equal(await page.locator('#intake [data-open-daily-meeting]').count(), 0);
    await page.locator('[data-daily-meeting]').click();
    const input = page.locator('[data-meeting-today-progress]').first();
    const confirm = page.locator('[data-confirm-meeting-today]').first();
    const invalid = await pm.request.post('/api/daily-execution/confirm', { data: { taskId: 9002, dayPlanId: 9001, date, actualCompletion: '' } });
    assert.equal(invalid.status(), 409);
    await input.fill('100');
    await confirm.click();
    await page.waitForFunction(() => document.querySelector('[data-confirm-meeting-today]')?.textContent === '已确认锁定');
    assert(await input.isDisabled());
    assert((await page.locator('.daily-meeting-confirm-note').first().innerText()).includes('计划目标 80%'));
    let state = (await (await pm.request.get('/api/bootstrap')).json()).state;
    const locked = state['zhuxu-daily-execution'].find(row => row.taskId === 9002 && row.date === date);
    assert.equal(locked.actualCompletion, 100);
    assert.equal(locked.plannedTarget, 80);
    assert.equal(locked.achievedTarget, 80);
    const payload = { taskId: 9002, dayPlanId: 9001, date, actualCompletion: 50 };
    assert.equal((await pm.request.post('/api/daily-execution/confirm', { data: payload })).status(), 409);
    await put('zhuxu-daily-execution', [{ ...locked, actualCompletion: 50, progress: 50 }], 409);
    await put('zhuxu-daily-execution', [], 409);
    await put('zhuxu-daily-execution', [locked, { ...locked, date: tomorrow }], 409);
    await put('zhuxu-daily-execution', [{ ...locked, note: '普通记录可补充，完成率不可改' }]);
    await page.locator('#dailyMeetingDialog [data-close-dialog]').first().click();
    assert((await page.locator('.daily-task-row').first().innerText()).includes('实际完成率 100%'));
    assert((await page.locator('.daily-task-row').first().innerText()).includes('完成80%'));
    await page.locator('[data-daily-feedback="9002"]').click();
    assert(await page.locator('#dailyFeedbackForm [name="progress"]').isDisabled());
    await page.locator('#dailyFeedbackDialog [data-close-dialog]').first().click();
    await page.reload();
    await page.locator('body.authenticated').waitFor();
    await page.locator('[data-daily-meeting]').click();
    assert(await page.locator('[data-meeting-today-progress]').first().isDisabled());
    await page.locator('#dailyMeetingDialog [data-close-dialog]').first().click();
    await page.locator('#notificationButton').click();
    await page.locator('#todoDialog [data-todo-index]').first().waitFor();
    assert.equal(await page.locator('#todoDialog [data-todo-index]').count(), 2);
    assert((await page.locator('#todoDialogBody').innerText()).includes('测试资料待办'));
    await page.locator('#todoDialog [data-close-dialog]').first().click();
    console.log('PASS actual-vs-target, immediate sync, reload lock, repeated/direct/delete/forged update protection, single entry, manager todo list');

    for (const [i, role, name, expected] of [[1, '技术负责人', '测试技术', 2], [2, '生产经理', '测试生产', 2], [3, '材料员', '测试材料员', 1], [4, '资料员', '测试资料员', 1]]) {
      const account = `meeting.user${i}`, phone = `1390000020${i}`;
      const created = await pm.request.post('/api/accounts', { data: { name, role, account, phone, scope: '测试' } });
      assert(created.ok(), await created.text());
      const context = await browser.newContext({ baseURL });
      const login = await context.request.post('/api/login', { data: { account, password: phone.slice(-6), projectId } });
      assert(login.ok(), await login.text());
      const changed = await context.request.post('/api/password/change', { data: { currentPassword: phone.slice(-6), newPassword: 'MeetingTest2026' } });
      assert(changed.ok(), await changed.text());
      const result = await (await context.request.get('/api/todos')).json();
      assert.equal(result.items.length, expected, role);
      assert.equal(result.scope, i < 3 ? 'all' : 'mine');
      if (i >= 3) assert(result.items.every(item => item.owner.startsWith(name)), 'other persons excluded');
      if (i === 3) {
        const personal = await context.newPage();
        await personal.goto('/');
        await personal.locator('body.authenticated').waitFor();
        await personal.locator('#notificationButton').click();
        await personal.locator('#todoDialog [data-todo-index]').first().waitFor();
        assert.equal(await personal.locator('#todoDialog [data-todo-index]').count(), 1);
        assert(!(await personal.locator('#todoDialogBody').innerText()).includes('测试资料待办'));
      }
      await context.close();
    }
    await page.setViewportSize({ width: 667, height: 710 });
    await page.locator('#notificationButton').click();
    await page.screenshot({ path: path.join(__dirname, 'qa-meeting-todos-mobile.png') });
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    await put('zhuxu-plans', [plan, { ...plan, id: 9003, start: yesterday, end: yesterday }]);
    const yesterdayResult = await pm.request.post('/api/daily-execution/confirm', { data: { taskId: 9002, dayPlanId: 9003, date: yesterday, actualCompletion: 0 } });
    assert(yesterdayResult.ok(), await yesterdayResult.text());
    state = (await (await pm.request.get('/api/bootstrap')).json()).state;
    assert.equal(state['zhuxu-daily-execution'].find(row => row.date === date).actualCompletion, 100);
    assert.equal(state['zhuxu-daily-execution'].find(row => row.date === yesterday).actualCompletion, 0);
    const schedule = require('./schedule-rules');
    const period = schedule.weeks(Number(date.slice(0,4)),Number(date.slice(5,7))).find(w=>w.start<=date && w.end>=date);
    const goal = { building:'测试区',stage:'钢筋工程',mode:'quantity',baseline:0,target:10,unit:'吨',node:'' };
    const monthGoal = { id:9010,level:'month',title:'10吨月目标',start:date.slice(0,7)+'-01',end:date.slice(0,7)+'-'+new Date(Number(date.slice(0,4)),Number(date.slice(5,7)),0).getDate(),goal };
    const weekGoal = { id:9011,level:'week',title:'10吨周目标',...period,parentId:9010,goal };
    const linkedDay = { id:9012,taskId:9013,level:'day',title:'当天2吨',start:date,end:date,dailyTarget:80,parentId:9011,scheduleLink:{weekId:9011,monthId:9010,amount:2,capacity:2,workKey:'server-test-2t'} };
    const linkedPlans = [...state['zhuxu-plans'],monthGoal,weekGoal,linkedDay];
    await put('zhuxu-plans',linkedPlans);
    const linkedConfirm = await pm.request.post('/api/daily-execution/confirm',{data:{taskId:9013,dayPlanId:9012,date,actualCompletion:75}});
    assert(linkedConfirm.ok(),await linkedConfirm.text());
    const linkedRecord=(await linkedConfirm.json()).record;
    assert.deepEqual(linkedRecord.scheduleSnapshot,linkedDay.scheduleLink);
    assert.equal(schedule.summary(weekGoal,linkedPlans,[linkedRecord]).actual,1.5,'actual quantity not multiplied twice by dailyTarget');
    await put('zhuxu-plans',linkedPlans.map(p=>p.id===9012?{...p,parentId:null,scheduleLink:null}:p),409);
    await put('zhuxu-plans',linkedPlans.map(p=>p.id===9010?{...p,goal:{...p.goal,target:20}}:p),409);
    console.log('PASS server linkage snapshot, quantity rollup, confirmed reparent and denominator edits rejected');
    assert.deepEqual(errors, []);
    console.log('PASS role-scoped todo API for all 5 roles, mobile todo dialog; test data retained at', root);
  } finally {
    await browser?.close();
    if (child.exitCode === null) { child.kill(); await new Promise(resolve => child.once('exit', resolve)); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
