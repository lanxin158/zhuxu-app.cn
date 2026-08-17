'use strict';

const { chromium } = require('playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function login(page) {
  await page.locator('#loginForm input[name="account"]').fill('chen.pm');
  await page.locator('#loginForm input[name="password"]').fill('001001');
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
  await login(page);

  if (!(await page.locator('#intakeTitle').getByText('每日任务执行中心').isVisible())) throw new Error('每日执行中心未渲染');
  if (await page.locator('[data-view="dashboard"]').count()) throw new Error('首页仍然保留了总览导航');
  if (!(await page.locator('[data-view="technical"]').isVisible())) throw new Error('侧边栏缺少技术文件入口');
  if (!(await page.locator('[data-view="cost"]').isVisible())) throw new Error('侧边栏缺少成控文件入口');
  if (await page.locator('#intake .daily-control-rail').count()) throw new Error('旧的五步流程条未删除');
  if (await page.locator('#intake .collection-register-details').count()) throw new Error('首页仍显示原始信息采集折叠区');
  if (!(await page.locator('#intake .weekly-command-board').getByText('本周计划完成情况', { exact: true }).isVisible())) throw new Error('本周计划完成情况标题缺失');
  if (await page.locator('#intake .today-plan-register article').count() !== 6) throw new Error('今日计划未逐项列出');
  if (await page.locator('#intake .weekly-daily-ledger article').count() !== 7) throw new Error('本周每日完成情况不完整');
  if (await page.locator('#intake .weekly-workforce-ledger article').count() !== 7) throw new Error('本周每日投入人员不完整');
  if (!(await page.locator('#intake .daily-task-row.lagging').first().isVisible())) throw new Error('昨日未完成未并入计划跟踪并标注滞后');
  if (!(await page.locator('#intake .daily-task-row .lag-badge').first().isVisible())) throw new Error('滞后天数标签缺失');
  if (await page.locator('#intake .daily-task-row.lagging').getByText('3#楼混凝土浇筑旁站', { exact: false }).count()) throw new Error('指定删除的混凝土旁站被错误当作昨日未完成');
  if (!(await page.locator('#intake .daily-task-board').getByText('今日计划跟踪', { exact: true }).isVisible())) throw new Error('今日计划跟踪标题缺失');
  if (!(await page.locator('#intake .tomorrow-coordination').getByText('需协调事项跟踪', { exact: true }).isVisible())) throw new Error('协调事项跟踪标题缺失');

  const linkage = await page.evaluate(() => {
    const date = document.querySelector('#dailyExecutionDate').value;
    const visibleAttendance = [...document.querySelectorAll('.weekly-workforce-ledger article')].map(item => item.querySelector('strong').textContent.trim());
    const monday = shiftDateKey(date, -((new Date(`${date}T12:00:00`).getDay() + 6) % 7));
    const expectedAttendance = Array.from({ length: 7 }, (_, index) => {
      const key = shiftDateKey(monday, index);
      const record = attendanceRecords.find(item => item.date === key);
      return record ? `${record.actual} 人` : '未上传';
    });
    const todayDayPlans = plans.filter(plan => plan.level === 'day' && plan.start <= date && plan.end >= date).length;
    const carryoverCount = getCarryoverContexts(shiftDateKey(date, -1)).filter(item => Number(item.record.progress || 0) < 100 && Number(item.task.id) !== 4).length;
    return { date, todayDayPlans, carryoverCount, rows: document.querySelectorAll('#intake [data-day-plan]').length, visibleAttendance, expectedAttendance };
  });
  if (linkage.todayDayPlans !== 6 || linkage.rows !== 6 + linkage.carryoverCount) throw new Error(`今日任务未完全来自日进度计划或昨日未完成未并入：${JSON.stringify(linkage)}`);
  if (JSON.stringify(linkage.visibleAttendance) !== JSON.stringify(linkage.expectedAttendance)) throw new Error('本周投入人数与考勤记录不一致');
  if (!(await page.locator('#intake .weekly-progress-compare').getByText('周进度滞后', { exact: false }).first().isVisible())) throw new Error('周进度对比缺失');
  if (await page.locator('#intake .daily-document-risk-list li').count() < 1) throw new Error('资料风险项未筛出');
  if (await page.locator('#intake .daily-support-card.material .daily-material-list > div').count() < 1) throw new Error('材料风险项未筛出');
  if (!(await page.locator('#intake .daily-risk-flag').first().isVisible())) throw new Error('设计变更没有明显风险标识');
  if (!(await page.locator('#intake .daily-document-risk-list li i.blocked').first().isVisible())) throw new Error('资料门禁风险未在资料风险项中标识');

  // —— 编辑昨日完成情况（直接点击滞后行的编辑记录） ——
  const yesterdayInfo = await page.evaluate(() => {
    const date = shiftDateKey(dailyDateKey, -1);
    const carry = getCarryoverContexts(date).filter(item => Number(item.record.progress) < 100 && Number(item.task.id) !== 4)[0];
    return carry ? { id: carry.task.id, date } : null;
  });
  if (!yesterdayInfo) throw new Error('没有可编辑的昨日续做项');
  await page.locator(`#intake .daily-task-row[data-daily-task="${yesterdayInfo.id}"] .daily-feedback-action[data-feedback-date="${yesterdayInfo.date}"]`).click();
  await page.locator('#dailyFeedbackDialog[open]').waitFor();
  if (!(await page.locator('#dailyFeedbackDialog .dialog-heading').getByText('编辑', { exact: false }).isVisible())) throw new Error('历史日期编辑标题未显示');
  await page.locator('#dailyFeedbackForm input[name="progress"]').fill('70');
  await page.locator('#dailyFeedbackForm').getByRole('button', { name: '保存施工反馈' }).click();
  await page.locator('#dailyFeedbackDialog').waitFor({ state: 'hidden' });
  const updatedProgress = await page.evaluate(({ id, date }) => { const record = dailyExecution.find(item => Number(item.taskId) === Number(id) && item.date === date); return record?.progress; }, yesterdayInfo);
  if (updatedProgress !== 70) throw new Error(`昨日完成百分比未能编辑：${updatedProgress}`);

  const today = await page.evaluate(() => dailyDateKey);
  await page.locator(`#intake .daily-task-row[data-daily-task="1"] .daily-feedback-action[data-feedback-date="${today}"]`).click();
  if (!(await page.locator('#dailyDocumentGateField.blocked').isVisible())) throw new Error('复试报告待闭环未标记为风险项');
  if (!(await page.locator('#dailyDocumentConditionState').getByText('风险项', { exact: false }).isVisible())) throw new Error('风险项提示文字缺失');
  await page.locator('#dailyFeedbackDialog [data-close-dialog]').first().click();
  await page.locator(`#intake .daily-task-row[data-daily-task="3"] .daily-feedback-action[data-feedback-date="${today}"]`).click();
  if (!(await page.locator('#dailyDocumentGateField.warning').isVisible())) throw new Error('普通待签字资料未标记为待完善');
  if (!(await page.locator('#dailyDocumentConditionState').getByText('待完善', { exact: false }).isVisible())) throw new Error('待完善提示文字缺失');
  await page.locator('#dailyFeedbackDialog [data-close-dialog]').first().click();

  await page.locator(`#intake .daily-task-row[data-daily-task="1"] .daily-feedback-action[data-feedback-date="${today}"]`).click();
  const feedback = page.locator('#dailyFeedbackForm');
  await feedback.locator('input[name="actualWorkers"]').fill('21');
  await feedback.locator('input[name="progress"]').fill('80');
  await feedback.locator('input[name="actualQuantity"]').fill('梁板钢筋完成 22.4 t');
  await feedback.locator('textarea[name="note"]').fill('东区完成，西区剩余收边工作');
  await feedback.getByRole('button', { name: '保存施工反馈' }).click();
  await page.locator('#dailyFeedbackDialog').waitFor({ state: 'hidden' });

  await page.locator(`#intake .daily-task-row[data-record-date="${today}"] [data-technical-task="1"]`).click();
  await page.locator('#technicalNoticeDialog[open]').waitFor();
  if (!(await page.locator('#technicalNoticeBody').getByText('3#楼8F东侧设备洞口附加筋按变更图施工', { exact: false }).isVisible())) throw new Error('设计变更正文未显示');
  if (!(await page.locator('#technicalNoticeBody .notice-source-document').isVisible())) throw new Error('上传的设计变更文件未显示');
  await page.locator('#acknowledgeTechnicalNotice').click();
  await page.locator('#technicalNoticeDialog').waitFor({ state: 'hidden' });

  await page.locator('#intake [data-new-coordination]').click();
  const coordination = page.locator('#coordinationForm');
  await coordination.locator('select[name="taskId"]').selectOption('1');
  await coordination.locator('select[name="category"]').selectOption({ label: '工作面未移交' });
  await coordination.locator('textarea[name="content"]').fill('西侧材料堆场明早需要清理并移交钢筋班组');
  await coordination.locator('input[name="owner"]').fill('王建国 · 生产经理');
  await coordination.getByRole('button', { name: '提交协调问题' }).click();
  await page.locator('#coordinationDialog').waitFor({ state: 'hidden' });
  const coordinationCard = page.locator('#intake .coordination-list article').filter({ hasText: '西侧材料堆场' });
  if (!(await coordinationCard.getByText('待跟进', { exact: true }).isVisible())) throw new Error('新协调事项没有待跟进状态');
  if (!(await coordinationCard.getByText('责任：王建国 · 生产经理', { exact: true }).isVisible())) throw new Error('协调事项责任人未显示');
  await coordinationCard.getByRole('button', { name: '开始跟进' }).click();
  const followingCard = page.locator('#intake .coordination-list article').filter({ hasText: '西侧材料堆场' });
  if (!(await followingCard.getByText('正在跟进', { exact: true }).isVisible())) throw new Error('协调事项未进入正在跟进状态');
  await followingCard.getByRole('button', { name: '标记完成' }).click();
  if (!(await page.locator('#intake .coordination-list article').filter({ hasText: '西侧材料堆场' }).getByText('已完成', { exact: true }).isVisible())) throw new Error('协调事项未完成闭环');

  await page.locator('[data-view="technical"]').click();
  if (!(await page.locator('#technical.active').isVisible())) throw new Error('技术文件页面未打开');
  if (await page.locator('#technical .technical-file-row[data-technical-document]').count() !== 4) throw new Error('四类默认技术文件未进入共享台账');
  await page.locator('#technical [data-technical-filter="change"]').click();
  if (await page.locator('#technical .technical-file-row[data-technical-document]').count() !== 1) throw new Error('设计变更筛选失败');
  await page.locator('#technical .technical-file-row[data-technical-document]').click();
  if (!(await page.locator('#technicalDocumentDetailDialog[open] .technical-document-paper').getByText('梁板洞口附加筋调整', { exact: true }).isVisible())) throw new Error('技术文件详情正文未显示');
  await page.locator('#technicalDocumentDetailDialog [data-close-dialog]').first().click();
  await page.locator('#technical [data-technical-overview-filter="drawing"]').click();
  if (await page.locator('#technical .technical-building-folders [data-technical-building]').count() !== 1) throw new Error('施工图未按单体建立文件夹');
  await page.locator('#technical .technical-building-folders [data-technical-building="3#楼"]').click();
  if (await page.locator('#technical .technical-file-row[data-technical-document]').count() !== 1) throw new Error('单体文件夹内未显示施工图');
  await page.locator('#technical .technical-file-row[data-technical-document]').click();
  if (!(await page.locator('#technicalDocumentDetailDialog[open]').getByText('施工图原文件', { exact: false }).isVisible())) throw new Error('施工图详情不能查看原文件');
  await page.locator('#technicalDocumentDetailDialog [data-close-dialog]').first().click();
  await page.screenshot({ path: path.join(root, 'qa-technical-folders.png'), fullPage: true });

  await page.locator('[data-view="cost"]').click();
  if (!(await page.locator('#cost.active').isVisible())) throw new Error('成控文件页面未打开');
  if (await page.locator('#cost .cost-file-row[data-cost-document]').count() !== 3) throw new Error('三类成控文件未进入台账');
  await page.locator('#cost [data-cost-overview-filter="economic"]').click();
  if (await page.locator('#cost .cost-file-row[data-cost-document]').count() !== 1) throw new Error('经济核定单分类筛选失败');
  await page.locator('#cost .cost-file-row[data-cost-document]').click();
  if (!(await page.locator('#costDocumentDetailDialog[open]').getByText('3#楼8F洞口附加筋调整经济核定', { exact: true }).first().isVisible())) throw new Error('成控文件详情未显示');
  await page.locator('#costDocumentDetailDialog [data-close-dialog]').first().click();
  await page.screenshot({ path: path.join(root, 'qa-cost-control.png'), fullPage: true });

  await page.evaluate(() => openIntakeDialog());
  const intakeForm = page.locator('#intakeForm');
  await intakeForm.locator('select[name="source"]').selectOption('manual');
  await intakeForm.locator('select[name="target"]').selectOption('task');
  await intakeForm.locator('input[name="title"]').fill('3#楼8F模板复核记录');
  await intakeForm.locator('input[name="zone"]').fill('3#楼 8F');
  await intakeForm.locator('textarea[name="rawText"]').fill('3#楼8F墙柱模板垂直度复核');
  await intakeForm.getByRole('button', { name: '保存并生成待校核项' }).click();
  await page.locator('#intakeReviewDialog[open]').waitFor();
  await page.locator('#intakeReviewCandidates [data-intake-candidate-title="0"]').fill('3#楼8F墙柱模板垂直度复核并形成记录');
  await page.locator('#intakeReviewForm').getByRole('button', { name: '确认并分发' }).click();
  await page.locator('#intakeReviewDialog').waitFor({ state: 'hidden' });

  const result = await page.evaluate(() => ({
    intake: JSON.parse(localStorage.getItem('zhuxu-intake-records')).find(item => item.title === '3#楼8F模板复核记录'),
    task: JSON.parse(localStorage.getItem('zhuxu-tasks')).find(item => item.title === '3#楼8F墙柱模板垂直度复核并形成记录'),
    daily: JSON.parse(localStorage.getItem('zhuxu-daily-execution')).find(item => Number(item.taskId) === 1),
    coordination: JSON.parse(localStorage.getItem('zhuxu-daily-coordination')).find(item => item.content.includes('西侧材料堆场')),
    technical: JSON.parse(localStorage.getItem('zhuxu-technical-documents')),
    cost: JSON.parse(localStorage.getItem('zhuxu-cost-documents'))
  }));
  if (result.intake?.status !== 'distributed' || !result.intake.businessRefs?.length) throw new Error('采集记录未保留分发追溯');
  if (!result.task || !String(result.task.criteria).includes(`信息采集中心 #${result.intake.id}`)) throw new Error('校核项未写入任务台账');
  if (result.daily?.progress !== 80 || result.daily?.actualWorkers !== 21 || !result.daily.technicalNotice.acknowledgedBy.includes('陈海峰 · 项目经理')) throw new Error('施工反馈或技术确认未持久化');
  if (result.coordination?.status !== 'resolved' || !result.coordination?.feedback) throw new Error('协调事项闭环记录未持久化');
  if (result.technical?.length !== 4) throw new Error('技术文件台账未持久化');
  if (result.cost?.length !== 3) throw new Error('成控文件台账未持久化');

  await page.locator('[data-view="intake"]').click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(root, 'qa-intake-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#menuButton').click();
  await page.locator('[data-view="intake"]').click();
  await page.waitForTimeout(350);
  if (!(await page.locator('#intake .weekly-command-board').isVisible())) throw new Error('移动端每日任务执行中心不可用');
  await page.screenshot({ path: path.join(root, 'qa-intake-mobile.png'), fullPage: true });
  if (errors.length) throw new Error(`浏览器控制台错误：${errors.join(' | ')}`);
  await browser.close();
  console.log('PASS: 昨日续做、风险警示、施工图文件夹、协调闭环和成控文件台账均已验证');
})().catch(error => { console.error(error); process.exit(1); });
