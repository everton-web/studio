# Story v3-05: Relatório mensal por cliente

## 1. Metadados

- **Título:** Relatório mensal por cliente, link público com token e lista no Hoje
- **Entrega:** 5 da leva v3 (geração dia 1, dashboard público e botão de WhatsApp)
- **Status:** pronta para o Theo (dev), após a v3-03 e a v3-02 (dependências duras)
- **Dono:** Theo (dev), com Davi (UI), Mia (voz) e Fábio (receita recorrente)
- **Prazo:** após a v3-03 (banco) e a VPS (30/09) estáveis, conforme ordem da ATA (seção 5)
- **Origem:** decisões do Everton de 29/09 (ATA seção 7, item 2, e seção 8) e tarefa `docs/demandas/2026-09-29/28-lia-stories-v3.md:18`

## 2. Objetivo único

Todo dia 1 sai um relatório mensal automático por cliente ativo, embutido no preço
do site, e o Everton manda o link em um toque pelo WhatsApp. O relatório é a base
de um plano mensal de acompanhamento, ou seja, receita recorrente (ATA seção 4,
`orion.md:28`). Nada nesta entrega existe fora desse objetivo.

## 3. Escopo

### Incluído nesta entrega

- Geração automática, todo dia 1, para todos os clientes ativos, com histórico na
  tabela `relatorio` da v3-03 (`docs/stories/v3-03-banco-da-plataforma.story.md:177`).
- Link público com token por cliente, servido pela própria plataforma na VPS, na
  rota `/r/<token>`, sem `git push` e sem login (ATA seção 8).
- Dashboard público do cliente com pixel próprio, saúde do site, leads do
  formulário, Clarity pela API quando confirmada e Google Search Console só com
  autorização do cliente. O número oficial é o pixel (`theo.md:73`).
- Lista de clientes ativos no Hoje, no dia 1, com botão de WhatsApp em 1 toque, já
  com a mensagem e o link prontos. Custo zero, sem envio automático.
- Token por cliente, revogável, nunca no git, alvo do tipo `/r/<token>`.
- Reuso do relatório público existente, adaptado ao caso de cliente.

### NÃO incluído nesta entrega

- Fase 2: envio automático pela API oficial do WhatsApp (Meta Cloud API, modelo de
  mensagem aprovado, conta Business verificada, custo por conversa). Fica fora
  desta leva (ATA seção 8).
- Publicação de conteúdo continua manual. Esta entrega não publica nada.
- Embed do Clarity e Data Export API sem confirmação (ATA seção 2, `theo.md:68`).
- Google Search Console sem autorização registrada do cliente.
- Qualquer alteração em `apps/site`, deploy ou o `git push` atual.

## 4. O que o Everton vê na tela

### 4.1 Hoje no dia 1 (lista de clientes e botão de WhatsApp)

O Hoje é a tela da v3-02 (`docs/stories/v3-02-hoje-agenda-operacao.story.md:76`).
A v3-02 deixou a lista de clientes com botão de WhatsApp para esta entrega
(`v3-02 AC-07`, linha 172).

No dia 1, o Hoje ganha um bloco com um item por cliente ativo. Cada item traz o
nome do cliente, o mês do relatório e um botão de WhatsApp. Um toque abre o
`wa.me` com o número do cliente e a mensagem já montada, citando o cliente e
levando o link `/r/<token>`. É 1 toque por cliente, com envio manual. Nada sai
sozinho.

Estado vazio honesto: "Nenhum cliente ativo para enviar relatório." Sem número
fabricado.

### 4.2 Dashboard público do cliente (`/r/<token>`)

Página sem login, aberta pelo cliente pelo link que o Everton manda. Cabeçalho
com a identidade da agência e o nome do cliente. Blocos, na ordem:

