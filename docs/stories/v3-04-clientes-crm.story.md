# Story v3-04: Clientes e CRM (mesmo modelo de empresa)

## 1. Metadados

- **Título:** Comercial e Clientes sobre o mesmo modelo de empresa, com card do cliente
- **Entrega:** 4 da leva v3 (CRM unificado, card de cliente, saúde, métricas e financeiro)
- **Status:** pronta para o Theo (dev), após a v3-03 (dependência dura)
- **Dono:** Theo (dev), com Davi (UI), Caio (comercial) e Fábio (financeiro)
- **Prazo:** após a v3-03 (banco) e a VPS (30/09) estáveis, conforme ordem da ATA (seção 5)
- **Origem:** decisões do Everton de 29/09 (ATA seções 2, 3, 5, 7, 8 e 9) e tarefa `docs/demandas/2026-09-29/28-lia-stories-v3.md:17`

## 2. Objetivo único

Everton fecha um lead no Comercial e vê o mesmo registro virar card em Clientes, sem
redigitar nada, e ao abrir o cliente sabe se o site está bem e se ele deve algo.

CRM aqui é o modelo de dados, não uma aba: Comercial e Clientes rodam sobre o **mesmo
modelo de empresa**, com os estágios lead, oportunidade e cliente (ATA seção 2, tema CRM).
O modelo vem do banco da **v3-03** (`docs/stories/v3-03-banco-da-plataforma.story.md:85`,
tabela `empresa` com `estagio_crm`). Sem a v3-03, esta entrega não sobe.

## 3. Escopo

### Incluído nesta entrega

- Comercial e Clientes lendo a mesma tabela `empresa` da v3-03, com o estágio `lead`,
  `oportunidade` ou `cliente` (`docs/stories/v3-03-banco-da-plataforma.story.md:94`).
- Fechar um lead pelo caminho da aplicação o move para `cliente` no banco, e o card nasce
  em Clientes com o mesmo `empresa.id`, sem cadastro novo.
- Comercial com o funil atual preservado: os 6 estágios de `lib/vault.ts:102` e a conversão
  de `lib/conversao.ts:36`, sem recriar aba separada (ATA seção 2, tema CRM).
- Clientes com uma grade de cards e uma gaveta por cliente:
  - saúde do site (no ar, formulário, certificado, velocidade) com alerta;
  - métricas do pixel (`vault/SaaS/Rastreamento/hits.json`);
  - Clarity por link, nunca embutido;
  - financeiro (valor do projeto, recorrência e MRR, cobranças InfinitePay, vencimentos e histórico);
  - briefing por link;
  - cofre de senhas do cliente (criptografado, da v3-03);
  - contrato rápido.
- Studio Web Pro reescrito no próprio código e dados da plataforma só em: carteira de
  clientes, briefing por link, cofre de senhas e contrato rápido (ATA seção 9).
- Responsivo em 375px, 1280px e 1920px, com estados vazios honestos.

### NÃO incluído nesta entrega

- Trazer o Studio Web Pro para dentro: aulas, lives, biblioteca, dicas, códigos, admin,
  billing Stripe, prospector do SWP e geração de copy com OpenAI (ATA seção 9).
- Usar qualquer banco, chave, tabela ou rota do SWP (Supabase, Stripe, OpenAI).
- Embed do Clarity e Data Export API. Nesta entrega o Clarity é só link (ATA seção 2).
- Relatório mensal, link com token e botão de WhatsApp (v3-05).
- Google Agenda.
- Alterar `apps/site` ou fazer deploy.

## 4. O que o Everton vê na tela

### 4.1 Comercial (funil por cima do modelo de empresa)

Cabeçalho: título "Comercial", filtro por estágio, busca e botão "+ novo lead". Everton vê
primeiro o funil com a contagem por estágio e os follow-ups de hoje no topo (davi.md:43).
O board mantém os 6 estágios de `apps/plataforma/src/components/pipeline.tsx:40` e a faixa de
conversão de `apps/plataforma/src/lib/conversao.ts:36`. Cada cartão traz nome e empresa,
estágio, valor, próximo follow-up e último contato, com as ações mover estágio, registrar
contato e agendar follow-up.

Diferença desta entrega: o funil lê o **mesmo registro de empresa** do banco. Quem está em
`lead` ou `oportunidade` aparece aqui; quem virou `cliente` sai do funil e passa a viver em
Clientes. Nada de duas listas para a mesma pessoa.

