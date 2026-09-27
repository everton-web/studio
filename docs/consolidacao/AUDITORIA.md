# AUDITORIA · Consolidação do PROJETO DIGITAL (Fase A — somente leitura)

> **De:** Orion (Coordenador) · **Para:** Everton · **Data:** 2026-09-26
> **Prazo:** quarta 30/09/2026 (subida para VPS Hostinger Ubuntu 24.04, 4 GB)

---

## 📌 Decidir (5 linhas)

1. **Vault entra no projeto** como `vault/` (gitignored no repo; Obsidian abre a pasta direto) e `VAULT` vira variável de ambiente relativa — fim dos `D:/Obsidian…` fixos.
2. **Git:** monorepo privado único (`apps/agencia-app` + `apps/site`) é a recomendação para "copiar e rodar" na VPS; alternativa (2 repos atuais + 1 repo central novo) mapeada na §3. **Decidir qual.**
3. **Lixo:** 11 pastas de IDE (`*.codex/cursor/gemini/grok/kimi/antigravity/playwright-mcp`…) + `painel-agencia/` + `Concept/` + `segundo-cerebro/` + backup de **173 MB** em `UPLOAD DE ARQUIVOS/` → `archive/` **fora do OneDrive**.
4. **VPS Linux:** 14 scripts Windows (`.cmd/.bat/.ps1`), `node-pty` e caminhos `C:/…`/`D:/…` precisam de port para systemd + env; **`startup-agencia.cmd` já está quebrado** (aponta `C:\Users\evert\watch-agencia.mjs`, que não existe — o watchdog real é `_scripts/watch.mjs`).
5. **Time:** 9 personas canônicas em `personas/*/CLAUDE.md`; faltam **fábio/olga/lia** no `persona.mjs` e no `dispacha.mjs`. Davi **já acionado** para auditoria UI (§5).

---

## 1. Inventário da raiz (manter / mover / arquivar)

| Pasta/Arquivo | Para que serve | Em uso? | Ação |
|---|---|---|---|
| `agencia-app/` | A Plataforma (Next 16, :3100) — repo próprio `everton-web/agencia-app` | ✅ no ar (watchdog + túnel) | **Manter** (`apps/agencia-app`) |
| `evertonbrito.com/` | Site/portfólio (Next + `index.html` estático + `send-form.php`) — repo próprio `everton-web/evertonbrito.com` | ✅ no ar (Hostinger) | **Manter** (`apps/site`) |
| `.aiox-core/` | Framework AIOX instalado (CLI, constitution, development/agents) | ✅ ativo | **Manter** (raiz do repo) |
| `.aiox/` | Status local do AIOX (`project-status.yaml`) | ✅ | **Manter** |
| `.claude/` | Claude Code: `agents/` (aiox-*), `commands/` (personas, greet), `hooks/` (git-push só @devops), `rules/`, `settings.json` | ✅ crítico | **Manter** |
| `personas/` | 6 personas (caio/davi/mia/ops/orion/theo) + briefs | ✅ | **Manter** (+ fábio/olga/lia) |
| `_scripts/` | Watchdog, `persona.mjs`, `dispacha.mjs`, `ia.mjs`, `loop-*.mjs`, `orquestra.mjs`, logs | ✅ crítico | **Manter** (limpar logs) |
| `docs/` | `ALETHE-MONTAGEM.md`, `consolidacao/` | ✅ | **Manter** |
| `CLAUDE.md` | Briefing da operação (raiz) | ✅ | **Manter** (remover senha exposta — §3) |
| `AGENTS.md` | Instruções Codex CLI (AIOX-managed) | ✅ | **Manter** |
| `.env` / `.env.example` | Template do instalador AIOX (valores **todos vazios**) | ⚠️ inócuo | Manter `.env.example`; arquivar `.env` |
| `.gitignore` | Ignore base (AIOX): `.env`, `node_modules`, `*.log`, `dist/` | ✅ | **Manter** (reforçar §3) |
| `.github/` | Agentes `.agent.md` (architect, devops, analyst…) | ⚠️ solto | Mover para o repo central (ou `archive/`) |
| `sites/` | LPs de cliente em andamento (`draalineschwanck`) | ✅ ativo | **Manter** |
| `UPLOAD DE ARQUIVOS/` | 171 MB: backup wpvivid **173 MB** (`draalineschwanck…backup_all.zip`), screenshots, `Prompts/`, `Scripts de Vendas/` | ⚠️ | **Arquivar o .zip** (fora do repo); `Prompts/`+`Scripts de Vendas/` → `vault/_Arquivos` |
| `Concept/` | Case antigo Dra Simone (site Next próprio + mídia) | ❌ entregue | **Arquivar** (mídia → `vault/50 Conteúdo/Portfolio`) |
| `painel-agencia/` | Legado vanilla (`server.mjs`, `data.json`, `login.html`) | ❌ substituído | **Arquivar** |
| `segundo-cerebro/` | Origem do NEXO (`graph.json` 111 KB, `index.html`) — repo próprio | ⚠️ referência | **Arquivar** (vault é a fonte da verdade) |
| `CRITERIOS-UI-E-RESPONSIVIDADE.md` | Critérios de UI (avulso) | ✅ | Mover p/ `docs/` ou vault Playbooks |
| `Handoff - Agentes Pré-Pós…md`, `Plano Mestre - Marca Digital.md` | MDs soltos de planejamento | ✅ referência | Mover p/ `vault/20 Playbooks` |
| `.antigravity` `.codex` `.cursor` `.gemini` `.grok` `.kimi` `.playwright-mcp` | Config/logs de outras IDEs/agentes (61K–375K cada) | ❌ lixo | **Arquivar** (`.playwright-mcp` = só logs de console) |

