// Goal lists supplement uploaded schedules; files remain untouched.
function renderScheduleGoals(level, start, end) {
  const items = plans.filter(p => ZhuxuScheduleRules.goal(p) && p.level === level && p.start <= end && p.end >= start);
  return `<section class="schedule-goals"><div class="daily-section-heading"><div><strong>${level === 'month' ? '月目标清单' : '周目标清单'}</strong><small>原文件照常展示；按目标编号关联，实际完成仅来自已锁定例会记录。</small></div><button type="button" class="secondary-button" data-add-goal="${level}" data-start="${start}" data-end="${end}">＋ ${level === 'month' ? '月目标' : '周目标'}</button></div>${items.map(p => {
    const s = ZhuxuScheduleRules.summary(p,plans,dailyExecution);
    if(p.goal.mode==='activity')return renderRecognizedGoal(p,s);
    const parent = plans.find(x=>String(x.id) === String(p.parentId));
    return `<article class="schedule-goal-item" data-goal-item="${p.id}"><div><strong>${escapeHtml(p.title)}</strong><small>${escapeHtml(p.goal.building)} · ${escapeHtml(p.goal.stage)} · ${p.start}—${p.end}${parent ? ` · 所属月目标：${escapeHtml(parent.title)}` : ''}</small><p>起点 ${p.goal.baseline}${escapeHtml(p.goal.unit)} → 目标 ${p.goal.target}${escapeHtml(p.goal.unit)}${p.goal.node ? ` · ${escapeHtml(p.goal.node)}` : ''}</p><b>实际${p.goal.mode === 'milestone' ? '完成至' : '累计'} ${s.actual}${escapeHtml(p.goal.unit)} · 完成率 ${s.rate}%</b><small>${p.goal.mode === 'milestone' ? '仅完整达成统一节点且连续楼层已确认才推进，不把钢筋绑扎当作浇筑完成。' : '按已确认的工程量/贡献份额汇总，不简单平均每日百分比。'}</small></div><div class="goal-actions">${level === 'month' ? `<button type="button" class="secondary-button" data-arrange-week="${p.id}">安排周目标</button>` : ''}<button type="button" class="secondary-button" data-edit-goal="${p.id}">查看 / 编辑</button></div></article>`;
  }).join('') || '<p class="resource-empty">尚无结构化目标，请根据已批准计划登记目标清单；仅上传文件不会自动识别归属。</p>'}</section>`;
}

function bindScheduleGoals(container) {
  bindScheduleRecognition(container);
  $('[data-load-linked-samples]',container)?.addEventListener('click',loadLinkedScheduleSamples);
  $$('[data-add-goal]',container).forEach(button=>button.addEventListener('click',()=>openScheduleGoal({ level:button.dataset.addGoal,start:button.dataset.start,end:button.dataset.end })));
  $$('[data-edit-goal]',container).forEach(button=>button.addEventListener('click',()=>openScheduleGoal(plans.find(p=>String(p.id)===button.dataset.editGoal))));
  $$('[data-arrange-week]',container).forEach(button=>button.addEventListener('click',()=>{
    const parent=plans.find(p=>String(p.id)===button.dataset.arrangeWeek);
    const range=ZhuxuScheduleRules.weeks(Number(parent.start.slice(0,4)),Number(parent.start.slice(5,7))).find(w=>w.end>=parent.start);
    openScheduleGoal({ level:'week',parentId:parent.id,start:range.start,end:range.end,goal:{ ...parent.goal } });
  }));
}