Estado vazio honesto: "Sem leads no funil. Cadastre o primeiro lead para começar." (davi.md:43).
Nunca um número fabricado.

### 4.2 Clientes (grade de cards)

Cabeçalho: título "Clientes", busca e botão "+ novo cliente". Everton vê primeiro a grade de
cards, com os ativos na frente, e uma faixa de métricas (clientes ativos, novos no mês).
Cada card traz nome, segmento, status, data de fechamento, valor do projeto, recorrência e o
site com cliques e acessos. Ações do card: abrir site, ver métricas, abrir o cofre de senhas,
ver projetos, briefing e contrato (base davi.md:47).

Estado vazio honesto: "Nenhum cliente cadastrado ainda." (davi.md:47). Nenhum número inventado.

### 4.3 Gaveta do cliente (card aberto)

A gaveta abre com o nome, o estágio `cliente` e o site. Blocos, na ordem:

1. **Saúde do site.** Quatro cheques lado a lado: no ar, formulário funcionando, certificado
   (dias para vencer) e velocidade. Quando algo está fora do ar, com falha de formulário ou
   certificado a vencer, o bloco mostra alerta com o valor medido e a hora da verificação.
   A fonte é o arquivo por cliente da v3-02
   (`docs/stories/v3-02-hoje-agenda-operacao.story.md:220`, `vault/SaaS/Saude/<slug>.json`,
   com `no_ar`, `certificado_dias` e `formulario`); esta entrega acrescenta `velocidade_ms`.
   Estado vazio honesto: "Site ainda não verificado."; campo sem medida mostra "sem medida
   ainda", nunca zero fabricado.
2. **Métricas do pixel.** Pageviews do cliente, lendo `vault/SaaS/Rastreamento/hits.json`
   por `rastreamentoData` (`apps/plataforma/src/lib/vault.ts:273`), gravado por
   `apps/plataforma/src/app/api/t/route.ts:19`. O número oficial da tela é o pixel. Abaixo,
   o Clarity: um botão que abre o painel em nova aba e o rótulo honesto de que os números do
   Clarity dependem de API ainda a confirmar (`docs/reuniao/2026-09-29/theo.md:68`). Nunca
   iframe. Estado vazio: "Nenhum hit ainda: instale o pixel e visite o site"
   (`apps/plataforma/src/components/rastreamento.tsx:78`).
3. **Financeiro.** Valor do projeto, recorrência e MRR, lista de cobranças InfinitePay
   (status pago ou pendente, com data), próximos vencimentos (30 dias) e histórico do
   cliente. Quando valor do projeto e cobranças pagas divergem, o bloco sinaliza a
   divergência. Estado vazio: "Sem cobrança registrada para este cliente."
4. **Briefing por link.** Link único do cliente, botão de copiar e o status (aguardando
   resposta ou respondido). O cliente responde por esse link. Estado vazio: "Nenhum briefing
   ainda." (base davi.md:51).
5. **Cofre de senhas.** Lista de credenciais pelo rótulo (ex.: WordPress Admin, cPanel),
   com a senha revelada só por ação explícita. Fonte: tabela `credencial` da v3-03, cifrada.
   Estado vazio: "Sem credenciais cadastradas" (v3-03 AC-16).
6. **Contrato rápido.** Geração do contrato a partir dos dados do cliente e lista dos
   contratos dele, no modelo do Studio Web Pro (`PLATFORM.md:40`). Estado vazio: "Nenhum
   contrato ainda."

## 5. Critérios de aceite

- **AC-01 (mesmo modelo):** Comercial e Clientes leem a mesma tabela `empresa` do banco da
  v3-03 (`docs/stories/v3-03-banco-da-plataforma.story.md:85`). Clientes lista `empresa` com
  `estagio_crm = 'cliente'`; Comercial lista `estagio_crm IN ('lead','oportunidade')`.
  Conferível por `GET /api/clientes` e `GET /api/comercial`.
- **AC-02 (virar cliente sem redigitar):** mover um lead ao estágio 5 (Entrega) pelo caminho
  da aplicação grava `empresa.estagio_crm = 'cliente'` e o card aparece em Clientes com o
  mesmo `empresa.id`. Nenhum registro de empresa novo é criado nessa passagem.
- **AC-03 (sem duplicação):** a mesma `empresa.id` não aparece ao mesmo tempo em Comercial e
  em Clientes. Depois de virar cliente, ela some do funil de Comercial e aparece só em
  Clientes (resolve a falta de chave de caio.md:56).
