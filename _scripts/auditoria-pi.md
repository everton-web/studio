# Auditoria do SaaS — Pi (estrutural, código real)

Data: 2026-09-25 · Autor: Pi (agente da operação) · Par com: `auditoria-opus.md` (Claude via opencode)

## 1 · Mapa da arquitetura

```
agencia-app (Next 16, porta 3100, túnel → app.evertonbrito.com)
├─ src/app/api/           endpoint por módulo (login, data, pipeline, prospector,
│                         financas, infinitepay/webhook, leads, t, analytics, kanban, inbox, upload/files, mirror)
├─ src/lib/
│   ├─ vault.ts           fonte da verdade: lê/escreve Obsidian (COMANDO, Kanban, Leads, Placar…)
│   ├─ prospector.ts      busca (Places/OSM + cache) + auditoria de sites (filtros: sem blog, sem redes/marcas)
│   ├─ infinitepay.ts     links de pagamento (POST /links) + webhook (marca pago → Placar automático)
│   ├─ auth.ts            cookie HMAC 7d · console.ts/mirror.ts/files.ts (legados vivos)
├─ src/components/        dashboard (shell bento) · pipeline (kanban 6 estágios + DnD + ficha) ·
│                         analytics (campanhas/CPL/ROI) · rastreamento (pixel/Clarity) · ui/ (shadcn)
├─ global tokens          IDV (laranja #FF4000, DM Sans/Mono, Inter p/ números) + tokens shadcn mapeados
```

**Forças:** estado único e auditável (vault) · zero banco = deploi simples · módulos isolados · UI validada por gaúdo de qualidade (impeccable) · automações reais (prospecção, webhook→placar).

**Fraquezas:** escrita sem lock (concorrência) · dependência do PC ligado · OAuth/mirrors externos frágeis · sem testes automatizados · sem backup do vault.

## 2 · Riscos (severidade)

| Sev | Risco | Ação |
|---|---|---|
| 🔴 Alta | Concorrência de escrita no vault (abas + rotina 7h) → perda de update | Fila/serialização por arquivo (`lock.ts`) |
| 🔴 Alta | Senha default `[senha padrão antiga — removida]` + credenciais no vault | Trocar + tudo via env |
| 🟡 Média | OAuth do Claude expira (rotina 7h morre) | API key (`setup-token`) na rotina |
| 🟡 Média | Overpass/mirrors instáveis | Cache já implementado; Places API melhora |
| 🟡 Média | Sem backup do vault | Backup diário git/zip |
| 🟢 Baixa | Webhook InfinitePay depende do túnel | Regra do ambiente (PC ligado) documentada |

## 3 · Top 5 melhorias (impacto × esforço)

1. **Fila de escrita no vault** (alta × baixa) — `src/lib/lock.ts` serializando ops por arquivo.
2. **Segredos/credenciais via env** + trocar senha do app (alta × baixa).
3. **Enriquecer leads do form** — categoria `site` → auditoria automática completa a ficha (média × média).
4. **Backup diário do vault** (média × baixa) — `_scripts/backup-vault.cmd` → zip em `backups/`.
5. **Status da rotina 7h no app** — última execução + contadores na tela Prospecção (média × baixa).

## 4 · Banco (SQLite/Supabase) vs vault

- **Hoje (vault):** certo. Volume baixíssimo, o vault É a memória (Obsidian no seu workflow), zero infra de banco.
- **Quando migrar:** (a) multiusuário real (clientes do SaaS), (b) volume de leituras que faça o markdown lento, (c) precisar de queries complexas (relatórios).
- **Caminho econômico:** começar com **SQLite** para dados transacionais (finanças, campanhas) mantendo o vault para operação/histórico — migração incremental, sem Supabase agora.
- **Veredito:** permanecer no vault por mais 3-6 meses; preparar camada de dados somente quando o SaaS tiver 1º cliente externo.

---
*Veredito conjunto: quando o `auditoria-opus.md` (Claude) chegar, comparar as 5 prioridades e fechar o plano de execução no Backlog.*