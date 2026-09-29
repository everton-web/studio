# Theo (Dev) - Reuniao 29/09/2026

Confirmei a causa raiz do Orion: a aba Time & Fila le a fila morta `_scripts/orquestra/fila.json` e nunca a pasta que o fluxo novo grava. Proponho uma fonte unica em markdown, um arquivo por demanda, dentro do vault. No Studio Web Pro, so parte das telas acompanha cliente de verdade; recomendo manter separado com link.

## 1. Causa raiz e fonte unica de demandas

**1a. Causa raiz: CONFIRMADA.** O app e o fluxo novo usam pasta, formato, campos e status diferentes, e nunca se encontram.

O que o app le hoje:
- Aba "Time & Fila" monta Time (`data.agentes`) + Fila (`data.backlog`) + o componente `<Demandas>` (`apps/plataforma/src/components/dashboard.tsx:753-831`).
- `data.agentes` vem de `vault/10 Agentes/*.md` (`apps/plataforma/src/lib/vault.ts:293-304`); `data.backlog` vem de `20 BACKLOG.md` (`vault.ts:315`).
- `<Demandas>` faz GET `/api/orquestra` (`components/demandas.tsx:37`), que chama `listarFila` (`apps/plataforma/src/app/api/orquestra/route.ts:8`); `listarFila` le `_scripts/orquestra/fila.json` (`lib/orquestra.ts:30-33`, caminho em `orquestra.ts:8`).
- `estadoAgentes`, que marca quem esta ocupado, tambem so olha `fila.json` (`orquestra.ts:83-95`).

O que o fluxo novo grava:
- `_scripts/persona.mjs` grava `vault/SaaS/Agentes/ao-vivo/<id>.json` (`persona.mjs:108-120`), com estado "pronto" (`persona.mjs:156`) ou "falhou" (`persona.mjs:165`), e log em `vault/SaaS/Agentes/<persona>.log` (`persona.mjs:132`).
- `persona.mjs` nunca escreve `fila.json`. Briefings vao para `docs/demandas/AAAA-MM-DD/*.md`, logs para `docs/demandas/*/logs/`.

Onde quebra, concreto:
- Pasta: app le `_scripts/orquestra/` (`orquestra.ts:8`); persona grava `vault/SaaS/Agentes/ao-vivo/` (`persona.mjs:108`).
- Formato: `fila.json` e um array JSON unico (reescrito a cada mudanca); `ao-vivo` e um JSON por execucao (`persona.mjs:118`).
- Campos: `fila.json` usa `id, engine, prompt, status, criado, saida, atribuido, ia` (`orquestra.ts:11-20`); `ao-vivo` usa `id, persona, tarefa, modelo, estado, tentativa, inicio, fim, resumo, erro, atualizado` (`persona.mjs:110-113`).
- Status: `pendente|rodando|ok|erro` (`orquestra.ts:15`) contra `trabalhando|pronto|falhou|...` (`persona.mjs:112,156,165`), sem mapa entre eles.
- O app escreve `fila.json` (`orquestra.ts:35-49`) e nunca le `ao-vivo/` nem `docs/demandas/` (confirmado por busca em `apps/plataforma/src`).
- Vault: app usa `VAULT` com padrao `D:/Obsidian - Claude/🏢 Agência` (`vault.ts:4`); persona usa `ROOT/vault` (`persona.mjs:29`); hoje so alinham por env (`apps/plataforma/.env.local:10`).

Veredito: dois sistemas paralelos. O app mostra o que o loop-daemon legado escrevia; o trabalho real cai em `ao-vivo/` e `docs/demandas/`, invisivel na tela.

