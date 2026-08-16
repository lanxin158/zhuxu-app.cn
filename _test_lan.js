const { chromium } = require('playwright');

const baseUrl = process.env.ZHUXU_TEST_URL || 'http://127.0.0.1:8091';
const accounts = {
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

async function selectProject(page, projectId) {
  await page.locator('#loginProjectSelect').selectOption(projectId);
}

async function loginInitial(page, accountKey, projectId) {
  const [account, password] = accounts[accountKey];
  await openLogin(page);
  await selectProject(page, projectId);
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
  await page.waitForLoadState('networkidle');
}

async function loginCustom(page, account, password, projectId) {
  await openLogin(page);
  await selectProject(page, projectId);
  await page.locator('#loginForm input[name="account"]').fill(account);
  await page.locator('#loginForm input[name="password"]').fill(password);
  await page.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await waitAuthenticated(page);
  if (await page.locator('#passwordChangeDialog[open]').count()) throw new Error(`${account} was unexpectedly forced to change password`);
}

async function apiPut(page, path, value) {
  return page.evaluate(async ({ path, value }) => {
    const response = await fetch(path, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value }) });
    return { status: response.status, body: await response.json() };
  }, { path, value });
}

async function apiPost(page, path, body) {
  return page.evaluate(async ({ path, body }) => {
    const response = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }, { path, body });
}

