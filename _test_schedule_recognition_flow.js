// Focused end-to-end test against a disposable project and separate browser profile.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const rules=require('./schedule-rules');
(async()=>{
  const sample=process.env.ZHUXU_TEST_CHART||'E:/新会话解决问题/月进度计划横道图.png';
  const image=fs.readFileSync(sample),root=fs.mkdtempSync(path.join(os.tmpdir(),'zhuxu-recognition-test-'));
  const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
  const baseURL=`http://127.0.0.1:${port}`;
  const child=spawn(process.execPath,['server.js'],{cwd:__dirname,windowsHide:true,env:{...process.env,ZHUXU_HOST:'127.0.0.1',ZHUXU_PORT:String(port),ZHUXU_DB_PATH:path.join(root,'test.sqlite'),ZHUXU_UPLOAD_DIR:path.join(root,'uploads')},stdio:['ignore','pipe','pipe']});
  let browser,logs='';child.stderr.on('data',d=>logs+=d);
  try{
    for(let i=0;i<80;i++){try{if((await fetch(baseURL+'/api/bootstrap')).ok)break;}catch{}if(child.exitCode!==null)throw new Error(logs);await new Promise(r=>setTimeout(r,100));}
    browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    const context=await browser.newContext({baseURL,viewport:{width:1440,height:1000}});
    let response=await context.request.post('/api/projects/init',{data:{projectName:'自动月周识别隔离测试',projectCode:'ocr-test',adminName:'测试经理',adminAccount:'ocr.pm',adminPhone:'13900000201',adminPassword:'RecognitionTest2026'}});assert(response.ok(),await response.text());
    const upload=await context.request.post('/api/attachments',{multipart:{file:{name:'原有月计划.png',mimeType:'image/png',buffer:image}}});assert(upload.ok(),await upload.text());const oldFile=await upload.json();
    const original={id:51,level:'month',isScheduleFile:true,title:'原有9月计划',start:'2026-09-01',end:'2026-09-30',attachments:[oldFile]};
    response=await context.request.put('/api/state/zhuxu-plans',{data:{value:[original]}});assert(response.ok(),await response.text());
    const page=await context.newPage();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/');await page.locator('body.authenticated').waitFor();
    const table=await page.evaluate(async()=>{
      const zip=new JSZip(),serial=date=>Math.round((Date.parse(date+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000);
      zip.file('xl/styles.xml','<styleSheet><cellXfs count="1"><xf numFmtId="14"/></cellXfs></styleSheet>');
      zip.file('xl/worksheets/sheet1.xml',`<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>工作名称</t></is></c><c r="B1" t="inlineStr"><is><t>开始日期</t></is></c><c r="C1" t="inlineStr"><is><t>结束日期</t></is></c></row><row><c r="A2" t="inlineStr"><is><t>测试二次结构</t></is></c><c r="B2" s="0"><v>${serial('2026-09-25')}</v></c><c r="C2" s="0"><v>${serial('2026-10-02')}</v></c></row></sheetData></worksheet>`);
      const file=new File([await zip.generateAsync({type:'uint8array'})],'日期表.xlsx');return ZhuxuScheduleRecognition.fromText(await extractScheduleTable(file),2026,9);
    });
    assert.equal(table.tasks[0].start,'2026-09-25');assert.equal(table.tasks[0].end,'2026-10-02');
    await page.locator('[data-view="schedule"]').click();await page.locator('[data-plan-level="month"]').click();await page.locator('[data-schedule-month-select="9"]').click();
    const chooser=page.waitForEvent('filechooser');await page.locator('[data-upload-period-plan]').click();await(await chooser).setFiles({name:'全年月计划.png',mimeType:'image/png',buffer:image});
    await page.locator('[data-generate-recognized]').waitFor();
    assert.equal(await page.locator('[data-recognition-row]').count(),88);
    assert.equal(await page.evaluate(()=>plans.filter(p=>p.goal?.mode==='activity').length),0,'preview must not persist goals');
    // Correct a genuine OCR error once, then ensure it survives duplicate recognition.
    const sept=page.locator('[data-recognition-row]').filter({hasText:'2026-09 · 原编号 15'});await sept.locator('[data-recognition-title]').fill('主体结构11F~20F施工');
    await page.locator('[data-generate-recognized]').click();await page.waitForFunction(()=>document.querySelector('[data-recognition-save-status]').textContent.includes('已生成'));
    let state=(await(await context.request.get('/api/bootstrap')).json()).state;
    let generated=state['zhuxu-plans'];assert.equal(generated.filter(p=>p.level==='month'&&p.goal).length,88);
    const filePlan=generated.find(p=>p.id===51);assert.deepEqual(filePlan.fileHistory,[oldFile]);assert.notEqual(filePlan.attachments[0].storageKey,oldFile.storageKey);
    const oldDownload=await context.request.get(`/api/attachments/${oldFile.storageKey}`);assert(oldDownload.ok());assert.deepEqual(await oldDownload.body(),image);
    const newDownload=await context.request.get(`/api/attachments/${filePlan.attachments[0].storageKey}`);assert.deepEqual(await newDownload.body(),image);
    rules.validatePlans([],generated,[]);
    const m=generated.find(p=>p.level==='month'&&p.workCode==='15'&&p.start==='2026-09-01');assert.equal(m.title,'主体结构11F~20F施工');
    const partial=generated.filter(p=>p.level==='week'&&p.workCode==='25'&&p.start.startsWith('2026-09'));assert.deepEqual(partial.map(p=>[p.start,p.end,p.plannedWorkDays]),[['2026-09-25','2026-09-27',3],['2026-09-28','2026-09-30',3]]);
    await page.locator('[data-close-recognition]').click();await page.locator('[data-plan-level="week"]').click();
    assert.equal(await page.locator('.week-file-group').count(),5);assert.equal(await page.locator('.week-file-group em').filter({hasText:'已自动生成'}).count(),5);
    if(await page.locator('.week-file-group').last().getAttribute('open')===null)await page.locator('.week-file-group summary').last().click();assert(await page.locator('.week-file-group').last().locator('.auto-week-gantt').isVisible());
    assert.equal(await page.locator('.week-file-group').last().locator('.auto-week-bar').count(),8,'September chart must not include October activities');
    await page.setViewportSize({width:667,height:710});await page.evaluate(()=>closeSidebar());await page.locator('.week-file-group').last().locator('.auto-week-gantt').scrollIntoViewIfNeeded();await page.screenshot({path:'qa-schedule-recognition.png'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'no whole-page horizontal overflow');
    await page.setViewportSize({width:1440,height:1000});
    // Repeat source recognition; existing corrected title and all originals must survive.
    await page.locator('[data-plan-level="month"]').click();await page.locator('[data-recognize-all-months]').click();await page.locator('[data-generate-recognized]').waitFor();await page.locator('[data-generate-recognized]').click();await page.waitForFunction(()=>document.querySelector('[data-recognition-save-status]').textContent.includes('未重复生成'));
    state=(await(await context.request.get('/api/bootstrap')).json()).state;assert.deepEqual(state['zhuxu-plans'],generated);
    await page.locator('[data-close-recognition]').click();
    // Daily meeting may associate a day with an auto-week without invented engineering amounts.
    const w=generated.find(p=>p.level==='week'&&p.parentId===m.id&&p.start<='2026-09-30'&&p.end>='2026-09-30');
    const day={id:80,level:'day',title:'今日结构施工',dailyTarget:80,start:'2026-09-30',end:'2026-09-30',parentId:w.id,taskId:81,team:'结构班组',owners:['测试经理 · 项目经理'],scheduleLink:{weekId:w.id,monthId:m.id}};
    response=await context.request.put('/api/state/zhuxu-plans',{data:{value:generated.concat(day)}});assert(response.ok(),await response.text());
    response=await context.request.put('/api/state/zhuxu-tasks',{data:{value:[{id:81,dayPlanId:80,title:day.title,owner:'测试经理 · 项目经理',status:'todo',priority:'normal',time:'17:00'}]}});assert(response.ok(),await response.text());
    response=await context.request.post('/api/daily-execution/confirm',{data:{taskId:81,dayPlanId:80,date:day.start,actualCompletion:100}});assert(response.ok(),await response.text());
    const confirmed=await response.json();assert.equal(confirmed.record.actualCompletion,100);assert.equal(confirmed.record.plannedTarget,80);
    assert.equal(rules.summary(m,generated,[confirmed.record]).rate,null);
    response=await context.request.post('/api/daily-execution/confirm',{data:{taskId:81,dayPlanId:80,date:day.start,actualCompletion:50}});assert.equal(response.status(),409,'meeting confirmation must remain immutable');
    const anonymous=await browser.newContext({baseURL});response=await anonymous.request.post('/api/schedules/generate-weeks',{data:{}});assert.equal(response.status(),401);
    response=await context.request.post('/api/schedules/generate-weeks',{data:{source:{planId:99999,fileKey:'foreign'},result:{tasks:[]}}});assert.equal(response.status(),400);
    assert.deepEqual(errors,[]);
    console.log(`PASS actual server/browser OCR: 88 monthly tasks, ${generated.filter(p=>p.level==='week').length} natural-week tasks, review-before-save, short/partial weeks, original/history bytes preserved, corrected title/repeat idempotency, mobile, linked daily80/actual100, confirmation lock, auth/source isolation`);
  }finally{await browser?.close();child.kill();await new Promise(r=>child.exitCode!==null?r():child.once('exit',r));if(path.dirname(root)===os.tmpdir()&&path.basename(root).startsWith('zhuxu-recognition-test-'))fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
