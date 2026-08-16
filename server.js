'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const HOST = process.env.ZHUXU_HOST || '0.0.0.0';
const PORT = Number(process.env.ZHUXU_PORT || 8080);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = process.env.ZHUXU_DB_PATH ? path.resolve(process.env.ZHUXU_DB_PATH) : path.join(DATA_DIR, 'zhuxu-lan.sqlite');
const UPLOAD_DIR = process.env.ZHUXU_UPLOAD_DIR ? path.resolve(process.env.ZHUXU_UPLOAD_DIR) : path.join(DATA_DIR, 'uploads');
const MAX_BODY = Number(process.env.ZHUXU_MAX_BODY || 12 * 1024 * 1024);
const MAX_ATTACHMENT = Number(process.env.ZHUXU_MAX_ATTACHMENT || 25 * 1024 * 1024);
const COOKIE_SECURE = process.env.ZHUXU_COOKIE_SECURE === '1';
const TRUST_PROXY = process.env.ZHUXU_TRUST_PROXY === '1';
const SESSION_HOURS = 12;
const SHARED_KEYS = new Set([
  'zhuxu-tasks', 'zhuxu-document-state', 'zhuxu-followups', 'zhuxu-organization', 'zhuxu-plans',
  'zhuxu-resource-entries', 'zhuxu-resource-plans', 'zhuxu-concealed-acceptances',
  'zhuxu-quality-checks', 'zhuxu-attendance', 'zhuxu-safety-inspections', 'zhuxu-site-records',
  'zhuxu-intake-records', 'zhuxu-technical-documents', 'zhuxu-cost-documents', 'zhuxu-daily-execution', 'zhuxu-daily-coordination'
]);
const COST_STATE_KEY = 'zhuxu-cost-documents';
const COST_ROLE_PATTERN = /项目经理|商务|成本|造价/;
const PUBLIC_FILES = new Set(['index.html', 'styles.css', 'app.js', 'server-bridge.js', 'vendor/jszip.min.js']);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, account TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL,
    phone TEXT NOT NULL, scope TEXT NOT NULL DEFAULT '', password_salt TEXT NOT NULL, password_hash TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS project_state (
    state_key TEXT PRIMARY KEY, value_json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, action TEXT NOT NULL, target TEXT NOT NULL,
    detail_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
  );
