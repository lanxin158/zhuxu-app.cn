const { chromium } = require('playwright');

const baseUrl = process.env.ZHUXU_TEST_URL || 'http://127.0.0.1:8091';
const accounts = {
  pm: ['chen.pm', '001001'], builder: ['wu.builder', '001004'], production: ['wang.prod', '001002']
};

async function login(page, accountKey) {
  const [account, password] = accounts[accountKey];
  await page.goto(baseUrl);
  await page.locator('body.auth-locked').waitFor();
  await page.waitForLoadState('networkidle');
  await page.locator('#loginForm input[name="account"]').fill(account);
  await page.locator('#loginForm input[name="password"]').fill(password);
  await page.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await page.locator('body.authenticated').waitFor();
  await page.waitForLoadState('networkidle');
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const pmContext = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const pm = await pmContext.newPage();
  const errors = [];
  pm.on('pageerror', error => errors.push(`PM: ${error.message}`));
  await pm.goto(baseUrl);
  await pm.locator('body.auth-locked').waitFor();
  await pm.waitForLoadState('networkidle');
  if (!(await pm.locator('.login-version').textContent()).includes('局域网多人版')) throw new Error('LAN mode was not detected on login page');
  await pm.locator('#loginForm input[name="account"]').fill('chen.pm');
  await pm.locator('#loginForm input[name="password"]').fill('wrong');
  await pm.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await pm.locator('#loginError').getByText('账号或密码不正确', { exact: false }).waitFor();
  if (!(await pm.locator('#loginError').textContent()).includes('不正确')) throw new Error('Server did not reject invalid password');
  await pm.locator('#loginForm input[name="password"]').fill('001001');
  await pm.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await pm.locator('body.authenticated').waitFor();
  await pm.waitForLoadState('networkidle');
  if (!(await pm.locator('.sync-state').textContent()).includes('局域网')) throw new Error('Shared-data connection state missing');

  await pm.locator('#addTaskButton').click();
  await pm.locator('#taskForm input[name="title"]').fill('局域网多人协同测试任务');
  await pm.locator('#taskForm input[name="owner"]').fill('吴晨 · 施工员');
  await pm.locator('#taskForm input[name="creator"]').fill('陈海峰 · 项目经理');
  await pm.locator('#taskForm').getByRole('button', { name: '创建任务' }).click();
  await pm.locator('#taskDialog').waitFor({ state: 'hidden' });
  await pm.waitForTimeout(300);

  await pm.locator('[data-view="materials"]').click();
  await pm.locator('#materials [data-resource-tab="plans"]').click();
  await pm.locator('#materials [data-new-resource-plan]').click();
  const planForm = pm.locator('#resourcePlanForm');
  await planForm.locator('input[name="name"]').fill('局域网共享钢筋计划');
  await planForm.locator('input[name="quantity"]').fill('18 t');
  await planForm.locator('input[name="due"]').fill('2026-08-20');
  await planForm.locator('input[name="location"]').fill('3#楼 10F 梁板');
  await planForm.locator('select[name="contractBrandRequired"]').selectOption('no');
  await planForm.getByRole('button', { name: '保存资源计划' }).click();
  await pm.locator('#resourcePlanDialog').waitFor({ state: 'hidden' });
  const sharedPlanRow = pm.locator('#materials [data-resource-plan-detail]').filter({ hasText: '局域网共享钢筋计划' }).first();
  const sharedPlanId = await sharedPlanRow.getAttribute('data-resource-plan-detail');
  await pm.waitForTimeout(300);

  const denied = await pm.evaluate(async ({ planId }) => {
    const response = await fetch(`/api/approvals/${planId}/0`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) });
    return { status: response.status, body: await response.json() };
  }, { planId: sharedPlanId });
  if (denied.status !== 403 || !denied.body.error.includes('无权代办')) throw new Error(`Server did not block cross-account approval: ${denied.status} ${JSON.stringify(denied.body)}`);

  const builderContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const builder = await builderContext.newPage();
  builder.on('pageerror', error => errors.push(`Builder: ${error.message}`));
  await login(builder, 'builder');
  if (!(await builder.locator('#taskList').getByText('局域网多人协同测试任务').first().isVisible())) throw new Error('Task created by PM was not shared with builder');
  if (!(await builder.locator('#currentUserCard').getByText('吴晨').isVisible())) throw new Error('Builder login was not bound to server account');
  await builder.locator('[data-view="materials"]').click();
  await builder.locator('#materials [data-resource-tab="plans"]').click();
  await builder.locator(`#materials [data-resource-plan-detail="${sharedPlanId}"]`).click();
  const requesterAction = builder.locator('#resourceDetailDialog [data-approval-index="0"][data-approval-action="approve"]');
  if (!(await requesterAction.isVisible())) throw new Error('Requester did not receive own server approval action');
  await requesterAction.click();
  await builder.locator('#resourceDetailDialog .approval-step').nth(0).getByText('已通过', { exact: false }).waitFor();

  const productionContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const production = await productionContext.newPage();
  production.on('pageerror', error => errors.push(`Production: ${error.message}`));
  await login(production, 'production');
  await production.locator('[data-view="materials"]').click();
  await production.locator('#materials [data-resource-tab="plans"]').click();
  await production.locator(`#materials [data-resource-plan-detail="${sharedPlanId}"]`).click();
  const action = production.locator('#resourceDetailDialog [data-approval-index="1"][data-approval-action="approve"]');
  if (!(await action.isVisible())) throw new Error('Production manager did not receive own approval action');
  await action.click();
  await production.locator('#resourceDetailDialog .approval-step').nth(1).getByText('已通过', { exact: false }).waitFor();

  await pm.reload();
  await pm.locator('body.authenticated').waitFor();
  await pm.locator('[data-view="materials"]').click();
  await pm.locator('#materials [data-resource-tab="plans"]').click();
  await pm.locator(`#materials [data-resource-plan-detail="${sharedPlanId}"]`).click();
  if (!(await pm.locator('#resourceDetailDialog .approval-step').nth(1).getByText('已通过', { exact: false }).isVisible())) throw new Error('Approval result was not shared back to PM');

  const health = await pm.evaluate(async () => (await fetch('/api/health')).json());
  if (!health.ok || health.user.account !== 'chen.pm') throw new Error('Authenticated health endpoint failed');
  if (errors.length) throw new Error(errors.join(' | '));
  await productionContext.close(); await builderContext.close(); await pmContext.close(); await browser.close();
  console.log('PASS: LAN multi-user login, shared state and server-side approval verified');
})().catch(error => { console.error(error); process.exit(1); });