**Total de lixo identificado:** ~**175 MB+** (quase tudo o backup wpvivid) + 11 pastas de IDE.

---

## 2. Prontidão para VPS Linux (Ubuntu 24.04)

### 2.1 Caminhos fixos Windows (o que quebra fora do Windows)

| Arquivo | Linha | Problema |
|---|---|---|
| `agencia-app/src/lib/console.ts` | 4–5 | `PI_CLI` default `C:/Users/evert/AppData/Roaming/npm/…/pi-coding-agent/dist/cli.js`; `AGENCIA_CWD` default `C:/Users/evert/OneDrive/…` |
| `agencia-app/src/lib/vault.ts` | 4 | `VAULT` default `D:/Obsidian - Claude/🏢 Agência` (✅ env-overridable) |
| `agencia-app/src/lib/files.ts` | 4 | `ARQUIVOS_DIR` default `D:/…/_Arquivos` (✅ env-overridable) |
| `agencia-app/src/lib/infinitepay.ts` | 7 | `VAULT` default `D:/…` (✅ env) |
| `agencia-app/src/lib/prospector.ts` | 15 | `VAULT` default `D:/…` (✅ env) |
| `agencia-app/src/app/api/{analytics,t}/route.ts` | 6–7 | `VAULT` default `D:/…` (✅ env) |
| `_scripts/persona.mjs` | 22 | `VAULT` default `D:/…` (✅ env) |
| `_scripts/dispacha.mjs` | 23 | `VAULT` default `D:/…` (✅ env) |
| `_scripts/loop-247.mjs` | 33 | `const VAULT = "D:/…"` — **hardcoded, sem env** |
| `_scripts/ia.mjs` | 152 | `--add-dir "D:/Obsidian - Claude/🏢 Agência"` — **hardcoded** |
| `_scripts/aiox-pty.mjs` | 12 | `require("C:/Users/evert/…/agencia-app/node_modules/node-pty")` — **hardcoded** |

**Conclusão:** a maioria é env-overridable (bom), mas os *defaults* são Windows. Plano: unificar num único módulo `_scripts/config.mjs` (lê `VAULT`, `PI_CLI`, `AGENCIA_CWD` do ambiente, com fallback relativo `../vault`), e corrigir os 3 hardcoded (`loop-247.mjs`, `ia.mjs`, `aiox-pty.mjs`).

### 2.2 `node-pty`

