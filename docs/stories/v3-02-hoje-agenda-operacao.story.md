# Story v3-02: Navegação, Hoje, Agenda e Operação

## 1. Metadados

- **Título:** Navegação v3, Hoje, Agenda e Operação (3 visões da mesma demanda)
- **Entrega:** 2 da leva v3 (navegação nova + Hoje + Agenda + Operação)
- **Status:** pronta para o Theo (dev), desenho do Davi em paralelo
- **Dono:** Theo (dev) com Davi (UI) e Olga (operação)
- **Prazo:** após a VPS (30/09) estável, conforme ordem da ATA (seção 5)
- **Origem:** decisões do Everton de 29/09 (ATA seção 7, item 1) e hierarquia aprovada (ATA seção 3)

## 2. Objetivo único

Everton abre a plataforma, vê o dia inteiro numa tela (Hoje) e resolve o que
depende dele em um toque. O mesmo trabalho (a demanda) aparece em quadro, lista
e calendário na aba Operação, sem kanban separado. Uma demanda, várias visões.

Google Agenda fica de fora desta entrega: reuniões são criadas no próprio app
(ATA seção 7, item 3, e seção 2, tema "Reuniões no calendário").

## 3. Escopo

### Incluído nesta entrega

- Menu novo com 7 abas: Hoje (tela inicial), Agenda, Operação, Comercial,
  Clientes, Conteúdo, Resultados. Time vai para o rodapé (ATA seção 3, rodapé).
- "Hoje" é o "Início" atual renomeado. A tela mantém o placar real que já existe.
- Hoje como única tela do dia: fila de aprovações (1 toque), agenda do dia,
  alertas de cliente e placar. Celular primeiro.
- Agenda com visões dia, semana e mês. Reuniões criadas no app. Fonte: demandas
  com prazo, reuniões, posts e vencimentos.
- Operação absorve Time & Fila e Projetos. A mesma demanda em quadro, lista e
  calendário. O quadro usa os status reais da fonte única.
- Alertas de cliente (saúde do site): site fora do ar, certificado a vencer,
  formulário. Sempre com dado real ou estado vazio honesto.
- Aba Clientes mínima, somente leitura: lista os clientes de
  `vault/40 Comercial/Clientes/*.md` com nome e status, e estado vazio honesto.
  É uma ponte para não deixar item vazio no menu (regra do Everton). O card
  completo é da v3-04.
- Time no rodapé: painel ao vivo (avatares e "trabalhando") e logs, fora do
  caminho principal.
- Responsivo em 375px, 1280px e 1920px.

### NÃO incluído nesta entrega

- Banco SQLite e migração de dados (v3-03).
- Clientes e CRM: cards, saúde, métricas, financeiro, cofre e contrato (v3-04).
- Relatório mensal e botão de WhatsApp na lista de clientes (v3-05).
- Importar Google Agenda. Reuniões nascem no app.
- Embed do Clarity e Data Export API (não embutir, ATA seção 2, tema "Clarity").
- Studio Web Pro e qualquer banco do SWP (ATA seção 9).

## 4. O que o Everton vê na tela

### 4.1 Navegação (menu e rodapé)

Sidebar no desktop (>= 1024px) e barra inferior no celular, no padrão que já
existe em `apps/plataforma/src/components/dashboard.tsx:45` (NAV) e
`dashboard.tsx:54` (TABS). Hoje abre primeiro.

| # | Aba | O que abre | Origem |
|---|---|---|---|
| 1 | Hoje | Tela do dia | Início atual, renomeado |
| 2 | Agenda | Calendário dia/semana/mês | nova |
| 3 | Operação | Demanda em quadro/lista/calendário | Time & Fila + Projetos |
| 4 | Comercial | Pipeline | aba atual (`dashboard.tsx:829`) |
| 5 | Clientes | Lista somente leitura | nova, ponte para v3-04 |
| 6 | Conteúdo | Uploads e cases | aba atual (`dashboard.tsx:833`) |
| 7 | Resultados | Analytics | aba atual (`dashboard.tsx:835`) |

Rodapé: Time (personas, ao vivo, logs), cartão do usuário e sair da sessão.

Estado vazio honesto: nenhum item "em breve" no menu. Cada aba sempre tem uma
tela real ou um estado vazio claro.