`);

const defaultUsers = [
  ['pm', 'chen.pm', '陈海峰', '项目经理', '138 0000 1001', '项目统筹与重大协调'],
  ['production', 'wang.prod', '王建国', '生产经理', '138 0000 1002', '日计划、施工组织与班组协调'],
  ['technical', 'zhou.tech', '周海', '技术负责人', '138 0000 1003', '施工方案、技术交底与技术复核'],
  ['builder', 'wu.builder', '吴晨', '施工员', '138 0000 1004', '现场施工安排、工序协调与进度落实'],
  ['civil', 'zhang.civil', '张凯', '土建工程师', '138 0000 1104', '钢筋、模板、混凝土工程'],
  ['mep', 'sun.mep', '孙明', '机电工程师', '138 0000 1105', '机电安装与预留预埋'],
  ['survey', 'xu.survey', '许航', '测量员', '138 0000 1106', '测量放线、标高与轴线复核'],
  ['tester', 'guo.test', '郭宇', '试验员', '138 0000 1107', '取样送检、试块留置与试验跟踪'],
  ['quality', 'zhao.qa', '赵磊', '质量员', '138 0000 1108', '质量检查与验收'],
  ['safety', 'zhou.hse', '周强', '安全员', '138 0000 1109', '安全巡检与整改'],
  ['storekeeper', 'ma.store', '马会', '库管', '138 0000 1115', '库存核对、收发存登记与到货衔接'],
  ['material', 'liu.material', '刘颖', '材料员', '138 0000 1111', '材料计划、进场验收与台账管理'],
  ['purchaser', 'lin.purchase', '林浩', '采购员', '138 0000 1114', '询价下单与供应跟踪'],
  ['document', 'li.doc', '李娜', '资料员', '138 0000 1113', '报验、送检与资料归档'],
  ['labor', 'zhao.labor', '赵敏', '劳资员', '138 0000 1113', '实名制考勤与工资资料'],
  ['equipment', 'he.equipment', '何军', '设备管理员', '138 0000 1115', '设备进退场与维保'],
  ['commercial', 'luo.cost', '罗婷', '商务经理', '138 0000 1116', '合同、经济核定、工程量确认与结算管理']
];

function nowIso() { return new Date().toISOString(); }
function phonePassword(phone) { return String(phone).replace(/\D/g, '').slice(-6); }
function passwordRecord(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') };
}
function verifyPassword(password, salt, expectedHex) {
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

const insertUser = db.prepare(`INSERT OR IGNORE INTO users
  (id, account, name, role, phone, scope, password_salt, password_hash, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
for (const [id, account, name, role, phone, scope] of defaultUsers) {
  const password = passwordRecord(phonePassword(phone));
  insertUser.run(id, account, name, role, phone, scope, password.salt, password.hash, nowIso());
}

function sendJson(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}
function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(item => item.trim()).filter(Boolean).map(item => {
    const index = item.indexOf('='); return [decodeURIComponent(item.slice(0, index)), decodeURIComponent(item.slice(index + 1))];
  }));
}
async function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', chunk => { size += chunk.length; if (size > MAX_BODY) { reject(Object.assign(new Error('请求数据过大'), { status: 413 })); req.destroy(); } else chunks.push(chunk); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(Object.assign(new Error('JSON 格式无效'), { status: 400 })); } });
    req.on('error', reject);
  });
}
function canAccessCost(user) { return Boolean(user && COST_ROLE_PATTERN.test(String(user.role || ''))); }
function publicUser(user) { return user && { id: user.id, account: user.account, name: user.name, role: user.role, phone: user.phone, scope: user.scope, permissions: { cost: canAccessCost(user) } }; }
function stateSnapshot(user) {
  const result = {};
  for (const row of db.prepare('SELECT state_key, value_json FROM project_state').all()) {
    if (row.state_key === COST_STATE_KEY && !canAccessCost(user)) continue;
    try { result[row.state_key] = JSON.parse(row.value_json); } catch { /* 跳过损坏状态 */ }
  }
  return result;
}

function isCostAttachment(id) {
  const row = db.prepare('SELECT value_json FROM project_state WHERE state_key = ?').get(COST_STATE_KEY);
  if (!row) return false;
  try { return JSON.parse(row.value_json).some(item => (item.files || []).some(file => file.storageKey === id)); } catch { return false; }
}
function audit(userId, action, target, detail = {}) {
  db.prepare('INSERT INTO audit_log (user_id, action, target, detail_json, created_at) VALUES (?, ?, ?, ?, ?)').run(userId || null, action, target, JSON.stringify(detail), nowIso());
}
function sessionUser(req) {
  const token = parseCookies(req).zhuxu_session;
  if (!token) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const row = db.prepare(`SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND users.enabled = 1`).get(tokenHash, Date.now());
  if (row) db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?').run(nowIso(), tokenHash);
  return row || null;
}
function requireUser(req, res) {
  const user = sessionUser(req);
  if (!user) sendJson(res, 401, { error: '请先登录', server: true });
  return user;
}
function setState(key, value, userId) {
  db.prepare(`INSERT INTO project_state (state_key, value_json, revision, updated_by, updated_at) VALUES (?, ?, 1, ?, ?)
    ON CONFLICT(state_key) DO UPDATE SET value_json = excluded.value_json, revision = project_state.revision + 1,
    updated_by = excluded.updated_by, updated_at = excluded.updated_at`).run(key, JSON.stringify(value), userId, nowIso());
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (TRUST_PROXY && forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

const ATTACHMENT_TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip', '.txt': 'text/plain; charset=utf-8'
};
const ATTACHMENT_ID_RE = /^att-[a-f0-9]{32}$/;

function safeFileName(name) {
  const base = path.basename(String(name || 'attachment').replace(/\\/g, '/'));
  const cleaned = base.replace(/[^\w.\u4e00-\u9fff-]/g, '_').slice(0, 120);
  return cleaned || 'attachment';
}

function readRawBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', chunk => { size += chunk.length; if (size > limit) { reject(Object.assign(new Error('请求数据过大'), { status: 413 })); req.destroy(); } else chunks.push(chunk); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipartFile(raw, contentType) {
  const boundaryMatch = String(contentType || '').match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) throw Object.assign(new Error('上传格式不正确'), { status: 400 });
  const boundary = Buffer.from('--' + (boundaryMatch[1] || boundaryMatch[2]).trim(), 'utf8');
  if (raw.indexOf(boundary) !== 0) throw Object.assign(new Error('上传格式不正确'), { status: 400 });
  const bodyStart = raw.indexOf(Buffer.from('\r\n\r\n'), boundary.length);
  if (bodyStart < 0) throw Object.assign(new Error('上传格式不正确'), { status: 400 });
  const headerText = raw.subarray(boundary.length, bodyStart).toString('utf8');
  const filenameMatch = headerText.match(/filename="((?:[^"\\]|\\.)*)"/i);
  const nextBoundary = raw.indexOf(Buffer.concat([Buffer.from('\r\n--'), boundary.subarray(2)]), bodyStart + 4);
  const fileEnd = nextBoundary >= 0 ? nextBoundary : raw.length;
  const data = raw.subarray(bodyStart + 4, fileEnd);
  const declaredMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);
  return { name: filenameMatch ? safeFileName(filenameMatch[1].replace(/\\(.)/g, '$1')) : 'attachment', data, declaredType: String(declaredMatch ? declaredMatch[1] : '').trim() };
}

