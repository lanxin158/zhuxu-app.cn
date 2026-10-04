// Isolated fixture-loader checks; never connects to the user's browser or database.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const vm=require('node:vm');
const {chromium}=require('playwright');
const rules=require('./schedule-rules');
const context=vm.createContext({ZhuxuScheduleRules:rules,Date,Math});
vm.runInContext(fs.readFileSync('schedule-ui.js','utf8'),context);
for(const date of ['2026-09-18','2026-09-28','2026-12-29','2028-02-27']){
  const sample=context.buildLinkedScheduleSamples(date,[],[],[],()=>0.5);
  assert.equal(sample.plans.filter(p=>p.level==='day').length,21);
  assert.equal(sample.tasks.length,21);
  rules.validatePlans([],sample.plans,[]);
  for(const m of sample.plans.filter(p=>p.level==='month')){
    assert.equal(rules.summary(m,sample.plans,[]).rate,0);
    if(m.goal.mode==='weight')assert.equal(sample.plans.filter(p=>p.parentId===m.id).reduce((s,p)=>s+p.goal.monthShare,0),100);
  }
  assert.equal(context.buildLinkedScheduleSamples(date,sample.plans,sample.tasks,[]).plans.length,0);
}
(async()=>{
  const files=new Set(['index.html','app.js','styles.css','server-bridge.js','meeting-rules.js','schedule-rules.js','schedule-recognition.js','schedule-recognition-ui.js','schedule-ui.js','vendor/jszip.min.js']);
  const server=http.createServer((req,res)=>{
    const file=req.url==='/'?'index.html':req.url.slice(1);
    if(!files.has(file)){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8'});res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForLoadState('networkidle');
    await page.locator('#loginForm [name="account"]').fill('chen.pm');await page.locator('#loginForm [name="password"]').fill('001001');await page.locator('#loginForm [name="remember"]').check();await page.locator('#loginForm [type="submit"]').click();await page.locator('body.authenticated').waitFor();
    await page.locator('[data-view="schedule"]').click();await page.locator('[data-plan-level="month"]').click();
    const chooser=page.waitForEvent('filechooser');await page.locator('[data-upload-period-plan]').click();
    await (await chooser).setFiles({name:'保留原计划.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZbsAAAAASUVORK5CYII=','base64')});
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('zhuxu-plans')||'[]').some(p=>p.attachments?.some(a=>a.name==='保留原计划.png')));
    const read=()=>page.evaluate(()=>({plans:JSON.parse(localStorage.getItem('zhuxu-plans')),tasks:JSON.parse(localStorage.getItem('zhuxu-tasks')||JSON.stringify(tasks)),execution:JSON.parse(localStorage.getItem('zhuxu-daily-execution')||'[]')}));
    const before=await read();
    await page.locator('summary').filter({hasText:'关联计划测试数据'}).click();
    // Fail the second write and verify the first write is rolled back, then retry.
    await page.evaluate(()=>{window.originalSampleSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='zhuxu-plans')throw new DOMException('测试配额失败','QuotaExceededError');return window.originalSampleSet.call(this,k,v);};});
    await page.locator('[data-load-linked-samples]').click();assert.match(await page.locator('[data-sample-status]').innerText(),/未能载入/);
    assert.deepEqual(await read(),before);
    await page.evaluate(()=>{Storage.prototype.setItem=window.originalSampleSet;});
    await page.locator('[data-load-linked-samples]').click();
    const after=await read();
    for(const p of before.plans)assert.deepEqual(after.plans.find(x=>x.id===p.id),p);
    for(const t of before.tasks)assert.deepEqual(after.tasks.find(x=>x.id===t.id),t);
    assert.deepEqual(after.execution,before.execution);
    const added=after.plans.filter(p=>p.testBatch==='linked-schedule-test-v1');
    assert.equal(added.filter(p=>p.level==='day').length,21);assert.equal(after.tasks.length-before.tasks.length,21);
    rules.validatePlans(before.plans,after.plans,after.execution);
    await page.evaluate(()=>loadLinkedScheduleSamples({currentTarget:{disabled:false,parentElement:document}}));
    assert.equal((await read()).plans.length,after.plans.length,'double click must not duplicate');
    await page.reload();await page.locator('body.authenticated').waitFor();
    const today=new Date().toISOString().slice(0,10);
    const day=added.find(p=>p.level==='day'&&p.start===today&&p.scheduleLink.amount&&p.dailyTarget===80);
    assert(day);
    await page.locator('[data-daily-meeting]').click();
    const row=page.locator('[data-meeting-today-row]').filter({hasText:day.title});
    await row.locator('[data-meeting-today-progress]').fill('100');await row.locator('[data-confirm-meeting-today]').click();
    assert(await row.locator('[data-meeting-today-progress]').isDisabled());
    const confirmed=await read(),record=confirmed.execution.find(r=>r.dayPlanId===day.id&&r.date===today);
    assert.equal(record.actualCompletion,100);assert.equal(record.plannedTarget,80);
    const month=confirmed.plans.find(p=>p.id===day.scheduleLink.monthId);
    assert.equal(rules.summary(month,confirmed.plans,confirmed.execution).actual,day.scheduleLink.amount);
    await page.locator('#dailyMeetingDialog [data-close-dialog]').first().click();await page.locator('[data-view="schedule"]').click();await page.locator('[data-plan-level="month"]').click();
    await page.setViewportSize({width:667,height:710});await page.waitForFunction(()=>document.querySelector('#sidebar').getBoundingClientRect().right<=0);
    await page.locator(`[data-goal-item="${month.id}"]`).scrollIntoViewIfNeeded();await page.screenshot({path:'qa-schedule-samples.png'});
    await page.evaluate(()=>window.ZhuxuServer.active=true);assert.equal(await page.evaluate(()=>renderLinkedSampleLoader()),'','shared projects must not expose offline fixture loader');
    assert.deepEqual(errors,[]);
    console.log('PASS samples: 21 linked daily tasks, month/year/leap boundaries, no duplicates, failed-write rollback, old data/files preserved, reload, actual100 on planned80 rolls up correct amount, mobile');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
