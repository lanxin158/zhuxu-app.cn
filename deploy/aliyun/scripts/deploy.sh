#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "正在安装 Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "正在安装 Docker Compose 插件..."
  apt-get update -y
  apt-get install -y docker-compose-plugin
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "已生成 .env（默认配置适合 HTTPS 场景）"
fi

docker compose up -d --build
docker compose ps
echo ""
echo "服务已启动：http://127.0.0.1:8080（服务器本机验证）"
echo "外部访问请先运行 ./scripts/tailscale-setup.sh（无域名）或配置 Caddy（有域名）"