- Está nas **deps** do `agencia-app` (`node-pty ^1.1.0`, usado em `src/lib/console.ts` → terminal xterm do Assistente). É **nativo** (precisa recompilar na VPS: `build-essential`, `python3`).
- `_scripts/aiox-pty.mjs` referencia o `node-pty` por caminho absoluto Windows — quebrará na VPS (e já só serviu para o instalador interativo do AIOX, já concluído → **pode ser arquivado**).

### 2.3 Scripts Windows (14) → portar para Linux

`.cmd` (11): `startup-agencia.cmd`, `start-daemon.cmd`, `sync-github.cmd`, `auditoria-opus.cmd`, `auditoria-opus-opencode.cmd`, `exec-aline.cmd`, `exec-cases.cmd`, `exec-multibela.cmd`, `prospeccao-diaria.cmd`, `loop-agentes.cmd`, `instalar-tarefas.bat` · `.ps1` (2): `instalar-loop-247.ps1`, `habilitar-ssh.ps1`.

**Portar para systemd na VPS:**
- `startup-agencia.cmd` → **`agencia-app.service`** (watchdog `_scripts/watch.mjs` + `next start -p 3100`) + **`cloudflared-tunnel.service`** (`cloudflared tunnel run agencia`). ⚠️ Hoje o `.cmd` chama `C:\Users\evert\watch-agencia.mjs` (inexistente) — o watchdog real roda via `loop-daemon`/manual.
- `start-daemon.cmd` / `loop-247` / `prospeccao-diaria` → timers systemd (`*.timer`) no lugar do Agendador de Tarefas.
- `sync-github.cmd`, `exec-*.cmd` (descarte: rodadas manuais pontuais) → **arquivar**.

### 2.4 Variáveis de ambiente necessárias na VPS

| Var | Onde | Obs |
|---|---|---|
| `VAULT` | app + scripts | → `/home/…/projeto-digital/vault` |
| `PI_CLI` | `console.ts` | caminho do pi CLI na VPS (ou desativa o Assistente) |
| `AGENCIA_CWD` | `console.ts` | raiz do projeto na VPS |
| `ARQUIVOS_DIR` | `files.ts` | → `vault/_Arquivos` |
| `AGENCIA_USER` / `AGENCIA_PASS` / `AGENCIA_SECRET` | login app | mover p/ `apps/agencia-app/.env.local` |
| `LEADS_TOKEN` | leads/site | idem |
| `INFINITEPAY_HANDLE` / `INFINITEPAY_REDIRECT_URL` | webhook/placar | idem |
| `GEMINI_API_KEY` (+ model) | prospector/chat | idem |
| `GOOGLE_SHEETS_WEBAPP_URL` / `AGENCIA_LEADS_URL` / `AGENCIA_LEADS_TOKEN` | `evertonbrito.com` | idem (site) |

---

## 3. Git e segredos

### 3.1 Estado atual
- **Raiz NÃO é repo** (`isGitRepo: false`). Repos separados: `agencia-app` (→ `everton-web/agencia-app.git`, branch `feat/dashboard-analytics-ref` à frente de `master`, working tree limpo) e `evertonbrito.com` (→ `everton-web/evertonbrito.com.git`, limpo). `segundo-cerebro/` e `Concept/concept-site/` têm `.git` próprio.
- Hook `.claude/hooks/enforce-git-push-authority.cjs` já blinda `git push`/`gh pr` fora do @devops. ✅

### 3.2 Segredos expostos
| Onde | O quê | Risco | Ação |
|---|---|---|---|
| `agencia-app/.env.local` | `GEMINI_API_KEY` real, `LEADS_TOKEN`, `AGENCIA_PASS`, `AGENCIA_SECRET` | 🔴 **alto** | já gitignored (`.env*`) e fora do git ✅ — mas vive no OneDrive; girar chaves na migração |
| `CLAUDE.md` (raiz) | senha de login escrita: `everton / [senha padrão antiga — removida]` | 🟠 médio | remover do texto; apontar só p/ `.env.local` (obs.: `.env.local` tem `AGENCIA_PASS` **diferente** → doc desatualizado) |
| `evertonbrito.com/.env.example` | template vazio | 🟢 ok | manter (tracked, sem segredo) |
| `_scripts/orquestra/fila.json` + `resultados/` | prompts de tarefas (sem segredo, mas com nomes de clientes) | 🟡 | verificar se entra no repo (evitar vazar nomes/links de cliente) |

