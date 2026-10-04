#!/usr/bin/env bash
# Build and inspect this version in a disposable container; does not start/replace the live service.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose version
if [ ! -f .env ]; then
  echo "请先由部署人员按 .env.example 配置 .env，再运行此检查。不要将 .env 提交到 GitHub。" >&2
  exit 1
fi
docker compose config --quiet
docker compose build --pull
docker compose run --rm --no-deps zhuxu node -e '
const fs=require("node:fs"),{execFileSync}=require("node:child_process");
const files=["server.js","app.js","server-bridge.js","meeting-rules.js","schedule-rules.js","schedule-ui.js","schedule-recognition.js","schedule-recognition-ui.js","schedule-ocr-server.js","scripts/backup.js"];
for(const file of files){if(!fs.existsSync(file))throw new Error("缺少部署文件: "+file);execFileSync(process.execPath,["--check",file]);}
const langs=execFileSync("tesseract",["--list-langs"],{encoding:"utf8"}).split(/\r?\n/).map(s=>s.trim());
for(const lang of ["chi_sim","eng"])if(!langs.includes(lang))throw new Error("缺少OCR语言: "+lang);
if(!fs.existsSync("scripts/schedule-ocr.ps1"))throw new Error("缺少Windows OCR脚本");
console.log("PASS: 镜像代码语法、共享规则、备份脚本和中文/英文OCR组件完整。此结果不代替实际图片识别验收。");
'
