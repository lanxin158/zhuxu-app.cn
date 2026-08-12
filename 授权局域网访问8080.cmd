@echo off
chcp 65001 >nul
title 筑序 - 授权局域网访问

net session >nul 2>&1
if not "%errorlevel%"=="0" (
  echo 正在请求 Windows 管理员权限……
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo 正在配置筑序局域网访问规则……
netsh advfirewall firewall delete rule name="筑序项目局域网版-8080" >nul 2>&1
netsh advfirewall firewall add rule name="筑序项目局域网版-8080" dir=in action=allow protocol=TCP localport=8080 remoteip=localsubnet profile=any

if errorlevel 1 (
  echo.
  echo 配置失败，请确认当前账号具有管理员权限。
) else (
  echo.
  echo 配置成功：仅同一局域网子网可以访问 TCP 8080。
  echo 其他设备访问地址：http://192.168.1.6:8080
)

echo.
pause