### 3.3 `.gitignore` — reforçar
- Raiz já ignora `.env`, `node_modules`, `*.log`, `dist/`, `.aiox-core/local/`. **Falta:** `vault/` (se ficar dentro), `_scripts/orquestra/resultados/`, `_scripts/*.log`, `UPLOAD DE ARQUIVOS/`, `archive/`, `apps/*/.env.local` (coberto por `.env*`), `.playwright-mcp/`.

### 3.4 Repo: central privado vs. monorepo

| Opção | Prós | Contras | Verdicto |
|---|---|---|---|
| **A. Monorepo** `everton-web/projeto-digital` (`apps/agencia-app`, `apps/site`, `vault/` gitignored) | 1 clone = deploy completo na VPS; caminhos relativos naturais; 1 pipeline | migração do histórico dos 2 repos (subtree/re-init); master-gating reconfigurado | **✅ Recomendada** (meta = "copiar e rodar") |
| **B. Repo central** novo (raiz: personas/_scripts/docs/.aiox-core) + manter 2 repos atuais | preserva histórico e o gating atual intactos; menos risco | 3 repos pra clonar na VPS; caminhos `../apps` frágeis; mais coordenação | Alternativa de menor risco |

**Recomendação:** **Opção A** — `git subtree`/`git mv` preserva o histórico; vault entra como `vault/` gitignored (ou repo privado irmão `everton-web/vault` se quiser versionar o estado — decidir com o Everton).

### 3.5 OneDrive
- **Atrapalha, sim:** `node_modules` + `.git` (milhares de arquivos) dentro do OneDrive causam sync churn, locks e lentidão. `UPLOAD DE ARQUIVOS` (171 MB) e logs também.
- **Local definitivo proposto:** `C:\dev\projeto-digital` (ou `D:\projeto-digital`) — fora do OneDrive. O vault fica **dentro** do projeto (`vault/`), com cópia/backup separado se quiser redundância.

---

## 4. Alinhamento do time

### 4.1 Onde cada persona aparece hoje
| Fonte | Quem conhece | Status |
|---|---|---|
| `personas/*/CLAUDE.md` | caio, davi, mia, ops, orion, theo | 6 personas — **faltam fábio/olga/lia** |
| `_scripts/persona.mjs` (`VALIDAS`) | orion, caio, davi, theo, mia, ops | **faltam fábio/olga/lia** |
| `_scripts/dispacha.mjs` (`ROTAS`) | orion, caio, davi, theo, ops, mia | **faltam fábio/olga/lia** |
| `~/.claude/agents/*.md` | caio(+5 subs), davi(+7), mia(+4), theo(+5), **fabio, olga, lia**, motor-bulk/leitura/validacao | completo no time, **mas sem `orion.md` nem `ops.md`** |
| `.claude/commands/personas.md` (`/personas`) | tabela completa (orion, caio, davi, theo, mia, fabio, olga, lia + motores) | ✅ mais completo — é a referência atual |

### 4.2 Time canônico proposto (lista única)
**9 personas:** `orion` (coordenação) · `caio` (comercial) · `davi` (design/web) · `theo` (dev/deploy) · `mia` (conteúdo) · `ops` (infra/manutenção) · `fabio` (financeiro) · `olga` (operações) · `lia` (PM·SM/PO) · + 3 motores (`motor-bulk`, `motor-leitura`, `motor-validacao`).

**Onde cada definição mora (proposta):**
1. **Fonte única = `personas/<nome>/CLAUDE.md`** (escopo, regras, comando `persona.mjs`) — versionado no repo.
2. `~/.claude/agents/*.md` = wrappers de subagente (frontmatter `name`/`model`) **gerados** por `_scripts/gerar-agentes.mjs` a partir das personas (não editar à mão).
3. `_scripts/persona.mjs` (`VALIDAS`) e `_scripts/dispacha.mjs` (`ROTAS`) — **adicionar fábio/olga/lia** (+ regra de keywords).
4. `.claude/commands/personas.md` — manter como está (já completo), só apontar para a fonte única.