- **AC-04 (estágios):** `empresa.estagio_crm` só aceita `lead`, `oportunidade` ou `cliente`
  (v3-03 AC-03), e o app mapeia estágio 1 do funil para `oportunidade` e estágio 5 para
  `cliente`. Inserir outro valor falha.
- **AC-05 (funil preservado):** o Comercial mantém os 6 estágios de
  `apps/plataforma/src/components/pipeline.tsx:40` e a conversão de
  `apps/plataforma/src/lib/conversao.ts:36`. Nada foi recriado como aba nova.
- **AC-06 (saúde do site):** a gaveta mostra no ar, formulário, certificado e velocidade,
  por cliente, e mostra alerta quando o site está fora do ar, o formulário falha ou o
  certificado está a vencer. Campo sem medida mostra "sem medida ainda", nunca zero.
- **AC-07 (pixel oficial):** a gaveta mostra os pageviews do pixel do cliente, de
  `apps/plataforma/src/lib/vault.ts:273` (gravado por
  `apps/plataforma/src/app/api/t/route.ts:19`). Esse é o número oficial da tela. Sem hit,
  mostra o estado vazio de `apps/plataforma/src/components/rastreamento.tsx:78`.
- **AC-08 (Clarity por link):** a gaveta oferece um botão que abre o painel do Clarity em
  nova aba e NUNCA um iframe. Nenhum número do Clarity é exibido como embutido; sem API
  confirmada, mostra o rótulo honesto "números do Clarity: pendente de API" (ATA seção 2).
- **AC-09 (valor e recorrência):** a gaveta mostra o valor do projeto e a recorrência ou MRR
  do cliente, migrados do frontmatter (`40 Comercial/Clientes/Concept Implantes Dentários.md:9`
  e `:10`). Sem recorrência, mostra "sem recorrência ainda", não um R$ 0 fabricado.
- **AC-10 (cobranças InfinitePay):** a gaveta lista as cobranças do cliente com status (pago
  ou pendente) e data, os próximos vencimentos (30 dias) e o histórico. Isso exige o campo
  `cliente` no tipo `Registro` (`apps/plataforma/src/lib/infinitepay.ts:15`) gravado por
  `criarLink` (`apps/plataforma/src/lib/infinitepay.ts:69`), conforme fabio.md:25. Sem
  cobrança, estado vazio honesto.
- **AC-11 (divergência sinalizada):** quando o `valor-projeto` e a soma das cobranças pagas
  divergem, a gaveta sinaliza a divergência em vez de esconder (fabio.md:35). Conferível com
  um cliente de valor 1.997 e uma cobrança paga de 1.000, que mostra o alerta.
- **AC-12 (briefing por link):** a gaveta cria e mostra um link único de briefing por cliente
  e o status (aguardando resposta ou respondido), usando a tabela `briefing` da v3-03
  (`docs/stories/v3-03-banco-da-plataforma.story.md:167`). Sem briefing, estado vazio honesto.
- **AC-13 (cofre):** a gaveta lista as credenciais do cliente pelo rótulo e revela a senha só
  por ação explícita. A senha nunca é renderizada em markdown, nunca vai para log e o arquivo
  do banco não a guarda em claro (v3-03 AC-09). Sem credencial, "sem credenciais cadastradas".
- **AC-14 (contrato rápido):** a gaveta gera um contrato a partir dos dados do cliente e lista
  os contratos dele, no modelo de `PLATFORM.md:40` e
  `archive/referencias/studiowebpro/supabase/schema.sql:564`. Sem contrato, "Nenhum contrato
  ainda."
- **AC-15 (SWP separado):** nenhuma tabela, chave ou rota do Studio Web Pro (Supabase, Stripe,
  OpenAI) é usada. A plataforma só reescreve carteira, briefing, cofre e contrato no seu
  próprio banco (ATA seção 9). Conferível por busca no código e no banco.
- **AC-16 (responsivo):** em 375px, 1280px e 1920px a grade de cards e a gaveta ficam
  íntegras, sem scroll horizontal, texto cortado ou sobreposição. Em 375px os blocos da
  gaveta empilham em uma coluna.
- **AC-17 (estados vazios honestos):** todo bloco sem dado mostra o estado vazio da seção 4.
  Nenhum número é inventado nem zero fabricado; campo sem medida não vira 0.
- **AC-18 (sem "em breve"):** nenhum item "em breve" entra no menu. Comercial e Clientes abrem
  telas reais.