// Opt-in offline fixtures, never loaded on startup or into a shared project.
const linkedSampleBatch = 'linked-schedule-test-v1';
function renderLinkedSampleLoader() {
  if (window.ZhuxuServer?.active) return '';
  const existing = plans.filter(p=>p.testBatch===linkedSampleBatch);
  const days = existing.filter(p=>p.level==='day').map(p=>p.start).sort();
  return `<details class="schedule-goals"><summary>关联计划测试数据${existing.length?' · 已载入':''}</summary><p>追加连续7天、每天3项测试工作，包含楼层节点、工程量、明确权重；不覆盖已有计划或上传文件。实际完成率由你在每日例会确认。</p>${days.length?`<p>${days[0]}—${days.at(-1)} · ${days.length} 项日工作已关联。请在每日例会选择相应日期测试。</p>`:`<button type="button" class="secondary-button" data-load-linked-samples>载入关联测试计划</button>`}<p>仅供本机离线测试；名称均带【关联测试】。</p><p data-sample-status role="status"></p></details>`;
}

function buildLinkedScheduleSamples(date, existingPlans, existingTasks, people, random = Math.random) {
  if (existingPlans.some(p=>p.testBatch===linkedSampleBatch)) return { plans:[],tasks:[] };
  const dates = Array.from({length:7},(_,i)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10);});
  let id = [...existingPlans,...existingTasks].reduce((max,item)=>Math.max(max,Number(item.id)||0),Date.now())+100;
  const nextId=()=>++id, result={plans:[],tasks:[]};
  const ownerFor=role=>{const p=people.find(p=>String(p.role).includes(role))||people[0];return p?`${p.name} · ${p.role}`:'测试责任人（待安排）';};
  const configs=[
    {mode:'milestone',building:'测试3#楼',stage:'主体结构',unit:'层',node:'梁板浇筑完成',team:'混凝土班组',owner:ownerFor('土建')},
    {mode:'quantity',building:'测试2#楼',stage:'钢筋工程',unit:'吨',node:'',team:'钢筋班组',owner:ownerFor('土建')},
    {mode:'weight',building:'测试地下室',stage:'机电安装',unit:'份额',node:'',team:'机电班组',owner:ownerFor('机电')}
  ];
  for (const monthKey of [...new Set(dates.map(d=>d.slice(0,7)))]) {
    const monthDates=dates.filter(d=>d.startsWith(monthKey));
    const [year,month]=monthKey.split('-').map(Number);
    const ranges=ZhuxuScheduleRules.weeks(year,month).filter(w=>monthDates.some(d=>w.start<=d&&d<=w.end));
    for (const config of configs) {
      const amounts=Object.fromEntries(monthDates.map(d=>[d,8+Math.floor(random()*13)]));
      const base=config.mode==='milestone'?1:0;
      const target=config.mode==='milestone'?1+ranges.length:config.mode==='quantity'?Object.values(amounts).reduce((a,b)=>a+b,0):100;
      const monthPlan={id:nextId(),level:'month',title:`【关联测试】${monthKey} ${config.building} ${config.stage}月目标`,start:monthKey+'-01',end:new Date(Date.UTC(year,month,0)).toISOString().slice(0,10),parentId:null,owners:[config.owner],team:config.team,source:'关联测试样例',testBatch:linkedSampleBatch,goal:{...config,baseline:base,target}};
      result.plans.push(monthPlan);
      let assignedShare=0;
      ranges.forEach((range,wi)=>{
        const weekDates=monthDates.filter(d=>range.start<=d&&d<=range.end);
        const share=wi===ranges.length-1?100-assignedShare:Math.floor(100*weekDates.length/monthDates.length);assignedShare+=share;
        const weekPlan={...monthPlan,id:nextId(),level:'week',title:`【关联测试】${config.building} ${range.start}周目标`,...range,parentId:monthPlan.id,goal:{...monthPlan.goal,baseline:config.mode==='milestone'?1+wi:0,target:config.mode==='milestone'?2+wi:config.mode==='quantity'?weekDates.reduce((sum,d)=>sum+amounts[d],0):100,monthShare:config.mode==='weight'?share:0}};
        result.plans.push(weekPlan);
        let assignedAmount=0;
        weekDates.forEach((day,di)=>{
          const closes=config.mode==='milestone'&&di===weekDates.length-1;
          const amount=config.mode==='quantity'?amounts[day]:di===weekDates.length-1?100-assignedAmount:Math.floor(100/weekDates.length);assignedAmount+=amount;
          const planId=nextId(),taskId=nextId();
          const title=`【关联测试】${config.building} ${config.mode==='milestone'?`${2+wi}层${closes?'梁板浇筑完成':'梁板施工准备'}`:config.mode==='quantity'?`钢筋绑扎 ${amount}吨`:`机电安装 ${amount}份额`}（${day.slice(5)}）`;
          const scheduleLink={weekId:weekPlan.id,monthId:monthPlan.id,...(config.mode==='milestone'?{milestone:2+wi,closesNode:closes}:{amount,capacity:amount,workKey:`test-scope-${planId}`})};
          result.plans.push({id:planId,level:'day',title,start:day,end:day,parentId:weekPlan.id,owners:[config.owner],ownerRole:config.owner.split('·').at(-1).trim(),team:config.team,dailyTarget:config.mode==='quantity'?80:100,taskId,taskIds:[taskId],scheduleLink,source:'关联测试样例',testBatch:linkedSampleBatch,attachments:[],subTasks:[]});
          result.tasks.push({id:taskId,dayPlanId:planId,title,zone:config.building,owner:config.owner,team:config.team,creator:'关联测试样例',taskType:'施工任务',time:'17:00',status:'todo',priority:'normal',criteria:`仅供关联测试 · ${day}`,testBatch:linkedSampleBatch});
        });
      });
    }
  }
  ZhuxuScheduleRules.validatePlans(existingPlans,existingPlans.concat(result.plans),[]);
  return result;
}