**Ações (Fase B):** criar `personas/fabio|olga|lia/CLAUDE.md` (a partir dos `~/.claude/agents/*.md` existentes), registrar no `persona.mjs` + `dispacha.mjs`, e gerar `~/.claude/agents/orion.md` + `ops.md` para fechar o espelho.

---

## 5. UX/UI da plataforma — Davi acionado

- **Demanda despachada** ao **Davi** (skill `impeccable`, desktop + mobile) para auditar o `agencia-app` — ver fila (`node _scripts/orquestra.mjs status`) e painel.
- **Escopo da auditoria do Davi:** diagnóstico da IDV atual (que "parece feita de qualquer jeito") + direção visual, **sem implementar** (Fase A). Base: `20 Playbooks/Reformulação da Plataforma.md` (referências "Impact." + "Predictive Churn Flagging", accent `#FF4000`) e `agencia-app/DESIGN-SYSTEM.md`.
- ⚠️ **Divergência detectada:** o playbook registra "IDV v2 Comando" como ✅ executada (nav 11→6, Inter para tudo, 0 achados), mas a percepção atual do Everton é de identidade "de qualquer jeito". Davi deve **reconciliar** isso: ou a IDV v2 não chegou à branch `master` (está em `feat/dashboard-analytics-ref`), ou precisa de um passe real. O diagnóstico dele fecha essa questão.

---

## 6. Estrutura-alvo + migração (Fase B)

### 6.1 Árvore final
```
projeto-digital/                     ← repo central privado (FORA do OneDrive)
├── CLAUDE.md  AGENTS.md  .gitignore
├── .aiox-core/  .aiox/  .claude/    ← infra de time/orquestração
├── apps/
│   ├── agencia-app/                 ← plataforma (:3100)
│   └── site/                        ← evertonbrito.com
├── sites/                           ← LPs de cliente (draalineschwanck…)
├── vault/                           ← Obsidian (135 MB, gitignored) — VAULT aponta aqui
├── personas/  _scripts/  docs/
└── archive/                         ← lixo + legado (fora do git)
```

### 6.2 Passo a passo (ordem, riscos, rollback)
| # | Passo | Risco | Rollback |
|---|---|---|---|
| 0 | Freeze: **não parar** watchdog (:3100) + túnel `agencia` | — | — |
| 1 | Criar repo central privado; definir monorepo vs. central (§3.4) | baixo | — |
| 2 | Copiar raiz p/ `C:\dev\projeto-digital` (fora do OneDrive), preservando o original até validar | médio (sync OneDrive) | apagar a cópia |
| 3 | Mover `evertonbrito.com` → `apps/site` e `agencia-app` → `apps/agencia-app` (git subtree, preserva histórico) | médio (remotes/gating) | `git remote` antigo continua no original |
| 4 | Mover vault → `vault/`; setar `VAULT`/`ARQUIVOS_DIR` p/ relativo; corrigir `loop-247.mjs`/`ia.mjs`/`aiox-pty.mjs` | **alto** (app inteiro lê vault) | reverter env p/ `D:/Obsidian…` |
| 5 | Arquivar lixo (§1) + backup 173 MB p/ `archive/` (não versionar) | baixo | mover de volta |
| 6 | Portar scripts p/ systemd (watchdog + tunnel + timers); validar `node-pty` rebuild na VPS | **alto** (é o que mantém o ar) | manter o PC como servidor até validar na VPS |
| 7 | Criar `.env`/`.env.local` na VPS; **girar** `GEMINI_API_KEY`/`LEADS_TOKEN`/senha | médio | chaves antigas continuam válidas até girar |
| 8 | Testar deploy na VPS (subir por cópia/rsync) ANTES de derrubar o túnel do PC | médio | volta o túnel do PC |
| 9 | Pós-subida: apontar `app.evertonbrito.com` p/ VPS; desligar servidor PC | — | religar PC |

**Regra transversal:** nenhum `git push` fora do @devops (hook já impõe); nada externo sem validação humana; Fase B só começa após o **"aprovado"** do Everton.

---

*Auditoria de leitura apenas — nada foi apagado, movido ou pushado.*
