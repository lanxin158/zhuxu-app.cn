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
let safetyInspections = JSON.parse(localStorage.getItem('zhuxu-safety-inspections') || 'null') || (serverMode ? [] : defaultSafetyInspections);
let siteRecords = JSON.parse(localStorage.getItem('zhuxu-site-records') || 'null') || [];
let intakeRecords = JSON.parse(localStorage.getItem('zhuxu-intake-records') || 'null') || (serverMode ? [] : defaultIntakeRecords);
let technicalDocuments = JSON.parse(localStorage.getItem('zhuxu-technical-documents') || 'null') || (serverMode ? [] : defaultTechnicalDocuments);
technicalDocuments = technicalDocuments.map(item => ({ ...item, building: item.building || technicalBuildingName(item) }));
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
let activeCostFilter = 'all';
let activeExecutionDate = dailyDateKey;
let editingResourcePlanId = null;
let editingConcealedAcceptanceId = null;
let editingQualityId = null;
let editingInspectionId = null;
let editingTaskId = null;
let editingPlanId = null;
let editingIntakeId = null;
let planRecognitionCandidates = [];
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
}

function persistOrganization() { localStorage.setItem('zhuxu-organization', JSON.stringify(organization)); syncServerState('zhuxu-organization', organization); }
function persistPlans() { localStorage.setItem('zhuxu-plans', JSON.stringify(plans)); syncServerState('zhuxu-plans', plans); }
function persistResources() {
  localStorage.setItem('zhuxu-resource-entries', JSON.stringify(resourceEntries));
  localStorage.setItem('zhuxu-resource-plans', JSON.stringify(resourcePlans));
  syncServerState('zhuxu-resource-entries', resourceEntries);
  syncServerState('zhuxu-resource-plans', resourcePlans);
}
function persistConcealedAcceptances() { localStorage.setItem('zhuxu-concealed-acceptances', JSON.stringify(concealedAcceptances)); syncServerState('zhuxu-concealed-acceptances', concealedAcceptances); }
function persistQualityChecks() { localStorage.setItem('zhuxu-quality-checks', JSON.stringify(qualityChecks)); syncServerState('zhuxu-quality-checks', qualityChecks); }
function persistAttendance() { localStorage.setItem('zhuxu-attendance', JSON.stringify(attendanceRecords)); syncServerState('zhuxu-attendance', attendanceRecords); }
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
function persistCostDocuments() {
  if (authenticatedUserId && !hasCostAccess()) { updateCostAccessUI(); return; }
  localStorage.setItem('zhuxu-cost-documents', JSON.stringify(costDocuments));
  syncServerState('zhuxu-cost-documents', costDocuments);
  if ($('#costBadge')) $('#costBadge').textContent = costDocuments.length;
}
function persistDailyExecution() { localStorage.setItem('zhuxu-daily-execution', JSON.stringify(dailyExecution)); syncServerState('zhuxu-daily-execution', dailyExecution); }
function persistDailyCoordination() { localStorage.setItem('zhuxu-daily-coordination', JSON.stringify(dailyCoordination)); syncServerState('zhuxu-daily-coordination', dailyCoordination); updateDailyBadge(); }
function updateDailyBadge() { if ($('#dailyBadge')) $('#dailyBadge').textContent = dailyCoordination.filter(item => item.status !== 'resolved').length; }