1. **Pixel próprio.** Pageviews do site do cliente, com o número oficial vindo de
   `hits.json` (`apps/plataforma/src/lib/vault.ts:273`, gravado por
   `apps/plataforma/src/app/api/t/route.ts:19`). Sem hit, mostra o estado vazio de
   `apps/plataforma/src/components/rastreamento.tsx:78` ("nenhum hit ainda:
   instale o pixel e visite o site").
2. **Saúde do site.** No ar, formulário e certificado, do arquivo por cliente da
   v3-02 (`v3-02`, linha 220, `vault/SaaS/Saude/<slug>.json`). Campo sem medida
   mostra "sem medida ainda", nunca zero.
3. **Leads do formulário.** Contagem de leads da origem do cliente, alimentados
   por `POST /api/leads` (`apps/plataforma/src/app/api/leads/route.ts:23`). Sem
   lead, estado vazio honesto "Nenhum lead do formulário ainda."
4. **Clarity.** Um link para o painel. Sem API confirmada, o rótulo honesto
   "números do Clarity: pendente de API" (`theo.md:68`). Nunca iframe.
5. **Google Search Console.** Só aparece com autorização registrada do cliente.
   Sem autorização, estado vazio honesto e nenhum número.

Cada número exibido cita a fonte e a data. Nenhum número é fabricado.

### 4.3 Token inválido

`/r/<token>` com token errado, revogado ou inexistente responde 404 com a mesma
página de "não encontrado". Não revela se o token existiu nem mostra nome ou dado
de cliente.

### 4.4 Responsivo

O Hoje e o dashboard público ficam íntegros em 375px, 1280px e 1920px, sem scroll
horizontal, texto cortado ou sobreposição. No celular os blocos empilham em uma
coluna e o botão de WhatsApp fica tocável.

## 5. Critérios de aceite

- [x] **AC-01 (geração no dia 1):** o agendador gera, no dia 1, um relatório para cada
  empresa com `estagio_crm = 'cliente'` (v3-03, linha 94) e grava uma linha por
  cliente e mês na tabela `relatorio` (v3-03, linha 177). A função de geração é
  uma só, usada tanto pelo agendador quanto pela rota manual.
- [x] **AC-02 (histórico idempotente):** rodar a geração duas vezes no mesmo mês não
  duplica a linha de `(empresa_id, mes)` (v3-03, linha 184), atualiza a mesma.
- [x] **AC-03 (link sem login):** `GET /r/<token>` responde 200 e renderiza o
  dashboard sem cookie de sessão, com `noindex`.
- [x] **AC-04 (token revogável):** rotacionar ou limpar o `link_token` (v3-03, linha
  182) faz o link antigo responder 404 e o novo funcionar. Conferível com dois
  tokens do mesmo cliente.
- [x] **AC-05 (token inválido não vaza):** token inválido, revogado ou inexistente
  responde 404 com a mesma página, sem revelar se o token existiu e sem exibir
  nome nem dado do cliente. Conferível comparando a resposta de um token
  inexistente com a de um token revogado.
- [x] **AC-06 (pixel é o número oficial):** o bloco de pixel do dashboard mostra os
  pageviews do cliente lidos de `hits.json` (`apps/plataforma/src/lib/vault.ts:273`,
  `apps/plataforma/src/app/api/t/route.ts:19`) e o valor bate com o arquivo.
- [x] **AC-07 (saúde do site):** o dashboard mostra no ar, formulário e certificado
  por cliente, da fonte da v3-02 (`v3-02`, linha 220), e marca alerta quando o
  site está fora do ar ou o certificado está a vencer. Campo sem medida mostra
  "sem medida ainda".
- [x] **AC-08 (Clarity por link):** o dashboard oferece um botão que abre o painel do
  Clarity em nova aba e nunca um iframe. Sem API confirmada, mostra o rótulo
  "números do Clarity: pendente de API" (`theo.md:68`).
- [x] **AC-09 (Search Console com autorização):** o bloco de Search Console só
  aparece com autorização registrada do cliente. Sem autorização, mostra estado
  vazio honesto e nenhum número.
- [x] **AC-10 (leads do formulário):** o dashboard mostra a contagem de leads da
  origem do cliente, vindos de `POST /api/leads`
  (`apps/plataforma/src/app/api/leads/route.ts:40`). Sem lead, mostra "Nenhum lead
  do formulário ainda."
- [x] **AC-11 (botão de WhatsApp em 1 toque):** no dia 1 o Hoje lista os clientes
  ativos com um botão que abre o `wa.me` do cliente com a mensagem e o link
  `/r/<token>` prontos. Nenhuma chamada à API do WhatsApp é feita (sem envio
  automático).
- [x] **AC-12 (vazio no Hoje):** sem cliente ativo, o bloco do Hoje mostra "Nenhum
  cliente ativo para enviar relatório." Sem número fabricado.
- [x] **AC-13 (nada vai para o git):** o caminho novo não chama `publicarRelatorio`
  (`apps/plataforma/src/lib/publicar-relatorio.ts:39` e `:58`, que fazem `git
  push`). O link do relatório mensal é servido pela plataforma. Conferível por
  busca: nenhuma execução da geração dispara `git`.
- [x] **AC-14 (token não vaza):** o valor do token não aparece no repositório nem nos
  logs, e o Hoje copia ou abre o link sem imprimir o token. Conferível por busca
  pelo valor do token no repo e nos logs após a geração.
- [x] **AC-15 (responsivo):** o Hoje e o dashboard público ficam íntegros em 375px,
  1280px e 1920px, sem scroll horizontal, texto cortado ou sobreposição.
- [x] **AC-16 (estados vazios honestos):** todo bloco sem dado mostra o estado vazio
  da seção 4. Nenhum número é inventado nem zero fabricado; cliente sem dado não
  vira 0.
- [x] **AC-17 (sem travessão e sem viúvas):** nenhum texto visível usa travessão nem
  meia-risca; títulos e parágrafos evitam palavra órfã na última linha
  (`text-wrap: balance`).
- [x] **AC-18 (sem "em breve"):** nenhum item "em breve" entra no menu nesta entrega.
- [x] **AC-19 (não regressão):** o relatório público de lead existente
  (`docs/stories/relatorio-publico.story.md`) segue funcionando, e as telas Hoje,
  Agenda e Operação da v3-02 seguem iguais.
- [x] **AC-20 (teste):** o teste de ponta a ponta da seção 10 existe e passa.

## 6. Tarefas técnicas em ordem

1. Criar `apps/plataforma/src/lib/relatorio-mensal.ts` com
   `gerarRelatorioMensal(empresaId, mes)` e `gerarRelatoriosAtivos(mes)`. A função
   lê `empresa` com `estagio_crm = 'cliente'` (v3-03, linha 94), monta o conteúdo
   (pixel, saúde, leads, Clarity, Search Console) e grava na tabela `relatorio`
   (v3-03, linha 177). Reusa o formato público de `RelatorioPublico`
   (`apps/plataforma/src/lib/relatorio.ts:11`) e mantém fora do JSON o que
   `relatorio-publico.story.md:139` já exclui.
2. Criar o token por cliente e por mês: valor aleatório gravado em
   `relatorio.link_token` (v3-03, linha 182), com função de rotacionar e revogar.
   O token nunca vai para o git nem para log.
3. Criar a rota pública `apps/plataforma/src/app/r/[token]/page.tsx`, fora do
   login: busca `relatorio` por `link_token`, renderiza o dashboard e responde
   `notFound()` quando o token não existe ou foi revogado, sem revelar
   existência.
4. Criar a rota autenticada `apps/plataforma/src/app/api/relatorio-mensal/route.ts`
   (`POST`) com `isAuthed` (`apps/plataforma/src/app/api/financas/route.ts:6`),
   chamando `gerarRelatoriosAtivos`. É a mesma porta de entrada do agendador e do
   disparo manual, garantindo uma única função de geração.
5. Criar o componente do dashboard público (`components/relatorio-cliente.tsx`)
   com os blocos da seção 4.2, fontes citadas e estados vazios honestos.
6. Criar `_scripts/relatorio-mensal.mjs`, o script do agendador, que chama a mesma
   rota para todos os clientes ativos. Deixar prontas a linha de cron e a unit do
   systemd timer, no padrão do backup da v3-03 (linha 260).
7. Desativar o caminho de `git push` no fluxo do relatório mensal: o novo link é
   servido pela plataforma (`apps/plataforma/src/lib/publicar-relatorio.ts:39` e
   `:58` deixam de ser chamados por este fluxo). Não remover o relatório público
   de lead, que segue no site.
8. Adicionar o bloco do Hoje (v3-02) com a lista de clientes ativos e o botão de
   WhatsApp em 1 toque, só no dia 1, com a mensagem e o link prontos.
9. Ajustar responsividade em 375px, 1280px e 1920px e revisar estados vazios.
10. Escrever o teste de ponta a ponta da seção 10.

## 7. Arquivos prováveis

- `apps/plataforma/src/lib/relatorio-mensal.ts` (novo, geração e conteúdo)
- `apps/plataforma/src/lib/publicar-relatorio.ts` (parar de usar o `git push` no caminho novo)
- `apps/plataforma/src/lib/relatorio.ts` (reuso do formato público)
- `apps/plataforma/src/lib/vault.ts` (pixel e saúde, reuso)
- `apps/plataforma/src/app/r/[token]/page.tsx` (novo, dashboard público sem login)
- `apps/plataforma/src/app/api/relatorio-mensal/route.ts` (novo, geração autenticada)
- `apps/plataforma/src/app/api/relatorio/route.ts` (ajuste do caminho atual)
- `apps/plataforma/src/components/relatorio-cliente.tsx` (novo, dashboard público)
- `apps/plataforma/src/components/hoje.tsx` (bloco de clientes e WhatsApp, v3-02)
- `_scripts/relatorio-mensal.mjs` (novo, script do agendador)
- `_scripts/qa/e2e-relatorio-mensal.mjs` (novo, teste da seção 10)

## 8. Fora de escopo

- Fase 2 do WhatsApp: API oficial (Meta Cloud API), modelo de mensagem aprovado,
  conta Business verificada e custo por conversa (ATA seção 8).
- Envio automático de qualquer mensagem. O botão do Hoje é 1 toque manual.
- Publicação de conteúdo, que continua manual.
- Embed do Clarity e Data Export API sem confirmação.
- Google Search Console sem autorização do cliente.
- `apps/site`, `git push` e deploy.
- Banco, tabelas e rotas do Studio Web Pro (ATA seção 9).

## 9. Riscos

- **Dado de cliente sem autorização (LGPD):** o dashboard é público por link. Mitigar
  com token por cliente, revogável, `noindex`, e só dados autorizados; Search
  Console apenas com autorização registrada.
- **Token vazando no git ou em log:** token só no banco e no link, nunca em
  arquivo versionado nem em log (regra de `theo.md:71`); busca no repo e nos logs
  como prova (AC-14).
- **`git push` do `publicar-relatorio.ts` atual:** hoje ele empurra para o
  monorepo e para `archive/git-historico/site.git`
  (`apps/plataforma/src/lib/publicar-relatorio.ts:39`, `:58` e `:43`), risco já
  apontado em `theo.md:90`. O caminho novo é servido pela plataforma, sem git
  (AC-13).
- **Cliente sem dado:** cliente recém-fechado pode não ter hit, lead nem
  verificação de saúde. Mitigar com os estados vazios honestos (seção 4), nunca
  número fabricado.
- **Dependência dura do banco da v3-03:** a tabela `relatorio` (v3-03, linha 177)
  e `empresa` são pré-requisito. Sem a v3-03 migrada, esta entrega não sobe.
- **Dependência dura da tela Hoje da v3-02:** o bloco de clientes entra no Hoje da
  v3-02 (`docs/stories/v3-02-hoje-agenda-operacao.story.md:76`). Sem a v3-02, não
  há onde listar nem botão de WhatsApp.
- **Clarity pela API a confirmar:** sem token de API confirmado, o número não é
  exibido. Só o link e o rótulo honesto (`theo.md:68`).
- **Caminho do `VAULT` na VPS:** `apps/plataforma/src/lib/vault.ts:4` tem padrão
  Windows. Sem a variável, o pixel lê vazio sem erro e o número parece parado
  (`theo.md:113`). Setar `VAULT` na VPS.

## 10. Teste de ponta a ponta (um só)

Script novo `_scripts/qa/e2e-relatorio-mensal.mjs`, no padrão de
`_scripts/qa/e2e-demanda.mjs` (mesma leitura de `.env.local` em
`e2e-demanda.mjs:76`, mesmo `fail` em `e2e-demanda.mjs:26`, mesmo login em
`e2e-demanda.mjs:45`, mesmo `BASE` na porta 3100 em `e2e-demanda.mjs:22`, mesmo
Chrome local em `e2e-demanda.mjs:24` e o mesmo `puppeteer-core` em
`e2e-demanda.mjs:15`). Usa um cliente de teste e limpa o que criar.

Passos:

1. Lê `apps/plataforma/.env.local` (`VAULT`, `AGENCIA_USER`, `AGENCIA_PASS`) e
   alinha o `VAULT` do processo, como em `e2e-demanda.mjs:76`.
2. Cria um cliente de teste ativo no banco, pela mesma lib que a aplicação usa,
   com identificador único por `Date.now()`.
3. (a) Faz login em `POST /api/login` (`e2e-demanda.mjs:45`) e chama
   `POST /api/relatorio-mensal` com o cliente de teste. É a mesma função que o
   agendador usa (AC-01). Confere que a linha do mês entrou e que o `link_token`
   existe, sem imprimir o token completo.
4. (b) Abre `GET /r/<token>` sem cookie de sessão e confere que o dashboard
   renderiza os números vindos da fonte (pixel de `hits.json`
   (`apps/plataforma/src/lib/vault.ts:273`) e saúde do cliente). Confere o
   `noindex`.
5. (c) Chama `GET /r/<token-invalido>` e confere que responde 404, com a mesma
   página de um token inexistente, sem nome nem dado de cliente no corpo.
6. (d) Com `puppeteer-core` (`e2e-demanda.mjs:98`), injeta o cookie
   (`e2e-demanda.mjs:101`), abre o Hoje e confere que o cliente de teste aparece
   na lista com o link do relatório e o botão de WhatsApp com a mensagem e o link
   certos. Nada é enviado pela API do WhatsApp.
7. (e) Limpa o que criou: remove o cliente de teste, a linha de `relatorio` e os
   arquivos de teste. Nunca toca dado real do vault.

Regras do script: nunca imprime credenciais nem o token completo; sai com código
1 em qualquer falha; sucesso termina com `process.exit(0)`. O app precisa estar
na porta 3100.
