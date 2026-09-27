# BRIEF · Consolidação do PROJETO DIGITAL (prazo: quarta 30/09/2026)

**De:** Everton (via Claude Code) · **Para:** Orion (orquestrador) · **Data:** 2026-09-26

## Contexto
- Meta R$100k. Faturado até hoje: ~2% — e o caixa já foi gasto. **Recomeçamos do zero.**
- Na quarta (30/09) tudo sobe para uma **VPS Hostinger (Ubuntu 24.04, 4 GB)**. Até lá o PC fica ligado como servidor
  (app no ar em `app.evertonbrito.com` via Cloudflare Tunnel + watchdog).
- Objetivo: chegar na quarta com a pasta **totalmente organizada**, para a subida ser só copiar e rodar — e aí
  o time foca em **prospectar e faturar**.

## Missão
Auditar o projeto inteiro e entregar uma **estrutura consolidada** onde vivam juntos:
1. **Plataforma** — `agencia-app/` (Next 16, porta 3100)
2. **Site** — `evertonbrito.com/` (Next, hoje na Hostinger)
3. **Conhecimento/estado** — o vault Obsidian (`D:/Obsidian - Claude/🏢 Agência`, 135 MB), que hoje está FORA da pasta.
   Trazer para dentro do projeto (ex.: `vault/`) ou propor alternativa de pasta de MDs — mantendo compatível com o Obsidian.
4. **Time** — personas (`personas/`, `~/.claude/agents/`), scripts (`_scripts/`), AIOX (`.aiox-core/`), comandos (`.claude/commands/`).

## FASE A — Auditoria (somente leitura · faça agora)
Entregue `docs/consolidacao/AUDITORIA.md` com:
1. **Inventário** de cada pasta da raiz: para que serve, está em uso?, manter / mover / arquivar.
   (Atenção a lixo: `.antigravity .codex .cursor .gemini .grok .kimi .playwright-mcp`, `painel-agencia/` legado, `Concept/`, `sites/`, logs em `_scripts/`.)
2. **Prontidão para VPS Linux** — tudo que quebra fora do Windows:
   caminhos fixos (`D:/…`, `C:/Users/evert/…` em `vault.ts`, `console.ts` `PI_CLI`/`AGENCIA_CWD`, `persona.mjs`, `watch.mjs`,
   `startup-agencia.cmd`), `node-pty`, scripts `.cmd/.ps1/.bat`, variáveis de ambiente necessárias.
3. **Git e segredos** — raiz não é repo; `agencia-app` e `evertonbrito.com` são repos separados (`everton-web/*`).
   Propor: um repo central privado vs. monorepo (`apps/agencia-app`, `apps/site`). Listar segredos expostos
   (`.env` na raiz, senha do app escrita no `CLAUDE.md`) e o que precisa de `.gitignore`.
   Obs.: a pasta está dentro do **OneDrive** — avaliar se isso atrapalha (node_modules, .git) e propor local definitivo.
4. **Alinhamento do time** — personas duplicadas/desencontradas entre `personas/*/CLAUDE.md`, `~/.claude/agents/*.md`,
   `_scripts/persona.mjs` (só conhece orion|caio|davi|theo|mia|ops; faltam fabio/olga/lia) e o comando `/personas`.
   Propor a lista única do time e onde cada definição mora.
5. **UX/UI da plataforma** — acione o **Davi** (skill `impeccable`, desktop + mobile) para auditar o `agencia-app`:
   a identidade visual atual parece feita "de qualquer jeito". Entregar diagnóstico + direção visual (sem implementar ainda).
   Base existente: `20 Playbooks/Reformulação da Plataforma.md` no vault.
6. **Estrutura-alvo proposta** — árvore de pastas final + passo a passo da migração (ordem, riscos, rollback).

## FASE B — Execução (SÓ depois do "aprovado" do Everton)
Mover, renomear, arquivar, criar repos, ajustar caminhos. Nada disso antes da aprovação.

## Regras inegociáveis
- **Não quebrar o que está no ar**: app na porta 3100 + túnel `agencia` + watchdog. Não pare esses processos.
- **Nada de apagar/mover/push** na Fase A. Na Fase B, `git push` só via @devops.
- Nada externo (mensagem, post, contrato) sem validação humana.
- Registrar início e fim no painel: `D:/Obsidian - Claude/🏢 Agência/SaaS/Agentes/painel.md`.
- Relatório final curto no topo do `AUDITORIA.md`: 5 linhas com o que decidir.