### 4.2 Hoje (tela inicial, celular primeiro)

Cabeçalho: saudação por horário ("Bom dia, Everton"), data de hoje e o placar
resumido. Everton vê primeiro a fila de aprovações.

Ordem dos blocos:

1. **Aprovações pendentes.** Fila única de demandas em status `bloqueada` (o
   item não anda sem decisão do Everton). Cada linha: título, persona, prazo e
   o motivo registrado no Log. Um toque aprova (`atualizarStatus` para
   `concluida`) ou devolve para `fila`. Estado vazio: "Nada para aprovar agora."
2. **Agenda do dia.** Itens de hoje: reuniões criadas no app e demandas com
   `prazo` de hoje. Estado vazio: "Nada agendado para hoje. As demandas aparecem
   aqui quando o Orion registra uma tarefa ou reunião."
3. **Alertas de cliente.** Saúde do site: fora do ar, certificado a vencer,
   formulário com falha. Cada alerta mostra o dado real (hora da verificação e
   o valor medido). Estado vazio: "Sem alerta de cliente. Nenhum site verificado
   ainda." Nunca mostrar zero fabricado.
4. **Placar.** Número real de `data.placar` (`dashboard.tsx:557`). Sem
   faturamento, mostra "R$ 0, sem faturamento no mês".

Nota de escopo: a lista de clientes com botão de WhatsApp em 1 toque entra na
v3-05. Nesta entrega o Hoje não tem botão de WhatsApp.

### 4.3 Agenda (dia, semana, mês)

Cabeçalho fixo: título "Agenda", seletor Dia | Semana | Mês, botão "Hoje" e
botão "Nova reunião". Everton vê primeiro a visão Dia com a linha do horário
atual.

- **Dia:** uma coluna de horas, itens pelo horário, linha do "agora".
- **Semana:** sete colunas, itens em pílulas compactas.
- **Mês:** grade de semanas, com contagem por dia e pontos por tipo.

Tipos e origem do dado:

| Tipo | Fonte |
|---|---|
| Tarefa de persona | demandas com `prazo` preenchido (`lib/demandas.ts:25`) |
| Reunião | criada no app, guardada em `vault/SaaS/Agenda/Reunioes/<id>.md` |
| Post | conteúdo com data (quando existir) |
| Vencimento | prazo de cliente (quando existir) |

Estado vazio honesto por visão: "Nada agendado para hoje." Sem número inventado.

### 4.4 Operação (quadro, lista e calendário)

Cabeçalho: título "Operação", seletor Quadro | Lista | Calendário, busca e
botão "Nova demanda". As três visões leem o mesmo conjunto de
`listarDemandas()` (`lib/demandas.ts:132`). As contagens têm que bater entre as
visões.

- **Quadro:** colunas pelos status reais da fonte única: fila, em andamento,
  bloqueada, aguardando cliente, concluída, cancelada (`lib/demandas.ts:9`).
  Arrastar um cartão entre colunas chama `atualizarStatus`
  (`lib/demandas.ts:196`), que respeita a regra dura de não sobrescrever campos
  de execução (`lib/demandas.ts:192`). Estado vazio: "Nada aqui: crie a
  primeira demanda."
- **Lista:** linhas com título, persona, status, cliente e prazo, com filtro por
  status, persona e cliente. Estado vazio: "Nenhuma demanda: a agência está
  quieta" (texto já usado em `components/demandas.tsx:161`).
- **Calendário:** demandas pelo `prazo`, no mesmo componente de calendário da
  Agenda. Estado vazio: "Nada com prazo neste período."

O quadro antigo de `vault/01 Kanban.md` (escrito por `lib/vault.ts:355` e lido
em `lib/vault.ts:84`) sai do caminho principal. A aba "Projetos" deixa de
existir como lugar separado (`dashboard.tsx:687`).

### 4.5 Time no rodapé

O painel ao vivo que hoje fica em `dashboard.tsx:753` (bloco Time) e o
componente `<Demandas>` (`dashboard.tsx:831`) saem do fluxo das abas. O Time
vira um painel recolhido no rodapé: avatares, quem está trabalhando
(`estadoAgentes`, `lib/orquestra.ts:41`) e os logs. Estado vazio: "Ninguém
trabalhando agora."

## 5. Critérios de aceite

