#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
bash scripts/backup.sh
docker compose build --pull
docker compose up -d
echo "容器已更新，请检查服务健康、登录、附件及图片识别；旧镜像未清理。"