function loadLinkedScheduleSamples(event) {
  const button=event.currentTarget;
  if (window.ZhuxuServer?.active || button.disabled) return;
  button.disabled=true;
  const status=button.parentElement.querySelector('[data-sample-status]');
  try {
    // Read current storage at click time so repeated clicks/tabs do not reuse stale data.
    const oldPlans=JSON.parse(localStorage.getItem('zhuxu-plans')||JSON.stringify(plans));
    const oldTasks=JSON.parse(localStorage.getItem('zhuxu-tasks')||JSON.stringify(tasks));
    const sample=buildLinkedScheduleSamples(dailyDateKey,oldPlans,oldTasks,organization);
    if (!sample.plans.length) { plans=oldPlans;tasks=oldTasks;renderSubview('schedule');showToast('关联测试计划已存在，未重复添加');return; }
    const nextPlans=oldPlans.concat(sample.plans),nextTasks=oldTasks.concat(sample.tasks);
    ZhuxuScheduleRules.validatePlans(oldPlans,nextPlans,dailyExecution);
    const previousTasks=localStorage.getItem('zhuxu-tasks');
    localStorage.setItem('zhuxu-tasks',JSON.stringify(nextTasks));
    try { localStorage.setItem('zhuxu-plans',JSON.stringify(nextPlans)); }
    catch(error) { localStorage.setItem('zhuxu-tasks',previousTasks??JSON.stringify(oldTasks));throw error; }
    plans=nextPlans;tasks=nextTasks;
    activeScheduleYear=Number(dailyDateKey.slice(0,4));activeScheduleMonth=Number(dailyDateKey.slice(5,7));activePlanLevel='month';
    renderSubview('schedule');showToast('已追加21项日工作及关联月周目标，请从每日例会测试实际完成确认');
  } catch(error) { status.textContent=`未能载入：${error.message}。未覆盖已有计划，请重试。`;button.disabled=false; }
}