- **AC-01** O menu lista exatamente as 7 abas (Hoje, Agenda, Operação,
  Comercial, Clientes, Conteúdo, Resultados) e Time no rodapé. Não existe item
  "em breve" e não existem mais as abas "Time & Fila" nem "Projetos".
- **AC-02** Ao logar, Everton cai no Hoje (o Início atual, renomeado), com a
  saudação por horário. A aba Hoje é a primeira da navegação.
- **AC-03** O bloco de aprovações do Hoje lista demandas em status `bloqueada`
  (fonte `listarDemandas()`, `lib/demandas.ts:132`). Um toque aprova e o status
  vira `concluida` no arquivo (`lib/demandas.ts:196`); o item sai da fila. Com
  a fila vazia, mostra "Nada para aprovar agora."
- **AC-04** O bloco de agenda do Hoje mostra as reuniões de hoje e as demandas
  com `prazo` igual à data de hoje. Vazio, mostra o texto da seção 4.2, sem
  número fabricado.
- **AC-05** O bloco de alertas do Hoje mostra alerta real (fora do ar,
  certificado a vencer, formulário) com o valor medido e a hora da verificação.
  Sem verificação, mostra "Nenhum site verificado ainda." Nunca exibe zero
  fabricado.
- **AC-06** O placar do Hoje usa o valor real de `data.placar`
  (`dashboard.tsx:557`); sem faturamento, mostra "R$ 0, sem faturamento no mês".
- **AC-07** O Hoje não mostra lista de clientes com botão de WhatsApp nesta
  entrega (é da v3-05).
- **AC-08** A Agenda abre nas visões Dia, Semana e Mês, com seletor e botão
  "Hoje". Trocar de visão não recarrega a página inteira.
- **AC-09** Criar uma reunião no app a faz aparecer na Agenda, no dia e horário
  escolhidos. Nada é importado do Google Agenda.
- **AC-10** A mesma demanda aparece no quadro, na lista e no calendário da
  Operação, e as contagens das três visões batem (mesma fonte,
  `lib/demandas.ts:132`).
- **AC-11** No quadro, mover um cartão entre colunas grava o novo `status` no
  arquivo da demanda (`lib/demandas.ts:196`), e recarregar mantém a mudança.
- **AC-12** A lista da Operação filtra por status, persona e cliente, e mostra
  o estado vazio de `components/demandas.tsx:161` quando não há item.
- **AC-13** O calendário da Operação mostra as demandas pelo `prazo`; sem
  demanda no período, mostra "Nada com prazo neste período."
- **AC-14** O Time sai do caminho principal e aparece no rodapé com avatares,
  quem está trabalhando (`lib/orquestra.ts:41`) e logs; vazio, mostra "Ninguém
  trabalhando agora."
- **AC-15** Em 375px, 1280px e 1920px não há scroll horizontal, texto cortado
  nem sobreposição. No celular a navegação vira barra inferior com o restante
  em "Mais", e o Hoje aparece primeiro.
- **AC-16** Todo bloco sem dado mostra o estado vazio honesto da seção 4. Nenhum
  número é inventado nem zero fabricado.
- **AC-17** Nenhum texto visível usa travessão ou meia-risca; títulos e
  parágrafos evitam palavra órfã na última linha (`text-wrap: balance`).
- **AC-18** Não regressão: Comercial (pipeline), Resultados (analytics) e
  Conteúdo (arquivos) continuam funcionando, e a fonte única de demandas segue
  a mesma (`lib/demandas.ts`).

## 6. Tarefas técnicas em ordem

1. Renomear "Início" para "Hoje" e refazer NAV, TABS, NAV_GRUPOS e VIEW_META
   (`components/dashboard.tsx:45`, `:54`, `:61`, `:70`): 7 abas e Time no
   rodapé. Remover "Time & Fila" e "Projetos" da navegação.
2. Criar o componente Hoje com os quatro blocos da seção 4.2, lendo demandas
   de `/api/orquestra` (`app/api/orquestra/route.ts:30`) e o placar de
   `data.placar`.
3. Criar o componente Operação com as três visões sobre `listarDemandas()`.
   Quadro com os 6 status, arrastar chamando `atualizarStatus`
   (`lib/demandas.ts:196`).