function inferAttachmentType(name, declaredType) {
  const ext = path.extname(name).toLowerCase();
  const fromExt = ATTACHMENT_TYPES[ext];
  if (fromExt) return fromExt;
  if (/^image\/(?!svg)/i.test(declaredType)) return declaredType;
  if (declaredType === 'application/pdf') return 'application/pdf';
  return 'application/octet-stream';
}

async function handleAttachmentUpload(req, res, user) {
  const raw = await readRawBody(req, MAX_ATTACHMENT + 64 * 1024);
  if (!raw.length) return sendJson(res, 400, { error: '未收到文件' });
  const part = parseMultipartFile(raw, req.headers['content-type']);
  if (!part.data.length) return sendJson(res, 400, { error: '文件内容为空' });
  if (part.data.length > MAX_ATTACHMENT) return sendJson(res, 413, { error: '单个附件过大' });
  const id = 'att-' + crypto.randomBytes(16).toString('hex');
  const type = inferAttachmentType(part.name, part.declaredType);
  const meta = { id, name: part.name, type, size: part.data.length, uploadedBy: user.account, uploadedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(UPLOAD_DIR, id + '.bin'), part.data);
  fs.writeFileSync(path.join(UPLOAD_DIR, id + '.json'), JSON.stringify(meta));
  audit(user.id, 'attachment_upload', id, { name: part.name, size: part.data.length });
  return sendJson(res, 200, { storageKey: id, name: meta.name, type: meta.type, size: meta.size });
}

