const { chromium } = require('playwright');

const baseUrl = process.env.ZHUXU_TEST_URL || 'http://127.0.0.1:8091';
const accounts = {
  pm: ['chen.pm', '001001', 'ZhuxuPM2026'],
  builder: ['wu.builder', '001004', 'ZhuxuWu2026'],
  production: ['wang.prod', '001002', 'ZhuxuWang2026'],
  commercial: ['luo.cost', '001116', 'ZhuxuLuo2026'],
  labor: ['zhao.labor', '001113', 'ZhuxuZhao2026'],
  'li.tech': ['li.tech', '001201', 'ZhuxuLi2026']
};

async function waitAuthenticated(page) {
  await page.locator('body.authenticated').waitFor();
  await page.waitForLoadState('networkidle');
}

async function openLogin(page) {
  await page.goto(baseUrl);
  await page.locator('body.auth-locked').waitFor();
  await page.waitForLoadState('networkidle');
}

async function loginInitial(page, accountKey) {
  const [account, password] = accounts[accountKey];
  await openLogin(page);
  await page.locator('#loginForm input[name="account"]').fill(account);
  await page.locator('#loginForm input[name="password"]').fill(password);
  await page.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await waitAuthenticated(page);
}

async function changePassword(page, accountKey) {
  const [, initial, fresh] = accounts[accountKey];
  await page.locator('#passwordChangeDialog[open]').waitFor();
  await page.locator('#passwordChangeForm input[name="currentPassword"]').fill(initial);
  await page.locator('#passwordChangeForm input[name="newPassword"]').fill(fresh);
  await page.locator('#passwordChangeForm input[name="confirmPassword"]').fill(fresh);
  await page.locator('#passwordChangeForm').getByRole('button', { name: '确认修改密码' }).click();
  await page.locator('#passwordChangeDialog').waitFor({ state: 'hidden' });
}

async function login(page, accountKey) {
  const [account, , fresh] = accounts[accountKey];
  await openLogin(page);
  await page.locator('#loginForm input[name="account"]').fill(account);
  await page.locator('#loginForm input[name="password"]').fill(fresh);
  await page.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await waitAuthenticated(page);
  if (await page.locator('#passwordChangeDialog[open]').count()) throw new Error(`${accountKey} was unexpectedly forced to change password`);
}