function ensureMaterialDocumentChain(entry) {
  if (!entry || entry.type !== 'material' || entry.movement !== '进场') return null;
  let key = Object.keys(documentState).find(item => Number(documentState[item].materialEntryId) === Number(entry.id));
  if (!key) {
    key = `material-${entry.id}`;
    const resultId = `${key}-report`;
    documentState[key] = { sampleStatus: 'testing', linkedProcess: `${entry.location}关联施工`, materialEntryId: entry.id, commissionAttachments: [], reportAttachments: [], documents: [
      { id: `${key}-certificate`, name: `${entry.name}合格证明`, trigger: `${entry.name}进场`, owner: '材料员', due: '进场当日', status: entry.attachments?.length ? 'done' : 'pending' },
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

function renderCurrentUser() {
  const person = getCurrentUser();
  if (!person || !$('#currentUserCard')) return;
  $('#currentUserAvatar').textContent = person.name.slice(0, 1);
  $('#currentUserName').textContent = person.name;
  $('#currentUserRole').textContent = person.role;
  $('#accountSwitcherButton').title = `当前账号：${person.account || person.name}，点击退出`;
  updateCostAccessUI();
  updateAccountPermissionUI();
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
  $('#followupBadge').textContent = pending;
  $('#notificationButton b').textContent = Math.min(99, pending + 1);
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
  $('#taskBadge').textContent = tasks.filter(t => t.status !== 'done').length;
  $('#completionSegments').innerHTML = tasks.map(t => `<i class="${t.status}"></i>`).join('');
}

const subviews = {
  intake: { title: '每日任务执行中心', desc: '把日计划落实到管理人员和班组，同时跟踪技术、材料、资料、质量安全及需协调事项', action: '记录施工反馈', content: 'intake' },
  schedule: { title: '进度计划', desc: '总计划逐级分解到月、周和每日执行事项', action: '新建计划', content: 'schedule' },
  technical: { title: '技术文件', desc: '图纸、设计变更、联系函和指令单统一共享，关联任务后完成线上交底', action: '上传技术文件', content: 'technical' },
  cost: { title: '成控文件', desc: '合同、经济核定单和现场工程量确认单统一归档，形成过程成本依据', action: '新增成控文件', content: 'cost' },
  tasks: { title: '任务协同', desc: '把每项工作落实到区域、人员和完成标准', action: '新建任务', content: 'table' },
  followups: { title: '协作催办', desc: '资料员和管理人员可以对缺失资料、前置工序及现场配合发起催办', action: '发起催办', content: 'followups' },
  materials: { title: '材料与设备', desc: '材料、设备分别建账，并用资源计划提前暴露供需缺口', action: '登记资源', content: 'resources' },
  documents: { title: '资料完成情况', desc: '让材料、送检、验收资料成为施工进度的放行条件', action: '登记资料结果', content: 'documents' },
  quality: { title: '质量安全', desc: '问题发现、整改、复验全程留痕', action: '新增检查', content: 'quality' },
  team: { title: '组织架构', desc: '明确项目管理人员职责，并用每日实名制考勤掌握现场投入', action: '编辑管理人员', content: 'team' },
  analytics: { title: '效率分析', desc: '从工时、等待和返工中寻找改进空间', action: '导出报告', content: 'analytics' }
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

function getPlanExecutionRecord(plan) {
  return dailyExecution.find(item => Number(item.dayPlanId) === Number(plan.id))
    || dailyExecution.find(item => Number(item.taskId) === Number(plan.taskId) && item.date === plan.start);
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
  return `<article class="plan-row${isDay ? ' day-plan-row' : ''}${isWeek ? ' week-plan-row' : ''}"><div><strong>${escapeHtml(plan.title)}</strong><small>来源：${escapeHtml(plan.source || '手工新建')}${parent ? ` · 所属周计划：${escapeHtml(parent.title)}` : ''}</small></div>${metaColumns}<button class="edit-action" data-edit-plan="${plan.id}">编辑计划</button></article>`;
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

function renderScheduleBody() {
  const levels = { master: '总计划', month: '月计划', week: '周计划', day: '日计划' };
  const visiblePlans = plans.filter(plan => plan.level === activePlanLevel);
  const content = !visiblePlans.length
    ? '<div class="resource-empty">当前层级还没有计划，点击“新建计划”添加</div>'
    : activePlanLevel === 'day'
      ? renderDailyPlanGroups(visiblePlans)
      : `<div class="plan-list">${visiblePlans.map(plan => renderPlanRow(plan)).join('')}</div>`;
  return `<div class="plan-level-tabs" role="tablist" aria-label="计划层级">${Object.entries(levels).map(([key, label]) => `<button type="button" class="${key === activePlanLevel ? 'active' : ''}" data-plan-level="${key}">${label}<b>${plans.filter(plan => plan.level === key).length}</b></button>`).join('')}</div>${content}`;
}

function updatePlanParentField(selectedParentId = '') {
  const form = $('#planForm');
  const isDay = form.elements.level.value === 'day';
  const field = $('#parentWeekPlanField');
  field.hidden = !isDay;
  const start = form.elements.start.value || dailyDateKey;
  const weekPlans = plans.filter(plan => plan.level === 'week' && plan.start <= start && plan.end >= start);
  form.elements.parentId.innerHTML = `<option value="">系统按日期自动匹配</option>${weekPlans.map(plan => `<option value="${plan.id}">${escapeHtml(plan.title)} · ${plan.start}—${plan.end}</option>`).join('')}`;
  if (selectedParentId && weekPlans.some(plan => Number(plan.id) === Number(selectedParentId))) form.elements.parentId.value = String(selectedParentId);
}

function updatePlanFields() {
  const form = $('#planForm');
  const level = form.elements.level.value;
  const isDay = level === 'day';
  const isDayOrWeek = isDay || level === 'week';
  $('#planOwnerRoleField').hidden = isDayOrWeek;
  $('#planOwnersField').hidden = !isDayOrWeek;
  $('#planTeamField').hidden = !isDayOrWeek;
  $('#planDailyTargetField').hidden = !isDay;
}

function openPlanDialog(plan = null) {
  const form = $('#planForm');
  form.reset();
  editingPlanId = plan?.id || null;
  planRecognitionCandidates = [];
  renderPlanRecognitionCandidates();
  setPlanMode('manual');
  form.elements.level.value = plan?.level || activePlanLevel;
  form.elements.title.value = plan?.title || '';
  form.elements.start.value = plan?.start || new Date().toISOString().slice(0, 10);
  form.elements.end.value = plan?.end || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  form.elements.ownerRole.value = plan?.ownerRole || '生产经理';
  form.elements.owners.value = Array.isArray(plan?.owners) ? plan.owners.join('、') : (plan?.owners || '');
  form.elements.team.value = plan?.team || '';
  form.elements.dailyTarget.value = plan?.dailyTarget ?? 100;
  updatePlanParentField(plan?.parentId || '');
  updatePlanFields();
  $('#planDialog .dialog-heading h2').textContent = plan ? '编辑并更新计划' : '新建或导入计划';
  $('#planDialog').showModal();
}

function setPlanMode(mode) {
  $$('[data-plan-mode]').forEach(button => button.classList.toggle('active', button.dataset.planMode === mode));
  $('#planImportPanel').hidden = mode !== 'import';
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
  const types = [['all','全部'],['drawing','施工图纸'],['change','设计变更'],['contact','联系函'],['instruction','指令单']];
  const professionTabs = [['all','全部'], ...DRAWING_PROFESSIONS.map(profession => [profession, profession]), ['其他','其他']];
  const drawings = technicalDocuments.filter(item => item.type === 'drawing');
  const drawingFolders = [...new Set(drawings.map(technicalBuildingName))].sort((a,b) => a.localeCompare(b,'zh-CN'));
  const visible = technicalDocuments.filter(item => {
    if (activeTechnicalFilter !== 'all' && item.type !== activeTechnicalFilter) return false;
    if (activeTechnicalFilter === 'drawing' && activeTechnicalBuilding !== 'all' && technicalBuildingName(item) !== activeTechnicalBuilding) return false;
    if (activeTechnicalFilter === 'drawing' && activeTechnicalBuilding !== 'all' && activeTechnicalProfession !== 'all' && professionLabel(item.profession) !== activeTechnicalProfession) return false;
    return activeTechnicalFilter !== 'drawing' || activeTechnicalBuilding !== 'all';
  }).sort((a,b) => String(b.issuedAt).localeCompare(String(a.issuedAt)));
  const drawingBrowser = activeTechnicalFilter === 'drawing' ? `<section class="technical-building-browser"><div class="technical-building-heading"><div><span>DRAWING ARCHIVE</span><strong>按单体查看施工图</strong><small>单体文件夹内按结构、建筑、暖通、采暖、给排水、电气、消防分专业；支持直接上传整个图纸文件夹</small></div>${activeTechnicalBuilding !== 'all' ? `<button type="button" data-technical-building="all">← 返回全部单体</button>` : ''}</div><div class="technical-building-folders">${drawingFolders.map(building => { const items = drawings.filter(item => technicalBuildingName(item) === building); const latest = [...items].sort((a,b) => String(b.issuedAt).localeCompare(String(a.issuedAt)))[0]; const professionSummary = [...new Set(items.map(item => professionLabel(item.profession)))].slice(0, 3).map(profession => `${profession} ${items.filter(item => professionLabel(item.profession) === profession).length}`).join(' · '); return `<button type="button" class="${activeTechnicalBuilding === building ? 'active' : ''}" data-technical-building="${escapeHtml(building)}"><i><span></span></i><strong>${escapeHtml(building)}</strong><small>${items.length} 张施工图 · ${professionSummary || '尚未按专业分类'}</small><em>打开文件夹 →</em></button>`; }).join('') || '<div class="resource-empty">还没有施工图文件夹，可在“上传”中选择文件夹或上传图纸时填写所属单体后自动建立。</div>'}</div>${activeTechnicalBuilding === 'all' && drawingFolders.length ? '<p class="technical-folder-hint">请选择一个单体文件夹查看其中的施工图。</p>' : ''}${activeTechnicalBuilding !== 'all' ? `<div class="technical-profession-tabs" role="tablist" aria-label="施工图专业分类">${professionTabs.map(([key,label]) => `<button type="button" role="tab" aria-selected="${key === activeTechnicalProfession}" class="${key === activeTechnicalProfession ? 'active' : ''}" data-technical-profession="${key}">${label}<b>${key === 'all' ? drawings.filter(item => technicalBuildingName(item) === activeTechnicalBuilding).length : drawings.filter(item => technicalBuildingName(item) === activeTechnicalBuilding && professionLabel(item.profession) === key).length}</b></button>`).join('')}</div>` : ''}</section>` : '';
  return `<section class="technical-file-overview"><div><span>TECHNICAL FILE REGISTER</span><h2>项目技术文件统一入口</h2><p>技术负责人上传原文件并注明适用部位，现场人员可随时查看；关联任务中的变更和指令会突出风险提醒。</p></div><div>${types.slice(1).map(([key,label]) => `<button type="button" class="${activeTechnicalFilter === key ? 'active' : ''}" data-technical-overview-filter="${key}"><strong>${technicalDocuments.filter(item => item.type === key).length}</strong><span>${label}</span><em>${key === 'drawing' ? '打开单体文件夹' : '直接查看文件'} →</em></button>`).join('')}</div></section>
    <div class="technical-file-tabs">${types.map(([key,label]) => `<button type="button" class="${activeTechnicalFilter === key ? 'active' : ''}" data-technical-filter="${key}">${label}<b>${key === 'all' ? technicalDocuments.length : technicalDocuments.filter(item => item.type === key).length}</b></button>`).join('')}</div>
    ${drawingBrowser}
    ${activeTechnicalFilter === 'drawing' && activeTechnicalBuilding === 'all' ? '' : `<section class="technical-file-register"><div class="technical-file-row header"><span>类别 / 编号</span><span>文件名称与适用范围</span><span>发布人</span><span>发布日期</span><span>原文件</span><span>操作</span></div>${visible.map(item => `<button type="button" class="technical-file-row" data-technical-document="${item.id}"><span><i class="${item.type}">${technicalTypeLabels[item.type]?.slice(0,1) || '技'}</i><b>${escapeHtml(technicalTypeLabels[item.type] || item.type)}${item.profession ? ` · ${escapeHtml(item.profession)}` : ''}</b><small>${escapeHtml(item.code)}</small></span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(technicalBuildingName(item))}${item.profession ? ` · ${escapeHtml(item.profession)}` : ''} · ${escapeHtml(item.scope)}</small></span><span>${escapeHtml(item.issuedBy)}</span><span>${escapeHtml(item.issuedAt)}</span><span>${(item.files || []).length} 个附件</span><em>${item.type === 'drawing' ? '打开图纸' : '查看内容'} →</em></button>`).join('') || '<div class="resource-empty">当前类别还没有技术文件，点击右上角上传；施工图纸可通过“上传图纸文件夹”批量归档。</div>'}</section>`}`;
}

function openTechnicalDocumentDialog() {
  const form = $('#technicalDocumentForm');
  form.reset();
  form.elements.issuedBy.value = matchPersonByRole('技术负责人');
  form.elements.issuedAt.value = dailyDateKey;
  $('#professionField').hidden = form.elements.type.value !== 'drawing';
  $('#technicalDocumentDialog').showModal();
}

async function importDrawingFolder(files) {
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
    const building = (segments[0] || '').trim() || '综合图纸';
    let profession = segments[1] && DRAWING_PROFESSIONS.includes(segments[1].trim()) ? segments[1].trim() : '';
    if (!profession) profession = detectProfession(`${fileName} ${building} ${segments.join(' ')}`);
    const title = fileName.replace(/\.[^.]+$/, '');
    try {
      const attachments = await prepareResourceAttachments([file]);
      created.push({ id: Date.now() + index + 1, type: 'drawing', code: '', title, building, profession, issuedBy: currentOperatorLabel(), issuedAt: dailyDateKey, scope: `${building}${profession ? ` · ${profession}` : ''}`, content: `图纸文件：${rel}\n单体：${building}${profession ? `\n专业：${profession}` : ''}`, files: attachments, status: 'valid', createdAt: new Date().toISOString(), createdBy: currentOperatorLabel(), fromFolder: true });
    } catch (error) { /* 单个文件导入失败时跳过 */ }
  }
  technicalDocuments.unshift(...created);
  persistTechnicalDocuments();
  if (stateEl) { stateEl.textContent = `已导入 ${created.length} 个图纸文件${created.length !== items.length ? `（跳过 ${items.length - created.length} 个）` : ''}`; stateEl.classList.remove('working'); }
  if (created.length) showToast(`已按单体/专业导入 ${created.length} 张施工图`);
  return created.length;
}

function openTechnicalDocumentDetail(documentId) {
  const documentItem = technicalDocuments.find(item => Number(item.id) === Number(documentId));
  if (!documentItem) return;
  $('#technicalDocumentDetailType').textContent = `${technicalTypeLabels[documentItem.type] || '技术文件'} · ${documentItem.code}`;
  $('#technicalDocumentDetailTitle').textContent = documentItem.title;
  $('#technicalDocumentDetailBody').innerHTML = `<section class="technical-document-paper"><div class="technical-document-stamp ${documentItem.type}"><span>${technicalTypeLabels[documentItem.type] || '技术文件'}</span><strong>${escapeHtml(documentItem.code)}</strong></div><h3>${escapeHtml(documentItem.title)}</h3><p>${escapeHtml(documentItem.content)}</p><dl><div><dt>所属单体 / 分区</dt><dd>${escapeHtml(technicalBuildingName(documentItem))}</dd></div><div><dt>适用部位</dt><dd>${escapeHtml(documentItem.scope)}</dd></div><div><dt>发布人</dt><dd>${escapeHtml(documentItem.issuedBy)}</dd></div><div><dt>发布日期</dt><dd>${escapeHtml(documentItem.issuedAt)}</dd></div><div><dt>文件状态</dt><dd>现行有效</dd></div></dl></section><section class="technical-document-files"><strong>${documentItem.type === 'drawing' ? '施工图原文件' : '上传的原文件'} · ${(documentItem.files || []).length}</strong>${(documentItem.files || []).map((file,index) => `<button type="button" data-technical-detail-file="${index}"><i>${attachmentKind(file) === 'pdf' ? 'PDF' : attachmentKind(file) === 'image' ? 'IMG' : 'FILE'}</i><span><b>${escapeHtml(file.name)}</b><small>${file.stored ? '点击直接在线查看原文件' : '示例文件名；重新上传后可在线查看'}</small></span><em>${documentItem.type === 'drawing' ? '打开图纸' : '查看'}</em></button>`).join('') || '<p>尚未上传原文件</p>'}</section>`;
  $$('[data-technical-detail-file]', $('#technicalDocumentDetailBody')).forEach(button => button.addEventListener('click', () => previewStoredAttachment((documentItem.files || [])[Number(button.dataset.technicalDetailFile)])));
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
    const categories = [...new Set(entries.map(item => item.category))];
    content = `${type === 'material' ? `<div class="resource-category-strip">${categories.map(category => `<span><b>${category}</b>${entries.filter(item => item.category === category).length} 批</span>`).join('')}</div>` : ''}<div class="resource-list"><div class="resource-row header"><span>名称 / 分类</span><span>品牌 / 厂家</span><span>规格型号</span><span>进出场时间</span><span>使用部位</span><span>资料附件</span></div>${entries.map(item => `<button type="button" class="resource-row resource-row-button" data-resource-entry-detail="${item.id}"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)} · ${item.movement}${item.planId ? ' · 已关联计划' : ''}</small></div><span>${escapeHtml(item.brand)}</span><span>${escapeHtml(item.spec)}</span><span>${new Date(item.arrivalTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span><span>${escapeHtml(item.location)}</span><span class="attachment-count">${item.attachments?.length || 0} 个附件 · 查看</span></button>`).join('') || '<div class="resource-empty">还没有登记记录</div>'}</div>`;
  }
  return `<div class="resource-toolbar"><div class="resource-tabs">${tabs.map(([key, label, count]) => `<button type="button" class="${key === activeResourceTab ? 'active' : ''}" data-resource-tab="${key}">${label}<b>${count}</b></button>`).join('')}</div><div class="resource-toolbar-actions">${activeResourceTab !== 'procurement' ? '<button class="resource-register-button" data-new-resource-plan>新增资源计划</button>' : ''}${activeResourceTab !== 'plans' && activeResourceTab !== 'procurement' ? `<button class="resource-register-button primary" data-register-resource="${activeResourceTab === 'materials' ? 'material' : 'equipment'}">登记${activeResourceTab === 'materials' ? '材料' : '设备'}进出场</button>` : ''}</div></div>${content}`;
}

function populateResourcePlanRoles(type = 'material') {
  const select = $('#resourcePlanOwnerRole');
  const roles = [...new Set(organization.map(person => person.role))];
  select.innerHTML = roles.map(role => `<option>${escapeHtml(role)}</option>`).join('');
  const preferred = type === 'material' ? '材料员' : '设备管理员';
  select.value = roles.includes(preferred) ? preferred : roles[0];
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
  if (plan?.ownerRole) form.elements.ownerRole.value = plan.ownerRole;
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

function populateResourcePlanMatches(type, selectedId = '') {
  const select = $('#resourcePlanMatch');
  const candidates = resourcePlans.filter(plan => plan.type === type && !getResourcePlanProgress(plan).complete);
  select.innerHTML = `<option value="">系统自动匹配最接近的未完成计划</option>${candidates.map(plan => {
    const progress = getResourcePlanProgress(plan);
    return `<option value="${plan.id}" ${String(plan.id) === String(selectedId) ? 'selected' : ''}>${escapeHtml(plan.name)}｜${escapeHtml(plan.location)}｜余 ${formatResourceQuantity(progress.remaining, progress.planned.unit)}</option>`;
  }).join('')}`;
  select.dataset.manual = selectedId ? 'true' : 'false';
}

function updateResourcePlanRecommendation() {
  const form = $('#resourceEntryForm');
  if ($('#resourcePlanMatch').dataset.manual === 'true') return;
  const draft = { type: form.elements.resourceType.value, name: form.elements.name.value, location: form.elements.location.value };
  const match = findBestResourcePlan(draft);
  $('#resourcePlanMatch').value = match?.id || '';
  $('#resourcePlanMatchHint').textContent = match ? `系统推荐：${match.name}（${match.location}），可手动修改` : '暂未找到高匹配计划，可继续填写或手动选择';
}

function openResourceEntryDialog(type) {
  const form = $('#resourceEntryForm');
  form.reset();
  form.elements.resourceType.value = type;
  $('#resourceEntryEyebrow').textContent = type === 'material' ? '材料进场登记' : '设备进出场登记';
  $('#resourceEntryTitle').textContent = type === 'material' ? '登记材料进场' : '登记设备进出场';
  $('#certificateLabel').firstChild.textContent = type === 'material' ? '合格证、检测报告或备案资料' : '设备备案证、检测报告或验收资料';
  const categories = type === 'material' ? ['钢材', '水泥及混凝土', '砌体材料', '防水材料', '装饰材料', '机电材料', '其他材料'] : ['起重设备', '垂直运输设备', '土方机械', '混凝土设备', '临时用电设备', '检测设备', '其他设备'];
  $('#resourceCategory').innerHTML = categories.map(category => `<option>${category}</option>`).join('');
  populateResourcePlanMatches(type);
  $('#resourcePlanMatchHint').textContent = '填写名称和使用部位后，系统会推荐对应计划；也可手动选择';
  form.elements.arrivalTime.value = defaultDueValue();
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
  return entry.attachments.map((file, index) => {
    const kind = attachmentKind(file);
    const ready = Boolean(file.stored && (file.storageKey || file.data));
    return `<button type="button" class="resource-attachment-button ${ready ? '' : 'unavailable'}" data-attachment-entry="${entry.id}" data-attachment-index="${index}"><i>${kind === 'image' ? 'IMG' : kind === 'pdf' ? 'PDF' : 'FILE'}</i><div><strong>${escapeHtml(file.name)}</strong><small>${ready ? `${formatAttachmentSize(file.size)} · 点击查看原文件` : '早期示例记录未保存原文件，请重新上传'}</small></div><b>${ready ? '查看' : '未存原件'}</b></button>`;
  }).join('');
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
  const materialSections = plan.type === 'material' ? `<section class="contract-brand-panel"><div><span>合同品牌要求</span><strong>${plan.contractBrandRequired ? `是 · ${escapeHtml(plan.contractBrand || '待填写品牌')}` : '否 · 合同未指定品牌'}</strong></div><button type="button" data-edit-resource-plan="${plan.id}">编辑品牌与审批</button></section><section class="material-approval-panel"><div class="approval-panel-heading"><div><strong>材料审批流程</strong><small>提报人 → 生产经理 → 技术负责人 → 库管 → 项目经理，逐级通知</small></div><em class="approval-overall ${approvalState}">${approvalLabel}</em></div><div class="approval-viewer"><span>当前登录</span><strong>${escapeHtml(viewerLabel || '未识别账号')}</strong><small>${currentApproval ? (isCurrentUserApprovalOwner(currentApproval) ? '当前审批已分配给你' : '可查看完整进度，不能代替他人审批') : '当前没有待审批节点'}</small></div><div class="approval-flow">${approvalFlow}</div><div class="approval-attachments"><strong>材料审批表 · ${plan.approvalAttachments?.length || 0}</strong>${renderStoredFileList(plan.approvalAttachments || [], '尚未上传材料审批表')}</div></section>${purchaseAccess}` : '';
  $('#resourceDetailBody').innerHTML = `<section class="resource-detail-hero ${progress.tone}"><div><span>${progress.status}</span><strong>${progress.percent}%</strong></div><p>${progress.notice}</p><i><em style="width:${progress.percent}%"></em></i></section><div class="resource-detail-grid">${resourceDetailItem('资源类型', plan.type === 'material' ? '材料' : '设备')}${resourceDetailItem('计划数量', escapeHtml(plan.quantity))}${resourceDetailItem('累计到场', formatResourceQuantity(progress.arrived, progress.planned.unit))}${resourceDetailItem('未到数量', formatResourceQuantity(progress.remaining, progress.planned.unit))}${resourceDetailItem('要求到场', plan.due)}${resourceDetailItem('使用部位', escapeHtml(plan.location))}${resourceDetailItem('责任岗位', escapeHtml(plan.ownerRole))}${resourceDetailItem('提前预报', '要求到场前 7 天')}</div>${materialSections}<section class="resource-arrival-history"><strong>关联到场记录 · ${progress.linkedEntries.length} 批</strong>${progress.linkedEntries.map(entry => `<button type="button" data-resource-entry-detail="${entry.id}"><span>${new Date(entry.arrivalTime).toLocaleString('zh-CN')}</span><b>${escapeHtml(entry.quantity)}</b><small>${escapeHtml(entry.brand)} · ${escapeHtml(entry.spec)}</small></button>`).join('') || '<p>暂无到场登记。登记材料或设备时选择本计划，即可自动累计。</p>'}</section>`;
  if (!$('#resourceDetailDialog').open) $('#resourceDetailDialog').showModal();
  $$('[data-resource-entry-detail]', $('#resourceDetailBody')).forEach(button => button.addEventListener('click', () => { $('#resourceDetailDialog').close(); openResourceEntryDetail(button.dataset.resourceEntryDetail); }));
  $('[data-edit-resource-plan]', $('#resourceDetailBody'))?.addEventListener('click', () => { $('#resourceDetailDialog').close(); openResourcePlanDialog(plan); });
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

function openResourceEntryDetail(entryId) {
  const entry = resourceEntries.find(item => Number(item.id) === Number(entryId));
  if (!entry) return;
  delete $('#resourceDetailDialog').dataset.planId;
  const linkedPlan = resourcePlans.find(plan => Number(plan.id) === Number(entry.planId));
  $('#resourceDetailEyebrow').textContent = entry.type === 'material' ? '材料台账详情' : '设备台账详情';
  $('#resourceDetailTitle').textContent = entry.name;
  $('#resourceDetailBody').innerHTML = `<div class="resource-detail-grid">${resourceDetailItem('类别', escapeHtml(entry.category))}${resourceDetailItem('品牌 / 厂家', escapeHtml(entry.brand))}${resourceDetailItem('规格 / 型号', escapeHtml(entry.spec))}${resourceDetailItem('进出场', entry.movement)}${resourceDetailItem('数量', escapeHtml(entry.quantity))}${resourceDetailItem('时间', new Date(entry.arrivalTime).toLocaleString('zh-CN'))}${resourceDetailItem('使用部位', escapeHtml(entry.location))}${resourceDetailItem('关联计划', linkedPlan ? escapeHtml(linkedPlan.name) : '未关联')}${resourceDetailItem('备注', escapeHtml(entry.note || '无'))}</div><section class="resource-attachments"><strong>资料附件 · ${entry.attachments?.length || 0}</strong>${renderResourceAttachments(entry)}</section>`;
  $('#resourceDetailDialog').showModal();
  $$('[data-attachment-entry]', $('#resourceDetailBody')).forEach(button => button.addEventListener('click', () => openResourceAttachment(button.dataset.attachmentEntry, button.dataset.attachmentIndex)));
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
  $('#planRecognitionCandidates').innerHTML = planRecognitionCandidates.map((candidate, index) => `<div class="candidate-row" data-plan-candidate="${index}"><input value="${escapeHtml(candidate.title)}" aria-label="识别计划项 ${index + 1}"><button type="button" data-remove-plan-candidate="${index}">移除</button><div class="candidate-meta"><span>${candidate.start} → ${candidate.end}</span><span>待人工校对</span></div></div>`).join('');
  $$('[data-plan-candidate] input').forEach(input => input.addEventListener('input', () => { planRecognitionCandidates[Number(input.closest('[data-plan-candidate]').dataset.planCandidate)].title = input.value; }));
  $$('[data-remove-plan-candidate]').forEach(button => button.addEventListener('click', () => { planRecognitionCandidates.splice(Number(button.dataset.removePlanCandidate), 1); renderPlanRecognitionCandidates(); }));
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

function renderDocumentsBody() {
  if (!Object.keys(documentState).length) {
    return `<div class="document-overview">
      <article class="document-kpi"><span>资料完成率</span><strong>0<small>%</small></strong><p>0 / 0 项已闭环</p></article>
      <article class="document-kpi"><span>与材料进场关联</span><strong>0<small>批材料</small></strong><p>0 条资料与工序链路</p></article>
      <article class="document-kpi risk"><span>阻塞施工节点</span><strong>0<small>项</small></strong><p>当前无资料门禁阻塞</p></article>
    </div>
    <section class="document-list-panel"><div class="document-panel-heading"><div><h2>材料与施工资料链</h2><p>材料进场、送检、报告和使用部位形成可追溯放行关系</p></div><button type="button" class="secondary-button" data-jump-materials>进入材料设备</button></div><div class="resource-empty">尚未登记任何材料进场批次。资料链会在材料进场登记后自动生成，请先在“材料设备”中登记材料到场。</div></section>
    <section class="document-list-panel concealed-acceptance-panel"><div class="document-panel-heading"><div><h2>施工过程隐蔽验收</h2><p>验收资料和现场照片共同形成工序放行依据</p></div><button type="button" data-new-concealed>＋ 新增隐蔽验收</button></div><div class="concealed-acceptance-list"><div class="resource-empty">还没有隐蔽验收记录</div></div></section>`;
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
        return `<div class="material-acceptance-row"><button type="button" class="material-acceptance-name" data-edit-material-acceptance="${categoryKey}"><strong>${escapeHtml(getMaterialAcceptanceTitle(categoryKey, group))}</strong><small>${entry ? `${new Date(entry.arrivalTime).toLocaleDateString('zh-CN')} · ${escapeHtml(entry.brand)} · ${escapeHtml(entry.spec)}` : '尚未关联具体进场批次'}</small></button><span>${entry ? `${escapeHtml(entry.name)}<small>${escapeHtml(entry.location)}</small>` : escapeHtml(documentChainConfigs[categoryKey]?.label || '材料')}</span><span><b>${group.documents.length} 项</b><small>${group.documents.map(item => escapeHtml(item.name.replace(/钢筋|材料|砌块|混凝土/g, ''))).join('、')}</small></span><span>${owners.slice(0,2).map(owner => `<b>${escapeHtml(owner)}</b>`).join('')}${owners.length > 2 ? `<small>另 ${owners.length - 2} 人</small>` : ''}</span><span><em class="material-batch-status ${status.className}">${status.label}</em><small>${status.done} / ${group.documents.length} 项完成</small></span><button type="button" class="edit-action" data-edit-material-acceptance="${categoryKey}">查看 / 编辑</button></div>`;
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
    </section>`;
}

function renderQualityBody() {
  const qualityItems = qualityChecks.filter(item => item.type === 'quality');
  const pending = qualityItems.filter(item => item.status !== 'closed');
  const filtered = activeQualityFilter === 'pending' ? pending : qualityItems;
  const openInspectionIssues = safetyInspections.reduce((total, inspection) => total + inspection.issues.filter(issue => issue.status !== 'closed').length, 0);
  const qualityRows = filtered.map(item => `<button type="button" class="quality-check-row" data-edit-quality="${item.id}"><i class="${item.type}">质</i><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.location)} · ${item.date} · 责任人 ${escapeHtml(item.owner)}</small></div><span class="quality-status ${item.status}">${item.status === 'closed' ? '已闭环' : item.status === 'rectifying' ? '整改中' : '待整改'}</span><span>${(item.beforeAttachments?.length || 0) + (item.afterAttachments?.length || 0) + (item.recordAttachments?.length || 0)} 个附件</span></button>`).join('');
  const inspectionRows = safetyInspections.map(inspection => {
    const open = inspection.issues.filter(issue => issue.status !== 'closed').length;
    const attachments = (inspection.recordAttachments?.length || 0) + (inspection.noticeAttachments?.length || 0) + (inspection.replyAttachments?.length || 0) + inspection.issues.reduce((sum, issue) => sum + (issue.beforeAttachments?.length || 0) + (issue.afterAttachments?.length || 0), 0);
    return `<button type="button" class="quality-check-row inspection-batch-row" data-edit-inspection="${inspection.id}"><i class="safety">安</i><div><strong>${escapeHtml(inspection.title)}</strong><small>${escapeHtml(inspection.location)} · ${inspection.date} · 巡检负责人 ${escapeHtml(inspection.inspector)}</small><em>${inspection.issues.length} 项问题 · ${open ? `${open} 项待闭环` : '已逐项闭环'}</em></div><span class="quality-status ${inspection.status}">${inspection.status === 'closed' ? '统一回复已闭环' : inspection.status === 'rectifying' ? '整改中' : '待整改'}</span><span>${attachments} 个附件</span></button>`;
  }).join('');
  return `<div class="quality-summary-grid">
    <button type="button" class="info-card interactive ${activeQualityFilter === 'pending' ? 'active' : ''}" data-quality-filter="pending"><h3>待整改</h3><div class="big">${pending.length} 项</div><p>其中 ${pending.filter(item => item.critical).length} 项影响关键节点 · 点击查看内容</p><div class="mini-bar"><i style="width:${Math.min(100, pending.length / Math.max(qualityItems.length,1) * 100)}%"></i></div></button>
    <button type="button" class="info-card interactive"><h3>一次验收通过率</h3><div class="big">93.6%</div><p>较上月提升 2.4%，质量问题闭环留痕</p><div class="mini-bar"><i style="width:94%"></i></div></button>
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
  const latest = [...attendanceRecords].sort((a,b) => b.date.localeCompare(a.date))[0] || { actual: 0, planned: 0, date: '未登记' };
  const ratio = latest.planned ? Math.round(latest.actual / latest.planned * 100) : 0;
  const serverActive = Boolean(window.ZhuxuServer?.active);
  const person = getCurrentUser();
  const role = String(person?.role || '');
  const admin = serverActive ? /项目经理/.test(role) : true;
  const attendanceManager = serverActive ? /(劳资员|项目经理)/.test(role) : true;
  const organizationAction = admin ? `<button type="button" data-edit-organization>编辑人员</button>` : `<span class="management-permission-note">仅项目经理可维护组织架构</span>`;
  const attendanceAction = attendanceManager ? `<button type="button" data-attendance>上传考勤表</button>` : '';
  const supplementAction = record => attendanceManager ? `<button type="button" class="attendance-supplement-action ${attendanceSupplementWindow(record).allowed ? '' : 'expired'}" data-supplement-attendance="${record.id}" ${attendanceSupplementWindow(record).allowed ? '' : 'disabled'}>${attendanceSupplementLabel(record)}</button>` : '';
  const accountPanel = serverActive && admin ? `<section class="account-manage-panel"><div class="section-line-heading"><div><strong>账号管理</strong><small>维护登录账号与登录状态；新账号初始密码为手机号后六位，首次登录强制修改密码</small></div><button type="button" data-new-account>新增账号</button></div><div class="account-manage-list" id="accountManageList">正在加载项目账号…</div></section>` : '';
  return `<section class="management-panel"><div class="section-line-heading"><div><strong>项目管理人员</strong><small>账号职位决定任务自动匹配；姓名、职务、管理范围和电话可维护</small></div>${organizationAction}</div><div class="management-roster">${organization.length ? organization.map(person => `<article><div class="management-avatar">${escapeHtml(person.name.slice(0,1))}</div><div><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.role)}</span><p>${escapeHtml(person.scope || '待确认管理范围')}</p><a href="tel:${String(person.phone || '').replace(/\s/g,'')}">${escapeHtml(person.phone || '未登记电话')}</a></div></article>`).join('') : '<p class="resource-empty">尚未建立组织机构，请由项目经理在“账号管理”中新增人员。</p>'}</div></section>
    <section class="workforce-panel"><div class="section-line-heading"><div><strong>现场班组与每日考勤</strong><small>现场人数以劳资员每日上传的实名制打卡情况表为准；核对补录仅在登记后 24 小时内开放</small></div><div><button type="button" data-attendance-history>查看往期考勤</button>${attendanceAction}<button type="button" data-team-allocation>班组调配</button></div></div><div class="card-collection workforce-cards"><article class="info-card"><h3>现场人员</h3><div class="big">${latest.actual} 人</div><p>${latest.date} 打卡 · 计划投入 ${latest.planned} 人</p><div class="mini-bar"><i style="width:${Math.min(100,ratio)}%"></i></div></article><article class="info-card"><h3>饱和班组</h3><div class="big">8 / 12</div><p>木工班组存在缺员，建议协调补充</p><div class="mini-bar"><i style="width:67%"></i></div></article><article class="info-card"><h3>人均有效工时</h3><div class="big">7.2 h</div><p>较上周提升 0.4 小时</p><div class="mini-bar"><i style="width:82%"></i></div></article></div><div class="attendance-history"><div><strong>最近考勤登记</strong><button type="button" data-attendance-history>全部 ${attendanceRecords.length} 天</button></div>${attendanceRecords.length ? attendanceRecords.slice(0,5).map(record => { const windowState = attendanceSupplementWindow(record); return `<div class="attendance-history-entry"><button type="button" data-attendance-record="${record.id}"><b>${record.date}</b><span>${record.actual} / ${record.planned} 人 · ${escapeHtml(record.officer)}</span><em>${escapeHtml(record.note || '考勤纪律正常')}</em><i>查看详情</i></button>${supplementAction(record)}</div>`; }).join('') : '<p class="resource-empty">暂无考勤记录，请劳资员上传每日实名制打卡表。</p>'}</div></section>${accountPanel}`;
}

function openAttendanceDialog() {
  if (window.ZhuxuServer?.active && !/(劳资员|项目经理)/.test(String(getCurrentUser()?.role || ''))) { showToast('仅劳资员或项目经理可上传考勤表'); return; }
  const form = $('#attendanceForm'); form.reset();
  const latest = [...attendanceRecords].sort((a,b) => b.date.localeCompare(a.date))[0];
  form.elements.date.value = new Date().toISOString().slice(0,10);
  form.elements.actual.value = latest?.actual || 0; form.elements.planned.value = latest?.planned || 0;
  $('#attendanceDialog').showModal();
}

function renderAttendanceHistory(selectedId = null) {
  const records = [...attendanceRecords].sort((a,b) => b.date.localeCompare(a.date));
  const selected = records.find(record => Number(record.id) === Number(selectedId)) || records[0];
  const rate = selected?.planned ? Math.round(selected.actual / selected.planned * 100) : 0;
  const selectedWindow = selected ? attendanceSupplementWindow(selected) : null;
  const supplementAudit = selected?.supplements?.length ? `<section class="supplement-audit-list"><strong>核对补录记录 · ${selected.supplements.length}</strong>${selected.supplements.map((item,index) => `<div><span>${new Date(item.createdAt).toLocaleString('zh-CN')}</span><b>${item.previousActual} → ${item.actual} 人</b><p>${escapeHtml(item.reason)} · ${escapeHtml(item.operator)}</p><button type="button" data-supplement-file="${index}">${escapeHtml(item.attachment?.name || '未上传补录依据')}</button></div>`).join('')}</section>` : '';
  $('#attendanceHistoryBody').innerHTML = selected ? `<section class="attendance-day-detail"><div><span>${selected.date}</span><strong>${selected.actual} / ${selected.planned} 人</strong><small>到岗率 ${rate}% · 登记人 ${escapeHtml(selected.officer)}</small></div><div><p>${escapeHtml(selected.note || '当日考勤纪律正常，无补充说明。')}</p>${selected.supplements?.length ? `<small>已补录 ${selected.supplements.length} 次 · 最近：${escapeHtml(selected.supplements.at(-1).reason)}</small>` : '<small>尚无核对补录记录</small>'}</div><div class="attendance-day-actions"><button type="button" data-attendance-file>${escapeHtml(selected.attachment?.name || '未上传考勤附件')}</button><button type="button" class="${selectedWindow.allowed ? 'supplement-open' : 'supplement-locked'}" data-supplement-attendance="${selected.id}" ${selectedWindow.allowed ? '' : 'disabled'}>${attendanceSupplementLabel(selected)}</button></div></section>
    ${supplementAudit}<div class="attendance-history-table"><div class="attendance-history-row header"><span>日期</span><span>实际 / 计划</span><span>到岗率</span><span>考勤纪律</span><span>补录状态</span><span>原始附件</span></div>${records.map(record => `<button type="button" class="attendance-history-row ${Number(record.id) === Number(selected.id) ? 'active' : ''}" data-attendance-history-select="${record.id}"><strong>${record.date}</strong><span>${record.actual} / ${record.planned} 人</span><span>${record.planned ? Math.round(record.actual / record.planned * 100) : 0}%</span><span>${escapeHtml(record.note || '正常')}</span><span class="supplement-state ${attendanceSupplementWindow(record).allowed ? 'open' : 'closed'}">${attendanceSupplementLabel(record)}</span><span>${escapeHtml(record.attachment?.name || '未上传')}</span></button>`).join('')}</div>` : '<div class="resource-empty">暂无考勤记录</div>';
  $('[data-attendance-file]')?.addEventListener('click', () => selected.attachment ? previewStoredAttachment(selected.attachment) : showToast('该日尚未上传考勤附件'));
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
  let record = dailyExecution.find(item => (dayPlan && Number(item.dayPlanId) === Number(dayPlan.id)) || (Number(item.taskId) === Number(taskId) && item.date === date));
  if (!record) {
    const task = tasks.find(item => Number(item.id) === Number(taskId));
    record = { taskId: Number(taskId), dayPlanId: dayPlan?.id || null, weekPlanId: dayPlan?.parentId || null, date, team: task?.owner || '待安排班组', plannedWorkers: 0, actualWorkers: 0, progress: date === dailyDateKey && task?.status === 'done' ? 100 : date === dailyDateKey && task?.status === 'doing' ? 50 : 0, actualQuantity: '待反馈', materialPercent: 0, materialText: '待核对材料计划和到场情况', documentDone: 0, documentTotal: 1, documentText: '待核对资料条件', note: '尚未提交施工反馈' };
    dailyExecution.push(record);
  }
  return record;
}

function getDailyTaskContexts(date = activeExecutionDate) {
  return plans.filter(plan => plan.level === 'day' && plan.start <= date && plan.end >= date).sort((a,b) => Number(a.id) - Number(b.id)).map(dayPlan => {
    const storedTask = tasks.find(task => Number(task.id) === Number(dayPlan.taskId) || Number(task.dayPlanId) === Number(dayPlan.id));
    const task = storedTask || { id: dayPlan.taskId || dayPlan.id, title: dayPlan.title, zone: '计划指定区域', owner: planOwners(dayPlan)[0] || resolveOrganizationOwner(dayPlan.ownerRole), time: '17:00', status: 'todo', priority: 'normal', virtual: true };
    return { task, dayPlan, record: getDailyExecutionRecord(task.id, date, dayPlan) };
  });
}

function calculateWeeklyProgress(date = activeExecutionDate, contexts = getDailyTaskContexts(date)) {
  const parentIds = [...new Set(contexts.map(item => Number(item.dayPlan.parentId)).filter(Boolean))];
  const weekPlans = plans.filter(plan => plan.level === 'week' && parentIds.includes(Number(plan.id)));
  const weekDayPlans = plans.filter(plan => plan.level === 'day' && parentIds.includes(Number(plan.parentId)));
  const totalWeight = weekDayPlans.reduce((sum, plan) => sum + Number(plan.weight || 1), 0);
  const duePlans = weekDayPlans.filter(plan => plan.start <= date);
  const plannedWeight = duePlans.reduce((sum, plan) => sum + Number(plan.weight || 1), 0);
  const actualWeight = duePlans.reduce((sum, plan) => {
    const record = dailyExecution.find(item => Number(item.dayPlanId) === Number(plan.id)) || dailyExecution.find(item => Number(item.taskId) === Number(plan.taskId) && item.date === plan.start);
    return sum + Number(plan.weight || 1) * Math.min(100, Number(record?.progress || 0)) / 100;
  }, 0);
  const planned = totalWeight ? Math.round(plannedWeight / totalWeight * 100) : 0;
  const actual = totalWeight ? Math.round(actualWeight / totalWeight * 100) : 0;
  const deviation = actual - planned;
  const state = deviation < -5 ? 'lagging' : deviation > 3 ? 'ahead' : 'normal';
  return { weekPlans, planned, actual, deviation, state, label: state === 'lagging' ? '周进度滞后' : state === 'ahead' ? '周进度提前' : '周进度正常' };
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
  const material = dailyReadinessMeta(Number(record.materialPercent || 0));
  const documentPercent = Math.round(Number(record.documentDone || 0) / Math.max(1, Number(record.documentTotal || 1)) * 100);
  const documents = documentConditionMeta(record);
  const workerGap = Math.max(0, Number(record.plannedWorkers || 0) - Number(record.actualWorkers || 0));
  const notice = record.technicalNotice;
  const requiredAcknowledgements = notice?.requiredRoles?.length || 0;
  const acknowledged = notice?.acknowledgedBy?.length || 0;
  const weekPlan = plans.find(plan => Number(plan.id) === Number(dayPlan.parentId));
  const editable = activeExecutionDate === dailyDateKey && !task.virtual;
  return `<article class="daily-task-row ${task.priority === 'risk' ? 'risk' : ''}" data-daily-task="${task.id}" data-day-plan="${dayPlan.id}">
    <div class="daily-task-identity"><span class="daily-sequence">${String(index + 1).padStart(2,'0')}</span><div><strong>${escapeHtml(dayPlan.title)}</strong><small>日计划 #${dayPlan.id} · ${escapeHtml(weekPlan?.title || '待关联周计划')}</small><small>${escapeHtml(task.zone)} · ${escapeHtml(task.owner)} → ${escapeHtml(record.team)}</small><div class="daily-task-progress"><i style="width:${Math.min(100, Number(record.progress || 0))}%"></i></div><em>${record.progress}% · ${escapeHtml(record.actualQuantity || '待反馈')}</em></div></div>
    <div class="daily-worker-cell"><span>班组人员</span><strong>${record.actualWorkers}<small> / ${record.plannedWorkers} 人</small></strong><em class="${workerGap ? 'warning' : 'ready'}">${workerGap ? `缺 ${workerGap} 人` : '投入满足'}</em></div>
    <button type="button" class="daily-condition ${notice ? 'notice' : 'ready'}" ${notice ? `data-technical-task="${task.id}"` : ''}>${notice ? '<i class="daily-risk-flag">!</i>' : ''}<span>技术交底</span><strong>${notice ? `⚠ ${escapeHtml(notice.type)}` : '常规施工'}</strong><small>${notice ? `${acknowledged}/${requiredAcknowledgements} 人确认 · 查看变更内容` : '无新增变更或指令'}</small></button>
    <div class="daily-condition ${material.className}"><span>材料保障</span><strong>${material.label} · ${record.materialPercent}%</strong><small>${escapeHtml(record.materialText)}</small></div>
    <div class="daily-condition ${documents.className}">${documents.className === 'blocked' ? '<i class="daily-risk-flag">!</i>' : ''}<span>资料门禁 · ${documents.label}</span><strong>${record.documentDone}/${record.documentTotal} 项</strong><small>${escapeHtml(record.documentText)} · ${documents.hint}</small></div>
    <button type="button" class="daily-feedback-action" data-daily-feedback="${task.id}" ${editable ? '' : 'disabled'}>${editable ? '反馈进度' : '历史记录'}</button>
  </article>`;
}

function getDailyCompletionSummary(date) {
  const dayPlans = plans.filter(plan => plan.level === 'day' && plan.start <= date && plan.end >= date);
  const records = dayPlans.map(plan => dailyExecution.find(item => Number(item.dayPlanId) === Number(plan.id)) || dailyExecution.find(item => Number(item.taskId) === Number(plan.taskId) && item.date === date)).filter(Boolean);
  const rate = records.length ? Math.round(records.reduce((sum,item) => sum + Math.min(100, Number(item.progress || 0)), 0) / dayPlans.length) : 0;
  return { total: dayPlans.length, completed: records.filter(item => Number(item.progress) >= 100).length, rate };
}

function getCarryoverContexts(date) {
  return plans.filter(plan => plan.level === 'day' && plan.start <= date && plan.end >= date).sort((a,b) => Number(a.id) - Number(b.id)).map(dayPlan => {
    const task = tasks.find(item => Number(item.id) === Number(dayPlan.taskId));
    const record = dailyExecution.find(item => Number(item.taskId) === Number(dayPlan.taskId) && item.date === date)
      || dailyExecution.find(item => Number(item.dayPlanId) === Number(dayPlan.id));
    return task && record ? { task, dayPlan, record } : null;
  }).filter(Boolean);
}

function renderIntakeBody() {
  const taskContexts = getDailyTaskContexts(activeExecutionDate);
  const executionRecords = taskContexts.map(item => item.record);
  const completed = executionRecords.filter(item => Number(item.progress) >= 100).length;
  const completionRate = executionRecords.length ? Math.round(executionRecords.reduce((sum,item) => sum + Math.min(100, Number(item.progress || 0)), 0) / executionRecords.length) : 0;
  const weekly = calculateWeeklyProgress(activeExecutionDate, taskContexts);
  const weekStart = shiftDateKey(activeExecutionDate, -((new Date(`${activeExecutionDate}T12:00:00`).getDay() + 6) % 7));
  const weekDates = Array.from({ length: 7 }, (_, index) => shiftDateKey(weekStart, index));
  const weekDayLabels = ['周一','周二','周三','周四','周五','周六','周日'];
  const yesterday = shiftDateKey(activeExecutionDate, -1);
  const carryovers = getCarryoverContexts(yesterday).filter(item => Number(item.record.progress || 0) < 100 && Number(item.task.id) !== 4);
  const coordinationItems = dailyCoordination.filter(item => activeExecutionDate === dailyDateKey || String(item.due || '').startsWith(activeExecutionDate)).sort((a,b) => (a.status === 'resolved') - (b.status === 'resolved'));
  const materialRisks = resourcePlans.map(plan => { try { return { plan, progress: getResourcePlanProgress(plan) }; } catch { return { plan, progress: { complete: false, days: 0, arrived: 0, planned: { unit: '' } } }; } }).filter(item => !item.progress.complete).slice(0, 5);
  const documentRisks = Object.entries(documentState).flatMap(([key,group]) => (group.documents || []).filter(item => item.status !== 'done').map(item => ({ ...item, group: documentChainConfigs[key]?.label || key }))).slice(0, 6);
  const openQuality = qualityChecks.filter(item => item.type === 'quality' && item.status !== 'closed').length;
  const openSafety = safetyInspections.reduce((sum,item) => sum + (item.issues || []).filter(issue => issue.status !== 'closed').length, 0);
  const currentLabel = activeExecutionDate === dailyDateKey ? '今日' : activeExecutionDate;
  const dayLabel = formatDayLabel(activeExecutionDate);
  const planHeading = activeExecutionDate === dailyDateKey ? `今日计划 · ${dayLabel}` : `${dayLabel}计划`;
  return `<section class="daily-query-bar"><div><span>执行日期</span><button type="button" data-daily-date-step="-1" aria-label="前一天">←</button><input type="date" id="dailyExecutionDate" value="${activeExecutionDate}"><button type="button" data-daily-date-step="1" aria-label="后一天">→</button><button type="button" data-daily-today ${activeExecutionDate === dailyDateKey ? 'disabled' : ''}>回到今天</button></div><p>任务来源：日进度计划 · 周完成率来自每日执行反馈 · 人员投入只读取实名制打卡记录</p></section>
    <section class="today-plan-register"><div class="daily-section-heading"><div><strong>${planHeading}</strong><small>计划名称和责任人来自当日进度计划，点击下方任务可反馈执行情况</small></div><span>${taskContexts.length} 项计划</span></div><div>${taskContexts.map((item,index) => `<article><i>${String(index + 1).padStart(2,'0')}</i><div><strong>${escapeHtml(item.dayPlan.title)}</strong><small>${escapeHtml(item.task.zone)} · 所属：${escapeHtml(plans.find(plan => Number(plan.id) === Number(item.dayPlan.parentId))?.title || '待关联周计划')}</small></div><span>责任人</span><b>${escapeHtml(item.task.owner)}</b></article>`).join('') || '<div class="resource-empty">该日期尚未编制日进度计划。</div>'}</div></section>
    <section class="daily-command-board weekly-command-board">
      <div class="daily-command-copy"><span>WEEKLY CONTROL · ${weekStart}—${shiftDateKey(weekStart,6)}</span><h2>本周计划完成情况</h2><p>逐日对照完成比例和实名制考勤投入；完成率来自日计划反馈，人员数据只采用劳资员上传的打卡记录。</p></div>
      <div class="weekly-progress-compare ${weekly.state}"><div><span>所属周计划</span><strong>${weekly.weekPlans.map(item => item.title).join(' · ') || '尚未关联周计划'}</strong></div><div><span>周计划应完成</span><b>${weekly.planned}%</b><i><em style="width:${weekly.planned}%"></em></i></div><div><span>周累计实际完成</span><b>${weekly.actual}%</b><i><em style="width:${weekly.actual}%"></em></i></div><mark>${weekly.label} ${weekly.deviation > 0 ? '+' : ''}${weekly.deviation}%</mark></div>
      <section class="weekly-daily-ledger"><div class="weekly-ledger-heading"><strong>每日完成情况</strong><span>本周日计划执行百分比</span></div><div>${weekDates.map((date,index) => { const summary = getDailyCompletionSummary(date); const state = !summary.total ? 'empty' : summary.rate >= 100 ? 'done' : date < dailyDateKey ? 'lag' : 'active'; return `<article class="${state} ${date === activeExecutionDate ? 'selected' : ''}"><span>${weekDayLabels[index]} · ${date.slice(5)}</span><strong>${summary.total ? `${summary.rate}%` : '无计划'}</strong><small>${summary.total ? `${summary.completed}/${summary.total} 项完成` : '未编制日计划'}</small><i><em style="width:${summary.rate}%"></em></i></article>`; }).join('')}</div></section>
      <section class="weekly-workforce-ledger"><div class="weekly-ledger-heading"><strong>本周每日投入人员</strong><span>与实名制打卡人数保持一致</span></div><div>${weekDates.map((date,index) => { const attendance = attendanceRecords.find(item => item.date === date); return `<article class="${attendance ? '' : 'empty'}"><span>${weekDayLabels[index]} · ${date.slice(5)}</span><strong>${attendance ? `${attendance.actual} 人` : '未上传'}</strong><small>${attendance ? `计划 ${attendance.planned} 人 · ${escapeHtml(attendance.officer)}` : '等待劳资员上传打卡表'}</small></article>`; }).join('')}</div></section>
    </section>
    <div class="daily-layout">
      <div class="daily-main-stack">
        <section class="carryover-board"><div class="daily-section-heading"><div><strong>昨日未完成计划</strong><small>与今日新计划分开管理；点击任务查看昨日完成量、剩余工作和今日续做情况</small></div><span>${carryovers.length} 项续做</span></div><div>${carryovers.map(item => `<button type="button" class="carryover-item" data-carryover-task="${item.task.id}" data-carryover-date="${yesterday}"><span class="carryover-sequence">续</span><div><strong>${escapeHtml(item.dayPlan.title)}</strong><small>${escapeHtml(item.task.owner)} · ${escapeHtml(item.record.team)}</small><p>${escapeHtml(item.record.note || '未填写未完成原因')}</p></div><span class="carryover-percent"><small>昨日完成</small><b>${item.record.progress}%</b></span><i><em style="width:${Math.min(100,Number(item.record.progress || 0))}%"></em></i><em>查看续做详情 →</em></button>`).join('') || '<div class="resource-empty">昨日计划已全部完成，没有顺延事项。</div>'}</div></section>
        <section class="daily-task-board"><div class="daily-section-heading"><div><strong>${currentLabel}计划跟踪</strong><small>同步核对人员、技术变更、材料条件和资料门禁，风险项优先处理</small></div><span>${completed} / ${taskContexts.length} 完成 · ${completionRate}%</span></div><div class="daily-task-columns"><span>日计划任务与进度</span><span>人员</span><span>技术</span><span>材料</span><span>资料</span><span>操作</span></div>${taskContexts.map(renderDailyTaskRow).join('') || '<div class="resource-empty">该日期尚未编制日进度计划，请先在“进度计划”中新增日计划。</div>'}</section>
      </div>
      <aside class="tomorrow-coordination"><div class="daily-section-heading"><div><strong>需协调事项跟踪</strong><small>显示提出人、责任人及当前跟进状态，完成后保留闭环记录</small></div><button type="button" data-new-coordination>＋ 提问题</button></div><div class="coordination-list">${coordinationItems.map(item => { const task = tasks.find(task => Number(task.id) === Number(item.taskId)); const status = item.status || 'pending'; const statusLabel = status === 'resolved' ? '已完成' : status === 'following' ? '正在跟进' : '待跟进'; return `<article class="${status}"><div><em>${escapeHtml(item.category)}</em><span class="coordination-status ${status}">${statusLabel}</span></div><strong>${escapeHtml(item.content)}</strong><small>关联：${escapeHtml(task?.title || '施工任务')}</small><div class="coordination-people"><span>提出：${escapeHtml(item.requester)}</span><b>责任：${escapeHtml(item.owner)}</b></div><p>最晚 ${formatIntakeTime(item.due)}${item.feedback ? ` · ${escapeHtml(item.feedback)}` : ''}</p>${status === 'resolved' ? '<button type="button" disabled>✓ 已完成</button>' : status === 'following' ? `<button type="button" data-resolve-coordination="${item.id}">标记完成</button>` : `<button type="button" data-follow-coordination="${item.id}">开始跟进</button>`}</article>`; }).join('') || '<div class="resource-empty">当前没有需协调事项</div>'}</div></aside>
    </div>
    <section class="daily-support-grid">
      <article class="daily-support-card material"><div class="daily-support-heading"><div><span>材料风险项</span><strong>仅显示未到齐、审批未完成或临近使用的材料设备</strong></div><button type="button" data-jump-materials>进入材料设备 →</button></div><div class="daily-support-stats"><span><b>${materialRisks.length}</b> 项风险</span><span>已完成项目不在此处显示</span></div><div class="daily-material-list">${materialRisks.map(({plan,progress}) => `<div><strong>${escapeHtml(plan.name)}</strong><span>${escapeHtml(plan.location)} · 要求 ${plan.due}</span><em class="${progress.days <= 2 ? 'blocked' : 'warning'}">${escapeHtml(formatResourceQuantity(progress.arrived, progress.planned.unit))} / ${escapeHtml(plan.quantity)}</em></div>`).join('') || '<div class="resource-empty">暂无材料风险项</div>'}</div></article>
      <article class="daily-support-card documents"><div class="daily-support-heading"><div><span>资料风险项</span><strong>仅显示尚未闭环且可能影响工序的资料</strong></div><button type="button" data-jump-documents>进入资料闭环 →</button></div><ul class="daily-document-risk-list">${documentRisks.map(item => `<li><i class="${/(复试|报告|隐蔽)/.test(item.name) ? 'blocked' : 'warning'}"></i><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.group)} · ${escapeHtml(item.owner)}</small></span><b>${item.status === 'testing' ? '检测中' : '待完善'}</b></li>`).join('') || '<li class="resource-empty">暂无资料风险项</li>'}</ul></article>
      <article class="daily-support-card issues"><div class="daily-support-heading"><div><span>过程问题</span><strong>质量、安全问题跟着任务走</strong></div><button type="button" data-jump-quality>查看问题闭环 →</button></div><div class="daily-issue-totals"><div><strong>${openQuality}</strong><span>质量问题待整改</span></div><div><strong>${openSafety}</strong><span>安全问题待闭环</span></div></div><p>问题记录关联施工任务、责任班组、整改前后照片和复验结论。</p></article>
    </section>`;
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
  continueButton.onclick = () => { if (!todayContext) return; $('#carryoverDetailDialog').close(); openDailyFeedbackDialog(taskId); };
  $('#carryoverDetailDialog').showModal();
}

function openDailyFeedbackDialog(taskId = null) {
  activeExecutionDate = dailyDateKey;
  const dailyTasks = getDailyTaskContexts(dailyDateKey).map(item => item.task).filter(item => !item.virtual);
  const selectedTask = dailyTasks.find(item => Number(item.id) === Number(taskId)) || dailyTasks.find(item => item.status !== 'done') || dailyTasks[0];
  if (!selectedTask) { showToast('今天还没有日进度计划任务，请先编制日计划'); return; }
  const select = $('#dailyFeedbackTaskSelect');
  select.innerHTML = dailyTasks.map(item => `<option value="${item.id}">${escapeHtml(item.title)}</option>`).join('');
  select.value = String(selectedTask.id);
  loadDailyFeedbackTask(selectedTask.id);
  $('#dailyFeedbackDialog').showModal();
}

function loadDailyFeedbackTask(taskId) {
  const task = tasks.find(item => Number(item.id) === Number(taskId));
  if (!task) return;
  const dayPlan = plans.find(plan => plan.level === 'day' && Number(plan.taskId) === Number(task.id) && plan.start === dailyDateKey);
  const record = getDailyExecutionRecord(task.id, dailyDateKey, dayPlan);
  const form = $('#dailyFeedbackForm');
  form.elements.taskId.value = task.id; form.elements.taskSelect.value = String(task.id);
  form.elements.owner.value = task.owner || ''; form.elements.team.value = record.team || ''; form.elements.status.value = task.status === 'done' ? 'done' : Number(record.progress) ? 'doing' : 'todo';
  form.elements.plannedWorkers.value = record.plannedWorkers || 0; form.elements.actualWorkers.value = record.actualWorkers || 0; form.elements.progress.value = record.progress || 0; form.elements.actualQuantity.value = record.actualQuantity || '';
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
  form.elements.requester.value = getDailyExecutionRecord(task.id, dailyDateKey).team || currentOperatorLabel();
  form.elements.owner.value = matchPersonByRole('生产经理'); form.elements.due.value = defaultDueValue();
  $('#coordinationDialog').showModal();
}

function openTechnicalNotice(taskId) {
  const record = getDailyExecutionRecord(taskId); const notice = record.technicalNotice;
  if (!notice) return;
  const task = tasks.find(item => Number(item.id) === Number(taskId));
  $('#technicalNoticeTaskId').value = taskId;
  $('#technicalNoticeTitle').textContent = `${notice.type} · ${notice.code}`;
  const sourceDocument = technicalDocuments.find(item => item.code === notice.code || Number(item.id) === Number(notice.documentId));
  $('#technicalNoticeBody').innerHTML = `<div class="technical-notice-risk"><b>!</b><span>技术风险提示</span><strong>未完成交底确认前，请勿按原做法继续施工</strong></div><div class="technical-notice-mark"><span>${escapeHtml(notice.type)}</span><strong>${escapeHtml(notice.code)}</strong></div><h3>${escapeHtml(notice.title)}</h3><p>${escapeHtml(sourceDocument?.content || notice.detail)}</p><dl><div><dt>关联任务</dt><dd>${escapeHtml(task?.title || '')}</dd></div><div><dt>发布人</dt><dd>${escapeHtml(notice.issuedBy)}</dd></div><div><dt>发布时间</dt><dd>${formatIntakeTime(notice.issuedAt)}</dd></div><div><dt>需要确认</dt><dd>${notice.requiredRoles.map(escapeHtml).join('、')}</dd></div></dl>${sourceDocument ? `<section class="notice-source-document"><div><strong>上传的${escapeHtml(technicalTypeLabels[sourceDocument.type] || '技术文件')}</strong><p>${escapeHtml(sourceDocument.scope)} · ${(sourceDocument.files || []).length} 个附件</p></div>${(sourceDocument.files || []).map((file,index) => `<button type="button" data-notice-source-file="${index}">${escapeHtml(file.name)} <span>查看原文件 →</span></button>`).join('')}<button type="button" data-open-technical-document="${sourceDocument.id}">查看技术文件台账详情</button></section>` : ''}<section><strong>确认记录</strong><p>${notice.acknowledgedBy.length ? notice.acknowledgedBy.map(escapeHtml).join('、') : '尚无人确认'}</p></section>`;
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
      const item = { id: now + index, type: 'material', name: title, quantity: '待核实', due, location: record.zone, ownerRole: '材料员', requester, purchaser: matchPersonByRole('采购员'), contractBrandRequired: false, contractBrand: '', approvalAttachments: record.attachments || [], approvalWorkflow: [{ role: '提报人', owner: requester, status: 'pending' }, { role: '生产经理', owner: matchPersonByRole('生产经理'), status: 'pending' }, { role: '技术负责人', owner: matchPersonByRole('技术负责人'), status: 'pending' }, { role: '库管', owner: matchPersonByRole('库管'), status: 'pending' }, { role: '项目经理', owner: matchPersonByRole('项目经理'), status: 'pending' }], createdAt: new Date().toISOString(), sourceIntakeId: record.id };
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
  container.innerHTML = `<div class="subview-shell"><div class="subview-heading"><div><p class="eyebrow">${escapeHtml(currentProject.name)}</p><h1 id="${id}Title">${config.title}</h1><p>${config.desc}</p></div><button class="primary-button subview-action">＋ ${config.action}</button></div>${body}</div>`;
  $('.subview-action', container).addEventListener('click', () => {
    if (id === 'intake') openDailyFeedbackDialog();
    else if (id === 'technical') openTechnicalDocumentDialog();
    else if (id === 'cost') openCostDocumentDialog();
    else if (id === 'schedule') openPlanDialog();
    else if (id === 'tasks') openTaskDialog();
    else if (id === 'followups') openFollowupDialog();
    else if (id === 'materials') openResourceEntryDialog('material');
    else if (id === 'documents') openDocumentGate(null, activeDocumentChain);
    else if (id === 'quality') activeQualityFilter === 'safety' ? openInspectionBatchDialog() : openQualityCheckDialog();
    else if (id === 'team') { renderOrganization(); $('#organizationDialog').showModal(); }
    else showToast(`${config.action}功能已进入待办，可在下一版接入业务数据`);
  });
  $$('[data-plan-level]', container).forEach(button => button.addEventListener('click', () => { activePlanLevel = button.dataset.planLevel; renderSubview('schedule'); }));
  $$('[data-technical-filter]', container).forEach(button => button.addEventListener('click', () => { activeTechnicalFilter = button.dataset.technicalFilter; activeTechnicalBuilding = 'all'; activeTechnicalProfession = 'all'; renderSubview('technical'); }));
  $$('[data-technical-overview-filter]', container).forEach(button => button.addEventListener('click', () => { activeTechnicalFilter = button.dataset.technicalOverviewFilter; activeTechnicalBuilding = 'all'; activeTechnicalProfession = 'all'; renderSubview('technical'); }));
  $$('[data-technical-building]', container).forEach(button => button.addEventListener('click', () => { activeTechnicalBuilding = button.dataset.technicalBuilding; activeTechnicalProfession = 'all'; renderSubview('technical'); }));
  $$('[data-technical-profession]', container).forEach(button => button.addEventListener('click', () => { activeTechnicalProfession = button.dataset.technicalProfession; renderSubview('technical'); }));
  $$('[data-technical-document]', container).forEach(button => button.addEventListener('click', () => openTechnicalDocumentDetail(button.dataset.technicalDocument)));
  $$('[data-cost-filter]', container).forEach(button => button.addEventListener('click', () => { activeCostFilter = button.dataset.costFilter; renderSubview('cost'); }));
  $$('[data-cost-overview-filter]', container).forEach(button => button.addEventListener('click', () => { activeCostFilter = button.dataset.costOverviewFilter; renderSubview('cost'); }));
  $$('[data-cost-document]', container).forEach(button => button.addEventListener('click', () => openCostDocumentDetail(button.dataset.costDocument)));
  $('#dailyExecutionDate', container)?.addEventListener('change', event => { activeExecutionDate = event.target.value || dailyDateKey; renderSubview('intake'); });
  $$('[data-daily-date-step]', container).forEach(button => button.addEventListener('click', () => { activeExecutionDate = shiftDateKey(activeExecutionDate, Number(button.dataset.dailyDateStep)); renderSubview('intake'); }));
  $('[data-daily-today]', container)?.addEventListener('click', () => { activeExecutionDate = dailyDateKey; renderSubview('intake'); });
  $$('[data-intake-filter]', container).forEach(button => button.addEventListener('click', () => { activeIntakeFilter = button.dataset.intakeFilter; renderSubview('intake'); }));
  $$('[data-review-intake]', container).forEach(button => button.addEventListener('click', () => openIntakeReview(intakeRecords.find(item => Number(item.id) === Number(button.dataset.reviewIntake)))));
  $$('[data-daily-feedback]', container).forEach(button => button.addEventListener('click', () => openDailyFeedbackDialog(button.dataset.dailyFeedback)));
  $$('[data-carryover-task]', container).forEach(button => button.addEventListener('click', () => openCarryoverDetail(button.dataset.carryoverTask, button.dataset.carryoverDate)));
  $$('[data-technical-task]', container).forEach(button => button.addEventListener('click', () => openTechnicalNotice(button.dataset.technicalTask)));
  $('[data-new-coordination]', container)?.addEventListener('click', () => openCoordinationDialog());
  $$('[data-follow-coordination]', container).forEach(button => button.addEventListener('click', () => { dailyCoordination = dailyCoordination.map(item => Number(item.id) === Number(button.dataset.followCoordination) ? { ...item, status: 'following', followedAt: new Date().toISOString(), followedBy: currentOperatorLabel(), feedback: `由${currentOperatorLabel()}开始跟进` } : item); persistDailyCoordination(); renderSubview('intake'); showToast('协调事项已进入跟进状态'); }));
  $$('[data-resolve-coordination]', container).forEach(button => button.addEventListener('click', () => { dailyCoordination = dailyCoordination.map(item => Number(item.id) === Number(button.dataset.resolveCoordination) ? { ...item, status: 'resolved', resolvedAt: new Date().toISOString(), resolvedBy: currentOperatorLabel(), feedback: `已由${currentOperatorLabel()}确认完成` } : item); persistDailyCoordination(); renderSubview('intake'); showToast('协调问题已完成并保留闭环记录'); }));
  $('[data-jump-materials]', container)?.addEventListener('click', () => navigate('materials'));
  $('[data-jump-documents]', container)?.addEventListener('click', () => navigate('documents'));
  $('[data-jump-quality]', container)?.addEventListener('click', () => navigate('quality'));
  $('[data-open-collection]', container)?.addEventListener('click', openIntakeDialog);
  $$('[data-edit-plan]', container).forEach(button => button.addEventListener('click', () => openPlanDialog(plans.find(plan => plan.id === Number(button.dataset.editPlan)))));
  $$('[data-edit-task-row]', container).forEach(button => button.addEventListener('click', () => openTaskDialog(tasks.find(task => task.id === Number(button.dataset.editTaskRow)))));
  $$('[data-resource-tab]', container).forEach(button => button.addEventListener('click', () => { activeResourceTab = button.dataset.resourceTab; renderSubview('materials'); }));
  $('[data-register-resource]', container)?.addEventListener('click', button => openResourceEntryDialog(button.currentTarget.dataset.registerResource));
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
  $('[data-new-account]', container)?.addEventListener('click', () => openAccountDialog());
  if (id === 'team') loadAccounts();
  $$('[data-remind-followup]', container).forEach(button => button.addEventListener('click', () => {
    followups = followups.map(item => item.id === Number(button.dataset.remindFollowup) ? { ...item, reminders: item.reminders + 1, lastRemindedAt: new Date().toISOString() } : item);
    persistFollowups(); renderSubview('followups'); showToast('已再次提醒责任人，并记录本次催办');
  }));
}

function navigate(viewId) {
  if (mustChangePassword) { openPasswordChangeDialog(); return; }
  if (viewId === 'dashboard') viewId = 'intake';
  if (viewId === 'cost' && !hasCostAccess()) { openCostAccessDenied(); return; }
  $$('.view').forEach(view => view.classList.toggle('active', view.id === viewId));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === viewId));
  $('#globalBackButton').classList.toggle('visible', viewId !== 'intake');
  $('#addTaskButton').classList.toggle('view-hidden', viewId !== 'intake');
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
    $('.login-version').textContent = '筑序 v1.0 · 项目局域网多人版';
    $('.sync-state span').textContent = authenticatedUserId ? '局域网数据已连接' : '等待登录服务器';
    if (authenticatedUserId) syncAllLocalState();
  } else {
    $('.login-version').textContent = '筑序 v1.0 · 本机离线演示版';
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

  $$('.nav-item').forEach(item => item.addEventListener('click', () => navigate(item.dataset.view)));
  $$('[data-jump]').forEach(item => item.addEventListener('click', () => navigate(item.dataset.jump)));
  $$('.task-filters button').forEach(button => button.addEventListener('click', () => { activeFilter = button.dataset.filter; $$('.task-filters button').forEach(b => b.classList.toggle('active', b === button)); renderTasks(); }));
  $('#menuButton').addEventListener('click', openSidebar); $('#sidebarScrim').addEventListener('click', closeSidebar);
  $('#globalBackButton').addEventListener('click', () => navigate('intake'));
  $('#documentStrip').addEventListener('click', () => navigate('documents'));
  $('#organizationButton').addEventListener('click', () => { renderOrganization(); $('#organizationDialog').showModal(); });
  $('#accountSwitcherButton').addEventListener('click', logoutCurrentUser);
  $('#addTaskButton').addEventListener('click', () => openDailyFeedbackDialog());
  $('#logButton').addEventListener('click', openLogDialog);
  $('#photoInput').addEventListener('change', handlePhotoSelection);
  $('#morningBriefButton').addEventListener('click', createMorningBrief);
  $('#exportButton').addEventListener('click', exportData);
  $('#focusIssueButton').addEventListener('click', () => showToast('建议：联系监理提前 30 分钟到场，并将浇筑前检查并行开展'));
  $('#adoptInsightButton').addEventListener('click', event => { event.currentTarget.textContent = '✓ 已采纳，等待计划确认'; event.currentTarget.disabled = true; showToast('建议已加入明日计划草案'); });
  $('#notificationButton').addEventListener('click', () => showToast(`${followups.filter(item => item.status !== 'done').length} 条协作或资料待办，另有 1 条验收提醒`));
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
  $('#planForm input[name="start"]').addEventListener('change', () => updatePlanParentField($('#planForm').elements.parentId.value));
  $('#taskImportInput').addEventListener('change', event => recognizeTaskFiles([...event.target.files]));
  $('#planImportInput').addEventListener('change', event => { if (event.target.files[0]) recognizePlanFile(event.target.files[0]); });
  $('#resourcePlanForm select[name="type"]').addEventListener('change', event => { populateResourcePlanRoles(event.target.value); updateResourcePlanMaterialFields(); });
  $('#resourcePlanForm select[name="contractBrandRequired"]').addEventListener('change', updateResourcePlanMaterialFields);
  $('#concealedAcceptanceForm select[name="status"]').addEventListener('change', updateConcealedGateHint);
  ['name', 'location'].forEach(field => $('#resourceEntryForm').elements[field].addEventListener('input', updateResourcePlanRecommendation));
  $('#resourcePlanMatch').addEventListener('change', event => {
    event.target.dataset.manual = event.target.value ? 'true' : 'false';
    const plan = resourcePlans.find(item => String(item.id) === event.target.value);
    $('#resourcePlanMatchHint').textContent = plan ? `已手动关联：${plan.name}（${plan.location}）` : '已恢复系统自动匹配';
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

  $('#dailyFeedbackTaskSelect').addEventListener('change', event => loadDailyFeedbackTask(event.target.value));
  ['documentDone','documentTotal','documentText'].forEach(name => $('#dailyFeedbackForm').elements[name].addEventListener('input', updateDailyDocumentCondition));
  $('#technicalDocumentForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form); const submit = form.querySelector('[type="submit"]');
    submit.disabled = true; submit.textContent = '保存中…';
    try {
      const files = await prepareResourceAttachments([...form.elements.files.files]);
      const profession = data.get('type') === 'drawing' ? (data.get('profession') || detectProfession(`${data.get('title')} ${data.get('building')} ${data.get('scope')}`)) : '';
      technicalDocuments.unshift({ id: Date.now(), type: data.get('type'), code: data.get('code'), title: data.get('title'), building: data.get('building'), profession, issuedBy: data.get('issuedBy'), issuedAt: data.get('issuedAt'), scope: data.get('scope'), content: data.get('content'), files, status: 'valid', createdAt: new Date().toISOString(), createdBy: currentOperatorLabel() });
      persistTechnicalDocuments(); form.reset(); $('#technicalDocumentDialog').close();
      if ($('#technical').classList.contains('active')) renderSubview('technical');
      showToast('技术文件已上传并向项目成员共享');
    } finally { submit.disabled = false; submit.textContent = '保存技术文件'; }
  });
  $('#technicalDocumentForm select[name="type"]').addEventListener('change', event => { $('#professionField').hidden = event.target.value !== 'drawing'; });
  $('#drawingFolderButton').addEventListener('click', () => $('#drawingFolderInput').click());
  $('#drawingFolderInput').addEventListener('change', async event => {
    const files = [...event.target.files];
    event.target.value = '';
    if (files.length) await importDrawingFolder(files);
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
    const dayPlan = plans.find(plan => plan.level === 'day' && Number(plan.taskId) === taskId && plan.start === dailyDateKey);
    const existing = getDailyExecutionRecord(taskId, dailyDateKey, dayPlan); const submit = form.querySelector('[type="submit"]');
    submit.disabled = true; submit.textContent = '保存中…';
    try {
      const photos = await prepareResourceAttachments([...form.elements.photos.files]);
      const record = { ...existing, taskId, dayPlanId: dayPlan?.id || existing.dayPlanId, weekPlanId: dayPlan?.parentId || existing.weekPlanId, date: dailyDateKey, team: data.get('team'), plannedWorkers: Number(data.get('plannedWorkers')), actualWorkers: Number(data.get('actualWorkers')), progress: Number(data.get('progress')), actualQuantity: data.get('actualQuantity'), materialPercent: Number(data.get('materialPercent')), materialText: data.get('materialText'), documentDone: Number(data.get('documentDone')), documentTotal: Number(data.get('documentTotal')), documentText: data.get('documentText'), note: data.get('note'), feedbackPhotos: [...(existing.feedbackPhotos || []), ...photos], feedbackAt: new Date().toISOString(), feedbackBy: currentOperatorLabel() };
      dailyExecution = dailyExecution.map(item => ((record.dayPlanId && Number(item.dayPlanId) === Number(record.dayPlanId)) || (Number(item.taskId) === taskId && item.date === dailyDateKey)) ? record : item);
      const status = data.get('status') === 'done' || record.progress >= 100 ? 'done' : data.get('status') === 'doing' || record.progress > 0 ? 'doing' : 'todo';
      tasks = tasks.map(item => Number(item.id) === taskId ? { ...item, status, owner: data.get('owner') || item.owner } : item);
      siteRecords.unshift({ id: Date.now(), type: '施工反馈', content: `${tasks.find(item => Number(item.id) === taskId)?.title || '施工任务'}：${record.actualQuantity}；${record.note}`, createdAt: new Date().toISOString(), photos, sourceTaskId: taskId });
      persistDailyExecution(); persistTasks(); persistSiteRecords();
      form.reset(); $('#dailyFeedbackDialog').close();
      if ($('#intake').classList.contains('active')) renderSubview('intake');
      showToast('施工进度、班组人数、材料和资料状态已更新');
    } finally { submit.disabled = false; submit.textContent = '保存施工反馈'; }
  });
  $('#coordinationTaskSelect').addEventListener('change', event => { const task = tasks.find(item => Number(item.id) === Number(event.target.value)); if (task) $('#coordinationForm').elements.requester.value = getDailyExecutionRecord(task.id, dailyDateKey).team || currentOperatorLabel(); });
  $('#coordinationForm').addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    dailyCoordination.unshift({ id: Date.now(), taskId: Number(data.get('taskId')), category: data.get('category'), content: data.get('content'), requester: data.get('requester'), owner: data.get('owner'), due: data.get('due'), status: 'pending', createdAt: new Date().toISOString() });
    persistDailyCoordination(); form.reset(); $('#coordinationDialog').close(); if ($('#intake').classList.contains('active')) renderSubview('intake'); showToast('明日协调问题已提交并进入跟踪');
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

  $('#qualityCheckForm').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const existing = qualityChecks.find(item => Number(item.id) === Number(data.get('checkId')));
    const recordAttachments = await prepareResourceAttachments([...form.elements.recordFiles.files]);
    const beforeAttachments = await prepareResourceAttachments([...form.elements.beforePhotos.files]);
    const afterAttachments = await prepareResourceAttachments([...form.elements.afterPhotos.files]);
    if (data.get('status') === 'closed' && !(existing?.afterAttachments?.length || afterAttachments.length)) { showToast('闭环前请上传整改后照片'); return; }
    const payload = { type: data.get('type'), title: data.get('title'), location: data.get('location'), owner: data.get('owner'), date: data.get('date'), due: data.get('due'), status: data.get('status'), note: data.get('note'), recordAttachments: [...(existing?.recordAttachments || []), ...recordAttachments], beforeAttachments: [...(existing?.beforeAttachments || []), ...beforeAttachments], afterAttachments: [...(existing?.afterAttachments || []), ...afterAttachments] };
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
    attendanceRecords.unshift({ id: Date.now(), date: data.get('date'), registeredAt: new Date().toISOString(), actual: Number(data.get('actual')), planned: Number(data.get('planned')), officer: data.get('officer'), note: data.get('note'), supplements: [], attachment });
    attendanceRecords.sort((a,b) => b.date.localeCompare(a.date)); persistAttendance(); form.reset(); $('#attendanceDialog').close();
    if ($('#team').classList.contains('active')) renderSubview('team'); showToast('考勤表已保存，现场人数已按打卡数据更新');
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
  $('#planForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form);
    const level = data.get('level');
    const start = data.get('start');
    const explicitParentId = Number(data.get('parentId')) || null;
    const inferredParent = level === 'day' ? plans.find(plan => plan.level === 'week' && plan.start <= start && plan.end >= start && (!explicitParentId || Number(plan.id) === explicitParentId)) : null;
    const owners = level === 'day' || level === 'week' ? String(data.get('owners') || '').split(/[、,，]/).map(item => item.trim()).filter(Boolean) : [];
    const team = level === 'day' || level === 'week' ? String(data.get('team') || '').trim() : '';
    const dailyTarget = level === 'day' ? Math.max(0, Math.min(100, Number(data.get('dailyTarget') || 100))) : null;
    const base = { level, ownerRole: data.get('ownerRole'), owners, team, dailyTarget, start, end: level === 'day' ? start : data.get('end'), parentId: level === 'day' ? (explicitParentId || inferredParent?.id || null) : null };
    const attachDayTask = plan => {
      if (plan.level !== 'day') return plan;
      let task = tasks.find(item => Number(item.id) === Number(plan.taskId)) || tasks.find(item => Number(item.dayPlanId) === Number(plan.id));
      if (!task) {
        task = { id: Date.now() + Math.floor(Math.random() * 1000), dayPlanId: plan.id, title: plan.title, zone: '计划指定区域', owner: planOwners(plan)[0] || resolveOrganizationOwner(plan.ownerRole), creator: currentOperatorLabel(), taskType: '施工任务', time: '17:00', status: 'todo', priority: 'normal', criteria: `来源：日进度计划 #${plan.id}` };
        tasks.unshift(task);
      } else {
        Object.assign(task, { dayPlanId: plan.id, title: plan.title, owner: task.owner || planOwners(plan)[0] || resolveOrganizationOwner(plan.ownerRole) });
      }
      plan.taskId = task.id;
      return plan;
    };
    if (editingPlanId) {
      plans = plans.map(plan => plan.id === editingPlanId ? attachDayTask({ ...plan, ...base, title: data.get('title'), source: '人工更新' }) : plan);
    } else if (planRecognitionCandidates.length) {
      planRecognitionCandidates.forEach((candidate, index) => plans.push(attachDayTask({ id: Date.now() + index, ...base, title: candidate.title, start: candidate.start || base.start, end: level === 'day' ? (candidate.start || base.start) : (candidate.end || base.end), source: '文件识别 · 已校对' })));
    } else {
      plans.push(attachDayTask({ id: Date.now(), ...base, title: data.get('title'), source: '手工新建' }));
    }
    activePlanLevel = level; persistPlans(); persistTasks(); editingPlanId = null; planRecognitionCandidates = []; form.reset(); $('#planDialog').close();
    if ($('#schedule').classList.contains('active')) renderSubview('schedule');
    showToast('计划已更新并写入对应计划层级');
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
      return previous?.status === 'approved' ? { ...previous, ownerId } : { role, owner, ownerId, status: 'pending' };
    });
    const planData = {
      type, name: data.get('name'), quantity: data.get('quantity'), due: data.get('due'), location: data.get('location'), ownerRole: data.get('ownerRole'),
      requester: type === 'material' ? data.get('requester') : '', purchaser: type === 'material' ? data.get('purchaser') : '',
      contractBrandRequired: type === 'material' && data.get('contractBrandRequired') === 'yes', contractBrand: type === 'material' ? String(data.get('contractBrand') || '').trim() : '',
      approvalAttachments: type === 'material' ? [...(existing?.approvalAttachments || []), ...newApprovalFiles] : [], approvalWorkflow,
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
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const submit = form.querySelector('[type="submit"]');
    submit.disabled = true; submit.textContent = '保存中…';
    const attachments = await prepareResourceAttachments([...form.elements.certificates.files, ...form.elements.photos.files]);
    const entry = { id: Date.now(), type: data.get('resourceType'), name: data.get('name'), category: data.get('category'), brand: data.get('brand'), spec: data.get('spec'), movement: data.get('movement'), arrivalTime: data.get('arrivalTime'), quantity: data.get('quantity'), location: data.get('location'), note: data.get('note'), attachments };
    const selectedPlanId = Number(data.get('planId'));
    const linkedPlan = selectedPlanId ? resourcePlans.find(plan => Number(plan.id) === selectedPlanId) : findBestResourcePlan(entry);
    if (linkedPlan && entry.movement === '进场') entry.planId = linkedPlan.id;
    resourceEntries.unshift(entry);
    if (entry.type === 'material' && entry.movement === '进场') { ensureMaterialDocumentChain(entry); persistDocumentState(); }
    reconcileResourcePlans();
    try { persistResources(); } catch (error) { entry.attachments = attachments.map(item => ({ name: item.name, type: item.type, stored: false })); persistResources(); showToast('附件较大，已保存登记信息和附件名称'); }
    if (entry.type === 'material' && entry.movement === '进场') {
      const clerk = organization.find(person => person.role === '资料员');
      followups.unshift({ id: Date.now() + 1, category: '资料待办', title: `确认${entry.name}是否需要取样送检并留存合格证`, requester: '系统 · 材料进场联动', owner: `${clerk.name} · ${clerk.role}`, zone: entry.location, due: defaultDueValue(), urgency: /钢材|水泥|防水/.test(entry.category) ? 'urgent' : 'normal', relatedTask: `${entry.name} ${entry.movement}登记`, note: `品牌：${entry.brand}；规格：${entry.spec}；附件 ${attachments.length} 个。请确认送检与归档要求。`, status: 'pending', reminders: 1 });
      persistFollowups();
    }
    form.reset(); $('#resourceEntryDialog').close(); activeResourceTab = entry.type === 'material' ? 'materials' : 'equipment'; if ($('#materials').classList.contains('active')) renderSubview('materials'); submit.disabled = false; submit.textContent = '保存登记';
    const planMessage = linkedPlan ? `，已计入“${linkedPlan.name}”到场进度` : '';
    showToast(entry.type === 'material' ? `材料进场已登记${planMessage}，并生成资料员待办` : `设备进出场已登记${planMessage}`);
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