**1b. Fonte unica proposta:**
- Formato: markdown com frontmatter YAML, um arquivo por demanda. O vault e a fonte da verdade e ja e markdown; o app ja le frontmatter (`vault.ts:68-74`) e escreve markdown (`fmBlock`, `vault.ts:109-111`). JSON num arquivo unico nao tem historico nem evita reescrita concorrente.
- Pasta: `vault/SaaS/Agentes/Demandas/`. Arquivo: `<id>.md`, id no padrao `dem-<base36 do tempo>` (`orquestra.ts:38`).
- Frontmatter obrigatorio: `id` string ("dem-muif8jiz"); `titulo` string; `persona` (caio|davi|theo|mia|lia|fabio|olga|orion); `status` enum (fila|em_andamento|bloqueada|aguardando_cliente|concluida|cancelada); `criada_em` ISO; `iniciada_em` e `concluida_em` ISO ou vazio; `prazo` YYYY-MM-DD ou vazio; `cliente` e `projeto` string ou vazio; `origem` (chat|kanban|cliente|orion); `briefing` caminho ("docs/demandas/2026-09-29/25-conteudo-social.md").
- Corpo: `## Log`, uma linha por evento, `- <ISO> <quem> <estado> <nota>`, append-only (so adiciona, nunca reescreve).
- Quem escreve o que: `persona.mjs` cria o arquivo no inicio (id, titulo, persona, status `em_andamento`, `iniciada_em`) e no fim atualiza `status`, `concluida_em` e acrescenta linha no Log; so toca nesses campos. O app le a pasta para lista e calendario, cria o arquivo ao despachar (hoje `novaDemanda`, `orquestra.ts:35-49`) e atualiza `status`/Log ao concluir, reabrir ou remarcar. Sem sobrescrita: arquivo por demanda, e o app nao mexe em campos de execucao enquanto o status for `em_andamento`.
- Migracao, caminho mais barato: `fila.json` nao portar (renomear para `.legado`); `docs/demandas/` e `ao-vivo/` ler uma unica vez e gerar um `Demandas/<id>.md` por item, com o briefing apenas como link no campo `briefing`; um script de conversao rodado uma vez, sem manutencao.
- Plano minimo: (1) fechar o formato e criar `vault/SaaS/Agentes/Demandas/`; (2) criar o leitor da pasta em `apps/plataforma/src/lib` e trocar `listarFila` na API; (3) ajustar `persona.mjs` para criar e atualizar o arquivo da demanda; (4) rodar a conversao de `fila.json`, `docs/demandas/` e `ao-vivo/`; (5) remover leitura e escrita de `fila.json`.

## 2. Studio Web Pro como modulo

Base: copia em `archive/referencias/studiowebpro` (Next.js 16, `package.json`), `PLATFORM.md` e as tabelas reais de `supabase/schema.sql`.

Funcionalidades que ACOMPANHAM CLIENTE, com onde vivem:
- Carteira de clientes: `src/app/(dashboard)/dashboard/clientes/page.tsx` + `src/components/clientes/clientes-tabs.tsx` (abas Pipeline e Carteira, cards com nome, email, nicho e WhatsApp).
- Cofre de senhas: `src/components/clientes/credentials-manager.tsx` + tabela `client_credentials` (`schema.sql:84-106`, com RLS).
- Briefings (BC Studio): `src/app/(dashboard)/dashboard/bc-studio/*`, `src/app/api/briefing/submit/route.ts`, tabela `briefing_forms` (`schema.sql:114-127`, token publico e `responses` JSONB).
- Prospector e leads: `src/app/(dashboard)/dashboard/prospector/*`, `src/components/prospector/*`, `src/app/api/prospector/*` (prospectar, leads, publicar, redesign); tabelas `prospector_leads` (`schema.sql:690-719`), `prospector_sites` (`schema.sql:735-743`), `prospector_config` (`schema.sql:650-671`).
- Contratos: `src/app/(dashboard)/dashboard/contrato/*`, `src/components/contrato/*`; tabelas `contracts` (`schema.sql:564-595`) e `wd_profiles` (`schema.sql:537-549`).
- Geracao de copy: `src/app/api/generate-copy/route.ts` (OpenAI `gpt-4o-mini`, linha 88) + tabela `generated_copies` (`schema.sql:138-147`).

NAO acompanham cliente (honesto): aulas (`lessons`, `schema.sql:180`), lives (`lives`, `schema.sql:196`), dicas (`tips`, `schema.sql:167`), biblioteca (`biblioteca_posts`/`blocks`, `schema.sql:381-408`), codigos (`code_snippets`, `schema.sql:152`) e a area `admin`. Isso e conteudo e curadoria do infoproduto, nao rotina de cliente.

