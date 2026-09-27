# STUDIO — briefing para agentes (Claude Code / pi / opencode)

Este diretório (`D:\studio`, repo privado `everton-web/studio`) centraliza a operação da **Marca Digital**. Leia isto antes de qualquer trabalho, e depois o **vault** (abaixo).

## Regra de ouro

- **O vault Obsidian é a fonte da verdade**: `vault/` (junction para `D:\Obsidian - Claude\🏢 Agência\` — não mover: é subpasta do Obsidian pessoal; fora do git)
- **Abra sempre primeiro**: `00 COMANDO.md` (prioridade da semana) → `01 Kanban.md` → `10 INBOX.md`
- **Fechamento de sessão**: diário em `70 Diário de Bordo/YYYY-MM-DD - <tema>.md` + commit + push.
- **Dinheiro/produção/deploy** apenas depois de revisão. **Roteamento decidido pelo Coordenador tarefa a tarefa** (Claude vs opencode/DeepSeek) — sem cota fixa; ver `20 Playbooks/Roteamento de Modelos.md`.

## O que é cada pasta

| Pasta | Papel |
|---|---|
| `apps/plataforma/` | **A Plataforma** (Next 16, porta 3100, `https://app.evertonbrito.com`) — back-office + orquestração virtual dos agentes: prospecção, finanças, rastreamento, analytics, demandas |
| `apps/site/` | Site/portfólio evertonbrito.com (Next + versão estática, publicado na Hostinger) — Clarity `ynkvl1zisv` + pixel instalados |
| `sites/` | Sites de clientes (ex.: `draalineschwanck/`) |
| `personas/` | Definição do time (orion, caio, davi, theo, mia, ops) — comando `/personas` |
| `_scripts/` | `watch.mjs` (watchdog do app **e** do túnel Cloudflare), `startup-studio.cmd`, `ia.mjs`, `persona.mjs`, loop, prospecção |
| `docs/consolidacao/` | Auditoria e log da consolidação (set/2026) |
| `vault/` | Junction para o vault Obsidian (gitignored) |
| `archive/` | Legado arquivado + histórico git dos repos antigos (gitignored) |

## Plataforma — comandos essenciais

```bash
cd apps/plataforma
npm run build && npm run start -- -p 3100   # produção local (o watchdog já faz isso)
npm run dev                                  # dev (porta 3000)
```

- Login: credenciais em `apps/plataforma/.env.local` (`AGENCIA_USER`/`AGENCIA_PASS`) — não expor senha em texto.
- Segredos em `apps/plataforma/.env.local`: `LEADS_TOKEN`, `INFINITEPAY_HANDLE=eb-web`, `INFINITEPAY_REDIRECT_URL`, `GOOGLE_PLACES_KEY` (opcional), `VAULT`, `AGENCIA_CWD`
- Vault do app: `vault/` — fichas de lead em `40 Comercial/Leads/[nome].md`, hits em `SaaS/Rastreamento/`, links em `SaaS/Financeiro/`, campanhas em `SaaS/Tráfego/`

## Fluxo operacional (Skills)

- **Prospecção**: skill `prospeccao-maps` / endpoint `/api/prospector` — agente audita sites e cria fichas no estágio 0 (filtros: sem blog, sem redes/marcas).
- **Abordagem**: SÓ com validação humana — modal com draft editável (nunca enviar direto).
- **Dinheiro**: InfinitePay — link com `webhook_url` → webhook marca pago e **atualiza o Placar**.
- **UI/QA**: skill `ui-studio` + skill `impeccable` (auditoria desktop+mobile antes de entregar UI).
- **Modelos**: ver `20 Playbooks/Roteamento de Modelos.md` (Claude decide, DeepSeek/Kimi executam).

## Interação entre agentes (pi · Claude Code · opencode)

Cada agente usa a IA dele de forma independente (pi = deepseek, Claude Code = Claude subscription, opencode = o que estiver logado). **A comunicação entre eles acontece no `PAINEL DOS AGENTES`**: `D:\Obsidian - Claude\🏢 Agência\SaaS\Agentes\painel.md`.

- Ao abrir sessão: LEIA o painel.
- Precisou do outro agente? ESCREVA lá (`- [quem] data · pedido`).
- Concluiu? Responda na mesma linha com `→ feito`.
- Fila compartilhada de tarefas (opcional): `node _scripts/orquestra.mjs status` (mesma fila para todos).
- Saúde das IAs: `node _scripts/ia.mjs --check`.

**Regra simples: a IA é de cada um; a conversa é no painel.**

**Cadeia oficial: Orion → pi → opencode** (decisão do Everton, 2026-09-27, todas as personas). Quando o Orion é acionado (`/personas`, "Orion", `@aiox-master`), ele chama `node _scripts/persona.mjs <persona> "tarefa"`: o pi assume a tarefa com a ficha da persona, delega ao `opencode run` e confere; o Claude revisa. Regra do pi: `personas/_EXECUCAO.md` · travas do opencode: `opencode.json`. Push, deploy, dinheiro e mensagem a cliente nunca vão para o opencode. Ver `~/.claude/commands/personas.md` e `opencode.md`.

## Perfil do cliente alvo

Empresas/locais em Salvador/BA e região metropolitana: presença digital ativa, **site fraco** (2+ problemas verificáveis), porte pequeno/médio, pagam por resultado. Foco atual: **Villa Flamboyan Pousada** (paubrasilinternational.com) em Contato.

## Convenções

- Código: TypeScript strict · Tailwind v4 com tokens no `globals.css` · endpoints em `src/app/api/<modulo>/route.ts` · dados de estado no vault (markdown/JSON), nunca memória.
- Commits: mensagens descritivas em PT ("feat(scope): ...").
- Branches: `master` é produção; testes de UI ficam em branch até aprovação.
## AIOX (infra de orquestração)

- Core instalado e **ativo** (`.aiox-core/`) — CLI: `node .aiox-core/cli/index.js <config|generate|qa>`
- Ativação dos squads no Claude Code: 1x no terminal interativo `npx aiox-core install` → Enter (IDE: Claude Code). Pendência do agente `ops`.