- **AC-19 (sem travessão e sem viúvas):** nenhum texto visível usa travessão nem meia-risca;
  títulos e parágrafos evitam palavra órfã na última linha (`text-wrap: balance`).
- **AC-20 (não regressão):** arrastar cartão, aceitar e registrar desfecho no pipeline seguem
  funcionando; Resultados e a fonte única de demandas seguem iguais.
- **AC-21 (teste):** o teste de ponta a ponta da seção 10 existe e passa.

## 6. Tarefas técnicas em ordem

1. Consumir o banco da v3-03: usar `db.ts`, `empresas.ts` e `cofre.ts`
   (`docs/stories/v3-03-banco-da-plataforma.story.md:242`). Não criar modelo paralelo.
   Criar `lib/clientes.ts` para ler `empresa` com `estagio_crm = 'cliente'` e montar o card.
2. Ligar o Comercial ao banco: em `pipelineOp` (`apps/plataforma/src/lib/vault.ts:166`), ao
   mover para o estágio 1 gravar `estagio_crm = 'oportunidade'` e ao mover para o estágio 5
   gravar `estagio_crm = 'cliente'`, via `mudarEstagioCrm` da v3-03. Manter a escrita da
   ficha em `40 Comercial/Leads/` (`apps/plataforma/src/lib/vault.ts:203`) e a leitura do
   vault (`apps/plataforma/src/lib/vault.ts:113`).
3. Criar as rotas autenticadas `/api/clientes` (lista e detalhe) e `/api/comercial` sobre o
   modelo de empresa, reusando `isAuthed` (`apps/plataforma/src/app/api/financas/route.ts:6`).
4. Saúde do site: acrescentar `velocidade_ms` ao `vault/SaaS/Saude/<slug>.json` da v3-02 e
   ler no card; montar o alerta por fora do ar, formulário e certificado a vencer.
5. Métricas do pixel: reusar `rastreamentoData` (`apps/plataforma/src/lib/vault.ts:273`) e
   cruzar os hits pelo `site` da empresa; exibir pageviews.
6. Clarity por link: botão que abre o painel em nova aba; nenhum iframe; reservar a área dos
   números da Data Export API (a confirmar, theo.md:68) com o rótulo honesto.
7. Financeiro: adicionar o campo `cliente` ao tipo `Registro`
   (`apps/plataforma/src/lib/infinitepay.ts:15`) e gravá-lo em `criarLink`
   (`apps/plataforma/src/lib/infinitepay.ts:69`); agregar por cliente com `lerHistorico`
   (`apps/plataforma/src/lib/infinitepay.ts:36`); sinalizar a divergência do AC-11.
8. Briefing por link: rota que cria a linha em `briefing` (com `token`) por empresa e expõe o
   link; página pública que recebe a resposta.
9. Cofre: reusar `cofre.ts` da v3-03; listar por `label` e revelar a senha só por ação
   explícita; nunca em markdown nem em log.
10. Contrato rápido: gerar o contrato do cliente na tabela `contrato` da v3-03 e listá-lo.
11. UI: componente Clientes (grade mais gaveta) no padrão do DS e ajuste do Comercial para o
    modelo de empresa; estados vazios da seção 4.
12. Garantir que nada do SWP é acoplado (AC-15).
13. Ajustar responsividade em 375px, 1280px e 1920px.
14. Escrever o teste de ponta a ponta da seção 10.

## 7. Arquivos prováveis

- `apps/plataforma/src/lib/clientes.ts` (novo, leitura do card)
- `apps/plataforma/src/lib/empresas.ts` (v3-03, reusado e estendido)
- `apps/plataforma/src/lib/saude.ts` (v3-02, leitura da saúde)
- `apps/plataforma/src/app/api/clientes/route.ts` (novo)
- `apps/plataforma/src/app/api/comercial/route.ts` (novo)
- `apps/plataforma/src/app/api/briefing/route.ts` (novo)
- `apps/plataforma/src/app/b/[token]/page.tsx` (novo, resposta pública do briefing)
- `apps/plataforma/src/components/clientes.tsx` (novo, grade e gaveta)
- `apps/plataforma/src/components/pipeline.tsx` (ajuste para o modelo de empresa)
- `apps/plataforma/src/lib/vault.ts` (registro do estágio no banco)
- `apps/plataforma/src/lib/infinitepay.ts` (campo `cliente` no `Registro`)
- `apps/plataforma/src/components/dashboard.tsx` (nav: Comercial e Clientes reais)
- `_scripts/saude-site.mjs` (v3-02, campo de velocidade)
- `_scripts/qa/e2e-clientes-crm.mjs` (novo, teste da seção 10)