Dependencias que travam portar: Supabase (banco, auth, RLS) sustenta quase todas as telas, com login em `src/app/actions/auth.ts`; Stripe (`src/lib/stripe.ts`, `src/lib/stripe-plans.ts`, `src/app/api/stripe/*`) e so billing do SaaS; IA (OpenAI) em `generate-copy` e `redesign` (`src/app/api/prospector/redesign/route.ts:7`); FTP Hostgator em `src/app/api/prospector/publicar/route.ts:3` (`basic-ftp`). Sem Supabase, o cofre, os briefings e o login nao funcionam; sem OpenAI, nao ha copy nem redesign.

Custo e risco por grupo (A portar com vault e sem banco; B app separado com link/SSO; C migrar dados e aposentar):
- Cliente/carteira e briefings: A P/M, risco baixo (dados simples em markdown); B P, risco medio (dois apps, login duplicado); C G, risco de perder o cofre.
- Cofre de senhas: A M, risco alto (dado sensivel em markdown puro no vault, LGPD); B P, risco baixo (segue com RLS no Supabase); C G, risco alto.
- Prospector/leads: A M/G, risco de duplicar o Comercial que o app ja tem com `40 Comercial/Leads` (`vault.ts:113-158`); B P; C M/G.
- Contratos: A M, risco medio (falta motor de PDF, nao verificado); B P; C M.
- Billing e conteudo (Stripe, aulas, biblioteca, codigos): sem sentido portar para a agencia; manter em B ou nao migrar. Custo P.

Recomendacao unica e global: opcao B agora. Manter o Studio Web Pro de pe, com Supabase proprio, e entrar no app so como link (modulo), sem acoplar banco, Stripe ou OpenAI, porque a plataforma e sem banco, a cota esta no fim do mes e a VPS migra amanha. Portar (A) fica para depois e so para carteira, briefings e contratos; nunca migrar o cofre nem o billing para o vault.

## 3. Clarity

Fato verificado: o Clarity hoje e so um selo na tela. `rastreamento.tsx:96` mostra o ID fixo `ynkvl1zisv` e a linha `:102` diz que basta trocar o ID por site; nao ha chamada de API, token nem leitura de dado. O diagnostico de lead apenas detecta o script por regex (`analise.ts:160`, campo `rastreio.clarity` em `:55`) e nem usa isso nas faltas nem nos fortes (`:245-247`). O rastreamento proprio grava `vault/SaaS/Rastreamento/hits.json` no formato `site` com `n, primeiro, ultimo` (`api/t/route.ts:20-31`), lido por `vault.ts:273-281` e exibido em `rastreamento.tsx`. Nao existe aba "Clientes" (abas atuais: Inicio, Time & Fila, Projetos, Comercial, Resultados, Conteudo); o `Rastreamento` aparece dentro de Resultados (`dashboard.tsx:838`). Nao ha acesso nem clique por cliente guardado: `SaaS/Trafego/campanhas.json` esta `[]` e `SaaS/Prospeccao/` so tem analises e rotacao.
**3a. O que da para incorporar (e o que fica a confirmar)**
- (i) Embed/iframe do painel do Clarity na aba Clientes: do nosso lado nao ha bloqueio, porque o CSP de `next.config.ts:3-18` so tem `frame-ancestors 'none'` (protege o app de ser emoldurado) e nenhum `frame-src`; o `X-Frame-Options: DENY` (`:12`) vale para as respostas do nosso app, nao para emoldurar terceiros. Se o painel do Clarity manda `X-Frame-Options`/`frame-ancestors` proprio, ou se os termos proibem, nao e verificavel neste ambiente: a confirmar.
- (ii) Data Export API (token por projeto, gerar Data Access API key, limite de requisicoes, janela de 1 a 3 dias na API contra 30 dias no painel): nao ha nada no codigo. A confirmar na documentacao oficial do Microsoft; nao prometer ao Everton sem conferir.
- (iii) Heatmaps e gravacoes de sessao: linkar para o painel, nao incorporar.
**3b. Token por projeto (concordo com o caminho sugerido)**
`vault/SaaS/Rastreamento/clients/<slug>.json` com `cliente`, `dominio`, `clarity_id`, `token_env` (nome da variavel de ambiente, nunca o valor), `ativo`, `ultima_sync`. Um projeto Clarity por cliente, porque o Clarity e por dominio. Regra dura: o token so no `.env` da VPS, nunca em markdown nem no git; no vault vai apenas o nome da variavel. O `clarity_id` do evertonbrito.com ja e publico (esta no HTML), entao pode viver no JSON.
**3c. Como puxar cliques e acessos, reaproveitando `SaaS/Rastreamento`**
Fluxo minimo: um script `_scripts/clarity-sync.mjs` roda por periodo (systemd timer na VPS), le a lista de `clients/*.json`, chama a API com a env de cada cliente e grava `vault/SaaS/Rastreamento/<slug>/<AAAA-MM-DD>.json` com `acessos`, `sessoes`, `cliques`, `origem` e `fonte` (`"clarity"` ou `"pixel"`). A aba leria por um leitor novo em `vault.ts`, ao lado de `rastreamentoData` (`:273`), que ja le o hits.json. Numero oficial na tela: o contador proprio (pixel), porque e o dado que controlamos, ja esta no vault e nao depende de cota, token nem API externa; o Clarity entra como complemento (sessoes, heatmap) enquanto a API nao estiver confirmada. O campo `fonte` evita somar as duas origens.
**3d. O que nao da para fazer agora (3 linhas)**
Sem token de API confirmado, nao puxo acesso nem clique real por cliente: hoje so existe pageview de pixel.
Sem internet neste ambiente, nao valido endpoints, limites nem os termos do Clarity, entao isso fica como "a confirmar" antes de prometer ao Everton.
Com a VPS migrando amanha e a cota no fim, nao inicio integracao de API nesta vespera: o selo e o link ja bastam para hoje.