4. Criar a lib de reuniões (`lib/reunioes.ts`, um markdown por reunião em
   `vault/SaaS/Agenda/Reunioes/<id>.md`, no padrão de `lib/demandas.ts:6`) e a
   rota `/api/agenda` (GET lista, POST cria).
5. Montar o calendário dia/semana/mês (componente único) e usá-lo na Agenda e
   na visão calendário da Operação.
6. Criar o verificador de saúde do site (`_scripts/saude-site.mjs`) que lê os
   clientes de `vault/40 Comercial/Clientes/*.md` e grava
   `vault/SaaS/Saude/<slug>.json` (`no_ar`, `certificado_dias`, `formulario`).
   Ler esse arquivo no bloco de alertas do Hoje.
7. Criar a aba Clientes mínima: ler `vault/40 Comercial/Clientes/*.md` e listar
   nome e status, com estado vazio honesto. Sem card, sem CRM.
8. Mover o Time para o rodapé (avatares, ao vivo, logs) e tirar o bloco Time e
   o `<Demandas>` do fluxo das abas (`dashboard.tsx:753`, `:831`).
9. Ajustar responsividade em 375px, 1280px e 1920px e revisar estados vazios.
10. Escrever o teste de ponta a ponta da seção 10.

## 7. Arquivos prováveis

- `apps/plataforma/src/components/dashboard.tsx` (nav, Hoje, Time no rodapé)
- `apps/plataforma/src/components/agenda.tsx` (novo)
- `apps/plataforma/src/components/operacao.tsx` (novo)
- `apps/plataforma/src/components/calendario.tsx` (novo, dia/semana/mês)
- `apps/plataforma/src/components/hoje.tsx` (novo)
- `apps/plataforma/src/lib/reunioes.ts` (novo)
- `apps/plataforma/src/lib/saude.ts` (novo, leitura dos alertas)
- `apps/plataforma/src/app/api/agenda/route.ts` (novo)
- `apps/plataforma/src/app/api/saude/route.ts` (novo, se o alerta vier por API)
- `_scripts/saude-site.mjs` (novo)
- `_scripts/qa/e2e-operacao.mjs` (novo, teste da seção 10)

## 8. Fora de escopo

- SQLite e o esquema de empresa/contato/oportunidade (v3-03).
- Card do cliente, CRM, cofre, contrato, financeiro (v3-04).
- Relatório mensal, link com token e botão de WhatsApp (v3-05).
- Google Agenda, Clarity embed/API e Studio Web Pro.
- Alterar `apps/site` ou fazer deploy.

## 9. Riscos

- **Estado de aprovação sem código próprio:** o enum tem `bloqueada`, mas não
  tem "aguardando Everton" (`lib/demandas.ts:9`). Esta entrega trata
  `bloqueada` como "espera decisão do Everton". A v3-03 deve criar o estado
  próprio no banco para não virar remendo.
- **Escrita concorrente:** persona e app tocam o mesmo arquivo de demanda. A
  regra dura de `lib/demandas.ts:192` só troca status, timestamps e Log, e
  precisa valer também no arrastar do quadro.
- **Quadro antigo:** converter os cartões de `vault/01 Kanban.md`
  (`lib/vault.ts:355`) em demandas é irreversível se apagar o arquivo antes de
  validar. Fazer backup antes.
- **Alertas quase vazios:** hoje só existe um cliente (Concept) e nenhuma
  verificação de saúde. Sem rodar `saude-site.mjs`, o bloco fica no estado vazio
  honesto, o que é esperado, não é falha.
- **Reuniões em arquivo:** até a v3-03, reuniões ficam em markdown. A migração
  para o banco precisa preservar id e data.
- **Celular primeiro:** arrastar cartão no quadro é ruim no toque. Na lista, a
  troca de status tem que funcionar por toque.
- **Caminho do vault:** `VAULT` tem padrão Windows em `lib/demandas.ts:6` e
  `lib/vault.ts:4`. Na VPS, sem a variável, a tela abre vazia sem erro.

## 10. Teste de ponta a ponta (um só)

Script novo `_scripts/qa/e2e-operacao.mjs`, no padrão de
`_scripts/qa/e2e-demanda.mjs` (mesmo login em `e2e-demanda.mjs:45`, mesmo
`BASE` na porta 3100 em `e2e-demanda.mjs:22`, mesmo Chrome local em
`e2e-demanda.mjs:24` e o mesmo `puppeteer-core` em `e2e-demanda.mjs:15`).

