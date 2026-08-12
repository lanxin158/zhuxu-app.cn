#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v tailscale >/dev/null 2>&1; then
  echo "正在安装 Tailscale ..."
  curl -fsSL https://tailscale.com/install.sh | sh
  systemctl enable --now tailscaled
fi

if ! docker compose ps --services 2>/dev/null | grep -qx zhuxu; then
  echo "提示：筑序容器未运行，请先执行 bash scripts/deploy.sh。"
fi

echo "正在连接 Tailscale 网络 ..."
tailscale up

echo "等待网络就绪 ..."
for i in $(seq 1 30); do
  if tailscale status --json 2>/dev/null | grep -q '"Online":true'; then
    break
  fi
  sleep 1
done

echo "正在把 127.0.0.1:8080 开放为 HTTPS 访问 ..."
tailscale serve --bg 8080

sleep 2

DNS_NAME=$(tailscale status --json 2>/dev/null | grep -o '"DNSName":"[^"]*"' | head -1 | cut -d'"' -f4 | sed 's/\.$//')

echo ""
echo "=============================================="
echo " Tailscale 组网已完成"
if [ -n "$DNS_NAME" ]; then
  echo " 全体成员访问地址：https://$DNS_NAME"
else
  echo " 未能自动识别地址，请运行 tailscale status 查看机器名："
  tailscale status
fi
echo "=============================================="
echo ""
echo "成员端操作："
echo " 1. 手机/电脑安装 Tailscale 客户端并登录（同一账号或接受邀请）"
echo " 2. 浏览器打开上面的 HTTPS 地址"
echo " 3. 用组织架构账号登录筑序（初始密码为手机号后六位）"
echo ""
echo "查看状态：bash scripts/tailscale-status.sh"
echo "服务器重启后无需重新配置，tailscaled 和 serve 配置会自动恢复。"