## 4. Impacto da migracao VPS (amanha, 30/09)
Como roda hoje: PC Windows com `next start` na porta 3100, watchdog `_scripts/watch.mjs` e tunel Cloudflare `agencia` servindo app.evertonbrito.com (`docs/consolidacao/AUDITORIA.md:22,78`); o `startup-agencia.cmd` ja esta quebrado (aponta `C:\Users\evert\watch-agencia.mjs`, `AUDITORIA.md:78`). `apps/plataforma/package.json:5-10` so tem `dev/build/start/typecheck` (Next 16.3.6). Nao ha Dockerfile, ecosystem/pm2 nem `.service` no repo: nao existe processo de deploy scriptado; o systemd ainda e proposta (`AUDITORIA.md:77-80`).
Variaveis (so nomes): `.env.local` traz `GEMINI_API_KEY`, `GEMINI_MODEL`, `AGENCIA_USER`, `AGENCIA_PASS`, `AGENCIA_SECRET`, `LEADS_TOKEN`, `INFINITEPAY_HANDLE`, `INFINITEPAY_REDIRECT_URL`, `VAULT`, `AGENCIA_CWD`. `console.ts:4-5` usa `PI_CLI` e `AGENCIA_CWD`; `persona.mjs:29,32,63` usa `VAULT`, `PI_CLI` (default `APPDATA` do Windows) e `~/.claude/agents`.
Caminhos absolutos que quebram no Linux: `vault.ts:4`, `console.ts:4-5`, `files.ts:4`, `analise.ts:11`, `api/t/route.ts:7`, `persona.mjs:29`, `dispacha.mjs:23` (todos env-overridable); e sem env, `loop-247.mjs:33`, `ia.mjs:152` e `aiox-pty.mjs:12` (`AUDITORIA.md:52-64`). `node-pty` e nativo e precisa recompilar (`package.json:20`, `AUDITORIA.md:70`). `hits.json` e os logs novos (`vault/SaaS/Agentes/<persona>.log` e `ao-vivo/*.json`, `persona.mjs:30,108,132`) vivem no vault: sobrevivem apenas se `VAULT` apontar certo na VPS.
**4a. Riscos, por gravidade (arquivo/linha, mitigacao em uma linha)**
1. `VAULT` com default `D:/` (`vault.ts:4`, `persona.mjs:29`, `dispacha.mjs:23`, `api/t/route.ts:7`, `analise.ts:11`): sem env, nada acha o vault. Mitigar setando `VAULT` na VPS e trocando o default por `../vault`.
2. Caminhos fixos sem env (`loop-247.mjs:33`, `ia.mjs:152`, `aiox-pty.mjs:12`): quebram direto. Mitigar portando para env; `aiox-pty.mjs` pode ser arquivado (`AUDITORIA.md:71`).
3. `PI_CLI` default Windows (`console.ts:4`, `persona.mjs:32`): Assistente (xterm) e persona nao sobem. Mitigar setando `PI_CLI` para o pi Linux ou desativando o Assistente (`AUDITORIA.md:87`).
4. `node-pty` nativo (`package.json:20`): sem toolchain nao instala. Mitigar `build-essential` + `python3` + `npm rebuild node-pty`.
5. Pixel e logs podem sumir em silencio: `api/t/route.ts:27-30` engole o erro de escrita. Mitigar disparando um hit de teste no pos-migracao.
6. Scripts Windows, 14 `.cmd/.bat/.ps1` (`AUDITORIA.md:75`): o que mantem o ar nao sobe como esta. Mitigar `agencia-app.service` + `cloudflared-tunnel.service` (`AUDITORIA.md:78`).
7. `publicar-relatorio.ts:25,43` faz `git push` e depende de `archive/git-historico/site.git`; a decisao de repo segue aberta (`AUDITORIA.md:119`). Mitigar conferindo git, remotes e o modelo de repo antes do go-live.
**4b. Janela de congelamento (o que nao pode ser feito amanha)**
- Trocar a fonte das demandas (secao 1) na vespera da migracao: risco alto, fazer depois.
- Rodar a conversao de `fila.json`/`docs/demandas`/`ao-vivo` e apagar qualquer arquivo: irreversivel no meio do deploy.
- Migrar o cofre de senhas para markdown e acoplar o Studio Web Pro: nenhum ajuda a subir e ambos ampliam o risco.
- Iniciar integracao de API (Clarity, Meta, Google): fica para depois, com a VPS estavel.
**4c. Checklist pos-migracao**
1. Abrir app.evertonbrito.com e logar com `AGENCIA_USER`/`AGENCIA_PASS`.
2. Em Resultados, conferir total de hits e lista de sites (nao pode estar zerado).
3. Disparar um hit de teste e ver `SaaS/Rastreamento/hits.json` subir no vault da VPS.
4. Abrir o Assistente: `node-pty` carregou e `PI_CLI` responde; se nao, registrar como desativado.
5. Rodar `node _scripts/persona.mjs theo "ping"` e confirmar `ao-vivo/<id>.json` e `theo.log`.
6. Conferir `systemctl status agencia-app` e `cloudflared-tunnel`, e a porta 3100; testar uma integracao sensivel (webhook InfinitePay ou leads).
**4d.** A fonte unica de demandas so deve vir depois da VPS de pe porque ela mexe no mesmo vault e no mesmo app que a migracao move: fazer as duas juntas torna impossivel, num erro, saber se a causa foi o servidor ou o dado.