function handleAttachmentDownload(req, res, user, id) {
  if (!ATTACHMENT_ID_RE.test(id)) return sendJson(res, 404, { error: '附件不存在' });
  if (isCostAttachment(id) && !canAccessCost(user)) { audit(user.id, 'permission_denied', `cost-attachment:${id}`); return sendJson(res, 403, { error: '无成控文件访问权限' }); }
  let meta;
  try { meta = JSON.parse(fs.readFileSync(path.join(UPLOAD_DIR, id + '.json'), 'utf8')); } catch { return sendJson(res, 404, { error: '附件不存在' }); }
  const filePath = path.join(UPLOAD_DIR, id + '.bin');
  if (!fs.existsSync(filePath)) return sendJson(res, 404, { error: '附件不存在' });
  const inline = (meta.type.startsWith('image/') && meta.type !== 'image/svg+xml') || meta.type === 'application/pdf';
  const disposition = inline ? 'inline' : 'attachment';
  const encoded = encodeURIComponent(meta.name).replace(/'/g, '%27');
  res.writeHead(200, {
    'Content-Type': meta.type,
    'Content-Length': meta.size,
    'Content-Disposition': `${disposition}; filename*=UTF-8''${encoded}`,
    'X-Attachment-Meta': encodeURIComponent(JSON.stringify({ name: meta.name, size: meta.size })),
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store'
  });
  fs.createReadStream(filePath).pipe(res);
}

const loginAttempts = new Map();
function loginAllowed(ip) {
  const now = Date.now(); const recent = (loginAttempts.get(ip) || []).filter(time => now - time < 10 * 60 * 1000);
  loginAttempts.set(ip, recent); return recent.length < 8;
}
function recordFailedLogin(ip) { const list = loginAttempts.get(ip) || []; list.push(Date.now()); loginAttempts.set(ip, list); }

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/bootstrap') {
    const user = sessionUser(req);
    return user ? sendJson(res, 200, { server: true, authenticated: true, user: publicUser(user), state: stateSnapshot(user) }) : sendJson(res, 200, { server: true, authenticated: false });
  }
  if (req.method === 'POST' && url.pathname === '/api/login') {
    const ip = clientIp(req);
    if (!loginAllowed(ip)) return sendJson(res, 429, { error: '登录失败次数过多，请十分钟后重试' });
    const body = await readJson(req);
    const account = String(body.account || '').trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE lower(account) = ? AND enabled = 1').get(account);
    if (!user || !verifyPassword(String(body.password || ''), user.password_salt, user.password_hash)) {
      recordFailedLogin(ip); audit(user?.id, 'login_failed', account); return sendJson(res, 401, { error: '账号或密码不正确' });
    }
    loginAttempts.delete(ip);
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const maxAge = body.remember ? 7 * 24 * 3600 : SESSION_HOURS * 3600;
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)').run(tokenHash, user.id, Date.now() + maxAge * 1000, nowIso(), nowIso());
    audit(user.id, 'login', user.account);
    const persistentCookie = body.remember ? `; Max-Age=${maxAge}` : '';
    return sendJson(res, 200, { user: publicUser(user), state: stateSnapshot(user) }, { 'Set-Cookie': `zhuxu_session=${encodeURIComponent(token)}; ${COOKIE_SECURE ? 'Secure; ' : ''}HttpOnly; SameSite=Strict; Path=/${persistentCookie}` });
  }
  if (req.method === 'POST' && url.pathname === '/api/logout') {
    const token = parseCookies(req).zhuxu_session;
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(crypto.createHash('sha256').update(token).digest('hex'));
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': `zhuxu_session=; ${COOKIE_SECURE ? 'Secure; ' : ''}HttpOnly; SameSite=Strict; Path=/; Max-Age=0` });
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    const session = sessionUser(req);
    return sendJson(res, 200, { ok: true, user: session ? publicUser(session) : null });
  }
  const user = requireUser(req, res);
  if (!user) return;
  if (req.method === 'POST' && url.pathname === '/api/attachments') return handleAttachmentUpload(req, res, user);
  const attachmentGet = url.pathname.match(/^\/api\/attachments\/([^/]+)$/);
  if (req.method === 'GET' && attachmentGet) return handleAttachmentDownload(req, res, user, decodeURIComponent(attachmentGet[1]));
  const stateMatch = url.pathname.match(/^\/api\/state\/([^/]+)$/);
  if (req.method === 'PUT' && stateMatch) {
    const key = decodeURIComponent(stateMatch[1]);
    if (!SHARED_KEYS.has(key)) return sendJson(res, 400, { error: '不支持的共享数据类型' });
    if (key === COST_STATE_KEY && !canAccessCost(user)) { audit(user.id, 'permission_denied', COST_STATE_KEY); return sendJson(res, 403, { error: '当前岗位无成控文件读写权限' }); }
    const body = await readJson(req);
    setState(key, body.value, user.id);
    if (key === 'zhuxu-organization' && Array.isArray(body.value)) {
      const updateUser = db.prepare('UPDATE users SET name = ?, role = ?, phone = ?, scope = ?, updated_at = ? WHERE id = ?');
      for (const person of body.value) updateUser.run(person.name, person.role, person.phone || '', person.scope || '', nowIso(), String(person.id));
    }
    audit(user.id, 'state_update', key);
    return sendJson(res, 200, { ok: true });
  }
  const approvalMatch = url.pathname.match(/^\/api\/approvals\/([^/]+)\/(\d+)$/);
  if (req.method === 'POST' && approvalMatch) {
    const body = await readJson(req); const action = body.action;
    if (!['approve', 'reject'].includes(action)) return sendJson(res, 400, { error: '审批动作无效' });
    const row = db.prepare('SELECT value_json FROM project_state WHERE state_key = ?').get('zhuxu-resource-plans');
    if (!row) return sendJson(res, 409, { error: '材料计划尚未同步到服务器，请刷新后重试' });
    const plans = JSON.parse(row.value_json);
    const plan = plans.find(item => String(item.id) === decodeURIComponent(approvalMatch[1]));
    const stepIndex = Number(approvalMatch[2]); const step = plan?.approvalWorkflow?.[stepIndex];
    if (!plan || !step) return sendJson(res, 404, { error: '审批节点不存在' });
    const currentIndex = plan.approvalWorkflow.findIndex((item, index) => item.status === 'pending' && plan.approvalWorkflow.slice(0, index).every(previous => previous.status === 'approved'));
    if (stepIndex !== currentIndex) return sendJson(res, 409, { error: '当前还未轮到该审批节点', currentIndex });
    if (String(step.ownerId || '') !== String(user.id)) return sendJson(res, 403, { error: `无权代办：当前节点由${step.owner}本人审批` });
    step.status = action === 'approve' ? 'approved' : 'rejected'; step.actedAt = nowIso(); step.actedBy = `${user.name} · ${user.role}`; step.actedByAccount = user.account;
    if (action === 'reject') plan.approvalWorkflow.slice(stepIndex + 1).forEach(item => { item.status = 'pending'; delete item.actedAt; delete item.actedBy; delete item.actedByAccount; });
    setState('zhuxu-resource-plans', plans, user.id); audit(user.id, action === 'approve' ? 'approval_approved' : 'approval_rejected', `resource-plan:${plan.id}:step:${stepIndex}`, { role: step.role });
    return sendJson(res, 200, { resourcePlans: plans, plan });
  }
  return sendJson(res, 404, { error: '接口不存在' });
}

