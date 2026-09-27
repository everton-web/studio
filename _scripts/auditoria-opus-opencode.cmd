@echo off
rem ─── Chamar o Claude (via opencode, headless) para auditar o SaaS ───
rem Uso: rode depois de ter o opencode instalado e autenticado com Anthropic.
rem Para autenticar: opção A) set ANTHROPIC_API_KEY=<chave>   |   opção B) /auth no TUI do opencode
setlocal
cd /d "%~dp0.."
set "OUT=%~dp0auditoria-opus.md"

echo Chamando Claude (opencode --model anthropic/claude-opus-4-1)... isso leva 1-3 min.
opencode run "Audite a estrutura do SaaS em D:/studio/apps/plataforma (Next 16 + Tailwind v4 + shadcn). Contexto: vault Obsidian 'D:/Obsidian - Claude/🏢 Agência' e a fonte da verdade (markdown/JSON); o app espelha e opera: pipeline de prospeccao, prospector automatico com audit de sites + cache, InfinitePay webhook que atualiza o Placar, rastreamento pixel + Clarity, analytics de trafego pago, financas com links de pagamento. Entregue: 1) Mapa da arquitetura com forcas e fraquezas; 2) Riscos com severidade (seguranca, robustez, concorrencia de leitura/escrita no vault, dependencia do PC/tunel); 3) 5 melhorias priorizadas por impacto/esforco com o que fazer em cada uma; 4) ROI de evoluir para banco (SQLite/Supabase) vs ficar no vault. Tecnico, direto, PT-BR, max 250 linhas. Grave o relatorio em _scripts/auditoria-opus.md" --model anthropic/claude-opus-4-1 > "%~dp0opencode-claude.log" 2>&1

echo.
echo Feito. Confira _scripts\auditoria-opus.md
endlocal