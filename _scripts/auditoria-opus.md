# Relatório técnico — agencia-app (Next 16) + vault Obsidian

## 1) Mapa da arquitetura

**Stack:** Next 16.3.6 App Router (runtime `nodejs`), React 19.2, Tailwind v4, shadcn/ui, framer-motion, xterm + **node-pty** (terminal embutido), Gemini (chat). Headers de segurança fortes em `next.config.ts` (CSP, HSTS, X-Frame DENY).

**Camadas:** `src/app/api/*/route.ts` (~20 rotas) → chamam `src/lib/*` → leem/escrevem o **vault** como fonte da verdade.
- `vault.ts` (347 l) — coração: parse de markdown por regex própria, Kanban, pipeline de leads (6 estágios), Placar; read-modify-write de `.md`.
- `prospector.ts` — busca leads (Google Places **ou** Overpass/OSM), audita o site, cria ficha.
- `infinitepay.ts` — cria link de pagamento, processa webhook, atualiza `Placar.md` por regex.
- `console.ts` — **PTY único compartilhado** que roda o CLI `pi` no host (singleton em memória).
- `auth.ts` — token HMAC em cookie httpOnly, usuário único via env, comparação em tempo constante.

**Fluxos:** Dashboard → `GET /api/data` (`buildData()` agrega todo o vault) · Chat → injeta o **estado inteiro do vault** no system prompt → SSE do Gemini · Prospecção → OSM/Places → `auditarSite` → grava lead · Pagamento → webhook → marca pago + Placar · Console → SSE + input dirigem o PTY.

**Superfície pública (sem cookie):** `/api/leads` (token no body, CORS `*`), `/api/infinitepay/webhook` (aberto), `/api/t` (pixel). Resto exige `isAuthed()`. **Persistência:** nenhum banco; estado durável = vault; estado volátil (PTY, rate-limit, throttle) em memória de módulo.

## 2) Riscos (por severidade)

**CRÍTICO**
- **Webhook InfinitePay sem verificação de autenticidade** (`processarWebhook`). Um `POST` forjado, acertando um `order_nsu` existente, marca pago e infla o Placar. Sem assinatura/HMAC nem allowlist de IP.
- **Console = execução arbitrária no host** (`console.ts`). O PTY roda o CLI `pi` na máquina; qualquer sessão autenticada tem shell no host — barreira única é **uma senha compartilhada** (default `everton/[senha padrão antiga — removida]`, documentada no CLAUDE.md).

**ALTO**
- **Corridas de escrita no vault** — read-modify-write de `.md` sem lock; webhook + Kanban + pipeline concorrentes podem corromper/perder gravação (Placar via regex é o mais frágil).
- **Estado em memória de módulo** — quebra em serverless/multi-instância; o app **exige** um único Node persistente (restrição de deploy não explícita).
- **Senha padrão só avisa, não bloqueia** — prod lança se o *secret* for default, mas `AGENCIA_PASS` default apenas emite `warn`. Deploy sobe com credencial pública.

**MÉDIO**
- **`/api/leads` sem rate-limit** (CORS `*`) → flood cria N `.md` no vault.
- **Chat vaza o negócio ao Google** — system prompt manda o vault inteiro (Placar, leads, inbox) a cada mensagem; lista de modelos inclui id provavelmente inexistente (`gemini-3.5-flash`), fallback mascara má config.
- **Regex frágil + `catch` vazios** — edição manual no Obsidian pode quebrar o parse silenciosamente.
- **SSRF autenticado** — `auditarSite` faz `fetch` de URLs arbitrárias do lead.

**BAIXO** — sem testes; `node-pty` nativo (risco de build no deploy); sem limite de tamanho no chat.

## 3) Top-5 melhorias (impacto × esforço)

| # | Melhoria | Impacto | Esforço |
|---|---|---|---|
| 1 | **Verificar autenticidade do webhook** (segredo/assinatura + confirmar via `consultarStatus` antes da baixa no Placar) | Alto | Baixo |
| 2 | **Serializar escritas no vault** (mutex/fila por arquivo) | Alto | Médio |
| 3 | **Endurecer auth**: senha default **lançar** em prod + isolar permissão do `/console` | Alto | Baixo |
| 4 | **Limpar modelos Gemini** + enxugar o system prompt (não mandar o vault todo) | Médio | Baixo |
| 5 | **Rate-limit + validação no `/api/leads`** e estado volátil durável | Médio | Médio |

## 4) ROI — banco vs vault + veredito

**Escala hoje:** 10 leads, 1 registro financeiro pago, 35 `.md`, 2 `.json`. Operador **solo**.

**Vault entrega de graça:** custo zero, edição no Obsidian, versionamento git, backup trivial, fonte legível por humano **e por LLM** (o chat depende disso). **Banco resolveria:** concorrência transacional, integridade, queries — ao **custo** de esquema/migrações, perda da edição no Obsidian e da legibilidade que o chat consome.

O único problema real que o banco resolve agora é a corrida de escrita — e isso um **mutex de custo ~zero** cobre. Nenhuma dor de volume/query justifica migrar; o ROI seria **negativo**.

**Veredito: MANTER O VAULT.** Não migrar. Em vez disso: mutex de escrita + backup git automático. **Reavaliar** com gatilhos: usuários simultâneos reais, >500 leads, ou relatórios que markdown não dá. Meio-termo futuro: SQLite só como **índice/cache derivado** do vault (leitura), nunca como fonte da verdade.

---

Relatório salvo em `C:\Users\evert\.claude\plans\mode-analise-o-projeto-dazzling-robin.md`. Se quiser, implemento os itens 1–3 do top-5 (maior impacto, menor esforço).
