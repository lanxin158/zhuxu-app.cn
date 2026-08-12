#!/usr/bin/env bash
set -euo pipefail
echo "===== Tailscale 网络状态 ====="
tailscale status
echo ""
echo "===== HTTPS 转发状态 ====="
tailscale serve status
echo ""
echo "成员访问地址为上面输出中的 https://<机器名>.<tailnet>.ts.net"