(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ZhuxuScheduleRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const same = (a,b) => String(a) === String(b);
  const goal = plan => plan && plan.goal && ['month','week'].includes(plan.level) && !plan.archived;
  const number = value => value !== '' && value != null && Number.isFinite(Number(value));
  const round = n => Math.round(n * 10000) / 10000;
  function shift(date, days) { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0,10); }
  function weeks(year, month) {
    const first = `${year}-${String(month).padStart(2,'0')}-01`;
    const end = new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);
    const weekday = new Date(first + 'T12:00:00Z').getUTCDay() || 7;
    const rows = [];
    for (let start = shift(first,1-weekday); start <= end; start = shift(start,7)) rows.push({ start, end: shift(start,6) });
    return rows;
  }
  function validateGoal(plan, plans) {
    const g = plan.goal;
    if (!g || !['month','week'].includes(plan.level)) throw new Error('请选择月目标或周目标');
    if (!plan.title?.trim() || !g.building?.trim() || !g.stage?.trim() || !g.unit?.trim()) throw new Error('请填写名称、单体、施工阶段和计量单位');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(plan.start) || !/^\d{4}-\d{2}-\d{2}$/.test(plan.end) || plan.start > plan.end) throw new Error('计划起止日期无效');
    if (!['milestone','quantity','weight','activity'].includes(g.mode) || !number(g.baseline) || !number(g.target) || Number(g.target) <= Number(g.baseline)) throw new Error('目标必须大于起点，并选择统计口径');
    if (g.mode === 'milestone' && (!Number.isInteger(Number(g.baseline)) || !Number.isInteger(Number(g.target)) || !g.node?.trim())) throw new Error('节点按整数楼层记录，并填写统一验收节点');
    if (plan.level === 'month' && plan.start.slice(0,7) !== plan.end.slice(0,7)) throw new Error('月目标需归属同一个自然月');
    if (plan.level === 'week') {
      const parent = plans.find(p => same(p.id,plan.parentId) && p.level === 'month' && goal(p));
      if (!parent) throw new Error('请明确选择所属月目标，不能仅按日期匹配');
      if (plan.start > parent.end || plan.end < parent.start) throw new Error('周目标与所属月目标日期不相交');
      const day = new Date(plan.start + 'T12:00:00Z').getUTCDay() || 7;
      if (plan.end > shift(plan.start,7-day)) throw new Error('周任务日期不能超过所在自然周（周一至周日）');
      if (['building','stage','mode','unit'].some(k => g[k] !== parent.goal[k]) || (g.mode === 'milestone' && g.node !== parent.goal.node)) throw new Error('周目标的单体、阶段和统计口径必须与月目标一致');
      if (g.mode !== 'weight' && (Number(g.baseline) < Number(parent.goal.baseline) || Number(g.target) > Number(parent.goal.target))) throw new Error('周目标不能超出月目标范围');
      if (g.mode === 'weight') {
        if (Number(g.baseline) !== 0 || Number(g.target) !== 100 || !number(g.monthShare) || Number(g.monthShare) <= 0) throw new Error('权重周目标为0—100，并填写对月目标的贡献份额');
        const used = plans.filter(p => p.level === 'week' && goal(p) && same(p.parentId,parent.id) && !same(p.id,plan.id)).reduce((sum,p)=>sum + Number(p.goal.monthShare || 0),0);
        if (used + Number(g.monthShare) > Number(parent.goal.target) - Number(parent.goal.baseline)) throw new Error('各周贡献份额合计不能超过月目标');
      }
    }
  }
  function validateDay(plan, plans) {
    if (!plan.scheduleLink) return;
    const link = plan.scheduleLink;
    const week = plans.find(p => goal(p) && p.level === 'week' && same(p.id,link.weekId));
    const month = week && plans.find(p => goal(p) && p.level === 'month' && same(p.id,week.parentId));
    if (!week || !month || !same(link.monthId,month.id) || !same(plan.parentId,week.id)) throw new Error('日计划必须关联有效的周目标和月目标');
    if (plan.start < week.start || plan.end > week.end || plan.start < month.start || plan.end > month.end) throw new Error('日计划日期超出所属周/月范围，请重新选择周目标或标记计划外');
    if (week.goal.mode === 'activity') return;
    if (week.goal.mode === 'milestone') {
      if (!Number.isInteger(Number(link.milestone)) || Number(link.milestone) <= Number(week.goal.baseline) || Number(link.milestone) > Number(week.goal.target)) throw new Error('日工作楼层应在周目标的起点之后、目标之内');
      if (link.closesNode && Number(plan.dailyTarget) !== 100) throw new Error('确认楼层节点达成的日计划目标必须为100%，部分施工请取消节点达成勾选');
    } else if (!number(link.amount) || Number(link.amount) <= 0 || !number(link.capacity) || Number(link.capacity) < Number(link.amount) || !link.workKey) throw new Error('请填写正数计划工程量/贡献份额');
  }
  function snapshot(plan) {
    return plan.scheduleLink ? JSON.parse(JSON.stringify(plan.scheduleLink)) : null;
  }
  function contributions(plans, records, asOf = '9999-12-31') {
    const out = [], seen = new Set(), used = new Map();
    // Only committed meeting snapshots contribute; never infer from task names or planned dates.
    const eligible = records.filter(r=>r.meetingConfirmedAt && r.date <= asOf && r.scheduleSnapshot).sort((a,b)=>a.date.localeCompare(b.date) || String(a.taskId).localeCompare(String(b.taskId)));
    for (const r of eligible) {
      const key = `${r.date}|${r.taskId}`;
      if (seen.has(key)) continue; seen.add(key);
      const link = r.scheduleSnapshot;
      const scope = String(link.workKey || key);
      const requested = Number(link.amount || 0) * Number(r.actualCompletion || 0) / 100;
      const cap = Math.max(0, Number(link.capacity || 0));
      const amount = Math.min(requested, Math.max(0,cap - (used.get(scope) || 0)));
      used.set(scope,(used.get(scope)||0)+amount);
      out.push({ ...link, amount, date: r.date, reached: Boolean(link.closesNode && r.actualCompletion === 100 && r.plannedTarget === 100) });
    }
    return out;
  }
  function summary(plan, plans, records, asOf) {
    const g = plan.goal;
    if (!g) return null;
    const all = contributions(plans,records,asOf);
    const rows = all.filter(row => same(plan.level === 'week' ? row.weekId : row.monthId,plan.id));
    if (g.mode === 'activity') return {actual:null,rate:null,confirmed:rows.length};
    let actual = Number(g.baseline);
    if (g.mode === 'milestone') {
      const nodes = new Set(rows.filter(r=>r.reached).map(r=>Number(r.milestone)));
      while (actual < Number(g.target) && nodes.has(actual+1)) actual++;
    } else if (g.mode === 'weight' && plan.level === 'month') {
      actual += plans.filter(p=>goal(p) && p.level === 'week' && same(p.parentId,plan.id)).reduce((sum,p)=>sum + summary(p,plans,records,asOf).rate / 100 * Number(p.goal.monthShare || 0),0);
    } else actual += rows.reduce((sum,row)=>sum + row.amount,0);
    actual = Math.min(Number(g.target),actual);
    return { actual: round(actual), rate: round((actual-Number(g.baseline))/(Number(g.target)-Number(g.baseline))*100), confirmed: rows.length };
  }
  function carry(plan, record) {
    if (!plan.scheduleLink) return null;
    const link = { ...plan.scheduleLink };
    if (number(link.amount)) link.amount = round(Number(link.amount)*(1-(record.meetingConfirmedAt ? Number(record.actualCompletion || 0) : 0)/100));
    return link;
  }
  function validatePlans(previous, next, records) {
    if (!Array.isArray(next)) throw new Error('计划格式无效');
    if (new Set(next.map(p=>String(p.id))).size !== next.length) throw new Error('计划编号不能重复');
    for (const plan of next) {
      if (goal(plan)) validateGoal(plan,next);
      if (plan.level === 'day' && plan.scheduleLink && !plan.archived) validateDay(plan,next);
    }
    for (const old of previous) {
      const hasChildren = old.goal && previous.some(p=>same(p.parentId,old.id));
      const confirmed = records.some(r=>r.meetingConfirmedAt && same(r.dayPlanId,old.id));
      if (!hasChildren && !confirmed) continue;
      const updated = next.find(p=>same(p.id,old.id));
      const fields = old.goal ? ['goal','parentId','start','end','archived'] : ['scheduleLink','parentId','start','end','dailyTarget','taskId','taskIds','archived'];
      const immutable=(value,key)=>{if(key==='goal'&&value?.mode==='activity'){const copy={...value};delete copy.text;return copy;}return value;};
      if (!updated || fields.some(k=>JSON.stringify(immutable(old[k],k)) !== JSON.stringify(immutable(updated[k],k)))) throw new Error('已分解的目标或已确认日计划不能改动范围、归属或删除；请保留原记录，新建调整目标');
    }
  }
  return { goal, weeks, validateGoal, validateDay, validatePlans, snapshot, summary, carry, contributions };
});
