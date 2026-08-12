@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 筑序 - 项目局域网多人版

rem 本服务只在项目局域网内运行，不使用系统或命令行代理。
set "HTTP_PROXY="
set "HTTPS_PROXY="
set "ALL_PROXY="
set "NO_PROXY=localhost,127.0.0.1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12"

where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js，请先安装 Node.js 22 或更高版本。
  echo 下载地址：https://nodejs.org/
  pause
  exit /b 1
)

echo ============================================================
echo  筑序 - 项目局域网多人版
echo ============================================================
echo 本机登录：http://127.0.0.1:8080
echo 其他电脑：http://192.168.1.6:8080
echo.
echo 提示：本窗口必须保持开启，关闭窗口即停止服务。
echo 如浏览器启用了代理，请双击“打开局域网直连.cmd”。
echo ============================================================
echo.
echo 正在启动服务……
node --no-warnings server.js

echo.
echo 服务已停止。
pause
