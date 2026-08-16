const { chromium } = require('playwright');

const baseUrl = process.env.ZHUXU_TEST_URL || 'http://127.0.0.1:8091';
const accounts = {
  builder: ['wu.builder', '001004', 'ZhuxuWu2026'],
  production: ['wang.prod', '001002', 'ZhuxuWang2026'],
  commercial: ['luo.cost', '001116', 'ZhuxuLuo2026'],
  labor: ['zhao.labor', '001113', 'ZhuxuZhao2026'],
  'li.tech': ['li.tech', '001201', 'ZhuxuLi2026'],
  'bob.wu': ['bob.wu', '001301', 'ZhuxuBob2026']
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

  // 单项目账号未选项目时自动带入唯一项目
  const autoProjectLogin = await pm.evaluate(async () => {
    const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account: 'wang.pm', password: 'WangPm2026' }) });
    return { status: response.status, body: await response.json() };
  });
  if (autoProjectLogin.status !== 200 || autoProjectLogin.body.user.project.id !== projectAId) throw new Error(`Single-project login without projectId should auto-select, got ${autoProjectLogin.status} ${JSON.stringify(autoProjectLogin.body)}`);

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

  // —— 施工图：单张上传按专业归档 ——
  await pm.locator('#technical .subview-action').click();
  const drawingForm = pm.locator('#technicalDocumentForm');
  await drawingForm.locator('select[name="type"]').selectOption('drawing');
  await drawingForm.locator('input[name="code"]').fill('SJT-2026-001');
  await drawingForm.locator('input[name="title"]').fill('3#楼 8F 梁配筋图');
  await drawingForm.locator('input[name="building"]').fill('3#楼');
  await drawingForm.locator('select[name="profession"]').selectOption('结构');
  await drawingForm.locator('input[name="scope"]').fill('3#楼 8F');
  await drawingForm.locator('textarea[name="content"]').fill('梁配筋详图（多行\n说明文字）');
  await drawingForm.getByRole('button', { name: '保存技术文件' }).click();
  await pm.locator('#technicalDocumentDialog').waitFor({ state: 'hidden' });
  await pm.waitForTimeout(200);
  const drawingRecord = await pm.evaluate(() => technicalDocuments.find(item => item.code === 'SJT-2026-001'));
  if (!drawingRecord || drawingRecord.profession !== '结构') throw new Error(`Drawing profession was not saved: ${JSON.stringify(drawingRecord)}`);

  // —— 施工图：直接上传图纸文件夹（导入时指定归属单体，按 专业/图纸 自动归档） ——
  const folderImport = await pm.evaluate(async () => {
    const files = [];
    const rels = ['结构/首层梁配筋图.dwg', '建筑/首层平面图.dwg', '给排水/集水坑排水图.dwg', '电气/景观电气.dwg'];
    for (const rel of rels) {
      const file = new File(['dwg-content'], rel.split('/').pop());
      Object.defineProperty(file, 'webkitRelativePath', { value: rel });
      files.push(file);
    }
    const count = await importDrawingFolder(files, '4#楼');
    const docs = technicalDocuments.filter(item => item.fromFolder).map(item => `${item.building}/${item.profession}/${item.title}`);
    return { count, docs };
  });
  if (folderImport.count !== 4) throw new Error(`Folder import should add 4 drawings, got ${folderImport.count}`);
  for (const expect of ['4#楼/结构/首层梁配筋图', '4#楼/建筑/首层平面图', '4#楼/给排水/集水坑排水图', '4#楼/电气/景观电气']) {
    if (!folderImport.docs.includes(expect)) throw new Error(`Folder import missing ${expect}: ${JSON.stringify(folderImport.docs)}`);
  }

  // —— 施工图：新建单体按钮 ——
  await pm.locator('[data-technical-filter="drawing"]').click();
  await pm.locator('[data-new-drawing-building]').click();
  await pm.locator('#drawingNewBuildingDialog[open]').waitFor();
  await pm.locator('#drawingNewBuildingForm input[name="buildingName"]').fill('5#楼');
  await pm.locator('#drawingNewBuildingForm').getByRole('button', { name: '创建单体文件夹' }).click();
  await pm.locator('#drawingNewBuildingDialog').waitFor({ state: 'hidden' });
  if (!(await pm.locator('.technical-building-folders [data-technical-building="5#楼"]').count())) throw new Error('New building folder was not created');
  if (!(await pm.locator('.technical-building-folders [data-technical-building="4#楼"]').count())) throw new Error('Folder-imported building folder missing');

  // —— 施工图：单体文件夹内按专业分组与过滤 ——
  await pm.locator('.technical-building-folders [data-technical-building="3#楼"]').click();
  if (await pm.locator('.technical-profession-tabs button').count() < 3) throw new Error('Profession tabs missing inside building folder');
  await pm.locator('[data-technical-profession="结构"]').click();
  if (!(await pm.locator('#technical').getByText('3#楼 8F 梁配筋图').first().isVisible())) throw new Error('Structural drawing not shown in structural filter');
  if (await pm.locator('#technical').getByText('首层平面图').count()) throw new Error('Drawing from another building leaked into filter');
  await pm.locator('[data-technical-building="all"]').click();
  await pm.locator('.technical-building-folders [data-technical-building="4#楼"]').click();
  await pm.locator('[data-technical-profession="建筑"]').click();
  if (!(await pm.locator('#technical').getByText('首层平面图').first().isVisible())) throw new Error('Architectural drawing not shown in 4# building architectural filter');
  await pm.locator('[data-technical-profession="结构"]').click();
  if (!(await pm.locator('#technical').getByText('首层梁配筋图').first().isVisible())) throw new Error('Structural drawing not shown in 4# building structural filter');
  if (await pm.locator('#technical').getByText('3#楼 8F 梁配筋图').count()) throw new Error('3# building drawing leaked into 4# building filter');
  await pm.locator('[data-technical-building="all"]').click();

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
  const orgB = bootB.state['zhuxu-organization'] || [];
  if (!orgB.some(person => person.account === 'zhang.pm') || !orgB.some(person => person.account === 'wang.pm')) throw new Error(`Project B organization should contain its admin and the creator, got ${JSON.stringify(orgB.map(p => p.account))}`);

  const crossContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const crossLogin = await crossContext.newPage();
  crossLogin.on('pageerror', error => errors.push(`Cross: ${error.message}`));
  await openLogin(crossLogin);
  if (await crossLogin.locator('#loginProjectSelect option').count() !== 2) throw new Error('Login page should list two projects');
  await selectProject(crossLogin, projectBId);
  await crossLogin.locator('#loginForm input[name="account"]').fill('wu.builder');
  await crossLogin.locator('#loginForm input[name="password"]').fill('001004');
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

  // —— 同一账号参与多个项目：项目经理将已有账号加入其他项目，登录后可一键切换 ——
  const bobCreated = await apiPost(pm, '/api/accounts', { name: '吴波', role: '施工员', account: 'bob.wu', phone: '138 0000 1301', scope: '现场施工' });
  if (bobCreated.status !== 200 || !bobCreated.body.account.created) throw new Error(`bob.wu should be created new in project A: ${JSON.stringify(bobCreated.body)}`);
  const bobLinked = await apiPost(bAdmin, '/api/accounts', { name: '吴波', role: '施工员', account: 'bob.wu', phone: '138 0000 1301', scope: '现场施工' });
  if (bobLinked.status !== 200 || bobLinked.body.account.created) throw new Error(`bob.wu should be linked (not re-created) in project B: ${JSON.stringify(bobLinked.body)}`);

  const bobContext = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const bob = await bobContext.newPage();
  bob.on('pageerror', error => errors.push(`Bob: ${error.message}`));
  await loginInitial(bob, 'bob.wu', projectBId);
  await changePassword(bob, 'bob.wu');
  const bobProjects = await bob.evaluate(() => (window.ZhuxuServer.user.projects || []).map(project => project.id));
  if (!bobProjects.includes(projectAId) || !bobProjects.includes(projectBId)) throw new Error(`bob.wu should belong to both projects, got ${JSON.stringify(bobProjects)}`);
  if (!(await bob.locator('#projectButtonName').textContent()).includes('测试项目B')) throw new Error('bob.wu should be in project B after login');
  await bob.locator('#projectButton').click();
  await bob.locator('#projectSwitchDialog[open]').waitFor();
  if (await bob.locator('#projectSwitchList .project-switch-item').count() !== 2) throw new Error('Project switch list should show two projects');
  await bob.locator(`#projectSwitchList [data-switch-project="${projectAId}"]`).click();
  await bob.waitForFunction(() => (document.querySelector('#projectButtonName')?.textContent || '').includes('测试项目A'), null, { timeout: 15000 });
  await bob.waitForLoadState('networkidle');
  if (!(await bob.locator('#projectButtonName').textContent()).includes('测试项目A')) throw new Error('Switching to project A failed');
  const bobBootA = await bob.evaluate(async () => (await fetch('/api/bootstrap', { credentials: 'same-origin' })).json());
  if (!(bobBootA.state['zhuxu-tasks'] || []).some(task => task.title === '局域网多人协同测试任务')) throw new Error('Project A data was not visible after switching');
  const deniedSwitch = await bob.evaluate(async () => {
    const response = await fetch('/api/projects/switch', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: 'proj-nonexistent' }) });
    return { status: response.status, body: await response.json() };
  });
  if (deniedSwitch.status !== 403 || !deniedSwitch.body.error.includes('未获授权')) throw new Error(`Switch to unauthorized project should be 403: ${JSON.stringify(deniedSwitch)}`);

  // —— 用已有账号建立新项目：复用账号并自动加入创建者，顶栏菜单可切换 ——
  const projectC = await apiPost(pm, '/api/projects', { projectName: '测试项目C', projectCode: 'TC-2026', adminName: '王经理', adminAccount: 'wang.pm', adminPhone: '139 0000 1001', adminPassword: '' });
  if (projectC.status !== 200 || !projectC.body.reused) throw new Error(`Existing account should be reused for new project: ${projectC.status} ${JSON.stringify(projectC.body)}`);
  const projectCId = projectC.body.project.id;
  const multiProjectLogin = await pm.evaluate(async () => {
    const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account: 'wang.pm', password: 'WangPm2026' }) });
    return { status: response.status, body: await response.json() };
  });
  if (multiProjectLogin.status !== 400 || !multiProjectLogin.body.error.includes('多个项目')) throw new Error(`Multi-project login without projectId should ask to choose, got ${multiProjectLogin.status} ${JSON.stringify(multiProjectLogin.body)}`);
  const pmProjects = await pm.evaluate(async () => (await fetch('/api/bootstrap', { credentials: 'same-origin' })).json());
  if (!(pmProjects.user.projects || []).some(project => project.id === projectCId)) throw new Error(`wang.pm should belong to new project C, got ${JSON.stringify(pmProjects.user.projects)}`);
  // 顶栏项目菜单切换：A → C
  await pm.locator('#projectButton').click();
  await pm.locator('#projectSwitchDialog[open]').waitFor();
  if (await pm.locator('#projectSwitchList .project-switch-item').count() !== 3) throw new Error('wang.pm switch list should show three projects (A, B and C)');
  await pm.locator(`#projectSwitchList [data-switch-project="${projectCId}"]`).click();
  await pm.waitForFunction(() => (document.querySelector('#projectButtonName')?.textContent || '').includes('测试项目C'), null, { timeout: 15000 });
  await pm.waitForLoadState('networkidle');
  const pmBootC = await pm.evaluate(async () => (await fetch('/api/bootstrap', { credentials: 'same-origin' })).json());
  if (!(pmBootC.state['zhuxu-organization'] || []).some(person => person.account === 'wang.pm')) throw new Error('wang.pm should be in project C organization');
  // 切回项目 A，保持后续断言上下文
  await pm.locator('#projectButton').click();
  await pm.locator(`#projectSwitchList [data-switch-project="${projectAId}"]`).click();
  await pm.waitForFunction(() => (document.querySelector('#projectButtonName')?.textContent || '').includes('测试项目A'), null, { timeout: 15000 });
  await pm.waitForLoadState('networkidle');

  // —— 新建项目对话框：密码显示/隐藏按钮 ——
  await pm.locator('#projectButton').click();
  await pm.locator('#projectSwitchDialog[open]').waitFor();
  await pm.locator('#projectSwitchNew').click();
  await pm.locator('#newProjectDialog[open]').waitFor();
  await pm.locator('#newProjectForm .password-field .password-toggle').first().click();
  if (await pm.locator('#newProjectForm input[name="adminPassword"]').evaluate(input => input.type) !== 'text') throw new Error('Password toggle did not reveal password');
  await pm.locator('#newProjectForm .password-field .password-toggle').first().click();
  if (await pm.locator('#newProjectForm input[name="adminPassword"]').evaluate(input => input.type) !== 'password') throw new Error('Password toggle did not hide password again');
  await pm.locator('#newProjectDialog [data-close-dialog]').first().click();

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
  await bobContext.close(); await liTechContext.close(); await laborContext.close(); await commercialContext.close(); await productionContext.close(); await builderContext.close(); await pmContext.close(); await browser.close();
  console.log('PASS: init wizard, multi-project isolation, cross-project account switch, account generation, cost permissions and server-side approval verified');
})().catch(error => { console.error(error); process.exit(1); });
