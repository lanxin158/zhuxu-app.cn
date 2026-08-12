'use strict';
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const dataDir = process.env.ZHUXU_DATA_DIR || '/data';
const dbPath = process.env.ZHUXU_DB_PATH || path.join(dataDir, 'zhuxu-lan.sqlite');
const backupDir = path.join(dataDir, 'backups');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const sqliteName = `zhuxu-${stamp}.sqlite`;
const sqlitePath = path.join(backupDir, sqliteName);
const db = new DatabaseSync(dbPath);
db.exec(`VACUUM INTO '${sqlitePath.replace(/'/g, "''")}'`);
db.close();
const archivePath = path.join(backupDir, `zhuxu-${stamp}.tar.gz`);
execFileSync('tar', ['-czf', archivePath, '-C', backupDir, sqliteName, '-C', dataDir, 'uploads'], { stdio: 'inherit' });
fs.unlinkSync(sqlitePath);
const cutoff = Date.now() - 14 * 24 * 3600 * 1000;
for (const name of fs.readdirSync(backupDir)) {
  if (!name.endsWith('.tar.gz')) continue;
  const full = path.join(backupDir, name);
  const stat = fs.statSync(full);
  if (stat.mtimeMs < cutoff) fs.unlinkSync(full);
}
console.log(`备份完成：${archivePath}`);