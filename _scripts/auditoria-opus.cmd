@echo off
rem ─── Auditoria do SaaS com Claude Opus 5 (headless) ───
rem Uso: rode depois de logar no Claude Code (/login) — relatório sai em _scripts\auditoria-opus.md
setlocal
cd /d "%~dp0.."
set "OUT=%~dp0auditoria-opus.md"

echo Rodando Claude Opus 5 (pode levar 1-3 min)...
claude -p "Audite a estrutura do SaaS em D:/studio/apps/plataforma (Next 16 + Tailwind v4 + shadcn). Contexto: vault Obsidian 'D:/Obsidian - Claude/🏢 Agência' é a fonte da verdade (markdown/JSON), o app espelha e opera (pipeline de prospeccao, prospector automatico com audit de sites, InfinitePay webhook que atualiza o Placar, rastreamento pixel + Clarity, analytics de trafego pago, financas com links de pagamento). Entregue: 1) Mapa da arquitetura com forcas e fraquezas; 2) Riscos com severidade (seguranca, robustez, concorrencia de leitura/escrita no vault, dependencia do PC/tunel); 3) 5 melhorias priorizadas por impacto/esforco com o que fazer em cada uma; 4) Analise do ROI de evoluir para banco (SQLite/Supabase) vs ficar no vault. Seja tecnico, direto e enxuto em PT-BR (max. 250 linhas)." --model claude-opus-4-1 --output-format text --allowedTools "Read,Bash" > "%OUT%" 2>> "%~dp0claude-opus.log"

echo.
echo Relatorio gerado em: %OUT%
if exist "%OUT%" (
  echo (primeiras 5 linhas:)
  powershell -Command "Get-Content '%OUT%' -TotalCount 5"
) else (
  echo ERRO: nao gerou — confira o _scripts\claude-opus.log e rode /login no Claude primeiro.
)
endlocal