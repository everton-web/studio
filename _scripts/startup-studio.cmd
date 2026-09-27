@echo off
REM Sobe a agencia no login (atalho em shell:startup):
REM   Watchdog -> mantem o app Next (porta 3100) E o tunnel Cloudflare "agencia" (app.evertonbrito.com) no ar
cd /d "%~dp0.."
start "" /min "C:\Program Files\nodejs\node.exe" "%~dp0watch.mjs"
exit /b 0