## 8. Fora de escopo

- Aulas, lives, biblioteca, dicas, códigos, admin, billing Stripe, prospector do SWP e
  geração de copy com OpenAI (ATA seção 9).
- Banco, chaves e rotas do SWP (Supabase, Stripe, OpenAI).
- Relatório mensal, link com token e botão de WhatsApp (v3-05).
- Embed do Clarity e Data Export API (só link nesta entrega).
- Google Agenda, `apps/site` e deploy.

## 9. Riscos

- **Duplicação de lead, cliente e projeto sem chave** (caio.md:56): três cadastros para a
  mesma pessoa. Mitigar com `empresa.id` como chave única; o card nunca redigita.
- **Métrica que mente por campo vazio** (`contato-em` e `respondeu-em` só nascem nas
  passagens 2 e 3, `apps/plataforma/src/lib/vault.ts:200`): contato fora do quadro não conta.
  Mitigar mostrando a origem e a data do dado; sem dado, estado vazio honesto.
- **Divergência entre valor-projeto e cobrança paga** (fabio.md:35): o card fica errado se os
  dois não batem. Mitigar com o alerta do AC-11.
- **Dado sensível do cofre (LGPD)** (theo.md:110): senha de cliente é dado sensível. Mitigar
  com a cifra da v3-03, revelação só por ação explícita e nunca em markdown nem em log.
- **Dependência da v3-03 (dependência dura):** sem o banco, Comercial e Clientes não sobem.
  Só iniciar esta entrega com a v3-03 migrada e a VPS estável (ATA seção 5).
- **Clarity por API a confirmar** (theo.md:68): não prometer número embutido. Nesta entrega
  só o link para o painel.
- **Caminho do vault e do banco na VPS** (`apps/plataforma/src/lib/vault.ts:4`): sem `VAULT`
  e `AGENCIA_DB`, a tela abre vazia sem erro. Setar as variáveis no servidor.

## 10. Teste de ponta a ponta (um só)

Script novo `_scripts/qa/e2e-clientes-crm.mjs`, no padrão de
`_scripts/qa/e2e-demanda.mjs` (mesma leitura de `.env.local` em `e2e-demanda.mjs:76`, mesmo
`fail` em `e2e-demanda.mjs:26`, mesmo login em `e2e-demanda.mjs:45`, mesmo `BASE` na porta
3100 em `e2e-demanda.mjs:22`, mesmo Chrome local em `e2e-demanda.mjs:24` e o mesmo
`puppeteer-core` em `e2e-demanda.mjs:15`).

Passos:

1. Lê `apps/plataforma/.env.local` (`VAULT`, `AGENCIA_USER`, `AGENCIA_PASS`, `AGENCIA_DB`,
   `AGENCIA_COFRE_KEY`) e aponta `AGENCIA_DB` para um banco temporário, nunca o banco real,
   como em `e2e-demanda.mjs:76` alinha o `VAULT`.
2. (a) Cria uma empresa de teste no banco da v3-03 no estágio `lead`, pela mesma lib que a
   aplicação usa, com título único por `Date.now()`.
3. (b) Move a empresa para `cliente` pelo **mesmo caminho da aplicação** (a ação que o
   cartão do pipeline chama), e confirma que o `empresa.id` não mudou e que
   `estagio_crm = 'cliente'`.
4. (c) Faz login na API local (`e2e-demanda.mjs:45`) e confirma que a empresa aparece como
   card em `GET /api/clientes` e NÃO aparece duplicada em `GET /api/comercial`.
5. (d) Abre a tela com `puppeteer-core` (`e2e-demanda.mjs:98`), injeta o cookie
   (`e2e-demanda.mjs:101`), clica na aba "Clientes", abre o card da empresa de teste e confere
   os blocos de saúde do site, métricas, financeiro e cofre, inclusive o estado vazio honesto
   quando não houver dado.
6. (e) Limpa o que criou: remove a empresa de teste e as linhas dependentes do banco
   temporário. Nunca toca o banco real nem o vault.

Regras do script: nunca imprime credenciais, chave nem senha; usa banco temporário; sai com
código 1 em qualquer falha; sucesso termina com `process.exit(0)`. O app precisa estar na
porta 3100.
