@echo off
rem ─── Rotina diária 07h–08h: prospecção via Claude Code ───
setlocal
cd /d "%~dp0.."
set "LOG=%~dp0prospeccao-diaria.log"

echo [%date% %time%] rotina 07h iniciada >> "%LOG%"

claude -p "Rotina de prospeccao da agencia (skill prospeccao-maps). Execute agora: 1) node _scripts/prospeccao-automatica.mjs — isso autentica e chama a prospecção automatica do app (overpass, limite 6). 2) Leia o JSON de saida e registre um diario em 'D:/Obsidian - Claude/🏢 Agencia/70 Diario de Bordo/YYYY-MM-DD - Prospeccao 07h.md' com: data, auditados, adicionados (nomes), descartados (quantos) e qualquer erro. 3) NUNCA envie mensagem para leads: apenas abasteça o estagio 0 do pipeline para o Everton aprovar. 4) Se o app nao responder (erro de conexao), registre no log e encerre sem forcar. Responda com um resumo de 3 linhas." --allowedTools "Read,Write,Edit,Bash,WebFetch" >> "%LOG%" 2>&1

echo [%date% %time%] rotina concluida (exit=%errorlevel%) >> "%LOG%"
endlocal