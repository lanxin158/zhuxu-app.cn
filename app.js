const stages = [
  { name: '施工准备', meta: '100%', status: 'done', detail: '场地、临建及方案审批已完成', owner: '项目部' },
  { name: '地基基础', meta: '100%', status: 'done', detail: '桩基与地下室结构已完成验收', owner: '土建一队' },
  { name: '主体结构', meta: '82%', status: 'current', detail: '3#楼施工至 8F，2#楼施工至 11F', owner: '结构班组' },
  { name: '二次结构', meta: '45%', status: 'risk', detail: '砌体材料到货晚 1 天，需调整流水段', owner: '砌筑班组' },
  { name: '机电安装', meta: '38%', status: 'current', detail: '地下室桥架安装与主体预埋同步推进', owner: '机电班组' },
  { name: '装饰装修', meta: '待开始', status: 'todo', detail: '样板间深化与材料封样进行中', owner: '精装团队' },
  { name: '竣工交付', meta: '待开始', status: 'todo', detail: '计划 2027 年 3 月进入联合验收', owner: '项目部' }
];

const dailyDateKey = new Date().toISOString().slice(0, 10);
function shiftDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
const currentWeekStart = shiftDateKey(dailyDateKey, -((new Date(`${dailyDateKey}T12:00:00`).getDay() + 6) % 7));
const currentWeekEnd = shiftDateKey(currentWeekStart, 6);

const defaultTasks = [
  { id: 1, title: '3#楼 8F 梁板钢筋绑扎及验收', zone: '3#楼', owner: '王建国', time: '11:30', status: 'todo', priority: 'risk' },
  { id: 2, title: '2#楼 11F 墙柱模板加固', zone: '2#楼', owner: '木工一班', time: '14:00', status: 'doing', priority: 'normal' },
  { id: 3, title: '地下室 B2 区桥架安装', zone: '地下室', owner: '机电二组', time: '17:30', status: 'doing', priority: 'normal' },
  { id: 4, title: '3#楼混凝土浇筑旁站', zone: '3#楼', owner: '赵工', time: '18:00', status: 'todo', priority: 'risk' },
  { id: 5, title: '施工电梯日检', zone: '2#楼', owner: '设备组', time: '09:00', status: 'done', priority: 'normal' },
  { id: 6, title: '东侧道路扬尘治理复查', zone: '室外工程', owner: '安全组', time: '10:30', status: 'done', priority: 'normal' }
];

const issues = [
  { title: '钢筋验收可能延误', desc: '3#楼 8F · 影响混凝土浇筑节点', time: '剩 1h 24m', level: 'critical' },
  { title: '砌块库存低于安全值', desc: '仅够 1.5 天 · 供应商确认明早到场', time: '剩 6h', level: 'medium' },
  { title: '木工班组缺员 4 人', desc: '2#楼 11F · 当前产能约为计划 84%', time: '剩 8h', level: 'medium' }
];

const defaultDocumentState = {
  steel: {
    sampleStatus: 'testing',
    materialEntryId: 301,
    commissionAttachments: [], reportAttachments: [],
    linkedProcess: '3#楼 8F 梁板钢筋绑扎及验收',
    documents: [
      { id: 'steel-certificate', name: '钢筋质量证明文件', trigger: '钢筋进场', owner: '材料员', due: '进场当日', status: 'done' },
      { id: 'steel-entry', name: '材料进场验收记录', trigger: '钢筋进场', owner: '材料员', due: '进场当日', status: 'done' },
      { id: 'steel-sample', name: '见证取样送检委托单', trigger: '钢筋进场', owner: '试验员', due: '24小时内', status: 'done' },
      { id: 'steel-report', name: '钢筋复试报告', trigger: '钢筋绑扎', owner: '资料员', due: '绑扎前', status: 'pending' }
    ]
  },
  concrete: {
    sampleStatus: 'testing', linkedProcess: '3#楼混凝土浇筑旁站', materialEntryId: null, commissionAttachments: [], reportAttachments: [],
    documents: [
      { id: 'concrete-order', name: '混凝土浇筑申请', trigger: '浇筑准备', owner: '施工员', due: '浇筑前', status: 'done' },
      { id: 'concrete-cube', name: '试块留置及见证记录', trigger: '混凝土浇筑', owner: '试验员', due: '浇筑当日', status: 'pending' },
      { id: 'concrete-report', name: '混凝土强度报告', trigger: '龄期到达', owner: '资料员', due: '报告出具后', status: 'pending' }
    ]
  },
  waterproof: {
    sampleStatus: 'qualified', linkedProcess: '地下室防水保护层施工', materialEntryId: null, commissionAttachments: [], reportAttachments: [],
    documents: [
      { id: 'waterproof-report', name: '防水材料复试报告', trigger: '防水材料进场', owner: '试验员', due: '施工前', status: 'done' },
      { id: 'waterproof-hidden', name: '防水隐蔽验收记录', trigger: '防水层完成', owner: '质量员', due: '隐蔽前', status: 'done' }
    ]
  },
  masonry: {
    sampleStatus: 'testing', linkedProcess: '3#楼二次结构砌筑', materialEntryId: 302, commissionAttachments: [], reportAttachments: [],
    documents: [
      { id: 'masonry-certificate', name: '砌块出厂合格证', trigger: '砌块进场', owner: '材料员', due: '进场当日', status: 'done' },
      { id: 'masonry-sample', name: '砌块见证取样委托单', trigger: '砌块进场', owner: '试验员', due: '24小时内', status: 'pending' },
      { id: 'masonry-report', name: '砌块复试报告', trigger: '砌筑施工', owner: '资料员', due: '砌筑前', status: 'pending' }
    ]
  }
};

const documentChainConfigs = {
  steel: {
    label: '钢筋工程', icon: '钢', resultDocumentId: 'steel-report', resultName: '钢筋复试报告', processName: '钢筋绑扎',
    question: '本批钢筋送检结果是否合格？', warning: '未取得合格报告前，不建议进入钢筋隐蔽验收及混凝土浇筑。',
    steps: [['钢筋进场', '材料员已登记'], ['见证取样', '委托单已完成'], ['复试报告', '等待检测结果'], ['钢筋绑扎', '资料门禁控制']]
  },
  concrete: {
    label: '混凝土工程', icon: '砼', resultDocumentId: 'concrete-report', resultName: '混凝土强度报告', processName: '结构验收',
    question: '混凝土试块及强度报告是否合格？', warning: '强度报告未合格前，不应作为结构验收和后续拆模放行依据。',
    steps: [['浇筑申请', '施工员已提交'], ['试块留置', '等待浇筑取样'], ['强度报告', '等待龄期结果'], ['结构验收', '资料门禁控制']]
  },
  waterproof: {
    label: '防水工程', icon: '防', resultDocumentId: 'waterproof-hidden', resultName: '防水隐蔽验收记录', processName: '保护层施工',
    question: '防水复试及隐蔽验收是否合格？', warning: '防水资料和隐蔽验收未完成前，不应进行保护层及覆盖施工。',
    steps: [['材料进场', '合格证已核验'], ['材料复试', '报告已取得'], ['隐蔽验收', '现场共同验收'], ['保护层施工', '资料门禁控制']]
  },
  masonry: {
    label: '砌体材料', icon: '砌', resultDocumentId: 'masonry-report', resultName: '砌块复试报告', processName: '砌筑施工',
    question: '本批砌块送检报告是否合格？', warning: '砌块复试报告未合格前，不应在关联部位大面积砌筑。',
    steps: [['砌块进场', '材料台账已登记'], ['见证取样', '等待委托送检'], ['复试报告', '等待检测结果'], ['砌筑施工', '资料门禁控制']]
  }
};

const defaultFollowups = [
  { id: 101, category: '资料催办', title: '提供本批钢筋材料合格证原件', requester: '李工 · 资料员', owner: '刘工 · 材料员', zone: '3#楼', due: '2026-08-08T11:00', urgency: 'urgent', relatedTask: '钢筋质量证明文件', note: '影响钢筋原材报验归档', status: 'pending', reminders: 1 },
  { id: 102, category: '资料催办', title: '提交大体积混凝土施工方案审批版', requester: '李工 · 资料员', owner: '周工 · 技术负责人', zone: '项目部', due: '2026-08-08T17:00', urgency: 'normal', relatedTask: '3#楼混凝土浇筑', note: '监理报审需要签章完整版本', status: 'pending', reminders: 0 },
  { id: 103, category: '工序催办', title: '完成墙柱模板加固并移交机电复核', requester: '孙工 · 机电工程师', owner: '木工一班', zone: '2#楼', due: '2026-08-08T14:00', urgency: 'urgent', relatedTask: '2#楼 11F 墙柱模板加固', note: '影响预留预埋复核及封模', status: 'pending', reminders: 2 }
];

const defaultOrganization = [
  { id: 'pm', name: '陈海峰', role: '项目经理', account: 'chen.pm', phone: '138 0000 1001', scope: '项目统筹与重大协调' },
  { id: 'production', name: '王建国', role: '生产经理', account: 'wang.prod', phone: '138 0000 1002', scope: '日计划、施工组织与班组协调' },
  { id: 'technical', name: '周海', role: '技术负责人', account: 'zhou.tech', phone: '138 0000 1003', scope: '施工方案、技术交底与技术复核' },
  { id: 'builder', name: '吴晨', role: '施工员', account: 'wu.builder', phone: '138 0000 1004', scope: '现场施工安排、工序协调与进度落实' },
  { id: 'civil', name: '张凯', role: '土建工程师', account: 'zhang.civil', scope: '钢筋、模板、混凝土工程' },
  { id: 'mep', name: '孙明', role: '机电工程师', account: 'sun.mep', scope: '机电安装与预留预埋' },
  { id: 'survey', name: '许航', role: '测量员', account: 'xu.survey', scope: '测量放线、标高与轴线复核' },
  { id: 'tester', name: '郭宇', role: '试验员', account: 'guo.test', scope: '取样送检、试块留置与试验跟踪' },
  { id: 'quality', name: '赵磊', role: '质量员', account: 'zhao.qa', scope: '质量检查与验收' },
  { id: 'safety', name: '周强', role: '安全员', account: 'zhou.hse', scope: '安全巡检与整改' },
  { id: 'storekeeper', name: '马会', role: '库管', account: 'ma.store', phone: '138 0000 1115', scope: '库存核对、收发存登记与到货衔接' },
  { id: 'material', name: '刘颖', role: '材料员', account: 'liu.material', scope: '材料计划、进场验收与台账管理' },
  { id: 'purchaser', name: '林浩', role: '采购员', account: 'lin.purchase', phone: '138 0000 1114', scope: '接收已审批材料计划、询价下单与供应跟踪' },
  { id: 'document', name: '李娜', role: '资料员', account: 'li.doc', scope: '报验、送检与资料归档' },
  { id: 'labor', name: '赵敏', role: '劳资员', account: 'zhao.labor', phone: '138 0000 1113', scope: '实名制考勤、人员进退场与工资资料' },
  { id: 'equipment', name: '何军', role: '设备管理员', account: 'he.equipment', scope: '设备进退场与维保' },
  { id: 'commercial', name: '罗婷', role: '商务经理', account: 'luo.cost', phone: '138 0000 1116', scope: '合同、经济核定、工程量确认与结算管理' }
];

const defaultPlans = [
  { id: 201, level: 'master', title: '云河智造中心一期总进度', start: '2026-03-01', end: '2027-03-31', ownerRole: '项目经理', source: '总控计划' },
  { id: 202, level: 'month', title: '8月份主体结构与二次结构计划', start: '2026-08-01', end: '2026-08-31', ownerRole: '生产经理', source: '月度分解' },
  { id: 203, level: 'week', title: '3#楼 8F 主体结构', start: currentWeekStart, end: currentWeekEnd, ownerRole: '土建工程师', owners: ['张凯 · 土建工程师'], team: '钢筋班组', source: '周计划', weight: 35 },
  { id: 204, level: 'week', title: '2#楼 11F 主体结构', start: currentWeekStart, end: currentWeekEnd, ownerRole: '土建工程师', owners: ['张凯 · 土建工程师'], team: '木工一班', source: '周计划', weight: 25 },
  { id: 205, level: 'week', title: '地下室桥架安装', start: currentWeekStart, end: currentWeekEnd, ownerRole: '机电工程师', owners: ['孙明 · 机电工程师'], team: '机电二组', source: '周计划', weight: 20 },
  { id: 207, level: 'week', title: '设备检查与文明施工', start: currentWeekStart, end: currentWeekEnd, ownerRole: '生产经理', owners: ['王建国 · 生产经理'], team: '设备组', source: '周计划', weight: 20 },
  ...[-4, -3, -2, -1, 0, 1].flatMap((offset, dayIndex) => defaultTasks.map((task, taskIndex) => ({
    id: 3000 + dayIndex * 10 + task.id,
    level: 'day',
    title: task.title,
    start: shiftDateKey(dailyDateKey, offset),
    end: shiftDateKey(dailyDateKey, offset),
    ownerRole: taskIndex === 2 ? '机电工程师' : '土建工程师',
    owners: taskIndex === 2 ? ['孙明 · 机电工程师'] : taskIndex === 3 ? ['张凯 · 土建工程师', '赵磊 · 质量员'] : taskIndex === 4 ? ['王建国 · 生产经理'] : taskIndex === 5 ? ['周强 · 安全员'] : ['张凯 · 土建工程师'],
    team: ['钢筋班组', '木工一班', '机电二组', '混凝土班组', '设备组', '文明施工班组'][taskIndex],
    dailyTarget: 100,
    source: '周计划分解',
    taskId: task.id,
    parentId: taskIndex === 0 || taskIndex === 3 ? 203 : taskIndex === 1 ? 204 : taskIndex === 2 ? 205 : 207,
    weight: 1
  })))
];

const defaultResourceEntries = [
  { id: 301, type: 'material', name: 'HRB400E 钢筋', category: '钢材', brand: '沙钢', spec: 'Φ12-25', movement: '进场', arrivalTime: '2026-08-08T08:30', quantity: '42.6 t', location: '3#楼 8F 梁板', attachments: [{ name: '钢筋质量证明书.pdf' }, { name: '见证取样照片.jpg' }] },
  { id: 302, type: 'material', name: '蒸压加气砌块', category: '砌体材料', brand: '云筑', spec: '600×200×200', movement: '进场', arrivalTime: '2026-08-08T10:20', quantity: '420 m³', location: '2#楼二次结构', attachments: [{ name: '出厂合格证.pdf' }] },
  { id: 303, type: 'equipment', name: '施工升降机', category: '垂直运输设备', brand: '中联重科', spec: 'SC200/200', movement: '进场', arrivalTime: '2026-08-06T14:00', quantity: '1 台', location: '3#楼南侧', attachments: [{ name: '设备备案证.pdf' }, { name: '进场验收照片.jpg' }] }
];

const defaultResourcePlans = [
  { id: 401, type: 'material', name: '商品混凝土 C35', quantity: '680 m³', due: '2026-08-10', location: '3#楼 8F 梁板', ownerRole: '材料员', requester: '吴晨 · 施工员', purchaser: '林浩 · 采购员', contractBrandRequired: true, contractBrand: '云筑商砼', approvalAttachments: [{ name: '商品混凝土材料审批表.pdf', stored: false }], approvalWorkflow: [{ role: '提报人', owner: '吴晨 · 施工员', status: 'approved', actedAt: '2026-08-03T16:10:00+08:00' }, { role: '生产经理', owner: '王建国 · 生产经理', status: 'approved', actedAt: '2026-08-04T09:20:00+08:00' }, { role: '技术负责人', owner: '周海 · 技术负责人', status: 'approved', actedAt: '2026-08-04T14:10:00+08:00' }, { role: '库管', owner: '马会 · 库管', status: 'approved', actedAt: '2026-08-04T16:30:00+08:00' }, { role: '项目经理', owner: '陈海峰 · 项目经理', status: 'approved', actedAt: '2026-08-05T08:40:00+08:00' }] },
  { id: 402, type: 'material', name: '蒸压加气砌块', quantity: '520 m³', due: '2026-08-12', location: '3#楼二次结构', ownerRole: '材料员', requester: '吴晨 · 施工员', purchaser: '林浩 · 采购员', contractBrandRequired: false, contractBrand: '', approvalAttachments: [], approvalWorkflow: [{ role: '提报人', owner: '吴晨 · 施工员', status: 'approved', actedAt: '2026-08-08T09:30:00+08:00' }, { role: '生产经理', owner: '王建国 · 生产经理', status: 'pending' }, { role: '技术负责人', owner: '周海 · 技术负责人', status: 'pending' }, { role: '库管', owner: '马会 · 库管', status: 'pending' }, { role: '项目经理', owner: '陈海峰 · 项目经理', status: 'pending' }] },
  { id: 403, type: 'equipment', name: '汽车泵', quantity: '1 台', due: '2026-08-10', location: '3#楼南侧', ownerRole: '设备管理员' }
];

const defaultConcealedAcceptances = [
  { id: 901, title: '3#楼8F梁板钢筋隐蔽验收', processType: '钢筋工程隐蔽', location: '3#楼 8F 梁板', date: '2026-08-10', owner: '赵磊 · 质量员', witness: '王建国 · 生产经理', linkedProcess: '3#楼8F梁板混凝土浇筑', status: 'pending', conclusion: '钢筋复试报告出具并完成现场联合验收后放行。', documentAttachments: [], photoAttachments: [] },
  { id: 902, title: '地下室顶板防水附加层隐蔽验收', processType: '防水工程隐蔽', location: '地下室顶板', date: '2026-08-09', owner: '赵磊 · 质量员', witness: '吴晨 · 施工员', linkedProcess: '地下室顶板防水保护层施工', status: 'qualified', conclusion: '附加层宽度、搭接及节点处理符合要求，同意隐蔽。', documentAttachments: [{ name: '地下室防水隐蔽验收记录.pdf', stored: false }], photoAttachments: [{ name: '防水节点验收照片.jpg', stored: false }] }
];

const defaultQualityChecks = [
  { id: 501, type: 'quality', title: '3#楼8F梁板钢筋保护层局部偏差', location: '3#楼 8F 梁板', owner: '钢筋班组', date: '2026-08-09', due: '2026-08-10', status: 'pending', critical: true, note: '复核垫块间距并补设，整改后通知质量员验收', recordAttachments: [], beforeAttachments: [], afterAttachments: [] },
  { id: 502, type: 'quality', title: '2#楼11F墙柱模板拼缝漏浆风险', location: '2#楼 11F', owner: '木工一班', date: '2026-08-09', due: '2026-08-10', status: 'rectifying', critical: false, note: '封模前完成拼缝封堵', recordAttachments: [], beforeAttachments: [], afterAttachments: [] },
  { id: 503, type: 'quality', title: '地下室桥架支吊架间距复核', location: '地下室 B2', owner: '机电二组', date: '2026-08-08', due: '2026-08-10', status: 'pending', critical: false, note: '', recordAttachments: [], beforeAttachments: [], afterAttachments: [] },
  { id: 504, type: 'quality', title: '二次结构构造柱植筋深度抽检', location: '3#楼 4F', owner: '砌筑班组', date: '2026-08-08', due: '2026-08-10', status: 'pending', critical: false, note: '', recordAttachments: [], beforeAttachments: [], afterAttachments: [] },
  { id: 505, type: 'quality', title: '楼梯踏步模板标高复核', location: '2#楼 10F', owner: '木工二班', date: '2026-08-08', due: '2026-08-09', status: 'rectifying', critical: false, note: '', recordAttachments: [], beforeAttachments: [], afterAttachments: [] },
  { id: 506, type: 'quality', title: '防水附加层宽度不足', location: '地下室顶板', owner: '防水班组', date: '2026-08-07', due: '2026-08-09', status: 'pending', critical: false, note: '', recordAttachments: [], beforeAttachments: [], afterAttachments: [] },
  { id: 507, type: 'quality', title: '混凝土施工缝凿毛清理', location: '3#楼 7F', owner: '混凝土班组', date: '2026-08-07', due: '2026-08-09', status: 'pending', critical: false, note: '', recordAttachments: [], beforeAttachments: [], afterAttachments: [] },
  ...Array.from({ length: 12 }, (_, index) => ({ id: 600 + index, type: 'safety', title: ['临边防护巡检', '临时用电巡检', '消防器材巡检', '起重设备巡检'][index % 4], location: ['3#楼', '2#楼', '地下室', '加工区'][index % 4], owner: '安全员', date: index < 4 ? '2026-08-10' : '2026-08-09', due: '2026-08-10', status: index === 0 ? 'pending' : 'closed', critical: false, note: index === 0 ? '发现一处临边踢脚板松动，已生成整改内容' : '巡检完成，未发现影响施工的问题', recordAttachments: [], beforeAttachments: [], afterAttachments: [] }))
];

const defaultIntakeRecords = [
  { id: 1001, title: '3#楼8F钢筋施工计划表', source: 'file', target: 'plan', zone: '3#楼 8F 梁板', collector: '王建国 · 生产经理', collectedAt: '2026-08-15T08:20:00+08:00', status: 'review', rawText: '梁板钢筋绑扎\n钢筋隐蔽验收\n混凝土浇筑准备', candidates: [{ title: '梁板钢筋绑扎', selected: true }, { title: '钢筋隐蔽验收', selected: true }, { title: '混凝土浇筑准备', selected: true }], attachments: [{ name: '3#楼8F钢筋施工计划.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', stored: false }], recognitionMode: '浏览器本地解析' },
  { id: 1002, title: '东侧临边防护整改照片', source: 'photo', target: 'quality', zone: '3#楼 8F 东侧', collector: '周强 · 安全员', collectedAt: '2026-08-15T09:05:00+08:00', status: 'distributed', candidates: [{ title: '东侧临边踢脚板局部松动', selected: true }], attachments: [{ name: '东侧临边整改前.jpg', type: 'image/jpeg', stored: false }], recognitionMode: '文件名候选 · 人工校核', distributedAt: '2026-08-15T09:16:00+08:00', businessRefs: [{ kind: 'quality', id: 501, title: '东侧临边踢脚板局部松动' }] },
  { id: 1003, title: '材料到场口述记录', source: 'voice', target: 'material', zone: '项目部', collector: '刘颖 · 材料员', collectedAt: '2026-08-14T16:40:00+08:00', status: 'archived', rawText: '明早加气砌块到场，核对数量和合格证。', candidates: [{ title: '明早加气砌块到场，核对数量和合格证', selected: true }], attachments: [], recognitionMode: '浏览器语音转写 · 人工校核', archivedAt: '2026-08-14T17:10:00+08:00' }
];

const defaultTechnicalDocuments = [
  { id: 1501, type: 'drawing', code: '建施-3#-08F-01', title: '3#楼8层建筑施工图', building: '3#楼', issuedBy: '周海 · 技术负责人', issuedAt: shiftDateKey(dailyDateKey, -12), scope: '3#楼 8F', content: '用于3#楼8层墙柱、梁板定位及建筑做法核对，现场施工前须与结构图、机电预留预埋图会审。', files: [{ name: '3号楼8层建筑施工图.pdf', stored: false }], status: 'valid' },
  { id: 1502, type: 'change', code: 'SJBG-2026-018', title: '梁板洞口附加筋调整', building: '3#楼', issuedBy: '周海 · 技术负责人', issuedAt: dailyDateKey, scope: '3#楼 8F 东侧设备洞口', content: '3#楼8F东侧设备洞口附加筋按变更图施工，原节点做法停止使用。施工员须向钢筋班组完成线上交底并留存确认记录。', files: [{ name: 'SJBG-2026-018梁板洞口附加筋调整.pdf', stored: false }], status: 'valid' },
  { id: 1503, type: 'contact', code: 'GCLXH-2026-027', title: '地下室设备房桥架弯通供货协调', building: '地下室', issuedBy: '孙明 · 机电工程师', issuedAt: shiftDateKey(dailyDateKey, -1), scope: '地下室 B2 区设备房', content: '请供应单位在次日08:00前补齐桥架弯通6个，并由材料员核对规格、数量及合格证明。', files: [{ name: '工程联系函-桥架弯通供货.pdf', stored: false }], status: 'valid' },
  { id: 1504, type: 'instruction', code: 'ZLD-2026-032', title: '浇筑前复核洞口及预埋', building: '3#楼', issuedBy: '周海 · 技术负责人', issuedAt: dailyDateKey, scope: '3#楼 8F 梁板', content: '混凝土浇筑前由土建、机电共同复核全部洞口及预埋件，形成签字记录后方可放行。', files: [{ name: 'ZLD-2026-032施工指令单.pdf', stored: false }], status: 'valid' }
];

const defaultCostDocuments = [
  { id: 1601, type: 'contract', code: 'HT-2026-015', title: '3#楼主体结构劳务分包合同', party: '贵州建工劳务有限公司', amount: '¥3,860,000', zone: '3#楼主体结构', issuedAt: shiftDateKey(dailyDateKey, -30), content: '约定3#楼主体结构钢筋、模板、混凝土劳务施工范围、综合单价、计量规则、付款节点及安全质量责任。', files: [{ name: '3号楼主体劳务分包合同.pdf', stored: false }], status: 'valid' },
  { id: 1602, type: 'economic', code: 'JJHD-2026-009', title: '3#楼8F洞口附加筋调整经济核定', party: '建设单位 / 总包单位', amount: '待核定', zone: '3#楼 8F 东侧设备洞口', issuedAt: dailyDateKey, content: '因设计变更SJBG-2026-018增加洞口附加钢筋，核定新增钢筋用量、人工投入及措施费用，作为后续结算依据。', files: [{ name: 'JJHD-2026-009经济核定单.pdf', stored: false }], status: 'pending' },
  { id: 1603, type: 'quantity', code: 'GCLQR-2026-021', title: '地下室B2区桥架变更工程量确认', party: '机电分包 / 现场施工员', amount: '¥28,600', zone: '地下室 B2 区设备房', issuedAt: shiftDateKey(dailyDateKey, -1), content: '现场共同确认桥架变更安装长度、弯通数量及支吊架增补工程量，附测量记录和签字照片。', files: [{ name: '地下室桥架现场工程量确认单.pdf', stored: false }], status: 'confirmed' }
];

const defaultDailyExecution = [
  { taskId: 1, dayPlanId: 3041, weekPlanId: 203, date: dailyDateKey, team: '钢筋班组', plannedWorkers: 22, actualWorkers: 20, progress: 65, actualQuantity: '梁板钢筋完成 18.6 t', materialPercent: 88, materialText: '钢筋已到场，复试报告待确认', documentDone: 3, documentTotal: 4, documentText: '复试报告待闭环', note: '东区梁板绑扎完成，等待西区收尾', technicalNotice: { type: '设计变更', code: 'SJBG-2026-018', title: '梁板洞口附加筋调整', detail: '3#楼8F东侧设备洞口附加筋按变更图施工，原节点做法停止使用。', issuedBy: '周海 · 技术负责人', issuedAt: `${dailyDateKey}T07:20:00+08:00`, requiredRoles: ['施工员', '钢筋班组'], acknowledgedBy: ['吴晨 · 施工员'] } },
  { taskId: 2, dayPlanId: 3042, weekPlanId: 204, date: dailyDateKey, team: '木工一班', plannedWorkers: 18, actualWorkers: 14, progress: 48, actualQuantity: '墙柱模板加固完成 12 跨', materialPercent: 100, materialText: '模板及加固材料满足', documentDone: 2, documentTotal: 2, documentText: '交底、检查记录齐全', note: '人员少 4 人，南侧墙柱待完成' },
  { taskId: 3, dayPlanId: 3043, weekPlanId: 205, date: dailyDateKey, team: '机电二组', plannedWorkers: 12, actualWorkers: 12, progress: 72, actualQuantity: '桥架安装完成 46 m', materialPercent: 70, materialText: '水平桥架够用，弯通缺 6 个', documentDone: 2, documentTotal: 3, documentText: '隐蔽验收记录待签字', note: 'B2区主通道完成，转入设备房' },
  { taskId: 4, dayPlanId: 3044, weekPlanId: 203, date: dailyDateKey, team: '混凝土班组', plannedWorkers: 16, actualWorkers: 16, progress: 20, actualQuantity: '浇筑前准备完成', materialPercent: 100, materialText: 'C35混凝土计划已审批', documentDone: 3, documentTotal: 5, documentText: '钢筋复试、隐蔽验收待闭环', note: '资料门禁未解除，暂不允许浇筑', technicalNotice: { type: '施工指令', code: 'ZLD-2026-032', title: '浇筑前复核洞口及预埋', detail: '混凝土浇筑前由土建、机电共同复核全部洞口及预埋件，签字后方可放行。', issuedBy: '周海 · 技术负责人', issuedAt: `${dailyDateKey}T08:05:00+08:00`, requiredRoles: ['土建工程师', '机电工程师', '混凝土班组'], acknowledgedBy: [] } },
  { taskId: 5, dayPlanId: 3045, weekPlanId: 207, date: dailyDateKey, team: '设备组', plannedWorkers: 2, actualWorkers: 2, progress: 100, actualQuantity: '日检 1 台', materialPercent: 100, materialText: '备件齐全', documentDone: 1, documentTotal: 1, documentText: '日检记录已归档', note: '运行正常' },
  { taskId: 6, dayPlanId: 3046, weekPlanId: 207, date: dailyDateKey, team: '文明施工班组', plannedWorkers: 6, actualWorkers: 6, progress: 100, actualQuantity: '东侧道路复查完成', materialPercent: 100, materialText: '雾炮及覆盖材料齐全', documentDone: 1, documentTotal: 1, documentText: '复查记录已完成', note: '扬尘控制正常' },
  ...[-4, -3, -2, -1].flatMap((offset, dayIndex) => defaultTasks.map((task, taskIndex) => {
    const progressMatrix = [[30,20,35,0,100,100],[42,30,45,0,100,100],[52,40,58,10,100,100],[65,48,72,20,100,100]];
    const progress = progressMatrix[dayIndex][taskIndex];
    return { taskId: task.id, dayPlanId: 3000 + dayIndex * 10 + task.id, weekPlanId: taskIndex === 0 || taskIndex === 3 ? 203 : taskIndex === 1 ? 204 : taskIndex === 2 ? 205 : 207, date: shiftDateKey(dailyDateKey, offset), team: task.owner, plannedWorkers: [22,18,12,16,2,6][taskIndex], actualWorkers: [22,17,12,16,2,6][taskIndex], progress, actualQuantity: progress >= 100 ? '按日计划完成' : `完成 ${progress}%`, materialPercent: 100, materialText: '当日材料满足', documentDone: 2, documentTotal: 2, documentText: '当日资料已核验', note: progress >= 100 ? '当日任务已闭环' : '剩余工作已转入次日跟踪' };
  }))
];

const defaultDailyCoordination = [
  { id: 1201, taskId: 3, category: '材料未到场', content: '地下室设备房桥架弯通还缺 6 个，明早 08:00 前需送到作业面。', requester: '机电二组', owner: '刘颖 · 材料员', due: `${dailyDateKey}T18:00`, status: 'pending', createdAt: new Date().toISOString() },
  { id: 1202, taskId: 2, category: '人员不足', content: '木工一班明日需补充 4 人，保证11F墙柱封模节点。', requester: '木工一班', owner: '王建国 · 生产经理', due: `${dailyDateKey}T19:00`, status: 'pending', createdAt: new Date().toISOString() },
  { id: 1203, taskId: 4, category: '验收未完成', content: '3#楼8F钢筋隐蔽验收及复试报告需在浇筑前闭环。', requester: '混凝土班组', owner: '赵磊 · 质量员', due: `${dailyDateKey}T20:00`, status: 'pending', createdAt: new Date().toISOString() }
];

const defaultAttendance = [
  { id: 701, date: '2026-08-09', registeredAt: '2026-08-09T18:00:00+08:00', actual: 186, planned: 190, officer: '赵敏 · 劳资员', note: '实名制打卡数据已核对，木工班组缺员 4 人', supplements: [], attachment: { name: '8月9日实名制打卡表.xlsx', stored: false } },
  { id: 702, date: '2026-08-08', registeredAt: '2026-08-08T18:00:00+08:00', actual: 183, planned: 188, officer: '赵敏 · 劳资员', note: '上午 3 人补录人脸考勤', supplements: [], attachment: { name: '8月8日实名制打卡表.xlsx', stored: false } },
  { id: 703, date: '2026-08-07', registeredAt: '2026-08-07T18:00:00+08:00', actual: 181, planned: 185, officer: '赵敏 · 劳资员', note: '雨后复工，机电班组到岗正常', supplements: [], attachment: { name: '8月7日实名制打卡表.xlsx', stored: false } },
  { id: 704, date: '2026-08-06', registeredAt: '2026-08-06T18:00:00+08:00', actual: 179, planned: 184, officer: '赵敏 · 劳资员', note: '钢筋班组缺勤 2 人', supplements: [], attachment: { name: '8月6日实名制打卡表.xlsx', stored: false } },
  { id: 705, date: '2026-08-05', registeredAt: '2026-08-05T18:00:00+08:00', actual: 176, planned: 180, officer: '赵敏 · 劳资员', note: '考勤纪律正常', supplements: [], attachment: { name: '8月5日实名制打卡表.xlsx', stored: false } },
  { id: 706, date: '2026-08-04', registeredAt: '2026-08-04T18:00:00+08:00', actual: 172, planned: 178, officer: '赵敏 · 劳资员', note: '分包单位完成新进人员实名登记', supplements: [], attachment: { name: '8月4日实名制打卡表.xlsx', stored: false } }
];

const defaultSafetyInspections = Array.from({ length: 12 }, (_, index) => {
  const kinds = ['临边防护专项巡检', '临时用电专项巡检', '消防器材专项巡检', '起重设备专项巡检'];
  const locations = ['3#楼', '2#楼', '地下室', '加工区'];
  const closed = index !== 0;
  const owner = '周强 · 安全员';
  const baseIssues = index === 0 ? [
    { id: 8011, title: '东侧临边踢脚板局部松动', location: '3#楼 8F 东侧', owner, status: 'pending', reply: '待班组重新固定并由安全员复查。', beforeAttachments: [], afterAttachments: [] },
    { id: 8012, title: '南侧安全网绑扎点间距偏大', location: '3#楼 8F 南侧', owner, status: 'rectifying', reply: '已安排架子工班组加密绑扎点。', beforeAttachments: [], afterAttachments: [] },
    { id: 8013, title: '楼梯口警示标识缺失', location: '3#楼 7F 楼梯口', owner, status: 'closed', reply: '已补设警示标识并完成复查。', beforeAttachments: [], afterAttachments: [{ name: '楼梯口整改后.jpg', stored: false }] }
  ] : [{ id: 8100 + index, title: `${kinds[index % 4]}发现项`, location: locations[index % 4], owner, status: 'closed', reply: '已逐项核查并完成整改复验。', beforeAttachments: [], afterAttachments: [{ name: '整改后照片.jpg', stored: false }] }];
  return {
    id: 800 + index,
    title: kinds[index % 4],
    date: index < 4 ? '2026-08-10' : index < 8 ? '2026-08-09' : '2026-08-08',
    location: locations[index % 4],
    inspector: owner,
    status: closed ? 'closed' : 'rectifying',
    unifiedReply: closed ? '本次巡检发现问题已完成统一回复并逐项复验。' : '已下发整改通知，等待全部问题整改完成后统一回复。',
    recordAttachments: [],
    noticeAttachments: closed ? [{ name: '安全隐患整改通知单.pdf', stored: false }] : [],
    replyAttachments: closed ? [{ name: '安全隐患整改回复单.pdf', stored: false }] : [],
    issues: baseIssues
  };
});

const serverMode = Boolean(window.ZhuxuServer?.active);
let tasks = JSON.parse(localStorage.getItem('zhuxu-tasks') || 'null') || (serverMode ? [] : defaultTasks);
tasks = tasks.map(task => task.id === 1 && task.title === '3#楼 8F 梁板钢筋验收' ? { ...task, title: '3#楼 8F 梁板钢筋绑扎及验收', status: task.status === 'risk' ? 'todo' : task.status } : task);
tasks = tasks.map(task => ({ creator: task.creator || '项目管理人员', taskType: task.taskType || '施工任务', ...task }));
let documentState = JSON.parse(localStorage.getItem('zhuxu-document-state') || 'null') || (serverMode ? {} : structuredClone(defaultDocumentState));
let followups = JSON.parse(localStorage.getItem('zhuxu-followups') || 'null') || (serverMode ? [] : defaultFollowups);
let organization = JSON.parse(localStorage.getItem('zhuxu-organization') || 'null') || (serverMode ? [] : defaultOrganization);
let plans = JSON.parse(localStorage.getItem('zhuxu-plans') || 'null') || (serverMode ? [] : defaultPlans);
let resourceEntries = JSON.parse(localStorage.getItem('zhuxu-resource-entries') || 'null') || (serverMode ? [] : defaultResourceEntries);
let resourcePlans = JSON.parse(localStorage.getItem('zhuxu-resource-plans') || 'null') || (serverMode ? [] : defaultResourcePlans);
let concealedAcceptances = JSON.parse(localStorage.getItem('zhuxu-concealed-acceptances') || 'null') || (serverMode ? [] : defaultConcealedAcceptances);
let qualityChecks = JSON.parse(localStorage.getItem('zhuxu-quality-checks') || 'null') || (serverMode ? [] : defaultQualityChecks);
let attendanceRecords = JSON.parse(localStorage.getItem('zhuxu-attendance') || 'null') || (serverMode ? [] : defaultAttendance);
let laborers = JSON.parse(localStorage.getItem('zhuxu-laborers') || 'null') || [];
let safetyInspections = JSON.parse(localStorage.getItem('zhuxu-safety-inspections') || 'null') || (serverMode ? [] : defaultSafetyInspections);
let siteRecords = JSON.parse(localStorage.getItem('zhuxu-site-records') || 'null') || [];
let intakeRecords = JSON.parse(localStorage.getItem('zhuxu-intake-records') || 'null') || (serverMode ? [] : defaultIntakeRecords);
let technicalDocuments = JSON.parse(localStorage.getItem('zhuxu-technical-documents') || 'null') || (serverMode ? [] : defaultTechnicalDocuments);
technicalDocuments = technicalDocuments.map(item => ({ ...item, building: item.building || technicalBuildingName(item) }));
let drawingBuildings = JSON.parse(localStorage.getItem('zhuxu-drawing-buildings') || '[]') || [];
let costDocuments = JSON.parse(localStorage.getItem('zhuxu-cost-documents') || 'null') || (serverMode ? [] : defaultCostDocuments);
let dailyExecution = JSON.parse(localStorage.getItem('zhuxu-daily-execution') || 'null') || (serverMode ? [] : defaultDailyExecution);
let dailyCoordination = JSON.parse(localStorage.getItem('zhuxu-daily-coordination') || 'null') || (serverMode ? [] : defaultDailyCoordination);
if (!serverMode) {
  defaultOrganization.forEach(defaultPerson => {
    if (!organization.some(person => person.role === defaultPerson.role)) organization.push(defaultPerson);
  });
  defaultPlans.filter(item => item.level === 'week').forEach(defaultPlan => {
    const index = plans.findIndex(item => Number(item.id) === Number(defaultPlan.id));
    if (index < 0) plans.push(structuredClone(defaultPlan));
    else if (plans[index].end < dailyDateKey || plans[index].start > dailyDateKey) plans[index] = { ...plans[index], start: defaultPlan.start, end: defaultPlan.end, weight: defaultPlan.weight };
  });
  defaultPlans.filter(item => item.level === 'day').forEach(defaultPlan => {
    if (!plans.some(item => Number(item.id) === Number(defaultPlan.id))) plans.push(structuredClone(defaultPlan));
  });
  defaultDailyExecution.forEach(defaultRecord => {
    const existing = dailyExecution.find(item => Number(item.taskId) === Number(defaultRecord.taskId) && item.date === defaultRecord.date);
    if (!existing) dailyExecution.push(structuredClone(defaultRecord));
    else if (!existing.dayPlanId) Object.assign(existing, { dayPlanId: defaultRecord.dayPlanId, weekPlanId: defaultRecord.weekPlanId });
  });
  Object.entries(defaultDocumentState).forEach(([key, defaults]) => {
    if (!documentState[key]) documentState[key] = structuredClone(defaults);
    else documentState[key] = { ...structuredClone(defaults), ...documentState[key], commissionAttachments: documentState[key].commissionAttachments || [], reportAttachments: documentState[key].reportAttachments || [] };
  });
  organization = organization.map((person, index) => ({ phone: defaultOrganization.find(item => item.role === person.role)?.phone || `138 0000 ${String(1100 + index)}`, ...person }));
}
attendanceRecords = attendanceRecords.map(record => ({ supplements: [], registeredAt: `${record.date}T18:00:00+08:00`, ...record }));
const AUTH_SESSION_KEY = 'zhuxu-auth-session';
const AUTH_REMEMBER_KEY = 'zhuxu-auth-remember';
const currentProject = serverMode ? (window.ZhuxuServer?.user?.project || { id: '', name: '项目管理系统' }) : { id: 'offline', name: '云河智造中心一期' };
let authenticatedUserId = sessionStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(AUTH_REMEMBER_KEY) || '';
let currentUserId = authenticatedUserId || (serverMode ? '' : 'pm');
if (!serverMode && !organization.some(person => String(person.id) === String(currentUserId))) currentUserId = organization[0]?.id || '';
if (!serverMode && !organization.some(person => String(person.id) === String(authenticatedUserId))) authenticatedUserId = '';
const approvalSequenceRoles = ['提报人', '生产经理', '技术负责人', '库管', '项目经理'];
function markRequesterApproval(workflow = [], plan = {}) {
  const requesterStep = workflow.find(step => step.role === '提报人');
  if (!requesterStep) return workflow;
  requesterStep.status = 'approved';
  requesterStep.actedAt = requesterStep.actedAt || plan.createdAt || new Date().toISOString();
  requesterStep.actedBy = requesterStep.actedBy || requesterStep.owner || plan.requester || '';
  requesterStep.actedByAccount = requesterStep.actedByAccount || '';
  return workflow;
}
resourcePlans = resourcePlans.map(plan => {
  if (plan.type !== 'material') return plan;
  const existingWorkflow = Array.isArray(plan.approvalWorkflow) ? plan.approvalWorkflow : [];
  const sequenceMatches = approvalSequenceRoles.every((role, index) => existingWorkflow[index]?.role === role) && existingWorkflow.length === approvalSequenceRoles.length;
  const defaultPlan = defaultResourcePlans.find(item => Number(item.id) === Number(plan.id) && item.type === 'material');
  const requester = plan.requester || existingWorkflow.find(step => step.role === '提报人')?.owner || existingWorkflow[0]?.owner || resolveOrganizationOwner(plan.ownerRole || '材料员');
  const purchaser = plan.purchaser || matchPersonByRole('采购员');
  const migratedWorkflow = defaultPlan?.approvalWorkflow ? structuredClone(defaultPlan.approvalWorkflow) : [
    { role: '提报人', owner: requester, status: 'pending' },
    { role: '生产经理', owner: matchPersonByRole('生产经理'), status: 'pending' },
    { role: '技术负责人', owner: matchPersonByRole('技术负责人'), status: 'pending' },
    { role: '库管', owner: matchPersonByRole('库管'), status: 'pending' },
    { role: '项目经理', owner: matchPersonByRole('项目经理'), status: 'pending' }
  ];
  const normalizedWorkflow = (sequenceMatches ? existingWorkflow : migratedWorkflow).map(step => ({
    ...step,
    ownerId: step.ownerId || organization.find(person => `${person.name} · ${person.role}` === step.owner)?.id || ''
  }));
  markRequesterApproval(normalizedWorkflow, plan);
  return { contractBrandRequired: false, contractBrand: '', approvalAttachments: [], ...plan, requester: sequenceMatches ? requester : normalizedWorkflow[0].owner, purchaser, approvalAttachments: plan.approvalAttachments || [], approvalWorkflow: normalizedWorkflow };
});
concealedAcceptances = concealedAcceptances.map(item => ({ documentAttachments: [], photoAttachments: [], status: 'pending', ...item }));
resourceEntries.filter(entry => entry.type === 'material' && entry.movement === '进场').forEach(entry => {
  const existingKey = Object.keys(documentState).find(key => Number(documentState[key].materialEntryId) === Number(entry.id));
  const key = existingKey || `material-${entry.id}`;
  const resultId = `${key}-report`;
  if (!existingKey) documentState[key] = { sampleStatus: 'testing', linkedProcess: `${entry.location}关联施工`, materialEntryId: entry.id, commissionAttachments: [], reportAttachments: [], documents: [
      { id: `${key}-certificate`, name: `${entry.name}合格证明`, trigger: `${entry.name}进场`, owner: '材料员', due: '进场当日', status: entry.attachments?.length ? 'done' : 'pending' },
      { id: `${key}-entry`, name: `${entry.name}进场验收记录`, trigger: `${entry.name}进场`, owner: '材料员', due: '进场当日', status: 'done' },
      { id: `${key}-commission`, name: `${entry.name}送检委托单`, trigger: `${entry.name}进场`, owner: '试验员', due: '24小时内', status: 'pending' },
      { id: resultId, name: `${entry.name}检测报告`, trigger: '委托送检', owner: '资料员', due: '使用前', status: 'pending' }
    ] };
  if (!documentChainConfigs[key]) documentChainConfigs[key] = { label: entry.name, icon: '材', resultDocumentId: documentState[key].documents.at(-1).id, resultName: `${entry.name}检测报告`, processName: `${entry.location}施工`, question: `本批${entry.name}检测报告是否合格？`, warning: `未取得${entry.name}合格报告前，不应在${entry.location}投入使用。`, steps: [['材料进场', '台账已登记'], ['委托送检', '等待上传委托'], ['检测报告', '等待检测结果'], ['投入使用', '资料门禁控制']] };
});
Object.entries(documentState).forEach(([key, group]) => {
  if (!group.materialEntryId || group.documents.some(item => item.name.includes('进场验收记录'))) return;
  const entry = resourceEntries.find(item => Number(item.id) === Number(group.materialEntryId));
  group.documents.splice(1, 0, { id: `${key}-entry`, name: `${entry?.name || documentChainConfigs[key]?.label || '材料'}进场验收记录`, trigger: `${entry?.name || '材料'}进场`, owner: '材料员', due: '进场当日', status: 'done' });
});
localStorage.setItem('zhuxu-document-state', JSON.stringify(documentState));
let activeFilter = 'all';
let activeDocumentChain = 'steel';
let activeGateChain = 'steel';
let activePlanLevel = 'week';
let activeResourceTab = 'materials';
let activeQualityFilter = 'all';
let activeIntakeFilter = 'all';
let activeTechnicalFilter = 'all';
let activeTechnicalBuilding = 'all';
let activeTechnicalProfession = 'all';
let activeTechnicalSearch = '';
let activeCostFilter = 'all';
let activeExecutionDate = dailyDateKey;
let dailyMeetingDate = dailyDateKey;
let dailyMeetingPlanDraft = [];
let dailyMeetingCoordinationDraft = [];
let dailyMeetingTodayDraft = [];
let activeScheduleMonth = Number(dailyDateKey.slice(5, 7));
let activeScheduleYear = Number(dailyDateKey.slice(0, 4));
let editingResourcePlanId = null;
let resourceEntryBatchDraft = [];
let editingConcealedAcceptanceId = null;
let editingQualityId = null;
let editingInspectionId = null;
let editingTaskId = null;
let editingPlanId = null;
let editingTechnicalDocumentId = null;
let editingIntakeId = null;
let editingLaborerId = null;
let planRecognitionCandidates = [];
let planAttachmentsDraft = [];
let planSubtasksDraft = [];
let planDayRowsDraft = [];
let pendingPeriodPlanUpload = null;
let planPreviewUrls = [];
let planUndoStack = [];
let taskRecognitionCandidates = [];
let selectedPhotos = [];
let pendingTaskTransition = null;
let voiceRecognition = null;
const RECORD_DB_NAME = 'zhuxu-site-records';
const RECORD_STORE_NAME = 'records';
const RESOURCE_ATTACHMENT_STORE_NAME = 'resource-attachments';
let activeAttachmentUrl = null;
let mustChangePassword = false;
let serverAccounts = [];
let pendingDrawingFiles = [];
let technicalFilesDraft = [];
let linkingTechnicalTaskId = null;
let linkingTechnicalTaskDate = null;
let weatherConfig = JSON.parse(localStorage.getItem('zhuxu-weather-config') || 'null') || { city: '兰州', latitude: 36.06, longitude: 103.83 };
let weatherData = JSON.parse(localStorage.getItem('zhuxu-weather') || 'null') || null;
let weatherArchive = JSON.parse(localStorage.getItem('zhuxu-weather-archive') || '{}') || {};
let weatherMilestones = JSON.parse(localStorage.getItem('zhuxu-weather-milestones') || 'null') || (serverMode ? [] : [
  { id: 1601, title: '计划开工日期', date: `${activeScheduleYear}-03-01`, type: 'planned', note: '经批准的项目总进度计划开工节点。' },
  { id: 1602, title: '实际开工日期', date: `${activeScheduleYear}-03-06`, type: 'actual', note: '现场正式开始施工作业。' },
  { id: 1603, title: '基础验收', date: `${activeScheduleYear}-06-18`, type: 'acceptance', note: '基础分部工程验收节点。' },
  { id: 1604, title: '主体结构验收', date: `${activeScheduleYear}-11-20`, type: 'acceptance', note: '主体结构分部工程计划验收节点。' },
  { id: 1605, title: '主体封顶', date: `${activeScheduleYear}-12-08`, type: 'milestone', note: '主体结构封顶里程碑。' }
]);
let activeWeatherMonth = Number(dailyDateKey.slice(5, 7));
let activeWeatherMilestoneId = null;

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

function syncServerState(key, value) {
  if (!window.ZhuxuServer?.active || !authenticatedUserId || mustChangePassword) return;
  window.ZhuxuServer.saveState(key, value).then(() => {
    $('.sync-state span') && ($('.sync-state span').textContent = '局域网数据已同步');
    $('.sync-state i')?.classList.remove('offline');
  }).catch(() => {
    $('.sync-state span') && ($('.sync-state span').textContent = '服务器同步失败');
    $('.sync-state i')?.classList.add('offline');
  });
}

function syncAllLocalState() {
  if (!window.ZhuxuServer?.active || !authenticatedUserId || mustChangePassword) return;
  persistTasks(); persistDocumentState(); persistOrganization(); persistPlans(); persistConcealedAcceptances();
  persistQualityChecks(); persistAttendance(); persistSafetyInspections(); persistSiteRecords(); persistIntakeRecords(); persistTechnicalDocuments(); persistCostDocuments(); persistDailyExecution(); persistDailyCoordination();
  persistDrawingBuildings(); persistLaborers();
}

function persistOrganization() { localStorage.setItem('zhuxu-organization', JSON.stringify(organization)); syncServerState('zhuxu-organization', organization); }
function persistPlans() { localStorage.setItem('zhuxu-plans', JSON.stringify(plans)); syncServerState('zhuxu-plans', plans); }
function persistMaterialEntries() {
  localStorage.setItem('zhuxu-resource-entries', JSON.stringify(resourceEntries));
  syncServerState('zhuxu-resource-entries', resourceEntries);
}
function persistResources() {
  localStorage.setItem('zhuxu-resource-entries', JSON.stringify(resourceEntries));
  localStorage.setItem('zhuxu-resource-plans', JSON.stringify(resourcePlans));
  syncServerState('zhuxu-resource-entries', resourceEntries);
  syncServerState('zhuxu-resource-plans', resourcePlans);
}
function persistConcealedAcceptances() { localStorage.setItem('zhuxu-concealed-acceptances', JSON.stringify(concealedAcceptances)); syncServerState('zhuxu-concealed-acceptances', concealedAcceptances); }
function persistQualityChecks() { localStorage.setItem('zhuxu-quality-checks', JSON.stringify(qualityChecks)); syncServerState('zhuxu-quality-checks', qualityChecks); }
function persistAttendance() { localStorage.setItem('zhuxu-attendance', JSON.stringify(attendanceRecords)); syncServerState('zhuxu-attendance', attendanceRecords); }
function persistLaborers() { localStorage.setItem('zhuxu-laborers', JSON.stringify(laborers)); syncServerState('zhuxu-laborers', laborers); }
function persistSafetyInspections() { localStorage.setItem('zhuxu-safety-inspections', JSON.stringify(safetyInspections)); syncServerState('zhuxu-safety-inspections', safetyInspections); }
function persistSiteRecords() { localStorage.setItem('zhuxu-site-records', JSON.stringify(siteRecords)); syncServerState('zhuxu-site-records', siteRecords); }
function persistIntakeRecords() {
  localStorage.setItem('zhuxu-intake-records', JSON.stringify(intakeRecords));
  syncServerState('zhuxu-intake-records', intakeRecords);
}
function persistTechnicalDocuments() {
  localStorage.setItem('zhuxu-technical-documents', JSON.stringify(technicalDocuments));
  syncServerState('zhuxu-technical-documents', technicalDocuments);
  if ($('#technicalBadge')) $('#technicalBadge').textContent = technicalDocuments.length;
}
function persistDrawingBuildings() {
  drawingBuildings = [...new Set(drawingBuildings.map(item => String(item).trim()).filter(Boolean))];
  localStorage.setItem('zhuxu-drawing-buildings', JSON.stringify(drawingBuildings));
  syncServerState('zhuxu-drawing-buildings', drawingBuildings);
}
function persistCostDocuments() {
  if (authenticatedUserId && !hasCostAccess()) { updateCostAccessUI(); return; }
  localStorage.setItem('zhuxu-cost-documents', JSON.stringify(costDocuments));
  syncServerState('zhuxu-cost-documents', costDocuments);
  if ($('#costBadge')) $('#costBadge').textContent = costDocuments.length;
}
function persistDailyExecution() { localStorage.setItem('zhuxu-daily-execution', JSON.stringify(dailyExecution)); syncServerState('zhuxu-daily-execution', dailyExecution); }
function persistDailyCoordination() { localStorage.setItem('zhuxu-daily-coordination', JSON.stringify(dailyCoordination)); syncServerState('zhuxu-daily-coordination', dailyCoordination); updateDailyBadge(); }
function updateDailyBadge() {
  const pending = dailyCoordination.filter(item => item.status !== 'resolved');
  if ($('#dailyBadge')) $('#dailyBadge').textContent = pending.length;
  const tomorrow = shiftDateKey(dailyDateKey, 1);
  if ($('#meetingBadge')) $('#meetingBadge').textContent = pending.filter(item => String(item.due || '').startsWith(tomorrow)).length;
}

function ensureMaterialDocumentChain(entry) {
  if (!entry || entry.type !== 'material' || entry.movement !== '进场') return null;
  const responsible = matchResponsible(`${entry.name || ''} ${entry.location || ''}`);
  const documentClerk = organization.find(person => person.role === '资料员') || null;
  entry.materialDocumentReview = entry.materialDocumentReview || {
    status: 'pending',
    missingItems: [],
    reviewer: documentClerk ? organizationPersonLabel(documentClerk) : '',
    materialClerk: matchPersonByRole('材料员'),
    foreman: responsible?.owner || matchPersonByRole('施工员'),
    reviewedAt: '',
    feedbackAt: '',
    closedAt: ''
  };
  let key = Object.keys(documentState).find(item => Number(documentState[item].materialEntryId) === Number(entry.id));
  if (!key) {
    key = `material-${entry.id}`;
    const resultId = `${key}-report`;
    documentState[key] = { sampleStatus: 'testing', linkedProcess: `${entry.location}关联施工`, materialEntryId: entry.id, commissionAttachments: [], reportAttachments: [], documents: [
      { id: `${key}-certificate`, name: `${entry.name}合格证明`, trigger: `${entry.name}进场`, owner: '资料员', due: '进场资料核查', status: entry.materialDocumentReview.status === 'complete' ? 'done' : 'pending' },
      { id: `${key}-entry`, name: `${entry.name}进场验收记录`, trigger: `${entry.name}进场`, owner: '材料员', due: '进场当日', status: 'done' },
      { id: `${key}-commission`, name: `${entry.name}送检委托单`, trigger: `${entry.name}进场`, owner: '试验员', due: '24小时内', status: 'pending' },
      { id: resultId, name: `${entry.name}检测报告`, trigger: '委托送检', owner: '资料员', due: '使用前', status: 'pending' }
    ] };
  }
  if (!documentChainConfigs[key]) documentChainConfigs[key] = { label: entry.name, icon: '材', resultDocumentId: documentState[key].documents.at(-1).id, resultName: `${entry.name}检测报告`, processName: `${entry.location}施工`, question: `本批${entry.name}检测报告是否合格？`, warning: `未取得${entry.name}合格报告前，不应在${entry.location}投入使用。`, steps: [['材料进场', '台账已登记'], ['委托送检', '等待上传委托'], ['检测报告', '等待检测结果'], ['投入使用', '资料门禁控制']] };
  return key;
}

function parseResourceQuantity(quantity = '') {
  const match = String(quantity).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  const value = match ? Number(match[0]) : 0;
  const unit = String(quantity).replace(match?.[0] || '', '').trim() || '单位';
  return { value, unit };
}

function formatResourceQuantity(value, unit) {
  const rounded = Math.round(Math.max(0, value) * 100) / 100;
  return `${rounded.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} ${unit === '单位' ? '' : unit}`.trim();
}

function normalizeResourceText(value = '') {
  return String(value).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function resourceMatchScore(entry, plan) {
  if (!entry || entry.type !== plan.type) return -1;
  const entryName = normalizeResourceText(entry.name);
  const planName = normalizeResourceText(plan.name);
  let score = entryName === planName ? 10 : (entryName.length >= 4 && planName.length >= 4 && (entryName.includes(planName) || planName.includes(entryName)) ? 6 : 0);
  const entryLocation = normalizeResourceText(entry.location);
  const planLocation = normalizeResourceText(plan.location);
  if (entryLocation && planLocation && entryLocation === planLocation) score += 4;
  else if (entryLocation && planLocation && (entryLocation.includes(planLocation) || planLocation.includes(entryLocation))) score += 2;
  return score;
}

function getResourcePlanProgress(plan) {
  const planned = parseResourceQuantity(plan.quantity);
  const linkedEntries = resourceEntries.filter(entry => Number(entry.planId) === Number(plan.id));
  const arrived = linkedEntries.reduce((total, entry) => {
    const quantity = parseResourceQuantity(entry.quantity).value;
    return total + (entry.movement === '退场' ? -quantity : quantity);
  }, 0);
  const arrivedValue = Math.max(0, arrived);
  const remaining = Math.max(0, planned.value - arrivedValue);
  const percent = planned.value ? Math.min(100, Math.round(arrivedValue / planned.value * 100)) : 0;
  const due = new Date(`${plan.due}T00:00:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.ceil((due - today) / 86400000);
  const complete = planned.value > 0 && remaining <= 0.0001;
  let status = '未到场'; let tone = 'neutral'; let notice = `距要求到场还有 ${days} 天`;
  if (complete) { status = '已到场'; tone = 'complete'; notice = '计划数量已全部到场'; }
  else if (arrivedValue > 0) { status = '部分到场'; tone = days <= 2 ? 'urgent' : 'partial'; notice = `尚缺 ${formatResourceQuantity(remaining, planned.unit)}`; }
  else if (days < 0) { status = '已逾期'; tone = 'overdue'; notice = `已逾期 ${Math.abs(days)} 天仍未到场`; }
  else if (days <= 2) { status = '临近到场'; tone = 'urgent'; notice = `${days === 0 ? '今天' : `${days} 天后`}要求到场，尚未登记`; }
  else if (days <= 7) { status = '一周预报'; tone = 'warning'; notice = `${days} 天后要求到场，请确认供应`; }
  return { planned, arrived: arrivedValue, remaining, percent, days, complete, status, tone, notice, linkedEntries };
}

function findBestResourcePlan(entry) {
  return resourcePlans
    .map(plan => ({ plan, score: resourceMatchScore(entry, plan), progress: getResourcePlanProgress(plan) }))
    .filter(item => !item.progress.complete && item.score >= 6)
    .sort((a, b) => b.score - a.score || new Date(a.plan.due) - new Date(b.plan.due))[0]?.plan || null;
}

function reconcileResourcePlans() {
  resourceEntries.forEach(entry => {
    if (entry.movement !== '进场' || entry.planId) return;
    const match = findBestResourcePlan(entry);
    if (match && normalizeResourceText(entry.name) === normalizeResourceText(match.name)) entry.planId = match.id;
  });
}

reconcileResourcePlans();

function renderOrganization() {
  $('#organizationRoles').innerHTML = organization.slice(0, 6).map(person => `<span class="role-chip"><b>${person.role}</b>${person.name}</span>`).join('');
  $('#organizationOwners').innerHTML = organization.map(person => `<option value="${person.name} · ${person.role}"></option>`).join('');
  $('#organizationEditor').innerHTML = organization.length ? organization.map(person => `<div class="organization-person" data-person-id="${person.id}"><input name="personName" value="${person.name}" aria-label="${person.role}姓名"><select name="personRole" aria-label="${person.name}职位">${defaultOrganization.map(item => `<option ${item.role === person.role ? 'selected' : ''}>${item.role}</option>`).join('')}</select><input name="personPhone" value="${person.phone || ''}" aria-label="${person.name}电话号码" placeholder="电话号码"><input name="personScope" value="${person.scope || ''}" aria-label="${person.name}管理范围" placeholder="管理范围"><small>${person.account}</small></div>`).join('') : '<p class="resource-empty">尚未建立组织机构。请由项目经理在“组织架构 → 账号管理”中新增人员，系统将自动生成登录账号。</p>';
  renderCurrentUser();
}

function getCurrentUser() {
  return organization.find(person => String(person.id) === String(currentUserId)) || organization[0] || null;
}

const COST_ACCESS_ROLE_PATTERN = /项目经理|商务|成本|造价/;

function hasCostAccess(person = getCurrentUser()) {
  const serverPermission = window.ZhuxuServer?.user?.permissions?.cost;
  if (typeof serverPermission === 'boolean' && String(window.ZhuxuServer.user.id) === String(person?.id)) return serverPermission;
  return Boolean(authenticatedUserId && person && COST_ACCESS_ROLE_PATTERN.test(String(person.role || '')));
}

function updateCostAccessUI() {
  const nav = $('[data-view="cost"]');
  const badge = $('#costBadge');
  if (!nav || !badge) return;
  const allowed = hasCostAccess();
  nav.classList.toggle('access-locked', !allowed);
  nav.setAttribute('aria-label', allowed ? '成控文件' : '成控文件，当前岗位无访问权限');
  nav.title = allowed ? '进入成控文件' : '仅项目经理、商务、成本或造价岗位可进入';
  badge.textContent = allowed ? costDocuments.length : '锁';
}

function openCostAccessDenied() {
  const person = getCurrentUser();
  $('#costAccessCurrentRole').textContent = `当前账号：${person?.name || '未登录'} · ${person?.role || '未知岗位'}`;
  $('#costAccessDialog').showModal();
  closeSidebar();
}

function organizationPersonLabel(person) {
  return person ? `${person.name} · ${person.role}` : '';
}

function isCurrentUserApprovalOwner(step) {
  const user = getCurrentUser();
  if (!authenticatedUserId || !user || !step) return false;
  return step.ownerId ? String(step.ownerId) === String(user.id) : step.owner === organizationPersonLabel(user);
}

function initialPasswordFor(person) {
  const digits = String(person?.phone || '').replace(/\D/g, '');
  return digits.length >= 6 ? digits.slice(-6) : '';
}

function setAuthenticationView(isAuthenticated) {
  const needsInit = Boolean(window.ZhuxuServer?.active && window.ZhuxuServer.needsInit && !authenticatedUserId);
  document.body.classList.remove('auth-pending', 'auth-locked', 'auth-init', 'authenticated');
  document.body.classList.add(needsInit ? 'auth-init' : isAuthenticated ? 'authenticated' : 'auth-locked');
  $('#appShell').setAttribute('aria-hidden', isAuthenticated ? 'false' : 'true');
  if (!isAuthenticated) setTimeout(() => (needsInit ? $('#initForm').elements.projectName : $('#loginForm').elements.account).focus(), 0);
}

function populateLoginProjects() {
  if (!window.ZhuxuServer?.active || authenticatedUserId) return;
  const select = $('#loginProjectSelect');
  const projects = window.ZhuxuServer.projects || [];
  if (!select) return;
  const remembered = localStorage.getItem('zhuxu-auth-project') || '';
  select.innerHTML = projects.map(project => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.name)}${project.code ? `（${escapeHtml(project.code)}）` : ''}</option>`).join('');
  if (projects.some(project => project.id === remembered)) select.value = remembered;
  if (!select.value && select.options[0]) select.selectedIndex = 0;
  if (select.selectedOptions[0]) $('#loginProjectName').textContent = select.selectedOptions[0].textContent.trim();
}

async function loginWithCredentials(account, password, remember = false, projectId = '') {
  if (window.ZhuxuServer?.active) {
    const user = await window.ZhuxuServer.login(account, password, projectId, remember);
    authenticatedUserId = String(user.id);
    currentUserId = authenticatedUserId;
    return { ...user, serverReload: true };
  }
  const normalizedAccount = String(account || '').trim().toLowerCase();
  const person = organization.find(item => String(item.account || '').toLowerCase() === normalizedAccount);
  if (!person || !initialPasswordFor(person) || String(password || '') !== initialPasswordFor(person)) return null;
  authenticatedUserId = String(person.id);
  currentUserId = authenticatedUserId;
  costDocuments = hasCostAccess(person) ? (JSON.parse(localStorage.getItem('zhuxu-cost-documents') || 'null') || defaultCostDocuments) : [];
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_REMEMBER_KEY);
  (remember ? localStorage : sessionStorage).setItem(remember ? AUTH_REMEMBER_KEY : AUTH_SESSION_KEY, authenticatedUserId);
  renderCurrentUser();
  setAuthenticationView(true);
  navigate('intake');
  return person;
}

async function logoutCurrentUser() {
  await window.ZhuxuServer?.logout?.();
  authenticatedUserId = '';
  mustChangePassword = false;
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_REMEMBER_KEY);
  $$('dialog[open]').forEach(dialog => dialog.close());
  closeSidebar();
  const form = $('#loginForm');
  form.reset();
  $('#loginError').textContent = '';
  setAuthenticationView(false);
}

function currentUserNotifications() {
  return ZhuxuMeetingRules.todos({ 'zhuxu-followups': followups, 'zhuxu-daily-coordination': dailyCoordination, 'zhuxu-resource-plans': resourcePlans, 'zhuxu-document-state': documentState, 'zhuxu-quality-checks': qualityChecks }, getCurrentUser());
}

async function openTodoDialog() {
  const dialog = $('#todoDialog');
  $$('dialog[open]').forEach(item => { if (item !== dialog) item.close(); });
  $('#todoDialogTitle').textContent = ZhuxuMeetingRules.canSeeAll(getCurrentUser()) ? '项目全部待办' : '我的待办';
  $('#todoDialogScope').textContent = '正在读取待办事项…';
  $('#todoDialogBody').replaceChildren();
  if (!dialog.open) dialog.showModal();
  try {
    const items = window.ZhuxuServer?.active ? (await window.ZhuxuServer.request('/api/todos')).items : currentUserNotifications();
    $('#todoDialogScope').textContent = `共 ${items.length} 项待办；${ZhuxuMeetingRules.canSeeAll(getCurrentUser()) ? '你可以查看当前项目全部待办' : '仅显示分配给你的待办'}`;
    $('#notificationButton b').textContent = String(items.length);
    $('#todoDialogBody').innerHTML = items.map((item, index) => `<article class="user-notification"><i>!</i><div><strong>${escapeHtml(item.title || '待办理事项')}</strong><small>${escapeHtml(item.category)} · 责任人：${escapeHtml(item.owner || '待指定')}</small><p>${escapeHtml(item.note || '')}${item.due ? ` · 时限：${escapeHtml(item.due)}` : ''}</p><button type="button" class="secondary-button" data-todo-index="${index}">查看事项</button></div></article>`).join('') || '<p class="resource-empty">暂无待办事项</p>';
    $$('[data-todo-index]', dialog).forEach(button => button.addEventListener('click', () => {
      const item = items[Number(button.dataset.todoIndex)]; dialog.close();
      if (item.target === 'material') openResourceEntryDetail(item.targetId);
      else if (item.target === 'plan') openResourcePlanDetail(item.targetId);
      else if (item.target === 'documents') { activeDocumentChain = item.targetId; navigate('documents'); }
      else if (item.target === 'quality') { navigate('quality'); openQualityCheckDialog(qualityChecks.find(row => String(row.id) === String(item.targetId))); }
      else if (item.target === 'coordination') { activeExecutionDate = String(item.due || dailyDateKey).slice(0, 10); navigate('intake'); $('.tomorrow-coordination')?.scrollIntoView({ block: 'start' }); }
      else {
        $('#todoDialogTitle').textContent = item.title || '待办详情';
        $('#todoDialogScope').textContent = `责任人：${item.owner || '待指定'}`;
        $('#todoDialogBody').innerHTML = `<p>${escapeHtml(item.note || item.relatedTask || '暂无补充说明')}</p><p>时限：${escapeHtml(item.due || '未指定')} · 状态：${escapeHtml(item.status || '待处理')}</p>`;
        dialog.showModal();
      }
    }));
  } catch (error) { $('#todoDialogScope').textContent = `待办读取失败：${error.message || '请重试'}`; }
}

function renderCurrentUser() {
  const person = getCurrentUser();
  if (!person || !$('#currentUserCard')) return;
  $('#currentUserAvatar').textContent = person.name.slice(0, 1);
  $('#currentUserName').textContent = person.name;
  $('#currentUserRole').textContent = person.role;
  $('#accountSwitcherButton').title = `当前账号：${person.account || person.name}，点击退出`;
  const notifications = currentUserNotifications();
  $('#notificationButton b').textContent = String(notifications.length);
  $('#notificationButton').setAttribute('aria-label', `查看待办事项，共 ${notifications.length} 项`);
  const card = $('#currentUserCard');
  card.classList.toggle('has-notification', notifications.length > 0);
  card.setAttribute('aria-label', `查看${person.name}基本信息${notifications.length ? `，有${notifications.length}条待处理催办提醒` : ''}`);
  let badge = card.querySelector('.user-alert-badge');
  if (!badge) {
    badge = document.createElement('b');
    badge.className = 'user-alert-badge';
    badge.setAttribute('aria-hidden', 'true');
    card.appendChild(badge);
  }
  badge.hidden = notifications.length === 0;
  badge.textContent = String(Math.min(99, notifications.length));
  updateCostAccessUI();
  updateAccountPermissionUI();
}

function openCurrentUserDialog() {
  const dialog = $('#currentUserDialog');
  const person = getCurrentUser();
  if (!dialog || !person) return;
  const notifications = currentUserNotifications();
  const notificationMarkup = notifications.length
    ? notifications.map(item => `<article class="user-notification ${item.notificationStatus === 'unread' ? 'unread' : ''}"><i aria-hidden="true">!</i><div><strong>${escapeHtml(item.title || '待处理催办')}</strong><small>${escapeHtml(item.category || '协作提醒')} · 责任人：${escapeHtml(item.owner || '未指定')}</small><p>${escapeHtml(item.note || item.relatedTask || `要求 ${item.due || '尽快'} 前完成`)}</p>${item.materialDocumentReview && item.materialEntryId ? `<button type="button" class="secondary-button" data-notification-material="${item.materialEntryId}">查看材料资料</button>` : ''} </div></article>`).join('')
    : '<p class="resource-empty">暂无待处理催办提醒</p>';
  $('#currentUserDialogBody').innerHTML = `<section class="current-user-summary"><div class="avatar">${escapeHtml(person.name.slice(0, 1))}</div><div><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.role)}</span><small>账号：${escapeHtml(person.account || '未设置')}</small><small>管理范围：${escapeHtml(person.scope || '项目综合管理')}</small></div></section><section class="current-user-notifications"><div class="current-user-notification-heading"><strong>催办提醒</strong><b class="${notifications.length ? 'has-alert' : ''}">${notifications.length ? `${notifications.length} 条待处理` : '暂无待处理'}</b></div>${notificationMarkup}</section>`;
  $$('dialog[open]').forEach(item => { if (item !== dialog) item.close(); });
  if (!dialog.open) dialog.showModal();
  $$('[data-notification-material]', dialog).forEach(button => button.addEventListener('click', () => { dialog.close(); openResourceEntryDetail(button.dataset.notificationMaterial); }));
}

function isServerAccountAdmin(person = getCurrentUser()) {
  return Boolean(window.ZhuxuServer?.active && /项目经理/.test(String(person?.role || '')));
}

function updateAccountPermissionUI() {
  const button = $('#organizationButton');
  if (button) button.hidden = window.ZhuxuServer?.active && !/项目经理/.test(String(getCurrentUser()?.role || ''));
}

function passwordPolicyError(password) {
  const value = String(password || '');
  if (value.length < 8) return '新密码至少 8 位';
  if (!/\p{L}/u.test(value) || !/\p{N}/u.test(value)) return '新密码必须同时包含字母和数字';
  return null;
}

function openPasswordChangeDialog() {
  const dialog = $('#passwordChangeDialog');
  if (!dialog) return;
  $$('dialog[open]').forEach(item => { if (item !== dialog) item.close(); });
  $('#passwordChangeError').textContent = '';
  if (!dialog.open) dialog.showModal();
}

async function loadAccounts() {
  const container = $('#accountManageList');
  if (!container) return;
  if (!window.ZhuxuServer?.active || !isServerAccountAdmin()) { container.innerHTML = '<p class="resource-empty">仅项目经理可查看账号管理。</p>'; return; }
  container.innerHTML = '<p class="resource-empty">正在加载项目账号…</p>';
  try {
    const payload = await window.ZhuxuServer.request('/api/accounts');
    serverAccounts = Array.isArray(payload.accounts) ? payload.accounts : [];
    container.innerHTML = serverAccounts.length ? `<div class="account-manage-table">${serverAccounts.map(account => {
      const stateClass = !account.enabled ? 'disabled' : account.mustChangePassword ? 'pending' : '';
      const stateLabel = !account.enabled ? '已禁用' : account.mustChangePassword ? '待改密' : '正常';
      return `<div class="account-row"><span><b>${escapeHtml(account.name)}</b><small>${escapeHtml(account.account)}</small></span><span>${escapeHtml(account.role)}</span><span>${escapeHtml(account.phone || '未登记')}</span><span><i class="account-state ${stateClass}">${stateLabel}</i></span><span class="account-actions"><button type="button" data-edit-account="${account.id}">编辑</button><button type="button" data-reset-account="${account.id}">重置密码</button><button type="button" data-toggle-account="${account.id}">${account.enabled ? '禁用' : '启用'}</button></span></div>`;
    }).join('')}</div>` : '<p class="resource-empty">暂无账号，点击右上角新增。</p>';
    $$('[data-edit-account]', container).forEach(button => button.addEventListener('click', () => openAccountDialog(button.dataset.editAccount)));
    $$('[data-reset-account]', container).forEach(button => button.addEventListener('click', () => openAccountConfirm('reset', button.dataset.resetAccount)));
    $$('[data-toggle-account]', container).forEach(button => button.addEventListener('click', () => openAccountConfirm('toggle', button.dataset.toggleAccount)));
  } catch (error) {
    container.innerHTML = `<p class="resource-empty">账号加载失败：${escapeHtml(error.message || '请稍后重试')}</p>`;
  }
}

async function refreshOrganizationFromServer() {
  if (!window.ZhuxuServer?.active) return;
  try {
    const payload = await window.ZhuxuServer.request('/api/bootstrap');
    window.ZhuxuServer.hydrate(payload.state);
    organization = JSON.parse(localStorage.getItem('zhuxu-organization') || 'null') || [];
    renderCurrentUser();
    if ($('#team').classList.contains('active')) renderSubview('team');
  } catch (error) { /* 刷新失败时保留现有组织 */ }
}

async function openProjectSwitchDialog() {
  const dialog = $('#projectSwitchDialog');
  const list = $('#projectSwitchList');
  if (!dialog || !list) return;
  if (window.ZhuxuServer?.active) {
    try {
      const payload = await window.ZhuxuServer.request('/api/bootstrap');
      window.ZhuxuServer.user = payload.user;
    } catch (error) { /* 使用本地缓存的用户信息 */ }
  }
  const projects = (window.ZhuxuServer?.user?.projects || []).filter(project => project.id);
  const items = projects.length ? projects : [currentProject];
  list.innerHTML = items.map(project => {
    const active = String(project.id) === String(currentProject.id);
    return `<button type="button" class="project-switch-item ${active ? 'active' : ''}" data-switch-project="${project.id}" ${active ? 'disabled' : ''}><span class="project-switch-mark">${escapeHtml((project.name || '项').slice(0, 1))}</span><span><strong>${escapeHtml(project.name || '未命名项目')}</strong><small>${project.code ? `${escapeHtml(project.code)} · ` : ''}${escapeHtml(project.role || '')}${active ? ' · 当前项目' : ''}</small></span>${active ? '<em>当前</em>' : '<i>切换 →</i>'}</button>`;
  }).join('') || '<p class="resource-empty">当前账号暂无项目权限</p>';
  $$('[data-switch-project]', list).forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await window.ZhuxuServer.switchProject(button.dataset.switchProject);
      location.reload();
    } catch (error) {
      showToast(error.message || '切换项目失败，请重试');
      button.disabled = false;
    }
  }));
  $('#projectSwitchNew').hidden = !isServerAccountAdmin();
  $('#projectSwitchNew').onclick = () => { dialog.close(); openNewProjectDialog(); };
  dialog.showModal();
}

function openNewProjectDialog() {
  const form = $('#newProjectForm');
  if (!form) return;
  form.reset();
  $('#newProjectError').textContent = '';
  $('#newProjectDialog').showModal();
}

function openAccountDialog(accountId = null) {
  const form = $('#accountForm');
  if (!form) return;
  form.reset();
  const roleSelect = form.elements.role;
  roleSelect.innerHTML = [...new Set(defaultOrganization.map(person => person.role))].map(role => `<option>${escapeHtml(role)}</option>`).join('');
  if (accountId) {
    const account = serverAccounts.find(item => String(item.id) === String(accountId));
    if (!account) return;
    form.elements.accountId.value = account.id;
    form.elements.name.value = account.name;
    roleSelect.value = account.role;
    form.elements.account.value = account.account;
    form.elements.account.readOnly = true;
    form.elements.phone.value = account.phone || '';
    form.elements.scope.value = account.scope || '';
    $('#accountDialogEyebrow').textContent = '编辑项目账号';
    $('#accountDialogTitle').textContent = '维护项目账号';
  } else {
    form.elements.account.readOnly = false;
    $('#accountDialogEyebrow').textContent = '新增项目账号';
    $('#accountDialogTitle').textContent = '登记项目账号';
  }
  $('#accountDialog').showModal();
}

function openAccountConfirm(action, accountId) {
  const account = serverAccounts.find(item => String(item.id) === String(accountId));
  if (!account) return;
  $('#accountConfirmAction').value = action;
  $('#accountConfirmId').value = accountId;
  if (action === 'reset') {
    $('#accountConfirmTitle').textContent = '重置登录密码';
    $('#accountConfirmCopy').textContent = `将把「${account.name}（${account.account}）」的密码重置为登记手机号后六位，并强制其下次登录时修改密码。该账号的现有登录会话将全部失效。`;
  } else {
    const disable = Boolean(account.enabled);
    if (disable && String(account.id) === String(currentUserId)) { showToast('不能禁用当前登录账号'); return; }
    $('#accountConfirmTitle').textContent = disable ? '禁用账号' : '启用账号';
    $('#accountConfirmCopy').textContent = disable ? `禁用后「${account.name}」将无法登录，已有会话立即失效；可随时重新启用。` : `启用后「${account.name}」可重新登录项目系统。`;
  }
  $('#accountConfirmDialog').showModal();
}

function matchPersonByRole(role) {
  const person = organization.find(item => item.role === role) || organization[0];
  return person ? `${person.name} · ${person.role}` : role;
}

function resolveOrganizationOwner(value = '') {
  const current = String(value).trim();
  if (!current) return matchPersonByRole('资料员');
  if (current.includes('·') || organization.some(person => person.name === current)) return current;
  const person = organization.find(item => item.role === current);
  return person ? `${person.name} · ${person.role}` : current;
}

function planOwners(plan) {
  if (Array.isArray(plan.owners) && plan.owners.length) return plan.owners;
  if (plan.ownerRole) return [resolveOrganizationOwner(plan.ownerRole)];
  return [];
}

function planOwnerLabel(plan) {
  return planOwners(plan).join('、') || '待明确';
}

function formatDayLabel(dateKey) {
  const parts = String(dateKey || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateKey || '';
  return `${parts[1]}月${parts[2]}日`;
}

function attendanceSupplementWindow(record) {
  const registeredAt = new Date(record.registeredAt || `${record.date}T18:00:00+08:00`);
  const deadline = new Date(registeredAt.getTime() + 24 * 60 * 60 * 1000);
  const remainingMs = deadline.getTime() - Date.now();
  const remainingHours = Math.max(0, Math.ceil(remainingMs / 3600000));
  return { registeredAt, deadline, remainingMs, remainingHours, allowed: remainingMs > 0 };
}

function attendanceSupplementLabel(record) {
  const windowState = attendanceSupplementWindow(record);
  if (!windowState.allowed) return '补录已截止';
  return windowState.remainingHours <= 1 ? '补录剩不足 1 小时' : `补录剩 ${windowState.remainingHours} 小时`;
}

function matchResponsible(title) {
  const rules = [
    { pattern: /资料|合格证|送检|报验|方案|归档/, role: '资料员' },
    { pattern: /材料|钢筋进场|砌块|混凝土供应/, role: '材料员' },
    { pattern: /设备|电梯|塔吊|泵车/, role: '设备管理员' },
    { pattern: /机电|桥架|管线|预留|预埋/, role: '机电工程师' },
    { pattern: /安全|临边|扬尘|防护/, role: '安全员' },
    { pattern: /质量|验收|整改/, role: '质量员' },
    { pattern: /钢筋|模板|混凝土|砌体|防水|主体/, role: '土建工程师' }
  ];
  const role = rules.find(rule => rule.pattern.test(title))?.role || '生产经理';
  return { role, owner: matchPersonByRole(role) };
}

function updateMatchedOwner(force = false) {
  const titleInput = $('#taskForm input[name="title"]');
  const ownerInput = $('#taskForm input[name="owner"]');
  const match = matchResponsible(titleInput.value);
  if (force || !ownerInput.value || ownerInput.dataset.autoMatched === 'true') {
    ownerInput.value = match.owner;
    ownerInput.dataset.autoMatched = 'true';
  }
  $('#ownerMatchHint').textContent = `系统匹配：${match.role}；可手工修改`;
}

function renderStages(selected = 2) {
  $('#processRail').innerHTML = stages.map((stage, index) => `
    <button class="stage-button ${stage.status} ${selected === index ? 'selected' : ''}" data-stage="${index}" aria-label="${stage.name}，${stage.meta}">
      <span class="stage-node">${stage.status === 'done' ? '✓' : index + 1}</span>
      <span class="stage-name">${stage.name}</span><span class="stage-meta">${stage.meta}</span>
    </button>`).join('');
  const stage = stages[selected];
  $('#stageDetail').innerHTML = `<strong>${stage.name}</strong><p>${stage.detail}</p><span>责任：${stage.owner}</span>`;
  $$('.stage-button').forEach(button => button.addEventListener('click', () => renderStages(Number(button.dataset.stage))));
}

function renderIssues() {
  $('#issueList').innerHTML = issues.map(issue => `
    <article class="issue-item ${issue.level}"><i class="issue-bar"></i><div><h3>${issue.title}</h3><p>${issue.desc}</p></div><span class="issue-countdown">${issue.time}</span></article>`).join('');
}

function filteredTasks() {
  if (activeFilter === 'all') return tasks;
  if (activeFilter === 'risk') return tasks.filter(t => t.priority === 'risk' && t.status !== 'done');
  return tasks.filter(t => t.status === activeFilter);
}

function renderTasks() {
  const list = filteredTasks();
  $('#taskList').innerHTML = list.length ? list.map(task => `
    <article class="task-item ${task.status} ${task.priority === 'risk' ? 'risk' : ''}" data-id="${task.id}">
      <button class="task-status" aria-label="切换任务状态" title="点击切换状态">${task.status === 'done' ? '✓' : task.status === 'doing' ? '◐' : '•'}</button>
      <div class="task-copy"><div class="task-title">${task.title}${task.priority === 'risk' && task.status !== 'done' ? '<span class="risk-tag">影响节点</span>' : ''}</div><div class="task-meta"><span>▣ ${task.zone}</span><span>♙ ${task.owner}</span><span>发起：${task.creator || '管理人员'}</span></div></div>
      <div class="task-side"><span class="task-time">${task.status === 'done' ? '已完成' : task.time}</span><div><button class="task-urge" type="button" data-edit-task="${task.id}">编辑</button>${task.status !== 'done' ? `<button class="task-urge" type="button" data-urge-task="${task.id}">催办</button>` : ''}</div></div>
    </article>`).join('') : '<div class="empty-state">此筛选条件下没有任务</div>';
  $$('.task-status').forEach(button => button.addEventListener('click', () => requestTaskStatusChange(Number(button.closest('.task-item').dataset.id))));
  $$('[data-edit-task]').forEach(button => button.addEventListener('click', () => openTaskDialog(tasks.find(item => item.id === Number(button.dataset.editTask)))));
  $$('[data-urge-task]').forEach(button => button.addEventListener('click', () => {
    const task = tasks.find(item => item.id === Number(button.dataset.urgeTask));
    openFollowupDialog({ category: '工序催办', title: `请尽快完成：${task.title}`, owner: task.owner, zone: task.zone, relatedTask: task.title, requester: '陈工 · 项目经理', urgency: task.priority === 'risk' ? 'urgent' : 'normal', note: '该工序影响我的后续任务，请按要求时间完成并反馈。' });
  }));
  updateMetrics();
}

function setTaskIntakeMode(mode) {
  $$('[data-task-intake]').forEach(button => button.classList.toggle('active', button.dataset.taskIntake === mode));
  $('#taskFilePanel').hidden = mode !== 'file';
  $('#taskVoicePanel').hidden = mode !== 'voice';
}

function openTaskDialog(task = null) {
  const form = $('#taskForm');
  form.reset();
  editingTaskId = task?.id || null;
  taskRecognitionCandidates = [];
  renderTaskRecognitionCandidates();
  setTaskIntakeMode('manual');
  $('#taskDialog .dialog-heading h2').textContent = task ? '编辑任务并重新匹配责任人' : '把工作交到具体的人';
  form.querySelector('[type="submit"]').textContent = task ? '保存修改' : '创建任务';
  form.elements.title.value = task?.title || '';
  form.elements.zone.value = task?.zone || '3#楼';
  form.elements.owner.value = task?.owner || '';
  form.elements.creator.value = task?.creator || '陈工 · 项目经理';
  form.elements.taskType.value = task?.taskType || '施工任务';
  form.elements.time.value = task?.time || '17:00';
  form.elements.priority.value = task?.priority || 'normal';
  form.elements.criteria.value = task?.criteria || '';
  form.elements.owner.dataset.autoMatched = task ? 'false' : 'true';
  if (!task) updateMatchedOwner(true); else $('#ownerMatchHint').textContent = '现有责任人已载入，可手工修改';
  $('#taskDialog').showModal();
}

function requestTaskStatusChange(id) {
  const order = ['todo', 'doing', 'done'];
  const task = tasks.find(item => item.id === id);
  const nextStatus = order[(Math.max(order.indexOf(task.status), 0) + 1) % order.length];
  if (task.title.includes('钢筋') && task.title.includes('绑扎') && nextStatus !== 'todo' && documentState.steel.sampleStatus !== 'qualified') {
    pendingTaskTransition = { id, nextStatus };
    openDocumentGate(task);
    return;
  }
  applyTaskStatus(id, nextStatus);
}

function applyTaskStatus(id, status) {
  tasks = tasks.map(task => task.id === id ? { ...task, status } : task);
  persistTasks(); renderTasks();
  showToast('任务状态已更新');
}

function persistTasks() {
  localStorage.setItem('zhuxu-tasks', JSON.stringify(tasks));
  syncServerState('zhuxu-tasks', tasks);
}

function persistDocumentState() {
  localStorage.setItem('zhuxu-document-state', JSON.stringify(documentState));
  syncServerState('zhuxu-document-state', documentState);
}

function persistFollowups() {
  localStorage.setItem('zhuxu-followups', JSON.stringify(followups));
  syncServerState('zhuxu-followups', followups);
  const pending = followups.filter(item => item.status !== 'done').length;
  if ($('#followupBadge')) $('#followupBadge').textContent = pending;
  $('#notificationButton b').textContent = String(currentUserNotifications().length);
  if ($('#currentUserCard')) renderCurrentUser();
}

function defaultDueValue() {
  const due = new Date(Date.now() + 4 * 60 * 60 * 1000);
  due.setMinutes(Math.ceil(due.getMinutes() / 15) * 15, 0, 0);
  const local = new Date(due.getTime() - due.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function openFollowupDialog(prefill = {}) {
  const form = $('#followupForm');
  form.reset();
  form.elements.category.value = prefill.category || '资料催办';
  form.elements.zone.value = [...form.elements.zone.options].some(option => option.value === prefill.zone) ? prefill.zone : '项目部';
  form.elements.title.value = prefill.title || '';
  form.elements.requester.value = prefill.requester || '李工 · 资料员';
  form.elements.owner.value = prefill.owner || '';
  form.elements.due.value = prefill.due || defaultDueValue();
  form.elements.relatedTask.value = prefill.relatedTask || '';
  form.elements.note.value = prefill.note || '';
  const urgency = form.querySelector(`input[name="urgency"][value="${prefill.urgency || 'normal'}"]`);
  if (urgency) urgency.checked = true;
  $('#followupDialog').showModal();
}

function urgeDocument(documentId, category) {
  const document = documentState[category].documents.find(item => item.id === documentId);
  openFollowupDialog({
    category: '资料催办', title: `请提供或完善：${document.name}`, owner: document.owner, requester: '李工 · 资料员',
    zone: category === 'steel' ? '3#楼' : category === 'concrete' ? '3#楼' : '地下室', relatedTask: documentState[category].linkedProcess,
    urgency: document.due.includes('前') || document.due.includes('当日') ? 'urgent' : 'normal', note: `该资料由“${document.trigger}”触发，要求在${document.due}完成，当前影响关联工序。`
  });
}

function getDocumentStats() {
  const documents = Object.values(documentState).flatMap(group => group.documents);
  const concealedItems = concealedAcceptances.map(item => ({ status: item.status === 'qualified' ? 'done' : item.status }));
  const allItems = [...documents, ...concealedItems];
  const done = allItems.filter(document => document.status === 'done').length;
  const pending = allItems.filter(document => document.status !== 'done').length;
  return { total: allItems.length, done, pending, percent: Math.round(done / Math.max(allItems.length, 1) * 100) };
}

function renderDocumentSummary() {
  const stats = getDocumentStats();
  $('#documentStripBar').style.width = `${stats.percent}%`;
  $('#documentStripPercent').textContent = `${stats.percent}%`;
  $('#documentStripAlert').textContent = `${stats.pending} 项待闭环`;
  $('#documentBadge').textContent = stats.pending;
  const pendingChain = Object.entries(documentState).find(([, group]) => group.sampleStatus !== 'qualified');
  $('#documentStripSummary').textContent = Object.keys(documentState).length ? (pendingChain ? `${documentChainConfigs[pendingChain[0]]?.label || '材料'}报告未闭环，已关联${pendingChain[1].linkedProcess}` : '各材料送检及验收资料均已闭环，关联工序可继续') : '尚未登记材料进场，资料链待生成';
}

function registerSteelArrival() {
  documentState.steel.sampleStatus = 'testing';
  documentState.steel.documents = structuredClone(defaultDocumentState.steel.documents);
  persistDocumentState();
  renderDocumentSummary();
  navigate('documents');
  showToast('钢筋进场已登记，自动生成 4 项资料任务');
}

function openDocumentGate(task = null, chainKey = 'steel') {
  activeGateChain = chainKey;
  const group = documentState[chainKey];
  const config = documentChainConfigs[chainKey];
  if (!group || !config) return;
  const status = group.sampleStatus;
  $('#documentGateForm').elements.commissionFiles.value = '';
  $('#documentGateForm').elements.reportFiles.value = '';
  $('#gateDialogTitle').textContent = task ? `${config.processName}前资料核验` : `登记${config.label}送检及报告`;
  $('#gateChainSelect').innerHTML = Object.entries(documentChainConfigs).map(([key, item]) => `<option value="${key}" ${key === chainKey ? 'selected' : ''}>${item.label}</option>`).join('');
  const materialEntries = resourceEntries.filter(entry => entry.type === 'material' && entry.movement === '进场');
  $('#gateMaterialEntry').innerHTML = `<option value="">不关联具体进场批次</option>${materialEntries.map(entry => `<option value="${entry.id}" ${Number(entry.id) === Number(group.materialEntryId) ? 'selected' : ''}>${entry.name}｜${entry.brand}｜${entry.spec}｜${entry.location}</option>`).join('')}`;
  updateGateMaterialSummary();
  $('#gateQuestion').textContent = config.question;
  $('#gateContext').textContent = task ? `“${task.title}”准备推进，系统检测到${config.resultName}尚未闭环，请确认最新状态。` : `登记后，系统会自动更新${config.label}资料完成情况和关联工序的放行状态。`;
  $('#gateWarningText').textContent = config.warning;
  $('#gateSubmitButton').textContent = task ? '确认并检查工序' : '保存结果';
  $('#gateChain').innerHTML = config.steps.map((step, index) => `<span class="${index < 2 || (status === 'qualified' && index === 2) ? 'done' : index === 2 ? 'current' : ''}">${step[0]}</span>${index < config.steps.length - 1 ? '<i>→</i>' : ''}`).join('');
  const radio = $(`#documentGateForm input[value="${status === 'qualified' || status === 'failed' ? status : 'testing'}"]`);
  if (radio) radio.checked = true;
  if (!$('#documentGateDialog').open) $('#documentGateDialog').showModal();
}

function updateGateMaterialSummary() {
  const entryId = Number($('#gateMaterialEntry').value || documentState[activeGateChain]?.materialEntryId);
  const entry = resourceEntries.find(item => Number(item.id) === entryId);
  $('#gateMaterialSummary').innerHTML = entry ? `<b>${escapeHtml(entry.name)}</b><span>品牌：${escapeHtml(entry.brand)}</span><span>规格：${escapeHtml(entry.spec)}</span><span>使用部位：${escapeHtml(entry.location)}</span><span>进场：${new Date(entry.arrivalTime).toLocaleString('zh-CN')}</span>` : '当前资料链未关联具体材料进场批次';
}

function openDocumentTaskDialog(categoryKey, documentId) {
  const group = documentState[categoryKey];
  const document = group?.documents.find(item => item.id === documentId);
  if (!document) return;
  const form = $('#documentTaskForm');
  form.elements.categoryKey.value = categoryKey; form.elements.documentId.value = documentId;
  ['name', 'trigger', 'owner', 'due', 'status'].forEach(field => { form.elements[field].value = field === 'owner' ? resolveOrganizationOwner(document[field]) : document[field]; });
  const entry = resourceEntries.find(item => Number(item.id) === Number(group.materialEntryId));
  $('#documentTaskMaterialSummary').innerHTML = `${entry ? `<b>关联进场材料：${escapeHtml(entry.name)}</b><span>品牌 ${escapeHtml(entry.brand)} · 规格 ${escapeHtml(entry.spec)} · 用于 ${escapeHtml(entry.location)}</span><span>当前${group.sampleStatus === 'qualified' ? '报告合格' : group.sampleStatus === 'failed' ? '报告不合格' : '检测中'}</span>` : '<span>未关联材料进场记录；可在“登记资料结果”中选择材料批次</span>'}<div class="document-file-groups"><section data-document-files="commission"><strong>送检委托 · ${group.commissionAttachments?.length || 0}</strong>${renderStoredFileList(group.commissionAttachments, '尚未上传送检委托')}</section><section data-document-files="report"><strong>检测报告 · ${group.reportAttachments?.length || 0}</strong>${renderStoredFileList(group.reportAttachments, '尚未上传检测报告')}</section></div>`;
  $('#documentTaskDialog').showModal();
  $$('[data-stored-file-index]', $('[data-document-files="commission"]')).forEach(button => button.addEventListener('click', () => previewStoredAttachment(group.commissionAttachments[Number(button.dataset.storedFileIndex)])));
  $$('[data-stored-file-index]', $('[data-document-files="report"]')).forEach(button => button.addEventListener('click', () => previewStoredAttachment(group.reportAttachments[Number(button.dataset.storedFileIndex)])));
}

function openMaterialAcceptanceDialog(categoryKey) {
  const group = documentState[categoryKey];
  if (!group) return;
  const entry = resourceEntries.find(item => Number(item.id) === Number(group.materialEntryId));
  const form = $('#materialAcceptanceForm');
  form.reset();
  form.elements.categoryKey.value = categoryKey;
  $('#materialAcceptanceTitle').textContent = getMaterialAcceptanceTitle(categoryKey, group);
  $('#acceptanceMaterialSummary').innerHTML = entry ? `<div><span>关联进场材料</span><strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(entry.brand)} · ${escapeHtml(entry.spec)} · ${escapeHtml(entry.quantity)}</small></div><div><span>进场时间</span><strong>${new Date(entry.arrivalTime).toLocaleString('zh-CN')}</strong><small>${escapeHtml(entry.location)}</small></div><div><span>资料状态</span><strong>${getMaterialAcceptanceStatus(group).label}</strong><small>委托 ${group.commissionAttachments?.length || 0} · 报告 ${group.reportAttachments?.length || 0}</small></div>` : '<p>尚未关联具体材料进场批次，可在“登记资料结果”中选择材料。</p>';
  $('#acceptanceDocumentEditor').innerHTML = group.documents.map((document, index) => `<section class="acceptance-document-item" data-acceptance-document="${document.id}"><div class="acceptance-document-sequence"><span>${String(index + 1).padStart(2,'0')}</span><i class="${document.status}"></i></div><div><strong>${escapeHtml(document.name)}</strong><small>${escapeHtml(document.trigger)}</small></div><label>责任人<input class="acceptance-owner" list="organizationOwners" required value="${escapeHtml(resolveOrganizationOwner(document.owner))}" placeholder="从组织架构选择，也可手工修改"></label><label>完成时限<input class="acceptance-due" required value="${escapeHtml(document.due)}"></label><label>状态<select class="acceptance-status"><option value="pending" ${document.status === 'pending' ? 'selected' : ''}>待办理</option><option value="testing" ${document.status === 'testing' ? 'selected' : ''}>检测中</option><option value="done" ${document.status === 'done' ? 'selected' : ''}>已完成</option><option value="failed" ${document.status === 'failed' ? 'selected' : ''}>不合格</option></select></label><button type="button" class="acceptance-urge" data-acceptance-urge="${document.id}" ${document.status === 'done' ? 'disabled' : ''}>${document.status === 'done' ? '已闭环' : '催办'}</button></section>`).join('');
  const materialFiles = entry?.attachments || [];
  const groups = [['材料证明 / 进场照片', materialFiles], ['送检委托', group.commissionAttachments || []], ['检测报告', group.reportAttachments || []]];
  $('#acceptanceExistingFiles').innerHTML = groups.map(([label, files], index) => `<section data-acceptance-files="${index}"><strong>${label} · ${files.length}</strong>${renderStoredFileList(files, `尚未上传${label}`)}</section>`).join('');
  groups.forEach(([, files], index) => $$('[data-stored-file-index]', $(`[data-acceptance-files="${index}"]`)).forEach(button => button.addEventListener('click', () => previewStoredAttachment(files[Number(button.dataset.storedFileIndex)]))));
  $$('[data-acceptance-urge]', $('#acceptanceDocumentEditor')).forEach(button => button.addEventListener('click', () => urgeDocument(button.dataset.acceptanceUrge, categoryKey)));
  $('#materialAcceptanceDialog').showModal();
}

function updateMetrics() {
  const done = tasks.filter(t => t.status === 'done').length;
  const doing = tasks.filter(t => t.status === 'doing').length;
  const percent = Math.round((done / Math.max(tasks.length, 1)) * 100);
  $('#completionMetric').innerHTML = `${percent}<small>%</small>`;
  $('#completionText').textContent = `已完成 ${done} 项，进行中 ${doing} 项`;
  $('#taskTotal').textContent = `${tasks.length} 项`;
  $('#completionSegments').innerHTML = tasks.map(t => `<i class="${t.status}"></i>`).join('');
}

const subviews = {
  schedule: { title: '进度计划', desc: '总计划逐级分解到月、周和每日执行事项', action: '新建计划', content: 'schedule' },
  intake: { title: '每日任务执行中心', desc: '把日计划落实到管理人员和班组，同时跟踪技术、材料、资料、质量安全及需协调事项', action: '记录施工反馈', content: 'intake' },
  technical: { title: '技术文件', desc: '图纸、设计变更、联系函和指令单统一共享，关联任务后完成线上交底', action: '上传技术文件', content: 'technical' },
  cost: { title: '成控文件', desc: '合同、经济核定单和现场工程量确认单统一归档，形成过程成本依据', action: '新增成控文件', content: 'cost' },
  tasks: { title: '任务协同', desc: '把每项工作落实到区域、人员和完成标准', action: '新建任务', content: 'table' },
  followups: { title: '协作催办', desc: '资料员和管理人员可以对缺失资料、前置工序及现场配合发起催办', action: '发起催办', content: 'followups' },
  materials: { title: '材料与设备', desc: '材料、设备分别建账，并用资源计划提前暴露供需缺口', action: '登记资源', content: 'resources' },
  documents: { title: '资料完成情况', desc: '让材料、送检、验收资料成为施工进度的放行条件', action: '登记资料结果', content: 'documents' },
  quality: { title: '质量安全', desc: '问题发现、整改、复验全程留痕', action: '上传照片', content: 'quality' },
  team: { title: '组织架构', desc: '明确项目管理人员职责与岗位授权', action: '编辑管理人员', content: 'team' },
  laborers: { title: '民工管理', desc: '劳资员维护民工花名册，考勤表自动匹配实名制人员', action: '登记民工', content: 'laborers' }
};

function renderFollowupsBody() {
  const pending = followups.filter(item => item.status !== 'done');
  const urgent = pending.filter(item => item.urgency === 'urgent');
  const reminded = pending.reduce((sum, item) => sum + item.reminders, 0);
  return `<div class="followup-summary">
      <article class="followup-kpi"><span>待响应催办</span><strong>${pending.length}</strong><p>资料、工序和现场配合事项</p></article>
      <article class="followup-kpi"><span>紧急事项</span><strong>${urgent.length}</strong><p>影响今日施工或资料节点</p></article>
      <article class="followup-kpi"><span>累计提醒</span><strong>${reminded}</strong><p>催办记录全程留痕</p></article>
    </div>
    <div class="followup-board">
      ${pending.map(item => `<article class="followup-card ${item.urgency}"><i></i><div><h3>${escapeHtml(item.title)}</h3><div class="followup-card-meta"><span>${item.category}</span><span>区域：${item.zone}</span><span>要求完成：${new Date(item.due).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div><div class="followup-route">${escapeHtml(item.requester)} → ${escapeHtml(item.owner)}</div>${item.note ? `<p class="followup-card-note">${escapeHtml(item.note)}</p>` : ''}</div><div class="followup-card-actions"><em class="urgency-badge ${item.urgency}">${item.urgency === 'urgent' ? '紧急' : '一般'}</em><button class="remind-button" data-remind-followup="${item.id}">再次催办</button><span class="followup-count">已提醒 ${item.reminders} 次</span></div></article>`).join('') || '<div class="resource-empty">当前没有待响应的催办事项</div>'}
    </div>`;
}

function getDayPlanTaskList(dayPlan) {
  const byPlan = tasks.filter(task => Number(task.dayPlanId) === Number(dayPlan.id)).sort((a, b) => Number(a.id) - Number(b.id));
  if (byPlan.length) return byPlan;
  const byId = tasks.find(task => Number(task.id) === Number(dayPlan.taskId));
  return byId ? [byId] : [];
}

function getPlanExecutionRecord(plan) {
  const taskList = plan.level === 'day' ? getDayPlanTaskList(plan) : [];
  if (taskList.length > 1) {
    const records = taskList.map(task => dailyExecution.find(item => Number(item.taskId) === Number(task.id) && item.date === plan.start)).filter(Boolean);
    if (records.length) {
      const progress = Math.round(records.reduce((sum, record) => sum + ZhuxuMeetingRules.progress(record), 0) / taskList.length);
      return { ...records[0], progress, aggregated: true };
    }
  }
  const record = dailyExecution.find(item => Number(item.dayPlanId) === Number(plan.id) && item.date === plan.start)
    || dailyExecution.find(item => Number(item.taskId) === Number(plan.taskId) && item.date === plan.start);
  return record ? { ...record, progress: ZhuxuMeetingRules.progress(record) } : null;
}

function renderPlanRow(plan, groupedDay = false) {
  const parent = plans.find(item => Number(item.id) === Number(plan.parentId));
  const record = getPlanExecutionRecord(plan);
  const progress = Number(record?.progress || 0);
  const isDay = groupedDay;
  const isWeek = plan.level === 'week';
  const ownerLabel = escapeHtml(planOwnerLabel(plan));
  const teamLabel = escapeHtml(plan.team || '待明确');
  let metaColumns;
  if (isDay) {
    metaColumns = `<span>${ownerLabel}</span><span>${teamLabel}</span><span class="day-plan-progress ${progress >= 100 ? 'complete' : ''}">${plan.dailyTarget ? `目标 ${plan.dailyTarget}% · ` : ''}完成 ${progress}%</span>`;
  } else if (isWeek) {
    metaColumns = `<span>${escapeHtml(plan.start)}</span><span>${escapeHtml(plan.end)}</span><span>${ownerLabel}</span><span>${teamLabel}</span>`;
  } else {
    metaColumns = `<span>${escapeHtml(plan.start)}</span><span>${escapeHtml(plan.end)}</span><span>${escapeHtml(plan.ownerRole || '待明确')}</span>`;
  }
  return `<article class="plan-row${isDay ? ' day-plan-row' : ''}${isWeek ? ' week-plan-row' : ''}"><div><strong>${escapeHtml(plan.title)}</strong><small>来源：${escapeHtml(plan.source || '手工新建')}${parent ? ` · 所属周计划：${escapeHtml(parent.title)}` : ''}${(plan.subTasks || []).length ? ` · ${plan.subTasks.length} 项子任务` : ''}</small></div>${metaColumns}<div class="plan-row-actions">${(plan.attachments || []).length ? `<button class="view-action" data-plan-attachment="${plan.id}">查看计划表</button>` : ''}${isDay ? '计划由每日例会统一编制' : `<button class="edit-action" data-edit-plan="${plan.id}">编辑计划</button>`}</div></article>`;
}

function formatDailyPlanGroupLabel(dateKey) {
  const parts = String(dateKey || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return `${escapeHtml(dateKey || '未定日期')}计划`;
  const weekLabel = ['周日','周一','周二','周三','周四','周五','周六'][new Date(parts[0], parts[1] - 1, parts[2]).getDay()];
  return `${parts[1]}月${parts[2]}日计划<span>${weekLabel}</span>`;
}

function renderDailyPlanGroups(dayPlans) {
  const groups = dayPlans.reduce((result, plan) => {
    const dateKey = plan.start || '未定日期';
    if (!result.has(dateKey)) result.set(dateKey, []);
    result.get(dateKey).push(plan);
    return result;
  }, new Map());
  const sortedGroups = [...groups.entries()].sort(([dateA], [dateB]) => String(dateB).localeCompare(String(dateA)));
  const containsToday = sortedGroups.some(([date]) => date === dailyDateKey);
  return `<div class="daily-plan-archive">${sortedGroups.map(([dateKey, datePlans], index) => {
    const progresses = datePlans.map(plan => Number(getPlanExecutionRecord(plan)?.progress || 0));
    const completed = progresses.filter(progress => progress >= 100).length;
    const average = progresses.length ? Math.round(progresses.reduce((sum, progress) => sum + progress, 0) / progresses.length) : 0;
    const shouldOpen = dateKey === dailyDateKey || (!containsToday && index === 0);
    return `<details class="daily-plan-group" data-plan-date="${escapeHtml(dateKey)}"${shouldOpen ? ' open' : ''}><summary><span class="daily-plan-date-mark">${String(dateKey).slice(8,10) || '--'}</span><div><strong>${formatDailyPlanGroupLabel(dateKey)}</strong><small>${escapeHtml(dateKey)} · 点击展开或收起当天具体计划</small></div><div class="daily-plan-group-stats"><span><b>${datePlans.length}</b> 项任务</span><span><b>${completed}</b> 项完成</span><em>${average}%</em></div><i aria-hidden="true">⌄</i></summary><div class="daily-plan-group-body">${datePlans.map(plan => renderPlanRow(plan, true)).join('')}</div></details>`;
  }).join('')}</div>`;
}

function weatherCodeMeta(code) {
  const map = { 0: ['晴', '☀'], 1: ['晴间多云', '🌤'], 2: ['多云', '⛅'], 3: ['阴', '☁'], 45: ['雾', '🌫'], 48: ['雾凇', '🌫'], 51: ['毛毛雨', '🌦'], 53: ['毛毛雨', '🌦'], 55: ['毛毛雨', '🌦'], 56: ['冻毛毛雨', '🌧'], 57: ['冻毛毛雨', '🌧'], 61: ['小雨', '🌧'], 63: ['中雨', '🌧'], 65: ['大雨', '🌧'], 66: ['冻雨', '🌧'], 67: ['冻雨', '🌧'], 71: ['小雪', '🌨'], 73: ['中雪', '🌨'], 75: ['大雪', '❄'], 77: ['雪粒', '🌨'], 80: ['阵雨', '🌦'], 81: ['阵雨', '🌦'], 82: ['强阵雨', '🌧'], 85: ['阵雪', '🌨'], 86: ['阵雪', '❄'], 95: ['雷暴', '⛈'], 96: ['雷暴冰雹', '⛈'], 99: ['雷暴冰雹', '⛈'] };
  return map[Number(code)] || ['未知', '🌡'];
}

function weatherMonthRange(year = activeScheduleYear, month = activeWeatherMonth) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const start = `${monthKey}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const naturalEnd = `${monthKey}-${String(lastDay).padStart(2, '0')}`;
  return { start, end: naturalEnd > dailyDateKey ? dailyDateKey : naturalEnd, naturalEnd, monthKey, label: `${year}年${month}月` };
}

function persistWeatherConfig() {
  localStorage.setItem('zhuxu-weather-config', JSON.stringify(weatherConfig));
}

function persistWeatherMilestones() {
  localStorage.setItem('zhuxu-weather-milestones', JSON.stringify(weatherMilestones));
  syncServerState('zhuxu-weather-milestones', weatherMilestones);
}

async function loadWeatherData(year = activeScheduleYear, month = activeWeatherMonth, force = false) {
  const config = weatherConfig;
  const { start, end, monthKey } = weatherMonthRange(year, month);
  const cached = weatherArchive[monthKey];
  if (!force && cached?.fetchedAt && cached.location === config.city && Date.now() - cached.fetchedAt < 3600000) return cached;
  if (start <= dailyDateKey && end >= start && window.ZhuxuServer?.active) {
    try {
      const data = await window.ZhuxuServer.request(`/api/weather?latitude=${encodeURIComponent(config.latitude)}&longitude=${encodeURIComponent(config.longitude)}&start=${start}&end=${end}`);
      weatherData = { fetchedAt: Date.now(), month: monthKey, location: config.city, daily: data.daily || {} };
      weatherArchive[monthKey] = weatherData;
      localStorage.setItem('zhuxu-weather', JSON.stringify(weatherData));
      localStorage.setItem('zhuxu-weather-archive', JSON.stringify(weatherArchive));
      return weatherData;
    } catch (error) { /* 下面提示手动登记 */ }
  }
  if (cached?.location === config.city) return cached;
  return weatherData?.month === monthKey ? weatherData : null;
}

function milestoneTypeLabel(type) {
  return { planned: '计划节点', actual: '实际节点', acceptance: '验收节点', milestone: '重大里程碑' }[type] || '重要事件';
}

async function refreshWeatherTable(force = false) {
  const el = $('#weatherTable');
  if (!el) return;
  const { label, monthKey, naturalEnd } = weatherMonthRange(activeScheduleYear, activeWeatherMonth);
  const data = await loadWeatherData(activeScheduleYear, activeWeatherMonth, force);
  const time = data?.daily?.time || [];
  const max = data?.daily?.temperature_2m_max || [];
  const min = data?.daily?.temperature_2m_min || [];
  const precip = data?.daily?.precipitation_sum || [];
  const codes = data?.daily?.weather_code || [];
  const byDate = new Map(time.map((date, index) => [date, index]));
  const dayCount = Number(naturalEnd.slice(8, 10));
  el.innerHTML = Array.from({ length: dayCount }, (_, dayIndex) => {
    const date = `${monthKey}-${String(dayIndex + 1).padStart(2, '0')}`;
    const index = byDate.get(date);
    const events = weatherMilestones.filter(item => item.date === date);
    if (index === undefined) return `<div class="weather-day future"><span>${dayIndex + 1}</span><i>—</i><strong>${date > dailyDateKey ? '待记录' : '无数据'}</strong>${events.map(item => `<button type="button" class="weather-event ${escapeHtml(item.type)}" data-weather-event="${item.id}" title="${escapeHtml(item.title)}"></button>`).join('')}</div>`;
    const meta = weatherCodeMeta(codes[index]);
    const rainy = Number(precip[index] || 0) > 0;
    return `<div class="weather-day ${rainy ? 'rainy' : ''}"><span>${dayIndex + 1}</span><i>${meta[1]}</i><strong>${meta[0]}</strong><small>${Math.round(min[index])}~${Math.round(max[index])}℃</small>${rainy ? `<em>${Number(precip[index]).toFixed(1)}mm</em>` : ''}${events.map(item => `<button type="button" class="weather-event ${escapeHtml(item.type)}" data-weather-event="${item.id}" title="${escapeHtml(item.title)}"></button>`).join('')}</div>`;
  }).join('');
  $$('[data-weather-event]', el).forEach(button => button.addEventListener('click', () => openWeatherMilestoneDetail(button.dataset.weatherEvent)));
  const currentIndex = time.length ? time.length - 1 : -1;
  if (currentIndex >= 0 && monthKey === dailyDateKey.slice(0, 7)) {
    const meta = weatherCodeMeta(codes[currentIndex]);
    $('.site-weather .weather-icon').textContent = meta[1];
    $('.site-weather strong').textContent = `${Math.round(max[currentIndex])}°C`;
    $('.site-weather small').textContent = `${meta[0]} · ${weatherConfig.city}`;
  }
  $('#weatherArchiveStatus').textContent = time.length ? `${label} 已记录 ${time.length} 天` : `${label} 暂无天气记录`;
}

function renderWeatherArchiveBody() {
  const body = $('#weatherArchiveBody');
  const monthButtons = Array.from({ length: 12 }, (_, index) => `<button type="button" class="${activeWeatherMonth === index + 1 ? 'active' : ''}" data-weather-month="${index + 1}">${index + 1}月</button>`).join('');
  body.innerHTML = `<section class="weather-archive-toolbar"><div><strong>${activeScheduleYear}年 · ${escapeHtml(weatherConfig.city || '未设置地点')}</strong><small id="weatherArchiveStatus">正在读取天气档案…</small></div><button type="button" data-weather-refresh>刷新本月</button></section><div class="weather-month-tabs">${monthButtons}</div><div class="weather-event-legend"><span class="planned">计划节点</span><span class="actual">实际节点</span><span class="acceptance">验收节点</span><span class="milestone">重大里程碑</span></div><div class="weather-table" id="weatherTable"><p class="weather-loading">正在加载晴雨表…</p></div>`;
  $$('[data-weather-month]', body).forEach(button => button.addEventListener('click', () => { activeWeatherMonth = Number(button.dataset.weatherMonth); renderWeatherArchiveBody(); refreshWeatherTable(); }));
  $('[data-weather-refresh]', body).addEventListener('click', () => refreshWeatherTable(true));
}

function openWeatherArchive() {
  activeWeatherMonth = Number(dailyDateKey.slice(5, 7));
  renderWeatherArchiveBody();
  $('#weatherArchiveDialog').showModal();
  refreshWeatherTable();
}

function openWeatherMilestoneDetail(id) {
  const item = weatherMilestones.find(event => Number(event.id) === Number(id));
  if (!item) return;
  activeWeatherMilestoneId = item.id;
  $('#weatherMilestoneDetailTitle').textContent = item.title;
  $('#weatherMilestoneDetailBody').innerHTML = `<section class="weather-milestone-detail ${escapeHtml(item.type)}"><span>${escapeHtml(milestoneTypeLabel(item.type))}</span><strong>${escapeHtml(item.date)}</strong><p>${escapeHtml(item.note || '未填写补充说明')}</p></section>`;
  $('#weatherMilestoneDetailDialog').showModal();
}

function openWeatherSetting() {
  const form = $('#weatherSettingForm');
  form.elements.city.value = weatherConfig.city || '';
  form.elements.latitude.value = weatherConfig.latitude ?? 36.06;
  form.elements.longitude.value = weatherConfig.longitude ?? 103.83;
  $('#weatherSettingDialog').showModal();
}

function dateDistance(start, end) {
  return Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000);
}

function renderPlanGanttRow(plan, rangeStart, rangeEnd, compactDay = false) {
  const totalDays = Math.max(1, dateDistance(rangeStart, rangeEnd) + 1);
  const clippedStart = plan.start < rangeStart ? rangeStart : plan.start;
  const clippedEnd = plan.end > rangeEnd ? rangeEnd : plan.end;
  const left = Math.max(0, dateDistance(rangeStart, clippedStart) / totalDays * 100);
  const duration = Math.max(1, dateDistance(clippedStart, clippedEnd) + 1);
  const width = compactDay ? Math.max(4, Number(plan.dailyTarget ?? 100)) : Math.max(2.5, duration / totalDays * 100);
  const owners = planOwners(plan).join('、') || plan.compiler || plan.ownerRole || '待明确';
  const record = plan.level === 'day' ? getPlanExecutionRecord(plan) : null;
  return `<article class="schedule-gantt-row ${plan.level === 'day' ? 'day' : 'period'}"><div class="schedule-gantt-copy"><strong>${escapeHtml(plan.title)}</strong><small>${escapeHtml(plan.level === 'day' ? `${owners} · ${plan.team || '待定班组'}` : `编制人：${plan.compiler || owners}`)}</small></div><div class="schedule-gantt-track"><i style="left:${left}%;width:${Math.min(100 - left, width)}%"><span>${plan.level === 'day' ? `${Number(plan.dailyTarget ?? 100)}%` : `${plan.start.slice(5)}—${plan.end.slice(5)}`}</span></i></div>${plan.level === 'day' ? `<span data-label="需完成">${Number(plan.dailyTarget ?? 100)}%</span><span data-label="责任人">${escapeHtml(owners)}</span><span data-label="责任班组">${escapeHtml(plan.team || '待明确')}</span><span data-label="日期">${escapeHtml(plan.start)}</span>` : `<span>${escapeHtml(plan.start)}</span><span>${escapeHtml(plan.end)}</span><span>${record ? `${Number(record.progress || 0)}%` : escapeHtml(plan.compiler || owners)}</span>`}${plan.level === 'day' ? '<span class="meeting-readonly-hint">由每日例会统一编制</span>' : `<button type="button" class="edit-action" data-edit-plan="${plan.id}">编辑</button>`}</article>`;
}

function renderGanttScale(start, end) {
  const days = Math.max(1, dateDistance(start, end) + 1);
  const marks = Array.from({ length: Math.min(days, 12) }, (_, index) => {
    const offset = Math.round(index * (days - 1) / Math.max(1, Math.min(days, 12) - 1));
    return shiftDateKey(start, offset).slice(5);
  });
  return `<div class="schedule-gantt-scale">${marks.map(mark => `<span>${mark}</span>`).join('')}</div>`;
}

function planFileSource(file) {
  return file?.data || (file?.storageKey && window.ZhuxuServer?.active ? window.ZhuxuServer.attachmentUrl(file.storageKey) : '');
}

function planFileMedia(file, source = '') {
  const kind = attachmentKind(file || {});
  if (!file) return '';
  if (!source && file.storageKey) return `<div class="plan-file-loading" data-plan-preview-storage="${escapeHtml(file.storageKey)}" data-preview-kind="${kind}" data-preview-name="${escapeHtml(file.name)}"><span></span><strong>正在载入计划原文件</strong><small>${escapeHtml(file.name)}</small></div>`;
  if (!source) return `<div class="plan-file-unavailable"><span>FILE</span><strong>${escapeHtml(file.name)}</strong><small>原文件尚未完整保存，请重新上传。</small></div>`;
  if (kind === 'image') return `<img src="${source}" alt="${escapeHtml(file.name)}">`;
  if (kind === 'pdf') return `<iframe src="${source}" title="${escapeHtml(file.name)}"></iframe>`;
  return `<div class="plan-file-unavailable ready"><span>FILE</span><strong>${escapeHtml(file.name)}</strong><small>此格式由系统保留原文件，点击“放大查看”使用适合的软件打开。</small></div>`;
}

function renderPlanFileCanvas(plan, emptyTitle, emptyCopy) {
  const file = plan?.attachments?.[0];
  const media = file ? planFileMedia(file, planFileSource(file)) : `<div class="plan-file-empty"><span>▥</span><strong>${escapeHtml(emptyTitle)}</strong><small>${escapeHtml(emptyCopy)}</small></div>`;
  return `<div class="plan-file-canvas ${file ? 'has-file' : 'empty'}"${file ? ` data-plan-canvas="${plan.id}"` : ''}>${media}${file ? `<button type="button" class="plan-file-enlarge" data-plan-attachment="${plan.id}"><span>⛶</span> 放大查看原文件</button>` : ''}</div>`;
}

async function hydratePlanFilePreviews(container) {
  planPreviewUrls.forEach(url => URL.revokeObjectURL(url));
  planPreviewUrls = [];
  for (const node of $$('[data-plan-preview-storage]', container)) {
    try {
      const stored = await getResourceAttachment(node.dataset.planPreviewStorage);
      if (!stored?.blob || !node.isConnected) continue;
      const source = URL.createObjectURL(stored.blob);
      planPreviewUrls.push(source);
      const file = { name: node.dataset.previewName, type: stored.type || '' };
      node.replaceWith(document.createRange().createContextualFragment(planFileMedia(file, source)));
    } catch (error) {
      node.innerHTML = '<strong>计划文件读取失败</strong><small>请重新上传原文件。</small>';
    }
  }
}

function findPeriodFilePlan(level, start, end) {
  return plans.find(plan => plan.level === level && plan.isScheduleFile && plan.start === start && plan.end === end)
    || plans.find(plan => plan.level === level && (plan.attachments || []).length && plan.start <= end && plan.end >= start);
}

function renderPeriodPlanWorkspace({ level, start, end, title, plan, workCount = 0 }) {
  const levelLabel = level === 'month' ? '月计划' : '周计划';
  const autoChart=level==='week'?renderAutoWeekChart(start,end):'';
  return `<section class="period-plan-workspace"><div class="period-plan-toolbar"><div><span>${level === 'month' ? 'MONTHLY SCHEDULE' : 'WEEKLY SCHEDULE'}</span><strong>${escapeHtml(title)}</strong><small>${start}—${end} · ${workCount} 项执行工作${plan?.attachments?.[0] ? ` · ${escapeHtml(plan.attachments[0].name)}` : ''}</small></div><div class="goal-actions">${renderRecognitionFileAction(plan)}<button type="button" data-upload-period-plan data-period-level="${level}" data-period-start="${start}" data-period-end="${end}" data-period-title="${escapeHtml(title)}">${plan?.attachments?.[0] ? `更换${levelLabel}文件` : `上传${levelLabel}`}</button></div></div>${plan?.attachments?.length||!autoChart?renderPlanFileCanvas(plan, `上传${title}原文件`, `支持 PDF、图片、Excel、Word、MPP 等计划文件；上传后直接在这里显示。`):''}${autoChart}</section>${renderScheduleGoals(level,start,end)}`;
}

function renderMasterPlanBoard() {
  const master = plans.find(plan => plan.level === 'master');
  const file = master?.attachments?.[0];
  return `<section class="master-plan-board"><div class="master-plan-heading"><div><span>MASTER SCHEDULE</span><strong>${escapeHtml(master?.title || '项目总进度计划')}</strong><small>${master ? `${master.start}—${master.end}${file ? ` · ${escapeHtml(file.name)}` : ''}` : '等待上传批准版总计划'}</small></div><div><button type="button" data-upload-master-plan>${file ? '更换总计划文件' : '上传总计划文件'}</button></div></div>${renderPlanFileCanvas(master, '上传总进度网络图或横道图', '总计划不在系统内编制；上传后原文件直接在本页展示。')}</section>`;
}

function renderMonthPlanBoard() {
  const month = activeScheduleMonth;
  const start = `${activeScheduleYear}-${String(month).padStart(2, '0')}-01`;
  const end = `${activeScheduleYear}-${String(month).padStart(2, '0')}-${String(new Date(activeScheduleYear, month, 0).getDate()).padStart(2, '0')}`;
  const workPlans = plans.filter(plan => plan.level === 'month' && !plan.isScheduleFile && plan.start <= end && plan.end >= start);
  const filePlan = findPeriodFilePlan('month', start, end);
  const selector = `<div class="schedule-month-selector schedule-month-selector-large">${Array.from({length:12},(_,index)=>`<button type="button" class="${month === index + 1 ? 'active' : ''}" data-schedule-month-select="${index + 1}">${index + 1}月<span>${plans.some(plan => plan.level === 'month' && (plan.attachments || []).length && plan.start.slice(0,7) === `${activeScheduleYear}-${String(index + 1).padStart(2,'0')}`) ? '●' : ''}</span></button>`).join('')}</div>`;
  return `${selector}${renderPeriodPlanWorkspace({ level: 'month', start, end, title: `${month}月进度计划`, plan: filePlan, workCount: workPlans.length })}`;
}

function renderWeekPlanBoard() {
  const monthPrefix = `${activeScheduleYear}-${String(activeScheduleMonth).padStart(2,'0')}`;
  const ranges = ZhuxuScheduleRules.weeks(activeScheduleYear,activeScheduleMonth);
  const selector = `<div class="schedule-month-selector">${Array.from({length:12},(_,i)=>`<button type="button" class="${activeScheduleMonth===i+1?'active':''}" data-schedule-month-select="${i+1}">${i+1}月</button>`).join('')}</div>`;
  const legacy = plans.filter(p=>p.level==='week' && (p.attachments||[]).length && p.start.slice(0,7)===monthPrefix && !ranges.some(w=>w.start===p.start && w.end===p.end));
  return `${selector}<p class="schedule-goal-hint">按周一至周日展示自然周；跨月周的目标分别关联各自月份，日执行按所属月目标归集。</p><section class="schedule-period-board week-file-board">${ranges.map((range,index)=>{
    const filePlan=plans.find(p=>p.level==='week' && p.start===range.start && p.end===range.end && (p.isScheduleFile || p.attachments?.length));
    const title=`${activeScheduleMonth}月第${index+1}周 · ${range.start}—${range.end}`;
    const generated=plans.some(p=>p.level==='week'&&p.source==='月计划自动分周'&&p.start<=range.end&&p.end>=range.start);
    return `<details class="schedule-period-group week-file-group" data-period-details${range.start<=dailyDateKey && range.end>=dailyDateKey?' open':''}><summary><span>W${index+1}</span><div><strong>${title}</strong><small>自然周 · 周一至周日</small></div><em>${filePlan?.attachments?.length?'已上传':generated?'已自动生成':'待上传'}</em><i>⌄</i></summary><div class="schedule-period-body">${renderPeriodPlanWorkspace({level:'week',...range,title,plan:filePlan})}</div></details>`;
  }).join('')}</section>${legacy.length?`<section class="schedule-goals"><h3>原周期计划文件（保留原日期）</h3>${legacy.map(p=>`<details><summary>${escapeHtml(p.title)} · ${p.start}—${p.end}</summary>${renderPlanFileCanvas(p,'原计划文件','')}</details>`).join('')}</section>`:''}`;
}

function renderDayPlanBoard() {
  const dayPlans = plans.filter(plan => plan.level === 'day' && !plan.archived).sort((a,b) => String(b.start).localeCompare(String(a.start)));
  const groups = [...new Set(dayPlans.map(plan => plan.start))];
  return `<section class="daily-gantt-board"><div class="daily-gantt-columns"><span>施工内容 / 横道</span><span>当日需完成</span><span>责任人</span><span>责任班组</span><span>日期</span><span>操作</span></div>${groups.map(date => { const datePlans = dayPlans.filter(plan => plan.start === date); return `<details class="daily-gantt-date" data-plan-date="${date}"${date === dailyDateKey ? ' open' : ''}><summary><strong>${formatDailyPlanGroupLabel(date)}</strong><span>${datePlans.length} 项施工任务</span><i>⌄</i></summary><div>${datePlans.map(plan => renderPlanGanttRow(plan,date,date,true)).join('')}</div></details>`; }).join('') || '<div class="resource-empty">尚未编制日计划，点击右上角“新建日计划”。</div>'}</section>`;
}

function renderScheduleBody() {
  const levels = { master: '总计划', month: '月计划', week: '周计划', day: '日计划' };
  const content = activePlanLevel === 'master' ? renderMasterPlanBoard() : activePlanLevel === 'month' ? renderMonthPlanBoard() : activePlanLevel === 'week' ? renderWeekPlanBoard() : renderDayPlanBoard();
  return `<div class="plan-level-tabs" role="tablist" aria-label="计划层级">${Object.entries(levels).map(([key, label]) => `<button type="button" class="${key === activePlanLevel ? 'active' : ''}" data-plan-level="${key}">${label}<b>${key === 'month' ? 12 : key === 'week' ? ZhuxuScheduleRules.weeks(activeScheduleYear,activeScheduleMonth).length : plans.filter(plan => plan.level === key && !plan.archived).length}</b></button>`).join('')}</div>${renderLinkedSampleLoader()}${renderRecognitionToolbar()}${content}`;
}

function updatePlanParentField(selectedParentId = '') {
  const form = $('#planForm');
  const isDay = form.elements.level.value === 'day';
  const field = $('#parentWeekPlanField');
  field.hidden = !isDay;
  const start = form.elements.start.value || dailyDateKey;
  const weekPlans = plans.filter(plan => plan.level === 'week' && !plan.isScheduleFile && plan.start <= start && plan.end >= start);
  form.elements.parentId.innerHTML = `<option value="">计划外 / 请明确选择所属周任务</option>${weekPlans.map(plan => `<option value="${plan.id}">${escapeHtml(plan.title)} · ${plan.start}—${plan.end}</option>`).join('')}`;
  if (selectedParentId && weekPlans.some(plan => Number(plan.id) === Number(selectedParentId))) form.elements.parentId.value = String(selectedParentId);
}

function updatePlanFields() {
  const form = $('#planForm');
  const isDay = form.elements.level.value === 'day';
  $('#planCompilerField').hidden = true;
  $('#planOwnerRoleField').hidden = true;
  $('#planOwnersField').hidden = true;
  $('#planTeamField').hidden = true;
  $('#planDailyTargetField').hidden = true;
  $('#planDayRowsSection').hidden = !isDay;
}

function openPlanDialog(plan = null, preset = {}) {
  const form = $('#planForm');
  form.reset();
  const unconfirmedToday = dailyExecution.filter(item => item.date === dailyDateKey && item.autoGenerated === true && item.confirmed !== true).length;
  if (unconfirmedToday) showToast(`提醒：今日还有 ${unconfirmedToday} 项计划未完成人工确认或修改，请先在每日任务执行中确认`);
  editingPlanId = plan?.id || null;
  planRecognitionCandidates = [];
  planAttachmentsDraft = [];
  planSubtasksDraft = [];
  const legacyRows = (plan?.subTasks || []).filter(item => item.title).map(item => ({ id: item.id || null, title: item.title || '', dailyTarget: plan?.dailyTarget ?? 100, owners: item.owner || planOwners(plan).join('、'), team: item.team || plan?.team || '' }));
  planDayRowsDraft = legacyRows.length ? legacyRows : plan ? [{ id: plan.id, title: plan.title || '', dailyTarget: plan.dailyTarget ?? 100, owners: planOwners(plan).join('、'), team: plan.team || '' }] : Array.from({ length: 4 }, () => ({ id: null, title: '', dailyTarget: 100, owners: '', team: '' }));
  renderPlanRecognitionCandidates();
  renderPlanAttachmentList();
  renderPlanSubtaskList();
  renderPlanDayRows();
  form.elements.level.value = 'day';
  form.elements.title.value = plan?.title || '';
  form.elements.start.value = plan?.start || preset.start || new Date().toISOString().slice(0, 10);
  form.elements.end.value = form.elements.start.value;
  form.elements.compiler.value = '';
  form.elements.ownerRole.value = plan?.ownerRole || '生产经理';
  form.elements.owners.value = Array.isArray(plan?.owners) ? plan.owners.join('、') : (plan?.owners || '');
  form.elements.team.value = plan?.team || '';
  form.elements.dailyTarget.value = plan?.dailyTarget ?? 100;
  updatePlanParentField(plan?.parentId || '');
  updatePlanFields();
  $('#planDialog .dialog-heading h2').textContent = plan ? '编辑当日施工计划' : '批量编制日计划';
  form.querySelector('[type="submit"]').textContent = plan ? '保存修改' : '保存全部日计划';
  $('#cancelEditingPlanButton').hidden = !plan;
  $('#planDialog').showModal();
}

function setPlanMode(mode) {
  $$('[data-plan-mode]').forEach(button => button.classList.toggle('active', button.dataset.planMode === mode));
  if ($('#planImportPanel')) $('#planImportPanel').hidden = mode !== 'import';
}

const technicalTypeLabels = { drawing: '施工图纸', change: '设计变更', contact: '联系函', instruction: '指令单' };
const DRAWING_PROFESSIONS = ['结构', '建筑', '暖通', '采暖', '给排水', '电气', '消防'];
function detectProfession(text) {
  const source = String(text || '');
  const rules = [
    ['结构', /结构|梁|板|柱|基础|钢筋|剪力墙|模板|楼梯/],
    ['建筑', /建筑|平面|立面|剖面|门窗|装修|幕墙|节点/],
    ['暖通', /暖通|空调|风管|新风|通风/],
    ['采暖', /采暖|地暖|散热器/],
    ['给排水', /给排水|给水|排水|雨水|污水|中水|水泵/],
    ['电气', /电气|照明|插座|强电|弱电|桥架|防雷|配电/],
    ['消防', /消防|喷淋|报警|消火栓|疏散/]
  ];
  return rules.find(([, pattern]) => pattern.test(source))?.[0] || '';
}
function professionLabel(profession) { return profession || '其他'; }

function technicalBuildingName(documentItem) {
  const source = `${documentItem.scope || ''} ${documentItem.title || ''}`;
  return documentItem.building || source.match(/\d+#楼|地下室|室外工程|项目部/)?.[0] || '综合图纸';
}

function renderTechnicalDocumentsBody() {
  const types = [['drawing','施工图纸'],['change','设计变更'],['contact','联系函'],['instruction','指令单']];
  const query = activeTechnicalSearch.trim().toLowerCase();
  const matchesSearch = item => !query || [item.title,item.code,item.scope,item.building,item.profession,item.issuedBy,item.content,...(item.files || []).map(file => file.name)].join(' ').toLowerCase().includes(query);
  const drawings = technicalDocuments.filter(item => item.type === 'drawing' && matchesSearch(item));
  const drawingFolders = [...new Set([...(query ? [] : drawingBuildings), ...drawings.map(technicalBuildingName)])].sort((a,b) => a.localeCompare(b,'zh-CN'));
  const visible = technicalDocuments.filter(item => {
    if (!matchesSearch(item)) return false;
    if (activeTechnicalFilter !== 'all' && item.type !== activeTechnicalFilter) return false;
    if (activeTechnicalFilter === 'drawing' && activeTechnicalBuilding !== 'all' && technicalBuildingName(item) !== activeTechnicalBuilding) return false;
    if (activeTechnicalFilter === 'drawing' && activeTechnicalBuilding !== 'all' && activeTechnicalProfession !== 'all' && professionLabel(item.profession) !== activeTechnicalProfession) return false;
    return activeTechnicalFilter !== 'drawing' || activeTechnicalBuilding !== 'all' || Boolean(query);
  }).sort((a,b) => String(b.issuedAt).localeCompare(String(a.issuedAt)));
  const drawingBrowser = activeTechnicalFilter === 'drawing' ? `<section class="technical-building-browser"><div class="technical-building-heading"><div><span>DRAWING ARCHIVE</span><strong>${activeTechnicalBuilding === 'all' ? '按单体查看施工图' : `${escapeHtml(activeTechnicalBuilding)} · 专业子文件夹`}</strong><small>图纸按“单体 / 专业 / 图纸”归档；打开专业子文件夹后可直接打开原图纸</small></div><div>${activeTechnicalBuilding !== 'all' ? `<button type="button" data-technical-building="all">← 返回全部单体</button>` : `<button type="button" data-new-drawing-building>＋ 新建单体</button>`}</div></div><div class="technical-building-folders">${activeTechnicalBuilding === 'all' ? drawingFolders.map(building => { const items = drawings.filter(item => technicalBuildingName(item) === building); const professionSummary = [...new Set(items.map(item => professionLabel(item.profession)))].slice(0, 3).map(profession => `${profession} ${items.filter(item => professionLabel(item.profession) === profession).length}`).join(' · '); return `<button type="button" data-technical-building="${escapeHtml(building)}"><i><span></span></i><strong>${escapeHtml(building)}</strong><small>${items.length} 张施工图 · ${professionSummary || '空文件夹，可开始上传图纸'}</small><em>${items.length ? '打开单体 →' : '空文件夹'}</em></button>`; }).join('') : [...new Set(drawings.filter(item => technicalBuildingName(item) === activeTechnicalBuilding).map(item => professionLabel(item.profession)))].map(profession => { const count = drawings.filter(item => technicalBuildingName(item) === activeTechnicalBuilding && professionLabel(item.profession) === profession).length; return `<button type="button" class="${activeTechnicalProfession === profession ? 'active' : ''}" data-technical-profession="${escapeHtml(profession)}"><i><span></span></i><strong>${escapeHtml(profession)}专业</strong><small>${count} 张图纸</small><em>${activeTechnicalProfession === profession ? '收起子文件夹' : '打开子文件夹 →'}</em></button>`; }).join('')}</div>${activeTechnicalBuilding === 'all' && drawingFolders.length ? '<p class="technical-folder-hint">先打开单体，再进入专业子文件夹查看图纸。</p>' : ''}</section>` : '';
  return `<section class="technical-file-overview"><div><span>TECHNICAL FILE REGISTER</span><h2>项目技术文件统一入口</h2><p>技术负责人上传原文件并注明适用部位，现场人员可随时查看；关联任务中的变更和指令会突出风险提醒。</p></div><div>${types.map(([key,label]) => `<button type="button" class="${activeTechnicalFilter === key ? 'active' : ''}" data-technical-overview-filter="${key}"><strong>${technicalDocuments.filter(item => item.type === key).length}</strong><span>${label}</span><em>${key === 'drawing' ? '打开单体文件夹' : '直接查看文件'} →</em></button>`).join('')}</div></section>
    <div class="technical-file-tabs">${types.map(([key,label]) => `<button type="button" class="${activeTechnicalFilter === key ? 'active' : ''}" data-technical-filter="${key}">${label}<b>${technicalDocuments.filter(item => item.type === key).length}</b></button>`).join('')}</div>
    <div class="technical-search-bar"><input id="technicalSearchInput" value="${escapeHtml(activeTechnicalSearch)}" placeholder="输入图纸名称、文件编号、专业、部位或附件名"><button type="button" data-technical-search-submit>查找文件</button>${activeTechnicalSearch ? '<button type="button" data-technical-search-clear>清空</button>' : ''}<span>${query ? `找到 ${visible.length || drawings.length} 项` : '支持图纸和全部技术文件'}</span></div>
    ${drawingBrowser}
    ${activeTechnicalFilter === 'drawing' && (activeTechnicalBuilding === 'all' || activeTechnicalProfession === 'all') && !query ? '' : `<section class="technical-file-register"><div class="technical-file-row header"><span>类别 / 编号</span><span>文件名称与适用范围</span><span>发布人</span><span>发布日期</span><span>原文件</span><span>操作</span></div>${visible.map(item => `<button type="button" class="technical-file-row" ${item.type === 'drawing' ? `data-open-drawing="${item.id}"` : `data-technical-document="${item.id}"`}><span><i class="${item.type}">${technicalTypeLabels[item.type]?.slice(0,1) || '技'}</i><b>${escapeHtml(technicalTypeLabels[item.type] || item.type)}${item.profession ? ` · ${escapeHtml(item.profession)}` : ''}</b><small>${escapeHtml(item.code)}</small></span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(technicalBuildingName(item))}${item.profession ? ` · ${escapeHtml(item.profession)}` : ''} · ${escapeHtml(item.scope)}</small></span><span>${escapeHtml(item.issuedBy)}</span><span>${escapeHtml(item.issuedAt)}</span><span>${(item.files || []).length} 个附件</span><em>${item.type === 'drawing' ? '打开图纸' : '查看内容'} →</em></button>`).join('') || '<div class="resource-empty">没有找到匹配文件；可调整关键词或重新选择分类。</div>'}</section>`}`;
}

function renderTechnicalFileDraftList() {
  const list = $('#technicalFileDraftList');
  if (!list) return;
  list.innerHTML = technicalFilesDraft.length ? technicalFilesDraft.map((file, index) => `<div><i>${attachmentKind(file) === 'pdf' ? 'PDF' : attachmentKind(file) === 'image' ? 'IMG' : 'FILE'}</i><span><strong>${escapeHtml(file.name)}</strong><small>${formatAttachmentSize(file.size)}</small></span><button type="button" data-remove-technical-draft="${index}">删除</button></div>`).join('') : '<p>尚未保留原文件；可在上方重新上传。</p>';
  $$('[data-remove-technical-draft]', list).forEach(button => button.addEventListener('click', () => { technicalFilesDraft.splice(Number(button.dataset.removeTechnicalDraft), 1); renderTechnicalFileDraftList(); }));
}

function openTechnicalDocumentDialog(typeOrItem = '') {
  const form = $('#technicalDocumentForm');
  form.reset();
  const item = typeof typeOrItem === 'object' ? typeOrItem : null;
  linkingTechnicalTaskId = null;
  linkingTechnicalTaskDate = null;
  const type = item?.type || typeOrItem || 'drawing';
  editingTechnicalDocumentId = item?.id || null;
  technicalFilesDraft = [...(item?.files || [])];
  form.elements.type.value = type;
  form.elements.code.value = item?.code || '';
  form.elements.title.value = item?.title || '';
  form.elements.building.value = item?.building || '';
  form.elements.profession.value = item?.profession || '';
  form.elements.issuedBy.value = item?.issuedBy || matchPersonByRole('技术负责人');
  form.elements.issuedAt.value = item?.issuedAt || dailyDateKey;
  form.elements.scope.value = item?.scope || '';
  form.elements.content.value = item?.content || '';
  $('#professionField').hidden = form.elements.type.value !== 'drawing';
  $('#technicalDocumentDialog .dialog-heading h2').textContent = item ? '编辑技术文件与原附件' : '上传图纸、变更、联系函或指令单';
  form.querySelector('[type="submit"]').textContent = item ? '保存修改' : '保存技术文件';
  renderTechnicalFileDraftList();
  $('#technicalDocumentDialog').showModal();
}

function openTechnicalDrawing(documentId) {
  const item = technicalDocuments.find(document => Number(document.id) === Number(documentId));
  const file = item?.files?.[0];
  if (!file) { showToast('该图纸尚未保存原文件，请编辑后重新上传'); if (item) openTechnicalDocumentDialog(item); return; }
  if (file.storageKey && window.ZhuxuServer?.active) {
    window.open(window.ZhuxuServer.attachmentUrl(file.storageKey), '_blank', 'noopener');
    return;
  }
  previewStoredAttachment(file);
}

async function importDrawingFolder(files, targetBuilding = '') {
  const items = [...files].sort((a, b) => String(a.webkitRelativePath || a.name).localeCompare(String(b.webkitRelativePath || b.name)));
  if (!items.length) return 0;
  const stateEl = $('#drawingFolderState');
  if (stateEl) { stateEl.textContent = `正在导入 ${items.length} 个图纸文件…`; stateEl.classList.add('working'); }
  const created = [];
  for (let index = 0; index < items.length; index += 1) {
    const file = items[index];
    const rel = file.webkitRelativePath || file.name;
    const segments = rel.split('/').filter(Boolean);
    const fileName = segments.pop() || file.name;
    const building = (targetBuilding || '').trim() || (segments[0] || '').trim() || '综合图纸';
    let profession = segments[1] && DRAWING_PROFESSIONS.includes(segments[1].trim()) ? segments[1].trim() : '';
    if (!profession) profession = detectProfession(`${fileName} ${building} ${segments.join(' ')}`);
    const title = fileName.replace(/\.[^.]+$/, '');
    try {
      const attachments = await prepareResourceAttachments([file]);
      created.push({ id: Date.now() + index + 1, type: 'drawing', code: '', title, building, profession, issuedBy: currentOperatorLabel(), issuedAt: dailyDateKey, scope: `${building}${profession ? ` · ${profession}` : ''}`, content: `图纸文件：${rel}\n单体：${building}${profession ? `\n专业：${profession}` : ''}`, files: attachments, status: 'valid', createdAt: new Date().toISOString(), createdBy: currentOperatorLabel(), fromFolder: true });
    } catch (error) { /* 单个文件导入失败时跳过 */ }
  }
  technicalDocuments.unshift(...created);
  created.forEach(item => { if (item.building && !drawingBuildings.includes(item.building)) drawingBuildings.push(item.building); });
  persistTechnicalDocuments();
  persistDrawingBuildings();
  if (stateEl) { stateEl.textContent = `已导入 ${created.length} 个图纸文件${created.length !== items.length ? `（跳过 ${items.length - created.length} 个）` : ''}`; stateEl.classList.remove('working'); }
  if (created.length) showToast(`已导入 ${created.length} 张施工图，归属单体：${created[0].building}`);
  return created.length;
}

function openTechnicalDocumentDetail(documentId) {
  const documentItem = technicalDocuments.find(item => Number(item.id) === Number(documentId));
  if (!documentItem) return;
  $('#technicalDocumentDetailType').textContent = `${technicalTypeLabels[documentItem.type] || '技术文件'} · ${documentItem.code}`;
  $('#technicalDocumentDetailTitle').textContent = documentItem.title;
  $('#technicalDocumentDetailBody').innerHTML = `<section class="technical-document-paper"><div class="technical-document-stamp ${documentItem.type}"><span>${escapeHtml(technicalTypeLabels[documentItem.type] || '技术文件')}</span><strong>${escapeHtml(documentItem.code)}</strong></div><div class="technical-document-title"><h3>${escapeHtml(documentItem.title)}</h3><span>现行有效</span></div><p>${escapeHtml(documentItem.content)}</p><dl><div><dt>所属单体 / 分区</dt><dd>${escapeHtml(technicalBuildingName(documentItem))}</dd></div><div><dt>适用部位</dt><dd>${escapeHtml(documentItem.scope)}</dd></div><div><dt>发布人</dt><dd>${escapeHtml(documentItem.issuedBy)}</dd></div><div><dt>发布日期</dt><dd>${escapeHtml(documentItem.issuedAt)}</dd></div></dl><button type="button" class="technical-edit-document" data-edit-technical-detail="${documentItem.id}">编辑文件信息与附件</button></section><section class="technical-document-files"><div class="technical-document-files-heading"><strong>${documentItem.type === 'drawing' ? '施工图原文件' : '上传的原文件'} · ${(documentItem.files || []).length}</strong><button type="button" data-reupload-technical="${documentItem.id}">重新上传文件</button></div>${(documentItem.files || []).map((file,index) => `<div class="technical-document-file-item"><button type="button" data-technical-detail-file="${index}"><i>${attachmentKind(file) === 'pdf' ? 'PDF' : attachmentKind(file) === 'image' ? 'IMG' : 'FILE'}</i><span><b>${escapeHtml(file.name)}</b><small>${file.stored ? '点击直接在线查看原文件' : '示例文件名；重新上传后可在线查看'}</small></span><em>${documentItem.type === 'drawing' ? '打开图纸' : '查看'}</em></button><button type="button" class="technical-file-delete" data-delete-technical-file="${index}">删除</button></div>`).join('') || '<p>尚未上传原文件，可点击“重新上传文件”补充。</p>'}</section>`;
  $$('[data-technical-detail-file]', $('#technicalDocumentDetailBody')).forEach(button => button.addEventListener('click', () => previewStoredAttachment((documentItem.files || [])[Number(button.dataset.technicalDetailFile)])));
  $$('[data-edit-technical-detail], [data-reupload-technical]', $('#technicalDocumentDetailBody')).forEach(button => button.addEventListener('click', () => { $('#technicalDocumentDetailDialog').close(); openTechnicalDocumentDialog(documentItem); }));
  $$('[data-delete-technical-file]', $('#technicalDocumentDetailBody')).forEach(button => button.addEventListener('click', () => {
    documentItem.files.splice(Number(button.dataset.deleteTechnicalFile), 1);
    persistTechnicalDocuments();
    $('#technicalDocumentDetailDialog').close();
    openTechnicalDocumentDetail(documentItem.id);
    showToast('原文件已从该技术文件中删除');
  }));
  $('#technicalDocumentDetailDialog').showModal();
}

const costTypeLabels = { contract: '合同', economic: '经济核定单', quantity: '现场工程量确认单' };

function renderCostDocumentsBody() {
  if (!hasCostAccess()) return '<section class="cost-restricted-state"><span>¥</span><strong>当前岗位无成控文件权限</strong><p>请使用项目经理、商务、成本或造价岗位账号登录。</p></section>';
  const types = [['all','全部'],['contract','合同'],['economic','经济核定单'],['quantity','现场工程量确认单']];
  const visible = costDocuments.filter(item => activeCostFilter === 'all' || item.type === activeCostFilter).sort((a,b) => String(b.issuedAt).localeCompare(String(a.issuedAt)));
  const recognizedAmount = costDocuments.reduce((sum,item) => sum + Number(String(item.amount || '').replace(/[^\d.]/g,'')),0);
  return `<section class="cost-control-hero"><div><span>COST CONTROL ARCHIVE</span><h2>过程成本依据统一归档</h2><p>合同明确计价边界，经济核定单记录价格变化，现场工程量确认单锁定实际发生量；原件和签字依据随时可查。</p><strong>已登记金额 <b>¥${recognizedAmount.toLocaleString('zh-CN')}</b></strong></div><div>${types.slice(1).map(([key,label]) => `<button type="button" class="${activeCostFilter === key ? 'active' : ''}" data-cost-overview-filter="${key}"><i>${key === 'contract' ? '合' : key === 'economic' ? '核' : '量'}</i><span><strong>${costDocuments.filter(item => item.type === key).length}</strong><small>${label}</small></span><em>进入台账 →</em></button>`).join('')}</div></section><div class="cost-file-tabs">${types.map(([key,label]) => `<button type="button" class="${activeCostFilter === key ? 'active' : ''}" data-cost-filter="${key}">${label}<b>${key === 'all' ? costDocuments.length : costDocuments.filter(item => item.type === key).length}</b></button>`).join('')}</div><section class="cost-file-register"><div class="cost-file-row header"><span>类别 / 编号</span><span>文件名称与部位</span><span>责任单位</span><span>涉及金额</span><span>日期</span><span>操作</span></div>${visible.map(item => `<button type="button" class="cost-file-row" data-cost-document="${item.id}"><span><i class="${item.type}">${item.type === 'contract' ? '合' : item.type === 'economic' ? '核' : '量'}</i><b>${escapeHtml(costTypeLabels[item.type] || item.type)}</b><small>${escapeHtml(item.code)}</small></span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.zone)}</small></span><span>${escapeHtml(item.party)}</span><strong class="cost-amount">${escapeHtml(item.amount || '待核定')}</strong><span>${escapeHtml(item.issuedAt)}</span><em>查看依据 →</em></button>`).join('') || '<div class="resource-empty">当前类别还没有成控文件，点击右上角新增。</div>'}</section>`;
}

function openCostDocumentDialog() {
  if (!hasCostAccess()) { openCostAccessDenied(); return; }
  const form = $('#costDocumentForm');
  form.reset();
  form.elements.issuedAt.value = dailyDateKey;
  $('#costDocumentDialog').showModal();
}

function openCostDocumentDetail(documentId) {
  if (!hasCostAccess()) { openCostAccessDenied(); return; }
  const documentItem = costDocuments.find(item => Number(item.id) === Number(documentId));
  if (!documentItem) return;
  $('#costDocumentDetailType').textContent = `${costTypeLabels[documentItem.type] || '成控文件'} · ${documentItem.code}`;
  $('#costDocumentDetailTitle').textContent = documentItem.title;
  $('#costDocumentDetailBody').innerHTML = `<section class="cost-document-paper"><div class="cost-document-stamp ${documentItem.type}"><span>${escapeHtml(costTypeLabels[documentItem.type] || '成控文件')}</span><strong>${escapeHtml(documentItem.code)}</strong></div><h3>${escapeHtml(documentItem.title)}</h3><p>${escapeHtml(documentItem.content)}</p><dl><div><dt>责任单位 / 对方单位</dt><dd>${escapeHtml(documentItem.party)}</dd></div><div><dt>所属单体 / 部位</dt><dd>${escapeHtml(documentItem.zone)}</dd></div><div><dt>涉及金额</dt><dd class="cost-detail-amount">${escapeHtml(documentItem.amount || '待核定')}</dd></div><div><dt>签发 / 确认日期</dt><dd>${escapeHtml(documentItem.issuedAt)}</dd></div></dl></section><section class="technical-document-files"><strong>成本依据原文件 · ${(documentItem.files || []).length}</strong>${(documentItem.files || []).map((file,index) => `<button type="button" data-cost-detail-file="${index}"><i>${attachmentKind(file) === 'pdf' ? 'PDF' : attachmentKind(file) === 'image' ? 'IMG' : 'FILE'}</i><span><b>${escapeHtml(file.name)}</b><small>${file.stored ? '点击在线查看签章原件' : '示例文件名；重新上传后可在线查看'}</small></span><em>打开原件</em></button>`).join('') || '<p>尚未上传原文件</p>'}</section>`;
  $$('[data-cost-detail-file]', $('#costDocumentDetailBody')).forEach(button => button.addEventListener('click', () => previewStoredAttachment((documentItem.files || [])[Number(button.dataset.costDetailFile)])));
  $('#costDocumentDetailDialog').showModal();
}

function resourceApprovalSummary(plan) {
  if (plan.type !== 'material') return '设备计划';
  const workflow = plan.approvalWorkflow || [];
  if (workflow.some(step => step.status === 'rejected')) return '审批已退回';
  if (workflow.length && workflow.every(step => step.status === 'approved')) return '审批已完成';
  return '审批进行中';
}

function isMaterialPlanApproved(plan) {
  const workflow = plan?.approvalWorkflow || [];
  return plan?.type === 'material' && workflow.length === approvalSequenceRoles.length && approvalSequenceRoles.every((role, index) => workflow[index]?.role === role && workflow[index]?.status === 'approved');
}

function syncMaterialApprovalNotifications(plan) {
  if (!plan || plan.type !== 'material') return { notifiedOwner: '', purchaseOpened: false };
  const planId = Number(plan.id);
  const workflow = plan.approvalWorkflow || [];
  const rejectedStep = workflow.find(step => step.status === 'rejected');
  const currentIndex = rejectedStep ? -1 : workflow.findIndex((step, index) => step.status === 'pending' && workflow.slice(0, index).every(previous => previous.status === 'approved'));
  followups = followups.map(item => {
    if (Number(item.workflowPlanId) !== planId) return item;
    if (item.workflowKind === 'approval') return { ...item, status: Number(item.workflowStep) === currentIndex ? 'pending' : 'done' };
    if (item.workflowKind === 'approval-reminder') return { ...item, status: Number(item.workflowStep) === currentIndex ? 'pending' : 'done' };
    if (item.workflowKind === 'purchase' && !isMaterialPlanApproved(plan)) return { ...item, status: 'done' };
    if (item.workflowKind === 'return' && !rejectedStep) return { ...item, status: 'done' };
    return item;
  });
  if (currentIndex >= 0) {
    const step = workflow[currentIndex];
    const existing = followups.find(item => Number(item.workflowPlanId) === planId && item.workflowKind === 'approval' && Number(item.workflowStep) === currentIndex);
    const notice = {
      category: '审批通知', title: `审批材料计划：${plan.name}`, requester: '系统 · 材料审批流程', owner: step.owner, zone: plan.location,
      due: `${plan.due}T18:00`, urgency: currentIndex === workflow.length - 1 ? 'urgent' : 'normal', relatedTask: `材料计划审批 · ${plan.name}`,
      note: `当前节点：${step.role}。审批通过后系统将自动通知下一位审批人；全部通过前采购端不可见。`, status: 'pending', reminders: existing?.reminders || 1,
      workflowPlanId: planId, workflowKind: 'approval', workflowStep: currentIndex
    };
    if (existing) followups = followups.map(item => item.id === existing.id ? { ...item, ...notice } : item);
    else followups.unshift({ id: Date.now() + (planId % 100000) * 10 + currentIndex, ...notice, createdAt: new Date().toISOString() });
    return { notifiedOwner: step.owner, purchaseOpened: false };
  }
  if (rejectedStep) {
    const owner = resolveOrganizationOwner(plan.ownerRole || '材料员');
    const existing = followups.find(item => Number(item.workflowPlanId) === planId && item.workflowKind === 'return');
    const notice = { category: '审批退回', title: `修改并重新提交：${plan.name}`, requester: rejectedStep.owner, owner, zone: plan.location, due: defaultDueValue(), urgency: 'urgent', relatedTask: `材料计划审批 · ${plan.name}`, note: `${rejectedStep.role}已退回材料计划。修改后重新提交，系统会继续按顺序通知审批人。`, status: 'pending', reminders: existing?.reminders || 1, workflowPlanId: planId, workflowKind: 'return' };
    if (existing) followups = followups.map(item => item.id === existing.id ? { ...item, ...notice } : item);
    else followups.unshift({ id: Date.now() + (planId % 100000) * 10 + 8, ...notice, createdAt: new Date().toISOString() });
    return { notifiedOwner: owner, purchaseOpened: false };
  }
  if (isMaterialPlanApproved(plan)) {
    const purchaser = plan.purchaser || matchPersonByRole('采购员');
    const existing = followups.find(item => Number(item.workflowPlanId) === planId && item.workflowKind === 'purchase');
    const brandText = plan.contractBrandRequired ? `合同指定品牌：${plan.contractBrand}` : '合同未指定品牌';
    const notice = { category: '采购待办', title: `执行材料采购：${plan.name}`, requester: '系统 · 审批完成', owner: purchaser, zone: plan.location, due: `${plan.due}T18:00`, urgency: 'urgent', relatedTask: `已审批材料计划 · ${plan.name}`, note: `${brandText}；计划数量 ${plan.quantity}，用于 ${plan.location}。采购端现已开放查看。`, status: 'pending', reminders: existing?.reminders || 1, workflowPlanId: planId, workflowKind: 'purchase' };
    if (existing) followups = followups.map(item => item.id === existing.id ? { ...item, ...notice } : item);
    else followups.unshift({ id: Date.now() + (planId % 100000) * 10 + 9, ...notice, createdAt: new Date().toISOString() });
    return { notifiedOwner: purchaser, purchaseOpened: true };
  }
  return { notifiedOwner: '', purchaseOpened: false };
}

function canRemindResourceApproval(plan, currentIndex = -1) {
  if (!plan || plan.type !== 'material' || currentIndex < 0) return false;
  const viewer = currentOperatorLabel();
  const viewerPerson = getCurrentUser();
  const requester = plan.requester || plan.approvalWorkflow?.find(step => step.role === '提报人')?.owner;
  const previousOwner = currentIndex > 0 ? plan.approvalWorkflow?.[currentIndex - 1]?.owner : '';
  const isProjectManager = /项目经理/.test(String(viewerPerson?.role || ''));
  return viewer && (isProjectManager || viewer === requester || viewer === previousOwner);
}

function remindResourceApproval(planId) {
  const plan = resourcePlans.find(item => Number(item.id) === Number(planId));
  if (!plan) { showToast('没有找到对应的材料计划'); return; }
  const workflow = plan.approvalWorkflow || [];
  const currentIndex = workflow.findIndex((step, index) => step.status === 'pending' && workflow.slice(0, index).every(previous => previous.status === 'approved'));
  if (currentIndex < 0) { showToast('当前没有待催办的审批节点'); return; }
  if (!canRemindResourceApproval(plan, currentIndex)) { showToast('仅提报人或上一位已通过的审批人可以催办当前节点'); return; }
  const step = workflow[currentIndex];
  const existing = followups.find(item => Number(item.workflowPlanId) === Number(plan.id) && item.workflowKind === 'approval-reminder' && Number(item.workflowStep) === currentIndex && item.status !== 'done');
  const reminder = {
    category: '审批催办', title: `请审批材料计划：${plan.name}`, requester: currentOperatorLabel(), owner: step.owner, recipient: step.owner,
    notificationStatus: 'unread', zone: plan.location, due: `${plan.due}T18:00`, urgency: 'urgent', relatedTask: `材料计划审批 · ${plan.name}`,
    note: `${currentOperatorLabel()}催办${step.role}：当前审批节点尚未完成，请及时处理。`, status: 'pending', reminders: Number(existing?.reminders || 0) + 1,
    workflowPlanId: Number(plan.id), workflowKind: 'approval-reminder', workflowStep: currentIndex, lastRemindedAt: new Date().toISOString(), lastRemindedBy: currentOperatorLabel()
  };
  if (existing) followups = followups.map(item => item.id === existing.id ? { ...item, ...reminder } : item);
  else followups.unshift({ id: Date.now() + currentIndex, ...reminder, createdAt: new Date().toISOString() });
  workflow[currentIndex] = { ...step, reminderCount: Number(step.reminderCount || 0) + 1, lastRemindedAt: reminder.lastRemindedAt, lastRemindedBy: reminder.lastRemindedBy };
  persistResources(); persistFollowups();
  openResourcePlanDetail(plan.id);
  showToast(`已向${step.owner}发送审批催办通知`);
}

function renderResourcesBody() {
  const materialEntries = resourceEntries.filter(item => item.type === 'material');
  const equipmentEntries = resourceEntries.filter(item => item.type === 'equipment');
  const approvedPurchasePlans = resourcePlans.filter(isMaterialPlanApproved);
  const tabs = [
    ['materials', '材料台账', materialEntries.length], ['equipment', '设备台账', equipmentEntries.length], ['plans', '材料设备计划', resourcePlans.length], ['procurement', '采购待办', approvedPurchasePlans.length]
  ];
  let content = '';
  if (activeResourceTab === 'plans') {
    const planStates = resourcePlans.map(plan => ({ plan, progress: getResourcePlanProgress(plan) }));
    const weekAlerts = planStates.filter(item => !item.progress.complete && item.progress.days <= 7);
    const overdue = weekAlerts.filter(item => item.progress.days < 0).length;
    content = `<section class="resource-forecast ${overdue ? 'has-overdue' : ''}"><div class="forecast-mark">7D</div><div><strong>未来 7 天到场预报</strong><p>${weekAlerts.length ? `${weekAlerts.length} 项资源需要跟进${overdue ? `，其中 ${overdue} 项已逾期` : ''}` : '未来一周资源均已落实到场'}</p></div><button type="button" data-resource-weekly-report>查看预报详情</button></section>
      <div class="resource-list resource-plan-list"><div class="resource-row resource-plan-row header"><span>资源名称</span><span>计划数量</span><span>到场进度</span><span>要求到场</span><span>使用部位</span><span>责任 / 提示</span></div>${planStates.map(({ plan, progress }) => `<button type="button" class="resource-row resource-plan-row resource-row-button" data-resource-plan-detail="${plan.id}"><div><strong>${escapeHtml(plan.name)}</strong><small>${plan.type === 'material' ? '材料' : '设备'} · ${resourceApprovalSummary(plan)} · 点击查看详情</small></div><span>${escapeHtml(plan.quantity)}</span><div class="arrival-progress"><div><b>${formatResourceQuantity(progress.arrived, progress.planned.unit)}</b><small>已到 · 余 ${formatResourceQuantity(progress.remaining, progress.planned.unit)}</small></div><i><em style="width:${progress.percent}%"></em></i></div><span>${plan.due}</span><span>${escapeHtml(plan.location)}</span><div><span>${escapeHtml(plan.ownerRole)}</span><small class="resource-status ${progress.tone}">${progress.status}</small></div></button>`).join('') || '<div class="resource-empty">还没有材料设备计划</div>'}</div>`;
  } else if (activeResourceTab === 'procurement') {
    content = `<section class="procurement-access-banner"><div class="procurement-seal">已审</div><div><strong>采购可见清单</strong><p>仅展示项目经理已通过的材料计划；系统按每项计划指定的采购材料员分别推送。</p></div><span>审批完成后开放</span></section>
      <div class="resource-list procurement-plan-list"><div class="procurement-plan-row header"><span>已审批材料</span><span>合同品牌要求</span><span>采购数量</span><span>要求到场</span><span>使用部位</span><span>采购权限</span></div>${approvedPurchasePlans.map(plan => `<button type="button" class="procurement-plan-row" data-resource-plan-detail="${plan.id}"><div><strong>${escapeHtml(plan.name)}</strong><small>${plan.approvalAttachments?.length || 0} 份审批表 · ${plan.approvalWorkflow.length} 个节点已通过</small></div><span>${plan.contractBrandRequired ? escapeHtml(plan.contractBrand || '待明确') : '合同未指定'}</span><span>${escapeHtml(plan.quantity)}</span><span>${plan.due}</span><span>${escapeHtml(plan.location)}</span><div><em>采购可见</em><small>已推送至 ${escapeHtml(plan.purchaser || matchPersonByRole('采购员'))}</small></div></button>`).join('') || '<div class="procurement-empty"><strong>暂无采购待办</strong><p>材料计划完成全部审批后，将自动在这里出现并通知指定采购材料员。</p></div>'}</div>`;
  } else {
    const type = activeResourceTab === 'materials' ? 'material' : 'equipment';
    const entries = type === 'material' ? materialEntries : equipmentEntries;
    if (type === 'material') entries.forEach(entry => ensureMaterialDocumentChain(entry));
    const categories = [...new Set(entries.map(item => item.category))];
    content = `${type === 'material' ? `<div class="resource-category-strip">${categories.map(category => `<span><b>${category}</b>${entries.filter(item => item.category === category).length} 批</span>`).join('')}</div>` : ''}${renderResourceEntryGroups(entries, type)}`;
  }
  return `<div class="resource-toolbar"><div class="resource-tabs">${tabs.map(([key, label, count]) => `<button type="button" class="${key === activeResourceTab ? 'active' : ''}" data-resource-tab="${key}">${label}<b>${count}</b></button>`).join('')}</div><div class="resource-toolbar-actions">${activeResourceTab !== 'procurement' ? '<button class="resource-register-button" data-new-resource-plan>新增资源计划</button>' : ''}</div></div>${content}`;
}

function renderResourceLedgerRows(entries, type) {
  return entries.map(item => `<button type="button" class="resource-row resource-row-button" data-resource-entry-detail="${item.id}"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)} · ${item.movement}${item.planId ? ' · 已关联计划' : ''}</small></div><span>${escapeHtml(item.brand)}</span><span>${escapeHtml(item.spec)}</span><span>${new Date(item.arrivalTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span><span>${escapeHtml(item.location)}</span><span class="attachment-count">${item.attachments?.length || 0} 个附件 · 查看 ${type === 'material' && item.movement === '进场' ? materialDocumentReviewText(item) : ''}</span></button>`).join('') || '<div class="resource-empty">还没有登记记录</div>';
}

function renderResourceEntryGroups(entries, type) {
  const header = '<div class="resource-row header"><span>名称 / 分类</span><span>品牌 / 厂家</span><span>规格型号</span><span>进出场时间</span><span>使用部位</span><span>资料附件</span></div>';
  if (type !== 'material') return `<div class="resource-list">${header}${renderResourceLedgerRows(entries, type)}</div>`;
  const groups = new Map();
  entries.forEach(entry => {
    const date = String(entry.arrivalTime || '').match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '日期未填写';
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(entry);
  });
  return [...groups.keys()].sort((a, b) => b.localeCompare(a)).map(date => {
    const rows = groups.get(date).slice().sort((a, b) => String(b.arrivalTime || '').localeCompare(String(a.arrivalTime || '')));
    return `<section class="resource-day-group" data-resource-date="${escapeHtml(date)}"><div class="resource-day-heading"><h3>${escapeHtml(date)}</h3><span>${rows.length} 条记录 · 点击单条查看附件与资料状态</span></div><div class="resource-list">${header}${renderResourceLedgerRows(rows, type)}</div></section>`;
  }).join('') || '<div class="resource-empty">还没有登记记录</div>';
}

function populateResourcePlanRoles(type = 'material') {
  const select = $('#resourcePlanOwner');
  const roles = [...new Set(organization.map(person => person.role))];
  select.innerHTML = organization.map(person => `<option value="${escapeHtml(organizationPersonLabel(person))}">${escapeHtml(organizationPersonLabel(person))}</option>`).join('');
  const preferred = type === 'material' ? '材料员' : '设备管理员';
  const preferredPerson = organization.find(person => person.role === preferred) || organization[0];
  if (preferredPerson) select.value = organizationPersonLabel(preferredPerson);
  $('#resourcePlanOwnerRole').value = preferredPerson?.role || roles[0] || '';
}

function populateApproverSelect(select, role, selectedValue = '') {
  const people = organization.filter(person => person.role === role);
  select.innerHTML = people.length ? people.map(person => `<option value="${escapeHtml(`${person.name} · ${person.role}`)}">${escapeHtml(person.name)} · ${escapeHtml(person.role)}</option>`).join('') : '<option value="待指定">待指定（尚未配置该岗位）</option>';
  if (selectedValue && [...select.options].some(option => option.value === selectedValue)) select.value = selectedValue;
}

function populateOrganizationPersonSelect(select, selectedValue = '') {
  select.innerHTML = organization.map(person => `<option value="${escapeHtml(`${person.name} · ${person.role}`)}">${escapeHtml(person.name)} · ${escapeHtml(person.role)}</option>`).join('');
  if (selectedValue && [...select.options].some(option => option.value === selectedValue)) select.value = selectedValue;
}

function updateResourcePlanMaterialFields() {
  const form = $('#resourcePlanForm');
  const isMaterial = form.elements.type.value === 'material';
  $('#resourcePlanMaterialFields').hidden = !isMaterial;
  const requiresBrand = form.elements.contractBrandRequired.value === 'yes';
  $('#contractBrandNameLabel').hidden = !requiresBrand;
  form.elements.contractBrand.required = isMaterial && requiresBrand;
  form.elements.requester.required = isMaterial;
  form.elements.productionApprover.required = isMaterial;
  form.elements.technicalApprover.required = isMaterial;
  form.elements.storekeeperApprover.required = isMaterial;
  form.elements.projectManagerApprover.required = isMaterial;
  form.elements.purchaser.required = isMaterial;
}

function renderResourcePlanExistingApprovalFiles(plan) {
  const files = plan?.approvalAttachments || [];
  $('#resourcePlanExistingApprovalFiles').innerHTML = files.length ? `<strong>已上传材料审批表 · ${files.length}</strong>${renderStoredFileList(files, '尚未上传材料审批表')}` : '<p>尚未上传材料审批表</p>';
  $$('[data-stored-file-index]', $('#resourcePlanExistingApprovalFiles')).forEach(button => button.addEventListener('click', () => previewStoredAttachment(files[Number(button.dataset.storedFileIndex)])));
}

function openResourcePlanDialog(plan = null) {
  const form = $('#resourcePlanForm');
  form.reset();
  editingResourcePlanId = plan?.id || null;
  form.elements.planId.value = plan?.id || '';
  form.elements.type.value = plan?.type || 'material';
  form.elements.name.value = plan?.name || '';
  form.elements.quantity.value = plan?.quantity || '';
  form.elements.due.value = plan?.due || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  form.elements.location.value = plan?.location || '';
  populateResourcePlanRoles(form.elements.type.value);
  populateOrganizationPersonSelect(form.elements.owner, plan?.owner || resolveOrganizationOwner(plan?.ownerRole || (form.elements.type.value === 'material' ? '材料员' : '设备管理员')));
  const selectedOwner = organization.find(person => organizationPersonLabel(person) === form.elements.owner.value);
  form.elements.ownerRole.value = selectedOwner?.role || plan?.ownerRole || '';
  const workflow = plan?.approvalWorkflow || [];
  populateOrganizationPersonSelect(form.elements.requester, plan?.requester || workflow.find(step => step.role === '提报人')?.owner || matchPersonByRole('施工员'));
  populateApproverSelect(form.elements.productionApprover, '生产经理', workflow.find(step => step.role === '生产经理')?.owner);
  populateApproverSelect(form.elements.technicalApprover, '技术负责人', workflow.find(step => step.role === '技术负责人')?.owner);
  populateApproverSelect(form.elements.storekeeperApprover, '库管', workflow.find(step => step.role === '库管')?.owner);
  populateApproverSelect(form.elements.projectManagerApprover, '项目经理', workflow.find(step => step.role === '项目经理')?.owner);
  populateApproverSelect(form.elements.purchaser, '采购员', plan?.purchaser || matchPersonByRole('采购员'));
  form.elements.contractBrandRequired.value = plan?.contractBrandRequired ? 'yes' : 'no';
  form.elements.contractBrand.value = plan?.contractBrand || '';
  renderResourcePlanExistingApprovalFiles(plan);
  updateResourcePlanMaterialFields();
  $('#resourcePlanDialogTitle').textContent = plan ? '编辑材料设备计划与审批' : '新增资源需求计划';
  $('#resourcePlanDialog').showModal();
}

function resourceEntryCategories(type) {
  return type === 'material' ? ['钢材', '水泥及混凝土', '砌体材料', '防水材料', '装饰材料', '机电材料', '其他材料'] : ['起重设备', '垂直运输设备', '土方机械', '混凝土设备', '临时用电设备', '检测设备', '其他设备'];
}

function resourceEntryPlanOptions(type, selectedId = '') {
  const candidates = resourcePlans.filter(plan => plan.type === type && !getResourcePlanProgress(plan).complete);
  return `<option value="">系统自动匹配最接近的未完成计划</option>${candidates.map(plan => { const progress = getResourcePlanProgress(plan); return `<option value="${plan.id}" ${String(plan.id) === String(selectedId) ? 'selected' : ''}>${escapeHtml(plan.name)}｜${escapeHtml(plan.location)}｜余 ${formatResourceQuantity(progress.remaining, progress.planned.unit)}</option>`; }).join('')}`;
}

function resourceEntryBatchRowMarkup(row, index, type) {
  const categories = resourceEntryCategories(type);
  const proofRequired = type === 'material' && row.movement !== '退场' ? 'required' : '';
  const proofHint = type === 'material' && row.movement !== '退场' ? '材料进场登记必传' : '可选上传';
  return `<article class="resource-entry-batch-row" data-resource-entry-row="${index}"><div class="resource-entry-batch-row-heading"><strong>第 ${String(index + 1).padStart(2, '0')} 条到场记录</strong>${index ? `<button type="button" class="icon-button" data-remove-resource-entry-row="${index}" aria-label="删除第${index + 1}条">×</button>` : '<span>材料到场后逐条核对</span>'}</div><div class="form-grid"><label>名称<input data-resource-entry-name required placeholder="例如：HRB400E 钢筋" value="${escapeHtml(row.name || '')}"></label><label>类别<select data-resource-entry-category>${categories.map(category => `<option ${category === row.category ? 'selected' : ''}>${category}</option>`).join('')}</select></label></div><div class="form-grid"><label>品牌 / 生产厂家<input data-resource-entry-brand required value="${escapeHtml(row.brand || '')}"></label><label>规格 / 型号<input data-resource-entry-spec required value="${escapeHtml(row.spec || '')}"></label></div><div class="form-grid"><label>进出场类型<select data-resource-entry-movement><option ${row.movement !== '退场' ? 'selected' : ''}>进场</option><option ${row.movement === '退场' ? 'selected' : ''}>退场</option></select></label><label>到场时间<input type="datetime-local" data-resource-entry-arrival required value="${escapeHtml(row.arrivalTime || defaultDueValue())}"></label></div><div class="form-grid"><label>数量<input data-resource-entry-quantity required placeholder="例如：32.5 t / 1 台" value="${escapeHtml(row.quantity || '')}"></label><label>使用部位 / 安装位置<input data-resource-entry-location required value="${escapeHtml(row.location || '')}"></label></div><label>关联材料设备计划<select data-resource-entry-plan data-manual="${row.planManual ? 'true' : 'false'}">${resourceEntryPlanOptions(type, row.planId || '')}</select><small class="match-hint" data-resource-entry-plan-hint>填写名称和使用部位后，系统会推荐对应计划；也可手动选择</small></label><div class="resource-entry-proof-grid"><label class="${proofRequired ? 'required-upload-field' : ''}">收货单 / 到场签收单<input type="file" data-resource-entry-receipt accept=".pdf,.jpg,.jpeg,.png,.webp" multiple ${proofRequired}><small>${proofHint}</small></label><label class="${proofRequired ? 'required-upload-field' : ''}">到场材料照片 / 验收照片<input type="file" data-resource-entry-photos accept="image/*" capture="environment" multiple ${proofRequired}><small>${proofHint}</small></label><label>合格证、检测报告或其他资料<input type="file" data-resource-entry-certificates accept=".pdf,image/*" multiple><small>已有资料可一并上传</small></label></div><label>备注<textarea data-resource-entry-note rows="2">${escapeHtml(row.note || '')}</textarea></label></article>`;
}

function captureResourceEntryBatchDraft() {
  const type = $('#resourceEntryForm')?.elements.resourceType.value || 'material';
  const rows = $$('#resourceEntryBatchRows [data-resource-entry-row]');
  resourceEntryBatchDraft = rows.map(row => ({ name: $('[data-resource-entry-name]', row).value, category: $('[data-resource-entry-category]', row).value, brand: $('[data-resource-entry-brand]', row).value, spec: $('[data-resource-entry-spec]', row).value, movement: $('[data-resource-entry-movement]', row).value, arrivalTime: $('[data-resource-entry-arrival]', row).value, quantity: $('[data-resource-entry-quantity]', row).value, location: $('[data-resource-entry-location]', row).value, planId: $('[data-resource-entry-plan]', row).value, planManual: $('[data-resource-entry-plan]', row).dataset.manual === 'true', receipts: [...($('[data-resource-entry-receipt]', row)?.files || [])], certificates: [...($('[data-resource-entry-certificates]', row)?.files || [])], photos: [...($('[data-resource-entry-photos]', row)?.files || [])], note: $('[data-resource-entry-note]', row).value, type }));
  return resourceEntryBatchDraft;
}

function renderResourceEntryBatchRows() {
  const form = $('#resourceEntryForm');
  const type = form.elements.resourceType.value || 'material';
  $('#resourceEntryBatchRows').innerHTML = resourceEntryBatchDraft.map((row, index) => resourceEntryBatchRowMarkup(row, index, type)).join('');
  $$('#resourceEntryBatchRows [data-resource-entry-row]').forEach((row, index) => {
    const draft = resourceEntryBatchDraft[index] || {};
    [['receipts', '[data-resource-entry-receipt]'], ['certificates', '[data-resource-entry-certificates]'], ['photos', '[data-resource-entry-photos]']].forEach(([key, selector]) => {
      const files = draft[key] || [];
      const input = $(selector, row);
      if (!input || !files.length || typeof DataTransfer !== 'function') return;
      const transfer = new DataTransfer();
      files.forEach(file => transfer.items.add(file));
      input.files = transfer.files;
    });
  });
  $$('#resourceEntryBatchRows [data-resource-entry-name], #resourceEntryBatchRows [data-resource-entry-location]').forEach(input => input.addEventListener('input', event => updateResourceEntryRowRecommendation(event.target.closest('[data-resource-entry-row]'))));
  $$('#resourceEntryBatchRows [data-resource-entry-plan]').forEach(select => select.addEventListener('change', event => { event.target.dataset.manual = event.target.value ? 'true' : 'false'; const plan = resourcePlans.find(item => String(item.id) === event.target.value); $('[data-resource-entry-plan-hint]', event.target.closest('[data-resource-entry-row]')).textContent = plan ? `已手动关联：${plan.name}（${plan.location}）` : '已恢复系统自动匹配'; }));
  $$('#resourceEntryBatchRows [data-resource-entry-movement]').forEach(select => select.addEventListener('change', event => { const row = event.target.closest('[data-resource-entry-row]'); const required = type === 'material' && event.target.value === '进场'; ['[data-resource-entry-receipt]', '[data-resource-entry-photos]'].forEach(selector => { const input = $(selector, row); if (input) { input.required = required; input.closest('label')?.classList.toggle('required-upload-field', required); } }); }));
  $$('[data-remove-resource-entry-row]', $('#resourceEntryBatchRows')).forEach(button => button.addEventListener('click', () => { captureResourceEntryBatchDraft(); resourceEntryBatchDraft.splice(Number(button.dataset.removeResourceEntryRow), 1); renderResourceEntryBatchRows(); }));
}

function updateResourceEntryRowRecommendation(row) {
  if (!row || $('[data-resource-entry-plan]', row).dataset.manual === 'true') return;
  const form = $('#resourceEntryForm');
  const draft = { type: form.elements.resourceType.value, name: $('[data-resource-entry-name]', row).value, location: $('[data-resource-entry-location]', row).value };
  const match = findBestResourcePlan(draft);
  $('[data-resource-entry-plan]', row).value = match?.id || '';
  $('[data-resource-entry-plan-hint]', row).textContent = match ? `系统推荐：${match.name}（${match.location}），可手动修改` : '暂未找到高匹配计划，可继续填写或手动选择';
}

function openResourceEntryDialog(type) {
  const form = $('#resourceEntryForm');
  form.reset();
  form.elements.resourceType.value = type;
  $('#resourceEntryEyebrow').textContent = type === 'material' ? '材料进场登记' : '设备进出场登记';
  $('#resourceEntryTitle').textContent = type === 'material' ? '批量登记材料到场' : '批量登记设备进出场';
  resourceEntryBatchDraft = [{ type, category: resourceEntryCategories(type)[0], movement: type === 'material' ? '进场' : '进场', arrivalTime: defaultDueValue() }];
  renderResourceEntryBatchRows();
  $('#resourceEntryDialog').showModal();
}

function resourceDetailItem(label, value) {
  return `<div><span>${label}</span><strong>${value || '—'}</strong></div>`;
}

function formatAttachmentSize(size = 0) {
  if (!size) return '文件大小未记录';
  if (size < 1024) return `${size} B`;
  if (size < 1048576) return `${Math.round(size / 102.4) / 10} KB`;
  return `${Math.round(size / 104857.6) / 10} MB`;
}

function attachmentKind(file) {
  const type = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();
  if (type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/.test(name)) return 'image';
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  return 'document';
}

function renderResourceAttachments(entry) {
  if (!entry.attachments?.length) return '<p>没有上传附件</p>';
  const fileKey = file => file.storageKey || file.data || `${file.name}|${file.size}|${file.type}`;
  const labels = new Map();
  (entry.receiptAttachments || []).forEach(file => labels.set(fileKey(file), '收货单'));
  (entry.photoAttachments || []).forEach(file => labels.set(fileKey(file), '到场/验收照片'));
  (entry.documentAttachments || []).forEach(file => labels.set(fileKey(file), '合格证/补充资料'));
  return entry.attachments.map((file, index) => {
    const kind = attachmentKind(file);
    const ready = Boolean(file.stored && (file.storageKey || file.data));
    return `<button type="button" class="resource-attachment-button ${ready ? '' : 'unavailable'}" data-attachment-entry="${entry.id}" data-attachment-index="${index}"><i>${kind === 'image' ? 'IMG' : kind === 'pdf' ? 'PDF' : 'FILE'}</i><div><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(labels.get(fileKey(file)) || '资料附件')} · ${ready ? `${formatAttachmentSize(file.size)} · 点击查看原文件` : '早期示例记录未保存原文件，请重新上传'}</small></div><b>${ready ? '查看' : '未存原件'}</b></button>`;
  }).join('');
}

function materialDocumentReviewText(entry) {
  const review = entry?.materialDocumentReview || { status: 'pending', missingItems: [] };
  if (review.status === 'complete') return '<em class="resource-document-state complete">资料已闭环</em>';
  if (review.status === 'missing') return `<em class="resource-document-state risk">资料缺失：${escapeHtml((review.missingItems || []).join('、') || '待补充')}</em>`;
  return '<em class="resource-document-state pending">待资料员核查</em>';
}

function renderStoredFileList(files = [], emptyText = '尚未上传') {
  if (!files.length) return `<p>${emptyText}</p>`;
  return files.map((file, index) => `<button type="button" class="stored-file-button" data-stored-file-index="${index}"><i>${attachmentKind(file) === 'image' ? 'IMG' : attachmentKind(file) === 'pdf' ? 'PDF' : 'FILE'}</i><span><b>${escapeHtml(file.name)}</b><small>${formatAttachmentSize(file.size)}</small></span><em>${file.stored ? '查看' : '未存原件'}</em></button>`).join('');
}

async function openResourceAttachment(entryId, index) {
  const entry = resourceEntries.find(item => Number(item.id) === Number(entryId));
  const file = entry?.attachments?.[Number(index)];
  if (!file) return;
  await previewStoredAttachment(file);
}

async function previewStoredAttachment(file) {
  let source = file.data || '';
  let mimeType = file.type || 'application/octet-stream';
  if (file.storageKey) {
    try {
      const storedFile = await getResourceAttachment(file.storageKey);
      if (storedFile?.blob) {
        if (activeAttachmentUrl) URL.revokeObjectURL(activeAttachmentUrl);
        activeAttachmentUrl = URL.createObjectURL(storedFile.blob);
        source = activeAttachmentUrl;
        mimeType = storedFile.type || mimeType;
      }
    } catch (error) { /* 下面统一提示 */ }
  }
  if (!source) { showToast('这是一条早期示例记录，没有保存原文件；重新上传后即可在线查看'); return; }
  const kind = attachmentKind({ ...file, type: mimeType });
  $('#attachmentPreviewTitle').textContent = file.name;
  $('#attachmentPreviewBody').innerHTML = kind === 'image'
    ? `<img src="${source}" alt="${escapeHtml(file.name)}">`
    : kind === 'pdf'
      ? `<iframe src="${source}" title="${escapeHtml(file.name)}"></iframe>`
      : `<div class="attachment-generic-preview"><span>FILE</span><strong>${escapeHtml(file.name)}</strong><p>当前文件类型由系统保留原件，可在新窗口打开或下载查看。</p></div>`;
  $('#attachmentOpenLink').href = source;
  $('#attachmentDownloadLink').href = source;
  $('#attachmentDownloadLink').download = file.name;
  $('#attachmentPreviewDialog').showModal();
}

function canWithdrawResourcePlan(plan) {
  if (!plan || plan.type !== 'material') return false;
  const workflow = plan.approvalWorkflow || [];
  if (workflow.length && workflow.every(step => step.status === 'approved')) return false;
  const viewer = organizationPersonLabel(getCurrentUser());
  const requester = plan.requester || workflow.find(step => step.role === '提报人')?.owner;
  return Boolean(viewer && requester && viewer === requester);
}

async function withdrawResourcePlan(planId) {
  const plan = resourcePlans.find(item => Number(item.id) === Number(planId));
  if (!plan) return;
  if (window.ZhuxuServer?.active) {
    try {
      const result = await window.ZhuxuServer.withdraw(planId);
      resourcePlans = result.resourcePlans;
    } catch (error) { showToast(error.message || '服务器撤回失败，请刷新后重试'); return; }
  } else {
    plan.approvalWorkflow.forEach(step => { step.status = 'pending'; delete step.actedAt; delete step.actedBy; delete step.actedByAccount; });
    markRequesterApproval(plan.approvalWorkflow, plan);
  }
  persistResources(); persistFollowups();
  const updated = resourcePlans.find(item => Number(item.id) === Number(planId));
  $('#resourceDetailDialog').close();
  if (updated) openResourcePlanDialog(updated);
  showToast('材料计划已撤回，可重新上传材料审批表后再次提交');
}

function openResourcePlanDetail(planId) {
  const plan = resourcePlans.find(item => Number(item.id) === Number(planId));
  if (!plan) return;
  $('#resourceDetailDialog').dataset.planId = String(plan.id);
  const progress = getResourcePlanProgress(plan);
  $('#resourceDetailEyebrow').textContent = '材料设备计划详情';
  $('#resourceDetailTitle').textContent = plan.name;
  const workflow = plan.approvalWorkflow || [];
  const approvalState = workflow.some(step => step.status === 'rejected') ? 'rejected' : workflow.length && workflow.every(step => step.status === 'approved') ? 'approved' : 'pending';
  const approvalLabel = { approved: '审批已完成', rejected: '审批已退回', pending: '审批进行中' }[approvalState];
  const currentApproval = workflow.find((step, index) => step.status === 'pending' && workflow.slice(0, index).every(previous => previous.status === 'approved'));
  const viewer = getCurrentUser();
  const viewerLabel = organizationPersonLabel(viewer);
  const approvalFlow = workflow.map((step, index) => {
    const isCurrent = step === currentApproval;
    const canAct = isCurrent && isCurrentUserApprovalOwner(step);
    const statusText = step.status === 'approved'
      ? `已通过${step.actedAt ? ` · ${new Date(step.actedAt).toLocaleString('zh-CN')}` : ''}`
      : step.status === 'rejected'
        ? '已退回修改'
        : isCurrent
          ? canAct ? '这是你的当前待办，请审批' : `等待 ${step.owner} 审批，当前账号仅可查看`
          : '等待上一节点完成';
    return `<article class="approval-step ${step.status} ${isCurrent ? 'notified' : ''} ${canAct ? 'actionable' : ''}"><i>${step.status === 'approved' ? '✓' : step.status === 'rejected' ? '×' : index + 1}</i><div><strong>${escapeHtml(step.role)}${isCurrent ? `<em>${canAct ? '待我审批' : '审批中'}</em>` : ''}</strong><span>${escapeHtml(step.owner)}</span><small>${escapeHtml(statusText)}</small></div>${canAct ? `<div class="approval-step-actions"><button type="button" data-approval-action="approve" data-plan-id="${plan.id}" data-approval-index="${index}">通过</button><button type="button" data-approval-action="reject" data-plan-id="${plan.id}" data-approval-index="${index}">退回</button></div>` : ''}</article>`;
  }).join('');
  const purchaser = plan.purchaser || matchPersonByRole('采购员');
  const purchaseAccess = isMaterialPlanApproved(plan)
    ? `<section class="procurement-gate-panel open"><i>6</i><div><strong>采购材料员已收到</strong><p>项目经理已通过，系统已向 ${escapeHtml(purchaser)} 开放计划并生成“采购待办”。</p></div><em>采购可见</em></section>`
    : `<section class="procurement-gate-panel locked"><i>6</i><div><strong>采购材料员等待接收</strong><p>${currentApproval ? `当前由 ${escapeHtml(currentApproval.owner)} 处理；项目经理通过后才通知 ${escapeHtml(purchaser)}。` : `计划被退回，重新完成五个节点后才通知 ${escapeHtml(purchaser)}。`}</p></div><em>暂不可见</em></section>`;
  const canRemind = currentApproval && canRemindResourceApproval(plan, workflow.indexOf(currentApproval));
  const approvalReminder = canRemind ? `<button type="button" class="approval-remind-button" data-remind-resource-approval="${plan.id}">催办${escapeHtml(currentApproval.role)}</button>` : '';
  const viewerIsProjectManager = /项目经理/.test(String(viewer?.role || ''));
  const materialSections = plan.type === 'material' ? `<section class="contract-brand-panel"><div><span>合同品牌要求</span><strong>${plan.contractBrandRequired ? `是 · ${escapeHtml(plan.contractBrand || '待填写品牌')}` : '否 · 合同未指定品牌'}</strong></div><div class="contract-brand-actions">${canWithdrawResourcePlan(plan) ? `<button type="button" data-withdraw-resource-plan="${plan.id}">撤回并修改</button>` : ''}<button type="button" data-edit-resource-plan="${plan.id}">编辑品牌与审批</button></div></section><section class="material-approval-panel"><div class="approval-panel-heading"><div><strong>材料审批流程</strong><small>提报人（提交即完成） → 生产经理 → 技术负责人 → 库管 → 项目经理，逐级通知；项目经理可查看全部节点并催办当前待审批人</small></div><em class="approval-overall ${approvalState}">${approvalLabel}</em></div><div class="approval-viewer"><span>当前登录</span><strong>${escapeHtml(viewerLabel || '未识别账号')}</strong><small>${currentApproval ? (isCurrentUserApprovalOwner(currentApproval) ? '当前审批已分配给你' : viewerIsProjectManager ? '项目经理可查看完整进度并催办当前节点' : '可查看完整进度，不能代替他人审批') : '当前没有待审批节点'}</small>${approvalReminder}</div><div class="approval-flow">${approvalFlow}</div><div class="approval-attachments"><strong>材料审批表 · ${plan.approvalAttachments?.length || 0}</strong>${renderStoredFileList(plan.approvalAttachments || [], '尚未上传材料审批表')}</div></section>${purchaseAccess}` : '';
  $('#resourceDetailBody').innerHTML = `<section class="resource-detail-hero ${progress.tone}"><div><span>${progress.status}</span><strong>${progress.percent}%</strong></div><p>${progress.notice}</p><i><em style="width:${progress.percent}%"></em></i></section><div class="resource-detail-grid">${resourceDetailItem('资源类型', plan.type === 'material' ? '材料' : '设备')}${resourceDetailItem('计划数量', escapeHtml(plan.quantity))}${resourceDetailItem('累计到场', formatResourceQuantity(progress.arrived, progress.planned.unit))}${resourceDetailItem('未到数量', formatResourceQuantity(progress.remaining, progress.planned.unit))}${resourceDetailItem('要求到场', plan.due)}${resourceDetailItem('使用部位', escapeHtml(plan.location))}${resourceDetailItem('责任岗位', escapeHtml(plan.ownerRole))}${resourceDetailItem('提前预报', '要求到场前 7 天')}</div>${materialSections}<section class="resource-arrival-history"><strong>关联到场记录 · ${progress.linkedEntries.length} 批</strong>${progress.linkedEntries.map(entry => `<button type="button" data-resource-entry-detail="${entry.id}"><span>${new Date(entry.arrivalTime).toLocaleString('zh-CN')}</span><b>${escapeHtml(entry.quantity)}</b><small>${escapeHtml(entry.brand)} · ${escapeHtml(entry.spec)}</small></button>`).join('') || '<p>暂无到场登记。登记材料或设备时选择本计划，即可自动累计。</p>'}</section>`;
  if (!$('#resourceDetailDialog').open) $('#resourceDetailDialog').showModal();
  $$('[data-resource-entry-detail]', $('#resourceDetailBody')).forEach(button => button.addEventListener('click', () => { $('#resourceDetailDialog').close(); openResourceEntryDetail(button.dataset.resourceEntryDetail); }));
  $('[data-edit-resource-plan]', $('#resourceDetailBody'))?.addEventListener('click', () => { $('#resourceDetailDialog').close(); openResourcePlanDialog(plan); });
  $('[data-withdraw-resource-plan]', $('#resourceDetailBody'))?.addEventListener('click', () => withdrawResourcePlan(plan.id));
  $('[data-remind-resource-approval]', $('#resourceDetailBody'))?.addEventListener('click', () => remindResourceApproval(plan.id));
  $$('[data-approval-action]', $('#resourceDetailBody')).forEach(button => button.addEventListener('click', () => updateResourceApproval(button.dataset.planId, Number(button.dataset.approvalIndex), button.dataset.approvalAction)));
  const approvalAttachments = $('.approval-attachments', $('#resourceDetailBody'));
  if (approvalAttachments) $$('[data-stored-file-index]', approvalAttachments).forEach(button => button.addEventListener('click', () => previewStoredAttachment(plan.approvalAttachments[Number(button.dataset.storedFileIndex)])));
}

async function updateResourceApproval(planId, stepIndex, action) {
  const plan = resourcePlans.find(item => Number(item.id) === Number(planId));
  const step = plan?.approvalWorkflow?.[stepIndex];
  if (!plan || !step) return;
  const currentIndex = plan.approvalWorkflow.findIndex((item, index) => item.status === 'pending' && plan.approvalWorkflow.slice(0, index).every(previous => previous.status === 'approved'));
  if (stepIndex !== currentIndex) { showToast('当前还未轮到该审批节点'); return; }
  if (!isCurrentUserApprovalOwner(step)) { showToast(`无权代办：当前节点由${step.owner}本人审批`); return; }
  const priorIncomplete = plan.approvalWorkflow.slice(0, stepIndex).some(item => item.status !== 'approved');
  if (priorIncomplete) { showToast('请按流程先完成上一审批节点'); return; }
  if (window.ZhuxuServer?.active) {
    try {
      const result = await window.ZhuxuServer.approve(planId, stepIndex, action);
      resourcePlans = result.resourcePlans;
      const updatedPlan = resourcePlans.find(item => Number(item.id) === Number(planId));
      const updatedStep = updatedPlan.approvalWorkflow[stepIndex];
      const notification = syncMaterialApprovalNotifications(updatedPlan);
      persistResources(); persistFollowups(); openResourcePlanDetail(updatedPlan.id);
      showToast(action === 'approve'
        ? notification.purchaseOpened ? `全部审批完成，已开放并通知${notification.notifiedOwner}` : `${updatedStep.role}已通过，已通知${notification.notifiedOwner}审批`
        : `材料计划已退回，已通知${notification.notifiedOwner}修改`);
    } catch (error) { showToast(error.message || '服务器审批失败，请刷新后重试'); }
    return;
  }
  step.status = action === 'approve' ? 'approved' : 'rejected';
  step.actedAt = new Date().toISOString();
  step.actedBy = organizationPersonLabel(getCurrentUser());
  step.actedByAccount = getCurrentUser()?.account || '';
  if (action === 'reject') plan.approvalWorkflow.slice(stepIndex + 1).forEach(item => { item.status = 'pending'; delete item.actedAt; });
  const notification = syncMaterialApprovalNotifications(plan);
  persistResources(); persistFollowups();
  openResourcePlanDetail(plan.id);
  showToast(action === 'approve'
    ? notification.purchaseOpened ? `全部审批完成，已开放并通知${notification.notifiedOwner}` : `${step.role}已通过，已通知${notification.notifiedOwner}审批`
    : `材料计划已退回，已通知${notification.notifiedOwner}修改`);
}

function upsertMaterialReviewFollowup(entry, owner, title, note, index = 0) {
  if (!owner) return;
  const existing = followups.find(item => Number(item.materialEntryId) === Number(entry.id) && item.materialDocumentReview && item.owner === owner && item.status !== 'done');
  const payload = { category: '资料补交', title, requester: '资料员 · 材料资料核查', owner, recipient: owner, zone: entry.location, due: defaultDueValue(), urgency: 'urgent', relatedTask: `${entry.name}进场资料闭环`, materialEntryId: entry.id, materialDocumentReview: true, note, status: 'pending', reminders: Number(existing?.reminders || 0), notificationStatus: 'unread', updatedAt: new Date().toISOString() };
  if (existing) followups = followups.map(item => item.id === existing.id ? { ...item, ...payload } : item);
  else followups.unshift({ id: Math.max(Date.now() + index, ...followups.map(item => Number(item.id) || 0)) + 1, ...payload, createdAt: new Date().toISOString() });
}

function openMaterialDocumentReview(entryId) {
  const entry = resourceEntries.find(item => Number(item.id) === Number(entryId));
  if (!entry) return;
  ensureMaterialDocumentChain(entry);
  const form = $('#materialDocumentReviewForm');
  form.reset();
  form.elements.entryId.value = entry.id;
  const currentReviewStatus = entry.materialDocumentReview?.status;
  form.elements.status.value = currentReviewStatus === 'pending' ? '' : (currentReviewStatus || '');
  form.elements.missingItems.value = (entry.materialDocumentReview?.missingItems || []).join('、');
  populateOrganizationPersonSelect(form.elements.materialClerk, entry.materialDocumentReview?.materialClerk || matchPersonByRole('材料员'));
  populateOrganizationPersonSelect(form.elements.foreman, entry.materialDocumentReview?.foreman || matchPersonByRole('施工员'));
  $('#materialDocumentReviewTitle').textContent = `${entry.name} · 资料核查`;
  $('#materialDocumentReviewSummary').innerHTML = `<div><strong>${escapeHtml(entry.name)}</strong><span>${escapeHtml(entry.quantity)} · ${escapeHtml(entry.location)}</span></div><div class="material-review-proof-summary"><span>收货单 ${entry.receiptAttachments?.length || 0} 份</span><span>到场/验收照片 ${entry.photoAttachments?.length || 0} 张</span><span>其他资料 ${entry.documentAttachments?.length || 0} 份</span></div>${materialDocumentReviewText(entry)}`;
  $('#materialDocumentReviewDialog').showModal();
}

async function saveMaterialDocumentReview(form) {
  const entry = resourceEntries.find(item => Number(item.id) === Number(form.elements.entryId.value));
  if (!entry) return;
  ensureMaterialDocumentChain(entry);
  const status = form.elements.status.value;
  if (!['pending', 'missing', 'complete'].includes(status)) { showToast('请先选择资料核查结果'); return; }
  const previousReview = entry.materialDocumentReview;
  if (status === 'pending' && previousReview.status !== 'pending') { showToast('该记录已核查，请保留现有核查状态后补充上传'); return; }
  const missingItems = String(form.elements.missingItems.value || '').split(/[、,，\n]/).map(item => item.trim()).filter(Boolean);
  if (status === 'missing' && !missingItems.length) { showToast('请选择“资料缺失”时，请填写缺少的资料'); return; }
  const selectedFiles = [...form.elements.files.files];
  const existingDocuments = (entry.documentAttachments || []).filter(file => file.stored && (file.storageKey || file.data));
  const hasSupplement = existingDocuments.some(file => !(previousReview.missingDocumentKeys || []).includes(file.storageKey || file.data || `${file.name}|${file.size}`));
  if (previousReview.status === 'missing' && status === 'complete' && !selectedFiles.length && !(previousReview.missingDocumentKeys && hasSupplement)) {
    showToast('缺失资料尚未补充上传，不能关闭风险；请先上传补齐的资料'); return;
  }
  const snapshot = JSON.parse(JSON.stringify(entry));
  let entrySaved = false;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  submit.textContent = '同步中…';
  try {
    const newFiles = await prepareMaterialProofAttachments(selectedFiles);
    if (newFiles.some(file => !file.stored || !(file.storageKey || file.data))) throw new Error('补充资料原文件未保存成功，请重试');
    entry.documentAttachments = [...(entry.documentAttachments || []), ...newFiles];
    entry.attachments = [...(entry.attachments || []), ...newFiles];
    const materialClerk = form.elements.materialClerk.value || matchPersonByRole('材料员');
    const foreman = form.elements.foreman.value || matchPersonByRole('施工员');
    const missingChanged = status === 'missing' && (previousReview.status !== 'missing' || JSON.stringify(previousReview.missingItems) !== JSON.stringify(missingItems));
    entry.materialDocumentReview = { ...previousReview, status, missingItems: status === 'missing' ? missingItems : [], reviewer: status === 'pending' ? previousReview.reviewer : currentOperatorLabel(), materialClerk, foreman, reviewedAt: status === 'pending' ? previousReview.reviewedAt : new Date().toISOString(), feedbackAt: status === 'missing' ? new Date().toISOString() : (previousReview.feedbackAt || ''), closedAt: status === 'complete' ? new Date().toISOString() : '', missingDocumentKeys: missingChanged ? existingDocuments.map(file => file.storageKey || file.data || `${file.name}|${file.size}`) : (previousReview.missingDocumentKeys || existingDocuments.map(file => file.storageKey || file.data || `${file.name}|${file.size}`)) };
    persistMaterialEntries();
    entrySaved = true;
    const chainKey = ensureMaterialDocumentChain(entry);
    const certificate = chainKey && documentState[chainKey]?.documents?.find(item => item.id === `${chainKey}-certificate`);
    if (certificate) certificate.status = status === 'complete' ? 'done' : 'pending';
    if (status === 'complete') {
      followups = followups.map(item => Number(item.materialEntryId) === Number(entry.id) && item.materialDocumentReview ? { ...item, status: 'done', completedAt: new Date().toISOString(), completedBy: currentOperatorLabel(), notificationStatus: 'read' } : item);
    } else if (status === 'missing') {
      upsertMaterialReviewFollowup(entry, materialClerk, `补齐${entry.name}进场资料`, `资料员核查发现缺少：${missingItems.join('、')}。请材料员取得资料并交资料员补录。`, 1);
      upsertMaterialReviewFollowup(entry, foreman, `跟进${entry.name}资料补交`, `材料进场资料缺少：${missingItems.join('、')}。请责任工长协助材料员闭环。`, 2);
    }
    persistDocumentState(); persistFollowups();
    form.reset(); $('#materialDocumentReviewDialog').close();
    if ($('#resourceDetailDialog').open) { $('#resourceDetailDialog').close(); openResourceEntryDetail(entry.id); }
    if ($('#materials').classList.contains('active')) renderSubview('materials');
    if ($('#documents').classList.contains('active')) renderSubview('documents');
    if ($('#intake').classList.contains('active')) renderSubview('intake');
    showToast(status === 'complete' ? `${entry.name}资料已核查齐全并完成闭环` : status === 'missing' ? `${entry.name}资料缺失已反馈给材料员和责任工长` : '补充资料已保存，仍待资料员核查');
  } catch (error) {
    if (!entrySaved) Object.assign(entry, snapshot);
    showToast(entrySaved ? '资料已保存，待办同步失败，请重试同步' : `保存失败，原附件未改动：${error.message || '请重试'}`);
  } finally {
    submit.disabled = false;
    submit.textContent = '保存核查并同步';
  }
}

function openResourceEntryDetail(entryId) {
  const entry = resourceEntries.find(item => Number(item.id) === Number(entryId));
  if (!entry) return;
  if (entry.type === 'material' && entry.movement === '进场') ensureMaterialDocumentChain(entry);
  delete $('#resourceDetailDialog').dataset.planId;
  const linkedPlan = resourcePlans.find(plan => Number(plan.id) === Number(entry.planId));
  $('#resourceDetailEyebrow').textContent = entry.type === 'material' ? '材料台账详情' : '设备台账详情';
  $('#resourceDetailTitle').textContent = entry.name;
  const review = entry.materialDocumentReview;
  const reviewSection = entry.type === 'material' && entry.movement === '进场' ? `<section class="material-document-review-card ${review?.status === 'complete' ? 'closed' : 'risk'}"><div><strong>资料闭环</strong>${materialDocumentReviewText(entry)}<small>材料员：${escapeHtml(review?.materialClerk || matchPersonByRole('材料员'))} · 责任工长：${escapeHtml(review?.foreman || matchPersonByRole('施工员'))}</small>${review?.missingItems?.length ? `<p>待补资料：${escapeHtml(review.missingItems.join('、'))}</p>` : ''}</div><button type="button" class="secondary-button" data-open-material-document-review="${entry.id}">${review?.status === 'complete' ? '补充资料' : '资料核查 / 补充上传'}</button></section>` : '';
  const supplementButton = entry.type === 'material' && entry.movement === '进场' ? `<button type="button" class="secondary-button" data-open-material-document-review="${entry.id}">＋ 补充上传</button>` : '';
  $('#resourceDetailBody').innerHTML = `<div class="resource-detail-grid">${resourceDetailItem('类别', escapeHtml(entry.category))}${resourceDetailItem('品牌 / 厂家', escapeHtml(entry.brand))}${resourceDetailItem('规格 / 型号', escapeHtml(entry.spec))}${resourceDetailItem('进出场', entry.movement)}${resourceDetailItem('数量', escapeHtml(entry.quantity))}${resourceDetailItem('时间', new Date(entry.arrivalTime).toLocaleString('zh-CN'))}${resourceDetailItem('使用部位', escapeHtml(entry.location))}${resourceDetailItem('关联计划', linkedPlan ? escapeHtml(linkedPlan.name) : '未关联')}${resourceDetailItem('备注', escapeHtml(entry.note || '无'))}</div>${reviewSection}<section class="resource-attachments"><div class="resource-attachments-heading"><strong>资料附件 · ${entry.attachments?.length || 0}</strong>${supplementButton}</div>${renderResourceAttachments(entry)}</section>`;
  $('#resourceDetailDialog').showModal();
  $$('[data-attachment-entry]', $('#resourceDetailBody')).forEach(button => button.addEventListener('click', () => openResourceAttachment(button.dataset.attachmentEntry, button.dataset.attachmentIndex)));
  $$('[data-open-material-document-review]', $('#resourceDetailBody')).forEach(button => button.addEventListener('click', () => openMaterialDocumentReview(button.dataset.openMaterialDocumentReview)));
}

function openResourceWeeklyReport() {
  const upcoming = resourcePlans.map(plan => ({ plan, progress: getResourcePlanProgress(plan) })).filter(item => !item.progress.complete && item.progress.days <= 7).sort((a, b) => a.progress.days - b.progress.days);
  $('#resourceDetailEyebrow').textContent = '供应协调 · 自动预警';
  $('#resourceDetailTitle').textContent = '未来 7 天材料设备到场预报';
  $('#resourceDetailBody').innerHTML = `<div class="weekly-report-list">${upcoming.map(({ plan, progress }) => `<button type="button" data-resource-plan-detail="${plan.id}"><i class="resource-status ${progress.tone}">${progress.status}</i><div><strong>${escapeHtml(plan.name)}</strong><small>${plan.due} · ${escapeHtml(plan.location)} · ${progress.notice}</small></div><b>余 ${formatResourceQuantity(progress.remaining, progress.planned.unit)}</b></button>`).join('') || '<div class="resource-empty">未来一周没有待到场资源</div>'}</div>`;
  $('#resourceDetailDialog').showModal();
  $$('[data-resource-plan-detail]', $('#resourceDetailBody')).forEach(button => button.addEventListener('click', () => { $('#resourceDetailDialog').close(); openResourcePlanDetail(button.dataset.resourcePlanDetail); }));
}

function xmlText(xml, paragraphTag = 'w:p') {
  return new DOMParser().parseFromString(xml, 'application/xml').documentElement.textContent || '';
}

async function extractDocxText(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entry = zip.file('word/document.xml');
  if (!entry) return '';
  const xml = await entry.async('text');
  return xml.replace(/<\/w:p>/g, '\n').replace(/<w:tab\/>/g, '\t').replace(/<[^>]+>/g, ' ').replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ');
}

async function extractXlsxText(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const sharedEntry = zip.file('xl/sharedStrings.xml');
  const shared = [];
  if (sharedEntry) {
    const doc = new DOMParser().parseFromString(await sharedEntry.async('text'), 'application/xml');
    [...doc.getElementsByTagName('si')].forEach(item => shared.push(item.textContent || ''));
  }
  const sheetEntry = zip.file('xl/worksheets/sheet1.xml');
  if (!sheetEntry) return '';
  const sheet = new DOMParser().parseFromString(await sheetEntry.async('text'), 'application/xml');
  return [...sheet.getElementsByTagName('row')].map(row => [...row.getElementsByTagName('c')].map(cell => {
    const value = cell.getElementsByTagName('v')[0]?.textContent || cell.getElementsByTagName('t')[0]?.textContent || '';
    return cell.getAttribute('t') === 's' ? (shared[Number(value)] || value) : value;
  }).join(',')).join('\n');
}

const ATTENDANCE_PARSE_VERSION = 2;

async function extractAttendanceWorkers(file) {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const sharedEntry = zip.file('xl/sharedStrings.xml');
    const shared = [];
    if (sharedEntry) {
      const doc = new DOMParser().parseFromString(await sharedEntry.async('text'), 'application/xml');
      [...doc.getElementsByTagName('si')].forEach(item => shared.push(item.textContent || ''));
    }
    const columnIndex = reference => [...String(reference || '').match(/^[A-Z]+/i)?.[0] || 'A'].reduce((total, letter) => total * 26 + letter.toUpperCase().charCodeAt(0) - 64, 0) - 1;
    const sheetEntries = Object.keys(zip.files).filter(name => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name));
    for (const sheetName of sheetEntries) {
      const sheet = new DOMParser().parseFromString(await zip.file(sheetName).async('text'), 'application/xml');
      const rows = [...sheet.getElementsByTagName('row')].map(row => {
        const values = [];
        [...row.getElementsByTagName('c')].forEach(cell => {
          const value = cell.getElementsByTagName('v')[0]?.textContent || cell.getElementsByTagName('t')[0]?.textContent || '';
          values[columnIndex(cell.getAttribute('r'))] = cell.getAttribute('t') === 's' ? (shared[Number(value)] ?? value) : value;
        });
        return values;
      });
      const headerIndex = rows.slice(0, 30).findIndex(row => row.some(cell => /姓名|名字|人员姓名|员工姓名/.test(String(cell || '').trim())));
      if (headerIndex < 0) continue;
      const header = rows[headerIndex].map(cell => String(cell ?? '').trim());
      const normalizedHeader = header.map(item => item.replace(/\s+/g, ''));
      const findCol = (exactLabels, patterns, excluded = []) => {
        const exactIndex = normalizedHeader.findIndex(item => exactLabels.includes(item));
        if (exactIndex >= 0) return exactIndex;
        return normalizedHeader.findIndex(item => !excluded.some(pattern => pattern.test(item)) && patterns.some(pattern => pattern.test(item)));
      };
      const nameCol = findCol(['姓名', '人员姓名', '员工姓名'], [/姓名/, /名字/, /人员/, /员工/]);
      const tradeCol = findCol(['工种', '具体工种', '作业工种'], [/工种/, /岗位名称/, /职业/], [/分类/, /类别/]);
      const teamCol = findCol(['班组', '责任班组', '所属班组'], [/班组/, /劳务队/, /分包单位/]);
      const checkInCol = findCol(['上班打卡时间', '上班时间', '签到时间'], [/上班/, /签到/, /进场/, /首次打卡/]);
      const checkOutCol = findCol(['下班打卡时间', '下班时间', '签退时间'], [/下班/, /签退/, /退场/, /末次打卡/]);
      const statusCol = findCol(['识别状态', '考勤状态', '出勤状态'], [/状态/, /考勤结果/, /出勤情况/]);
      const workers = rows.slice(headerIndex + 1).map(row => ({
        name: String(row[nameCol] || '').trim(),
        trade: tradeCol >= 0 ? String(row[tradeCol] || '').trim() : '',
        team: teamCol >= 0 ? String(row[teamCol] || '').trim() : '',
        checkIn: checkInCol >= 0 ? String(row[checkInCol] || '').trim() : '',
        checkOut: checkOutCol >= 0 ? String(row[checkOutCol] || '').trim() : '',
        status: statusCol >= 0 ? String(row[statusCol] || '').trim() : ''
      })).filter(item => item.name && !/合计|汇总|制表|审核/.test(item.name));
      if (workers.length) return workers;
    }
    return [];
  } catch (error) {
    return [];
  }
}

function extractPdfFallback(buffer) {
  const raw = new TextDecoder('latin1').decode(buffer);
  const matches = [...raw.matchAll(/\(([^()]*(?:\\.[^()]*)*)\)\s*(?:Tj|TJ)/g)].map(match => match[1].replace(/\\([()\\])/g, '$1'));
  return matches.join('\n');
}

async function extractImageText(file) {
  if (!('TextDetector' in window)) return '';
  const detector = new TextDetector();
  const bitmap = await createImageBitmap(file);
  const results = await detector.detect(bitmap);
  bitmap.close();
  return results.map(item => item.rawValue).join('\n');
}

async function extractFileText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.docx')) return extractDocxText(file);
  if (name.endsWith('.xlsx')) return extractXlsxText(file);
  if (name.endsWith('.csv') || name.endsWith('.txt')) return file.text();
  if (name.endsWith('.pdf')) return extractPdfFallback(await file.arrayBuffer());
  if (file.type.startsWith('image/')) return extractImageText(file);
  return '';
}

function recognizedLines(text, fallbackName) {
  const cleaned = text.split(/\r?\n/).map(line => line.replace(/^\s*[\d一二三四五六七八九十]+[、.．)）]\s*/, '').replace(/[,，]\s*\d{4}[-/.]\d{1,2}[-/.]\d{1,2}.*$/, '').trim()).filter(line => line.length >= 4 && line.length <= 80 && !/^(序号|工作名称|任务名称|开始日期|结束日期|计划)$/.test(line));
  return [...new Set(cleaned)].slice(0, 10).length ? [...new Set(cleaned)].slice(0, 10) : [`待校对：${fallbackName.replace(/\.[^.]+$/, '')}`];
}

function renderPlanRecognitionCandidates() {
  const list = $('#planRecognitionCandidates');
  if (!list) return;
  list.innerHTML = planRecognitionCandidates.map((candidate, index) => `<div class="candidate-row" data-plan-candidate="${index}"><input value="${escapeHtml(candidate.title)}" aria-label="识别计划项 ${index + 1}"><button type="button" data-remove-plan-candidate="${index}">移除</button><div class="candidate-meta"><span>${candidate.start} → ${candidate.end}</span><span>待人工校对</span></div></div>`).join('');
  $$('[data-plan-candidate] input', list).forEach(input => input.addEventListener('input', () => { planRecognitionCandidates[Number(input.closest('[data-plan-candidate]').dataset.planCandidate)].title = input.value; }));
  $$('[data-remove-plan-candidate]', list).forEach(button => button.addEventListener('click', () => { planRecognitionCandidates.splice(Number(button.dataset.removePlanCandidate), 1); renderPlanRecognitionCandidates(); }));
}

function renderPlanAttachmentList() {
  const list = $('#planAttachmentList');
  if (!list) return;
  if (!planAttachmentsDraft.length) { list.innerHTML = '<p class="plan-attachment-empty">尚未添加计划表原文件</p>'; return; }
  list.innerHTML = planAttachmentsDraft.map((file, index) => `<div class="plan-attachment-item"><i>${attachmentKind(file) === 'image' ? 'IMG' : attachmentKind(file) === 'pdf' ? 'PDF' : 'FILE'}</i><span><b>${escapeHtml(file.name)}</b><small>${file.stored ? formatAttachmentSize(file.size) : '待上传'}</small></span><button type="button" data-remove-plan-attachment="${index}" aria-label="移除附件">×</button></div>`).join('');
  $$('[data-remove-plan-attachment]', list).forEach(button => button.addEventListener('click', () => { planAttachmentsDraft.splice(Number(button.dataset.removePlanAttachment), 1); renderPlanAttachmentList(); }));
}

function renderPlanSubtaskList() {
  const list = $('#planSubtaskList');
  if (!list) return;
  if (!planSubtasksDraft.length) { list.innerHTML = '<p class="plan-subtask-empty">未添加子任务：保存时按“工作名称”生成一条任务；添加子任务后按每条子任务自动拆分。</p>'; return; }
  list.innerHTML = planSubtasksDraft.map((subtask, index) => `<div class="plan-subtask-row" data-plan-subtask="${index}"><input class="plan-subtask-title" value="${escapeHtml(subtask.title || '')}" placeholder="子任务名称"><input class="plan-subtask-owner" list="organizationOwners" value="${escapeHtml(subtask.owner || '')}" placeholder="责任人（可留空自动匹配）"><input class="plan-subtask-team" value="${escapeHtml(subtask.team || '')}" placeholder="责任班组"><button type="button" data-remove-plan-subtask="${index}" aria-label="移除子任务">×</button></div>`).join('');
  $$('[data-remove-plan-subtask]', list).forEach(button => button.addEventListener('click', () => { planSubtasksDraft.splice(Number(button.dataset.removePlanSubtask), 1); renderPlanSubtaskList(); }));
  $$('.plan-subtask-title', list).forEach(input => input.addEventListener('input', () => { planSubtasksDraft[Number(input.closest('[data-plan-subtask]').dataset.planSubtask)].title = input.value; }));
  $$('.plan-subtask-owner', list).forEach(input => input.addEventListener('input', () => { planSubtasksDraft[Number(input.closest('[data-plan-subtask]').dataset.planSubtask)].owner = input.value; }));
  $$('.plan-subtask-team', list).forEach(input => input.addEventListener('input', () => { planSubtasksDraft[Number(input.closest('[data-plan-subtask]').dataset.planSubtask)].team = input.value; }));
}

function addPlanSubtask(subtask = {}) {
  planSubtasksDraft.push({ title: subtask.title || '', owner: subtask.owner || '', team: subtask.team || '' });
  renderPlanSubtaskList();
}

function organizationSelectOptions(selected = '', emptyLabel = '请选择') {
  const current = String(selected || '').trim();
  const options = organization.map(person => organizationPersonLabel(person));
  if (current && !options.includes(current)) options.unshift(current);
  return `<option value="">${emptyLabel}</option>${options.map(value => `<option value="${escapeHtml(value)}" ${value === current ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}`;
}

function responsibilityTeamOptions(selected = '') {
  const current = String(selected || '').trim();
  const defaults = ['钢筋班组', '木工一班', '机电二组', '混凝土班组', '设备组', '文明施工班组'];
  const values = [...new Set([...defaults, ...plans.map(plan => plan.team), ...tasks.map(task => task.team)].filter(Boolean).map(String))];
  if (current && !values.includes(current)) values.unshift(current);
  return `<option value="">请选择责任班组</option>${values.map(value => `<option value="${escapeHtml(value)}" ${value === current ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}`;
}

function renderPlanDayRows() {
  const list = $('#planDayRowsList');
  if (!list) return;
  list.innerHTML = planDayRowsDraft.map((row, index) => `<div class="plan-day-input-row" data-plan-day-row="${index}" data-plan-day-id="${row.id || ''}"><span class="plan-day-row-number">${String(index + 1).padStart(2, '0')}</span><input class="plan-day-title" value="${escapeHtml(row.title || '')}" placeholder="例如：3#楼8F梁板钢筋绑扎"><label><span>需完成</span><input class="plan-day-target" type="number" min="0" max="100" value="${Number(row.dailyTarget ?? 100)}"><em>%</em></label><select class="plan-day-owners" aria-label="责任人">${organizationSelectOptions(String(row.owners || '').split(/[、,，]/)[0], '请选择责任人')}</select><select class="plan-day-team" aria-label="责任班组">${responsibilityTeamOptions(row.team)}</select><button type="button" data-remove-plan-day-row="${index}" aria-label="删除第${index + 1}项工作">×</button></div>`).join('');
  $$('[data-remove-plan-day-row]', list).forEach(button => button.addEventListener('click', () => {
    if (planDayRowsDraft.length === 1) planDayRowsDraft[0] = { id: planDayRowsDraft[0].id || null, title: '', dailyTarget: 100, owners: '', team: '' };
    else planDayRowsDraft.splice(Number(button.dataset.removePlanDayRow), 1);
    renderPlanDayRows();
  }));
  $$('.plan-day-title', list).forEach(input => {
    input.addEventListener('input', () => { planDayRowsDraft[Number(input.closest('[data-plan-day-row]').dataset.planDayRow)].title = input.value; });
    input.addEventListener('blur', () => {
      const index = Number(input.closest('[data-plan-day-row]').dataset.planDayRow);
      if (!planDayRowsDraft[index].owners && input.value.trim()) {
        planDayRowsDraft[index].owners = matchResponsible(input.value).owner;
        renderPlanDayRows();
      }
    });
  });
  $$('.plan-day-target', list).forEach(input => input.addEventListener('input', () => { planDayRowsDraft[Number(input.closest('[data-plan-day-row]').dataset.planDayRow)].dailyTarget = Math.max(0, Math.min(100, Number(input.value || 0))); }));
  $$('.plan-day-owners', list).forEach(input => input.addEventListener('change', () => { planDayRowsDraft[Number(input.closest('[data-plan-day-row]').dataset.planDayRow)].owners = input.value; }));
  $$('.plan-day-team', list).forEach(input => input.addEventListener('change', () => { planDayRowsDraft[Number(input.closest('[data-plan-day-row]').dataset.planDayRow)].team = input.value; }));
}

function addPlanDayRow(row = {}) {
  planDayRowsDraft.push({ id: row.id || null, title: row.title || '', dailyTarget: row.dailyTarget ?? 100, owners: row.owners || '', team: row.team || '' });
  renderPlanDayRows();
  $('#planDayRowsList .plan-day-input-row:last-child .plan-day-title')?.focus();
}

function removeDailyPlanById(planId) {
  const numericId = Number(planId);
  const removed = plans.find(plan => Number(plan.id) === numericId);
  if (!removed) return false;
  const taskIds = tasks.filter(task => Number(task.dayPlanId) === numericId || Number(task.id) === Number(removed.taskId)).map(task => Number(task.id));
  if (dailyExecution.some(record => ZhuxuMeetingRules.locked(record) && (Number(record.dayPlanId) === numericId || taskIds.includes(Number(record.taskId))))) { showToast('该计划已有例会确认记录，不能撤销'); return false; }
  plans = plans.filter(plan => Number(plan.id) !== numericId);
  tasks = tasks.filter(task => !taskIds.includes(Number(task.id)) && Number(task.dayPlanId) !== numericId);
  dailyExecution = dailyExecution.filter(record => Number(record.dayPlanId) !== numericId && !taskIds.includes(Number(record.taskId)));
  return true;
}

function attachDropzoneHandlers(root = document) {
  $$('[data-dropzone]', root).forEach(dropzone => {
    if (dropzone.dataset.dropzoneBound) return;
    dropzone.dataset.dropzoneBound = '1';
    const input = dropzone.querySelector('input[type="file"]') || document.getElementById(dropzone.dataset.for);
    if (!input) return;
    ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); event.stopPropagation(); dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); event.stopPropagation(); dropzone.classList.remove('dragover'); }));
    dropzone.addEventListener('drop', event => {
      const files = [...(event.dataTransfer?.files || [])];
      if (!files.length) return;
      try {
        const transfer = new DataTransfer();
        files.forEach(file => transfer.items.add(file));
        input.files = transfer.files;
      } catch (error) { /* 旧浏览器不支持 DataTransfer 构造器时忽略 */ }
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}

function enhanceNativeFileUploads(root = document) {
  $$('input[type="file"]', root).forEach(input => {
    if (input.dataset.nativeDropBound || input.closest('[data-dropzone]')) return;
    input.dataset.nativeDropBound = '1';
    const label = input.closest('label');
    if (!label) return;
    label.classList.add('native-file-dropzone');
    ['dragenter', 'dragover'].forEach(type => label.addEventListener(type, event => { event.preventDefault(); event.stopPropagation(); label.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(type => label.addEventListener(type, event => { event.preventDefault(); event.stopPropagation(); label.classList.remove('dragover'); }));
    label.addEventListener('drop', event => {
      const files = [...(event.dataTransfer?.files || [])];
      if (!files.length) return;
      try {
        const transfer = new DataTransfer();
        files.forEach(file => transfer.items.add(file));
        input.files = transfer.files;
      } catch (error) { return; }
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}

function renderTaskRecognitionCandidates() {
  $('#taskRecognitionCandidates').innerHTML = taskRecognitionCandidates.map((candidate, index) => `<div class="candidate-row" data-task-candidate="${index}"><input value="${escapeHtml(candidate.title)}" aria-label="识别任务 ${index + 1}"><button type="button" data-remove-task-candidate="${index}">移除</button><div class="candidate-meta"><span>匹配：${candidate.role}</span><span>${candidate.owner}</span><button type="button" data-adopt-task="${index}">载入编辑</button></div></div>`).join('');
  $$('[data-task-candidate] > input').forEach(input => input.addEventListener('input', () => { const row = input.closest('[data-task-candidate]'); const candidate = taskRecognitionCandidates[Number(row.dataset.taskCandidate)]; candidate.title = input.value; Object.assign(candidate, matchResponsible(input.value)); const spans = row.querySelectorAll('.candidate-meta span'); spans[0].textContent = `匹配：${candidate.role}`; spans[1].textContent = candidate.owner; }));
  $$('[data-remove-task-candidate]').forEach(button => button.addEventListener('click', () => { taskRecognitionCandidates.splice(Number(button.dataset.removeTaskCandidate), 1); renderTaskRecognitionCandidates(); }));
  $$('[data-adopt-task]').forEach(button => button.addEventListener('click', () => { const candidate = taskRecognitionCandidates[Number(button.dataset.adoptTask)]; $('#taskForm input[name="title"]').value = candidate.title; $('#taskForm input[name="owner"]').value = candidate.owner; $('#ownerMatchHint').textContent = `系统匹配：${candidate.role}；可手工修改`; }));
}

async function recognizePlanFile(file) {
  $('#planRecognitionState').className = 'recognition-state working';
  $('#planRecognitionState').textContent = `正在识别 ${file.name}…`;
  try {
    const attachment = await prepareResourceAttachments([file]).then(list => list[0]);
    if (attachment) { planAttachmentsDraft = planAttachmentsDraft.filter(item => item.name !== attachment.name); planAttachmentsDraft.push(attachment); renderPlanAttachmentList(); }
    const text = await extractFileText(file);
    const start = $('#planForm input[name="start"]').value || new Date().toISOString().slice(0,10);
    const end = $('#planForm input[name="end"]').value || new Date(Date.now() + 7 * 86400000).toISOString().slice(0,10);
    planRecognitionCandidates = recognizedLines(text, file.name).map(title => ({ title, start, end }));
    renderPlanRecognitionCandidates();
    if (planRecognitionCandidates[0]) $('#planForm input[name="title"]').value = planRecognitionCandidates[0].title;
    $('#planRecognitionState').className = 'recognition-state done';
    $('#planRecognitionState').textContent = text ? `已从 ${file.name} 提取 ${planRecognitionCandidates.length} 项，请校对后更新` : `未提取到正文，已按文件名生成候选项，请人工校对`;
  } catch (error) {
    $('#planRecognitionState').className = 'recognition-state';
    $('#planRecognitionState').textContent = '文件识别失败，请改用清晰图片、DOCX、XLSX或CSV后重试';
  }
}

async function recognizeTaskFiles(files) {
  $('#taskRecognitionState').className = 'recognition-state working';
  $('#taskRecognitionState').textContent = `正在识别 ${files.length} 个文件…`;
  const candidates = [];
  for (const file of files) {
    let text = '';
    try { text = await extractFileText(file); } catch (error) { /* 进入人工校对候选 */ }
    recognizedLines(text, file.name).forEach(title => candidates.push({ title, ...matchResponsible(title) }));
  }
  taskRecognitionCandidates = candidates.slice(0, 15);
  renderTaskRecognitionCandidates();
  if (taskRecognitionCandidates[0]) { $('#taskForm input[name="title"]').value = taskRecognitionCandidates[0].title; $('#taskForm input[name="owner"]').value = taskRecognitionCandidates[0].owner; $('#ownerMatchHint').textContent = `系统匹配：${taskRecognitionCandidates[0].role}；可手工修改`; }
  $('#taskRecognitionState').className = 'recognition-state done';
  $('#taskRecognitionState').textContent = `已生成 ${taskRecognitionCandidates.length} 条候选任务，请核对责任岗位后分发`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
}

async function prepareMaterialProofAttachments(files) {
  // This workflow must never silently drop selected files or lose their storage references.
  const results = [];
  for (const file of files) {
    const stored = await prepareResourceAttachments([file]);
    const attachment = stored[0];
    if (!attachment?.stored || !(attachment.storageKey || attachment.data) || (window.ZhuxuServer?.active && !attachment.storageKey)) {
      throw new Error(`“${file.name}”原文件未保存成功，请保留表单并重试`);
    }
    results.push(attachment);
  }
  return results;
}

async function prepareResourceAttachments(files) {
  const results = [];
  const serverReady = Boolean(window.ZhuxuServer?.active);
  for (const [index, file] of [...files].slice(0, 8).entries()) {
    try {
      if (serverReady) {
        const uploaded = await window.ZhuxuServer.uploadAttachment(file);
        if (uploaded?.storageKey) {
          results.push({ name: uploaded.name || file.name, type: uploaded.type || file.type || 'application/octet-stream', size: uploaded.size || file.size, storageKey: uploaded.storageKey, stored: true });
          continue;
        }
        throw new Error('附件上传失败');
      }
      const storageKey = `resource-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;
      await saveResourceAttachment(file, storageKey);
      results.push({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, storageKey, stored: true });
    } catch (error) {
      try {
        if (file.size > 1500000) throw error;
        results.push({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, data: await fileToDataUrl(file), stored: true });
      } catch (fallbackError) {
        results.push({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, stored: false });
      }
    }
  }
  return results;
}

function getMaterialAcceptanceTitle(categoryKey, group) {
  const entry = resourceEntries.find(item => Number(item.id) === Number(group.materialEntryId));
  const names = { steel: '钢筋', concrete: '混凝土', waterproof: '防水材料', masonry: '砌块' };
  return `${entry?.name || names[categoryKey] || documentChainConfigs[categoryKey]?.label || '材料'}进场验收`;
}

function getMaterialAcceptanceStatus(group) {
  const done = group.documents.filter(item => item.status === 'done').length;
  if (group.documents.some(item => item.status === 'failed') || group.sampleStatus === 'failed') return { label: '存在不合格', className: 'failed', done };
  if (done === group.documents.length && group.sampleStatus === 'qualified') return { label: '资料已闭环', className: 'done', done };
  if (group.documents.some(item => item.status === 'testing') || group.sampleStatus === 'testing') return { label: '送检 / 检测中', className: 'testing', done };
  return { label: '资料待完善', className: 'pending', done };
}

function concealedStatusMeta(status) {
  return {
    pending: { label: '待验收', className: 'pending', gate: '后续工序待放行' },
    qualified: { label: '已验收放行', className: 'done', gate: '关联工序可推进' },
    failed: { label: '验收不合格', className: 'failed', gate: '阻塞后续工序' }
  }[status] || { label: '待验收', className: 'pending', gate: '后续工序待放行' };
}

function renderConcealedExistingFiles(item) {
  const groups = item ? [['隐蔽验收资料', item.documentAttachments || []], ['现场照片', item.photoAttachments || []]] : [];
  $('#concealedExistingFiles').innerHTML = groups.map(([label, files], index) => `<section data-concealed-files="${index}"><strong>${label} · ${files.length}</strong>${renderStoredFileList(files, `尚未上传${label}`)}</section>`).join('');
  groups.forEach(([, files], index) => $$('[data-stored-file-index]', $(`[data-concealed-files="${index}"]`, $('#concealedExistingFiles'))).forEach(button => button.addEventListener('click', () => previewStoredAttachment(files[Number(button.dataset.storedFileIndex)]))));
}

function updateConcealedGateHint() {
  const form = $('#concealedAcceptanceForm');
  const status = form.elements.status.value;
  $('#concealedGateHint').className = `concealed-gate-hint ${status}`;
  $('#concealedGateHint').innerHTML = status === 'qualified'
    ? '<strong>验收合格将放行关联工序</strong><span>保存前需同时上传隐蔽验收资料和现场照片。</span>'
    : status === 'failed'
      ? '<strong>验收不合格将阻塞关联工序</strong><span>完善整改及复验资料后再更新为合格。</span>'
      : '<strong>当前保持待验收</strong><span>关联工序暂不放行，可先保存并继续补充资料。</span>';
}

function openConcealedAcceptanceDialog(item = null) {
  editingConcealedAcceptanceId = item?.id || null;
  const form = $('#concealedAcceptanceForm');
  form.reset();
  form.elements.acceptanceId.value = item?.id || '';
  form.elements.title.value = item?.title || '';
  form.elements.processType.value = item?.processType || '钢筋工程隐蔽';
  form.elements.location.value = item?.location || '';
  form.elements.date.value = item?.date || new Date().toISOString().slice(0, 10);
  form.elements.owner.value = item?.owner || matchPersonByRole('质量员');
  form.elements.witness.value = item?.witness || matchPersonByRole('施工员');
  form.elements.linkedProcess.value = item?.linkedProcess || '';
  form.elements.status.value = item?.status || 'pending';
  form.elements.conclusion.value = item?.conclusion || '';
  renderConcealedExistingFiles(item);
  updateConcealedGateHint();
  $('#concealedAcceptanceDialogTitle').textContent = item ? '查看并编辑隐蔽验收' : '新增隐蔽验收';
  $('#concealedAcceptanceDialog').showModal();
}

function buildDocumentLedger() {
  const rows = [];
  Object.entries(documentState).forEach(([key, group]) => {
    const entry = resourceEntries.find(item => Number(item.id) === Number(group.materialEntryId));
    group.documents.forEach(doc => {
      rows.push({
        no: rows.length + 1,
        category: `${documentChainConfigs[key]?.label || key}材料验收`,
        name: doc.name,
        location: [entry?.location, group.linkedProcess].filter(Boolean).join(' · ') || '未关联具体部位',
        owner: resolveOrganizationOwner(doc.owner),
        due: doc.due,
        status: { pending: '待办理', testing: '检测中', done: '已完成', failed: '不合格' }[doc.status] || doc.status,
        statusClass: doc.status
      });
    });
  });
  concealedAcceptances.forEach(item => {
    const meta = concealedStatusMeta(item.status);
    rows.push({
      no: rows.length + 1,
      category: '隐蔽验收',
      name: item.title,
      location: `${item.location} · ${item.processType}`,
      owner: item.owner,
      due: item.date,
      status: meta.label,
      statusClass: item.status
    });
  });
  return rows;
}

function renderDocumentLedgerPanel() {
  const rows = buildDocumentLedger();
  return `<section class="document-list-panel document-ledger-panel">
    <div class="document-panel-heading"><div><h2>资料台账（自动生成）</h2><p>系统根据材料验收资料和隐蔽验收记录自动汇总，共 ${rows.length} 条，可导出核对</p></div>${rows.length ? '<button type="button" data-export-ledger>导出台账 CSV</button>' : ''}</div>
    ${rows.length ? `<div class="document-ledger-table"><div class="document-ledger-row header"><span>序号</span><span>资料名称</span><span>类别</span><span>关联部位 / 工序</span><span>责任人</span><span>完成时限</span><span>状态</span></div>${rows.map(row => `<div class="document-ledger-row"><span>${row.no}</span><span class="ledger-name">${escapeHtml(row.name)}</span><span>${escapeHtml(row.category)}</span><span>${escapeHtml(row.location)}</span><span>${escapeHtml(row.owner)}</span><span>${escapeHtml(row.due)}</span><span><em class="material-batch-status ${row.statusClass}">${escapeHtml(row.status)}</em></span></div>`).join('')}</div>` : '<div class="resource-empty">台账为空：登记材料进场或新增隐蔽验收后自动生成。</div>'}
  </section>`;
}

function exportDocumentLedger() {
  const rows = buildDocumentLedger();
  if (!rows.length) { showToast('台账为空，暂无可导出内容'); return; }
  const header = ['序号', '资料名称', '类别', '关联部位/工序', '责任人', '完成时限', '状态'];
  const csv = '\uFEFF' + [header, ...rows.map(row => [row.no, row.name, row.category, row.location, row.owner, row.due, row.status].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `资料台账-${dailyDateKey}.csv`; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('资料台账已导出为 CSV');
}

function renderMaterialReviewQueue() {
  const pending = resourceEntries.filter(entry => entry.type === 'material' && entry.movement === '进场' && entry.materialDocumentReview?.status !== 'complete');
  return `<section class="document-list-panel material-review-queue"><div class="document-panel-heading"><div><h2>到场材料资料核查 · ${pending.length} 批</h2><p>先核查是否缺资料；缺失项补充上传后再确认齐全，原附件保留在材料台账。</p></div></div>${pending.map(entry => `<button type="button" class="material-review-queue-row" data-resource-entry-detail="${entry.id}"><div><strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(String(entry.arrivalTime || '').slice(0, 10))} · ${escapeHtml(entry.location)} · ${escapeHtml(entry.quantity)}</small></div>${materialDocumentReviewText(entry)}<span>查看 / 核查 / 补传 →</span></button>`).join('') || '<p class="resource-empty">暂无待核查或缺资料的材料批次。</p>'}</section>`;
}

function renderDocumentsBody() {
  resourceEntries.forEach(ensureMaterialDocumentChain);
  if (!documentState[activeDocumentChain]) activeDocumentChain = Object.keys(documentState)[0];
  if (!Object.keys(documentState).length) {
    return `<div class="document-overview">
      <article class="document-kpi"><span>资料完成率</span><strong>0<small>%</small></strong><p>0 / 0 项已闭环</p></article>
      <article class="document-kpi"><span>与材料进场关联</span><strong>0<small>批材料</small></strong><p>0 条资料与工序链路</p></article>
      <article class="document-kpi risk"><span>阻塞施工节点</span><strong>0<small>项</small></strong><p>当前无资料门禁阻塞</p></article>
    </div>
    <section class="document-list-panel"><div class="document-panel-heading"><div><h2>材料与施工资料链</h2><p>材料进场、送检、报告和使用部位形成可追溯放行关系</p></div><button type="button" class="secondary-button" data-jump-materials>进入材料设备</button></div><div class="resource-empty">尚未登记任何材料进场批次。资料链会在材料进场登记后自动生成，请先在“材料设备”中登记材料到场。</div></section>
    <section class="document-list-panel concealed-acceptance-panel"><div class="document-panel-heading"><div><h2>施工过程隐蔽验收</h2><p>验收资料和现场照片共同形成工序放行依据</p></div><button type="button" data-new-concealed>＋ 新增隐蔽验收</button></div><div class="concealed-acceptance-list"><div class="resource-empty">还没有隐蔽验收记录</div></div></section>
    ${renderDocumentLedgerPanel()}`;
  }
  const stats = getDocumentStats();
  const chain = documentState[activeDocumentChain];
  const config = documentChainConfigs[activeDocumentChain];
  const statusLabel = { testing: '送检 / 验收中', qualified: '结果合格', failed: '结果不合格' }[chain.sampleStatus];
  const statusClass = chain.sampleStatus === 'qualified' ? 'qualified' : '';
  const blockedCount = Object.values(documentState).filter(group => group.sampleStatus !== 'qualified').length + concealedAcceptances.filter(item => item.status !== 'qualified').length;
  const acceptanceBatches = Object.entries(documentState).map(([categoryKey, group]) => ({ categoryKey, group, config: documentChainConfigs[categoryKey], entry: resourceEntries.find(item => Number(item.id) === Number(group.materialEntryId)), status: getMaterialAcceptanceStatus(group) }));
  const linkedMaterial = resourceEntries.find(entry => Number(entry.id) === Number(chain.materialEntryId));
  return `<div class="document-overview">
      <article class="document-kpi"><span>资料完成率</span><strong>${stats.percent}<small>%</small></strong><p>${stats.done} / ${stats.total} 项已闭环</p></article>
      <article class="document-kpi"><span>与材料进场关联</span><strong>${Object.values(documentState).filter(group => group.materialEntryId).length}<small>批材料</small></strong><p>${Object.keys(documentState).length} 条资料与工序链路</p></article>
      <article class="document-kpi risk"><span>阻塞施工节点</span><strong>${blockedCount}<small>项</small></strong><p>${blockedCount ? '存在资料未合格的关联工序' : '当前无资料门禁阻塞'}</p></article>
    </div>
    ${renderMaterialReviewQueue()}
    <section class="document-chain-panel">
      <div class="document-panel-heading"><div><h2>材料与施工资料链 · ${config.label}</h2><p>材料进场、送检、报告和使用部位形成可追溯放行关系</p></div><button data-chain-update="${activeDocumentChain}">登记送检结果</button></div>
      <div class="chain-switcher" role="tablist" aria-label="切换施工资料链">
        ${Object.entries(documentChainConfigs).map(([key, item]) => `<button type="button" role="tab" aria-selected="${key === activeDocumentChain}" class="${key === activeDocumentChain ? 'active' : ''} ${documentState[key].sampleStatus === 'qualified' ? 'qualified' : ''}" data-chain-tab="${key}"><i></i>${item.label}</button>`).join('')}
      </div>
      <div class="chain-material-card">${linkedMaterial ? `<div><strong>${escapeHtml(linkedMaterial.name)}</strong><small>${escapeHtml(linkedMaterial.brand)} · ${escapeHtml(linkedMaterial.spec)} · ${escapeHtml(linkedMaterial.quantity)}</small></div><span>用于 ${escapeHtml(linkedMaterial.location)}</span><span>进场 ${new Date(linkedMaterial.arrivalTime).toLocaleDateString('zh-CN')}</span><span>委托 ${chain.commissionAttachments?.length || 0} · 报告 ${chain.reportAttachments?.length || 0}</span>` : '<p>本资料链尚未选择材料进场批次，可点击“登记送检结果”关联。</p>'}</div>
      <div class="dependency-chain">
        ${config.steps.map((step, index) => `<div class="dependency-step ${index < 2 ? 'done' : index === 2 ? (chain.sampleStatus === 'qualified' ? 'done' : 'current') : (chain.sampleStatus === 'qualified' ? 'done' : 'blocked')}"><i>${index < 2 || chain.sampleStatus === 'qualified' ? '✓' : index === 2 ? '3' : '!'}</i><strong>${step[0]}</strong><small>${index === 2 ? statusLabel : index === 3 ? (chain.sampleStatus === 'qualified' ? '允许推进' : '等待资料放行') : step[1]}</small></div>${index < config.steps.length - 1 ? '<span class="dependency-arrow">→</span>' : ''}`).join('')}
      </div>
      <div class="gate-result ${statusClass}"><strong>${chain.sampleStatus === 'qualified' ? '资料门禁已放行' : '资料门禁未放行'}</strong><p>${chain.sampleStatus === 'qualified' ? `${config.resultName}已确认合格，关联的${config.processName}可以继续。` : `${config.resultName}尚未合格，${config.processName}保持等待；可催办责任人或登记最新结果。`}</p><button data-check-chain="${activeDocumentChain}">登记结果</button></div>
    </section>
    <section class="document-list-panel">
      <div class="document-panel-heading"><div><h2>材料进场验收资料</h2><p>共 ${acceptanceBatches.length} 批材料；每批归纳质量证明、进场验收、送检委托和检测报告等 ${stats.total} 项资料</p></div></div>
      <div class="material-acceptance-row header"><span>进场验收批次</span><span>材料 / 使用部位</span><span>包含资料</span><span>责任人</span><span>完成情况</span><span>操作</span></div>
      ${acceptanceBatches.map(({ categoryKey, group, entry, status }) => {
        const owners = [...new Set(group.documents.map(item => resolveOrganizationOwner(item.owner)))];
        const locationText = [entry?.location, group.linkedProcess].filter(Boolean).join(' · ');
        return `<div class="material-acceptance-row"><button type="button" class="material-acceptance-name" data-edit-material-acceptance="${categoryKey}"><strong>${escapeHtml(getMaterialAcceptanceTitle(categoryKey, group))}</strong><small>${entry ? `${new Date(entry.arrivalTime).toLocaleDateString('zh-CN')} · ${escapeHtml(entry.brand)} · ${escapeHtml(entry.spec)}` : '尚未关联具体进场批次'}</small></button><span>${entry ? `${escapeHtml(entry.name)}<small>${escapeHtml(locationText || entry.location || '')}</small>` : escapeHtml(documentChainConfigs[categoryKey]?.label || '材料')}</span><span><b>${group.documents.length} 项</b><small>${group.documents.map(item => escapeHtml(item.name.replace(/钢筋|材料|砌块|混凝土/g, ''))).join('、')}</small></span><span>${owners.slice(0,2).map(owner => `<b>${escapeHtml(owner)}</b>`).join('')}${owners.length > 2 ? `<small>另 ${owners.length - 2} 人</small>` : ''}</span><span><em class="material-batch-status ${status.className}">${status.label}</em><small>${status.done} / ${group.documents.length} 项完成</small></span><button type="button" class="edit-action" data-edit-material-acceptance="${categoryKey}">查看 / 编辑</button></div>`;
      }).join('')}
    </section>
    <section class="document-list-panel concealed-acceptance-panel">
      <div class="document-panel-heading"><div><h2>施工过程隐蔽验收</h2><p>验收资料和现场照片共同形成工序放行依据；未合格记录自动阻塞关联工序</p></div><button type="button" data-new-concealed>＋ 新增隐蔽验收</button></div>
      <div class="concealed-acceptance-list">
        ${concealedAcceptances.map(item => {
          const meta = concealedStatusMeta(item.status);
          return `<button type="button" class="concealed-acceptance-row" data-edit-concealed="${item.id}"><i class="${meta.className}">隐</i><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.processType)} · ${escapeHtml(item.location)} · ${item.date}</small><em>关联：${escapeHtml(item.linkedProcess)}</em></div><span>${escapeHtml(item.owner)}<small>${escapeHtml(item.witness)} 共同验收</small></span><span><b>${item.documentAttachments?.length || 0} 份资料</b><small>${item.photoAttachments?.length || 0} 张照片</small></span><span><em class="material-batch-status ${meta.className}">${meta.label}</em><small>${meta.gate}</small></span><b>查看 / 编辑</b></button>`;
        }).join('') || '<div class="resource-empty">还没有隐蔽验收记录</div>'}
      </div>
    </section>
    ${renderDocumentLedgerPanel()}`;
}

function renderQualityBody() {
  const qualityItems = qualityChecks.filter(item => item.type === 'quality');
  const pending = qualityItems.filter(item => item.status !== 'closed');
  const filtered = activeQualityFilter === 'pending' ? pending : qualityItems;
  const openInspectionIssues = safetyInspections.reduce((total, inspection) => total + inspection.issues.filter(issue => issue.status !== 'closed').length, 0);
  const qualityRows = filtered.map(item => `<button type="button" class="quality-check-row" data-edit-quality="${item.id}"><i class="${item.type}">质</i><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.location)} · ${item.date} · 责任人 ${escapeHtml(item.owner)}${item.auditedBy ? ` · ${escapeHtml(item.auditedBy)} 已确认整改完成` : ''}</small></div><span class="quality-status ${item.status}">${item.status === 'closed' ? '已闭环' : item.status === 'rectifying' ? '整改中' : '待整改'}</span><span>${(item.beforeAttachments?.length || 0) + (item.afterAttachments?.length || 0) + (item.recordAttachments?.length || 0)} 个附件</span></button>`).join('');
  const inspectionRows = safetyInspections.map(inspection => {
    const open = inspection.issues.filter(issue => issue.status !== 'closed').length;
    const attachments = (inspection.recordAttachments?.length || 0) + (inspection.noticeAttachments?.length || 0) + (inspection.replyAttachments?.length || 0) + inspection.issues.reduce((sum, issue) => sum + (issue.beforeAttachments?.length || 0) + (issue.afterAttachments?.length || 0), 0);
    return `<button type="button" class="quality-check-row inspection-batch-row" data-edit-inspection="${inspection.id}"><i class="safety">安</i><div><strong>${escapeHtml(inspection.title)}</strong><small>${escapeHtml(inspection.location)} · ${inspection.date} · 巡检负责人 ${escapeHtml(inspection.inspector)}</small><em>${inspection.issues.length} 项问题 · ${open ? `${open} 项待闭环` : '已逐项闭环'}</em></div><span class="quality-status ${inspection.status}">${inspection.status === 'closed' ? '统一回复已闭环' : inspection.status === 'rectifying' ? '整改中' : '待整改'}</span><span>${attachments} 个附件</span></button>`;
  }).join('');
  return `<div class="quality-summary-grid">
    <button type="button" class="info-card interactive ${activeQualityFilter === 'pending' ? 'active' : ''}" data-quality-filter="pending"><h3>待整改</h3><div class="big">${pending.length} 项</div><p>其中 ${pending.filter(item => item.critical).length} 项影响关键节点 · 点击查看内容</p><div class="mini-bar"><i style="width:${Math.min(100, pending.length / Math.max(qualityItems.length,1) * 100)}%"></i></div></button>
    <button type="button" class="info-card interactive ${activeQualityFilter === 'safety' ? 'active' : ''}" data-quality-filter="safety"><h3>安全巡检</h3><div class="big">${safetyInspections.length} 次</div><p>${openInspectionIssues} 项问题待逐一闭环 · 点击查看巡检批次</p><div class="mini-bar"><i style="width:${Math.max(15, Math.round((1 - openInspectionIssues / Math.max(1, safetyInspections.reduce((sum,item)=>sum+item.issues.length,0))) * 100))}%"></i></div></button>
  </div><section class="quality-list-panel"><div class="quality-list-heading"><div><strong>${activeQualityFilter === 'pending' ? '待整改内容' : activeQualityFilter === 'safety' ? '安全巡检记录' : '全部质量检查记录'}</strong><small>${activeQualityFilter === 'safety' ? '每次巡检为一条主记录，统一回复下逐项记录整改内容与前后照片' : '检查记录、整改前后照片及复验结果均可编辑查看'}</small></div><div><button type="button" data-quality-filter="all">查看质量检查</button>${activeQualityFilter === 'safety' ? '<button type="button" data-new-inspection>新增巡检</button>' : ''}</div></div><div class="quality-check-list">${activeQualityFilter === 'safety' ? inspectionRows : qualityRows}${(!activeQualityFilter || activeQualityFilter === 'all') && !qualityRows ? '<div class="resource-empty">暂无质量检查记录</div>' : ''}${activeQualityFilter === 'safety' && !inspectionRows ? '<div class="resource-empty">暂无安全巡检记录</div>' : ''}</div></section>`;
}

function openQualityCheckDialog(item = null, type = 'quality') {
  editingQualityId = item?.id || null;
  const form = $('#qualityCheckForm'); form.reset();
  form.elements.checkId.value = item?.id || '';
  form.elements.type.value = item?.type || type;
  form.elements.date.value = item?.date || new Date().toISOString().slice(0,10);
  form.elements.title.value = item?.title || '';
  form.elements.location.value = item?.location || '';
  form.elements.owner.value = item?.owner || matchPersonByRole('质量员');
  form.elements.owner.dataset.autoMatched = item ? 'false' : 'true';
  form.elements.due.value = item?.due || new Date(Date.now() + 86400000).toISOString().slice(0,10);
  form.elements.status.value = item?.status || 'pending';
  form.elements.note.value = item?.note || '';
  const attachmentGroups = item ? [
    ['检查记录', item.recordAttachments || []], ['整改前', item.beforeAttachments || []], ['整改后', item.afterAttachments || []]
  ] : [];
  $('#qualityExistingAttachments').innerHTML = attachmentGroups.map(([label, files], groupIndex) => `<section data-quality-files="${groupIndex}"><strong>${label} · ${files.length}</strong>${renderStoredFileList(files, `尚无${label}附件`)}</section>`).join('');
  attachmentGroups.forEach(([, files], groupIndex) => $$('[data-stored-file-index]', $(`[data-quality-files="${groupIndex}"]`)).forEach(button => button.addEventListener('click', () => previewStoredAttachment(files[Number(button.dataset.storedFileIndex)]))));
  $('#qualityCheckDialogTitle').textContent = item ? '编辑检查与整改闭环' : '新增质量安全检查';
  const confirmButton = $('#confirmRectificationButton');
  confirmButton.hidden = !(item && item.status !== 'closed' && canAuditQualityRectification());
  if (item?.auditedBy) confirmButton.title = `上次由 ${item.auditedBy} 确认整改完成`;
  $('#qualityCheckDialog').showModal();
}

function renderInspectionMainAttachments(inspection) {
  const groups = inspection ? [
    ['巡检记录', inspection.recordAttachments || []],
    ['整改通知单', inspection.noticeAttachments || []],
    ['统一整改回复', inspection.replyAttachments || []]
  ] : [];
  $('#inspectionMainAttachments').innerHTML = groups.map(([label, files], index) => `<section data-inspection-main-files="${index}"><strong>${label} · ${files.length}</strong>${renderStoredFileList(files, `尚未上传${label}`)}</section>`).join('');
  groups.forEach(([, files], index) => $$('[data-stored-file-index]', $(`[data-inspection-main-files="${index}"]`)).forEach(button => button.addEventListener('click', () => previewStoredAttachment(files[Number(button.dataset.storedFileIndex)]))));
}

function addInspectionIssueRow(issue = {}) {
  const row = document.createElement('section');
  row.className = 'inspection-issue-editor-row';
  row.dataset.issueId = issue.id || `new-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  row.innerHTML = `<div class="inspection-issue-number"><span>整改子项</span><strong>${$('#inspectionIssueEditor').children.length + 1}</strong><button type="button" data-remove-inspection-issue aria-label="删除该问题">删除</button></div>
    <div class="form-grid"><label>问题内容<input class="inspection-issue-title" required value="${escapeHtml(issue.title || '')}" placeholder="例如：东侧临边踢脚板松动"></label><label>责任人<input class="inspection-issue-owner" list="organizationOwners" required value="${escapeHtml(issue.owner || '')}" placeholder="系统自动匹配，可手工修改"></label></div>
    <div class="form-grid"><label>问题部位<input class="inspection-issue-location" required value="${escapeHtml(issue.location || '')}"></label><label>整改状态<select class="inspection-issue-status"><option value="pending" ${issue.status === 'pending' || !issue.status ? 'selected' : ''}>待整改</option><option value="rectifying" ${issue.status === 'rectifying' ? 'selected' : ''}>整改中</option><option value="closed" ${issue.status === 'closed' ? 'selected' : ''}>已逐项闭环</option></select></label></div>
    <label>逐项整改回复<textarea class="inspection-issue-reply" rows="2" placeholder="说明整改措施、完成情况及复验结论">${escapeHtml(issue.reply || '')}</textarea></label>
    <div class="form-grid"><label>整改前照片<input class="inspection-issue-before" type="file" accept="image/*" multiple></label><label>整改后照片<input class="inspection-issue-after" type="file" accept="image/*" multiple></label></div>
    <div class="inspection-issue-existing"><section data-issue-before><strong>整改前 · ${(issue.beforeAttachments || []).length}</strong>${renderStoredFileList(issue.beforeAttachments || [], '尚无整改前照片')}</section><section data-issue-after><strong>整改后 · ${(issue.afterAttachments || []).length}</strong>${renderStoredFileList(issue.afterAttachments || [], '尚无整改后照片')}</section></div>`;
  $('#inspectionIssueEditor').append(row);
  const titleInput = $('.inspection-issue-title', row);
  const ownerInput = $('.inspection-issue-owner', row);
  ownerInput.dataset.autoMatched = issue.owner ? 'false' : 'true';
  titleInput.addEventListener('input', () => {
    const match = matchResponsible(titleInput.value);
    if (!ownerInput.value || ownerInput.dataset.autoMatched === 'true') { ownerInput.value = match.owner; ownerInput.dataset.autoMatched = 'true'; }
  });
  ownerInput.addEventListener('input', () => { ownerInput.dataset.autoMatched = 'false'; });
  $('[data-remove-inspection-issue]', row).addEventListener('click', () => { row.remove(); $$('.inspection-issue-editor-row').forEach((item,index) => $('.inspection-issue-number strong', item).textContent = index + 1); });
  $$('[data-stored-file-index]', $('[data-issue-before]', row)).forEach(button => button.addEventListener('click', () => previewStoredAttachment((issue.beforeAttachments || [])[Number(button.dataset.storedFileIndex)])));
  $$('[data-stored-file-index]', $('[data-issue-after]', row)).forEach(button => button.addEventListener('click', () => previewStoredAttachment((issue.afterAttachments || [])[Number(button.dataset.storedFileIndex)])));
}

function openInspectionBatchDialog(inspection = null) {
  editingInspectionId = inspection?.id || null;
  const form = $('#inspectionBatchForm');
  form.reset();
  form.elements.inspectionId.value = inspection?.id || '';
  form.elements.title.value = inspection?.title || '';
  form.elements.date.value = inspection?.date || new Date().toISOString().slice(0,10);
  form.elements.location.value = inspection?.location || '';
  form.elements.inspector.value = inspection?.inspector || matchPersonByRole('安全员');
  form.elements.unifiedReply.value = inspection?.unifiedReply || '';
  $('#inspectionIssueEditor').innerHTML = '';
  (inspection?.issues?.length ? inspection.issues : [{}]).forEach(addInspectionIssueRow);
  renderInspectionMainAttachments(inspection);
  $('#inspectionBatchDialogTitle').textContent = inspection ? '编辑巡检、统一回复及逐项整改' : '新增安全巡检';
  $('#inspectionBatchDialog').showModal();
}

function renderTeamBody() {
  const serverActive = Boolean(window.ZhuxuServer?.active);
  const person = getCurrentUser();
  const role = String(person?.role || '');
  const admin = serverActive ? /项目经理/.test(role) : true;
  const organizationManager = serverActive ? /(项目经理|劳资员)/.test(role) : true;
  const organizationAction = organizationManager ? `<button type="button" data-edit-organization>编辑人员</button>` : `<span class="management-permission-note">仅项目经理或劳资员可维护组织架构</span>`;
  const accountPanel = serverActive && admin ? `<section class="account-manage-panel"><div class="section-line-heading"><div><strong>账号管理</strong><small>维护登录账号与登录状态；新账号初始密码为手机号后六位，首次登录强制修改密码</small></div><button type="button" data-new-account>新增账号</button></div><div class="account-manage-list" id="accountManageList">正在加载项目账号…</div></section>` : '';
  return `<section class="management-panel"><div class="section-line-heading"><div><strong>项目管理人员</strong><small>账号职位决定任务自动匹配；姓名、职务、管理范围和电话可维护</small></div>${organizationAction}</div><div class="management-roster">${organization.length ? organization.map(person => `<article><div class="management-avatar">${escapeHtml(person.name.slice(0,1))}</div><div><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.role)}</span><p>${escapeHtml(person.scope || '待确认管理范围')}</p><a href="tel:${String(person.phone || '').replace(/\s/g,'')}">${escapeHtml(person.phone || '未登记电话')}</a></div></article>`).join('') : '<p class="resource-empty">尚未建立组织机构，请由项目经理在“账号管理”中新增人员。</p>'}</div></section>${accountPanel}`;
}

function renderLaborersBody() {
  const latest = [...attendanceRecords].sort((a,b) => b.date.localeCompare(a.date))[0] || { actual: 0, planned: 0, date: '未登记' };
  const ratio = latest.planned ? Math.round(latest.actual / latest.planned * 100) : 0;
  const serverActive = Boolean(window.ZhuxuServer?.active);
  const role = String(getCurrentUser()?.role || '');
  const manager = serverActive ? /(劳资员|项目经理)/.test(role) : true;
  const attendanceAction = manager ? `<button type="button" data-attendance>上传考勤表</button>` : '';
  const supplementAction = record => manager ? `<button type="button" class="attendance-supplement-action ${attendanceSupplementWindow(record).allowed ? '' : 'expired'}" data-supplement-attendance="${record.id}" ${attendanceSupplementWindow(record).allowed ? '' : 'disabled'}>${attendanceSupplementLabel(record)}</button>` : '';
  const onSite = laborers.filter(item => item.status !== '退场').length;
  const matchedWorkers = attendanceRecords.flatMap(record => record.workers || []).filter(worker => worker.matched).length;
  const onSiteTeams = new Set(laborers.filter(item => item.status !== '退场').map(item => item.team).filter(Boolean)).size;
  return `<section class="management-panel"><div class="section-line-heading"><div><strong>民工花名册</strong><small>劳资员维护实名制民工信息；考勤表上传后按姓名自动匹配花名册，未匹配人员请补充登记</small></div>${manager ? '<button type="button" data-new-laborer>＋ 登记民工</button>' : ''}</div><div class="laborer-summary"><article><span>在场民工</span><strong>${onSite}</strong><small>共 ${laborers.length} 人登记</small></article><article><span>今日打卡</span><strong>${latest.actual}</strong><small>计划 ${latest.planned} 人</small></article><article><span>已匹配实名制</span><strong>${matchedWorkers}</strong><small>累计考勤明细匹配人次</small></article></div>${laborers.length ? `<div class="laborer-table"><div class="laborer-row header"><span>姓名</span><span>工种</span><span>班组</span><span>电话</span><span>进场日期</span><span>状态</span><span>操作</span></div>${laborers.map(laborer => `<div class="laborer-row"><span><b>${escapeHtml(laborer.name)}</b></span><span>${escapeHtml(laborer.trade || '—')}</span><span>${escapeHtml(laborer.team || '—')}</span><span>${escapeHtml(laborer.phone || '—')}</span><span>${escapeHtml(laborer.entryDate || '—')}</span><span><em class="material-batch-status ${laborer.status === '退场' ? 'failed' : 'done'}">${escapeHtml(laborer.status || '在场')}</em></span><button type="button" class="edit-action" data-edit-laborer="${laborer.id}">编辑</button></div>`).join('')}</div>` : '<p class="resource-empty">尚未登记民工。请劳资员登记花名册，或在“组织架构”中由项目经理配置劳资员账号。</p>'}</section>
  <section class="workforce-panel"><div class="section-line-heading"><div><strong>每日考勤</strong><small>现场人数以劳资员每日上传的实名制打卡情况表为准；核对补录仅在登记后 24 小时内开放</small></div><div><button type="button" data-attendance-history>查看往期考勤</button>${attendanceAction}</div></div><div class="card-collection workforce-cards"><article class="info-card"><h3>现场人员</h3><div class="big">${latest.actual} 人</div><p>${latest.date} 打卡 · 计划投入 ${latest.planned} 人</p><div class="mini-bar"><i style="width:${Math.min(100,ratio)}%"></i></div></article><article class="info-card"><h3>在场班组</h3><div class="big">${onSiteTeams || '—'}</div><p>花名册登记的在场班组数</p><div class="mini-bar"><i style="width:60%"></i></div></article><article class="info-card"><h3>实名匹配</h3><div class="big">${matchedWorkers}</div><p>累计考勤明细与花名册匹配人次</p><div class="mini-bar"><i style="width:70%"></i></div></article></div><div class="attendance-history"><div><strong>最近考勤登记</strong><button type="button" data-attendance-history>全部 ${attendanceRecords.length} 天</button></div>${attendanceRecords.length ? attendanceRecords.slice(0,5).map(record => { const windowState = attendanceSupplementWindow(record); return `<div class="attendance-history-entry"><button type="button" data-attendance-record="${record.id}"><b>${record.date}</b><span>${record.actual} / ${record.planned} 人 · ${escapeHtml(record.officer)}</span><em>${escapeHtml(record.note || '考勤纪律正常')}</em><i>查看详情</i></button>${supplementAction(record)}</div>`; }).join('') : '<p class="resource-empty">暂无考勤记录，请劳资员上传每日实名制打卡表。</p>'}</div></section>`;
}

function openAttendanceDialog() {
  if (window.ZhuxuServer?.active && !/(劳资员|项目经理)/.test(String(getCurrentUser()?.role || ''))) { showToast('仅劳资员或项目经理可上传考勤表'); return; }
  const form = $('#attendanceForm'); form.reset();
  const latest = [...attendanceRecords].sort((a,b) => b.date.localeCompare(a.date))[0];
  form.elements.date.value = new Date().toISOString().slice(0,10);
  form.elements.actual.value = latest?.actual || 0; form.elements.planned.value = latest?.planned || 0;
  $('#attendanceDialog').showModal();
}

function openLaborerDialog(laborer = null) {
  if (window.ZhuxuServer?.active && !/(劳资员|项目经理)/.test(String(getCurrentUser()?.role || ''))) { showToast('仅劳资员或项目经理可维护民工花名册'); return; }
  const form = $('#laborerForm');
  form.reset();
  editingLaborerId = laborer?.id || null;
  form.elements.laborerId.value = laborer?.id || '';
  form.elements.name.value = laborer?.name || '';
  form.elements.trade.value = laborer?.trade || '';
  form.elements.team.value = laborer?.team || '';
  form.elements.phone.value = laborer?.phone || '';
  form.elements.entryDate.value = laborer?.entryDate || dailyDateKey;
  form.elements.status.value = laborer?.status || '在场';
  $('#laborerDialogTitle').textContent = laborer ? '编辑民工信息' : '登记民工';
  $('#laborerDialog').showModal();
}

async function previewAttendanceRecord(record) {
  if (!record) return;
  let workers = record.workers || [];
  const needsReparse = !workers.length || Number(record.attendanceParseVersion || 0) < ATTENDANCE_PARSE_VERSION;
  if (needsReparse && record.attachment?.storageKey) {
    try {
      const storedFile = await getResourceAttachment(record.attachment.storageKey);
      if (storedFile?.blob && /\.(xlsx|xls)$/i.test(record.attachment.name || '')) {
        const sourceFile = new File([storedFile.blob], record.attachment.name, { type: storedFile.type || record.attachment.type });
        workers = await extractAttendanceWorkers(sourceFile);
        workers = workers.map(worker => {
          const match = laborers.find(laborer => laborer.name === worker.name);
          return match ? { ...worker, matched: true, laborerId: match.id } : { ...worker, matched: false };
        });
        if (workers.length) {
          record.workers = workers;
          record.attendanceParseVersion = ATTENDANCE_PARSE_VERSION;
          persistAttendance();
          if ($('#attendanceHistoryDialog').open) renderAttendanceHistory(record.id);
        }
      }
    } catch (error) { /* 继续显示原附件或识别提示 */ }
  }
  if (record.attachment) await previewStoredAttachment(record.attachment);
  if (!workers.length) {
    if (!record.attachment?.storageKey && !record.attachment?.data) showToast('该记录没有可读取的原考勤表，请重新上传后识别');
    return;
  }
  $('#attachmentPreviewTitle').textContent = `${record.date} 考勤表识别内容`;
  $('#attachmentPreviewBody').innerHTML = `<section class="attendance-sheet-preview"><div><strong>已识别 ${workers.length} 人</strong><span>姓名、班组、工种和打卡时间来自上传的原考勤表</span></div><div class="attendance-sheet-table"><div class="attendance-sheet-row header"><span>姓名</span><span>班组</span><span>工种</span><span>上班打卡</span><span>下班打卡</span><span>识别状态</span></div>${workers.map(worker => `<div class="attendance-sheet-row"><strong>${escapeHtml(worker.name)}</strong><span>${escapeHtml(worker.team || '—')}</span><span>${escapeHtml(worker.trade || '—')}</span><span>${escapeHtml(worker.checkIn || '—')}</span><span>${escapeHtml(worker.checkOut || '—')}</span><em class="${worker.matched ? 'matched' : ''}">${worker.matched ? '已匹配花名册' : escapeHtml(worker.status || '待匹配')}</em></div>`).join('')}</div></section>`;
  if (!$('#attachmentPreviewDialog').open) $('#attachmentPreviewDialog').showModal();
}

function renderAttendanceHistory(selectedId = null) {
  const records = [...attendanceRecords].sort((a,b) => b.date.localeCompare(a.date));
  const selected = records.find(record => Number(record.id) === Number(selectedId)) || records[0];
  const rate = selected?.planned ? Math.round(selected.actual / selected.planned * 100) : 0;
  const selectedWindow = selected ? attendanceSupplementWindow(selected) : null;
  const supplementAudit = selected?.supplements?.length ? `<section class="supplement-audit-list"><strong>核对补录记录 · ${selected.supplements.length}</strong>${selected.supplements.map((item,index) => `<div><span>${new Date(item.createdAt).toLocaleString('zh-CN')}</span><b>${item.previousActual} → ${item.actual} 人</b><p>${escapeHtml(item.reason)} · ${escapeHtml(item.operator)}</p><button type="button" data-supplement-file="${index}">${escapeHtml(item.attachment?.name || '未上传补录依据')}</button></div>`).join('')}</section>` : '';
  $('#attendanceHistoryBody').innerHTML = selected ? `<section class="attendance-day-detail"><div><span>${selected.date}</span><strong>${selected.actual} / ${selected.planned} 人</strong><small>到岗率 ${rate}% · 登记人 ${escapeHtml(selected.officer)}</small></div><div><p>${escapeHtml(selected.note || '当日考勤纪律正常，无补充说明。')}</p><small>${selected.workers?.length ? `已从原表识别 ${selected.workers.length} 人，可直接查看明细` : '尚未识别人员明细，点击原表重新识别'}${selected.supplements?.length ? ` · 已补录 ${selected.supplements.length} 次` : ''}</small></div><div class="attendance-day-actions"><button type="button" data-attendance-file>识别并查看：${escapeHtml(selected.attachment?.name || '未上传考勤附件')}</button><button type="button" class="${selectedWindow.allowed ? 'supplement-open' : 'supplement-locked'}" data-supplement-attendance="${selected.id}" ${selectedWindow.allowed ? '' : 'disabled'}>${attendanceSupplementLabel(selected)}</button></div></section>
    ${supplementAudit}<div class="attendance-history-table"><div class="attendance-history-row header"><span>日期</span><span>实际 / 计划</span><span>到岗率</span><span>考勤纪律</span><span>补录状态</span><span>原始附件</span></div>${records.map(record => `<button type="button" class="attendance-history-row ${Number(record.id) === Number(selected.id) ? 'active' : ''}" data-attendance-history-select="${record.id}"><strong>${record.date}</strong><span>${record.actual} / ${record.planned} 人</span><span>${record.planned ? Math.round(record.actual / record.planned * 100) : 0}%</span><span>${escapeHtml(record.note || '正常')}</span><span class="supplement-state ${attendanceSupplementWindow(record).allowed ? 'open' : 'closed'}">${attendanceSupplementLabel(record)}</span><span>${escapeHtml(record.attachment?.name || '未上传')}</span></button>`).join('')}</div>` : '<div class="resource-empty">暂无考勤记录</div>';
  $('[data-attendance-file]')?.addEventListener('click', () => selected.attachment ? previewAttendanceRecord(selected) : showToast('该日尚未上传考勤附件'));
  $$('[data-attendance-history-select]', $('#attendanceHistoryBody')).forEach(button => button.addEventListener('click', () => renderAttendanceHistory(button.dataset.attendanceHistorySelect)));
  $$('[data-supplement-attendance]', $('#attendanceHistoryBody')).forEach(button => button.addEventListener('click', () => openAttendanceSupplement(button.dataset.supplementAttendance)));
  $$('[data-supplement-file]', $('#attendanceHistoryBody')).forEach(button => button.addEventListener('click', () => previewStoredAttachment(selected.supplements[Number(button.dataset.supplementFile)].attachment)));
}

function openAttendanceHistory(selectedId = null) {
  renderAttendanceHistory(selectedId);
  if (!$('#attendanceHistoryDialog').open) $('#attendanceHistoryDialog').showModal();
}

function openAttendanceSupplement(recordId) {
  if (window.ZhuxuServer?.active && !/(劳资员|项目经理)/.test(String(getCurrentUser()?.role || ''))) { showToast('仅劳资员或项目经理可核对补录考勤'); return; }
  const record = attendanceRecords.find(item => Number(item.id) === Number(recordId));
  if (!record) return;
  const windowState = attendanceSupplementWindow(record);
  if (!windowState.allowed) { showToast(`该日考勤补录已于 ${windowState.deadline.toLocaleString('zh-CN')} 截止`); return; }
  const form = $('#attendanceSupplementForm');
  form.reset();
  form.elements.recordId.value = record.id;
  form.elements.date.value = record.date;
  form.elements.operator.value = resolveOrganizationOwner('劳资员');
  form.elements.actual.value = record.actual;
  form.elements.planned.value = record.planned;
  $('#supplementDeadline').innerHTML = `<span>24 小时核对期</span><strong>${attendanceSupplementLabel(record)}</strong><small>截止 ${windowState.deadline.toLocaleString('zh-CN')}，到期后系统自动锁定且不得补录</small>`;
  $('#attendanceSupplementDialog').showModal();
}

const intakeSourceLabels = { file: '文件 / 表格', photo: '现场照片', voice: '语音记录', manual: '手工记录' };
const intakeTargetLabels = { task: '任务协同', plan: '进度计划', material: '材料需求', document: '资料催办', quality: '质量问题', record: '现场记录' };
const intakeStatusLabels = { review: '待校核', distributed: '已分发', archived: '已归档' };

function currentOperatorLabel() {
  const person = organization.find(item => String(item.id) === String(currentUserId)) || organization[0];
  return person ? `${person.name} · ${person.role}` : '项目管理人员';
}

function canAuditQualityRectification() {
  const user = getCurrentUser();
  return Boolean(user && /质量员|项目经理/.test(String(user.role || '')));
}

function formatIntakeTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value || '未记录') : date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderCollectionRegister() {
  const counts = {
    review: intakeRecords.filter(item => item.status === 'review').length,
    distributed: intakeRecords.filter(item => item.status === 'distributed').length,
    archived: intakeRecords.filter(item => item.status === 'archived').length
  };
  const visible = intakeRecords
    .filter(item => activeIntakeFilter === 'all' || item.status === activeIntakeFilter)
    .sort((a, b) => String(b.collectedAt).localeCompare(String(a.collectedAt)));
  const sourceCount = new Set(intakeRecords.map(item => item.source)).size;
  return `<section class="intake-overview">
      <div class="intake-pipeline" aria-label="信息采集处理流程">
        <div class="intake-pipeline-heading"><div><span>INFORMATION FLOW</span><strong>现场信息处理轨道</strong></div><p>原始信息不直接进入台账，先识别、再校核、后分发</p></div>
        <div class="intake-pipeline-rail">
          <article class="done"><i>01</i><div><strong>采集</strong><span>${intakeRecords.length} 条来源记录</span></div></article>
          <article class="active"><i>02</i><div><strong>识别与校核</strong><span>${counts.review} 条待人工确认</span></div></article>
          <article><i>03</i><div><strong>业务分发</strong><span>${counts.distributed} 条已写入台账</span></div></article>
          <article><i>04</i><div><strong>归档追溯</strong><span>${counts.archived} 条已归档</span></div></article>
        </div>
      </div>
      <div class="intake-kpis">
        <article><span>多源入口</span><strong>${sourceCount}<small> 类</small></strong><p>文件、照片、语音和手工记录</p></article>
        <article class="attention"><span>待人工校核</span><strong>${counts.review}<small> 条</small></strong><p>未经确认不会写入业务台账</p></article>
        <article><span>已完成分发</span><strong>${counts.distributed}<small> 条</small></strong><p>保留来源与目标记录编号</p></article>
      </div>
    </section>
    <section class="intake-register">
      <div class="intake-register-heading"><div><strong>采集登记簿</strong><small>点击记录查看原始附件、修改识别结果并执行分发</small></div><div class="intake-filters">${[['all','全部'],['review','待校核'],['distributed','已分发'],['archived','已归档']].map(([key,label]) => `<button type="button" class="${activeIntakeFilter === key ? 'active' : ''}" data-intake-filter="${key}">${label}<b>${key === 'all' ? intakeRecords.length : counts[key]}</b></button>`).join('')}</div></div>
      <div class="intake-list">
        <div class="intake-row header"><span>来源 / 采集主题</span><span>区域与采集人</span><span>采集时间</span><span>拟分发业务</span><span>处理状态</span><span>操作</span></div>
        ${visible.map(item => `<button type="button" class="intake-row" data-review-intake="${item.id}"><span class="intake-title-cell"><i class="source-${item.source}">${item.source === 'photo' ? '图' : item.source === 'voice' ? '音' : item.source === 'manual' ? '录' : '文'}</i><span><strong>${escapeHtml(item.title)}</strong><small>${intakeSourceLabels[item.source] || '其他来源'} · ${(item.attachments || []).length} 个原始附件 · ${(item.candidates || []).length} 条候选项</small></span></span><span>${escapeHtml(item.zone)}<small>${escapeHtml(item.collector)}</small></span><span>${formatIntakeTime(item.collectedAt)}</span><span>${intakeTargetLabels[item.target] || '待判断'}</span><span><em class="intake-status ${item.status}">${intakeStatusLabels[item.status] || item.status}</em>${item.businessRefs?.length ? `<small>${item.businessRefs.length} 条业务记录</small>` : ''}</span><b>${item.status === 'review' ? '校核 / 分发' : '查看追溯'}</b></button>`).join('') || '<div class="resource-empty">当前筛选条件下没有采集记录</div>'}
      </div>
    </section>`;
}

function getDailyExecutionRecord(taskId, date = activeExecutionDate, dayPlan = null) {
  let record = dailyExecution.find(item => Number(item.taskId) === Number(taskId) && item.date === date);
  if (!record && dayPlan) record = dailyExecution.find(item => Number(item.dayPlanId) === Number(dayPlan.id) && item.date === date);
  if (record && dayPlan?.team && record.team !== dayPlan.team) record.team = dayPlan.team;
  if (!record) {
    const task = tasks.find(item => Number(item.id) === Number(taskId));
    const plannedTeam = dayPlan?.team || task?.team || task?.owner || '待安排班组';
    const isPast = date < dailyDateKey;
    record = isPast
      ? { taskId: Number(taskId), dayPlanId: dayPlan?.id || null, weekPlanId: dayPlan?.parentId || null, date, team: plannedTeam, plannedWorkers: 0, actualWorkers: 0, progress: 100, actualQuantity: '按计划完成（待确认）', materialPercent: 100, materialText: '默认按计划完成，待确认', documentDone: 0, documentTotal: 1, documentText: '待确认', note: '系统默认按计划完成，请责任人确认或修改', confirmed: false, autoGenerated: true }
      : { taskId: Number(taskId), dayPlanId: dayPlan?.id || null, weekPlanId: dayPlan?.parentId || null, date, team: plannedTeam, plannedWorkers: 0, actualWorkers: 0, progress: date === dailyDateKey && task?.status === 'done' ? 100 : date === dailyDateKey && task?.status === 'doing' ? 50 : 0, actualQuantity: '待反馈', materialPercent: 0, materialText: '待核对材料计划和到场情况', documentDone: 0, documentTotal: 1, documentText: '待核对资料条件', note: '尚未提交施工反馈' };
    dailyExecution.push(record);
  }
  return record;
}

function getDailyTaskContexts(date = activeExecutionDate) {
  const contexts = [];
  plans.filter(plan => plan.level === 'day' && !plan.archived && plan.start <= date && plan.end >= date).sort((a, b) => Number(a.id) - Number(b.id)).forEach(dayPlan => {
    const taskList = getDayPlanTaskList(dayPlan);
    if (taskList.length) {
      taskList.forEach(task => contexts.push({ task, dayPlan, record: getDailyExecutionRecord(task.id, date, dayPlan) }));
    } else {
      const virtual = { id: dayPlan.taskId || dayPlan.id, title: dayPlan.title, zone: '计划指定区域', owner: planOwners(dayPlan)[0] || resolveOrganizationOwner(dayPlan.ownerRole), time: '17:00', status: 'todo', priority: 'normal', virtual: true };
      contexts.push({ task: virtual, dayPlan, record: getDailyExecutionRecord(virtual.id, date, dayPlan) });
    }
  });
  return contexts;
}


function dailyReadinessMeta(percent) {
  return percent >= 100 ? { label: '满足', className: 'ready' } : percent >= 70 ? { label: '部分满足', className: 'warning' } : { label: '不满足', className: 'blocked' };
}

function documentConditionMeta(record) {
  const complete = Number(record.documentDone || 0) >= Number(record.documentTotal || 1);
  if (complete) return { label: '已满足', className: 'ready', hint: '资料条件已经闭环' };
  const critical = /(复试|检测报告|不合格|门禁|未解除|未放行)/.test(String(record.documentText || ''));
  return critical
    ? { label: '风险项', className: 'blocked', hint: '影响工序放行，须优先闭环' }
    : { label: '待完善', className: 'warning', hint: '属于待完成项，请按计划补充' };
}

function renderDailyTaskRow(context, index) {
  const { task, dayPlan, record } = context;
  const notice = record.technicalNotice;
  const requiredAcknowledgements = notice?.requiredRoles?.length || 0;
  const acknowledged = notice?.acknowledgedBy?.length || 0;
  const weekPlan = plans.find(plan => Number(plan.id) === Number(dayPlan.parentId));
  const editable = !task.virtual;
  const isToday = record.date === dailyDateKey;
  const workerGap = Math.max(0, Number(record.plannedWorkers || 0) - Number(record.actualWorkers || 0));
  const lagDays = record.date < dailyDateKey ? Math.round((new Date(`${dailyDateKey}T12:00:00`) - new Date(`${record.date}T12:00:00`)) / 86400000) : 0;
  const showLag = lagDays > 0 && record.autoGenerated !== true;
  const needsConfirm = !ZhuxuMeetingRules.locked(record);
  const plannedPercent = Number(record.plannedTarget ?? dayPlan.dailyTarget ?? 100);
  return `<article class="daily-task-row ${task.priority === 'risk' ? 'risk' : ''} ${showLag ? 'lagging' : ''}" data-daily-task="${task.id}" data-day-plan="${dayPlan.id}" data-record-date="${record.date}">
    <div class="daily-task-identity"><span class="daily-sequence">${String(index + 1).padStart(2,'0')}</span><div><strong>${escapeHtml(task.title)} · 计划完成${plannedPercent}%</strong>${showLag ? `<em class="lag-badge">滞后 ${lagDays} 天</em>` : ''}${needsConfirm ? '<em class="confirm-badge">待确认</em>' : ''}<small>日计划 #${dayPlan.id} · ${escapeHtml(weekPlan?.title || '待关联周计划')}</small><small>${escapeHtml(task.zone)} · ${escapeHtml(task.owner)} → ${escapeHtml(record.team)}</small><div class="daily-task-progress"><i style="width:${ZhuxuMeetingRules.progress(record)}%"></i></div><em class="daily-plan-percent">${ZhuxuMeetingRules.locked(record) ? `实际完成率 ${record.actualCompletion}%（占当日计划） · 折合目标 ${record.achievedTarget}% · 已确认锁定` : '实际完成率待例会确认'}</em></div></div>
    <button type="button" class="daily-worker-cell daily-worker-open" data-workers="${task.id}"><span>班组人员</span><strong>${record.actualWorkers}<small> / ${record.plannedWorkers} 人</small></strong><em class="${workerGap ? 'warning' : 'ready'}">${workerGap ? `缺 ${workerGap} 人` : '点击查看打卡明细'}</em></button>
    <button type="button" class="daily-condition ${notice ? 'notice' : 'ready'}" data-technical-task="${task.id}">${notice ? '<i class="daily-risk-flag" aria-label="存在技术风险">!</i>' : ''}<span>技术交底</span><strong>${notice ? `⚠ ${escapeHtml(notice.type)} · 风险提示` : '常规施工'}</strong><small>${notice ? `${acknowledged}/${requiredAcknowledgements} 人确认 · 已上传文件，点击查看` : '点击查看交底要求'}</small></button>
    <button type="button" class="daily-feedback-action" data-daily-feedback="${task.id}" data-feedback-date="${record.date}" ${editable ? '' : 'disabled'}>${editable ? '施工记录（完成率由例会确认）' : '历史记录'}</button>
  </article>`;
}

function getDailyCompletionSummary(date) {
  const contexts = getDailyTaskContexts(date);
  const records = contexts.map(item => item.record);
  const completed = records.filter(item => ZhuxuMeetingRules.progress(item) >= 100).length;
  const rate = records.length ? Math.round(records.reduce((sum, item) => sum + ZhuxuMeetingRules.progress(item), 0) / records.length) : 0;
  return { total: contexts.length, completed, rate };
}

function getCarryoverContexts(date) {
  const contexts = [];
  plans.filter(plan => plan.level === 'day' && !plan.archived && plan.start <= date && plan.end >= date).sort((a, b) => Number(a.id) - Number(b.id)).forEach(dayPlan => {
    getDayPlanTaskList(dayPlan).forEach(task => {
      const record = dailyExecution.find(item => Number(item.taskId) === Number(task.id) && item.date === date)
        || dailyExecution.find(item => Number(item.dayPlanId) === Number(dayPlan.id) && item.date === date);
      if (record) contexts.push({ task, dayPlan, record });
    });
  });
  return contexts;
}

function renderIntakeBody() {
  const taskContexts = getDailyTaskContexts(activeExecutionDate);
  const yesterday = shiftDateKey(activeExecutionDate, -1);
  const carryovers = getCarryoverContexts(yesterday).filter(item => ZhuxuMeetingRules.progress(item.record) < 100 && Number(item.task.id) !== 4);
  const allContexts = activeExecutionDate === dailyDateKey ? [...carryovers, ...taskContexts] : taskContexts;
  const totalCount = allContexts.length;
  const doneCount = allContexts.filter(item => ZhuxuMeetingRules.progress(item.record) >= 100).length;
  const rate = totalCount ? Math.round(allContexts.reduce((sum,item) => sum + ZhuxuMeetingRules.progress(item.record), 0) / totalCount) : 0;
  const weekStart = shiftDateKey(activeExecutionDate, -((new Date(`${activeExecutionDate}T12:00:00`).getDay() + 6) % 7));
  const weekDates = Array.from({ length: 7 }, (_, index) => shiftDateKey(weekStart, index));
  const weekDayLabels = ['周一','周二','周三','周四','周五','周六','周日'];
  const materialRisks = resourcePlans.map(plan => { try { return { plan, progress: getResourcePlanProgress(plan) }; } catch { return { plan, progress: { complete: false, days: 0, arrived: 0, planned: { unit: '' } } }; } }).filter(item => !item.progress.complete).slice(0, 5);
  const materialCoordination = materialRisks.map(({ plan, progress }) => {
    const reminder = followups.find(item => Number(item.workflowPlanId) === Number(plan.id) && item.workflowKind === 'arrival' && item.status !== 'done');
    return { material: true, id: `mat-${plan.id}`, planId: plan.id, category: '材料保障', content: `${plan.name}：已到 ${formatResourceQuantity(progress.arrived, progress.planned.unit)} / ${plan.quantity}，要求 ${plan.due} 到场`, owner: reminder?.owner || plan.owner || resolveOrganizationOwner(plan.ownerRole || '材料员'), due: plan.due, reminders: Number(reminder?.reminders || 0) };
  });
  const followupCoordination = followups.filter(item => item.status !== 'done' && item.workflowKind !== 'arrival').map(item => ({ ...item, followup: true, content: item.title }));
  const coordinationItems = dailyCoordination
    .filter(item => item.source === 'daily-meeting' && String(item.due || '').startsWith(activeExecutionDate) && !['材料问题', '资料问题'].includes(item.category))
    .sort((a,b) => (a.status === 'resolved') - (b.status === 'resolved'));
  const documentRisks = Object.entries(documentState).flatMap(([key,group]) => (group.documents || []).filter(item => item.status !== 'done').map(item => {
    const entry = resourceEntries.find(entry => Number(entry.id) === Number(group.materialEntryId));
    return { ...item, group: documentChainConfigs[key]?.label || key, location: group.linkedProcess || entry?.location || '' };
  })).slice(0, 6);
  const openQuality = qualityChecks.filter(item => item.type === 'quality' && item.status !== 'closed').length;
  const openSafety = safetyInspections.reduce((sum,item) => sum + (item.issues || []).filter(issue => issue.status !== 'closed').length, 0);
  const currentLabel = activeExecutionDate === dailyDateKey ? '今日' : activeExecutionDate;
  const dayLabel = formatDayLabel(activeExecutionDate);
  const planHeading = activeExecutionDate === dailyDateKey ? `今日计划 · ${dayLabel}` : `${dayLabel}计划`;
  return `<section class="daily-query-bar"><div><span>执行日期</span><button type="button" data-daily-date-step="-1" aria-label="前一天">←</button><input type="date" id="dailyExecutionDate" value="${activeExecutionDate}"><button type="button" data-daily-date-step="1" aria-label="后一天">→</button><button type="button" data-daily-today ${activeExecutionDate === dailyDateKey ? 'disabled' : ''}>回到今天</button></div><p>任务来源：日进度计划 · 实际完成率来自例会锁定记录 · 人员投入只读取实名制打卡记录</p></section>${renderLinkedProgress(activeExecutionDate)}
    <section class="today-plan-register"><div class="daily-section-heading"><div><strong>${planHeading}</strong><small>计划名称、责任人和责任班组来自当日日进度计划，点击任务可反馈执行情况</small></div><span>${taskContexts.length} 项计划</span></div><div>${taskContexts.map((item,index) => { const plannedTeam = item.dayPlan.team || item.record.team || '待安排'; const plannedPercent = Number(item.dayPlan.dailyTarget ?? 100); return `<article><i>${String(index + 1).padStart(2,'0')}</i><div><strong>${escapeHtml(item.dayPlan.title)}完成${plannedPercent}%</strong><small>${escapeHtml(item.task.zone)} · 所属：${escapeHtml(plans.find(plan => Number(plan.id) === Number(item.dayPlan.parentId))?.title || '待关联周计划')}</small></div><div class="today-plan-responsibility"><span>责任人</span><b>${escapeHtml(item.task.owner)}</b></div><div class="today-plan-responsibility"><span>责任班组</span><b>${escapeHtml(plannedTeam)}</b></div></article>`; }).join('') || '<div class="resource-empty">该日期尚未编制日进度计划。</div>'}</div></section>
    <section class="daily-command-board weekly-command-board">
      <div class="daily-command-copy"><span>WEEKLY CONTROL · ${weekStart}—${shiftDateKey(weekStart,6)}</span><h2>本周执行与人员投入</h2><p>每日执行率用于查看任务完成情况，不等于周/月工程进度；工程进度以上方关联目标统计为准。</p></div>
      <div class="weekly-progress-compare"><div><span>周进度口径</span><strong>按上方月 / 周目标的工程量、节点或明确权重分别核对；未关联的工作不自动汇总。</strong></div></div>
      <section class="weekly-daily-ledger"><div class="weekly-ledger-heading"><strong>每日完成情况</strong><span>本周日计划执行百分比</span></div><div>${weekDates.map((date,index) => { const summary = getDailyCompletionSummary(date); const state = !summary.total ? 'empty' : summary.rate >= 100 ? 'done' : date < dailyDateKey ? 'lag' : 'active'; return `<article class="${state} ${date === activeExecutionDate ? 'selected' : ''}"><span>${weekDayLabels[index]} · ${date.slice(5)}</span><strong>${summary.total ? `${summary.rate}%` : '无计划'}</strong><small>${summary.total ? `${summary.completed}/${summary.total} 项完成` : '未编制日计划'}</small><i><em style="width:${summary.rate}%"></em></i></article>`; }).join('')}</div></section>
      <section class="weekly-workforce-ledger"><div class="weekly-ledger-heading"><strong>本周每日投入人员</strong><span>与实名制打卡人数保持一致</span></div><div>${weekDates.map((date,index) => { const attendance = attendanceRecords.find(item => item.date === date); return `<article class="${attendance ? '' : 'empty'}"><span>${weekDayLabels[index]} · ${date.slice(5)}</span><strong>${attendance ? `${attendance.actual} 人` : '未上传'}</strong><small>${attendance ? `计划 ${attendance.planned} 人 · ${escapeHtml(attendance.officer)}` : '等待劳资员上传打卡表'}</small></article>`; }).join('')}</div></section>
    </section>
    <div class="daily-layout">
      <div class="daily-main-stack">
        <section class="daily-task-board"><div class="daily-section-heading"><div><strong>${currentLabel}计划跟踪</strong><small>昨日未完成已并入本清单并标注滞后天数；实际完成情况以例会锁定结果为准，材料保障见右侧需协调事项、资料风险见下方资料风险项</small></div><span>${doneCount} / ${totalCount} 完成 · ${rate}%</span></div><div class="daily-task-columns daily-task-columns-4"><span>日计划任务与进度</span><span>班组人员</span><span>技术交底</span><span>操作</span></div>${allContexts.map(renderDailyTaskRow).join('') || '<div class="resource-empty">该日期尚未编制日进度计划，请从侧栏“每日例会”编制次日计划。</div>'}</section>
      </div>
      <aside class="tomorrow-coordination"><div class="daily-section-heading"><div><strong>需协调事项跟踪</strong><small>只同步每日例会登记的现场、人员、技术、设备和工作面问题；材料、资料风险项分别在下方卡片跟踪</small></div><button type="button" data-new-coordination>＋ 提问题</button></div><div class="coordination-list">${coordinationItems.map(item => { const task = tasks.find(task => Number(task.id) === Number(item.taskId)); const status = item.status || 'pending'; const statusLabel = status === 'resolved' ? '已完成' : status === 'following' ? '正在跟进' : '待跟进'; return `<article class="${status}"><div><em>${escapeHtml(item.category)}</em><span class="coordination-status ${status}">${statusLabel}</span></div><strong>${escapeHtml(item.content)}</strong><small>关联：${escapeHtml(task?.title || '施工任务')}</small><div class="coordination-people"><span>提出：${escapeHtml(item.requester)}</span>${item.foreman ? `<span>责任工长：${escapeHtml(item.foreman)}</span>` : ''}<b>责任：${escapeHtml(item.owner)}</b></div><p>最晚 ${formatIntakeTime(item.due)}${item.feedback ? ` · ${escapeHtml(item.feedback)}` : ''}</p>${status === 'resolved' ? '<button type="button" disabled>✓ 已完成</button>' : status === 'following' ? `<button type="button" data-resolve-coordination="${item.id}">标记完成</button>` : `<button type="button" data-follow-coordination="${item.id}">开始跟进</button>`}</article>`; }).join('') || '<div class="resource-empty">当前没有需协调事项</div>'}</div></aside>
    </div>
    <section class="daily-support-grid">
      <article class="daily-support-card material"><div class="daily-support-heading"><div><span>材料风险项</span><strong>仅显示未到齐、审批未完成或临近使用的材料设备</strong></div><button type="button" data-jump-materials>进入材料设备 →</button></div><div class="daily-support-stats"><span><b>${materialRisks.length}</b> 项风险</span><span>已完成项目不在此处显示</span></div><div class="daily-material-list">${materialRisks.map(({plan,progress}) => `<div><strong>${escapeHtml(plan.name)}</strong><span>${escapeHtml(plan.location)} · 要求 ${plan.due}</span><em class="${progress.days <= 2 ? 'blocked' : 'warning'}">${escapeHtml(formatResourceQuantity(progress.arrived, progress.planned.unit))} / ${escapeHtml(plan.quantity)}</em></div>`).join('') || '<div class="resource-empty">暂无材料风险项</div>'}</div></article>
      <article class="daily-support-card documents"><div class="daily-support-heading"><div><span>资料风险项</span><strong>仅显示尚未闭环且可能影响工序的资料，并标注具体部位</strong></div><button type="button" data-jump-documents>进入资料闭环 →</button></div><ul class="daily-document-risk-list">${documentRisks.map(item => `<li><i class="${/(复试|报告|隐蔽)/.test(item.name) ? 'blocked' : 'warning'}"></i><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.group)} · ${escapeHtml(item.owner)}${item.location ? ` · ${escapeHtml(item.location)}` : ''}</small></span><b>${item.status === 'testing' ? '检测中' : '待完善'}</b></li>`).join('') || '<li class="resource-empty">暂无资料风险项</li>'}</ul></article>
      <article class="daily-support-card issues"><div class="daily-support-heading"><div><span>过程问题</span><strong>质量、安全问题跟着任务走</strong></div><button type="button" data-jump-quality>查看问题闭环 →</button></div><div class="daily-issue-totals"><div><strong>${openQuality}</strong><span>质量问题待整改</span></div><div><strong>${openSafety}</strong><span>安全问题待闭环</span></div></div><p>问题记录关联施工任务、责任班组、整改前后照片和复验结论。</p></article>
    </section>`;
}

function remindMaterialPlan(planId) {
  const plan = resourcePlans.find(item => Number(item.id) === Number(planId));
  if (!plan) { showToast('没有找到对应的材料计划'); return; }
  const existing = followups.find(item => Number(item.workflowPlanId) === Number(plan.id) && item.workflowKind === 'arrival' && item.status !== 'done');
  const owner = plan.owner || resolveOrganizationOwner(plan.ownerRole || '材料员');
  const reminder = {
    category: '材料催办', title: `跟进${plan.name}到场`, requester: currentOperatorLabel(), owner, recipient: owner, notificationStatus: 'unread', zone: plan.location,
    due: `${plan.due}T18:00`, urgency: plan.due <= dailyDateKey ? 'urgent' : 'normal', relatedTask: `材料到场计划 · ${plan.name}`,
    note: `计划数量 ${plan.quantity}，要求用于 ${plan.location}。`, status: 'pending', reminders: Number(existing?.reminders || 0) + 1,
    workflowPlanId: Number(plan.id), workflowKind: 'arrival', lastRemindedAt: new Date().toISOString()
  };
  if (existing) followups = followups.map(item => item.id === existing.id ? { ...item, ...reminder } : item);
  else followups.unshift({ id: Date.now(), ...reminder, createdAt: new Date().toISOString() });
  persistFollowups();
  renderSubview('intake');
  showToast(`已向${reminder.owner}发送站内催办通知，原材料计划和附件均已保留`);
}

function openCarryoverDetail(taskId, date) {
  const task = tasks.find(item => Number(item.id) === Number(taskId));
  const yesterdayRecord = dailyExecution.find(item => Number(item.taskId) === Number(taskId) && item.date === date);
  if (!task || !yesterdayRecord) { showToast('没有找到该项昨日执行记录'); return; }
  const todayContext = getDailyTaskContexts(dailyDateKey).find(item => Number(item.task.id) === Number(taskId));
  const todayRecord = todayContext?.record;
  const documents = documentConditionMeta(yesterdayRecord);
  $('#carryoverDetailDate').textContent = `${date} · 昨日未完成计划`;
  $('#carryoverDetailTitle').textContent = task.title;
  $('#carryoverDetailBody').innerHTML = `<section class="carryover-detail-summary"><div><span>昨日完成百分比</span><strong>${yesterdayRecord.progress}%</strong><i><em style="width:${Math.min(100,Number(yesterdayRecord.progress || 0))}%"></em></i></div><div><span>今日续做情况</span><strong>${todayRecord ? `${todayRecord.progress}%` : '未列入今日计划'}</strong><small>${todayRecord ? escapeHtml(todayRecord.actualQuantity || '待反馈') : '需要先纳入今日计划后再反馈'}</small></div></section><section class="carryover-detail-grid"><div><span>责任人与班组</span><strong>${escapeHtml(task.owner)} · ${escapeHtml(yesterdayRecord.team)}</strong></div><div><span>昨日完成量</span><strong>${escapeHtml(yesterdayRecord.actualQuantity || '未填写')}</strong></div><div><span>剩余工作</span><strong>${escapeHtml(yesterdayRecord.note || '未填写未完成原因')}</strong></div><div class="${documents.className}"><span>资料条件</span><strong>${escapeHtml(documents.label)} · ${escapeHtml(yesterdayRecord.documentText || '未核对')}</strong></div></section>`;
  const continueButton = $('#continueCarryoverButton');
  continueButton.disabled = !todayContext;
  continueButton.textContent = todayContext ? '记录今日续做' : '尚未列入今日计划';
  continueButton.onclick = () => { if (!todayContext) return; $('#carryoverDetailDialog').close(); openDailyFeedbackDialog(taskId, dailyDateKey); };
  const editYesterdayButton = $('#editYesterdayButton');
  editYesterdayButton.onclick = () => { $('#carryoverDetailDialog').close(); openDailyFeedbackDialog(taskId, date); };
  $('#carryoverDetailDialog').showModal();
}

function openDailyFeedbackDialog(taskId = null, dateKey = activeExecutionDate) {
  const dailyTasks = getDailyTaskContexts(dateKey).map(item => item.task).filter(item => !item.virtual);
  const selectedTask = dailyTasks.find(item => Number(item.id) === Number(taskId)) || dailyTasks.find(item => item.status !== 'done') || dailyTasks[0];
  if (!selectedTask) { showToast(dateKey === dailyDateKey ? '今天还没有日进度计划任务，请先编制日计划' : `${formatDayLabel(dateKey)} 没有日进度计划任务`); return; }
  const select = $('#dailyFeedbackTaskSelect');
  select.innerHTML = dailyTasks.map(item => `<option value="${item.id}">${escapeHtml(item.title)}</option>`).join('');
  select.value = String(selectedTask.id);
  $('#dailyFeedbackForm').elements.date.value = dateKey;
  const isToday = dateKey === dailyDateKey;
  $('#dailyFeedbackDialog .dialog-heading span').textContent = isToday ? '日计划执行反馈' : `编辑 ${formatDayLabel(dateKey)} 完成情况`;
  $('#dailyFeedbackDialog .dialog-heading h2').textContent = isToday ? '更新任务、人员和资源状态' : '补录或修正历史完成情况';
  loadDailyFeedbackTask(selectedTask.id, dateKey);
  $('#dailyFeedbackDialog').showModal();
}

function loadDailyFeedbackTask(taskId, dateKey = dailyDateKey) {
  const task = tasks.find(item => Number(item.id) === Number(taskId));
  if (!task) return;
  const dayPlan = plans.find(plan => plan.level === 'day' && !plan.archived && Number(plan.taskId) === Number(task.id) && plan.start === dateKey);
  const record = getDailyExecutionRecord(task.id, dateKey, dayPlan);
  const form = $('#dailyFeedbackForm');
  form.elements.taskId.value = task.id; form.elements.taskSelect.value = String(task.id);
  form.elements.owner.value = task.owner || ''; form.elements.team.value = record.team || ''; form.elements.status.value = task.status === 'done' ? 'done' : Number(record.progress) ? 'doing' : 'todo';
  form.elements.plannedWorkers.value = record.plannedWorkers || 0; form.elements.actualWorkers.value = record.actualWorkers || 0; form.elements.progress.value = ZhuxuMeetingRules.locked(record) ? record.actualCompletion : ''; form.elements.progress.placeholder = '待例会确认'; form.elements.actualQuantity.value = record.actualQuantity || '';
  form.elements.progress.disabled = true;
  form.elements.status.disabled = true;
  form.elements.progress.title = '实际完成率仅在每日例会确认，确认后不可修改';
  form.elements.materialPercent.value = record.materialPercent || 0; form.elements.materialText.value = record.materialText || ''; form.elements.documentDone.value = record.documentDone || 0; form.elements.documentTotal.value = record.documentTotal || 1; form.elements.documentText.value = record.documentText || ''; form.elements.note.value = record.note || '';
  updateDailyDocumentCondition();
}

function updateDailyDocumentCondition() {
  const form = $('#dailyFeedbackForm');
  const record = { documentDone: Number(form.elements.documentDone.value || 0), documentTotal: Number(form.elements.documentTotal.value || 1), documentText: form.elements.documentText.value || '' };
  const meta = documentConditionMeta(record);
  const field = $('#dailyDocumentGateField');
  field.classList.remove('ready','warning','blocked');
  field.classList.add(meta.className);
  $('#dailyDocumentConditionState').textContent = `${meta.label} · ${meta.hint}`;
}

function openCoordinationDialog(taskId = null) {
  const form = $('#coordinationForm'); form.reset();
  const dailyTasks = getDailyTaskContexts(dailyDateKey).map(item => item.task).filter(item => !item.virtual);
  $('#coordinationTaskSelect').innerHTML = dailyTasks.map(item => `<option value="${item.id}">${escapeHtml(item.title)}</option>`).join('');
  if (taskId) form.elements.taskId.value = String(taskId);
  const task = tasks.find(item => Number(item.id) === Number(form.elements.taskId.value)) || tasks[0];
  const taskContext = getDailyTaskContexts(dailyDateKey).find(item => Number(item.task.id) === Number(task?.id));
  form.elements.requester.innerHTML = responsibilityTeamOptions(taskContext?.dayPlan?.team || getDailyExecutionRecord(task.id, dailyDateKey, taskContext?.dayPlan).team || '');
  form.elements.requester.value = taskContext?.dayPlan?.team || getDailyExecutionRecord(task.id, dailyDateKey, taskContext?.dayPlan).team || '';
  form.elements.foreman.innerHTML = organizationSelectOptions(matchPersonByRole('施工员'), '请选择责任工长');
  form.elements.owner.innerHTML = organizationSelectOptions(matchPersonByRole('生产经理'), '请选择协调责任人');
  form.elements.owner.value = matchPersonByRole('生产经理'); form.elements.due.value = defaultDueValue();
  $('#coordinationDialog').showModal();
}

function meetingDateTimeValue(date) {
  return `${date}T17:00`;
}

function renderDailyMeetingDialog() {
  const body = $('#dailyMeetingBody');
  if (!body) return;
  const meetingDate = dailyMeetingDate || dailyDateKey;
  const tomorrow = shiftDateKey(meetingDate, 1);
  const contexts = getDailyTaskContexts(meetingDate);
  const summary = getDailyCompletionSummary(meetingDate);
  const pending = contexts.filter(item => ZhuxuMeetingRules.progress(item.record) < 100);
  const todayCoordination = dailyCoordination.filter(item => item.status !== 'resolved' && String(item.due || '').startsWith(meetingDate));
  const todayCoordinationMarkup = `<section class="daily-meeting-section"><div class="daily-meeting-section-heading"><div><strong>今日协调问题闭环</strong><small>在例会中逐项确认处理结果；未完成问题可在下方继续安排到明日。</small></div><span>${todayCoordination.length} 项待处理</span></div><div class="daily-meeting-coordination-list">${todayCoordination.map(item => `<article class="daily-meeting-coordination-review"><div><strong>${escapeHtml(item.category || '现场协调问题')}</strong><small>${escapeHtml(item.requester || '未注明班组')} · 责任人：${escapeHtml(item.owner || '待指定')} · 最晚 ${escapeHtml(item.due || '未定')}</small></div><p>${escapeHtml(item.content || '')}</p><button type="button" data-resolve-meeting-coordination="${item.id}">标记已解决</button></article>`).join('') || '<div class="daily-meeting-empty">今日没有待闭环协调问题。</div>'}</div></section>`;
  const ownerOptions = selected => organizationSelectOptions(selected, '请选择责任人');
  const teamOptions = selected => responsibilityTeamOptions(selected);
  const taskOptions = selected => {
    const options = getDailyTaskContexts(tomorrow).map(item => item.task).filter(task => !task.virtual);
    return `<option value="">请选择关联任务</option>${options.map(task => `<option value="${task.id}" ${Number(task.id) === Number(selected) ? 'selected' : ''}>${escapeHtml(task.title)}</option>`).join('')}`;
  };
  body.innerHTML = `<section class="daily-meeting-summary"><div><span>例会日期</span><strong>${escapeHtml(formatDayLabel(meetingDate))}</strong><small>确认今日完成，编制 ${escapeHtml(formatDayLabel(tomorrow))} 计划</small></div><div><span>今日计划</span><strong>${summary.total}</strong><small>${summary.completed} 项完成</small></div><div><span>完成率</span><strong>${summary.rate}%</strong><small>${pending.length ? `${pending.length} 项需续做` : '今日计划已完成'}</small></div><div><span>未闭环协调</span><strong>${dailyCoordination.filter(item => item.status !== 'resolved' && String(item.due || '').startsWith(meetingDate)).length}</strong><small>例会逐项确认责任人</small></div></section><section class="daily-meeting-section"><div class="daily-meeting-section-heading"><div><strong>今日计划完成情况</strong><small>100% 表示当天计划全部完成；确认后同步今日跟踪并永久锁定，请核实后再确认。</small></div><span>${escapeHtml(meetingDate)}</span></div><div class="daily-meeting-task-list">${contexts.map((item,index) => { const draft = dailyMeetingTodayDraft[index] || { progress: Number(item.record.progress || 0) }; return `<article class="daily-meeting-task ${Number(draft.progress || 0) >= 100 ? 'done' : ''}" data-meeting-today-row="${index}"><i>${String(index + 1).padStart(2,'0')}</i><div class="daily-meeting-task-main"><strong>${escapeHtml(item.task.title)}</strong><small>${escapeHtml(item.task.owner)} · ${escapeHtml(item.record.team || item.dayPlan.team || '待安排班组')}</small><span class="daily-meeting-confirm-note">计划目标 ${Number(item.record.plannedTarget ?? item.dayPlan.dailyTarget ?? 100)}% · ${ZhuxuMeetingRules.locked(item.record) ? `已由 ${escapeHtml(item.record.meetingConfirmedBy)} 确认锁定` : '尚未确认'}</span></div><label class="daily-meeting-progress-editor"><span>实际完成率</span><input data-meeting-today-progress ${ZhuxuMeetingRules.locked(item.record) ? 'disabled' : ''} type="number" min="0" max="100" value="${Math.max(0, Math.min(100, Number(draft.progress || 0)))}"><b>%</b></label><button type="button" class="secondary-button daily-meeting-confirm-button" data-confirm-meeting-today="${index}" ${ZhuxuMeetingRules.locked(item.record) ? 'disabled' : ''}>${ZhuxuMeetingRules.locked(item.record) ? '已确认锁定' : '确认并锁定'}</button></article>`; }).join('') || '<div class="daily-meeting-empty">今日没有可统计的日计划。</div>'}</div></section><section class="daily-meeting-section"><div class="daily-meeting-section-heading"><div><strong>${escapeHtml(formatDayLabel(tomorrow))}计划</strong><small>在每日例会编制后自动同步到进度计划和第二天的每日任务执行中心。</small></div><button type="button" class="daily-meeting-add" data-add-meeting-plan>＋ 添加计划</button></div><div id="dailyMeetingPlanRows" class="daily-meeting-plan-list">${dailyMeetingPlanDraft.map((row,index) => `<div class="daily-meeting-plan-row" data-meeting-plan-row="${index}"><span>${String(index + 1).padStart(2,'0')}</span><input data-meeting-plan-title value="${escapeHtml(row.title || '')}" placeholder="施工内容"><input data-meeting-plan-target type="number" min="0" max="100" value="${Number(row.dailyTarget ?? 100)}" aria-label="计划完成百分比"><select data-meeting-plan-owner aria-label="责任人">${ownerOptions(row.owner || '')}</select><select data-meeting-plan-team aria-label="责任班组">${teamOptions(row.team || '')}</select><button type="button" data-remove-meeting-plan="${index}" aria-label="删除计划">×</button>${meetingLinkEditor(row,tomorrow,index)}</div>`).join('') || '<div class="daily-meeting-empty">暂无明日计划，请点击“添加计划”。</div>'}</div></section><section class="daily-meeting-section"><div class="daily-meeting-section-heading"><div><strong>明日需协调问题</strong><small>问题类别覆盖现场、材料、资料、人员、技术和设备；保存后自动进入明日需协调事项跟踪。</small></div><button type="button" class="daily-meeting-add" data-add-meeting-coordination>＋ 添加问题</button></div><div id="dailyMeetingCoordinationRows" class="daily-meeting-coordination-list">${dailyMeetingCoordinationDraft.map((row,index) => `<div class="daily-meeting-coordination-row" data-meeting-coordination-row="${index}"><span>${String(index + 1).padStart(2,'0')}</span><select data-meeting-coordination-task aria-label="关联明日任务">${taskOptions(row.taskId)}</select><select data-meeting-coordination-category aria-label="问题类别">${['现场协调问题','材料问题','资料问题','人员问题','图纸或技术问题','设备问题','工作面未移交','验收未完成'].map(value => `<option ${value === row.category ? 'selected' : ''}>${value}</option>`).join('')}</select><textarea data-meeting-coordination-content aria-label="需要协调的问题" placeholder="说明问题及影响">${escapeHtml(row.content || '')}</textarea><select data-meeting-coordination-requester aria-label="提出班组">${teamOptions(row.requester || '')}</select><select data-meeting-coordination-foreman aria-label="责任工长">${ownerOptions(row.foreman || matchPersonByRole('施工员'))}</select><select data-meeting-coordination-owner aria-label="协调责任人">${ownerOptions(row.owner || matchPersonByRole('生产经理'))}</select><input data-meeting-coordination-due type="datetime-local" value="${escapeHtml(row.due || meetingDateTimeValue(tomorrow))}" aria-label="最晚解决时间"><button type="button" data-remove-meeting-coordination="${index}" aria-label="删除协调问题">×</button></div>`).join('') || '<div class="daily-meeting-empty">暂无明日协调问题，请点击“添加问题”。</div>'}</div></section>`;
  bindMeetingLinks(body,tomorrow);
  body.insertAdjacentHTML('afterbegin', todayCoordinationMarkup);
  $$('[data-resolve-meeting-coordination]', body).forEach(button => button.addEventListener('click', () => { dailyCoordination = dailyCoordination.map(item => Number(item.id) === Number(button.dataset.resolveMeetingCoordination) ? { ...item, status: 'resolved', resolvedAt: new Date().toISOString(), resolvedBy: currentOperatorLabel(), feedback: `例会由${currentOperatorLabel()}确认解决` } : item); dailyMeetingCoordinationDraft = dailyMeetingCoordinationDraft.filter(row => Number(row.id) !== Number(button.dataset.resolveMeetingCoordination)); persistDailyCoordination(); renderDailyMeetingDialog(); }));
  $$('[data-meeting-today-progress]', body).forEach(input => input.addEventListener('input', event => {
    const row = event.target.closest('[data-meeting-today-row]');
    const index = Number(row.dataset.meetingTodayRow);
    dailyMeetingTodayDraft[index].progress = event.target.value === '' ? null : Number(event.target.value);
    const button = $('[data-confirm-meeting-today]', row);
    button.disabled = false; button.textContent = '确认并锁定';
  }));
  $$('[data-confirm-meeting-today]', body).forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    if (!await saveDailyMeetingTaskCompletion(meetingDate, Number(button.dataset.confirmMeetingToday))) { button.disabled = false; return; }
    button.textContent = '已确认锁定'; button.disabled = true;
    const confirmedItem = getDailyTaskContexts(meetingDate)[Number(button.dataset.confirmMeetingToday)];
    $('.daily-meeting-confirm-note', button.closest('[data-meeting-today-row]')).textContent = `计划目标 ${confirmedItem.record.plannedTarget}% · 已由 ${confirmedItem.record.meetingConfirmedBy} 确认锁定`;
    $('[data-meeting-today-progress]', button.closest('[data-meeting-today-row]')).disabled = true;
    const summary = getDailyCompletionSummary(meetingDate);
    const cells = $$('.daily-meeting-summary > div', body);
    $('small', cells[1]).textContent = `${summary.completed} 项完成`;
    $('strong', cells[2]).textContent = `${summary.rate}%`;
    $('small', cells[2]).textContent = summary.total > summary.completed ? `${summary.total - summary.completed} 项需续做` : '今日计划已完成';
    button.closest('[data-meeting-today-row]').classList.toggle('done', dailyMeetingTodayDraft[Number(button.dataset.confirmMeetingToday)].progress >= 100);
    renderDailyMeetingDialog();
  }));
  $$('[data-meeting-plan-title]', body).forEach(input => input.addEventListener('input', event => { dailyMeetingPlanDraft[Number(event.target.closest('[data-meeting-plan-row]').dataset.meetingPlanRow)].title = event.target.value; }));
  $$('[data-meeting-plan-target]', body).forEach(input => input.addEventListener('input', event => { dailyMeetingPlanDraft[Number(event.target.closest('[data-meeting-plan-row]').dataset.meetingPlanRow)].dailyTarget = Math.max(0, Math.min(100, Number(event.target.value || 0))); }));
  $$('[data-meeting-plan-owner]', body).forEach(input => input.addEventListener('change', event => { dailyMeetingPlanDraft[Number(event.target.closest('[data-meeting-plan-row]').dataset.meetingPlanRow)].owner = event.target.value; }));
  $$('[data-meeting-plan-team]', body).forEach(input => input.addEventListener('change', event => { dailyMeetingPlanDraft[Number(event.target.closest('[data-meeting-plan-row]').dataset.meetingPlanRow)].team = event.target.value; }));
  $$('[data-remove-meeting-plan]', body).forEach(button => button.addEventListener('click', () => { dailyMeetingPlanDraft.splice(Number(button.dataset.removeMeetingPlan), 1); renderDailyMeetingDialog(); }));
  $$('[data-meeting-coordination-task]', body).forEach(input => input.addEventListener('change', event => { dailyMeetingCoordinationDraft[Number(event.target.closest('[data-meeting-coordination-row]').dataset.meetingCoordinationRow)].taskId = Number(event.target.value) || null; }));
  $$('[data-meeting-coordination-category]', body).forEach(input => input.addEventListener('change', event => { dailyMeetingCoordinationDraft[Number(event.target.closest('[data-meeting-coordination-row]').dataset.meetingCoordinationRow)].category = event.target.value; }));
  $$('[data-meeting-coordination-content]', body).forEach(input => input.addEventListener('input', event => { dailyMeetingCoordinationDraft[Number(event.target.closest('[data-meeting-coordination-row]').dataset.meetingCoordinationRow)].content = event.target.value; }));
  $$('[data-meeting-coordination-requester]', body).forEach(input => input.addEventListener('change', event => { dailyMeetingCoordinationDraft[Number(event.target.closest('[data-meeting-coordination-row]').dataset.meetingCoordinationRow)].requester = event.target.value; }));
  $$('[data-meeting-coordination-foreman]', body).forEach(input => input.addEventListener('change', event => { dailyMeetingCoordinationDraft[Number(event.target.closest('[data-meeting-coordination-row]').dataset.meetingCoordinationRow)].foreman = event.target.value; }));
  $$('[data-meeting-coordination-owner]', body).forEach(input => input.addEventListener('change', event => { dailyMeetingCoordinationDraft[Number(event.target.closest('[data-meeting-coordination-row]').dataset.meetingCoordinationRow)].owner = event.target.value; }));
  $$('[data-meeting-coordination-due]', body).forEach(input => input.addEventListener('change', event => { dailyMeetingCoordinationDraft[Number(event.target.closest('[data-meeting-coordination-row]').dataset.meetingCoordinationRow)].due = event.target.value; }));
  $$('[data-remove-meeting-coordination]', body).forEach(button => button.addEventListener('click', () => { dailyMeetingCoordinationDraft.splice(Number(button.dataset.removeMeetingCoordination), 1); renderDailyMeetingDialog(); }));
  $('[data-add-meeting-plan]', body)?.addEventListener('click', () => { dailyMeetingPlanDraft.push({ id: null, title: '', dailyTarget: 100, owner: '', team: '' }); renderDailyMeetingDialog(); });
  $('[data-add-meeting-coordination]', body)?.addEventListener('click', () => { dailyMeetingCoordinationDraft.push({ taskId: null, category: '现场协调问题', content: '', requester: '', foreman: matchPersonByRole('施工员'), owner: matchPersonByRole('生产经理'), due: meetingDateTimeValue(tomorrow) }); renderDailyMeetingDialog(); });
}

function openDailyMeetingDialog(date = dailyDateKey) {
  dailyMeetingDate = date || dailyDateKey;
  $('#dailyMeetingDateInput').value = dailyMeetingDate;
  const tomorrow = shiftDateKey(dailyMeetingDate, 1);
  const todayContexts = getDailyTaskContexts(dailyMeetingDate);
  dailyMeetingTodayDraft = todayContexts.map(item => ({ taskId: item.task.id, progress: item.record.autoGenerated ? 0 : Number(item.record.actualCompletion ?? item.record.progress ?? 0), actualQuantity: item.record.actualQuantity || '', note: item.record.note || '' }));
  const tomorrowPlans = plans.filter(plan => plan.level === 'day' && !plan.archived && plan.start === tomorrow).sort((a, b) => Number(a.id) - Number(b.id));
  const carryover = getDailyTaskContexts(dailyMeetingDate).filter(item => ZhuxuMeetingRules.progress(item.record) < 100);
  dailyMeetingPlanDraft = (tomorrowPlans.length ? tomorrowPlans : carryover.map(item => ({ id: null, title: item.task.title, dailyTarget: 100, owner: item.task.owner, team: item.record.team || item.dayPlan.team || '', scheduleLink: ZhuxuScheduleRules.carry(item.dayPlan,item.record), parentId: item.dayPlan.parentId, carriedFromId: item.dayPlan.id }))).map(plan => ({ id: plan.id || null, title: plan.title || '', dailyTarget: plan.dailyTarget ?? 100, owner: Array.isArray(plan.owners) ? plan.owners[0] : (plan.owners || plan.owner || ''), team: plan.team || '', parentId: plan.parentId || null, scheduleLink: plan.scheduleLink ? structuredClone(plan.scheduleLink) : null, carriedFromId: plan.carriedFromId || null }));
  const tomorrowCoordination = dailyCoordination.filter(item => String(item.due || '').startsWith(tomorrow));
  const carryCoordination = dailyCoordination.filter(item => item.status !== 'resolved' && String(item.due || '').startsWith(dailyMeetingDate));
  dailyMeetingCoordinationDraft = [...tomorrowCoordination, ...carryCoordination.filter(item => !tomorrowCoordination.some(existing => Number(existing.id) === Number(item.id)))].map(item => ({ id: item.id, taskId: item.taskId, category: item.category || '现场协调问题', content: item.content || '', requester: item.requester || '', foreman: item.foreman || matchPersonByRole('施工员'), owner: item.owner || matchPersonByRole('生产经理'), due: tomorrowCoordination.includes(item) ? (item.due || meetingDateTimeValue(tomorrow)) : meetingDateTimeValue(tomorrow) }));
  renderDailyMeetingDialog();
  const dialog = $('#dailyMeetingDialog');
  $$('dialog[open]').forEach(item => { if (item !== dialog) item.close(); });
  dialog.showModal();
}

async function saveDailyMeetingTaskCompletion(date, index) {
  const contexts = getDailyTaskContexts(date);
  const draft = dailyMeetingTodayDraft[index];
  const item = contexts.find(context => Number(context.task.id) === Number(draft?.taskId));
  if (!item || !draft) return false;
  if (draft.progress === null || !Number.isFinite(draft.progress) || draft.progress < 0 || draft.progress > 100) { showToast('请输入 0 到 100 之间的完成百分比'); return false; }
  const confirmedAt = new Date().toISOString();
  const record = getDailyExecutionRecord(item.task.id, date, item.dayPlan);
  let next;
  try {
    ZhuxuScheduleRules.validateDay(item.dayPlan, plans);
    next = ZhuxuMeetingRules.confirm(record, item.dayPlan, draft.progress, currentOperatorLabel(), confirmedAt);
    if (window.ZhuxuServer?.active) {
      const response = await window.ZhuxuServer.request('/api/daily-execution/confirm', { method: 'POST', body: JSON.stringify({ taskId: item.task.id, dayPlanId: item.dayPlan.id, date, actualCompletion: draft.progress }) });
      next = { ...record, ...response.record };
    }
  } catch (error) { showToast(error.message || '确认未成功，请重试'); return false; }
  const recordIndex = dailyExecution.findIndex(existing => Number(existing.taskId) === Number(item.task.id) && existing.date === date);
  const updatedExecution = dailyExecution.slice();
  if (recordIndex >= 0) updatedExecution[recordIndex] = next;
  else updatedExecution.push(next);
  try { localStorage.setItem('zhuxu-daily-execution', JSON.stringify(updatedExecution)); }
  catch (error) {
    if (!window.ZhuxuServer?.active) { showToast('本机存储不足，完成率未确认，请释放空间后重试'); return false; }
    showToast('服务端已确认锁定，本机缓存失败；请刷新重新读取');
  }
  dailyExecution = updatedExecution;
  dailyMeetingPlanDraft = dailyMeetingPlanDraft.filter(row => row.id || Number(row.carriedFromId) !== Number(item.dayPlan.id) || next.actualCompletion < 100).map(row => !row.id && Number(row.carriedFromId) === Number(item.dayPlan.id) ? { ...row, scheduleLink: ZhuxuScheduleRules.carry(item.dayPlan,next) } : row);
  if (!item.task.virtual && date === dailyDateKey) tasks = tasks.map(task => Number(task.id) === Number(item.task.id) ? { ...task, status: next.progress >= 100 ? 'done' : next.progress > 0 ? 'doing' : 'todo' } : task);
  try { persistTasks(); } catch (error) { /* Completion remains durably confirmed even if a secondary task cache is full. */ }
  if ($('#intake').classList.contains('active')) renderSubview('intake');
  showToast(`${item.task.title}实际完成率已确认锁定并同步到今日任务跟踪`);
  return true;
}

function syncDailyPlansFromMeeting(date, rows) {
  rows.forEach(row => ZhuxuScheduleRules.validateDay({ ...row, level: 'day', parentId: row.scheduleLink?.weekId ?? row.parentId, start: date, end: date }, plans));
  const normalized = rows.map(row => ({ ...row, title: String(row.title || '').trim(), dailyTarget: Math.max(0, Math.min(100, Number(row.dailyTarget ?? 100))), owner: String(row.owner || '').trim(), team: String(row.team || '').trim() })).filter(row => row.title);
  const existing = plans.filter(plan => plan.level === 'day' && !plan.archived && plan.start === date);
  const matched = new Set();
  normalized.forEach(row => { const plan = row.id ? existing.find(item => Number(item.id) === Number(row.id)) : null; if (plan) matched.add(Number(plan.id)); });
  const existingIds = new Set(existing.map(plan => Number(plan.id)));
  const preservedWithFiles = existing.filter(plan => !matched.has(Number(plan.id)) && (plan.attachments || []).length).map(plan => {
    const planTaskIds = tasks.filter(task => Number(task.dayPlanId) === Number(plan.id)).map(task => Number(task.id));
    tasks = tasks.filter(task => !planTaskIds.includes(Number(task.id)));
    dailyExecution = dailyExecution.filter(record => !planTaskIds.includes(Number(record.taskId)) && Number(record.dayPlanId) !== Number(plan.id));
    return { ...plan, archived: true, archivedAt: new Date().toISOString(), archivedReason: '每日例会调整计划，保留原上传文件' };
  });
  existing.filter(plan => !matched.has(Number(plan.id)) && !(plan.attachments || []).length).forEach(plan => removeDailyPlanById(plan.id));
  const seed = Date.now(); const taskIdMap = new Map(); const newPlans = [];
  normalized.forEach((row, index) => {
    const previous = row.id ? existing.find(item => Number(item.id) === Number(row.id)) : null;
    const planId = previous?.id || seed + index + 1;
    const oldTasks = tasks.filter(task => Number(task.dayPlanId) === Number(planId));
    const oldTaskIds = oldTasks.map(task => Number(task.id));
    const taskId = oldTasks[0]?.id || seed + 1000 + index;
    oldTaskIds.forEach(oldId => taskIdMap.set(oldId, taskId));
    const owner = row.owner || previous?.owners?.[0] || planOwners(previous || {}).at(0) || resolveOrganizationOwner('施工管理人员');
    const team = row.team || previous?.team || '';
    const task = { ...(oldTasks[0] || {}), id: taskId, dayPlanId: planId, title: row.title, zone: oldTasks[0]?.zone || previous?.zone || '计划指定区域', owner, team, creator: oldTasks[0]?.creator || currentOperatorLabel(), taskType: '施工任务', time: oldTasks[0]?.time || '17:00', status: oldTasks[0]?.status || 'todo', priority: oldTasks[0]?.priority || 'normal', criteria: `来源：每日例会 · ${date}` };
    tasks = tasks.filter(item => !oldTaskIds.includes(Number(item.id)));
    tasks.unshift(task);
    dailyExecution = dailyExecution.map(record => oldTaskIds.includes(Number(record.taskId)) ? { ...record, taskId, dayPlanId: planId } : record);
    const updatedPlan = { ...(previous || {}), id: planId, level: 'day', title: row.title, owners: owner ? [owner] : [], ownerRole: owner.split('·').slice(-1)[0]?.trim() || '施工管理人员', team, dailyTarget: row.dailyTarget, start: date, end: date, parentId: row.scheduleLink?.weekId ?? row.parentId ?? null, scheduleLink: row.scheduleLink || null, carriedFromId: row.carriedFromId || null, taskId, taskIds: [taskId], subTasks: [], source: '每日例会', updatedAt: new Date().toISOString() };
    newPlans.push(updatedPlan); getDailyExecutionRecord(taskId, date, updatedPlan);
  });
  plans = plans.filter(plan => !(existingIds.has(Number(plan.id)))) .concat(preservedWithFiles, newPlans);
  return { taskIdMap, plans: newPlans };
}

function syncDailyCoordinationFromMeeting(date, rows, taskIdMap) {
  dailyCoordination = dailyCoordination.filter(item => !(item.source === 'daily-meeting' && String(item.due || '').startsWith(date)));
  rows.map(row => ({ ...row, content: String(row.content || '').trim() })).filter(row => row.content && !['材料问题', '资料问题'].includes(row.category)).forEach((row, index) => {
    const taskId = taskIdMap.get(Number(row.taskId)) || Number(row.taskId) || null;
    dailyCoordination.unshift({ id: Date.now() + index, taskId, category: row.category || '现场协调问题', content: row.content, requester: row.requester || '未注明班组', foreman: row.foreman || matchPersonByRole('施工员'), owner: row.owner || matchPersonByRole('生产经理'), due: row.due || meetingDateTimeValue(date), status: 'pending', source: 'daily-meeting', meetingDate: dailyMeetingDate, createdAt: new Date().toISOString(), createdBy: currentOperatorLabel() });
  });
}

function openWorkersDetail(taskId) {
  const task = tasks.find(item => Number(item.id) === Number(taskId));
  const record = dailyExecution.find(item => Number(item.taskId) === Number(taskId) && item.date === activeExecutionDate) || getDailyExecutionRecord(taskId, activeExecutionDate);
  const team = record?.team || task?.owner || '';
  const attendance = attendanceRecords.find(item => item.date === activeExecutionDate);
  const workers = attendance?.workers || [];
  $('#workersDialogTitle').textContent = `${task?.title || '施工任务'} · ${team}`;
  $('#workersBody').innerHTML = workers.length
    ? `<div class="workers-table"><div class="workers-row header"><span>姓名</span><span>工种</span><span>上班打卡</span><span>下班打卡</span><span>花名册匹配</span></div>${workers.map(worker => `<div class="workers-row"><span>${escapeHtml(worker.name)}</span><span>${escapeHtml(worker.trade || '—')}</span><span>${escapeHtml(worker.checkIn || '—')}</span><span>${escapeHtml(worker.checkOut || '—')}</span><span><em class="material-batch-status ${worker.matched ? 'done' : 'testing'}">${worker.matched ? '已匹配' : '未登记'}</em></span></div>`).join('')}</div><p class="workers-note">以上为劳资员 ${escapeHtml(attendance?.officer || '未登记')} 于 ${activeExecutionDate} 上传的实名制打卡记录，共 ${workers.length} 人；未匹配人员请到“民工管理 → 民工花名册”补充登记。</p>`
    : '<div class="resource-empty">该日考勤尚未解析出人员明细。请劳资员上传包含“姓名、工种、上班/下班时间”列的 Excel 打卡表，系统会自动提取并与花名册匹配。</div>';
  $('#workersDialog').showModal();
}

function openTechnicalNotice(taskId) {
  const record = getDailyExecutionRecord(taskId); const notice = record.technicalNotice;
  const task = tasks.find(item => Number(item.id) === Number(taskId));
  $('#technicalNoticeTaskId').value = taskId;
  $('#addTechnicalNotice').onclick = () => { $('#technicalNoticeDialog').close(); openTechnicalDocumentDialog('change'); linkingTechnicalTaskId = Number(taskId); linkingTechnicalTaskDate = activeExecutionDate; };
  if (!notice) {
    $('#technicalNoticeTitle').textContent = '常规施工 · 技术交底';
    $('#technicalNoticeBody').innerHTML = `<div class="technical-notice-mark"><span>技术交底</span><strong>无新增变更或指令</strong></div><h3>${escapeHtml(task?.title || '施工任务')}</h3><p>该任务当前没有设计变更或施工指令，按原施工方案和技术交底执行；如需补充交底要求，请在“技术文件”中登记。</p><dl><div><dt>关联任务</dt><dd>${escapeHtml(task?.title || '')}</dd></div><div><dt>责任班组</dt><dd>${escapeHtml(record.team || '待安排')}</dd></div><div><dt>当前状态</dt><dd>常规施工</dd></div></dl>`;
    $('#acknowledgeTechnicalNotice').disabled = true;
    $('#acknowledgeTechnicalNotice').textContent = '无需确认';
    $('#technicalNoticeDialog').showModal();
    return;
  }
  $('#technicalNoticeTitle').textContent = `${notice.type} · ${notice.code}`;
  const sourceDocument = technicalDocuments.find(item => item.code === notice.code || Number(item.id) === Number(notice.documentId));
  $('#technicalNoticeBody').innerHTML = `<div class="technical-notice-risk"><b>!</b><span>技术风险提示</span><strong>未完成交底确认前，请勿按原做法继续施工</strong></div><div class="technical-notice-mark"><span>${escapeHtml(notice.type)}</span><strong>${escapeHtml(notice.code)}</strong></div><h3>${escapeHtml(notice.title)}</h3><p class="technical-notice-important"><b>!</b><span>${escapeHtml(sourceDocument?.content || notice.detail)}</span></p><dl><div><dt>关联任务</dt><dd>${escapeHtml(task?.title || '')}</dd></div><div><dt>发布人</dt><dd>${escapeHtml(notice.issuedBy)}</dd></div><div><dt>发布时间</dt><dd>${formatIntakeTime(notice.issuedAt)}</dd></div><div><dt>需要确认</dt><dd>${notice.requiredRoles.map(escapeHtml).join('、')}</dd></div></dl>${sourceDocument ? `<section class="notice-source-document"><div><strong>上传的${escapeHtml(technicalTypeLabels[sourceDocument.type] || '技术文件')}</strong><p>${escapeHtml(sourceDocument.scope)} · ${(sourceDocument.files || []).length} 个附件</p></div>${(sourceDocument.files || []).map((file,index) => `<button type="button" data-notice-source-file="${index}">${escapeHtml(file.name)} <span>查看原文件 →</span></button>`).join('')}<button type="button" data-open-technical-document="${sourceDocument.id}">查看技术文件台账详情</button></section>` : ''}<section><strong>确认记录</strong><p>${notice.acknowledgedBy.length ? notice.acknowledgedBy.map(escapeHtml).join('、') : '尚无人确认'}</p></section>`;
  $$('[data-notice-source-file]', $('#technicalNoticeBody')).forEach(button => button.addEventListener('click', () => previewStoredAttachment((sourceDocument.files || [])[Number(button.dataset.noticeSourceFile)])));
  $('[data-open-technical-document]', $('#technicalNoticeBody'))?.addEventListener('click', () => { $('#technicalNoticeDialog').close(); navigate('technical'); setTimeout(() => openTechnicalDocumentDetail(sourceDocument.id), 0); });
  const operator = currentOperatorLabel();
  $('#acknowledgeTechnicalNotice').disabled = notice.acknowledgedBy.includes(operator);
  $('#acknowledgeTechnicalNotice').textContent = notice.acknowledgedBy.includes(operator) ? '当前账号已确认' : '已阅读并确认';
  $('#technicalNoticeDialog').showModal();
}

function openIntakeDialog() {
  const form = $('#intakeForm');
  form.reset();
  form.elements.collector.value = currentOperatorLabel();
  const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  form.elements.collectedAt.value = localNow.toISOString().slice(0, 16);
  $('#intakeFileState').textContent = '可上传 PDF、Word、Excel、CSV、文字或现场照片，最多 8 个';
  $('#intakeDialog').showModal();
}

function renderIntakeReviewCandidates(record) {
  $('#intakeReviewCandidates').innerHTML = (record.candidates || []).map((candidate, index) => `<label class="intake-candidate-row"><input type="checkbox" data-intake-candidate-check="${index}" ${candidate.selected !== false ? 'checked' : ''}><span>${String(index + 1).padStart(2,'0')}</span><input data-intake-candidate-title="${index}" value="${escapeHtml(candidate.title)}" aria-label="候选项 ${index + 1}"></label>`).join('') || '<div class="resource-empty">未提取到候选内容，可修改采集主题后直接分发</div>';
}

function openIntakeReview(record) {
  if (!record) return;
  editingIntakeId = record.id;
  const form = $('#intakeReviewForm');
  form.reset();
  form.elements.recordId.value = record.id;
  form.elements.title.value = record.title;
  form.elements.target.value = record.target || 'task';
  form.elements.zone.value = record.zone || '';
  form.elements.reviewer.value = record.reviewer || currentOperatorLabel();
  form.elements.reviewNote.value = record.reviewNote || '';
  $('#intakeReviewTitle').textContent = record.status === 'review' ? '校核识别结果并分发' : '查看信息来源与流转结果';
  $('#intakeSourceAudit').innerHTML = `<div><span>原始来源</span><strong>${intakeSourceLabels[record.source] || '其他来源'}</strong><small>${escapeHtml(record.recognitionMode || '人工录入')}</small></div><div><span>采集信息</span><strong>${escapeHtml(record.collector)}</strong><small>${formatIntakeTime(record.collectedAt)} · ${escapeHtml(record.zone)}</small></div><div class="intake-audit-files"><span>原始附件</span>${renderStoredFileList(record.attachments || [], '无附件，保留文字原文')}</div>${record.businessRefs?.length ? `<div><span>业务去向</span><strong>${record.businessRefs.length} 条记录</strong><small>${record.businessRefs.map(item => `${intakeTargetLabels[item.kind] || item.kind} #${item.id}`).join(' · ')}</small></div>` : ''}`;
  $$('[data-stored-file-index]', $('#intakeSourceAudit')).forEach(button => button.addEventListener('click', () => previewStoredAttachment((record.attachments || [])[Number(button.dataset.storedFileIndex)])));
  renderIntakeReviewCandidates(record);
  const distributed = record.status !== 'review';
  form.querySelector('[value="distribute"]').disabled = distributed;
  form.querySelector('[value="save"]').disabled = distributed;
  form.querySelector('[value="archive"]').textContent = record.status === 'archived' ? '已归档' : '仅归档';
  form.querySelector('[value="archive"]').disabled = record.status === 'archived';
  $('#intakeReviewDialog').showModal();
}

function distributeIntakeRecord(record, candidates) {
  const refs = [];
  const now = Date.now();
  const titles = candidates.length ? candidates : [record.title];
  if (record.target === 'task') {
    titles.forEach((title, index) => {
      const match = matchResponsible(title);
      const item = { id: now + index, title, zone: record.zone, owner: match.owner, creator: record.reviewer, taskType: '施工任务', time: '17:00', status: 'todo', priority: 'normal', criteria: `来源：信息采集中心 #${record.id}` };
      tasks.unshift(item); refs.push({ kind: 'task', id: item.id, title });
    });
    persistTasks();
  } else if (record.target === 'plan') {
    const start = new Date().toISOString().slice(0,10);
    const end = new Date(Date.now() + 7 * 86400000).toISOString().slice(0,10);
    titles.forEach((title, index) => { const item = { id: now + index, level: 'week', title, start, end, ownerRole: '生产经理', source: `信息采集中心 #${record.id}` }; plans.push(item); refs.push({ kind: 'plan', id: item.id, title }); });
    persistPlans();
  } else if (record.target === 'material') {
    const due = new Date(Date.now() + 7 * 86400000).toISOString().slice(0,10);
    titles.forEach((title, index) => {
      const requester = record.reviewer || currentOperatorLabel();
      const item = { id: now + index, type: 'material', name: title, quantity: '待核实', due, location: record.zone, ownerRole: '材料员', requester, purchaser: matchPersonByRole('采购员'), contractBrandRequired: false, contractBrand: '', approvalAttachments: record.attachments || [], approvalWorkflow: [{ role: '提报人', owner: requester, status: 'approved', actedAt: new Date().toISOString(), actedBy: requester }, { role: '生产经理', owner: matchPersonByRole('生产经理'), status: 'pending' }, { role: '技术负责人', owner: matchPersonByRole('技术负责人'), status: 'pending' }, { role: '库管', owner: matchPersonByRole('库管'), status: 'pending' }, { role: '项目经理', owner: matchPersonByRole('项目经理'), status: 'pending' }], createdAt: new Date().toISOString(), sourceIntakeId: record.id };
      resourcePlans.unshift(item); syncMaterialApprovalNotifications(item); refs.push({ kind: 'material', id: item.id, title });
    });
    persistResources(); persistFollowups();
  } else if (record.target === 'document') {
    titles.forEach((title, index) => { const item = { id: now + index, category: '资料催办', title, requester: record.reviewer, owner: matchPersonByRole('资料员'), zone: record.zone, due: defaultDueValue(), urgency: 'normal', relatedTask: `信息采集中心 #${record.id}`, note: record.reviewNote || '请核对原始来源并补齐归档资料。', status: 'pending', reminders: 1, createdAt: new Date().toISOString() }; followups.unshift(item); refs.push({ kind: 'document', id: item.id, title }); });
    persistFollowups();
  } else if (record.target === 'quality') {
    const date = new Date().toISOString().slice(0,10);
    const due = new Date(Date.now() + 86400000).toISOString().slice(0,10);
    titles.forEach((title, index) => { const match = matchResponsible(title); const item = { id: now + index, type: 'quality', title, location: record.zone, owner: match.owner, date, due, status: 'pending', critical: false, note: `来源：信息采集中心 #${record.id}${record.reviewNote ? `；${record.reviewNote}` : ''}`, recordAttachments: record.attachments || [], beforeAttachments: [], afterAttachments: [] }; qualityChecks.unshift(item); refs.push({ kind: 'quality', id: item.id, title }); });
    persistQualityChecks();
  } else {
    titles.forEach((title, index) => { const item = { id: now + index, type: '信息采集', content: `${title}（${record.zone}）`, createdAt: new Date().toISOString(), photos: (record.attachments || []).filter(file => String(file.type || '').startsWith('image/')), sourceIntakeId: record.id }; siteRecords.unshift(item); refs.push({ kind: 'record', id: item.id, title }); });
    if (siteRecords.length > 300) siteRecords.length = 300;
    persistSiteRecords();
  }
  return refs;
}

function renderSubview(id) {
  renderCurrentUser();
  const config = subviews[id];
  const container = document.getElementById(id);
  let body = '';
  if (config.content === 'intake') {
    body = renderIntakeBody();
  } else if (config.content === 'technical') {
    body = renderTechnicalDocumentsBody();
  } else if (config.content === 'cost') {
    body = renderCostDocumentsBody();
  } else if (config.content === 'schedule') {
    body = renderScheduleBody();
  } else if (config.content === 'resources') {
    body = renderResourcesBody();
  } else if (config.content === 'followups') {
    body = renderFollowupsBody();
  } else if (config.content === 'documents') {
    body = renderDocumentsBody();
  } else if (config.content === 'quality') {
    body = renderQualityBody();
  } else if (config.content === 'team') {
    body = renderTeamBody();
  } else if (config.content === 'laborers') {
    body = renderLaborersBody();
  } else if (config.content === 'timeline') {
    body = `<div class="timeline-panel"><div class="timeline-header"><span>关键工作</span>${['8/7','8/8','8/9','8/10','8/11','8/12','8/13','8/14'].map(d=>`<span>${d}</span>`).join('')}</div>
      ${[['3#楼 8F 主体结构',0,38,''],['2#楼 11F 主体结构',13,48,''],['地下室桥架安装',25,50,''],['3#楼二次结构',50,37,'risk']].map(row=>`<div class="gantt-row"><strong>${row[0]}</strong><div class="gantt-track"><i class="gantt-bar ${row[3]}" style="left:${row[1]}%;width:${row[2]}%"></i></div></div>`).join('')}</div>`;
  } else if (config.content === 'table') {
    body = `<div class="data-table"><div class="data-row task-data-row header"><span>任务</span><span>区域</span><span>责任人</span><span>时间</span><span>状态</span><span>操作</span></div>${tasks.map(t=>`<div class="data-row task-data-row"><strong>${t.title}</strong><span>${t.zone}</span><span>${t.owner}</span><span>${t.time}</span><span class="status-pill ${t.status==='risk'||t.priority==='risk'?'warn':''}">${{done:'已完成',doing:'进行中',todo:'待开始',risk:'有风险'}[t.status]}</span><button class="edit-action" data-edit-task-row="${t.id}">编辑</button></div>`).join('')}</div>`;
  } else {
    const cards = {
      materials: [['钢筋库存','42.6 t','可满足未来 3.2 天需求',74],['蒸压砌块','1.5 天','低于 3 天安全库存',31],['大型设备','24 / 27','3 台设备处于保养状态',89]],
      quality: [['待整改','7 项','其中 1 项影响关键节点',38],['一次验收通过率','93.6%','较上月提升 2.4%',94],['安全巡检','12 次','今日计划已全部完成',100]],
      team: [['现场人员','186 人','计划投入 190 人',86],['饱和班组','8 / 12','木工班组存在缺员',67],['人均有效工时','7.2 h','较上周提升 0.4 小时',82]],
      analytics: [['有效施工占比','76.8%','等待时间主要来自验收衔接',77],['本周返工工时','38 h','较上周减少 12 小时',68],['预计工期偏差','-1.2%','当前进度略有提前',88]]
    }[config.content];
    body = `<div class="card-collection">${cards.map(c=>`<article class="info-card"><h3>${c[0]}</h3><div class="big">${c[1]}</div><p>${c[2]}</p><div class="mini-bar"><i style="width:${c[3]}%"></i></div></article>`).join('')}</div>`;
  }
  const showAction = id !== 'intake' && id !== 'schedule';
  const actionLabel = id === 'schedule' ? (activePlanLevel === 'day' ? '每日例会' : '新建计划') : config.action;
  const meetingAction = '';
  container.innerHTML = `<div class="subview-shell"><div class="subview-heading"><div><p class="eyebrow">${escapeHtml(currentProject.name)}</p><h1 id="${id}Title">${config.title}</h1><p>${config.desc}</p></div><div class="subview-heading-actions">${meetingAction}${showAction ? `<button class="primary-button subview-action">＋ ${actionLabel}</button>` : ''}</div></div>${body}</div>`;
  if (id === 'schedule') hydratePlanFilePreviews(container);
  if (id === 'schedule') bindScheduleGoals(container);
  $('.subview-action', container)?.addEventListener('click', () => {
    if (id === 'intake') openDailyFeedbackDialog(null, dailyDateKey);
    else if (id === 'technical') openTechnicalDocumentDialog();
    else if (id === 'cost') openCostDocumentDialog();
    else if (id === 'tasks') openTaskDialog();
    else if (id === 'followups') openFollowupDialog();
    else if (id === 'materials') openResourceEntryDialog(activeResourceTab === 'equipment' ? 'equipment' : 'material');
    else if (id === 'documents') openDocumentGate(null, activeDocumentChain);
    else if (id === 'quality') activeQualityFilter === 'safety' ? openInspectionBatchDialog() : openQualityCheckDialog();
    else if (id === 'team') { renderOrganization(); $('#organizationDialog').showModal(); }
    else if (id === 'laborers') openLaborerDialog();
    else showToast(`${config.action}功能已进入待办，可在下一版接入业务数据`);
  });
  $$('[data-plan-level]', container).forEach(button => button.addEventListener('click', () => { activePlanLevel = button.dataset.planLevel; renderSubview('schedule'); }));
  $$('[data-compose-plan-level]', container).forEach(button => button.addEventListener('click', () => openPlanDialog(null, { level: button.dataset.composePlanLevel, start: button.dataset.composeStart, end: button.dataset.composeEnd })));
  $$('[data-schedule-month-select]', container).forEach(button => button.addEventListener('click', () => { activeScheduleMonth = Number(button.dataset.scheduleMonthSelect); renderSubview('schedule'); }));
  $('[data-upload-master-plan]', container)?.addEventListener('click', () => $('#masterPlanFileInput').click());
  $$('[data-upload-period-plan]', container).forEach(button => button.addEventListener('click', () => {
    pendingPeriodPlanUpload = { level: button.dataset.periodLevel, start: button.dataset.periodStart, end: button.dataset.periodEnd, title: button.dataset.periodTitle };
    $('#periodPlanFileInput').click();
  }));
  $$('[data-period-details]', container).forEach(details => details.addEventListener('toggle', () => {
    if (!details.open) return;
    $$('[data-period-details]', container).forEach(other => { if (other !== details) other.open = false; });
    requestAnimationFrame(() => details.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }));
  $('[data-open-master-file]', container)?.addEventListener('click', () => { const file = plans.find(plan => plan.level === 'master')?.attachments?.[0]; if (file) previewStoredAttachment(file); });
  $$('[data-technical-filter]', container).forEach(button => button.addEventListener('click', () => { activeTechnicalFilter = activeTechnicalFilter === button.dataset.technicalFilter ? 'all' : button.dataset.technicalFilter; activeTechnicalBuilding = 'all'; activeTechnicalProfession = 'all'; renderSubview('technical'); }));
  $$('[data-technical-overview-filter]', container).forEach(button => button.addEventListener('click', () => { activeTechnicalFilter = activeTechnicalFilter === button.dataset.technicalOverviewFilter ? 'all' : button.dataset.technicalOverviewFilter; activeTechnicalBuilding = 'all'; activeTechnicalProfession = 'all'; renderSubview('technical'); }));
  $$('[data-technical-building]', container).forEach(button => button.addEventListener('click', () => { activeTechnicalBuilding = button.dataset.technicalBuilding; activeTechnicalProfession = 'all'; renderSubview('technical'); }));
  $$('[data-technical-profession]', container).forEach(button => button.addEventListener('click', () => { activeTechnicalProfession = activeTechnicalProfession === button.dataset.technicalProfession ? 'all' : button.dataset.technicalProfession; renderSubview('technical'); }));
  $('[data-technical-search-submit]', container)?.addEventListener('click', () => { activeTechnicalSearch = String($('#technicalSearchInput', container)?.value || '').trim(); renderSubview('technical'); });
  $('[data-technical-search-clear]', container)?.addEventListener('click', () => { activeTechnicalSearch = ''; renderSubview('technical'); });
  $('#technicalSearchInput', container)?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); activeTechnicalSearch = event.currentTarget.value.trim(); renderSubview('technical'); } });
  $('[data-new-drawing-building]', container)?.addEventListener('click', () => { $('#drawingNewBuildingError').textContent = ''; $('#drawingNewBuildingForm').reset(); $('#drawingNewBuildingDialog').showModal(); });
  $$('[data-technical-document]', container).forEach(button => button.addEventListener('click', () => openTechnicalDocumentDetail(button.dataset.technicalDocument)));
  $$('[data-open-drawing]', container).forEach(button => button.addEventListener('click', () => openTechnicalDrawing(button.dataset.openDrawing)));
  $$('[data-cost-filter]', container).forEach(button => button.addEventListener('click', () => { activeCostFilter = button.dataset.costFilter; renderSubview('cost'); }));
  $$('[data-cost-overview-filter]', container).forEach(button => button.addEventListener('click', () => { activeCostFilter = button.dataset.costOverviewFilter; renderSubview('cost'); }));
  $$('[data-cost-document]', container).forEach(button => button.addEventListener('click', () => openCostDocumentDetail(button.dataset.costDocument)));
  $('#dailyExecutionDate', container)?.addEventListener('change', event => { activeExecutionDate = event.target.value || dailyDateKey; renderSubview('intake'); });
  $$('[data-daily-date-step]', container).forEach(button => button.addEventListener('click', () => { activeExecutionDate = shiftDateKey(activeExecutionDate, Number(button.dataset.dailyDateStep)); renderSubview('intake'); }));
  $('[data-daily-today]', container)?.addEventListener('click', () => { activeExecutionDate = dailyDateKey; renderSubview('intake'); });
  $$('[data-intake-filter]', container).forEach(button => button.addEventListener('click', () => { activeIntakeFilter = button.dataset.intakeFilter; renderSubview('intake'); }));
  $$('[data-review-intake]', container).forEach(button => button.addEventListener('click', () => openIntakeReview(intakeRecords.find(item => Number(item.id) === Number(button.dataset.reviewIntake)))));
  $$('[data-daily-feedback]', container).forEach(button => button.addEventListener('click', () => openDailyFeedbackDialog(Number(button.dataset.dailyFeedback), button.dataset.feedbackDate || activeExecutionDate)));
  $$('[data-carryover-task]', container).forEach(button => button.addEventListener('click', () => openCarryoverDetail(button.dataset.carryoverTask, button.dataset.carryoverDate)));
  $$('[data-technical-task]', container).forEach(button => button.addEventListener('click', () => openTechnicalNotice(button.dataset.technicalTask)));
  $$('[data-workers]', container).forEach(button => button.addEventListener('click', () => openWorkersDetail(button.dataset.workers)));
  $('[data-new-coordination]', container)?.addEventListener('click', () => openCoordinationDialog());
  $$('[data-follow-coordination]', container).forEach(button => button.addEventListener('click', () => { dailyCoordination = dailyCoordination.map(item => Number(item.id) === Number(button.dataset.followCoordination) ? { ...item, status: 'following', followedAt: new Date().toISOString(), followedBy: currentOperatorLabel(), feedback: `由${currentOperatorLabel()}开始跟进` } : item); persistDailyCoordination(); renderSubview('intake'); showToast('协调事项已进入跟进状态'); }));
  $$('[data-resolve-coordination]', container).forEach(button => button.addEventListener('click', () => { dailyCoordination = dailyCoordination.map(item => Number(item.id) === Number(button.dataset.resolveCoordination) ? { ...item, status: 'resolved', resolvedAt: new Date().toISOString(), resolvedBy: currentOperatorLabel(), feedback: `已由${currentOperatorLabel()}确认完成` } : item); persistDailyCoordination(); renderSubview('intake'); showToast('协调问题已完成并保留闭环记录'); }));
  $$('[data-edit-material-plan]', container).forEach(button => button.addEventListener('click', () => { const plan = resourcePlans.find(item => Number(item.id) === Number(button.dataset.editMaterialPlan)); if (plan) openResourcePlanDialog(plan); else showToast('没有找到对应的材料计划'); }));
  $$('[data-remind-material-plan]', container).forEach(button => button.addEventListener('click', () => remindMaterialPlan(button.dataset.remindMaterialPlan)));
  $('[data-jump-materials]', container)?.addEventListener('click', () => navigate('materials'));
  $('[data-jump-documents]', container)?.addEventListener('click', () => navigate('documents'));
  $('[data-jump-quality]', container)?.addEventListener('click', () => navigate('quality'));
  $('[data-open-collection]', container)?.addEventListener('click', openIntakeDialog);
  $$('[data-edit-plan]', container).forEach(button => button.addEventListener('click', () => openPlanDialog(plans.find(plan => plan.id === Number(button.dataset.editPlan)))));
  $$('[data-plan-attachment]', container).forEach(button => button.addEventListener('click', () => { const plan = plans.find(item => Number(item.id) === Number(button.dataset.planAttachment)); const file = plan?.attachments?.[0]; if (file) previewStoredAttachment(file); }));
  $$('[data-plan-canvas]', container).forEach(canvas => canvas.addEventListener('click', event => {
    if (event.target.closest('button,iframe')) return;
    const plan = plans.find(item => Number(item.id) === Number(canvas.dataset.planCanvas));
    if (plan?.attachments?.[0]) previewStoredAttachment(plan.attachments[0]);
  }));
  $$('[data-edit-task-row]', container).forEach(button => button.addEventListener('click', () => openTaskDialog(tasks.find(task => task.id === Number(button.dataset.editTaskRow)))));
  $$('[data-resource-tab]', container).forEach(button => button.addEventListener('click', () => { activeResourceTab = button.dataset.resourceTab; renderSubview('materials'); }));
  $('[data-new-resource-plan]', container)?.addEventListener('click', () => openResourcePlanDialog());
  $('[data-resource-weekly-report]', container)?.addEventListener('click', openResourceWeeklyReport);
  $$('[data-resource-plan-detail]', container).forEach(button => button.addEventListener('click', () => openResourcePlanDetail(button.dataset.resourcePlanDetail)));
  $$('[data-resource-entry-detail]', container).forEach(button => button.addEventListener('click', () => openResourceEntryDetail(button.dataset.resourceEntryDetail)));
  $$('[data-chain-tab]', container).forEach(button => button.addEventListener('click', () => { activeDocumentChain = button.dataset.chainTab; renderSubview('documents'); }));
  $('[data-chain-update]', container)?.addEventListener('click', button => openDocumentGate(null, button.currentTarget.dataset.chainUpdate));
  $('[data-check-chain]', container)?.addEventListener('click', button => openDocumentGate(null, button.currentTarget.dataset.checkChain));
  $$('[data-urge-document]', container).forEach(button => button.addEventListener('click', () => urgeDocument(button.dataset.urgeDocument, button.dataset.documentCategory)));
  $$('[data-edit-document]', container).forEach(button => button.addEventListener('click', () => openDocumentTaskDialog(button.dataset.documentCategory, button.dataset.editDocument)));
  $$('[data-edit-material-acceptance]', container).forEach(button => button.addEventListener('click', () => openMaterialAcceptanceDialog(button.dataset.editMaterialAcceptance)));
  $('[data-export-ledger]', container)?.addEventListener('click', exportDocumentLedger);
  $('[data-new-concealed]', container)?.addEventListener('click', () => openConcealedAcceptanceDialog());
  $$('[data-edit-concealed]', container).forEach(button => button.addEventListener('click', () => openConcealedAcceptanceDialog(concealedAcceptances.find(item => Number(item.id) === Number(button.dataset.editConcealed)))));
  $$('[data-quality-filter]', container).forEach(button => button.addEventListener('click', () => { activeQualityFilter = button.dataset.qualityFilter; renderSubview('quality'); }));
  $$('[data-edit-quality]', container).forEach(button => button.addEventListener('click', () => openQualityCheckDialog(qualityChecks.find(item => Number(item.id) === Number(button.dataset.editQuality)))));
  $$('[data-edit-inspection]', container).forEach(button => button.addEventListener('click', () => openInspectionBatchDialog(safetyInspections.find(item => Number(item.id) === Number(button.dataset.editInspection)))));
  $('[data-new-inspection]', container)?.addEventListener('click', openInspectionBatchDialog);
  $('[data-edit-organization]', container)?.addEventListener('click', () => { renderOrganization(); $('#organizationDialog').showModal(); });
  $('[data-attendance]', container)?.addEventListener('click', openAttendanceDialog);
  $$('[data-attendance-history]', container).forEach(button => button.addEventListener('click', () => openAttendanceHistory()));
  $$('[data-attendance-record]', container).forEach(button => button.addEventListener('click', () => openAttendanceHistory(button.dataset.attendanceRecord)));
  $$('[data-supplement-attendance]', container).forEach(button => button.addEventListener('click', () => openAttendanceSupplement(button.dataset.supplementAttendance)));
  $('[data-team-allocation]', container)?.addEventListener('click', () => showToast('班组调配已进入下一行，可结合今日考勤人数调整班组投入'));
  $('[data-new-laborer]', container)?.addEventListener('click', () => openLaborerDialog());
  $$('[data-edit-laborer]', container).forEach(button => button.addEventListener('click', () => openLaborerDialog(laborers.find(item => Number(item.id) === Number(button.dataset.editLaborer)))));
  $('[data-new-account]', container)?.addEventListener('click', () => openAccountDialog());
  if (id === 'team') loadAccounts();
  $$('[data-remind-followup]', container).forEach(button => button.addEventListener('click', () => {
    followups = followups.map(item => item.id === Number(button.dataset.remindFollowup) ? { ...item, reminders: Number(item.reminders || 0) + 1, lastRemindedAt: new Date().toISOString() } : item);
    persistFollowups(); renderSubview($('#intake').classList.contains('active') ? 'intake' : 'followups'); showToast('已再次提醒责任人，并记录本次催办');
  }));
  if (id === 'schedule') refreshWeatherTable();
}

function navigate(viewId) {
  if (mustChangePassword) { openPasswordChangeDialog(); return; }
  if (viewId === 'dashboard') viewId = 'intake';
  if (viewId === 'cost' && !hasCostAccess()) { openCostAccessDenied(); return; }
  $$('.view').forEach(view => view.classList.toggle('active', view.id === viewId));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === viewId));
  $('#globalBackButton').classList.toggle('visible', viewId !== 'intake');
  renderSubview(viewId);
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openRecordDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(RECORD_DB_NAME, 2);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(RECORD_STORE_NAME)) database.createObjectStore(RECORD_STORE_NAME, { keyPath: 'id' });
      if (!database.objectStoreNames.contains(RESOURCE_ATTACHMENT_STORE_NAME)) database.createObjectStore(RESOURCE_ATTACHMENT_STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveResourceAttachment(file, id) {
  const database = await openRecordDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(RESOURCE_ATTACHMENT_STORE_NAME, 'readwrite');
    transaction.objectStore(RESOURCE_ATTACHMENT_STORE_NAME).put({ id, blob: file, name: file.name, type: file.type || 'application/octet-stream', size: file.size, createdAt: new Date().toISOString() });
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}

async function getResourceAttachment(id) {
  if (window.ZhuxuServer?.active && !String(id).startsWith('resource-')) {
    try {
      const response = await fetch(window.ZhuxuServer.attachmentUrl(id), { credentials: 'same-origin' });
      if (response.ok) {
        const blob = await response.blob();
        let meta = {};
        try { meta = JSON.parse(decodeURIComponent(response.headers.get('X-Attachment-Meta') || '{}')); } catch (error) {}
        return { blob, name: meta.name || '', type: blob.type || 'application/octet-stream', size: Number(meta.size || 0), id };
      }
    } catch (error) { /* 服务器附件不可用，回退到本机 */ }
  }
  const database = await openRecordDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(RESOURCE_ATTACHMENT_STORE_NAME, 'readonly');
    const request = transaction.objectStore(RESOURCE_ATTACHMENT_STORE_NAME).get(id);
    request.onsuccess = () => { database.close(); resolve(request.result || null); };
    request.onerror = () => { database.close(); reject(request.error); };
  });
}

async function saveSiteRecord(record) {
  const database = await openRecordDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(RECORD_STORE_NAME, 'readwrite');
    transaction.objectStore(RECORD_STORE_NAME).put(record);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}

async function getSiteRecords() {
  const database = await openRecordDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(RECORD_STORE_NAME, 'readonly');
    const request = transaction.objectStore(RECORD_STORE_NAME).getAll();
    request.onsuccess = () => { database.close(); resolve(request.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))); };
    request.onerror = () => { database.close(); reject(request.error); };
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('照片读取失败'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error(`${file.name} 无法识别`));
      image.onload = () => {
        const maxSize = 1600;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({ name: file.name, data: canvas.toDataURL('image/jpeg', .82), width: canvas.width, height: canvas.height });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderSelectedPhotos() {
  $('#photoPreview').innerHTML = selectedPhotos.map((photo, index) => `<div class="photo-thumb"><img src="${photo.data}" alt="待保存现场照片 ${index + 1}"><span class="photo-number">${index + 1}</span><button type="button" data-remove-photo="${index}" aria-label="移除第 ${index + 1} 张照片">×</button></div>`).join('');
  $('#photoSelectionState').textContent = selectedPhotos.length ? `已选择 ${selectedPhotos.length} 张，最多 9 张` : '支持拍照或从相册选择，最多 9 张';
  $$('[data-remove-photo]').forEach(button => button.addEventListener('click', () => { selectedPhotos.splice(Number(button.dataset.removePhoto), 1); renderSelectedPhotos(); }));
}

async function handlePhotoSelection(event) {
  const available = 9 - selectedPhotos.length;
  const files = [...event.target.files].slice(0, available);
  if (!files.length) return;
  $('#photoSelectionState').textContent = '正在处理照片…';
  try {
    const photos = await Promise.all(files.map(compressPhoto));
    selectedPhotos.push(...photos);
    renderSelectedPhotos();
    if (event.target.files.length > available) showToast('现场记录最多保存 9 张照片');
  } catch (error) {
    showToast(error.message || '照片处理失败，请换一张重试');
    $('#photoSelectionState').textContent = '照片处理失败，请换一张重试';
  }
  event.target.value = '';
}

async function renderRecentRecords() {
  const container = $('#recentRecordsList');
  const serverActive = Boolean(window.ZhuxuServer?.active);
  try {
    let records;
    if (serverActive) records = (siteRecords || []).slice(0, 3);
    else records = (await getSiteRecords()).slice(0, 3);
    container.innerHTML = records.length ? records.map(record => `<article class="recent-record"><div class="recent-record-meta"><span class="record-type">${escapeHtml(record.type)}</span><time>${new Date(record.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time><span>${(record.photos || []).length} 张照片</span></div><p>${escapeHtml(record.content)}</p>${record.photos?.length ? `<div class="recent-record-photos">${record.photos.slice(0, 5).map((photo, index) => `<img src="${photo.storageKey && serverActive ? window.ZhuxuServer.attachmentUrl(photo.storageKey) : (photo.data || '')}" alt="${escapeHtml(record.type)}记录照片 ${index + 1}" data-view-photo>`).join('')}</div>` : ''}</article>`).join('') : '<p class="records-empty">还没有现场记录，添加第一条现场情况</p>';
    $$('[data-view-photo]', container).forEach(image => image.addEventListener('click', () => window.open(image.src, '_blank')));
    $('#recordStorageState').textContent = serverActive ? '已同步到服务器，全员可见' : '保存在本机';
  } catch (error) {
    container.innerHTML = '<p class="records-empty">无法读取记录，请检查浏览器存储权限</p>';
    $('#recordStorageState').textContent = serverActive ? '记录同步失败' : '存储不可用';
  }
}

function openLogDialog() {
  selectedPhotos = [];
  renderSelectedPhotos();
  renderRecentRecords();
  $('#logDialog').showModal();
}

function openSidebar() { $('#sidebar').classList.add('open'); $('#sidebarScrim').classList.add('open'); $('#menuButton').setAttribute('aria-expanded', 'true'); }
function closeSidebar() { $('#sidebar').classList.remove('open'); $('#sidebarScrim').classList.remove('open'); $('#menuButton').setAttribute('aria-expanded', 'false'); }

let toastTimer;
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600); }

function createMorningBrief() {
  const pending = tasks.filter(t => t.status !== 'done');
  const risk = pending.filter(t => t.priority === 'risk');
  const text = `【今日晨会简报】\n1. 今日待办 ${pending.length} 项，其中影响节点 ${risk.length} 项。\n2. 首要事项：${risk[0]?.title || '暂无关键风险'}。\n3. 资源提醒：木工班组缺员 4 人，砌块库存仅够 1.5 天。\n4. 安全重点：高温时段调整室外作业并加强临边巡查。`;
  navigator.clipboard?.writeText(text).then(() => showToast('晨会简报已生成并复制到剪贴板')).catch(() => showToast('晨会简报已生成'));
}

function exportData() {
  const data = { project: currentProject.name, projectId: currentProject.id, exportedAt: new Date().toISOString(), stages, tasks, issues, intakeRecords, technicalDocuments, costDocuments: hasCostAccess() ? costDocuments : [], dailyExecution, dailyCoordination, documentState, concealedAcceptances, resourceEntries, resourcePlans, qualityChecks, safetyInspections, organization, attendanceRecords, siteRecords };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `筑序-项目数据-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(url); showToast('项目数据已导出');
}

function initializeApp() {
  if (window.ZhuxuServer?.active && authenticatedUserId) mustChangePassword = Boolean(window.ZhuxuServer.user?.mustChangePassword);
  const formatter = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  $('#todayLabel').textContent = `${formatter.format(new Date())} · 第 218 个施工日`;
  if (authenticatedUserId && !hasCostAccess()) costDocuments = [];
  renderStages(); renderIssues(); renderTasks(); renderDocumentSummary(); renderOrganization();
  persistIntakeRecords(); persistTechnicalDocuments(); persistCostDocuments(); persistDailyExecution(); persistDailyCoordination(); updateDailyBadge();
  resourcePlans.forEach(syncMaterialApprovalNotifications);
  persistResources(); persistFollowups();
  setAuthenticationView(Boolean(authenticatedUserId));
  populateLoginProjects();
  navigate('intake');
  if (window.ZhuxuServer?.active) {
    $('.login-version').textContent = '筑序 v1.1 · 项目局域网多人版';
    $('.sync-state span').textContent = authenticatedUserId ? '局域网数据已连接' : '等待登录服务器';
    if (authenticatedUserId) syncAllLocalState();
  } else {
    $('.login-version').textContent = '筑序 v1.1 · 本机离线演示版';
  }
  if ($('#projectButtonName')) $('#projectButtonName').textContent = currentProject.name;

  $('#loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const account = form.elements.account.value.trim();
    const password = form.elements.password.value;
    if (!account || !password) { $('#loginError').textContent = '请输入登录账号和密码。'; (account ? form.elements.password : form.elements.account).focus(); return; }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const projectSelect = form.elements.projectId;
      let projectId = projectSelect?.value || '';
      if (!projectId && projectSelect?.options?.[0]) projectId = projectSelect.options[0].value;
      const person = await loginWithCredentials(account, password, form.elements.remember.checked, projectId);
      if (!person) { $('#loginError').textContent = '账号或密码不正确，请核对组织架构登记信息。'; form.elements.password.select(); return; }
      if (person.serverReload) { location.reload(); return; }
      $('#loginError').textContent = '';
      form.reset();
      showToast(`登录成功：${person.name} · ${person.role}`);
    } catch (error) {
      $('#loginError').textContent = error.message || '无法连接项目服务器，请稍后重试。';
      form.elements.password.select();
    } finally { submit.disabled = false; }
  });
  $('#loginProjectSelect').addEventListener('change', event => {
    const option = event.target.selectedOptions[0];
    if (option) $('#loginProjectName').textContent = option.textContent.trim();
  });
  $('#initForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const errorEl = $('#initError');
    errorEl.textContent = '';
    const projectName = form.elements.projectName.value.trim();
    const adminName = form.elements.adminName.value.trim();
    const adminAccount = form.elements.adminAccount.value.trim();
    const adminPhone = form.elements.adminPhone.value.trim();
    const adminPassword = form.elements.adminPassword.value;
    const confirmPassword = form.elements.adminPassword2.value;
    if (!projectName) { errorEl.textContent = '请填写项目名称。'; form.elements.projectName.focus(); return; }
    if (!adminName || !adminAccount) { errorEl.textContent = '请填写管理员姓名和登录账号。'; (adminName ? form.elements.adminAccount : form.elements.adminName).focus(); return; }
    const policyError = passwordPolicyError(adminPassword);
    if (policyError) { errorEl.textContent = `管理员密码：${policyError}。`; form.elements.adminPassword.focus(); return; }
    if (adminPassword !== confirmPassword) { errorEl.textContent = '两次输入的密码不一致。'; form.elements.adminPassword2.focus(); return; }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true; submit.textContent = '正在建立项目…';
    try {
      await window.ZhuxuServer.initProject({ projectName, projectCode: form.elements.projectCode.value.trim(), adminName, adminAccount, adminPhone, adminPassword });
      location.reload();
    } catch (error) {
      errorEl.textContent = error.message || '初始化失败，请稍后重试。';
      submit.disabled = false; submit.textContent = '建立项目并进入系统 →';
    }
  });
  $$('.password-toggle').forEach(button => button.addEventListener('click', () => {
    const input = button.closest('.password-field')?.querySelector('input');
    if (!input) return;
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    button.textContent = visible ? '显示' : '隐藏';
    button.setAttribute('aria-label', visible ? '显示密码' : '隐藏密码');
  }));

  $('#passwordChangeLogout').addEventListener('click', logoutCurrentUser);
  $('#passwordChangeForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const currentPassword = form.elements.currentPassword.value;
    const newPassword = form.elements.newPassword.value;
    const confirmPassword = form.elements.confirmPassword.value;
    const errorEl = $('#passwordChangeError');
    if (!currentPassword) { errorEl.textContent = '请输入当前密码。'; form.elements.currentPassword.focus(); return; }
    const policyError = passwordPolicyError(newPassword);
    if (policyError) { errorEl.textContent = `${policyError}。`; form.elements.newPassword.focus(); return; }
    if (newPassword === currentPassword) { errorEl.textContent = '新密码不能与当前密码相同。'; form.elements.newPassword.focus(); return; }
    if (newPassword !== confirmPassword) { errorEl.textContent = '两次输入的新密码不一致。'; form.elements.confirmPassword.focus(); return; }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true; submit.textContent = '修改中…';
    try {
      await window.ZhuxuServer.request('/api/password/change', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
      window.ZhuxuServer.user.mustChangePassword = false;
      mustChangePassword = false;
      form.reset();
      $('#passwordChangeDialog').close();
      navigate('intake');
      syncAllLocalState();
      showToast('密码修改成功，请牢记并使用新密码');
    } catch (error) {
      errorEl.textContent = error.message || '密码修改失败，请重试';
      form.elements.currentPassword.select();
    } finally { submit.disabled = false; submit.textContent = '确认修改密码'; }
  });

  $('#newProjectForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const errorEl = $('#newProjectError');
    errorEl.textContent = '';
    const projectName = form.elements.projectName.value.trim();
    const adminName = form.elements.adminName.value.trim();
    const adminAccount = form.elements.adminAccount.value.trim();
    const adminPhone = form.elements.adminPhone.value.trim();
    const adminPassword = form.elements.adminPassword.value;
    if (!projectName || !adminName || !adminAccount) { errorEl.textContent = '请填写项目名称、管理员姓名和账号。'; return; }
    if (adminPassword) {
      const policyError = passwordPolicyError(adminPassword);
      if (policyError) { errorEl.textContent = `管理员密码：${policyError}。`; form.elements.adminPassword.focus(); return; }
      if (adminPassword !== form.elements.adminPassword2.value) { errorEl.textContent = '两次输入的密码不一致。'; form.elements.adminPassword2.focus(); return; }
    }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true; submit.textContent = '建立中…';
    try {
      const result = await window.ZhuxuServer.request('/api/projects', { method: 'POST', body: JSON.stringify({ projectName, projectCode: form.elements.projectCode.value.trim(), adminName, adminAccount, adminPhone, adminPassword }) });
      form.reset(); $('#newProjectDialog').close();
      showToast(result.reused
        ? `新项目“${result.project.name}”已建立，管理员账号 ${result.adminAccount} 已复用（使用其原密码登录）；你可在顶栏项目菜单中切换进入`
        : `新项目“${result.project.name}”已建立，管理员账号 ${result.adminAccount} 可登录；你可在顶栏项目菜单中切换进入`);
    } catch (error) {
      errorEl.textContent = error.message || '建立项目失败，请重试';
    } finally { submit.disabled = false; submit.textContent = '建立新项目'; }
  });

  $('#accountForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const accountId = form.elements.accountId.value;
    const payload = { name: form.elements.name.value.trim(), role: form.elements.role.value, phone: form.elements.phone.value.trim(), scope: form.elements.scope.value.trim() };
    if (accountId) payload.account = form.elements.account.value.trim();
    if (!payload.account && !accountId) { showToast('请填写登录账号'); form.elements.account.focus(); return; }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true; submit.textContent = '保存中…';
    try {
      let toastMessage = '账号信息已更新';
      if (!accountId) {
        const result = await window.ZhuxuServer.request('/api/accounts', { method: 'POST', body: JSON.stringify(payload) });
        toastMessage = result.account?.created ? '账号已创建，初始密码为登记手机号后六位' : '该账号已存在，已加入当前项目（同一账号可登录多个项目）';
      } else {
        await window.ZhuxuServer.request(`/api/accounts/${encodeURIComponent(accountId)}`, { method: 'PUT', body: JSON.stringify(payload) });
      }
      form.reset(); $('#accountDialog').close();
      showToast(toastMessage);
      await refreshOrganizationFromServer();
      if ($('#team').classList.contains('active')) renderSubview('team');
    } catch (error) {
      showToast(error.message || '保存失败，请重试');
    } finally { submit.disabled = false; submit.textContent = '保存账号'; }
  });

  $('#accountConfirmSubmit').addEventListener('click', async () => {
    const action = $('#accountConfirmAction').value;
    const accountId = $('#accountConfirmId').value;
    if (!action || !accountId) return;
    const submit = $('#accountConfirmSubmit');
    submit.disabled = true; submit.textContent = '处理中…';
    try {
      if (action === 'reset') {
        await window.ZhuxuServer.request(`/api/accounts/${encodeURIComponent(accountId)}`, { method: 'PUT', body: JSON.stringify({ resetPassword: true }) });
        showToast('密码已重置为登记手机号后六位，该账号下次登录需修改密码');
      } else {
        const account = serverAccounts.find(item => String(item.id) === String(accountId));
        const disable = Boolean(account?.enabled);
        await window.ZhuxuServer.request(`/api/accounts/${encodeURIComponent(accountId)}`, { method: 'PUT', body: JSON.stringify({ enabled: disable ? 0 : 1 }) });
        showToast(disable ? '账号已禁用，该账号的会话已失效' : '账号已启用，可重新登录');
      }
      $('#accountConfirmDialog').close();
      await refreshOrganizationFromServer();
      if ($('#team').classList.contains('active')) renderSubview('team');
    } catch (error) {
      showToast(error.message || '操作失败，请重试');
    } finally { submit.disabled = false; submit.textContent = '确认'; }
  });

  $$('.nav-item[data-view]').forEach(item => item.addEventListener('click', () => navigate(item.dataset.view)));
  $$('[data-daily-meeting]').forEach(button => button.addEventListener('click', () => openDailyMeetingDialog(activeExecutionDate || dailyDateKey)));
  $('#dailyMeetingDateInput').addEventListener('change', event => { if (event.target.value) openDailyMeetingDialog(event.target.value); });
  $$('[data-jump]').forEach(item => item.addEventListener('click', () => navigate(item.dataset.jump)));
  $$('.task-filters button').forEach(button => button.addEventListener('click', () => { activeFilter = button.dataset.filter; $$('.task-filters button').forEach(b => b.classList.toggle('active', b === button)); renderTasks(); }));
  $('#menuButton').addEventListener('click', openSidebar); $('#sidebarScrim').addEventListener('click', closeSidebar);
  $('#globalBackButton').addEventListener('click', () => navigate('intake'));
  $('#documentStrip').addEventListener('click', () => navigate('documents'));
  $('#organizationButton').addEventListener('click', () => { renderOrganization(); $('#organizationDialog').showModal(); });
  $('#currentUserCard').addEventListener('click', event => {
    if (!event.target.closest('#accountSwitcherButton')) openCurrentUserDialog();
  });
  $('#currentUserCard').addEventListener('keydown', event => {
    if (event.target.closest('#accountSwitcherButton')) return;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openCurrentUserDialog(); }
  });
  $('#accountSwitcherButton').addEventListener('click', logoutCurrentUser);
  $('#logButton').addEventListener('click', openLogDialog);
  $('#photoInput').addEventListener('change', handlePhotoSelection);
  $('#morningBriefButton').addEventListener('click', createMorningBrief);
  $('#exportButton').addEventListener('click', exportData);
  $('#focusIssueButton').addEventListener('click', () => showToast('建议：联系监理提前 30 分钟到场，并将浇筑前检查并行开展'));
  $('#adoptInsightButton').addEventListener('click', event => { event.currentTarget.textContent = '✓ 已采纳，等待计划确认'; event.currentTarget.disabled = true; showToast('建议已加入明日计划草案'); });
  $('#notificationButton').addEventListener('click', openTodoDialog);
  $('#projectButton').addEventListener('click', () => {
    if (serverMode) { openProjectSwitchDialog(); }
    else showToast(`当前项目：${currentProject.name}${currentProject.code ? `（${currentProject.code}）` : ''}`);
  });
  $('[data-gate-documents]').addEventListener('click', () => { pendingTaskTransition = null; activeDocumentChain = activeGateChain; $('#documentGateDialog').close(); navigate('documents'); });
  $$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $('#attachmentPreviewDialog').addEventListener('close', () => {
    $('#attachmentPreviewBody').innerHTML = '';
    if (activeAttachmentUrl) { URL.revokeObjectURL(activeAttachmentUrl); activeAttachmentUrl = null; }
  });
  $$('.gate-options label, .urgency-options label').forEach(label => label.addEventListener('click', () => { label.querySelector('input').checked = true; }));

  $$('[data-task-intake]').forEach(button => button.addEventListener('click', () => setTaskIntakeMode(button.dataset.taskIntake)));
  $$('[data-plan-mode]').forEach(button => button.addEventListener('click', () => setPlanMode(button.dataset.planMode)));
  $('#planForm select[name="level"]').addEventListener('change', () => { updatePlanParentField(); updatePlanFields(); });
  $('#planForm input[name="start"]').addEventListener('change', event => { $('#planForm').elements.end.value = event.target.value; updatePlanParentField($('#planForm').elements.parentId.value); });
  $('#taskImportInput').addEventListener('change', event => recognizeTaskFiles([...event.target.files]));
  $('#planImportInput')?.addEventListener('change', event => { if (event.target.files[0]) recognizePlanFile(event.target.files[0]); });
  $('#addPlanSubtaskButton')?.addEventListener('click', () => addPlanSubtask());
  $('#addPlanDayRowButton').addEventListener('click', () => addPlanDayRow());
  $('#cancelEditingPlanButton').addEventListener('click', () => {
    if (!editingPlanId) return;
    const removed = removeDailyPlanById(editingPlanId);
    if (removed) { persistPlans(); persistTasks(); persistDailyExecution(); }
    editingPlanId = null; planDayRowsDraft = []; $('#planDialog').close();
    if ($('#schedule').classList.contains('active')) renderSubview('schedule');
    showToast(removed ? '日计划已撤销，关联执行任务也已移除' : '日计划不存在或已撤销');
  });
  $('#planAttachmentInput')?.addEventListener('change', async event => {
    const files = [...event.target.files];
    event.target.value = '';
    if (!files.length) return;
    const attachments = await prepareResourceAttachments(files);
    planAttachmentsDraft.push(...attachments);
    renderPlanAttachmentList();
  });
  $('#masterPlanFileInput').addEventListener('change', async event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const [attachment] = await prepareResourceAttachments([file]);
    if (!attachment) { showToast('总计划文件上传失败，请重试'); return; }
    const existing = plans.find(plan => plan.level === 'master');
    if (existing) existing.attachments = [attachment];
    else plans.unshift({ id: Date.now(), level: 'master', title: `${currentProject.name}总进度计划`, start: `${activeScheduleYear}-01-01`, end: `${activeScheduleYear}-12-31`, ownerRole: '项目经理', source: '批准版总计划', attachments: [attachment] });
    persistPlans();
    if ($('#schedule').classList.contains('active')) renderSubview('schedule');
    showToast('总进度计划文件已更新');
  });
  $('#periodPlanFileInput').addEventListener('change', async event => {
    const file = event.target.files[0];
    event.target.value = '';
    const context = pendingPeriodPlanUpload;
    pendingPeriodPlanUpload = null;
    if (!file || !context) return;
    const [attachment] = await prepareResourceAttachments([file]);
    if (!attachment) { showToast('计划文件上传失败，请重试'); return; }
    const existing = plans.find(plan => plan.level === context.level && plan.isScheduleFile && plan.start === context.start && plan.end === context.end);
    if (existing) Object.assign(existing, { title: context.title, fileHistory: [...(existing.fileHistory||[]),...(existing.attachments||[])], attachments: [attachment], compiler: currentOperatorLabel(), updatedAt: new Date().toISOString() });
    else plans.push({ id: Date.now(), level: context.level, isScheduleFile: true, title: context.title, start: context.start, end: context.end, compiler: currentOperatorLabel(), ownerRole: context.level === 'month' ? '生产经理' : '施工管理人员', source: '上传计划原文件', attachments: [attachment] });
    persistPlans();
    if ($('#schedule').classList.contains('active')) renderSubview('schedule');
    showToast(`${context.title}已上传并直接显示`);
    if(context.level==='month'&&(window.ZhuxuServer?.active||/\.(csv|xlsx)$/i.test(file.name))){
      const source=existing||plans.at(-1);
      // The original is persisted before any recognition work begins.
      if(window.ZhuxuServer?.active)try{await window.ZhuxuServer.saveState('zhuxu-plans',plans);}catch(error){showToast(`原文件已保留，服务器未保存完成：${error.message}`);return;}
      await recognizeScheduleFiles([source],file);
    }
  });
  $('#weatherArchiveButton').addEventListener('click', openWeatherArchive);
  $$('[data-weather-setting]', $('#weatherArchiveDialog')).forEach(button => button.addEventListener('click', () => { $('#weatherArchiveDialog').close(); openWeatherSetting(); }));
  $$('[data-weather-milestone]', $('#weatherArchiveDialog')).forEach(button => button.addEventListener('click', () => { const form = $('#weatherMilestoneForm'); form.reset(); form.elements.date.value = dailyDateKey; $('#weatherMilestoneDialog').showModal(); }));
  $('#weatherMilestoneForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    weatherMilestones.push({ id: Date.now(), title: String(data.get('title') || '').trim(), date: data.get('date'), type: data.get('type'), note: String(data.get('note') || '').trim() });
    persistWeatherMilestones();
    $('#weatherMilestoneDialog').close();
    if ($('#weatherArchiveDialog').open) { renderWeatherArchiveBody(); refreshWeatherTable(); }
    showToast('重要事件已标注到晴雨表');
  });
  $('#deleteWeatherMilestone').addEventListener('click', () => {
    weatherMilestones = weatherMilestones.filter(item => Number(item.id) !== Number(activeWeatherMilestoneId));
    persistWeatherMilestones();
    $('#weatherMilestoneDetailDialog').close();
    if ($('#weatherArchiveDialog').open) { renderWeatherArchiveBody(); refreshWeatherTable(); }
    showToast('重要事件已删除');
  });
  attachDropzoneHandlers();
  enhanceNativeFileUploads();
  $('#resourcePlanForm select[name="type"]').addEventListener('change', event => { populateResourcePlanRoles(event.target.value); updateResourcePlanMaterialFields(); });
  $('#resourcePlanOwner').addEventListener('change', event => {
    const person = organization.find(item => organizationPersonLabel(item) === event.target.value);
    $('#resourcePlanOwnerRole').value = person?.role || '';
  });
  $('#resourcePlanForm select[name="contractBrandRequired"]').addEventListener('change', updateResourcePlanMaterialFields);
  $('#concealedAcceptanceForm select[name="status"]').addEventListener('change', updateConcealedGateHint);
  $('[data-add-resource-entry-row]')?.addEventListener('click', () => {
    captureResourceEntryBatchDraft();
    const type = $('#resourceEntryForm').elements.resourceType.value || 'material';
    resourceEntryBatchDraft.push({ type, category: resourceEntryCategories(type)[0], movement: type === 'material' ? '进场' : '进场', arrivalTime: defaultDueValue() });
    renderResourceEntryBatchRows();
  });
  $('#gateChainSelect').addEventListener('change', event => { pendingTaskTransition = null; openDocumentGate(null, event.target.value); });
  $('#gateMaterialEntry').addEventListener('change', event => {
    documentState[activeGateChain].materialEntryId = Number(event.target.value) || null;
    persistDocumentState(); updateGateMaterialSummary();
  });
  $('#taskForm input[name="title"]').addEventListener('input', () => updateMatchedOwner());
  $('#taskForm input[name="owner"]').addEventListener('input', event => { if (document.activeElement === event.target) event.target.dataset.autoMatched = 'false'; });
  const qualityTitleInput = $('#qualityCheckForm input[name="title"]');
  const qualityOwnerInput = $('#qualityCheckForm input[name="owner"]');
  qualityTitleInput.addEventListener('input', () => {
    const match = matchResponsible(qualityTitleInput.value);
    if (!qualityOwnerInput.value || qualityOwnerInput.dataset.autoMatched === 'true') { qualityOwnerInput.value = match.owner; qualityOwnerInput.dataset.autoMatched = 'true'; }
  });
  qualityOwnerInput.addEventListener('input', () => { if (document.activeElement === qualityOwnerInput) qualityOwnerInput.dataset.autoMatched = 'false'; });
  $('#addInspectionIssueButton').addEventListener('click', () => addInspectionIssueRow());
  $('#parseVoiceButton').addEventListener('click', () => {
    const text = $('#voiceTranscript').value.trim();
    taskRecognitionCandidates = recognizedLines(text, '语音任务').map(title => ({ title, ...matchResponsible(title) }));
    renderTaskRecognitionCandidates();
    if (taskRecognitionCandidates[0]) { $('#taskForm input[name="title"]').value = taskRecognitionCandidates[0].title; updateMatchedOwner(true); }
  });
  $('#voiceTaskButton').addEventListener('click', () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { showToast('当前浏览器不支持语音识别，可在文字框中输入后识别'); return; }
    if (voiceRecognition) { voiceRecognition.stop(); return; }
    voiceRecognition = new Recognition();
    voiceRecognition.lang = 'zh-CN'; voiceRecognition.continuous = true; voiceRecognition.interimResults = true;
    voiceRecognition.onstart = () => { $('#voiceTaskButton').classList.add('listening'); $('#voiceTaskButton strong').textContent = '正在聆听，点击结束'; };
    voiceRecognition.onresult = event => { $('#voiceTranscript').value = [...event.results].map(result => result[0].transcript).join(''); };
    voiceRecognition.onerror = () => showToast('语音识别未启动，请检查麦克风权限');
    voiceRecognition.onend = () => { voiceRecognition = null; $('#voiceTaskButton').classList.remove('listening'); $('#voiceTaskButton strong').textContent = '开始语音布置任务'; if ($('#voiceTranscript').value.trim()) $('#parseVoiceButton').click(); };
    voiceRecognition.start();
  });

  $('#dailyFeedbackTaskSelect').addEventListener('change', event => loadDailyFeedbackTask(Number(event.target.value), $('#dailyFeedbackForm').elements.date.value || dailyDateKey));
  ['documentDone','documentTotal','documentText'].forEach(name => $('#dailyFeedbackForm').elements[name].addEventListener('input', updateDailyDocumentCondition));
  $('#technicalDocumentForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form); const submit = form.querySelector('[type="submit"]');
    submit.disabled = true; submit.textContent = '保存中…';
    try {
      const newFiles = await prepareResourceAttachments([...form.elements.files.files]);
      const files = [...technicalFilesDraft, ...newFiles];
      const profession = data.get('type') === 'drawing' ? (data.get('profession') || detectProfession(`${data.get('title')} ${data.get('building')} ${data.get('scope')}`)) : '';
      const payload = { type: data.get('type'), code: data.get('code'), title: data.get('title'), building: data.get('building'), profession, issuedBy: data.get('issuedBy'), issuedAt: data.get('issuedAt'), scope: data.get('scope'), content: data.get('content'), files, status: 'valid', updatedAt: new Date().toISOString(), updatedBy: currentOperatorLabel() };
      let savedDocument;
      if (editingTechnicalDocumentId) {
        technicalDocuments = technicalDocuments.map(item => Number(item.id) === Number(editingTechnicalDocumentId) ? (savedDocument = { ...item, ...payload }) : item);
      } else {
        savedDocument = { id: Date.now(), ...payload, createdAt: new Date().toISOString(), createdBy: currentOperatorLabel() };
        technicalDocuments.unshift(savedDocument);
      }
      if (linkingTechnicalTaskId) {
        const record = getDailyExecutionRecord(linkingTechnicalTaskId, linkingTechnicalTaskDate || activeExecutionDate);
        record.technicalNotice = { documentId: savedDocument.id, type: technicalTypeLabels[savedDocument.type] || '技术文件', code: savedDocument.code, title: savedDocument.title, detail: savedDocument.content, issuedBy: savedDocument.issuedBy, issuedAt: `${savedDocument.issuedAt}T08:00:00+08:00`, requiredRoles: ['施工责任人', record.team || '责任班组'], acknowledgedBy: [], risk: true, hasAttachment: files.length > 0 };
        persistDailyExecution();
      }
      persistTechnicalDocuments(); form.reset(); $('#technicalDocumentDialog').close();
      editingTechnicalDocumentId = null; technicalFilesDraft = []; linkingTechnicalTaskId = null; linkingTechnicalTaskDate = null;
      if ($('#technical').classList.contains('active')) renderSubview('technical');
      if ($('#intake').classList.contains('active')) renderSubview('intake');
      showToast('技术文件已保存，并与相关施工任务同步');
    } finally { submit.disabled = false; submit.textContent = '保存技术文件'; }
  });
  $('#technicalDocumentForm select[name="type"]').addEventListener('change', event => { $('#professionField').hidden = event.target.value !== 'drawing'; });
  $('#drawingFolderButton').addEventListener('click', () => $('#drawingFolderInput').click());
  $('#drawingFolderInput').addEventListener('change', event => {
    const files = [...event.target.files];
    event.target.value = '';
    if (!files.length) return;
    pendingDrawingFiles = files;
    const firstRel = files[0].webkitRelativePath || files[0].name;
    const firstSegments = firstRel.split('/').filter(Boolean);
    $('#drawingImportCount').textContent = files.length;
    const rootFolder = (firstSegments[0] || '').trim();
    $('#drawingImportForm').elements.targetBuilding.value = rootFolder.match(/\d+#楼|地下室|室外工程|项目部/)?.[0] || rootFolder;
    $('#drawingImportError').textContent = '';
    $('#drawingImportDialog').showModal();
  });
  $('#drawingImportForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const building = form.elements.targetBuilding.value.trim();
    if (!building) { $('#drawingImportError').textContent = '请填写归属单体。'; return; }
    if (!pendingDrawingFiles.length) { $('#drawingImportError').textContent = '没有可导入的文件，请重新选择文件夹。'; return; }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true; submit.textContent = '导入中…';
    try {
      await importDrawingFolder(pendingDrawingFiles, building);
      form.reset(); $('#drawingImportDialog').close();
      if ($('#technical').classList.contains('active')) renderSubview('technical');
    } catch (error) {
      $('#drawingImportError').textContent = error.message || '导入失败，请重试';
    } finally { submit.disabled = false; submit.textContent = '确认导入'; pendingDrawingFiles = []; }
  });
  $('#drawingNewBuildingForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.buildingName.value.trim();
    if (!name) { $('#drawingNewBuildingError').textContent = '请填写单体名称。'; return; }
    if (drawingBuildings.includes(name)) { $('#drawingNewBuildingError').textContent = '该单体已存在。'; return; }
    drawingBuildings.push(name);
    persistDrawingBuildings();
    form.reset(); $('#drawingNewBuildingDialog').close();
    if ($('#technical').classList.contains('active')) renderSubview('technical');
    showToast(`已建立单体文件夹：${name}`);
  });
  $('#costDocumentForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form); const submit = form.querySelector('[type="submit"]');
    submit.disabled = true; submit.textContent = '保存中…';
    try {
      const files = await prepareResourceAttachments([...form.elements.files.files]);
      costDocuments.unshift({ id: Date.now(), type: data.get('type'), code: data.get('code'), title: data.get('title'), party: data.get('party'), amount: data.get('amount') || '待核定', zone: data.get('zone'), issuedAt: data.get('issuedAt'), content: data.get('content'), files, status: data.get('type') === 'contract' ? 'valid' : 'pending', createdAt: new Date().toISOString(), createdBy: currentOperatorLabel() });
      persistCostDocuments(); form.reset(); $('#costDocumentDialog').close();
      if ($('#cost').classList.contains('active')) renderSubview('cost');
      showToast('成控文件已保存并向项目成员共享');
    } finally { submit.disabled = false; submit.textContent = '保存成控文件'; }
  });
  $('#dailyFeedbackForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form); const taskId = Number(data.get('taskId'));
    const dateKey = data.get('date') || dailyDateKey;
    const isToday = dateKey === dailyDateKey;
    const sourceTask = tasks.find(item => Number(item.id) === taskId);
    const dayPlan = plans.find(plan => plan.level === 'day' && (Number(plan.taskId) === taskId || Number(sourceTask?.dayPlanId) === Number(plan.id)) && plan.start === dateKey);
    const existing = getDailyExecutionRecord(taskId, dateKey, dayPlan); const submit = form.querySelector('[type="submit"]');
    submit.disabled = true; submit.textContent = '保存中…';
    try {
      const photos = await prepareResourceAttachments([...form.elements.photos.files]);
      const record = { ...existing, taskId, dayPlanId: dayPlan?.id || existing.dayPlanId, weekPlanId: dayPlan?.parentId || existing.weekPlanId, date: dateKey, team: data.get('team'), plannedWorkers: Number(data.get('plannedWorkers')), actualWorkers: Number(data.get('actualWorkers')), progress: existing.progress, actualQuantity: data.get('actualQuantity'), materialPercent: Number(data.get('materialPercent')), materialText: data.get('materialText'), documentDone: Number(data.get('documentDone')), documentTotal: Number(data.get('documentTotal')), documentText: data.get('documentText'), note: data.get('note'), confirmed: existing.confirmed === true, feedbackPhotos: [...(existing.feedbackPhotos || []), ...photos], feedbackAt: new Date().toISOString(), feedbackBy: currentOperatorLabel() };
      dailyExecution = dailyExecution.map(item => ((Number(item.taskId) === taskId && item.date === dateKey) || (record.dayPlanId && Number(item.dayPlanId) === Number(record.dayPlanId) && !item.taskId)) ? record : item);
      if (isToday) {
        tasks = tasks.map(item => Number(item.id) === taskId ? { ...item, owner: data.get('owner') || item.owner } : item);
      }
      siteRecords.unshift({ id: Date.now(), type: '施工反馈', content: `${tasks.find(item => Number(item.id) === taskId)?.title || '施工任务'}：${record.actualQuantity}；${record.note}`, createdAt: new Date().toISOString(), photos, sourceTaskId: taskId });
      persistDailyExecution(); persistTasks(); persistSiteRecords();
      form.reset(); $('#dailyFeedbackDialog').close();
      if ($('#intake').classList.contains('active')) renderSubview('intake');
      showToast(isToday ? '施工进度、班组人数、材料和资料状态已更新' : `${formatDayLabel(dateKey)} 完成情况已更新`);
    } finally { submit.disabled = false; submit.textContent = '保存施工反馈'; }
  });
  $('#coordinationTaskSelect').addEventListener('change', event => { const task = tasks.find(item => Number(item.id) === Number(event.target.value)); if (task) $('#coordinationForm').elements.requester.value = getDailyExecutionRecord(task.id, dailyDateKey).team || currentOperatorLabel(); });
  $('#coordinationForm').addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    dailyCoordination.unshift({ id: Date.now(), taskId: Number(data.get('taskId')), category: data.get('category'), content: data.get('content'), requester: data.get('requester'), foreman: data.get('foreman'), owner: data.get('owner'), due: data.get('due'), status: 'pending', createdAt: new Date().toISOString() });
    persistDailyCoordination(); form.reset(); $('#coordinationDialog').close(); if ($('#intake').classList.contains('active')) renderSubview('intake'); showToast('明日协调问题已提交并进入跟踪');
  });
  $('#dailyMeetingForm').addEventListener('submit', event => {
    event.preventDefault();
    const tomorrow = shiftDateKey(dailyMeetingDate || dailyDateKey, 1);
    const planRows = dailyMeetingPlanDraft.filter(row => String(row.title || '').trim());
    const coordinationRows = dailyMeetingCoordinationDraft.filter(row => String(row.content || '').trim());
    if (!planRows.length) { showToast('请至少填写一项明日计划'); return; }
    if (dailyExecution.some(record => record.date === tomorrow && ZhuxuMeetingRules.locked(record))) { showToast('该日已有例会确认记录，不能重新编制计划'); return; }
    // Today's completion is only committed by the explicit per-item confirmation.
    let result;
    try { result = syncDailyPlansFromMeeting(tomorrow, planRows); }
    catch (error) { showToast(error.message); return; }
    syncDailyCoordinationFromMeeting(tomorrow, coordinationRows, result.taskIdMap);
    persistPlans(); persistTasks(); persistDailyExecution(); persistDailyCoordination();
    $('#dailyMeetingDialog').close();
    if ($('#schedule').classList.contains('active')) renderSubview('schedule');
    if ($('#intake').classList.contains('active')) renderSubview('intake');
    showToast(`${formatDayLabel(tomorrow)}计划和协调事项已同步`);
  });
  $('#acknowledgeTechnicalNotice').addEventListener('click', () => {
    const taskId = Number($('#technicalNoticeTaskId').value); const record = getDailyExecutionRecord(taskId, dailyDateKey); const operator = currentOperatorLabel();
    if (!record.technicalNotice.acknowledgedBy.includes(operator)) record.technicalNotice.acknowledgedBy.push(operator);
    record.technicalNotice.lastAcknowledgedAt = new Date().toISOString(); persistDailyExecution(); $('#technicalNoticeDialog').close(); if ($('#intake').classList.contains('active')) renderSubview('intake'); showToast('技术交底已确认，系统已记录确认人和时间');
  });

  $('#intakeForm input[name="sourceFiles"]').addEventListener('change', event => {
    const files = [...event.target.files];
    $('#intakeFileState').textContent = files.length ? `已选择 ${Math.min(files.length, 8)} 个：${files.slice(0, 3).map(file => file.name).join('、')}${files.length > 3 ? '…' : ''}` : '可上传 PDF、Word、Excel、CSV、文字或现场照片，最多 8 个';
    if (files.length && files.every(file => file.type.startsWith('image/'))) $('#intakeForm').elements.source.value = 'photo';
  });
  $('#intakeVoiceButton').addEventListener('click', () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { showToast('当前浏览器不支持语音转写，可直接输入或粘贴文字'); return; }
    if (voiceRecognition) { voiceRecognition.stop(); return; }
    const button = $('#intakeVoiceButton');
    const textArea = $('#intakeForm').elements.rawText;
    $('#intakeForm').elements.source.value = 'voice';
    voiceRecognition = new Recognition();
    voiceRecognition.lang = 'zh-CN'; voiceRecognition.continuous = true; voiceRecognition.interimResults = true;
    voiceRecognition.onstart = () => { button.classList.add('listening'); $('strong', button).textContent = '正在转写，点击结束'; };
    voiceRecognition.onresult = event => { textArea.value = [...event.results].map(result => result[0].transcript).join(''); };
    voiceRecognition.onerror = () => showToast('语音转写未启动，请检查麦克风权限');
    voiceRecognition.onend = () => { voiceRecognition = null; button.classList.remove('listening'); $('strong', button).textContent = '开始语音转写'; };
    voiceRecognition.start();
  });

  $('#intakeForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const submit = form.querySelector('[type="submit"]');
    const files = [...form.elements.sourceFiles.files].slice(0, 8);
    submit.disabled = true; submit.textContent = '正在提取并保存…';
    try {
      const extractedParts = [];
      for (const file of files) {
        try { const text = await extractFileText(file); if (text.trim()) extractedParts.push(text.trim()); } catch (error) { /* 文件仍保留，进入人工校核 */ }
      }
      const attachments = await prepareResourceAttachments(files);
      const rawText = String(data.get('rawText') || '').trim();
      const extractedText = [rawText, ...extractedParts].filter(Boolean).join('\n');
      const lines = recognizedLines(extractedText, String(data.get('title')));
      const record = {
        id: Date.now(), title: String(data.get('title')).trim(), source: data.get('source'), target: data.get('target'), zone: String(data.get('zone')).trim(), collector: String(data.get('collector')).trim(), collectedAt: data.get('collectedAt'), status: 'review', rawText, candidates: lines.map(title => ({ title, selected: true })), attachments,
        recognitionMode: extractedParts.length ? '浏览器本地解析 · 待人工校核' : data.get('source') === 'voice' ? '浏览器语音转写 · 待人工校核' : files.length ? '文件名候选 · 待人工校核' : '人工录入 · 待校核', createdAt: new Date().toISOString()
      };
      intakeRecords.unshift(record);
      persistIntakeRecords();
      form.reset(); $('#intakeDialog').close();
      if ($('#intake').classList.contains('active')) renderSubview('intake');
      showToast(`采集记录已保存，生成 ${record.candidates.length} 条待校核内容`);
      openIntakeReview(record);
    } catch (error) {
      showToast('信息采集保存失败，请检查附件后重试');
    } finally { submit.disabled = false; submit.textContent = '保存并生成待校核项'; }
  });

  $('#intakeReviewForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const action = event.submitter?.value || 'save';
    const existing = intakeRecords.find(item => Number(item.id) === Number(form.elements.recordId.value));
    if (!existing) return;
    const candidates = $$('[data-intake-candidate-title]', form).map(input => ({ title: input.value.trim(), selected: $(`[data-intake-candidate-check="${input.dataset.intakeCandidateTitle}"]`, form)?.checked !== false })).filter(item => item.title);
    const updated = { ...existing, title: form.elements.title.value.trim(), target: form.elements.target.value, zone: form.elements.zone.value.trim(), reviewer: form.elements.reviewer.value.trim(), reviewNote: form.elements.reviewNote.value.trim(), candidates, reviewedAt: new Date().toISOString() };
    if (action === 'distribute') {
      const selected = candidates.filter(item => item.selected).map(item => item.title);
      if (!selected.length && candidates.length) { showToast('请至少勾选一条需要分发的候选项'); return; }
      updated.businessRefs = distributeIntakeRecord(updated, selected);
      updated.status = 'distributed'; updated.distributedAt = new Date().toISOString(); updated.distributedBy = updated.reviewer;
    } else if (action === 'archive') {
      updated.status = 'archived'; updated.archivedAt = new Date().toISOString(); updated.archivedBy = updated.reviewer;
    } else {
      updated.status = 'review';
    }
    intakeRecords = intakeRecords.map(item => Number(item.id) === Number(updated.id) ? updated : item);
    persistIntakeRecords();
    editingIntakeId = null; $('#intakeReviewDialog').close();
    if ($('#intake').classList.contains('active')) renderSubview('intake');
    showToast(action === 'distribute' ? `已向${intakeTargetLabels[updated.target]}分发 ${updated.businessRefs.length} 条记录` : action === 'archive' ? '采集记录已归档，来源信息仍可追溯' : '人工校核结果已保存');
  });

  $('#documentGateForm').addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const status = formData.get('gateStatus');
    const transition = pendingTaskTransition;
    const chainKey = activeGateChain;
    const config = documentChainConfigs[chainKey];
    const group = documentState[chainKey];
    group.materialEntryId = Number(formData.get('materialEntryId')) || group.materialEntryId || null;
    const newCommissionFiles = [...event.currentTarget.elements.commissionFiles.files];
    const newReportFiles = [...event.currentTarget.elements.reportFiles.files];
    if (!transition && !group.commissionAttachments?.length && !newCommissionFiles.length) { showToast('请上传见证取样或送检委托后再保存'); return; }
    if (!transition && status === 'qualified' && !group.reportAttachments?.length && !newReportFiles.length) { showToast('登记合格前需要上传检测报告或合格报告'); return; }
    const commissionAttachments = await prepareResourceAttachments(newCommissionFiles);
    const reportAttachments = await prepareResourceAttachments(newReportFiles);
    group.commissionAttachments = [...(group.commissionAttachments || []), ...commissionAttachments];
    group.reportAttachments = [...(group.reportAttachments || []), ...reportAttachments];
    const commissionDocument = group.documents.find(document => /委托|取样/.test(document.name));
    if (commissionDocument && group.commissionAttachments.length) commissionDocument.status = 'done';
    pendingTaskTransition = null;
    group.sampleStatus = status;
    if (!transition) activeDocumentChain = chainKey;
    const report = group.documents.find(document => document.id === config.resultDocumentId);
    report.status = status === 'qualified' ? 'done' : status === 'failed' ? 'failed' : 'pending';
    persistDocumentState();
    renderDocumentSummary();
    $('#documentGateDialog').close();

    if (transition && status === 'qualified') {
      applyTaskStatus(transition.id, transition.nextStatus);
      showToast(`${config.resultName}已确认合格，关联${config.processName}已放行`);
    } else if (transition) {
      tasks = tasks.map(task => task.id === transition.id ? { ...task, status: 'todo', priority: 'risk' } : task);
      persistTasks(); renderTasks();
      showToast(status === 'failed' ? '复试不合格，已阻止绑扎并标记处置风险' : '送检中，钢筋绑扎保持待开始');
    } else {
      showToast(status === 'qualified' ? `${config.resultName}已登记为合格，资料门禁已放行` : status === 'failed' ? `${config.resultName}不合格，资料门禁已阻止施工` : `已登记办理中，等待${config.resultName}`);
    }
    if ($('#documents').classList.contains('active')) renderSubview('documents');
  });
  $('#documentGateDialog').addEventListener('close', () => { pendingTaskTransition = null; });

  $('#documentTaskForm').addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const group = documentState[data.get('categoryKey')];
    const document = group.documents.find(item => item.id === data.get('documentId'));
    ['name', 'trigger', 'owner', 'due', 'status'].forEach(field => { document[field] = data.get(field); });
    const config = documentChainConfigs[data.get('categoryKey')];
    if (document.id === config.resultDocumentId) group.sampleStatus = document.status === 'done' ? 'qualified' : document.status === 'failed' ? 'failed' : 'testing';
    persistDocumentState(); renderDocumentSummary(); form.reset(); $('#documentTaskDialog').close();
    if ($('#documents').classList.contains('active')) renderSubview('documents'); showToast('资料任务已更新');
  });

  $('#materialAcceptanceForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const categoryKey = form.elements.categoryKey.value;
    const group = documentState[categoryKey];
    if (!group) return;
    $$('.acceptance-document-item', form).forEach(row => {
      const document = group.documents.find(item => String(item.id) === row.dataset.acceptanceDocument);
      if (!document) return;
      document.owner = $('.acceptance-owner', row).value.trim();
      document.due = $('.acceptance-due', row).value.trim();
      document.status = $('.acceptance-status', row).value;
    });
    const commissionFiles = await prepareResourceAttachments([...form.elements.commissionFiles.files]);
    const reportFiles = await prepareResourceAttachments([...form.elements.reportFiles.files]);
    group.commissionAttachments = [...(group.commissionAttachments || []), ...commissionFiles];
    group.reportAttachments = [...(group.reportAttachments || []), ...reportFiles];
    const resultDocument = group.documents.find(item => item.id === documentChainConfigs[categoryKey]?.resultDocumentId) || group.documents.at(-1);
    group.sampleStatus = resultDocument.status === 'done' ? 'qualified' : resultDocument.status === 'failed' ? 'failed' : 'testing';
    persistDocumentState();
    renderDocumentSummary();
    form.reset();
    $('#materialAcceptanceDialog').close();
    if ($('#documents').classList.contains('active')) renderSubview('documents');
    showToast('本批材料进场验收资料已统一更新');
  });

  $('#confirmRectificationButton').addEventListener('click', () => {
    const form = $('#qualityCheckForm');
    const existing = qualityChecks.find(item => Number(item.id) === Number(form.elements.checkId.value));
    if (!(existing?.afterAttachments?.length || form.elements.afterPhotos.files.length)) { showToast('确认整改完成前请先上传整改后照片'); return; }
    if (!canAuditQualityRectification()) { showToast('仅质量员或项目经理可确认整改完成'); return; }
    form.elements.status.value = 'closed';
    if (!form.elements.note.value.trim()) form.elements.note.value = `已由${currentOperatorLabel()}复核确认整改完成`;
    form.requestSubmit();
  });
  $('#qualityCheckForm').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const existing = qualityChecks.find(item => Number(item.id) === Number(data.get('checkId')));
    const recordAttachments = await prepareResourceAttachments([...form.elements.recordFiles.files]);
    const beforeAttachments = await prepareResourceAttachments([...form.elements.beforePhotos.files]);
    const afterAttachments = await prepareResourceAttachments([...form.elements.afterPhotos.files]);
    if (data.get('status') === 'closed' && !(existing?.afterAttachments?.length || afterAttachments.length)) { showToast('闭环前请上传整改后照片'); return; }
    const closing = data.get('status') === 'closed';
    const payload = { type: data.get('type'), title: data.get('title'), location: data.get('location'), owner: data.get('owner'), date: data.get('date'), due: data.get('due'), status: data.get('status'), note: data.get('note'), auditedBy: closing ? currentOperatorLabel() : '', auditedAt: closing ? new Date().toISOString() : '', recordAttachments: [...(existing?.recordAttachments || []), ...recordAttachments], beforeAttachments: [...(existing?.beforeAttachments || []), ...beforeAttachments], afterAttachments: [...(existing?.afterAttachments || []), ...afterAttachments] };
    if (existing) qualityChecks = qualityChecks.map(item => item.id === existing.id ? { ...item, ...payload } : item);
    else qualityChecks.unshift({ id: Date.now(), critical: false, ...payload });
    persistQualityChecks(); editingQualityId = null; form.reset(); $('#qualityCheckDialog').close();
    if ($('#quality').classList.contains('active')) renderSubview('quality'); showToast(data.get('status') === 'closed' ? '检查记录已复验闭环' : '检查记录已保存并生成整改跟踪');
  });

  $('#inspectionBatchForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const existing = safetyInspections.find(item => Number(item.id) === Number(data.get('inspectionId')));
    const rows = $$('.inspection-issue-editor-row', form);
    if (!rows.length) { showToast('请至少登记一项巡检问题或检查结果'); return; }
    const issues = [];
    for (const [index, row] of rows.entries()) {
      const existingIssue = existing?.issues.find(issue => String(issue.id) === String(row.dataset.issueId));
      const beforeAttachments = await prepareResourceAttachments([...$('.inspection-issue-before', row).files]);
      const afterAttachments = await prepareResourceAttachments([...$('.inspection-issue-after', row).files]);
      const status = $('.inspection-issue-status', row).value;
      const reply = $('.inspection-issue-reply', row).value.trim();
      const mergedAfter = [...(existingIssue?.afterAttachments || []), ...afterAttachments];
      if (status === 'closed' && (!reply || !mergedAfter.length)) { showToast(`第 ${index + 1} 项闭环前请填写整改回复并上传整改后照片`); return; }
      issues.push({
        id: existingIssue?.id || Date.now() + index,
        title: $('.inspection-issue-title', row).value.trim(),
        owner: $('.inspection-issue-owner', row).value.trim(),
        location: $('.inspection-issue-location', row).value.trim(),
        status,
        reply,
        auditedBy: status === 'closed' ? (existingIssue?.auditedBy || data.get('inspector')) : '',
        auditedAt: status === 'closed' ? new Date().toISOString() : '',
        beforeAttachments: [...(existingIssue?.beforeAttachments || []), ...beforeAttachments],
        afterAttachments: mergedAfter
      });
    }
    const recordAttachments = await prepareResourceAttachments([...form.elements.recordFiles.files]);
    const noticeAttachments = await prepareResourceAttachments([...form.elements.noticeFiles.files]);
    const replyAttachments = await prepareResourceAttachments([...form.elements.replyFiles.files]);
    const mergedNotice = [...(existing?.noticeAttachments || []), ...noticeAttachments];
    const mergedReply = [...(existing?.replyAttachments || []), ...replyAttachments];
    const allClosed = issues.every(issue => issue.status === 'closed');
    if (allClosed && (!mergedNotice.length || !mergedReply.length)) { showToast('统一闭环前请上传整改通知单和整改回复单'); return; }
    const status = allClosed ? 'closed' : issues.some(issue => issue.status !== 'pending') ? 'rectifying' : 'pending';
    const payload = {
      title: data.get('title'), date: data.get('date'), location: data.get('location'), inspector: data.get('inspector'),
      unifiedReply: data.get('unifiedReply'), status, issues,
      recordAttachments: [...(existing?.recordAttachments || []), ...recordAttachments],
      noticeAttachments: mergedNotice, replyAttachments: mergedReply
    };
    if (existing) safetyInspections = safetyInspections.map(item => item.id === existing.id ? { ...item, ...payload } : item);
    else safetyInspections.unshift({ id: Date.now(), ...payload });
    persistSafetyInspections();
    editingInspectionId = null;
    form.reset();
    $('#inspectionBatchDialog').close();
    activeQualityFilter = 'safety';
    if ($('#quality').classList.contains('active')) renderSubview('quality');
    showToast(status === 'closed' ? '巡检已统一回复并逐项闭环' : '巡检主记录及整改子项已保存');
  });

  $('#attendanceForm').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const [attachment] = await prepareResourceAttachments([...form.elements.attendanceFile.files]);
    let workers = [];
    const attendanceFile = form.elements.attendanceFile.files[0];
    if (attendanceFile && /\.(xlsx|xls)$/i.test(attendanceFile.name)) workers = await extractAttendanceWorkers(attendanceFile);
    workers = workers.map(worker => {
      const match = laborers.find(laborer => laborer.name === worker.name);
      return match ? { ...worker, matched: true, laborerId: match.id } : { ...worker, matched: false };
    });
    const matchedCount = workers.filter(worker => worker.matched).length;
    const hasCheckInColumn = workers.some(worker => worker.checkIn);
    const recognizedActual = workers.filter(worker => !/(缺勤|未打卡|请假|离场)/.test(worker.status || '') && (!hasCheckInColumn || worker.checkIn)).length;
    attendanceRecords.unshift({ id: Date.now(), date: data.get('date'), registeredAt: new Date().toISOString(), actual: recognizedActual || Number(data.get('actual')), planned: Number(data.get('planned')), officer: data.get('officer'), note: data.get('note'), supplements: [], attachment, workers, attendanceParseVersion: workers.length ? ATTENDANCE_PARSE_VERSION : 0 });
    attendanceRecords.sort((a,b) => b.date.localeCompare(a.date)); persistAttendance(); form.reset(); $('#attendanceDialog').close();
    if ($('#laborers').classList.contains('active')) renderSubview('laborers');
    if ($('#team').classList.contains('active')) renderSubview('team');
    showToast(workers.length ? `考勤表已保存，提取 ${workers.length} 人，其中 ${matchedCount} 人匹配花名册` : '考勤表已保存，现场人数已按打卡数据更新');
  });

  $('#attendanceSupplementForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const record = attendanceRecords.find(item => Number(item.id) === Number(data.get('recordId')));
    if (!record) return;
    const windowState = attendanceSupplementWindow(record);
    if (!windowState.allowed) { $('#attendanceSupplementDialog').close(); showToast('该日考勤已超过 24 小时核对期，不得补录'); return; }
    const [attachment] = await prepareResourceAttachments([...form.elements.supplementFile.files]);
    const supplement = { id: Date.now(), createdAt: new Date().toISOString(), operator: data.get('operator'), previousActual: record.actual, actual: Number(data.get('actual')), previousPlanned: record.planned, planned: Number(data.get('planned')), reason: data.get('reason'), attachment };
    record.actual = supplement.actual;
    record.planned = supplement.planned;
    record.note = `${record.note || ''}${record.note ? '；' : ''}补录：${supplement.reason}`;
    record.supplements = [...(record.supplements || []), supplement];
    persistAttendance();
    form.reset();
    $('#attendanceSupplementDialog').close();
    if ($('#attendanceHistoryDialog').open) renderAttendanceHistory(record.id);
    if ($('#team').classList.contains('active')) renderSubview('team');
    showToast('考勤核对补录已保存并记录修改痕迹');
  });

  $('#organizationForm').addEventListener('submit', event => {
    event.preventDefault();
    organization = $$('.organization-person').map(row => {
      const existing = organization.find(item => item.id === row.dataset.personId);
      return { ...existing, name: row.querySelector('[name="personName"]').value, role: row.querySelector('[name="personRole"]').value, phone: row.querySelector('[name="personPhone"]').value, scope: row.querySelector('[name="personScope"]').value };
    });
    persistOrganization(); renderOrganization(); $('#organizationDialog').close(); if ($('#team').classList.contains('active')) renderSubview('team'); showToast('项目组织架构已更新，后续任务将按新岗位匹配');
  });
  $('#weatherSettingForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form);
    weatherConfig = { city: String(data.get('city') || '').trim(), latitude: Number(data.get('latitude')), longitude: Number(data.get('longitude')) };
    weatherData = null; weatherArchive = {}; localStorage.removeItem('zhuxu-weather'); localStorage.removeItem('zhuxu-weather-archive');
    persistWeatherConfig(); $('#weatherSettingDialog').close();
    openWeatherArchive();
    showToast('晴雨表地点已更新，正在刷新天气');
  });
  $('#laborerForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    if (!name) { showToast('请填写民工姓名'); return; }
    const payload = { name, trade: String(data.get('trade') || '').trim(), team: String(data.get('team') || '').trim(), phone: String(data.get('phone') || '').trim(), entryDate: data.get('entryDate'), status: data.get('status') };
    if (editingLaborerId) laborers = laborers.map(item => Number(item.id) === Number(editingLaborerId) ? { ...item, ...payload } : item);
    else laborers.unshift({ id: Date.now(), ...payload });
    persistLaborers(); editingLaborerId = null; form.reset(); $('#laborerDialog').close();
    if ($('#laborers').classList.contains('active')) renderSubview('laborers');
    showToast('民工花名册已更新，考勤表上传后将自动匹配');
  });
  $('#planForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form);
    const rows = planDayRowsDraft.map(row => ({ id: row.id || null, title: String(row.title || '').trim(), dailyTarget: Math.max(0, Math.min(100, Number(row.dailyTarget ?? 100))), owners: String(row.owners || '').split(/[、,，]/).map(item => item.trim()).filter(Boolean), team: String(row.team || '').trim() })).filter(row => row.title);
    if (!rows.length && !editingPlanId) { showToast('请至少填写一项当天施工内容'); return; }
    if (editingPlanId && !rows.length) {
      const removed = removeDailyPlanById(editingPlanId);
      if (removed) { persistPlans(); persistTasks(); persistDailyExecution(); }
      editingPlanId = null; planDayRowsDraft = []; form.reset(); $('#planDialog').close();
      if ($('#schedule').classList.contains('active')) renderSubview('schedule');
      showToast(removed ? '日计划已撤销，关联执行任务也已移除' : '日计划不存在或已撤销');
      return;
    }
    planUndoStack.push(plans.map(plan => ({ ...plan, attachments: [...(plan.attachments || [])] })));
    if (planUndoStack.length > 10) planUndoStack.shift();
    const start = data.get('start');
    const explicitParentId = Number(data.get('parentId')) || null;
    const inferredParent = plans.find(plan => plan.level === 'week' && !plan.isScheduleFile && plan.start <= start && plan.end >= start && (explicitParentId && Number(plan.id) === explicitParentId));
    const parentId = explicitParentId || inferredParent?.id || null;
    const attachDayTask = (plan, taskSeed) => {
      const defaultOwner = planOwners(plan)[0] || resolveOrganizationOwner(plan.ownerRole);
      const legacyTaskId = Number(plan.taskId);
      tasks = tasks.filter(task => !(Number(task.dayPlanId) === Number(plan.id)) && !(legacyTaskId && Number(task.id) === legacyTaskId));
      const task = { id: taskSeed, dayPlanId: plan.id, title: plan.title, zone: '计划指定区域', owner: defaultOwner, creator: currentOperatorLabel(), taskType: '施工任务', time: '17:00', status: 'todo', priority: 'normal', criteria: `来源：日进度计划 #${plan.id}`, team: plan.team || '' };
      tasks.unshift(task);
      plan.taskId = task.id;
      plan.taskIds = [task.id];
      return plan;
    };
    const planSeed = Date.now();
    const makePlan = (row, id, source) => {
      const ownerRole = row.owners[0]?.split('·').slice(-1)[0]?.trim() || '施工管理人员';
      const previous = plans.find(plan => Number(plan.id) === Number(id));
      return attachDayTask({ id, level: 'day', title: row.title, ownerRole, owners: row.owners, team: row.team, dailyTarget: row.dailyTarget, start, end: start, parentId, attachments: previous?.attachments || [], subTasks: [], source }, planSeed + 1000 + id % 1000);
    };
    if (editingPlanId) {
      const existing = plans.find(plan => Number(plan.id) === Number(editingPlanId));
      const submittedExistingIds = new Set(rows.map(row => Number(row.id)).filter(Boolean));
      if (existing && !submittedExistingIds.has(Number(editingPlanId))) removeDailyPlanById(editingPlanId);
      const primary = makePlan(rows[0], editingPlanId, '批量编辑日计划');
      plans = plans.map(plan => Number(plan.id) === Number(editingPlanId) ? { ...plan, ...primary } : plan);
      rows.slice(1).forEach((row, index) => plans.push(makePlan(row, planSeed + index + 1, '批量新增日计划')));
      if (!plans.some(plan => Number(plan.id) === Number(editingPlanId))) plans.push(primary);
    } else {
      rows.forEach((row, index) => plans.push(makePlan(row, planSeed + index, '批量新增日计划')));
    }
    activePlanLevel = 'day'; persistPlans(); persistTasks(); editingPlanId = null; planRecognitionCandidates = []; planAttachmentsDraft = []; planSubtasksDraft = []; planDayRowsDraft = []; form.reset(); $('#planDialog').close();
    if ($('#schedule').classList.contains('active')) renderSubview('schedule');
    showToast(`${rows.length} 项日计划已一次保存，并同步生成每日执行任务`);
  });
  $('#taskForm').addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const wasEditing = Boolean(editingTaskId);
    const base = { zone: data.get('zone'), creator: data.get('creator'), taskType: data.get('taskType'), time: data.get('time'), priority: data.get('priority'), criteria: data.get('criteria') };
    if (editingTaskId) {
      tasks = tasks.map(task => task.id === editingTaskId ? { ...task, ...base, title: data.get('title'), owner: data.get('owner') } : task);
    } else if (taskRecognitionCandidates.length) {
      taskRecognitionCandidates.forEach((candidate, index) => tasks.unshift({ id: Date.now() + index, ...base, title: candidate.title, owner: candidate.owner, status: 'todo' }));
    } else {
      tasks.unshift({ id: Date.now(), ...base, title: data.get('title'), owner: data.get('owner'), status: 'todo' });
    }
    persistTasks(); renderTasks(); editingTaskId = null; taskRecognitionCandidates = []; form.reset(); $('#taskDialog').close();
    if ($('#tasks').classList.contains('active')) renderSubview('tasks');
    showToast(wasEditing ? '任务已更新' : '任务已识别并分发');
  });
  $('#resourcePlanForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form); const submit = form.querySelector('[type="submit"]');
    const type = data.get('type');
    if (type === 'material' && data.get('contractBrandRequired') === 'yes' && !String(data.get('contractBrand')).trim()) { showToast('合同要求品牌时，请填写品牌名称'); form.elements.contractBrand.focus(); return; }
    submit.disabled = true; submit.textContent = '保存中…';
    const existing = resourcePlans.find(plan => Number(plan.id) === Number(editingResourcePlanId));
    const newApprovalFiles = type === 'material' ? await prepareResourceAttachments(form.elements.approvalFiles.files) : [];
    const approvalOwners = type === 'material' ? [
      ['提报人', data.get('requester')], ['生产经理', data.get('productionApprover')], ['技术负责人', data.get('technicalApprover')],
      ['库管', data.get('storekeeperApprover')], ['项目经理', data.get('projectManagerApprover')]
    ] : [];
    const approvalWorkflow = approvalOwners.map(([role, owner]) => {
      const previous = existing?.approvalWorkflow?.find(step => step.role === role && step.owner === owner);
      const ownerId = organization.find(person => `${person.name} · ${person.role}` === owner)?.id || '';
      if (role === '提报人') return { ...(previous || {}), role, owner, ownerId, status: 'approved', actedAt: previous?.actedAt || existing?.createdAt || new Date().toISOString(), actedBy: previous?.actedBy || owner, actedByAccount: previous?.actedByAccount || '' };
      return previous?.status === 'approved' ? { ...previous, ownerId } : { role, owner, ownerId, status: 'pending' };
    });
    const planData = {
      type, name: data.get('name'), quantity: data.get('quantity'), due: data.get('due'), location: data.get('location'), owner: data.get('owner'), ownerRole: data.get('ownerRole'),
      requester: type === 'material' ? data.get('requester') : '', purchaser: type === 'material' ? data.get('purchaser') : '',
      contractBrandRequired: type === 'material' && data.get('contractBrandRequired') === 'yes', contractBrand: type === 'material' ? String(data.get('contractBrand') || '').trim() : '',
      approvalAttachments: type === 'material' ? [...(existing?.approvalAttachments || []), ...newApprovalFiles] : [], approvalWorkflow: markRequesterApproval(approvalWorkflow, existing || {}),
      updatedAt: new Date().toISOString()
    };
    if (existing) resourcePlans = resourcePlans.map(plan => Number(plan.id) === Number(existing.id) ? { ...plan, ...planData } : plan);
    else resourcePlans.unshift({ id: Date.now(), ...planData, createdAt: new Date().toISOString() });
    const savedPlan = existing ? resourcePlans.find(plan => Number(plan.id) === Number(existing.id)) : resourcePlans[0];
    const notification = type === 'material' ? syncMaterialApprovalNotifications(savedPlan) : { notifiedOwner: '' };
    reconcileResourcePlans(); persistResources(); persistFollowups(); form.reset(); editingResourcePlanId = null; $('#resourcePlanDialog').close(); activeResourceTab = 'plans'; if ($('#materials').classList.contains('active')) renderSubview('materials'); submit.disabled = false; submit.textContent = '保存资源计划';
    showToast(type === 'material' ? (notification.purchaseOpened ? `材料计划审批状态已保持，采购端已通知${notification.notifiedOwner}` : `材料计划已提交，平台已通知${notification.notifiedOwner}审批；采购端暂不可见`) : '设备计划已保存，将从要求到场前 7 天开始提示');
  });
  $('#concealedAcceptanceForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form); const submit = form.querySelector('[type="submit"]');
    const existing = concealedAcceptances.find(item => Number(item.id) === Number(editingConcealedAcceptanceId));
    const newDocumentFiles = [...form.elements.documentFiles.files];
    const newPhotoFiles = [...form.elements.photoFiles.files];
    const documentCount = (existing?.documentAttachments?.length || 0) + newDocumentFiles.length;
    const photoCount = (existing?.photoAttachments?.length || 0) + newPhotoFiles.length;
    if (data.get('status') === 'qualified' && (!documentCount || !photoCount)) { showToast('验收合格前需同时上传隐蔽验收资料和现场照片'); return; }
    submit.disabled = true; submit.textContent = '保存中…';
    const [documents, photos] = await Promise.all([prepareResourceAttachments(newDocumentFiles), prepareResourceAttachments(newPhotoFiles)]);
    const record = {
      id: existing?.id || Date.now(), title: data.get('title'), processType: data.get('processType'), location: data.get('location'), date: data.get('date'),
      owner: data.get('owner'), witness: data.get('witness'), linkedProcess: data.get('linkedProcess'), status: data.get('status'), conclusion: data.get('conclusion'),
      documentAttachments: [...(existing?.documentAttachments || []), ...documents], photoAttachments: [...(existing?.photoAttachments || []), ...photos], updatedAt: new Date().toISOString()
    };
    if (existing) concealedAcceptances = concealedAcceptances.map(item => Number(item.id) === Number(existing.id) ? record : item);
    else concealedAcceptances.unshift(record);
    persistConcealedAcceptances(); renderDocumentSummary(); form.reset(); editingConcealedAcceptanceId = null; $('#concealedAcceptanceDialog').close(); submit.disabled = false; submit.textContent = '保存隐蔽验收';
    if ($('#documents').classList.contains('active')) renderSubview('documents');
    showToast(record.status === 'qualified' ? `隐蔽验收已合格，${record.linkedProcess}已放行` : `隐蔽验收已保存，${record.linkedProcess}保持待放行`);
  });
  $('#resourceEntryForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    const type = form.elements.resourceType.value || 'material';
    const rows = $$('#resourceEntryBatchRows [data-resource-entry-row]');
    if (!rows.length) { showToast('请至少添加一条到场记录'); return; }
    submit.disabled = true;
    submit.textContent = '批量保存中…';
    const previousEntries = resourceEntries;
    let batchSaved = false;
    try {
      const entries = [];
      for (const [index, row] of rows.entries()) {
        const receiptFiles = [...($('[data-resource-entry-receipt]', row)?.files || [])];
        const certificateFiles = [...($('[data-resource-entry-certificates]', row)?.files || [])];
        const photoFiles = [...($('[data-resource-entry-photos]', row)?.files || [])];
        const movement = $('[data-resource-entry-movement]', row).value;
        if (type === 'material' && movement === '进场' && (!receiptFiles.length || !photoFiles.length)) {
          showToast(`第 ${index + 1} 条材料必须上传收货单和到场/验收照片`);
          return;
        }
        if (photoFiles.some(file => !file.type.startsWith('image/'))) { showToast(`第 ${index + 1} 条请上传真实的到场或验收照片`); return; }
        const [receiptAttachments, documentAttachments, photoAttachments] = await Promise.all([
          prepareMaterialProofAttachments(receiptFiles),
          prepareMaterialProofAttachments(certificateFiles),
          prepareMaterialProofAttachments(photoFiles)
        ]);
        const attachments = [...receiptAttachments, ...photoAttachments, ...documentAttachments];
        const entry = {
          id: Date.now() + index,
          type,
          name: $('[data-resource-entry-name]', row).value.trim(),
          category: $('[data-resource-entry-category]', row).value,
          brand: $('[data-resource-entry-brand]', row).value.trim(),
          spec: $('[data-resource-entry-spec]', row).value.trim(),
          movement,
          arrivalTime: $('[data-resource-entry-arrival]', row).value,
          quantity: $('[data-resource-entry-quantity]', row).value.trim(),
          location: $('[data-resource-entry-location]', row).value.trim(),
          note: $('[data-resource-entry-note]', row).value.trim(),
          receiptAttachments,
          photoAttachments,
          documentAttachments,
          attachments
        };
        const selectedPlanId = Number($('[data-resource-entry-plan]', row).value);
        const linkedPlan = selectedPlanId ? resourcePlans.find(plan => Number(plan.id) === selectedPlanId) : findBestResourcePlan(entry);
        if (linkedPlan && entry.movement === '进场') entry.planId = linkedPlan.id;
        entries.push(entry);
      }
      if (entries.some(entry => !entry.name || !entry.brand || !entry.spec || !entry.quantity || !entry.location || !entry.arrivalTime)) {
        showToast('请完整填写每条材料或设备到场记录');
        return;
      }
      resourceEntries = [...entries.slice().reverse(), ...resourceEntries];
      persistMaterialEntries();
      batchSaved = true;
      const materialEntries = entries.filter(entry => entry.type === 'material' && entry.movement === '进场');
      materialEntries.forEach(entry => ensureMaterialDocumentChain(entry));
      if (materialEntries.length) persistDocumentState();
      reconcileResourcePlans();
      persistResources();
      if (materialEntries.length) {
        const clerk = matchPersonByRole('资料员');
        materialEntries.forEach((entry, index) => {
          if (!clerk) return;
          upsertMaterialReviewFollowup(entry, clerk, `核查${entry.name}进场资料是否齐全`, `请核查收货单、到场照片、合格证及其他资料，并确认取样送检要求。当前附件 ${(entry.attachments || []).length} 个。`, index + 1);
        });
        persistFollowups();
      }
      form.reset();
      resourceEntryBatchDraft = [];
      $('#resourceEntryDialog').close();
      activeResourceTab = type === 'material' ? 'materials' : 'equipment';
      if ($('#materials').classList.contains('active')) renderSubview('materials');
      const planCount = entries.filter(entry => entry.planId).length;
      const planMessage = planCount ? `，其中 ${planCount} 条已关联到场计划` : '';
      showToast(`${entries.length} 条${type === 'material' ? '材料进场' : '设备进出场'}记录已保存${planMessage}`);
    } catch (error) {
      if (!batchSaved) resourceEntries = previousEntries;
      else { $('#resourceEntryDialog').close(); if ($('#materials').classList.contains('active')) renderSubview('materials'); }
      showToast(batchSaved ? '台账和附件已保存，部分联动未完成；请从台账查看，勿重复登记' : `登记未完成，已保留表单和原附件：${error.message || '请重试'}`);
    } finally {
      submit.disabled = false;
      submit.textContent = '保存登记';
    }
  });
  $('#materialDocumentReviewForm').addEventListener('submit', async event => {
    event.preventDefault();
    await saveMaterialDocumentReview(event.currentTarget);
  });
  $('#followupForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    followups.unshift({ id: Date.now(), category: data.get('category'), title: data.get('title'), requester: data.get('requester'), owner: data.get('owner'), zone: data.get('zone'), due: data.get('due'), urgency: data.get('urgency'), relatedTask: data.get('relatedTask'), note: data.get('note'), status: 'pending', reminders: 1, createdAt: new Date().toISOString() });
    persistFollowups();
    form.reset();
    $('#followupDialog').close();
    if ($('#followups').classList.contains('active')) renderSubview('followups');
    showToast(`已向${data.get('owner')}发起${data.get('urgency') === 'urgent' ? '紧急' : '一般'}催办`);
  });
  $('#logForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const submitButton = form.querySelector('[type="submit"]');
    const photoCount = selectedPhotos.length;
    submitButton.disabled = true;
    submitButton.textContent = '保存中…';
    try {
      const photos = [];
      for (const photo of selectedPhotos) {
        if (window.ZhuxuServer?.active && photo.data) {
          try {
            const blob = await (await fetch(photo.data)).blob();
            const uploaded = await window.ZhuxuServer.uploadAttachment(new File([blob], photo.name || '现场照片.jpg', { type: 'image/jpeg' }));
            photos.push({ name: uploaded.name, type: uploaded.type, size: uploaded.size, storageKey: uploaded.storageKey, stored: true });
          } catch (error) {
            photos.push({ name: photo.name || '现场照片.jpg', type: 'image/jpeg', size: 0, data: photo.data, stored: true });
          }
        } else {
          photos.push({ ...photo, stored: false });
        }
      }
      const record = { id: Date.now(), type: data.get('type'), content: data.get('content'), createdAt: new Date().toISOString(), photos };
      siteRecords.unshift(record);
      if (siteRecords.length > 300) siteRecords.length = 300;
      persistSiteRecords();
      try { await saveSiteRecord(record); } catch (error) {}
      form.reset();
      selectedPhotos = [];
      renderSelectedPhotos();
      $('#logDialog').close();
      showToast(`${data.get('type')}记录已保存${photoCount ? `，含 ${photoCount} 张照片` : ''}`);
    } catch (error) {
      showToast('保存失败，请重试');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = '保存记录';
    }
  });
  $$('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog && dialog.id !== 'passwordChangeDialog') dialog.close(); }));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
else initializeApp();
