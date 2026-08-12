#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "用法: bash scripts/caddy-setup.sh 你的域名"
  echo "示例: bash scripts/caddy-setup.sh zhuxu.example.com"
  exit 1
fi
DOMAIN="$1"

if ! command -v caddy >/dev/null 2>&1; then
  echo "正在安装 Caddy（官方源）..."
  apt-get update -y
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -y
  apt-get install -y caddy
fi

echo "备份现有 Caddy 配置 ..."
if [ -f /etc/caddy/Caddyfile ]; then
  cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak.$(date +%Y%m%d%H%M%S)"
fi

echo "写入 /etc/caddy/Caddyfile ..."
cat > /etc/caddy/Caddyfile <<EOF
${DOMAIN} {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8080
    header {
        Strict-Transport-Security "max-age=31536000"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    log {
        output file /var/log/caddy/zhuxu-access.log
    }
}
EOF

echo "校验配置 ..."
caddy validate --config /etc/caddy/Caddyfile

echo "启动 Caddy ..."
systemctl enable --now caddy
systemctl restart caddy

echo ""
echo "=============================================="
echo " HTTPS 已配置：https://${DOMAIN}"
echo " 请确认："
echo " 1. 域名 A 记录已解析到本服务器公网 IP；"
echo " 2. 阿里云安全组已放行 80 和 443；"
echo " 3. ICP 备案已完成（未备案时大陆服务器 80/443 会被拦截）。"
echo "=============================================="