const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium}=require('playwright');
const recognition=require('./schedule-recognition');
const rules=require('./schedule-rules');
const {recognizeImage}=require('./schedule-ocr-server');
async function main(){
  const tabular=recognition.fromText('编号,工作名称,持续时间,开始日期,结束日期\n9,测试施工,8,2026-09-25,2026-10-02',2026,9);
  assert.equal(tabular.tasks[0].title,'测试施工');
  const split=recognition.makePlans(tabular,{fileKey:'dates.csv'},[],rules);
  assert.deepEqual(split.filter(p=>p.level==='month').map(p=>[p.start,p.end]),[['2026-09-25','2026-09-30'],['2026-10-01','2026-10-02']]);
  assert.throws(()=>recognition.makePlans({tasks:[{code:'1',title:'无效日期施工',start:'2026-02-30',end:'2026-03-02'}]},{fileKey:'bad'},[],rules),/日期无效/);
  const notes=split.map(p=>({...p,goal:{...p.goal,text:'补充说明'}}));rules.validatePlans(split,notes,[]);
  assert.throws(()=>rules.validatePlans(split,split.map(p=>p.level==='month'?{...p,goal:{...p.goal,target:2}}:p),[]),/不能改动/);
  const path=process.env.ZHUXU_TEST_CHART||'E:/新会话解决问题/月进度计划横道图.png';
  const bytes=fs.readFileSync(path);
  const ocrJob=recognizeImage(bytes);
  const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/sample'?'image/png':'text/javascript');res.end(req.url==='/sample'?bytes:fs.readFileSync('schedule-recognition.js'));});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    const page=await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/sample`);
    await page.addScriptTag({url:`http://127.0.0.1:${server.address().port}/recognition`});
    const bars=await page.evaluate(async()=>{const image=document.querySelector('img');await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return ZhuxuScheduleRecognition.barsFromPixels(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);});
    const ocr=await ocrJob;
    const result=recognition.readMonthChart(ocr,bars,2026);
    console.log(JSON.stringify({bars:bars.length,counts:Object.fromEntries(Array.from({length:12},(_,i)=>[i+1,result.tasks.filter(t=>t.month===i+1).length])),warnings:result.warnings}));
    assert.equal(new Set(result.tasks.map(t=>t.month)).size,12);
    assert.equal(result.tasks.length,88);
    assert.equal(result.tasks.filter(t=>t.month===9).length,8);
    assert.deepEqual(result.tasks.filter(t=>t.month===1).map(t=>[t.start,t.end]),[['2026-01-01','2026-01-12'],['2026-01-08','2026-01-16'],['2026-01-10','2026-01-31'],['2026-01-18','2026-01-31']]);
    assert.equal(result.tasks.find(t=>t.month===4&&t.code==='7').end,'2026-04-01','one-day bars must be retained');
    assert.equal(result.tasks.find(t=>t.month===10&&t.code==='18').end,'2026-10-02','two-day bars must be retained');
    for(const code of ['19','25'])assert.equal(result.tasks.find(t=>t.month===9&&t.code===code).start,'2026-09-25');
    const source={planId:1,fileKey:'original.png',fingerprint:'sample-content'};
    const original={id:1,level:'month',isScheduleFile:true,start:'2026-01-01',end:'2026-01-31',attachments:[{name:'original.png',storageKey:'original.png'}]};
    const added=recognition.makePlans(result,source,[original],rules);
    assert(added.some(p=>p.level==='week'));
    assert.equal(recognition.makePlans(result,source,[original,...added],rules).length,0);
    assert.deepEqual(original.attachments,[{name:'original.png',storageKey:'original.png'}]);
    for(const p of added.filter(p=>p.level==='week')){const parent=added.find(m=>m.id===p.parentId);assert(parent);assert(p.start>=parent.start&&p.end<=parent.end);assert.equal(rules.summary(p,added,[]).rate,null);}
    console.log('PASS native image OCR, all 12 month panels, September partial weeks, original file preserved, idempotency, valid month/week links, no fabricated actual percentages');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