async function apiPut(page, path, value) {
  return page.evaluate(async ({ path, value }) => {
    const response = await fetch(path, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value }) });
    return { status: response.status, body: await response.json() };
  }, { path, value });
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
  await pm.locator('#passwordChangeDialog[open]').waitFor();
  if (!(await pm.locator('#passwordChangeDialog').getByText('请先修改初始密码').isVisible())) throw new Error('First-login password change dialog was not shown');

  const gatedState = await apiPut(pm, '/api/state/zhuxu-tasks', await pm.evaluate(() => tasks));
  if (gatedState.status !== 403 || !gatedState.body.error.includes('请先修改初始密码')) throw new Error(`Server did not block writes before password change: ${JSON.stringify(gatedState)}`);

  await pm.locator('#passwordChangeForm input[name="currentPassword"]').fill('wrong-current');
  await pm.locator('#passwordChangeForm input[name="newPassword"]').fill('ZhuxuPM2026');
  await pm.locator('#passwordChangeForm input[name="confirmPassword"]').fill('ZhuxuPM2026');
  await pm.locator('#passwordChangeForm').getByRole('button', { name: '确认修改密码' }).click();
  await pm.locator('#passwordChangeError').getByText('当前密码不正确', { exact: false }).waitFor();
  await pm.locator('#passwordChangeForm input[name="currentPassword"]').fill('001001');
  await pm.locator('#passwordChangeForm input[name="newPassword"]').fill('1234567');
  await pm.locator('#passwordChangeForm input[name="confirmPassword"]').fill('1234567');
  await pm.locator('#passwordChangeForm').getByRole('button', { name: '确认修改密码' }).click();
  await pm.locator('#passwordChangeError').getByText('新密码至少 8 位', { exact: false }).waitFor();
  await pm.locator('#passwordChangeForm input[name="newPassword"]').fill('12345678');
  await pm.locator('#passwordChangeForm input[name="confirmPassword"]').fill('12345678');
  await pm.locator('#passwordChangeForm').getByRole('button', { name: '确认修改密码' }).click();
  await pm.locator('#passwordChangeError').getByText('新密码必须同时包含字母和数字', { exact: false }).waitFor();
  await pm.locator('#passwordChangeForm input[name="newPassword"]').fill('ZhuxuPM2026');
  await pm.locator('#passwordChangeForm input[name="confirmPassword"]').fill('ZhuxuPM2026');
  await pm.locator('#passwordChangeForm').getByRole('button', { name: '确认修改密码' }).click();
  await pm.locator('#passwordChangeDialog').waitFor({ state: 'hidden' });
  await pm.waitForLoadState('networkidle');

  await pm.locator('[data-view="tasks"]').click();
  await pm.locator('#tasks .subview-action').click();
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

  await pm.locator('[data-view="technical"]').click();
  await pm.locator('#technical .subview-action').click();
  const technicalForm = pm.locator('#technicalDocumentForm');
  await technicalForm.locator('select[name="type"]').selectOption('contact');
  await technicalForm.locator('input[name="code"]').fill('LXR-2026-LAN');
  await technicalForm.locator('input[name="title"]').fill('局域网共享技术联系函');
  await technicalForm.locator('input[name="building"]').fill('3#楼');
  await technicalForm.locator('input[name="scope"]').fill('3#楼 10F');
  await technicalForm.locator('textarea[name="content"]').fill('钢筋验收前复核保护层垫块并形成记录。');
  await technicalForm.getByRole('button', { name: '保存技术文件' }).click();
  await pm.locator('#technicalDocumentDialog').waitFor({ state: 'hidden' });
  await pm.waitForTimeout(300);

  await pm.locator('[data-view="cost"]').click();
  await pm.locator('#cost .subview-action').click();
  const costForm = pm.locator('#costDocumentForm');
  await costForm.locator('select[name="type"]').selectOption('quantity');
  await costForm.locator('input[name="code"]').fill('GCLQR-2026-LAN');
  await costForm.locator('input[name="title"]').fill('局域网共享现场工程量确认单');
  await costForm.locator('input[name="party"]').fill('总包单位 / 劳务班组');
  await costForm.locator('input[name="amount"]').fill('¥12,800');
  await costForm.locator('input[name="zone"]').fill('3#楼 10F');
  await costForm.locator('textarea[name="content"]').fill('共同确认3#楼10F现场新增工程量。');
  await costForm.getByRole('button', { name: '保存成控文件' }).click();
  await pm.locator('#costDocumentDialog').waitFor({ state: 'hidden' });
  await pm.waitForTimeout(300);

  const denied = await pm.evaluate(async ({ planId }) => {
    const response = await fetch(`/api/approvals/${planId}/0`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) });
    return { status: response.status, body: await response.json() };
  }, { planId: sharedPlanId });
  if (denied.status !== 403 || !denied.body.error.includes('无权代办')) throw new Error(`Server did not block cross-account approval: ${denied.status} ${JSON.stringify(denied.body)}`);

  await pm.locator('[data-view="intake"]').click();
  await pm.evaluate(() => openIntakeDialog());
  await pm.locator('#intakeForm select[name="source"]').selectOption('manual');
  await pm.locator('#intakeForm input[name="title"]').fill('局域网共享现场信息');
  await pm.locator('#intakeForm input[name="zone"]').fill('3#楼 10F');
  await pm.locator('#intakeForm textarea[name="rawText"]').fill('3#楼10F钢筋验收前复核保护层垫块');
  await pm.locator('#intakeForm').getByRole('button', { name: '保存并生成待校核项' }).click();
  await pm.locator('#intakeReviewDialog[open]').waitFor();
  await pm.locator('#intakeReviewDialog [data-close-dialog]').click();
  await pm.waitForTimeout(300);

  const createdAccount = await pm.evaluate(async () => {
    const response = await fetch('/api/accounts', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '李明', role: '试验员', account: 'li.tech', phone: '138 0000 1201', scope: '取样送检与试验跟踪' }) });
    return { status: response.status, body: await response.json() };
  });
  if (createdAccount.status !== 200 || !createdAccount.body.account) throw new Error(`PM could not create account: ${createdAccount.status} ${JSON.stringify(createdAccount.body)}`);
  const liTechId = createdAccount.body.account.id;
  const orgAfterCreate = await pm.evaluate(async () => {
    const payload = await (await fetch('/api/bootstrap', { credentials: 'same-origin' })).json();
    return payload.state['zhuxu-organization'] || [];
  });
  if (!orgAfterCreate.some(person => person.account === 'li.tech')) throw new Error('Created account was not synced into organization state');
  const accountsList = await pm.evaluate(async () => {
    const payload = await (await fetch('/api/accounts', { credentials: 'same-origin' })).json();
    return payload.accounts || [];
  });
  if (!accountsList.some(account => account.account === 'li.tech' && account.mustChangePassword)) throw new Error('Created account is not marked as must-change-password');

  const builderContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const builder = await builderContext.newPage();
  builder.on('pageerror', error => errors.push(`Builder: ${error.message}`));
  await loginInitial(builder, 'builder');
  await changePassword(builder, 'builder');
  await builder.locator('[data-view="tasks"]').click();
  if (!(await builder.locator('#tasks').getByText('局域网多人协同测试任务').first().isVisible())) throw new Error('Task created by PM was not shared with builder');
  await builder.locator('[data-view="intake"]').click();
  if (!(await builder.evaluate(() => intakeRecords.some(item => item.title === '局域网共享现场信息')))) throw new Error('Information collection record was not shared with builder');
  await builder.locator('[data-view="technical"]').click();
  if (!(await builder.locator('#technical').getByText('局域网共享技术联系函', { exact: true }).isVisible())) throw new Error('Technical document was not shared with builder');
  const builderBootstrap = await builder.evaluate(async () => (await fetch('/api/bootstrap', { credentials: 'same-origin' })).json());
  if (Object.prototype.hasOwnProperty.call(builderBootstrap.state || {}, 'zhuxu-cost-documents')) throw new Error('Unauthorized builder received cost-control state');
  await builder.locator('[data-view="cost"]').click();
  if (!(await builder.locator('#costAccessDialog[open]').isVisible())) throw new Error('Unauthorized builder did not receive cost access warning');
  if (await builder.locator('#cost.active').count()) throw new Error('Unauthorized builder entered cost-control page');
  const deniedCostUpdate = await builder.evaluate(async () => {
    const response = await fetch('/api/state/zhuxu-cost-documents', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: [] }) });
    return { status: response.status, body: await response.json() };
  });
  if (deniedCostUpdate.status !== 403 || !deniedCostUpdate.body.error.includes('无成控文件')) throw new Error(`Server did not protect cost-control state: ${JSON.stringify(deniedCostUpdate)}`);
  await builder.locator('#costAccessDialog [data-close-dialog]').first().click();
  if (!(await builder.locator('#currentUserCard').getByText('吴晨').isVisible())) throw new Error('Builder login was not bound to server account');
  const deniedAccounts = await builder.evaluate(async () => {
    const response = await fetch('/api/accounts', { credentials: 'same-origin' });
    return { status: response.status, body: await response.json() };
  });
  if (deniedAccounts.status !== 403 || !deniedAccounts.body.error.includes('仅项目经理')) throw new Error(`Server did not block account list for builder: ${JSON.stringify(deniedAccounts)}`);
  const deniedOrgWrite = await apiPut(builder, '/api/state/zhuxu-organization', await builder.evaluate(() => organization));
  if (deniedOrgWrite.status !== 403 || !deniedOrgWrite.body.error.includes('写入权限')) throw new Error(`Server did not restrict organization writes: ${JSON.stringify(deniedOrgWrite)}`);
  const deniedAttendanceWrite = await apiPut(builder, '/api/state/zhuxu-attendance', await builder.evaluate(() => attendanceRecords));
  if (deniedAttendanceWrite.status !== 403 || !deniedAttendanceWrite.body.error.includes('写入权限')) throw new Error(`Server did not restrict attendance writes for builder: ${JSON.stringify(deniedAttendanceWrite)}`);
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
  await loginInitial(production, 'production');
  await changePassword(production, 'production');
  await production.locator('[data-view="materials"]').click();
  await production.locator('#materials [data-resource-tab="plans"]').click();
  await production.locator(`#materials [data-resource-plan-detail="${sharedPlanId}"]`).click();
  const action = production.locator('#resourceDetailDialog [data-approval-index="1"][data-approval-action="approve"]');
  if (!(await action.isVisible())) throw new Error('Production manager did not receive own approval action');
  await action.click();
  await production.locator('#resourceDetailDialog .approval-step').nth(1).getByText('已通过', { exact: false }).waitFor();
  const productionAttendanceWrite = await apiPut(production, '/api/state/zhuxu-attendance', await production.evaluate(() => attendanceRecords));
  if (productionAttendanceWrite.status !== 403 || !productionAttendanceWrite.body.error.includes('写入权限')) throw new Error(`Server did not restrict attendance writes for production manager: ${JSON.stringify(productionAttendanceWrite)}`);

  const commercialContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const commercial = await commercialContext.newPage();
  commercial.on('pageerror', error => errors.push(`Commercial: ${error.message}`));
  await loginInitial(commercial, 'commercial');
  await changePassword(commercial, 'commercial');
  await commercial.locator('[data-view="cost"]').click();
  if (!(await commercial.locator('#cost').getByText('局域网共享现场工程量确认单', { exact: true }).isVisible())) throw new Error('Authorized commercial manager could not access shared cost-control document');

  const laborContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const labor = await laborContext.newPage();
  labor.on('pageerror', error => errors.push(`Labor: ${error.message}`));
  await loginInitial(labor, 'labor');
  await changePassword(labor, 'labor');
  const laborAttendanceWrite = await apiPut(labor, '/api/state/zhuxu-attendance', await labor.evaluate(() => attendanceRecords));
  if (laborAttendanceWrite.status !== 200) throw new Error(`Labor officer could not write attendance: ${JSON.stringify(laborAttendanceWrite)}`);

  const liTechContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const liTech = await liTechContext.newPage();
  liTech.on('pageerror', error => errors.push(`LiTech: ${error.message}`));
  await loginInitial(liTech, 'li.tech');
  await changePassword(liTech, 'li.tech');
  const liTechTaskWrite = await apiPut(liTech, '/api/state/zhuxu-tasks', await liTech.evaluate(() => tasks));
  if (liTechTaskWrite.status !== 200) throw new Error(`New account could not write shared tasks: ${JSON.stringify(liTechTaskWrite)}`);

  const disableResult = await pm.evaluate(async ({ liTechId }) => {
    const response = await fetch(`/api/accounts/${encodeURIComponent(liTechId)}`, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: 0 }) });
    return { status: response.status, body: await response.json() };
  }, { liTechId });
  if (disableResult.status !== 200) throw new Error(`PM could not disable account: ${JSON.stringify(disableResult)}`);
  await liTech.goto(baseUrl);
  await liTech.locator('body.auth-locked').waitFor();
  await liTech.waitForLoadState('networkidle');
  await liTech.locator('#loginForm input[name="account"]').fill('li.tech');
  await liTech.locator('#loginForm input[name="password"]').fill('ZhuxuLi2026');
  await liTech.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await liTech.locator('#loginError').getByText('账号或密码不正确', { exact: false }).waitFor();

  const enableResult = await pm.evaluate(async ({ liTechId }) => {
    const response = await fetch(`/api/accounts/${encodeURIComponent(liTechId)}`, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: 1 }) });
    return { status: response.status, body: await response.json() };
  }, { liTechId });
  if (enableResult.status !== 200) throw new Error(`PM could not re-enable account: ${JSON.stringify(enableResult)}`);
  await liTech.locator('#loginForm input[name="password"]').fill('ZhuxuLi2026');
  await liTech.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await liTech.locator('body.authenticated').waitFor();
  await liTech.waitForLoadState('networkidle');
  if (await liTech.locator('#passwordChangeDialog[open]').count()) throw new Error('Re-enabled account was unexpectedly forced to change password');

  const resetResult = await pm.evaluate(async ({ liTechId }) => {
    const response = await fetch(`/api/accounts/${encodeURIComponent(liTechId)}`, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resetPassword: true }) });
    return { status: response.status, body: await response.json() };
  }, { liTechId });
  if (resetResult.status !== 200) throw new Error(`PM could not reset account password: ${JSON.stringify(resetResult)}`);
  await liTech.goto(baseUrl);
  await liTech.locator('body.auth-locked').waitFor();
  await liTech.waitForLoadState('networkidle');
  await liTech.locator('#loginForm input[name="account"]').fill('li.tech');
  await liTech.locator('#loginForm input[name="password"]').fill('001201');
  await liTech.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await liTech.locator('body.authenticated').waitFor();
  await liTech.waitForLoadState('networkidle');
  await liTech.locator('#passwordChangeDialog[open]').waitFor();
  await changePassword(liTech, 'li.tech');

  await pm.reload();
  await pm.locator('body.authenticated').waitFor();
  await pm.waitForLoadState('networkidle');
  if (await pm.locator('#passwordChangeDialog[open]').count()) throw new Error('PM was forced to change password again after reload');
  await pm.locator('[data-view="materials"]').click();
  await pm.locator('#materials [data-resource-tab="plans"]').click();
  await pm.locator(`#materials [data-resource-plan-detail="${sharedPlanId}"]`).click();
  if (!(await pm.locator('#resourceDetailDialog .approval-step').nth(1).getByText('已通过', { exact: false }).isVisible())) throw new Error('Approval result was not shared back to PM');

  const health = await pm.evaluate(async () => (await fetch('/api/health')).json());
  if (!health.ok || health.user.account !== 'chen.pm') throw new Error('Authenticated health endpoint failed');
  if (errors.length) throw new Error(errors.join(' | '));
  await liTechContext.close(); await laborContext.close(); await commercialContext.close(); await productionContext.close(); await builderContext.close(); await pmContext.close(); await browser.close();
  console.log('PASS: LAN multi-user login, first-login password change, account management, cost permissions, shared state and server-side approval verified');
})().catch(error => { console.error(error); process.exit(1); });
