// Targeted isolated test: serves only public assets, never the live DB/upload directory.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const assets = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css'], '/server-bridge.js': ['server-bridge.js', 'text/javascript'], '/vendor/jszip.min.js': ['vendor/jszip.min.js', 'text/javascript'] };
const photo = name => ({ name, mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZbsAAAAASUVORK5CYII=', 'base64') });
assets['/meeting-rules.js'] = ['meeting-rules.js', 'text/javascript'];
assets['/schedule-rules.js'] = ['schedule-rules.js', 'text/javascript'];
assets['/schedule-ui.js'] = ['schedule-ui.js', 'text/javascript'];

(async () => {
  const server = http.createServer((req, res) => {
    const asset = assets[req.url];
    if (!asset) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': `${asset[1]}; charset=utf-8` });
    res.end(fs.readFileSync(path.join(__dirname, asset[0])));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForLoadState('networkidle');
    await page.locator('#loginForm input[name="account"]').fill('chen.pm');
    await page.locator('#loginForm input[name="password"]').fill('001001');
    await page.locator('#loginForm input[name="remember"]').check();
    await page.locator('#loginForm [type="submit"]').click();
    await page.locator('body.authenticated').waitFor();
    console.log('login ready');
    const stored = key => page.evaluate(k => JSON.parse(localStorage.getItem(k) || '[]'), key);
    const initial = await stored('zhuxu-resource-entries');
    await page.locator('[data-view="materials"]').click();
    await page.locator('#materials .subview-action').click();
    await page.locator('[data-add-resource-entry-row]').click();
    for (let i = 0; i < 2; i++) {
      const row = page.locator('[data-resource-entry-row]').nth(i);
      for (const [field, value] of Object.entries({ name: `闭环测试材料${i}`, brand: '测试厂家', spec: '规格 A', quantity: '2 t', location: '测试区', arrival: `2026-09-${16 + i}T08:30` })) await row.locator(`[data-resource-entry-${field}]`).fill(value);
    }
    await page.locator('#resourceEntryForm [type="submit"]').click();
    assert(await page.locator('#resourceEntryDialog').isVisible(), 'required receipt/photos blocked');
    for (let i = 0; i < 2; i++) {
      const row = page.locator('[data-resource-entry-row]').nth(i);
      await row.locator('[data-resource-entry-receipt]').setInputFiles(photo(`收货单${i}.png`));
      await row.locator('[data-resource-entry-photos]').setInputFiles(photo(`验收照片${i}.png`));
    }
    // More than eight attachments must not be silently dropped.
    await page.locator('[data-resource-entry-certificates]').first().setInputFiles(Array.from({ length: 9 }, (_, i) => photo(`已有资料${i}.png`)));
    // Simulated quota failure belongs to this disposable browser context only.
    const beforeFailure = await stored('zhuxu-resource-entries');
    await page.evaluate(() => {
      window.originalTestSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key === 'zhuxu-resource-entries') throw new DOMException('test quota', 'QuotaExceededError');
        return window.originalTestSetItem.call(this, key, value);
      };
    });
    await page.locator('#resourceEntryForm [type="submit"]').click();
    await page.waitForFunction(() => !document.querySelector('#resourceEntryForm [type="submit"]').disabled);
    assert(await page.locator('#resourceEntryDialog').isVisible());
    assert.deepEqual(await stored('zhuxu-resource-entries'), beforeFailure);
    assert.equal(await page.locator('[data-resource-entry-receipt]').first().evaluate(el => el.files.length), 1);
    await page.evaluate(() => { Storage.prototype.setItem = window.originalTestSetItem; });
    await page.locator('#resourceEntryForm [type="submit"]').click();
    await page.locator('#resourceEntryDialog').waitFor({ state: 'hidden' });
    let entries = await stored('zhuxu-resource-entries');
    const first = entries.find(e => e.name === '闭环测试材料0');
    assert.equal(first.attachments.length, 11);
    console.log('batch registered');
    assert(first.attachments.every(f => f.stored && f.storageKey));
    for (const previous of initial) assert.deepEqual(entries.find(e => e.id === previous.id)?.attachments, previous.attachments);
    assert.equal(await page.locator('[data-resource-date="2026-09-16"] [data-resource-entry-detail]').count(), 1);
    assert.equal(await page.locator('[data-resource-date="2026-09-17"] [data-resource-entry-detail]').count(), 1);
    await page.reload();
    await page.locator('body.authenticated').waitFor();
    await page.locator('[data-view="documents"]').click();
    await page.locator(`.material-review-queue [data-resource-entry-detail="${first.id}"]`).click();
    assert((await page.locator('#resourceDetailBody').innerText()).includes('收货单'));
    await page.locator('[data-open-material-document-review]').first().click();
    const review = page.locator('#materialDocumentReviewForm');
    assert.equal(await review.locator('[name="status"]').inputValue(), '');
    await review.locator('[name="status"]').selectOption('missing');
    await review.locator('[name="missingItems"]').fill('厂家质保书');
    await review.locator('[type="submit"]').click();
    await page.locator('#materialDocumentReviewDialog').waitFor({ state: 'hidden' });
    const reminders = (await stored('zhuxu-followups')).filter(f => f.materialEntryId === first.id && f.status !== 'done');
    assert(reminders.length >= 2 && reminders.every(f => f.recipient && f.notificationStatus === 'unread'));
    await page.locator('[data-open-material-document-review]').first().click();
    await review.locator('[name="status"]').selectOption('complete');
    await review.locator('[type="submit"]').click();
    assert(await page.locator('#materialDocumentReviewDialog').isVisible(), 'cannot close missing documents without supplement');
    assert.equal((await stored('zhuxu-resource-entries')).find(e => e.id === first.id).materialDocumentReview.status, 'missing');
    await review.locator('[name="status"]').selectOption('missing');
    await review.locator('[name="files"]').setInputFiles(photo('补充质保书.png'));
    await review.locator('[type="submit"]').click();
    await page.locator('#materialDocumentReviewDialog').waitFor({ state: 'hidden' });
    await page.locator('[data-open-material-document-review]').first().click();
    await review.locator('[name="status"]').selectOption('complete');
    await review.locator('[type="submit"]').click();
    await page.locator('#materialDocumentReviewDialog').waitFor({ state: 'hidden' });
    entries = await stored('zhuxu-resource-entries');
    const completed = entries.find(e => e.id === first.id);
    assert.equal(completed.materialDocumentReview.status, 'complete');
    console.log('review closed');
    assert.equal(completed.attachments.length, 12);
    assert.deepEqual(completed.attachments.slice(0, 11), first.attachments);
    assert((await stored('zhuxu-followups')).filter(f => f.materialEntryId === first.id && f.materialDocumentReview).every(f => f.status === 'done'));
    assert.equal(await page.locator(`.material-review-queue [data-resource-entry-detail="${first.id}"]`).count(), 0);
    await page.locator('#resourceDetailDialog [data-close-dialog]').first().click();
    await page.reload();
    await page.locator('body.authenticated').waitFor();
    await page.locator('[data-view="materials"]').click();
    await page.locator(`[data-resource-entry-detail="${first.id}"]`).click();
    const proof = page.locator('#resourceDetailBody .resource-attachment-button').filter({ hasText: '收货单0.png' });
    assert((await proof.innerText()).includes('收货单 ·'));
    await proof.click();
    await page.locator('#attachmentPreviewDialog img').waitFor();
    assert(await page.locator('#attachmentPreviewDialog img').evaluate(img => img.complete && img.naturalWidth > 0));
    await page.locator('#attachmentPreviewDialog [data-close-dialog]').click();
    await page.locator('#resourceDetailDialog [data-close-dialog]').first().click();
    await page.setViewportSize({ width: 667, height: 710 });
    await page.waitForFunction(() => document.querySelector('#sidebar').getBoundingClientRect().right <= 0);
    await page.screenshot({ path: path.join(__dirname, 'qa-material-closure-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('[data-view="intake"]').click();
    await page.getByRole('button', { name: '每日例会', exact: false }).first().click();
    const progress = page.locator('[data-meeting-today-progress]').first();
    const confirm = page.locator('[data-confirm-meeting-today]').first();
    await progress.fill('100'); await confirm.click();
    assert.equal(await confirm.innerText(), '已确认锁定');
    const after100 = await stored('zhuxu-daily-execution');
    const confirmed = after100.find(r => r.meetingConfirmedAt && r.progress === 100);
    assert(confirmed, 'confirmed execution exists');
    assert(await progress.isDisabled()); assert(await confirm.isDisabled());
    await page.setViewportSize({ width: 667, height: 710 });
    await confirm.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(__dirname, 'qa-meeting-confirm-mobile.png') });
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.deepEqual(await stored('zhuxu-daily-execution'), after100);
    await page.locator('#dailyMeetingForm [type="submit"]').click();
    await page.locator('#dailyMeetingDialog').waitFor({ state: 'hidden' });
    assert.equal((await stored('zhuxu-daily-execution')).find(r => r.taskId === confirmed.taskId && r.date === confirmed.date).progress, 100, 'tomorrow save cannot change confirmed actual completion');
    assert.deepEqual(errors, []);
    console.log('PASS: batch daily grouping, required proofs, 9-file retention, reload/preview, missing/supplement/closure, notifications, locked meeting confirmation, tomorrow isolation');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