function openScheduleGoal(seed) {
  if(seed.goal?.mode==='activity')return openRecognizedGoal(seed);
  let dialog=$('#scheduleGoalDialog');
  if (!dialog) { dialog=document.createElement('dialog'); dialog.id='scheduleGoalDialog'; dialog.className='wide-dialog'; document.body.appendChild(dialog); }
  const g=seed.goal || { building:'',stage:'主体结构',mode:'milestone',baseline:0,target:1,unit:'层',node:'梁板浇筑完成' };
  const parents=plans.filter(p=>p.level==='month' && ZhuxuScheduleRules.goal(p));
  dialog.innerHTML=`<form id="scheduleGoalForm"><div class="dialog-heading"><div><span>施工目标 · 保留计划原文件</span><h2>${seed.level==='month'?'月目标':'周目标'}</h2></div><button type="button" class="icon-button" data-close-goal aria-label="关闭">×</button></div><p>从月目标安排周目标，在每日例会选择周目标编制日工作。已分解的目标仅可调整名称，避免改变历史统计口径。</p><div class="form-grid">${seed.level==='week'?`<label class="full-width">所属月目标<select name="parentId" required><option value="">请选择所属月目标</option>${parents.map(p=>`<option value="${p.id}" ${String(seed.parentId)===String(p.id)?'selected':''}>${escapeHtml(p.title)} · ${escapeHtml(p.goal.building)} · ${p.start.slice(0,7)}</option>`).join('')}</select></label>`:''}<label class="full-width">目标名称<input name="title" required value="${escapeHtml(seed.title||'')}" placeholder="例如：3#楼完成至5层梁板浇筑"></label><label>开始日期<input name="start" type="date" required value="${seed.start}"></label><label>完成日期<input name="end" type="date" required value="${seed.end}"></label><label>单体 / 区域<input name="building" required value="${escapeHtml(g.building)}"></label><label>施工阶段<input name="stage" required value="${escapeHtml(g.stage)}"></label><label>统计口径<select name="mode">${[['milestone','连续楼层节点'],['quantity','同单位工程量'],['weight','明确贡献权重']].map(([v,l])=>`<option value="${v}" ${g.mode===v?'selected':''}>${l}</option>`).join('')}</select></label><label>单位<input name="unit" required value="${escapeHtml(g.unit)}" placeholder="层 / 吨 / 平方米 / 份额"></label><label>起点（已完成）<input name="baseline" type="number" step="any" required value="${g.baseline}"></label><label>本期累计目标<input name="target" type="number" step="any" required value="${g.target}"></label><label>统一节点（楼层口径必填）<input name="node" value="${escapeHtml(g.node||'')}" placeholder="例如：梁板浇筑完成"></label>${seed.level==='week'?`<label>周目标对月目标贡献份额（权重口径）<input name="monthShare" type="number" step="any" min="0" value="${g.monthShare||''}"></label>`:''}<label>责任人<select name="owner"><option value="">待安排</option>${organization.map(p=>{const l=`${p.name} · ${p.role}`;return `<option ${seed.owners?.includes(l)?'selected':''}>${escapeHtml(l)}</option>`;}).join('')}</select></label><label>责任班组<input name="team" value="${escapeHtml(seed.team||'')}"></label></div><p class="goal-form-error" role="alert"></p><div class="dialog-actions"><button type="button" class="secondary-button" data-close-goal>取消</button><button type="submit" class="primary-button">保存目标</button></div></form>`;
  const form=$('#scheduleGoalForm');
  $$('[data-close-goal]',dialog).forEach(b=>b.onclick=()=>dialog.close());
  form.elements.mode.onchange=()=>{ if(form.elements.mode.value==='weight'){form.elements.baseline.value='0';form.elements.target.value='100';form.elements.unit.value='份额';} };
  if(seed.level==='week') form.elements.parentId.onchange=()=>{
    const p=parents.find(p=>String(p.id)===form.elements.parentId.value); if(!p)return;
    for(const k of ['building','stage','mode','baseline','target','unit','node'])form.elements[k].value=p.goal[k]??'';
    if(p.goal.mode==='weight'){form.elements.baseline.value='0';form.elements.target.value='100';}
    if(!form.elements.owner.value)form.elements.owner.value=p.owners?.[0]||'';
    if(!form.elements.team.value)form.elements.team.value=p.team||'';
  };
  form.onsubmit=async event=>{
    event.preventDefault(); const f=form.elements;
    const entry={ ...seed,id:seed.id||Date.now(),level:seed.level,title:f.title.value.trim(),start:f.start.value,end:f.end.value,parentId:seed.level==='week'?Number(f.parentId.value):null,owners:f.owner.value?[f.owner.value]:[],team:f.team.value.trim(),source:'计划目标清单',goal:{building:f.building.value.trim(),stage:f.stage.value.trim(),mode:f.mode.value,baseline:Number(f.baseline.value),target:Number(f.target.value),unit:f.unit.value.trim(),node:f.node.value.trim(),monthShare:seed.level==='week'?Number(f.monthShare.value||0):0} };
    const next=plans.filter(p=>String(p.id)!==String(entry.id)).concat(entry);
    const submit=form.querySelector('[type="submit"]'); submit.disabled=true;
    try {
      ZhuxuScheduleRules.validatePlans(plans,next,dailyExecution);
      if(seed.id) entry.revisions=[...(seed.revisions||[]),{ at:new Date().toISOString(),title:seed.title,start:seed.start,end:seed.end,parentId:seed.parentId,goal:structuredClone(seed.goal) }];
      if(window.ZhuxuServer?.active)await window.ZhuxuServer.saveState('zhuxu-plans',next);
      localStorage.setItem('zhuxu-plans',JSON.stringify(next)); plans=next;
      dialog.close();renderSubview('schedule');showToast('目标已保存，原计划文件未改变');
    } catch(error){$('.goal-form-error',dialog).textContent=error.message;} finally{submit.disabled=false;}
  };
  dialog.showModal();
}