Passos:

1. Lê `apps/plataforma/.env.local` (`VAULT`, `AGENCIA_USER`, `AGENCIA_PASS`) e
   alinha o `VAULT` do processo, como em `e2e-demanda.mjs:76`.
2. Cria uma demanda de teste pela lib dos scripts
   (`_scripts/lib/demanda.mjs:112`), persona theo, status `fila`, `prazo` de
   hoje, título único com `Date.now()`.
3. Faz login em `POST /api/login` (`e2e-demanda.mjs:45`) e confirma na API que
   a demanda aparece em `GET /api/orquestra` (`app/api/orquestra/route.ts:30`).
4. Abre a tela com `puppeteer-core` (`e2e-demanda.mjs:98`), injeta o cookie
   (`e2e-demanda.mjs:101`), clica na aba "Operação" e confere o título na
   página. Repete na aba "Hoje" quando a demanda do dia estiver na agenda.
5. Muda o status para `em_andamento` (`_scripts/lib/demanda.mjs:140`) e confere
   a mudança no arquivo e na API.
6. Limpa a demanda de teste com `unlink` do arquivo
   (`_scripts/lib/demanda.mjs:18`), como em `e2e-demanda.mjs:127`.

Regras do script: nunca imprime credenciais nem token; sai com código 1 em
qualquer falha; sucesso termina com `process.exit(0)`. O app precisa estar na
porta 3100.

## 11. Aceite (status)

- [x] AC-01 · menu com as 7 abas (Hoje, Agenda, Operação, Comercial, Clientes, Conteúdo, Resultados) + Time no rodapé; sem "em breve", sem "Time & Fila" nem "Projetos".
- [x] AC-02 · ao logar cai no Hoje (view inicial "hoje") com saudação por horário; Hoje é a primeira aba.
- [x] AC-03 · aprovações listam `bloqueada`; um toque aprova (status `concluida` no arquivo via `atualizarStatus`) e devolve para `fila`; vazio "Nada para aprovar agora."
- [x] AC-04 · agenda do dia mostra reuniões de hoje e demandas com `prazo` de hoje; vazio com o texto da seção 4.2.
- [x] AC-05 · alertas mostram valor medido + hora da verificação; sem verificação, "Nenhum site verificado ainda." (nenhum zero fabricado).
- [x] AC-06 · placar usa `data.placar`; sem faturamento, "R$ 0, sem faturamento no mês".
- [x] AC-07 · Hoje sem lista de clientes com botão de WhatsApp (fica para a v3-05).
- [x] AC-08 · Agenda abre em Dia/Semana/Mês com seletor e botão "Hoje"; troca de visão não recarrega a página.
- [x] AC-09 · reunião criada no app aparece na Agenda no dia e horário escolhidos; nada importado do Google Agenda.
- [x] AC-10 · a mesma demanda aparece no quadro, lista e calendário da Operação (mesma fonte `listarDemandas()`); contagens batem.
- [x] AC-11 · arrastar cartão no quadro grava o novo `status` no arquivo (`atualizarStatus`) e recarregar mantém.
- [x] AC-12 · lista filtra por status, persona e cliente; vazio "Nenhuma demanda: a agência está quieta".
- [x] AC-13 · calendário da Operação mostra demandas por `prazo`; sem demanda no período, "Nada com prazo neste período."
- [x] AC-14 · Time sai do fluxo das abas e aparece no rodapé recolhível (avatares, trabalhando, logs); vazio "Ninguém trabalhando agora."
- [x] AC-15 · 375px/1280px/1920px sem scroll horizontal de página; no celular a navegação vira barra inferior com o restante em "Mais", Hoje primeiro (prints 375 e 1280 conferidos).
- [x] AC-16 · todo bloco sem dado mostra o estado vazio honesto da seção 4; nenhum número inventado.
- [x] AC-17 · nenhum texto visível usa travessão ou meia-risca; títulos/parágrafos com `text-balance`.
- [x] AC-18 · sem regressão: Comercial (pipeline), Resultados (analytics) e Conteúdo (arquivos) seguem funcionando; fonte única em `lib/demandas.ts`.
