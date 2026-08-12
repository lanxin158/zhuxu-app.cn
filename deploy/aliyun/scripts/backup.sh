#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p data/backups
docker compose exec -T zhuxu node /app/scripts/backup.js
echo "备份位置：$(pwd)/data/backups/"