function meetingLinkEditor(row,date,index) {
  const selected=row.scheduleLink?.weekId;
  const choices=plans.filter(p=>p.level==='week' && ZhuxuScheduleRules.goal(p) && p.start<=date && p.end>=date && plans.some(m=>m.level==='month' && ZhuxuScheduleRules.goal(m) && String(m.id)===String(p.parentId) && m.start<=date && m.end>=date));
  const week=plans.find(p=>String(p.id)===String(selected));
  const month=week && plans.find(p=>String(p.id)===String(week.parentId));
  const link=row.scheduleLink;
  if(week?.goal?.mode==='activity')return `<div class="meeting-link-editor"><label>所属自动生成周计划<select data-meeting-week="${index}"><option value="">计划外 / 待补关联</option>${choices.map(p=>`<option value="${p.id}" ${String(p.id)===String(selected)?'selected':''}>${escapeHtml(p.title)} · ${p.start}—${p.end}</option>`).join('')}</select></label><small>所属月计划：${escapeHtml(month?.title||'')}。${escapeHtml(week.goal.text||'')}；本项日工作实际完成率仍在例会中确认，不用作业天数推算月完成率。</small></div>`;
  return `<div class="meeting-link-editor"><label>所属周目标<select data-meeting-week="${index}"><option value="">计划外 / 待补关联（不计入月周统计）</option>${selected&&!choices.some(p=>String(p.id)===String(selected))?`<option value="${selected}" selected>原周目标已超出日期，请重新选择</option>`:''}${choices.map(p=>`<option value="${p.id}" ${String(p.id)===String(selected)?'selected':''}>${escapeHtml(p.title)} · ${escapeHtml(plans.find(m=>String(m.id)===String(p.parentId))?.title||'')}</option>`).join('')}</select></label>${week?.goal?`<small>所属月目标：${escapeHtml(month?.title||'待核实')} · ${escapeHtml(week.goal.building)} · ${escapeHtml(week.goal.stage)}</small>${week.goal.mode==='milestone'?`<label>本项施工楼层<input data-meeting-milestone="${index}" type="number" step="1" value="${link.milestone??Number(week.goal.baseline)+1}"></label><label class="goal-checkbox"><input type="checkbox" data-meeting-closes="${index}" ${link.closesNode?'checked':''}>本项全部完成即达到“${escapeHtml(week.goal.node)}”节点（部分工序不要勾选）</label>`:`<label>当天计划${week.goal.mode==='weight'?'贡献份额':'工程量'}（${escapeHtml(week.goal.unit)}）<input data-meeting-amount="${index}" type="number" step="any" min="0" value="${link.amount??''}"></label><small>实际贡献 = 当天计划量 × 例会实际完成率；续排沿用原工作范围，避免重复累计。</small>`}`:'<small>不按任务名称或日期自动挂靠；请选择对应周目标。已有旧关联暂保留但不参与新口径汇总。</small>'}</div>`;
}
function bindMeetingLinks(body,date) {
  $$('[data-meeting-week]',body).forEach(input=>input.onchange=()=>{
    const row=dailyMeetingPlanDraft[Number(input.dataset.meetingWeek)];
    const week=plans.find(p=>String(p.id)===input.value);
    if(!week){row.scheduleLink=null;row.parentId=null;}
    else {
      const old=row.scheduleLink;
      const previousWeek=old && plans.find(p=>String(p.id)===String(old.weekId));
      const sameScope=previousWeek?.goal && ['building','stage','mode','unit'].every(k=>previousWeek.goal[k]===week.goal[k]);
      row.scheduleLink={weekId:week.id,monthId:week.parentId,milestone:sameScope?old.milestone:Number(week.goal.baseline)+1,closesNode:sameScope?old.closesNode:false,amount:sameScope?old.amount:'',capacity:sameScope?old.capacity:'',workKey:sameScope?old.workKey:`scope-${Date.now()}-${input.dataset.meetingWeek}`};
      row.parentId=week.id;
      if(!row.owner)row.owner=week.owners?.[0]||'';
      if(!row.team)row.team=week.team||'';
    }
    renderDailyMeetingDialog();
  });
  $$('[data-meeting-amount]',body).forEach(input=>input.oninput=()=>{
    const row=dailyMeetingPlanDraft[Number(input.dataset.meetingAmount)];
    row.scheduleLink.amount=input.value===''?'':Number(input.value);
    if(!row.carriedFromId)row.scheduleLink.capacity=row.scheduleLink.amount;
  });
  $$('[data-meeting-milestone]',body).forEach(input=>input.oninput=()=>{dailyMeetingPlanDraft[Number(input.dataset.meetingMilestone)].scheduleLink.milestone=input.value===''?'':Number(input.value);});
  $$('[data-meeting-closes]',body).forEach(input=>input.onchange=()=>{dailyMeetingPlanDraft[Number(input.dataset.meetingCloses)].scheduleLink.closesNode=input.checked;});
}