function serveStatic(req, res, url) {
  if (url.pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
  const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1)).replace(/\\/g, '/');
  if (!PUBLIC_FILES.has(relative)) return sendJson(res, 404, { error: '文件不存在' });
  const filePath = path.join(ROOT, ...relative.split('/'));
  fs.readFile(filePath, (error, data) => {
    if (error) return sendJson(res, 404, { error: '文件不存在' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream', 'Content-Length': data.length, 'Cache-Control': relative === 'index.html' ? 'no-store' : 'public, max-age=60' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
    else if (req.method === 'GET' || req.method === 'HEAD') serveStatic(req, res, url);
    else sendJson(res, 405, { error: '请求方式不允许' });
  } catch (error) {
    if (!res.headersSent) sendJson(res, error.status || 500, { error: error.status ? error.message : '服务器内部错误' });
    if (!error.status) console.error(error);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n筑序 · 项目局域网多人版已启动`);
  console.log(`本机登录：http://127.0.0.1:${PORT}`);
  for (const interfaces of Object.values(os.networkInterfaces())) for (const item of interfaces || []) {
    if (item.family === 'IPv4' && !item.internal) console.log(`局域网登录：http://${item.address}:${PORT}`);
  }
  console.log(`数据库：${DB_PATH}`);
  console.log('按 Ctrl+C 停止服务。\n');
});

function shutdown() {
  server.close(() => { db.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 3000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
