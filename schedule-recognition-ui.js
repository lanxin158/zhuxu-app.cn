// Uploaded originals are read only. Recognition drafts do not affect plans until confirmed.
let scheduleRecognitionBusy=false;
function recognitionFilePlans(){return plans.filter(p=>p.level==='month'&&p.isScheduleFile&&p.start?.startsWith(String(activeScheduleYear))&&p.attachments?.length);}
function renderRecognitionToolbar(){
  if(activePlanLevel!=='month')return '';
  return `<section class="schedule-recognition-toolbar"><div><strong>从原文件自动整理月、周计划</strong><small>识别施工名称、起止日期及原文月节点；按周一至周日生成周横道图，跨月分别归属。</small></div><button type="button" class="secondary-button" data-recognize-all-months ${recognitionFilePlans().length?'':'disabled'}>识别已上传月计划</button><p>支持按月分区、红蓝横条及日刻度的清晰 PNG/JPG，或带完整起止日期的 CSV/XLSX。图片识别需使用服务器网址；不会删除原文件。</p></section>`;
}
function renderRecognitionFileAction(plan){return plan?.level==='month'&&plan.attachments?.length?`<button type="button" data-recognize-month="${plan.id}">识别月目标并生成周计划</button>`:'';}
function bindScheduleRecognition(container){
  $('[data-recognize-all-months]',container)?.addEventListener('click',()=>recognizeScheduleFiles(recognitionFilePlans()));
  $$('[data-recognize-month]',container).forEach(b=>b.onclick=()=>recognizeScheduleFiles(plans.filter(p=>String(p.id)===b.dataset.recognizeMonth)));
}
async function scheduleOriginalFile(attachment){
  const record=attachment.storageKey?await getResourceAttachment(attachment.storageKey):null;
  const blob=record?.blob||(attachment.data?await(await fetch(attachment.data)).blob():null);
  if(!blob)throw new Error(`${attachment.name}未保存原件，请补充原文件后识别`);
  return new File([blob],attachment.name,{type:attachment.type||blob.type});
}
async function extractScheduleTable(file){
  if(!/\.xlsx$/i.test(file.name))return file.text();
  const zip=await JSZip.loadAsync(await file.arrayBuffer()),xml=async name=>{const entry=zip.file(name);return entry?new DOMParser().parseFromString(await entry.async('text'),'application/xml'):null;};
  const strings=Array.from((await xml('xl/sharedStrings.xml'))?.getElementsByTagName('si')||[],s=>s.textContent||'');
  const styles=await xml('xl/styles.xml'),formats=new Map(Array.from(styles?.getElementsByTagName('numFmt')||[],f=>[Number(f.getAttribute('numFmtId')),f.getAttribute('formatCode')||'']));
  const dateStyles=Array.from(styles?.getElementsByTagName('cellXfs')[0]?.children||[],s=>{const id=Number(s.getAttribute('numFmtId'));return id>=14&&id<=22||id>=27&&id<=36||id>=50&&id<=58||/[ymd]/i.test((formats.get(id)||'').replace(/"[^"]*"|\[[^\]]*\]|\\./g,''));});
  const workbook=await xml('xl/workbook.xml'),date1904=['1','true'].includes(workbook?.getElementsByTagName('workbookPr')[0]?.getAttribute('date1904'));
  const base=Date.UTC(date1904?1904:1899,date1904?0:11,date1904?1:30),output=[];
  const column=ref=>Array.from(ref?.match(/^[A-Z]+/i)?.[0]||'A').reduce((n,c)=>n*26+c.toUpperCase().charCodeAt(0)-64,0)-1;
  for(const name of Object.keys(zip.files).filter(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort()){
    const doc=await xml(name);let header=[];
    for(const row of Array.from(doc?.getElementsByTagName('row')||[])){
      const values=[];
      for(const cell of Array.from(row.getElementsByTagName('c'))){
        const index=column(cell.getAttribute('r')),type=cell.getAttribute('t');let value=cell.getElementsByTagName('v')[0]?.textContent||cell.getElementsByTagName('is')[0]?.textContent||'';
        if(type==='s')value=strings[Number(value)]||'';
        if(type==='d')value=value.slice(0,10);
        if((type==null||type==='n')&&/^\d+(\.\d+)?$/.test(value)&&(dateStyles[Number(cell.getAttribute('s'))]||/开始|结束|完成日期|开工日期/.test(header[index]||''))&&Number(value)>25000&&Number(value)<80000)value=new Date(base+Math.floor(Number(value))*86400000).toISOString().slice(0,10);
        values[index]=value;
      }
      if(values.some(v=>/开始|结束|完成日期|开工日期/.test(v)))header=values;
      output.push(values.join(','));
    }
  }
  return output.join('\n');
}
async function recognizeOneSchedule(sourcePlan,file){
  const attachment=sourcePlan.attachments[0],year=Number(sourcePlan.start.slice(0,4));
  const bytes=await file.arrayBuffer();
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  const source={planId:sourcePlan.id,fileKey:attachment.storageKey||attachment.name,fingerprint:hash};
  if(/^image\/(png|jpeg)$/.test(file.type)||/\.(png|jpe?g)$/i.test(file.name)){
    if(!window.ZhuxuServer?.active)throw new Error('图片自动识别需要从筑序服务器网址登录使用，file://离线页面没有服务器OCR；原文件已保留');
    const bitmap=await createImageBitmap(file);
    try{
      if(bitmap.width*bitmap.height>30000000)throw new Error('图片像素超过3000万，请使用分月原图');
      const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);
      const bars=ZhuxuScheduleRecognition.barsFromPixels(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
      const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});
      const result=await window.ZhuxuServer.request('/api/schedules/recognize',{method:'POST',body:JSON.stringify({image:base64,width:bitmap.width,height:bitmap.height,bars,year})});
      return {source,result,name:file.name};
    }finally{bitmap.close();}
  }
  if(!/\.(csv|xlsx)$/i.test(file.name))throw new Error('此版暂不识别PDF/Word/MPP横道图，请上传清晰PNG/JPG或带完整起止日期的CSV/XLSX，原文件仍可查看');
  return {source,result:ZhuxuScheduleRecognition.fromText(await extractScheduleTable(file),year,Number(sourcePlan.start.slice(5,7))),name:file.name};
}
async function recognizeScheduleFiles(filePlans,directFile){
  if(scheduleRecognitionBusy)return;
  scheduleRecognitionBusy=true;
  let dialog=$('#scheduleRecognitionDialog');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='scheduleRecognitionDialog';dialog.className='wide-dialog';document.body.appendChild(dialog);}
  dialog.innerHTML='<div class="dialog-heading"><h2>识别月计划</h2><button type="button" class="icon-button" data-close-recognition aria-label="关闭">×</button></div><p data-recognition-status role="status">正在读取原文件…</p><div data-recognition-results></div>';
  $('[data-close-recognition]',dialog).onclick=()=>dialog.close();dialog.showModal();
  const groups=[],failures=[],seen=new Set();
  try{
    for(const sourcePlan of filePlans){
      if(!dialog.open)break;
      $('[data-recognition-status]',dialog).textContent=`正在识别 ${groups.length+failures.length+1}/${filePlans.length}：${sourcePlan.attachments[0].name}，原文件保持不变。`;
      try{const group=await recognizeOneSchedule(sourcePlan,directFile||await scheduleOriginalFile(sourcePlan.attachments[0]));
        if(!seen.has(group.source.fingerprint)){groups.push(group);seen.add(group.source.fingerprint);}
      }catch(error){failures.push(`${sourcePlan.attachments[0].name}：${error.message}`);}
    }
    if(!dialog.open)return;
    const warnings=groups.flatMap(g=>g.result.warnings||[]).concat(failures);
    $('[data-recognition-status]',dialog).textContent=groups.length?`已识别 ${groups.reduce((n,g)=>n+g.result.tasks.length,0)} 条施工安排。请核对错字、日期及月节点，再一次确认生成；未选中的条目不会写入。`:'本次未生成计划，原文件保持不变。';
    const body=$('[data-recognition-results]',dialog);
    body.innerHTML=`${warnings.length?`<div class="recognition-warnings" role="alert">${warnings.map(w=>`<p>${escapeHtml(w)}</p>`).join('')}</div>`:''}${groups.map((g,gi)=>`<section><h3>${escapeHtml(g.name)}</h3><small>${escapeHtml(g.result.engine)} · 横条只代表施工安排，不能推算实际完成率或未标明的工程量。</small>${g.result.tasks.map((t,ti)=>`<article class="recognition-result" data-recognition-row="${gi}:${ti}"><label class="goal-checkbox"><input type="checkbox" checked data-recognition-selected> ${t.start.slice(0,7)} · 原编号 ${escapeHtml(t.code)} · ${t.critical===true?'关键线路':t.critical===false?'非关键线路':'线路待核实'}</label><label>施工名称<input data-recognition-title value="${escapeHtml(t.title)}"></label><div class="form-grid"><label>计划开始<input type="date" data-recognition-start value="${t.start}"></label><label>计划结束<input type="date" data-recognition-end value="${t.end}"></label></div><label>原文月节点 / 要求<textarea data-recognition-note rows="2">${escapeHtml(t.monthRequirement||'')}</textarea></label></article>`).join('')}</section>`).join('')}${groups.length?'<div class="dialog-actions"><button type="button" class="primary-button" data-generate-recognized>确认生成月目标及周计划</button></div>':''}<p data-recognition-save-status role="status"></p>`;
    $('[data-generate-recognized]',dialog)?.addEventListener('click',async event=>{
      const button=event.currentTarget;if(button.disabled)return;button.disabled=true;
      const status=$('[data-recognition-save-status]',dialog);
      try{
        const reviewed=groups.map(g=>({...g,result:{...g.result,tasks:[]}}));
        $$('[data-recognition-row]',dialog).forEach(row=>{
          if(!$('[data-recognition-selected]',row).checked)return;
          const [gi,ti]=row.dataset.recognitionRow.split(':').map(Number),t=groups[gi].result.tasks[ti];
          reviewed[gi].result.tasks.push({...t,title:$('[data-recognition-title]',row).value.trim(),start:$('[data-recognition-start]',row).value,end:$('[data-recognition-end]',row).value,monthRequirement:$('[data-recognition-note]',row).value.trim()});
        });
        // Validate all reviewed groups before committing any of them.
        let prospective=plans;
        for(const g of reviewed)prospective=prospective.concat(ZhuxuScheduleRecognition.makePlans(g.result,g.source,prospective,ZhuxuScheduleRules));
        ZhuxuScheduleRules.validatePlans(plans,prospective,dailyExecution);
        let added=0;
        for(const g of reviewed){
          if(!g.result.tasks.length)continue;
          if(window.ZhuxuServer?.active){const response=await window.ZhuxuServer.request('/api/schedules/generate-weeks',{method:'POST',body:JSON.stringify({source:g.source,result:g.result})});plans=response.plans;added+=response.added;}
          else{const additions=ZhuxuScheduleRecognition.makePlans(g.result,g.source,plans,ZhuxuScheduleRules);const next=plans.concat(additions);localStorage.setItem('zhuxu-plans',JSON.stringify(next));plans=next;added+=additions.length;}
          status.textContent=`已保存 ${added} 条月/周计划。`;
        }
        if(window.ZhuxuServer?.active)localStorage.setItem('zhuxu-plans',JSON.stringify(plans));
        renderSubview('schedule');
        status.textContent=added?`已生成 ${added} 条月/周计划，可关闭后到月计划、周计划查看；日工作仍在每日例会中安排。`:'同一原文件的目标已存在，未重复生成。';
        showToast(added?'已生成月目标及自然周计划，原文件未改变':'没有重复添加计划');
      }catch(error){status.textContent=`${status.textContent} 本次保存未完成：${error.message}。已保存项保留，可重试，原文件未改变。`;button.disabled=false;}
    });
  }finally{scheduleRecognitionBusy=false;}
}
function renderRecognizedGoal(p,summary){
  return `<article class="schedule-goal-item" data-goal-item="${p.id}"><div><strong>${escapeHtml(p.title)}</strong><small>原编号 ${escapeHtml(p.workCode||'')} · ${p.start}—${p.end}${p.plannedWorkDays?` · 本周安排 ${p.plannedWorkDays} 天`:''}</small><p>${escapeHtml(p.goal.text||'')}</p><small>来自上传月计划 · 仅施工安排，未提供工程量/验收节点，不生成虚构累计百分比。已确认 ${summary.confirmed} 项关联日工作。</small></div><div class="goal-actions"><button type="button" class="secondary-button" data-edit-goal="${p.id}">查看 / 编辑说明</button></div></article>`;
}
function openRecognizedGoal(seed){
  let dialog=$('#scheduleGoalDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='scheduleGoalDialog';dialog.className='wide-dialog';document.body.appendChild(dialog);}
  dialog.innerHTML=`<form><div class="dialog-heading"><h2>原计划识别施工安排</h2><button type="button" class="icon-button" data-close-goal>×</button></div><p>${seed.start}—${seed.end} · 原文件、月周关联和历史记录保持不变。</p><label>名称<input name="title" required value="${escapeHtml(seed.title)}"></label><label>原文要求 / 说明<textarea name="text" rows="4">${escapeHtml(seed.goal.text||'')}</textarea></label><p>没有明确工程量或统一验收节点时，不用作业天数计算实际完成率。每日实际完成情况由每日例会确认。</p><p role="alert" data-error></p><div class="dialog-actions"><button type="submit" class="primary-button">保存说明</button></div></form>`;
  $('[data-close-goal]',dialog).onclick=()=>dialog.close();
  $('form',dialog).onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,button=$('[type=submit]',form);button.disabled=true;try{const next=plans.map(p=>p.id===seed.id?{...p,title:form.elements.title.value.trim(),goal:{...p.goal,text:form.elements.text.value.trim()}}:p);ZhuxuScheduleRules.validatePlans(plans,next,dailyExecution);if(window.ZhuxuServer?.active)await window.ZhuxuServer.saveState('zhuxu-plans',next);localStorage.setItem('zhuxu-plans',JSON.stringify(next));plans=next;dialog.close();renderSubview('schedule');}catch(error){$('[data-error]',dialog).textContent=error.message;}finally{button.disabled=false;}};dialog.showModal();
}
function renderAutoWeekChart(start,end){
  const monthKey=`${activeScheduleYear}-${String(activeScheduleMonth).padStart(2,'0')}`;
  const monthEnd=new Date(Date.UTC(activeScheduleYear,activeScheduleMonth,0)).toISOString().slice(0,10);
  start=start<monthKey+'-01'?monthKey+'-01':start;end=end>monthEnd?monthEnd:end;
  const rows=plans.filter(p=>p.level==='week'&&p.source==='月计划自动分周'&&p.start<=end&&p.end>=start&&plans.some(m=>m.id===p.parentId&&m.start.startsWith(monthKey)));
  if(!rows.length)return '';
  const first=new Date(start+'T12:00:00Z'),count=Math.round((new Date(end+'T12:00:00Z')-first)/86400000)+1;
  const days=Array.from({length:count},(_,i)=>{const d=new Date(first);d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(5,10);});
  return `<section class="auto-week-board"><p>自动生成周横道图 · 红色关键线路，蓝色非关键线路；横条表示计划作业日期，非实际完成率。</p><div class="auto-week-scroll"><div class="auto-week-gantt" style="--days:${count}"><div class="auto-week-row"><strong>施工安排</strong><div class="auto-week-days">${days.map(d=>`<span>${d}</span>`).join('')}</div></div>${rows.map(p=>{const offset=Math.max(0,Math.round((new Date(p.start+'T12:00:00Z')-first)/86400000)),length=Math.round((new Date(p.end+'T12:00:00Z')-new Date(p.start+'T12:00:00Z'))/86400000)+1;return `<div class="auto-week-row"><div><strong>${escapeHtml(p.title)}</strong><small>${p.start.slice(5)}—${p.end.slice(5)} · ${p.plannedWorkDays}天</small></div><div class="auto-week-days"><span class="auto-week-bar ${p.critical?'critical':''}" style="grid-column:${offset+1}/span ${length}">${p.plannedWorkDays}天</span></div></div>`;}).join('')}</div></div></section>`;
}
