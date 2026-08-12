@echo off
chcp 65001 >nul
title 筑序 - 无代理直连

set "APP_URL=http://192.168.1.6:8080"
if not "%~1"=="" set "APP_URL=%~1"
set "BROWSER_PROFILE=%TEMP%\zhuxu-lan-direct-browser"

set "EDGE_PATH=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE_PATH%" goto open_edge
set "EDGE_PATH=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE_PATH%" goto open_edge

set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME_PATH%" goto open_chrome
set "CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME_PATH%" goto open_chrome

echo 未找到 Edge 或 Chrome。
echo 请把下面地址复制到浏览器，并将局域网地址设置为“不使用代理”：
echo %APP_URL%
pause
exit /b 1

:open_edge
start "" "%EDGE_PATH%" --no-proxy-server --user-data-dir="%BROWSER_PROFILE%" "%APP_URL%"
exit /b 0

:open_chrome
start "" "%CHROME_PATH%" --no-proxy-server --user-data-dir="%BROWSER_PROFILE%" "%APP_URL%"
exit /b 0
