#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "$#" -ne 1 ]; then
  echo "用法: $0 data/backups/zhuxu-xxxx.tar.gz"
  exit 1
fi
ARCHIVE="$1"
if [ ! -f "$ARCHIVE" ]; then
  echo "备份文件不存在：$ARCHIVE"
  exit 1
fi
echo "正在停止服务..."
docker compose stop zhuxu
TMP=$(mktemp -d)
tar -xzf "$ARCHIVE" -C "$TMP"
SQLITE=$(find "$TMP" -maxdepth 1 -name 'zhuxu-*.sqlite' | head -1)
if [ -n "$SQLITE" ]; then
  cp "$SQLITE" data/zhuxu-lan.sqlite
fi
if [ -d "$TMP/uploads" ]; then
  rm -rf data/uploads
  cp -a "$TMP/uploads" data/uploads
fi
rm -rf "$TMP"
docker compose start zhuxu
echo "恢复完成"