## Riscos

- Trocar a fonte da fila no mesmo dia do deploy na VPS soma risco ao que ja vai mudar.
- Sem `VAULT` setado na VPS, app e persona podem apontar para vaults diferentes (`vault.ts:4` contra `persona.mjs:29`) e a tela some.
- Escrita concorrente: persona e app podem tocar o mesmo arquivo de demanda; a regra de dono de campo precisa valer.
- Cofre de senhas e dado sensivel (LGPD); portar para markdown no vault o expoe em texto puro.
- Conversao de dados e irreversivel se `fila.json` for apagado antes de validar; ha backup (`_scripts/orquestra/fila.backup-20260926-012108.json`).
- Embedar o Clarity na aba Clientes depende de `frame-ancestors`/termos do Microsoft, que nao consegui verificar: prometer so depois de confirmar.
- Sem `VAULT` correto na VPS, o pixel de `api/t/route.ts` grava no vazio sem erro e a contagem parece parada.

## O que preciso de outra persona

- Lia: fechar os campos do frontmatter da demanda antes do build, como PM.
- Orion: fixar o mapa unico de status e confirmar o desligamento do loop legado.
- Olga: confirmar a fronteira entre o kanban e a pasta `Demandas/` e quem move o card.
- Everton: decidir se o Studio Web Pro fica separado por link ou portado, e liberar ou nao o cofre de senhas, e se o Clarity pode ser embutido ou apenas linkado.
