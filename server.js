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
    enabled INTEGER NOT NULL DEFAULT 1, must_change_password INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, status INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT NOT NULL REFERENCES projects(id), user_id TEXT NOT NULL REFERENCES users(id),
    role TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', scope TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (project_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), project_id TEXT NOT NULL DEFAULT '',
    expires_at INTEGER NOT NULL, created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS project_state (
    project_id TEXT NOT NULL DEFAULT 'default', state_key TEXT NOT NULL,
    value_json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL,
    PRIMARY KEY (project_id, state_key)
  );
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, action TEXT NOT NULL, target TEXT NOT NULL,
    detail_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
  );
`);
const userColumns = db.prepare('PRAGMA table_info(users)').all().map(row => row.name);
if (!userColumns.includes('must_change_password')) db.exec('ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0');
const stateColumns = db.prepare('PRAGMA table_info(project_state)').all().map(row => row.name);
const legacyStateSchema = !stateColumns.includes('project_id');
if (legacyStateSchema) {
  db.exec(`
    CREATE TABLE project_state_new (project_id TEXT NOT NULL DEFAULT 'default', state_key TEXT NOT NULL,
      value_json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY (project_id, state_key));
    INSERT INTO project_state_new (project_id, state_key, value_json, revision, updated_by, updated_at)
      SELECT 'default', state_key, value_json, revision, updated_by, updated_at FROM project_state;
    DROP TABLE project_state;
    ALTER TABLE project_state_new RENAME TO project_state;
  `);
}
const sessionColumns = db.prepare('PRAGMA table_info(sessions)').all().map(row => row.name);
if (!sessionColumns.includes('project_id')) db.exec('ALTER TABLE sessions ADD COLUMN project_id TEXT NOT NULL DEFAULT \'\'');

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

// 老库迁移：保留既有账号与数据到默认项目，避免升级丢数据；全新空库不做任何播种，由初始化向导创建首个项目与管理员。
if (legacyStateSchema) {
  db.prepare(`INSERT OR IGNORE INTO projects (id, name, code, created_by, created_at, status) VALUES ('default', '云河智造中心一期', '', '', ?, 1)`).run(nowIso());
  db.prepare(`INSERT OR IGNORE INTO project_members (project_id, user_id, role, phone, scope)
    SELECT 'default', id, role, phone, scope FROM users`).run();
  db.prepare(`UPDATE sessions SET project_id = 'default' WHERE project_id = ''`).run();
  const insertLegacyUser = db.prepare(`INSERT OR IGNORE INTO users
    (id, account, name, role, phone, scope, password_salt, password_hash, must_change_password, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`);
  for (const [id, account, name, role, phone, scope] of defaultUsers) {
    const password = passwordRecord(phonePassword(phone));
    insertLegacyUser.run(id, account, name, role, phone, scope, password.salt, password.hash, nowIso());
  }
  db.prepare(`INSERT OR IGNORE INTO project_members (project_id, user_id, role, phone, scope)
    SELECT 'default', id, role, phone, scope FROM users`).run();
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
function mustChangePending(user) { return Boolean(user && user.must_change_password === 1); }
function isProjectManager(user) { return Boolean(user && /项目经理/.test(String(user.role || ''))); }
function publicUser(user) {
  if (!user) return null;
  const base = { id: user.id, account: user.account, name: user.name, role: user.role, phone: user.phone, scope: user.scope, permissions: { cost: canAccessCost(user) }, mustChangePassword: mustChangePending(user), project: user.project_id ? { id: user.project_id, name: user.project_name || '', code: user.project_code || '' } : null };
  base.projects = db.prepare(`SELECT p.id, p.name, p.code, pm.role FROM project_members pm JOIN projects p ON p.id = pm.project_id AND p.status = 1 WHERE pm.user_id = ? ORDER BY p.created_at, p.name`).all(user.id).map(row => ({ id: row.id, name: row.name, code: row.code, role: row.role }));
  return base;
}
const STATE_WRITE_ROLES = {
  'zhuxu-organization': ['项目经理'],
  'zhuxu-attendance': ['劳资员', '项目经理']
};
function canWriteStateKey(user, key) {
  const allowedRoles = STATE_WRITE_ROLES[key];
  if (!allowedRoles) return true;
  return allowedRoles.some(role => String(user.role || '').includes(role));
}
function requireChangedUser(user, res) {
  if (mustChangePending(user)) { audit(user.id, 'permission_denied', 'must-change-password'); sendJson(res, 403, { error: '请先修改初始密码后再继续操作' }); return false; }
  return true;
}
function requireProjectManager(user, res) {
  if (!isProjectManager(user)) { audit(user.id, 'permission_denied', 'account-management'); sendJson(res, 403, { error: '仅项目经理可管理项目账号' }); return false; }
  return true;
}
function passwordPolicyError(password) {
  const value = String(password || '');
  if (value.length < 8) return '新密码至少 8 位';
  if (!/\p{L}/u.test(value) || !/\p{N}/u.test(value)) return '新密码必须同时包含字母和数字';
  return null;
}
function getState(key, projectId) {
  const row = db.prepare('SELECT value_json FROM project_state WHERE project_id = ? AND state_key = ?').get(projectId || '', key);
  if (!row) return null;
  try { return JSON.parse(row.value_json); } catch { return null; }
}
function stateSnapshot(user) {
  const result = {};
  for (const row of db.prepare('SELECT state_key, value_json FROM project_state WHERE project_id = ?').all(user.project_id || '')) {
    if (row.state_key === COST_STATE_KEY && !canAccessCost(user)) continue;
    try { result[row.state_key] = JSON.parse(row.value_json); } catch { /* 跳过损坏状态 */ }
  }
  return result;
}

function isCostAttachment(id, projectId) {
  const row = db.prepare('SELECT value_json FROM project_state WHERE project_id = ? AND state_key = ?').get(projectId || '', COST_STATE_KEY);
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
  const row = db.prepare(`SELECT users.*, pm.role AS member_role, pm.phone AS member_phone, pm.scope AS member_scope,
    sessions.project_id AS project_id, projects.name AS project_name, projects.code AS project_code
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    JOIN projects ON projects.id = sessions.project_id AND projects.status = 1
    JOIN project_members pm ON pm.user_id = users.id AND pm.project_id = sessions.project_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND users.enabled = 1`).get(tokenHash, Date.now());
  if (!row) return null;
  row.role = row.member_role || row.role;
  row.phone = row.member_phone || row.phone;
  row.scope = row.member_scope || row.scope;
  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?').run(nowIso(), tokenHash);
  return row;
}
function requireUser(req, res) {
  const user = sessionUser(req);
  if (!user) sendJson(res, 401, { error: '请先登录', server: true });
  return user;
}
function setState(key, value, userId, projectId) {
  db.prepare(`INSERT INTO project_state (project_id, state_key, value_json, revision, updated_by, updated_at) VALUES (?, ?, ?, 1, ?, ?)
    ON CONFLICT(project_id, state_key) DO UPDATE SET value_json = excluded.value_json, revision = project_state.revision + 1,
    updated_by = excluded.updated_by, updated_at = excluded.updated_at`).run(projectId || 'default', key, JSON.stringify(value), userId, nowIso());
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
  if (isCostAttachment(id, user.project_id) && !canAccessCost(user)) { audit(user.id, 'permission_denied', `cost-attachment:${id}`); return sendJson(res, 403, { error: '无成控文件访问权限' }); }
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

function validateProjectSetup(body) {
  const projectName = String(body.projectName || '').trim();
  const projectCode = String(body.projectCode || '').trim();
  const adminName = String(body.adminName || '').trim();
  const adminAccount = String(body.adminAccount || '').trim().toLowerCase();
  const adminPhone = String(body.adminPhone || '').trim();
  const adminPassword = String(body.adminPassword || '');
  const errors = [];
  if (!projectName) errors.push('请填写项目名称');
  if (projectName && projectName.length > 60) errors.push('项目名称过长');
  if (!adminName || !adminAccount) errors.push('管理员姓名和登录账号为必填项');
  if (adminAccount && !/^[a-z0-9._-]{3,}$/.test(adminAccount)) errors.push('登录账号仅支持小写字母、数字、点、下划线和连字符');
  const accountExists = Boolean(adminAccount && db.prepare('SELECT id FROM users WHERE lower(account) = ?').get(adminAccount));
  if (adminPhone.replace(/\D/g, '').length < 6) errors.push('管理员手机号需至少包含 6 位数字');
  if (!accountExists) {
    const policyError = passwordPolicyError(adminPassword);
    if (policyError) errors.push(`管理员密码：${policyError}`);
  }
  return { projectName, projectCode, adminName, adminAccount, adminPhone, adminPassword, accountExists, errors };
}

function createProjectRecord(setup, actorUserId = null) {
  const projectId = 'proj-' + crypto.randomBytes(8).toString('hex');
  db.prepare('INSERT INTO projects (id, name, code, created_by, created_at, status) VALUES (?, ?, ?, ?, ?, 1)').run(projectId, setup.projectName, setup.projectCode, setup.adminName, nowIso());
  let adminId;
  const existing = db.prepare('SELECT * FROM users WHERE lower(account) = ?').get(setup.adminAccount);
  if (existing) {
    // 已有账号复用为该项目管理员：使用其原有密码，直接加入新项目成员
    adminId = existing.id;
    db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role, phone, scope) VALUES (?, ?, ?, ?, ?)').run(projectId, adminId, '项目经理', setup.adminPhone, '项目统筹与重大协调');
    db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(setup.adminName, nowIso(), adminId);
  } else {
    adminId = 'admin-' + crypto.randomBytes(8).toString('hex');
    const password = passwordRecord(setup.adminPassword);
    db.prepare('INSERT INTO users (id, account, name, role, phone, scope, password_salt, password_hash, enabled, must_change_password, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)').run(adminId, setup.adminAccount, setup.adminName, '项目经理', setup.adminPhone, '项目统筹与重大协调', password.salt, password.hash, nowIso());
    db.prepare('INSERT INTO project_members (project_id, user_id, role, phone, scope) VALUES (?, ?, ?, ?, ?)').run(projectId, adminId, '项目经理', setup.adminPhone, '项目统筹与重大协调');
  }
  const organizationState = [{ id: adminId, name: setup.adminName, role: '项目经理', account: setup.adminAccount, phone: setup.adminPhone, scope: '项目统筹与重大协调' }];
  if (actorUserId && String(actorUserId) !== String(adminId)) {
    // 创建者自动加入新项目，便于在项目菜单中直接切换
    const actor = db.prepare('SELECT * FROM users WHERE id = ?').get(actorUserId);
    db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role, phone, scope) VALUES (?, ?, ?, ?, ?)').run(projectId, actorUserId, '项目经理', actor?.phone || '', '项目创建人');
    if (actor) organizationState.push({ id: actor.id, name: actor.name, role: '项目经理', account: actor.account, phone: actor.phone || '', scope: '项目创建人' });
  }
  setState('zhuxu-organization', organizationState, adminId, projectId);
  return { projectId, adminId, reused: Boolean(existing) };
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/bootstrap') {
    const user = sessionUser(req);
    if (user) return sendJson(res, 200, { server: true, authenticated: true, user: publicUser(user), state: stateSnapshot(user) });
    const projects = db.prepare('SELECT id, name, code FROM projects WHERE status = 1 ORDER BY created_at, name').all();
    return sendJson(res, 200, { server: true, authenticated: false, needsInit: projects.length === 0, projects });
  }
  if (req.method === 'POST' && url.pathname === '/api/projects/init') {
    const existing = db.prepare('SELECT COUNT(*) AS count FROM projects').get();
    if (existing.count > 0) return sendJson(res, 409, { error: '系统已初始化，请直接登录使用；新项目由项目经理在项目菜单中建立' });
    const setup = validateProjectSetup(await readJson(req));
    if (setup.errors.length) return sendJson(res, 400, { error: setup.errors.join('；') });
    const { projectId, adminId } = createProjectRecord(setup);
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    db.prepare('INSERT INTO sessions (token_hash, user_id, project_id, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)').run(tokenHash, adminId, projectId, Date.now() + 7 * 24 * 3600 * 1000, nowIso(), nowIso());
    audit(adminId, 'project_initialized', projectId, { projectName: setup.projectName, adminAccount: setup.adminAccount });
    const sessionRow = { ...db.prepare('SELECT * FROM users WHERE id = ?').get(adminId), role: '项目经理', project_id: projectId, project_name: setup.projectName, project_code: setup.projectCode };
    return sendJson(res, 200, { ok: true, user: publicUser(sessionRow), state: stateSnapshot(sessionRow) }, { 'Set-Cookie': `zhuxu_session=${encodeURIComponent(token)}; ${COOKIE_SECURE ? 'Secure; ' : ''}HttpOnly; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 3600}` });
  }
  if (req.method === 'POST' && url.pathname === '/api/login') {
    const ip = clientIp(req);
    if (!loginAllowed(ip)) return sendJson(res, 429, { error: '登录失败次数过多，请十分钟后重试' });
    const body = await readJson(req);
    const account = String(body.account || '').trim().toLowerCase();
    let projectId = String(body.projectId || '').trim();
    const user = db.prepare('SELECT * FROM users WHERE lower(account) = ? AND enabled = 1').get(account);
    let member = user && projectId ? db.prepare('SELECT pm.role, pm.phone, pm.scope, p.name AS project_name, p.code AS project_code FROM project_members pm JOIN projects p ON p.id = pm.project_id AND p.status = 1 WHERE pm.user_id = ? AND pm.project_id = ?').get(user.id, projectId) : null;
    if (!member && user && !projectId) {
      // 未选择项目：账号只属于一个项目时自动带入；属于多个项目时提示选择
      const only = db.prepare('SELECT pm.project_id, pm.role, pm.phone, pm.scope, p.name AS project_name, p.code AS project_code FROM project_members pm JOIN projects p ON p.id = pm.project_id AND p.status = 1 WHERE pm.user_id = ?').all(user.id);
      if (only.length === 1) { projectId = only[0].project_id; member = only[0]; }
      else if (only.length > 1) return sendJson(res, 400, { error: '该账号属于多个项目，请在登录页选择要登录的项目' });
    }
    if (!user || !verifyPassword(String(body.password || ''), user.password_salt, user.password_hash) || !member) {
      recordFailedLogin(ip); audit(user?.id, 'login_failed', account, { projectId }); return sendJson(res, 401, { error: '账号或密码不正确，或未获授权登录该项目' });
    }
    loginAttempts.delete(ip);
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const maxAge = body.remember ? 7 * 24 * 3600 : SESSION_HOURS * 3600;
    db.prepare('INSERT INTO sessions (token_hash, user_id, project_id, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)').run(tokenHash, user.id, projectId, Date.now() + maxAge * 1000, nowIso(), nowIso());
    audit(user.id, 'login', user.account, { projectId });
    const sessionRow = { ...user, role: member.role || user.role, phone: member.phone || user.phone, scope: member.scope || user.scope, project_id: projectId, project_name: member.project_name, project_code: member.project_code };
    const persistentCookie = body.remember ? `; Max-Age=${maxAge}` : '';
    return sendJson(res, 200, { user: publicUser(sessionRow), state: stateSnapshot(sessionRow) }, { 'Set-Cookie': `zhuxu_session=${encodeURIComponent(token)}; ${COOKIE_SECURE ? 'Secure; ' : ''}HttpOnly; SameSite=Strict; Path=/${persistentCookie}` });
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
  if (req.method === 'POST' && url.pathname === '/api/projects') {
    if (!requireChangedUser(user, res) || !requireProjectManager(user, res)) return;
    const setup = validateProjectSetup(await readJson(req));
    if (setup.errors.length) return sendJson(res, 400, { error: setup.errors.join('；') });
    const { projectId, reused } = createProjectRecord(setup, user.id);
    audit(user.id, 'project_created', projectId, { projectName: setup.projectName, adminAccount: setup.adminAccount, reused, createdBy: user.account });
    return sendJson(res, 200, { ok: true, project: { id: projectId, name: setup.projectName, code: setup.projectCode }, adminAccount: setup.adminAccount, reused });
  }
  if (req.method === 'POST' && url.pathname === '/api/projects/switch') {
    if (!requireChangedUser(user, res)) return;
    const body = await readJson(req);
    const projectId = String(body.projectId || '').trim();
    const member = projectId ? db.prepare(`SELECT pm.role, pm.phone, pm.scope, p.name AS project_name, p.code AS project_code FROM project_members pm JOIN projects p ON p.id = pm.project_id AND p.status = 1 WHERE pm.user_id = ? AND pm.project_id = ?`).get(user.id, projectId) : null;
    if (!member) { audit(user.id, 'permission_denied', 'project-switch', { projectId }); return sendJson(res, 403, { error: '当前账号未获授权访问该项目' }); }
    const currentTokenHash = crypto.createHash('sha256').update(parseCookies(req).zhuxu_session || '').digest('hex');
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(currentTokenHash);
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    db.prepare('INSERT INTO sessions (token_hash, user_id, project_id, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)').run(tokenHash, user.id, projectId, Date.now() + SESSION_HOURS * 3600 * 1000, nowIso(), nowIso());
    audit(user.id, 'project_switch', projectId, { from: user.project_id });
    const sessionRow = { ...db.prepare('SELECT * FROM users WHERE id = ?').get(user.id), role: member.role || user.role, phone: member.phone || user.phone, scope: member.scope || user.scope, project_id: projectId, project_name: member.project_name, project_code: member.project_code };
    return sendJson(res, 200, { ok: true, user: publicUser(sessionRow), state: stateSnapshot(sessionRow) }, { 'Set-Cookie': `zhuxu_session=${encodeURIComponent(token)}; ${COOKIE_SECURE ? 'Secure; ' : ''}HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}` });
  }
  if (req.method === 'POST' && url.pathname === '/api/password/change') {
    const body = await readJson(req);
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    if (!verifyPassword(currentPassword, user.password_salt, user.password_hash)) {
      audit(user.id, 'password_change_failed', user.account, { reason: 'wrong_current' });
      return sendJson(res, 400, { error: '当前密码不正确' });
    }
    const policyError = passwordPolicyError(newPassword);
    if (policyError) return sendJson(res, 400, { error: policyError });
    if (currentPassword === newPassword) return sendJson(res, 400, { error: '新密码不能与当前密码相同' });
    const record = passwordRecord(newPassword);
    db.prepare('UPDATE users SET password_salt = ?, password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?').run(record.salt, record.hash, nowIso(), user.id);
    const currentTokenHash = crypto.createHash('sha256').update(parseCookies(req).zhuxu_session || '').digest('hex');
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(user.id, currentTokenHash);
    audit(user.id, 'password_changed', user.account);
    return sendJson(res, 200, { ok: true });
  }
  if (req.method === 'GET' && url.pathname === '/api/accounts') {
    if (!requireChangedUser(user, res) || !requireProjectManager(user, res)) return;
    const accounts = db.prepare(`SELECT u.id, u.account, u.name, u.enabled, u.must_change_password AS mustChangePassword, u.updated_at AS updatedAt, pm.role, pm.phone, pm.scope
      FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ? ORDER BY u.enabled DESC, pm.role, u.name`).all(user.project_id);
    return sendJson(res, 200, { accounts });
  }
  if (req.method === 'POST' && url.pathname === '/api/accounts') {
    if (!requireChangedUser(user, res) || !requireProjectManager(user, res)) return;
    const body = await readJson(req);
    const name = String(body.name || '').trim();
    const role = String(body.role || '').trim();
    const account = String(body.account || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const scope = String(body.scope || '').trim();
    if (!name || !role || !account) return sendJson(res, 400, { error: '姓名、岗位和登录账号为必填项' });
    if (!/^[a-z0-9._-]{3,}$/.test(account)) return sendJson(res, 400, { error: '登录账号仅支持小写字母、数字、点、下划线和连字符' });
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 6) return sendJson(res, 400, { error: '手机号需至少包含 6 位数字（后六位将作为初始密码）' });
    const existing = db.prepare('SELECT * FROM users WHERE lower(account) = ?').get(account);
    let accountId;
    let created = false;
    if (existing) {
      if (db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(user.project_id, existing.id)) return sendJson(res, 409, { error: '该账号已在当前项目中' });
      accountId = existing.id;
      db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role, phone, scope) VALUES (?, ?, ?, ?, ?)').run(user.project_id, existing.id, role, phone, scope);
      db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(name, nowIso(), existing.id);
    } else {
      accountId = 'acct-' + crypto.randomBytes(8).toString('hex');
      const password = passwordRecord(phoneDigits.slice(-6));
      db.prepare('INSERT INTO users (id, account, name, role, phone, scope, password_salt, password_hash, enabled, must_change_password, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)').run(accountId, account, name, role, phone, scope, password.salt, password.hash, nowIso());
      db.prepare('INSERT INTO project_members (project_id, user_id, role, phone, scope) VALUES (?, ?, ?, ?, ?)').run(user.project_id, accountId, role, phone, scope);
      created = true;
    }
    const organizationState = getState('zhuxu-organization', user.project_id);
    if (Array.isArray(organizationState) && !organizationState.some(person => String(person.id) === accountId)) {
      organizationState.push({ id: accountId, name, role, account, phone, scope });
      setState('zhuxu-organization', organizationState, user.id, user.project_id);
    }
    audit(user.id, 'account_created', accountId, { account, name, role, projectId: user.project_id, created });
    return sendJson(res, 200, { ok: true, account: { id: accountId, account, name, role, phone, scope, enabled: 1, mustChangePassword: existing ? Boolean(existing.must_change_password) : true, created } });
  }
  const accountUpdateMatch = url.pathname.match(/^\/api\/accounts\/([^/]+)$/);
  if (req.method === 'PUT' && accountUpdateMatch) {
    if (!requireChangedUser(user, res) || !requireProjectManager(user, res)) return;
    const targetId = decodeURIComponent(accountUpdateMatch[1]);
    const target = db.prepare(`SELECT u.*, pm.role AS member_role, pm.phone AS member_phone, pm.scope AS member_scope
      FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ? AND pm.user_id = ?`).get(user.project_id, targetId);
    if (!target) return sendJson(res, 404, { error: '账号不在当前项目中' });
    const body = await readJson(req);
    const userUpdate = {};
    const memberUpdate = {};
    if (body.name !== undefined) {
      const value = String(body.name).trim();
      if (!value) return sendJson(res, 400, { error: '姓名不能为空' });
      userUpdate.name = value;
    }
    if (body.role !== undefined) {
      const value = String(body.role).trim();
      if (!value) return sendJson(res, 400, { error: '岗位不能为空' });
      memberUpdate.role = value;
    }
    if (body.phone !== undefined) {
      const value = String(body.phone).trim();
      if (value.replace(/\D/g, '').length < 6) return sendJson(res, 400, { error: '手机号需至少包含 6 位数字' });
      memberUpdate.phone = value;
    }
    if (body.scope !== undefined) memberUpdate.scope = String(body.scope).trim();
    if (body.enabled !== undefined) userUpdate.enabled = body.enabled ? 1 : 0;
    let resetPassword = false;
    if (body.resetPassword) {
      const digits = String(memberUpdate.phone || target.member_phone || target.phone).replace(/\D/g, '');
      const password = passwordRecord(digits.slice(-6));
      userUpdate.password_salt = password.salt;
      userUpdate.password_hash = password.hash;
      userUpdate.must_change_password = 1;
      resetPassword = true;
    }
    if (Object.keys(userUpdate).length === 0 && Object.keys(memberUpdate).length === 0) return sendJson(res, 400, { error: '没有需要更新的内容' });
    if (Object.keys(userUpdate).length) {
      userUpdate.updated_at = nowIso();
      const columns = Object.keys(userUpdate).map(key => `${key} = ?`).join(', ');
      db.prepare(`UPDATE users SET ${columns} WHERE id = ?`).run(...Object.values(userUpdate), target.id);
    }
    if (Object.keys(memberUpdate).length) {
      const columns = Object.keys(memberUpdate).map(key => `${key} = ?`).join(', ');
      db.prepare(`UPDATE project_members SET ${columns} WHERE project_id = ? AND user_id = ?`).run(...Object.values(memberUpdate), user.project_id, target.id);
    }
    if (resetPassword) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(target.id);
    const organizationState = getState('zhuxu-organization', user.project_id);
    if (Array.isArray(organizationState)) {
      setState('zhuxu-organization', organizationState.map(person => String(person.id) === String(target.id) ? { ...person, name: userUpdate.name ?? person.name, role: memberUpdate.role ?? person.role, phone: memberUpdate.phone ?? person.phone, scope: memberUpdate.scope ?? person.scope } : person), user.id, user.project_id);
    }
    audit(user.id, resetPassword ? 'account_password_reset' : 'account_updated', target.id, { account: target.account, projectId: user.project_id, ...(userUpdate.enabled !== undefined ? { enabled: userUpdate.enabled } : {}), resetPassword });
    return sendJson(res, 200, { ok: true });
  }
  if (req.method === 'POST' && url.pathname === '/api/attachments') return handleAttachmentUpload(req, res, user);
  const attachmentGet = url.pathname.match(/^\/api\/attachments\/([^/]+)$/);
  if (req.method === 'GET' && attachmentGet) return handleAttachmentDownload(req, res, user, decodeURIComponent(attachmentGet[1]));
  const stateMatch = url.pathname.match(/^\/api\/state\/([^/]+)$/);
  if (req.method === 'PUT' && stateMatch) {
    const key = decodeURIComponent(stateMatch[1]);
    if (!SHARED_KEYS.has(key)) return sendJson(res, 400, { error: '不支持的共享数据类型' });
    if (!requireChangedUser(user, res)) return;
    if (key === COST_STATE_KEY && !canAccessCost(user)) { audit(user.id, 'permission_denied', COST_STATE_KEY); return sendJson(res, 403, { error: '当前岗位无成控文件读写权限' }); }
    if (!canWriteStateKey(user, key)) { audit(user.id, 'permission_denied', key); return sendJson(res, 403, { error: '当前岗位无此数据写入权限' }); }
    const body = await readJson(req);
    setState(key, body.value, user.id, user.project_id);
    if (key === 'zhuxu-organization' && Array.isArray(body.value)) {
      const updateMember = db.prepare('UPDATE project_members SET role = ?, phone = ?, scope = ? WHERE project_id = ? AND user_id = ?');
      for (const person of body.value) {
        db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(person.name, nowIso(), String(person.id));
        updateMember.run(person.role, person.phone || '', person.scope || '', user.project_id, String(person.id));
      }
    }
    audit(user.id, 'state_update', key, { projectId: user.project_id });
    return sendJson(res, 200, { ok: true });
  }
  const approvalMatch = url.pathname.match(/^\/api\/approvals\/([^/]+)\/(\d+)$/);
  if (req.method === 'POST' && approvalMatch) {
    if (!requireChangedUser(user, res)) return;
    const body = await readJson(req); const action = body.action;
    if (!['approve', 'reject'].includes(action)) return sendJson(res, 400, { error: '审批动作无效' });
    const row = db.prepare('SELECT value_json FROM project_state WHERE project_id = ? AND state_key = ?').get(user.project_id, 'zhuxu-resource-plans');
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
    setState('zhuxu-resource-plans', plans, user.id, user.project_id); audit(user.id, action === 'approve' ? 'approval_approved' : 'approval_rejected', `resource-plan:${plan.id}:step:${stepIndex}`, { role: step.role, projectId: user.project_id });
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
