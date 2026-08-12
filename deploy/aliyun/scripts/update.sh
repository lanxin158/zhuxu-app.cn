#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
./scripts/backup.sh
docker compose build --pull
docker compose up -d
docker image prune -f
echo "更新完成"