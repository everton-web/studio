@echo off
REM Instala as tarefas agendadas da agência (rodam ao logar no Windows).
REM Watchdog: mantém o app (Next) no ar. Tunnel: app.evertonbrito.com -> localhost:3100.

schtasks /Create /TN "Agencia-Watchdog" /TR "\"C:\Program Files\nodejs\node.exe\" \"C:\Users\evert\OneDrive\Área de Trabalho\PROJETO DIGITAL\_scripts\watch.mjs\"" /SC ONLOGON /RL LIMITED /F

schtasks /Create /TN "Agencia-Tunnel" /TR "\"C:\Program Files (x86)\cloudflared\cloudflared.exe\" tunnel run agencia" /SC ONLOGON /RL LIMITED /F

echo Tarefas instaladas.