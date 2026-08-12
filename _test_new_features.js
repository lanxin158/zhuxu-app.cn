const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');

const sampleImageFile = {
  name: '现场测试照片.png',
  mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZbsAAAAASUVORK5CYII=', 'base64')
};

const testAccounts = {
  pm: ['chen.pm', '001001'], production: ['wang.prod', '001002'], technical: ['zhou.tech', '001003'],
  builder: ['wu.builder', '001004'], storekeeper: ['ma.store', '001115']
};

async function login(page, userId = 'pm') {
  const [account, password] = testAccounts[userId];
  await page.locator('#loginForm input[name="account"]').fill(account);
  await page.locator('#loginForm input[name="password"]').fill(password);
  await page.locator('#loginForm input[name="remember"]').check();
  await page.locator('#loginForm').getByRole('button', { name: '登录平台' }).click();
  await page.locator('body.authenticated').waitFor();
}

(async () => {
  const root = __dirname;
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await login(page, 'pm');

  await page.locator('[data-view="materials"]').click();
  await page.locator('#materials [data-resource-tab="plans"]').click();
  await page.locator('#materials [data-new-resource-plan]').click();
  const planForm = page.locator('#resourcePlanForm');
  if (await planForm.locator('select[name="requester"] option').count() < 5) throw new Error('Requester was not populated from organization');
  if (await planForm.locator('select[name="productionApprover"] option').count() < 1) throw new Error('Production manager was not populated from organization');
  if (await planForm.locator('select[name="technicalApprover"] option').count() < 1) throw new Error('Technical approver was not populated from organization');
  if (await planForm.locator('select[name="storekeeperApprover"] option').count() < 1) throw new Error('Storekeeper was not populated from organization');
  if (await planForm.locator('select[name="projectManagerApprover"] option').count() < 1) throw new Error('Project manager approver was not populated from organization');
  if (await planForm.locator('select[name="purchaser"] option').count() < 1) throw new Error('Purchaser was not populated from organization');
  await planForm.locator('input[name="name"]').fill('HRB400E Φ22钢筋计划');
  await planForm.locator('input[name="quantity"]').fill('24 t');
  await planForm.locator('input[name="due"]').fill('2026-08-18');
  await planForm.locator('input[name="location"]').fill('3#楼 9F 墙柱');
  await planForm.locator('select[name="contractBrandRequired"]').selectOption('yes');
  if (await page.locator('#contractBrandNameLabel').isHidden()) throw new Error('Contract brand name field did not appear');
  await planForm.locator('input[name="contractBrand"]').fill('沙钢、宝武');
  await planForm.locator('input[name="approvalFiles"]').setInputFiles({ name: '钢筋材料审批表.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 material approval') });
  await planForm.getByRole('button', { name: '保存资源计划' }).click();
  await page.locator('#resourcePlanDialog').waitFor({ state: 'hidden' });
  const planRow = page.locator('#materials [data-resource-plan-detail]').filter({ hasText: 'HRB400E Φ22钢筋计划' });
  const createdPlanId = Number(await planRow.getAttribute('data-resource-plan-detail'));
  const switchApprovalAccount = async userId => {
    if (await page.locator('#resourceDetailDialog').evaluate(dialog => dialog.open)) await page.locator('#resourceDetailDialog [data-close-dialog]').last().click();
    await page.locator('#accountSwitcherButton').click();
    await page.locator('body.auth-locked').waitFor();
    await login(page, userId);
    await planRow.click();
  };
  const firstApprovalNotice = await page.evaluate(() => JSON.parse(localStorage.getItem('zhuxu-followups')).find(item => item.title === '审批材料计划：HRB400E Φ22钢筋计划' && item.status === 'pending'));
  if (!firstApprovalNotice?.owner.includes('施工员')) throw new Error('First approval notification was not sent to the requester');
  await page.locator('[data-view="followups"]').click();
  const approvalNoticeCard = page.locator('#followups .followup-card').filter({ hasText: '审批材料计划：HRB400E Φ22钢筋计划' });
  if (!(await approvalNoticeCard.getByText('吴晨 · 施工员').isVisible())) throw new Error('Approval notification is not visible in platform worklist');
  await page.screenshot({ path: path.join(root, 'qa-approval-notification.png'), fullPage: true });
  await page.locator('[data-view="materials"]').click();
  await page.locator('#materials [data-resource-tab="plans"]').click();
  await page.locator('#materials [data-resource-tab="procurement"]').click();
  if (await page.locator('#materials').getByText('HRB400E Φ22钢筋计划').count()) throw new Error('Unapproved material plan leaked into procurement view');
  await page.locator('#materials [data-resource-tab="plans"]').click();
  await planRow.click();
  if (!(await page.locator('#resourceDetailDialog').getByText('是 · 沙钢、宝武').isVisible())) throw new Error('Contract brand requirement missing in detail');
  if (await page.locator('#resourceDetailDialog .approval-step').count() !== 5) throw new Error('Five-node approval workflow is incomplete');
  const approvalRoles = await page.locator('#resourceDetailDialog .approval-step > div > strong').allTextContents();
  if (approvalRoles.map(text => text.replace(/待我审批|审批中/g, '')).join('|') !== '提报人|生产经理|技术负责人|库管|项目经理') throw new Error(`Approval order is incorrect: ${approvalRoles.join('|')}`);
  if (!(await page.locator('#resourceDetailDialog').getByText('采购材料员等待接收').isVisible())) throw new Error('Procurement handoff is not shown as step six');
  if (!(await page.locator('#resourceDetailDialog').getByText('钢筋材料审批表.pdf').isVisible())) throw new Error('Material approval attachment missing');
  if (await page.locator('#resourceDetailDialog [data-approval-action]').count()) throw new Error('Project manager could act for the requester');
  await page.screenshot({ path: path.join(root, 'qa-approval-readonly.png'), fullPage: true });
  await page.evaluate(({ planId }) => updateResourceApproval(planId, 0, 'approve'), { planId: createdPlanId });
  if (!(await page.locator('#toast').textContent()).includes('无权代办')) throw new Error('Server-side approval guard did not reject another account');
  await switchApprovalAccount('builder');
  if (!(await page.locator('#resourceDetailDialog').getByText('当前审批已分配给你').isVisible())) throw new Error('Requester did not receive own approval action');
  await page.screenshot({ path: path.join(root, 'qa-approval-actionable.png'), fullPage: true });
  await page.locator('#resourceDetailDialog [data-approval-index="0"][data-approval-action="approve"]').click();
  let currentNotice = await page.evaluate(() => JSON.parse(localStorage.getItem('zhuxu-followups')).find(item => item.title === '审批材料计划：HRB400E Φ22钢筋计划' && item.status === 'pending'));
  if (!currentNotice?.owner.includes('生产经理')) throw new Error('Approval notification did not advance to production manager');
  if (await page.locator('#resourceDetailDialog [data-approval-action]').count()) throw new Error('Requester could act for production manager');
  await switchApprovalAccount('production');
  await page.locator('#resourceDetailDialog [data-approval-index="1"][data-approval-action="approve"]').click();
  currentNotice = await page.evaluate(() => JSON.parse(localStorage.getItem('zhuxu-followups')).find(item => item.title === '审批材料计划：HRB400E Φ22钢筋计划' && item.status === 'pending'));
  if (!currentNotice?.owner.includes('技术负责人')) throw new Error('Approval notification did not advance to technical director');
  await switchApprovalAccount('technical');
  await page.locator('#resourceDetailDialog [data-approval-index="2"][data-approval-action="approve"]').click();
  currentNotice = await page.evaluate(() => JSON.parse(localStorage.getItem('zhuxu-followups')).find(item => item.title === '审批材料计划：HRB400E Φ22钢筋计划' && item.status === 'pending'));
  if (!currentNotice?.owner.includes('库管')) throw new Error('Approval notification did not advance to storekeeper');
  await switchApprovalAccount('storekeeper');
  await page.locator('#resourceDetailDialog [data-approval-index="3"][data-approval-action="approve"]').click();
  currentNotice = await page.evaluate(() => JSON.parse(localStorage.getItem('zhuxu-followups')).find(item => item.title === '审批材料计划：HRB400E Φ22钢筋计划' && item.status === 'pending'));
  if (!currentNotice?.owner.includes('项目经理')) throw new Error('Approval notification did not advance to project manager');
  await switchApprovalAccount('pm');
  await page.locator('#resourceDetailDialog [data-approval-index="4"][data-approval-action="approve"]').click();
  if (!(await page.locator('#resourceDetailDialog').getByText('审批已完成').isVisible())) throw new Error('Approval workflow did not complete');
  if (!(await page.locator('#resourceDetailDialog').getByText('采购材料员已收到').isVisible())) throw new Error('Procurement access was not opened after all approvals');
  const purchaseNotice = await page.evaluate(() => JSON.parse(localStorage.getItem('zhuxu-followups')).find(item => item.title === '执行材料采购：HRB400E Φ22钢筋计划' && item.status === 'pending'));
  if (!purchaseNotice?.owner.includes('采购员')) throw new Error('Procurement notification was not sent after approval completion');
  await page.screenshot({ path: path.join(root, 'qa-material-approval.png'), fullPage: true });
  await page.locator('#resourceDetailDialog .approval-attachments [data-stored-file-index="0"]').click();
  await page.locator('#attachmentPreviewDialog').waitFor({ state: 'visible' });
  const approvalSrc = await page.locator('#attachmentPreviewBody iframe').getAttribute('src');
  if (!approvalSrc?.startsWith('blob:')) throw new Error('Material approval PDF could not be viewed');
  await page.locator('#attachmentPreviewDialog [data-close-dialog]').click();
  await page.locator('#resourceDetailDialog [data-close-dialog]').last().click();
  await page.locator('#materials [data-resource-tab="procurement"]').click();
  if (!(await page.locator('#materials').getByText('HRB400E Φ22钢筋计划').isVisible())) throw new Error('Approved material plan did not appear in procurement view');
  await page.screenshot({ path: path.join(root, 'qa-procurement-worklist.png'), fullPage: true });

  await page.locator('[data-view="documents"]').click();
  if (!(await page.locator('#documents').getByText('施工过程隐蔽验收').isVisible())) throw new Error('Concealed acceptance section missing');
  await page.locator('#documents [data-new-concealed]').click();
  const concealedForm = page.locator('#concealedAcceptanceForm');
  await concealedForm.locator('input[name="title"]').fill('3#楼9F墙柱钢筋隐蔽验收');
  await concealedForm.locator('input[name="location"]').fill('3#楼 9F 墙柱');
  await concealedForm.locator('input[name="date"]').fill('2026-08-11');
  await concealedForm.locator('input[name="linkedProcess"]').fill('3#楼9F墙柱模板封闭');
  await concealedForm.locator('select[name="status"]').selectOption('qualified');
  await concealedForm.getByRole('button', { name: '保存隐蔽验收' }).click();
  if (!(await page.locator('#concealedAcceptanceDialog').evaluate(dialog => dialog.open))) throw new Error('Qualified acceptance was allowed without files');
  await concealedForm.locator('input[name="documentFiles"]').setInputFiles({ name: '隐蔽验收记录.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 concealed acceptance') });
  await concealedForm.locator('input[name="photoFiles"]').setInputFiles(sampleImageFile);
  await concealedForm.locator('textarea[name="conclusion"]').fill('钢筋规格、间距、锚固及保护层检查合格，同意隐蔽。');
  await concealedForm.getByRole('button', { name: '保存隐蔽验收' }).click();
  await page.locator('#concealedAcceptanceDialog').waitFor({ state: 'hidden' });
  const concealedRow = page.locator('#documents [data-edit-concealed]').filter({ hasText: '3#楼9F墙柱钢筋隐蔽验收' });
  if (!(await concealedRow.getByText('已验收放行').isVisible())) throw new Error('Qualified concealed acceptance did not release process');
  if (!(await concealedRow.getByText('1 份资料').isVisible()) || !(await concealedRow.getByText('1 张照片').isVisible())) throw new Error('Concealed acceptance attachment counts missing');
  await page.screenshot({ path: path.join(root, 'qa-concealed-acceptance.png'), fullPage: true });
  await concealedRow.click();
  if (!(await page.locator('#concealedExistingFiles').getByText('隐蔽验收记录.pdf').isVisible())) throw new Error('Concealed acceptance documents not retained');
  await page.locator('#concealedExistingFiles [data-concealed-files="0"] [data-stored-file-index="0"]').click();
  await page.locator('#attachmentPreviewDialog').waitFor({ state: 'visible' });
  if (!(await page.locator('#attachmentPreviewBody iframe').getAttribute('src'))?.startsWith('blob:')) throw new Error('Concealed acceptance PDF could not be viewed');
  await page.locator('#attachmentPreviewDialog [data-close-dialog]').click();
  await page.locator('#concealedAcceptanceDialog [data-close-dialog]').first().click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#documents [data-edit-concealed]').filter({ hasText: '3#楼9F墙柱钢筋隐蔽验收' }).click();
  const concealedMetrics = await page.locator('#concealedAcceptanceDialog').evaluate(dialog => ({ scrollWidth: dialog.scrollWidth, clientWidth: dialog.clientWidth }));
  if (concealedMetrics.scrollWidth > concealedMetrics.clientWidth + 1) throw new Error('Concealed acceptance dialog overflows on mobile');
  await page.screenshot({ path: path.join(root, 'qa-mobile-concealed-acceptance.png'), fullPage: true });
  await page.locator('#concealedAcceptanceDialog [data-close-dialog]').first().click();
  await page.locator('#menuButton').click();
  await page.locator('[data-view="materials"]').click();
  await page.locator('#materials [data-resource-tab="plans"]').click();
  await page.locator('#materials [data-resource-plan-detail]').filter({ hasText: 'HRB400E Φ22钢筋计划' }).click();
  const resourceMetrics = await page.locator('#resourceDetailDialog').evaluate(dialog => ({ scrollWidth: dialog.scrollWidth, clientWidth: dialog.clientWidth }));
  if (resourceMetrics.scrollWidth > resourceMetrics.clientWidth + 1) throw new Error('Material approval detail overflows on mobile');
  await page.screenshot({ path: path.join(root, 'qa-mobile-material-approval.png'), fullPage: true });
  await page.locator('#resourceDetailDialog [data-close-dialog]').last().click();
  await page.locator('#materials [data-resource-tab="procurement"]').click();
  if (!(await page.locator('#materials').getByText('HRB400E Φ22钢筋计划').isVisible())) throw new Error('Approved plan missing from mobile procurement view');
  const procurementWidth = await page.locator('#materials .subview-shell').evaluate(element => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
  if (procurementWidth.scrollWidth > procurementWidth.clientWidth + 1) throw new Error('Procurement view overflows on mobile');
  await page.screenshot({ path: path.join(root, 'qa-mobile-procurement-worklist.png'), fullPage: true });

  const migrationContext = await browser.newContext();
  const migrationPage = await migrationContext.newPage();
  await migrationPage.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await migrationPage.evaluate(() => localStorage.setItem('zhuxu-resource-plans', JSON.stringify([{
    id: 999, type: 'material', name: '旧三节点材料计划', quantity: '10 t', due: '2026-08-20', location: '测试区', ownerRole: '材料员',
    approvalWorkflow: [{ role: '材料员', owner: '刘颖 · 材料员', status: 'approved' }, { role: '技术负责人', owner: '周海 · 技术负责人', status: 'pending' }, { role: '项目经理', owner: '陈海峰 · 项目经理', status: 'pending' }]
  }])));
  await migrationPage.reload();
  const migratedPlan = await migrationPage.evaluate(() => JSON.parse(localStorage.getItem('zhuxu-resource-plans'))[0]);
  if (migratedPlan.approvalWorkflow.map(step => step.role).join('|') !== '提报人|生产经理|技术负责人|库管|项目经理') throw new Error('Legacy three-node plan was not migrated');
  if (!migratedPlan.purchaser?.includes('采购员')) throw new Error('Legacy plan did not receive a purchaser');
  await migrationContext.close();

  if (errors.length) throw new Error(`Console errors: ${errors.join(' | ')}`);
  await browser.close();
  console.log('PASS: material approval and concealed acceptance verified');
})().catch(error => { console.error(error); process.exit(1); });