function renderLinkedProgress(date) {
  const months=plans.filter(p=>p.level==='month' && ZhuxuScheduleRules.goal(p) && p.start<=date && p.end>=date);
  if(!months.length)return '';
  return `<section class="schedule-goals"><div class="daily-section-heading"><div><strong>日 → 周 → 月实际进度</strong><small>截至 ${date}，仅汇总例会已确认记录；计划外任务和旧记录不擅自计入。</small></div></div>${months.map(m=>{
    const s=ZhuxuScheduleRules.summary(m,plans,dailyExecution,date);
    if(m.goal.mode==='activity')return renderRecognizedGoal(m,s);
    return `<article class="schedule-goal-item"><div><strong>${escapeHtml(m.title)}</strong><p>月目标 ${m.goal.target}${escapeHtml(m.goal.unit)} · 实际 ${s.actual}${escapeHtml(m.goal.unit)} · ${s.rate}%</p>${plans.filter(w=>w.level==='week'&&ZhuxuScheduleRules.goal(w)&&String(w.parentId)===String(m.id)).map(w=>{const v=ZhuxuScheduleRules.summary(w,plans,dailyExecution,date);return `<small>${escapeHtml(w.title)}：实际 ${v.actual}/${w.goal.target}${escapeHtml(w.goal.unit)} · ${v.rate}%</small>`;}).join('')}</div></article>`;
  }).join('')}</section>`;
}
