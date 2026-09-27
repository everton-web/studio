# EXECUÇÃO · Consolidação (Fase B) — log de progresso

> Orion · 2026-09-26 · aprovado pelo Everton ("execute" + "a" = A/A/A).
> Regra: não derrubar app :3100 / túnel `agencia` / watchdog. `git push` e operações de serviço → @devops/Gage.

## Decisões confirmadas (A/A/A)
1. **Repo** → monorepo privado único (`apps/agencia-app` + `apps/site`).
2. **Vault** → copiado para `vault/` (gitignored) + `VAULT` por env.
3. **Local** → mover para `C:\dev\projeto-digital` (fora do OneDrive) — **pendente de cutover** (não pode parar o app).

## Feito (reversível, sem tocar serviços)
| # | Ação | Status |
|---|---|---|
| 1 | Arquivar lixo → `archive/` (11 pastas IDE + Concept + segundo-cerebro + UPLOAD DE ARQUIVOS + `.env`) | ✅ |
| 2 | Copiar vault → `vault/` (135 MB, íntegro) | ✅ |
| 3 | `.gitignore`: + `vault/`, `archive/`, `_scripts/orquestra/resultados/`, `fila.backup-*` | ✅ |
| 4 | Corrigir caminhos hardcoded: `loop-247.mjs` (VAULT env), `ia.mjs` (`--add-dir` env), `aiox-pty.mjs` (require relativo) — `node --check` OK | ✅ |
| 5 | `archive/MANIFESTO.md` (rollback) | ✅ |

| 6 | Mover `evertonbrito.com` → `apps/site` (site não roda local — seguro) | ✅ |
| 7 | Atualizar `.claude/launch.json` p/ `apps/site` | ✅ |

## Pendente (bloqueado / exige @devops ou cutover)
| # | Ação | Por que bloqueia |
|---|---|---|
| A | `painel-agencia` → archive | ❌ "Device or resource busy" (handle de processo/OneDrive) — retentar no cutover |
| B | Mover `agencia-app` → `apps/agencia-app` | ⚠️ **app está rodando de lá** (Next :3100 PID 8128 + watchdog) — mover quebraria o ar |
| C | ~~Mover `evertonbrito.com` → `apps/site`~~ | ✅ feito |
| D | Mover projeto p/ `C:\dev\projeto-digital` | ⚠️ mesmo motivo de B |
| E | Criar repo monorepo + remote `everton-web/projeto-digital` | `git push`/remote = **@devops** |
| F | systemd (watchdog+tunnel+timers) + env na VPS | cutover quarta 30/09 = **@devops/Theo** |
| G | Girar segredos (`GEMINI_API_KEY`, `LEADS_TOKEN`, `AGENCIA_PASS`) | @devops + Everton |
| H | Remover senha exposta no `CLAUDE.md` | baixo risco — fazer já |

## Próximo passo recomendado
1. **Agora (Orion):** item H (limpar senha do CLAUDE.md) — inócuo.
2. **@devops/Gage:** itens B–G no cutover de quarta (ou em janela combinada de restart), com rollback = religar o PC.