async function apiPutRaw(page, path, body) {
  return page.evaluate(async ({ path, body }) => {
    const response = await fetch(path, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }, { path, body });
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const pmContext = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const pm = await pmContext.newPage();
  const errors = [];
  pm.on('pageerror', error => errors.push(`PM: ${error.message}`));
  let projectAId = '';
  let projectBId = '';

  // —— 新库首次启动：初始化向导 ——
  await pm.goto(baseUrl);
  await pm.locator('body.auth-init').waitFor();
  await pm.waitForLoadState('networkidle');
  if (!(await pm.locator('#initScreen').isVisible())) throw new Error('Init wizard was not shown on fresh database');
  if (!(await pm.locator('#initForm').getByText('建立项目并创建管理员').isVisible())) throw new Error('Init wizard heading missing');
  await pm.locator('#initForm input[name="projectName"]').fill('测试项目A');
  await pm.locator('#initForm input[name="projectCode"]').fill('TA-2026');
  await pm.locator('#initForm input[name="adminName"]').fill('王经理');
  await pm.locator('#initForm input[name="adminAccount"]').fill('wang.pm');
  await pm.locator('#initForm input[name="adminPhone"]').fill('139 0000 1001');
  await pm.locator('#initForm input[name="adminPassword"]').fill('WangPm2026');
  await pm.locator('#initForm input[name="adminPassword2"]').fill('WangPm2026');
  await pm.locator('#initForm').getByRole('button', { name: '建立项目并进入系统' }).click();
  await waitAuthenticated(pm);
  if (await pm.locator('#passwordChangeDialog[open]').count()) throw new Error('Init admin should not be forced to change custom password');
  if (!(await pm.locator('#projectButtonName').textContent()).includes('测试项目A')) throw new Error(`Project name not shown: ${await pm.locator('#projectButtonName').textContent()}`);
  const bootA = await pm.evaluate(async () => (await fetch('/api/bootstrap', { credentials: 'same-origin' })).json());
  projectAId = bootA.user.project.id;
  if (bootA.user.role !== '项目经理' || bootA.user.account !== 'wang.pm') throw new Error('Init admin role/account wrong');
  if (!bootA.state['zhuxu-organization'] || bootA.state['zhuxu-organization'].length !== 1) throw new Error('Init organization should contain only the admin');
  if (!(await pm.locator('.sync-state').textContent()).includes('局域网')) throw new Error('Shared-data connection state missing');

  // 初始化接口只允许一次
  const secondInit = await apiPost(pm, '/api/projects/init', { projectName: 'X', adminName: 'Y', adminAccount: 'y.pm', adminPhone: '13900000009', adminPassword: 'YyyPm2026' });
  if (secondInit.status !== 409) throw new Error(`Second init should be 409, got ${secondInit.status}`);

  // —— 项目经理建立组织机构，系统生成账号 ——
  const newPeople = [
    ['吴晨', '施工员', 'wu.builder', '138 0000 1004', '现场施工安排与进度落实'],
    ['王建国', '生产经理', 'wang.prod', '138 0000 1002', '日计划与班组协调'],
    ['周海', '技术负责人', 'zhou.tech', '138 0000 1003', '施工方案与技术交底'],
    ['马会', '库管', 'ma.store', '138 0000 1115', '收发存与到货衔接'],
    ['林浩', '采购员', 'lin.purchase', '138 0000 1114', '询价下单与供应跟踪'],
    ['罗婷', '商务经理', 'luo.cost', '138 0000 1116', '合同与经济核定'],
    ['赵敏', '劳资员', 'zhao.labor', '138 0000 1113', '实名制考勤'],
    ['刘颖', '材料员', 'liu.material', '138 0000 1111', '材料计划与台账']
  ];
  for (const [name, role, account, phone, scope] of newPeople) {
    const created = await apiPost(pm, '/api/accounts', { name, role, account, phone, scope });
    if (created.status !== 200 || !created.body.account) throw new Error(`PM could not create ${account}: ${JSON.stringify(created.body)}`);
  }
  const accountsA = await pm.evaluate(async () => (await fetch('/api/accounts', { credentials: 'same-origin' })).json());
  if (accountsA.accounts.length !== newPeople.length + 1) throw new Error(`Account list should have ${newPeople.length + 1} members, got ${accountsA.accounts.length}`);
  const orgA = await pm.evaluate(async () => (await fetch('/api/bootstrap', { credentials: 'same-origin' })).json());
  if (orgA.state['zhuxu-organization'].length !== newPeople.length + 1) throw new Error('Organization state not synced with accounts');
  await pm.reload();
  await pm.locator('body.authenticated').waitFor();
  await pm.waitForLoadState('networkidle');
  if (await pm.evaluate(() => organization.length) !== newPeople.length + 1) throw new Error('PM organization was not refreshed after account creation');

  // —— 业务闭环（任务 / 计划 / 技术文件 / 成控 / 采集）——
  await pm.locator('[data-view="tasks"]').click();
  await pm.locator('#tasks .subview-action').click();
  await pm.locator('#taskForm input[name="title"]').fill('局域网多人协同测试任务');
  await pm.locator('#taskForm input[name="owner"]').fill('吴晨 · 施工员');
  await pm.locator('#taskForm input[name="creator"]').fill('王经理 · 项目经理');
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

  // —— 第二个项目：项目经理建立新项目系统，数据完全隔离 ——
  const projectBCreate = await apiPost(pm, '/api/projects', { projectName: '测试项目B', projectCode: 'TB-2026', adminName: '张经理', adminAccount: 'zhang.pm', adminPhone: '139 0000 2001', adminPassword: 'ZhangPm2026' });
  if (projectBCreate.status !== 200 || !projectBCreate.body.project) throw new Error(`PM could not create project B: ${projectBCreate.status} ${JSON.stringify(projectBCreate.body)}`);
  projectBId = projectBCreate.body.project.id;

  const bContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const bAdmin = await bContext.newPage();
  bAdmin.on('pageerror', error => errors.push(`BAdmin: ${error.message}`));
  await loginCustom(bAdmin, 'zhang.pm', 'ZhangPm2026', projectBId);
  if (!(await bAdmin.locator('#projectButtonName').textContent()).includes('测试项目B')) throw new Error('Project B name not shown');
  const bootB = await bAdmin.evaluate(async () => (await fetch('/api/bootstrap', { credentials: 'same-origin' })).json());
  if (bootB.state['zhuxu-tasks'] && bootB.state['zhuxu-tasks'].length) throw new Error('Project B leaked tasks from project A');
  if (!bootB.state['zhuxu-organization'] || bootB.state['zhuxu-organization'].length !== 1) throw new Error('Project B organization should contain only its admin');

  const crossContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const crossLogin = await crossContext.newPage();
  crossLogin.on('pageerror', error => errors.push(`Cross: ${error.message}`));
  await openLogin(crossLogin);
  if (await crossLogin.locator('#loginProjectSelect option').count() !== 2) throw new Error('Login page should list two projects');
  await selectProject(crossLogin, projectBId);
  await crossLogin.locator('#loginForm input[name="account"]').fill('wang.pm');
  await crossLogin.locator('#loginForm input[name="password"]').fill('WangPm2026');
  await crossLogin.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await crossLogin.locator('#loginError').getByText('未获授权', { exact: false }).waitFor();

  const wrongContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const wrongProject = await wrongContext.newPage();
  wrongProject.on('pageerror', error => errors.push(`WrongProject: ${error.message}`));
  await openLogin(wrongProject);
  await selectProject(wrongProject, projectAId);
  await wrongProject.locator('#loginForm input[name="account"]').fill('zhang.pm');
  await wrongProject.locator('#loginForm input[name="password"]').fill('ZhangPm2026');
  await wrongProject.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await wrongProject.locator('#loginError').getByText('未获授权', { exact: false }).waitFor();

  const builderContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const builder = await builderContext.newPage();
  builder.on('pageerror', error => errors.push(`Builder: ${error.message}`));
  await loginInitial(builder, 'builder', projectAId);
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
  const deniedCostUpdate = await apiPut(builder, '/api/state/zhuxu-cost-documents', await builder.evaluate(() => costDocuments));
  if (deniedCostUpdate.status !== 403 || !deniedCostUpdate.body.error.includes('无成控文件')) throw new Error(`Server did not protect cost-control state: ${JSON.stringify(deniedCostUpdate)}`);
  await builder.locator('#costAccessDialog [data-close-dialog]').first().click();
  if (!(await builder.locator('#currentUserCard').getByText('吴晨').isVisible())) throw new Error('Builder login was not bound to project account');
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
  await loginInitial(production, 'production', projectAId);
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
  await loginInitial(commercial, 'commercial', projectAId);
  await changePassword(commercial, 'commercial');
  await commercial.locator('[data-view="cost"]').click();
  if (!(await commercial.locator('#cost').getByText('局域网共享现场工程量确认单', { exact: true }).isVisible())) throw new Error('Authorized commercial manager could not access shared cost-control document');

  const laborContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const labor = await laborContext.newPage();
  labor.on('pageerror', error => errors.push(`Labor: ${error.message}`));
  await loginInitial(labor, 'labor', projectAId);
  await changePassword(labor, 'labor');
  const laborAttendanceWrite = await apiPut(labor, '/api/state/zhuxu-attendance', await labor.evaluate(() => attendanceRecords));
  if (laborAttendanceWrite.status !== 200) throw new Error(`Labor officer could not write attendance: ${JSON.stringify(laborAttendanceWrite)}`);

  // —— 新账号生命周期：创建→改密→禁用→启用→重置 ——
  const liTechCreated = await apiPost(pm, '/api/accounts', { name: '李明', role: '试验员', account: 'li.tech', phone: '138 0000 1201', scope: '取样送检与试验跟踪' });
  if (liTechCreated.status !== 200 || !liTechCreated.body.account) throw new Error(`Could not create li.tech: ${JSON.stringify(liTechCreated.body)}`);
  const liTechContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const liTech = await liTechContext.newPage();
  liTech.on('pageerror', error => errors.push(`LiTech: ${error.message}`));
  await loginInitial(liTech, 'li.tech', projectAId);
  await changePassword(liTech, 'li.tech');
  const liTechTaskWrite = await apiPut(liTech, '/api/state/zhuxu-tasks', await liTech.evaluate(() => tasks));
  if (liTechTaskWrite.status !== 200) throw new Error(`New account could not write shared tasks: ${JSON.stringify(liTechTaskWrite)}`);

  const disableResult = await apiPutRaw(pm, `/api/accounts/${encodeURIComponent(liTechCreated.body.account.id)}`, { enabled: 0 });
  if (disableResult.status !== 200) throw new Error(`PM could not disable account: ${JSON.stringify(disableResult)}`);
  await liTech.goto(baseUrl);
  await liTech.locator('body.auth-locked').waitFor();
  await liTech.waitForLoadState('networkidle');
  await selectProject(liTech, projectAId);
  await liTech.locator('#loginForm input[name="account"]').fill('li.tech');
  await liTech.locator('#loginForm input[name="password"]').fill('ZhuxuLi2026');
  await liTech.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await liTech.locator('#loginError').getByText('账号或密码不正确', { exact: false }).waitFor();

  const enableResult = await apiPutRaw(pm, `/api/accounts/${encodeURIComponent(liTechCreated.body.account.id)}`, { enabled: 1 });
  if (enableResult.status !== 200) throw new Error(`PM could not re-enable account: ${JSON.stringify(enableResult)}`);
  await liTech.locator('#loginForm input[name="password"]').fill('ZhuxuLi2026');
  await liTech.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await waitAuthenticated(liTech);
  if (await liTech.locator('#passwordChangeDialog[open]').count()) throw new Error('Re-enabled account was unexpectedly forced to change password');

  const resetResult = await apiPutRaw(pm, `/api/accounts/${encodeURIComponent(liTechCreated.body.account.id)}`, { resetPassword: true });
  if (resetResult.status !== 200) throw new Error(`PM could not reset account password: ${JSON.stringify(resetResult)}`);
  await liTech.goto(baseUrl);
  await liTech.locator('body.auth-locked').waitFor();
  await liTech.waitForLoadState('networkidle');
  await selectProject(liTech, projectAId);
  await liTech.locator('#loginForm input[name="account"]').fill('li.tech');
  await liTech.locator('#loginForm input[name="password"]').fill('001201');
  await liTech.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await waitAuthenticated(liTech);
  await changePassword(liTech, 'li.tech');

  // —— 项目经理刷新后会话保持、审批结果回传 ——
  await pm.reload();
  await pm.locator('body.authenticated').waitFor();
  await pm.waitForLoadState('networkidle');
  if (await pm.locator('#passwordChangeDialog[open]').count()) throw new Error('PM was forced to change password again after reload');
  await pm.locator('[data-view="materials"]').click();
  await pm.locator('#materials [data-resource-tab="plans"]').click();
  await pm.locator(`#materials [data-resource-plan-detail="${sharedPlanId}"]`).click();
  if (!(await pm.locator('#resourceDetailDialog .approval-step').nth(1).getByText('已通过', { exact: false }).isVisible())) throw new Error('Approval result was not shared back to PM');

  const health = await pm.evaluate(async () => (await fetch('/api/health')).json());
  if (!health.ok || health.user.account !== 'wang.pm' || health.user.project.id !== projectAId) throw new Error('Authenticated health endpoint failed');
  if (errors.length) throw new Error(errors.join(' | '));
  await wrongContext.close(); await crossContext.close(); await bAdmin.close(); await bContext.close();
  await liTechContext.close(); await laborContext.close(); await commercialContext.close(); await productionContext.close(); await builderContext.close(); await pmContext.close(); await browser.close();
  console.log('PASS: init wizard, multi-project isolation, account generation, cost permissions, shared state and server-side approval verified');
})().catch(error => { console.error(error); process.exit(1); });
