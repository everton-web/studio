# Story v3-03: Banco da plataforma

## 1. Metadados

- **Título:** Banco próprio da plataforma (SQLite), esquema de cliente e migração das fichas
- **Entrega:** 3 da leva v3 (banco, migração e cofre criptografado)
- **Status:** pronta para o Theo (dev), após a VPS estável
- **Dono:** Theo (dev), com Lia (contrato de dados) e Orion (ordem)
- **Prazo:** após a VPS (30/09) estável, conforme ordem da ATA (seção 5)
- **Origem:** decisão do Everton de 29/09 (ATA seção 9) e tarefa `docs/demandas/2026-09-29/28-lia-stories-v3.md:16`

## 2. Objetivo único

Everton passa a ter um banco próprio da plataforma (SQLite, um arquivo, no
próprio servidor) onde lead, cliente, projeto e credencial deixam de viver em
markdown solto e passam a ter relações e segurança. Uma única chave liga
empresa, projeto e cliente, coisa que hoje não existe (caio.md:17).

O vault continua sendo a fonte de conhecimento, documentos e demandas. Nada de
documento nem de demanda migra para o banco. O Studio Web Pro é um microsaas
separado e a plataforma NÃO usa o banco dele, nem Supabase, nem Stripe, nem o
conteúdo de infoproduto (ATA seção 9).

## 3. Escopo

### Incluído nesta entrega

- Um arquivo SQLite só, aberto por `AGENCIA_DB`, fora do git.
- Esquema mínimo com empresa, contato, oportunidade, projeto, contrato,
  credencial, briefing e relatorio (campo a campo na seção 5).
- Empresa como objeto central, com estágio `lead` para `oportunidade` para
  `cliente`, o CRM por baixo de Comercial e Clientes (ATA seção 2, tema CRM).
- Migração de uma vez, idempotente, das fichas do vault, sem apagar nem alterar
  arquivo nenhum do vault, com relatório de quantos registros entraram.
- Cofre por cliente com senha cifrada (chave só em variável de ambiente).
- Backup diário do arquivo, com rotação, fora do git.
- Tabela relatorio com histórico por cliente e por mês (base da v3-05).

### NÃO incluído nesta entrega

- Trazer o banco do Studio Web Pro, Supabase, Stripe, OpenAI ou FTP Hostgator.
- Aulas, lives, biblioteca, dicas, códigos, admin e billing.
- Migrar documento ou demanda para o banco. Demandas seguem em
  `vault/SaaS/Agentes/Demandas/` (`apps/plataforma/src/lib/demandas.ts:7`).
- Tela de card de cliente, CRM navegável, financeiro e contrato visual (v3-04).
- Geração do relatório mensal e link com token (v3-05). Aqui só nasce a tabela.
- Importar credenciais do SWP: o cofre nasce vazio.

## 4. O que o Everton vê na tela

Esta entrega é de banco, então é pouca tela. O Everton não vê item novo no menu
(as 7 abas da v3-02 continuam) e não vê nada "em breve".

O único artefato visível é o **relatório da migração**: um resumo no terminal e
um arquivo JSON com quantos registros entraram por tabela e por fonte, com data.
Fora isso, o que ele vê é o que **não pode quebrar** na migração:

- Hoje, Agenda, Operação, Clientes, Comercial, Conteúdo e Resultados seguem
  abrindo e funcionando como na v3-02.
- O pipeline Comercial continua lendo `40 Comercial/Leads/*.md`
  (`apps/plataforma/src/lib/vault.ts:113`). O banco é espelho, não substitui a
  leitura do vault nesta entrega.
- As demandas continuam em `vault/SaaS/Agentes/Demandas/`
  (`apps/plataforma/src/lib/demandas.ts:7`).
- O financeiro e os links InfinitePay (`apps/plataforma/src/lib/infinitepay.ts`)
  seguem iguais.

Sem tela nova, o responsivo aqui é não regressão: em 375px, 1280px e 1920px as
telas existentes continuam sem scroll horizontal, sem texto cortado e sem
sobreposição. O relatório da migração é texto puro.

Estado vazio honesto: nenhuma contagem é fabricada. Cofre sem registro mostra
"sem credenciais cadastradas"; tabela sem linha conta 0 real.

## 5. Esquema mínimo, campo a campo

Tipos do SQLite (afinidade TEXT, INTEGER, REAL). A chave que hoje não existe
ligando empresa, projeto e cliente é `empresa.id` (o mesmo slug do arquivo de
lead, `lib/vault.ts:128`). Toda tabela de relação aponta para ela por
`empresa_id`.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE empresa (
  id            TEXT PRIMARY KEY,           -- slug estável; hoje o nome do arquivo (lib/vault.ts:128)
  nome          TEXT NOT NULL,
  segmento      TEXT,
  cidade        TEXT,
  site          TEXT,
  nota_google   REAL,
  avaliacoes    INTEGER,
  categoria     TEXT,                       -- maps, site, indicacao, saas, whatsapp (api/leads/route.ts:64)
  estagio_crm   TEXT NOT NULL CHECK (estagio_crm IN ('lead','oportunidade','cliente')),
  estagio_funil INTEGER,                    -- 0..5 copiado do frontmatter (lib/vault.ts:102)
  status        TEXT,                       -- ativo, arquivado, entregue (lib/vault.ts:140)
  origem        TEXT,                       -- lead, cliente, projeto, analise
  criado_em     TEXT,
  atualizado_em TEXT
);

CREATE TABLE contato (
  id         TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  nome       TEXT,
  whatsapp   TEXT,
  email      TEXT,
  criado_em  TEXT
);
CREATE INDEX ix_contato_empresa ON contato(empresa_id);

CREATE TABLE oportunidade (
  id            TEXT PRIMARY KEY,
  empresa_id    TEXT NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  valor         REAL,
  probabilidade INTEGER,                    -- 0..100
  data_prevista TEXT,                       -- YYYY-MM-DD
  dono          TEXT,
  criado_em     TEXT
);
CREATE INDEX ix_oportunidade_empresa ON oportunidade(empresa_id);

CREATE TABLE projeto (
  id           TEXT PRIMARY KEY,
  empresa_id   TEXT REFERENCES empresa(id) ON DELETE SET NULL,  -- nulo = projeto interno
  nome         TEXT NOT NULL,
  interno      INTEGER NOT NULL DEFAULT 0,
  etapa        TEXT,
  status       TEXT,
  data_entrega TEXT,
  url_producao TEXT,
  url_staging  TEXT,
  repositorio  TEXT,
  checklist_qa TEXT,
  criado_em    TEXT
);
CREATE INDEX ix_projeto_empresa ON projeto(empresa_id);

CREATE TABLE contrato (
  id             TEXT PRIMARY KEY,
  empresa_id     TEXT NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  valor          REAL,
  tipo_pagamento TEXT,
  parcelas       INTEGER,
  inicio         TEXT,
  duracao_meses  INTEGER,
  arquivo        TEXT,
  criado_em      TEXT
);
CREATE INDEX ix_contrato_empresa ON contrato(empresa_id);

CREATE TABLE credencial (
  id            TEXT PRIMARY KEY,
  empresa_id    TEXT NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,              -- ex: "WordPress Admin", "cPanel" (schema.sql:89)
  url           TEXT,
  usuario       TEXT,
  senha_cifrada TEXT,                       -- SÓ texto cifrado; nunca a senha em claro
  iv            TEXT,                       -- vetor de inicialização do registro
  tag           TEXT,                       -- tag de autenticação do registro
  notas         TEXT,
  criado_em     TEXT,
  atualizado_em TEXT
);
CREATE INDEX ix_credencial_empresa ON credencial(empresa_id);

CREATE TABLE briefing (
  id          TEXT PRIMARY KEY,
  empresa_id  TEXT REFERENCES empresa(id) ON DELETE SET NULL,
  token       TEXT UNIQUE,                  -- token público (schema.sql:117)
  tipo_pagina TEXT,
  respostas   TEXT,                         -- JSON (schema.sql:123)
  enviado_em  TEXT,
  criado_em   TEXT
);

CREATE TABLE relatorio (
  id         TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  mes        TEXT NOT NULL,                 -- YYYY-MM
  conteudo   TEXT,                          -- JSON
  link_token TEXT UNIQUE,
  gerado_em  TEXT,
  UNIQUE (empresa_id, mes)
);
```

## 6. Critérios de aceite

- **AC-01** Existe um único arquivo SQLite no caminho de `AGENCIA_DB` e nenhuma
  tabela do Studio Web Pro (nada de `clients`, `contracts`, `prospector_leads`
  do SWP, `archive/referencias/studiowebpro/supabase/schema.sql`). O app não
  escreve em Supabase, Stripe nem OpenAI.
- **AC-02** As 8 tabelas da seção 5 existem com os campos, tipos e chaves
  definidos. Conferível com `PRAGMA table_info` e `PRAGMA foreign_key_list`.
- **AC-03** `empresa.estagio_crm` aceita só `lead`, `oportunidade` ou `cliente`;
  inserir outro valor falha por `CHECK`.
- **AC-04** Toda tabela de relação (contato, oportunidade, projeto, contrato,
  credencial, briefing, relatorio) liga a empresa por `empresa_id`, e é essa
  chave que amarra empresa, projeto e cliente, hoje inexistente (caio.md:17).
- **AC-05** A migração é idempotente: rodar duas vezes seguidas resulta na
  mesma contagem por tabela, sem duplicar empresa, contato ou projeto.
- **AC-06** A migração não apaga nem altera arquivo do vault: o hash de todos os
  arquivos lidos em `40 Comercial/Leads/`, `40 Comercial/Clientes/`,
  `40 Comercial/Propostas/` e `30 Projetos/` é igual antes e depois.
- **AC-07** O relatório da migração informa quantos registros entraram por
  tabela e por fonte, com data, e fica registrado em arquivo.
- **AC-08** As contagens do relatório batem com a fonte real: o número de
  empresas de origem `lead` é igual ao número de arquivos `40 Comercial/Leads/*.md`
  existentes na execução (16 hoje); o de origem `cliente` é igual ao número de
  `40 Comercial/Clientes/*.md` (2 hoje). `40 Comercial/Propostas/` está vazia e
  entra com 0 registro.
- **AC-09** Cofre: ao gravar uma credencial, o arquivo do banco NÃO contém a
  senha em texto puro. Uma busca pelo valor no binário não encontra o segredo; o
  banco guarda só `senha_cifrada`, `iv` e `tag`.
- **AC-10** A leitura da credencial pela aplicação devolve a senha correta,
  provando que a cifra é reversível com a chave do ambiente.
- **AC-11** A chave do cofre vem só de variável de ambiente
  (`AGENCIA_COFRE_KEY`), nunca fica no banco e não aparece em arquivo
  versionado. Busca no repositório e no banco não encontra a chave.
- **AC-12** O backup diário gera uma cópia com data no nome
  (`plataforma-AAAA-MM-DD.sqlite`) em pasta fora do git; rodar duas vezes no
  mesmo dia não perde a cópia anterior e a rotação mantém os últimos N arquivos.
- **AC-13** A tabela relatorio tem chave única `(empresa_id, mes)`: reinserir o
  mesmo mês atualiza a linha, não duplica.
- **AC-14** Nenhum documento nem demanda entra no banco. Nenhuma tabela recebe
  conteúdo de `vault/SaaS/Agentes/Demandas/` nem de documento do vault.
- **AC-15** Sem tela nova. Em 375px, 1280px e 1920px as telas existentes seguem
  íntegras, sem scroll horizontal, texto cortado ou sobreposição.
- **AC-16** Estado vazio honesto: a leitura do cofre sem registro devolve lista vazia; qualquer contagem vazia mostra 0 real, nunca número fabricado.
- **AC-17** Nenhum texto visível usa travessão ou meia-risca, e os títulos não
  deixam palavra órfã na última linha.
- **AC-18** Nenhum item "em breve" entra no menu. Esta entrega não adiciona item
  ao menu.
- **AC-19** Antes de migrar, o script cria uma cópia do banco. A migração só
  grava no banco; não é irreversível pelos dados do vault, que permanecem.
- **AC-20** O teste de ponta a ponta da seção 11 existe e passa.

## 7. Tarefas técnicas em ordem

1. Definir o arquivo e o acesso: criar `apps/plataforma/src/lib/db.ts` abrindo
   `AGENCIA_DB`, com a pasta `apps/plataforma/data/` no `.gitignore`. Adicionar a
   dependência de SQLite (hoje `apps/plataforma/package.json:11` não tem
   nenhuma):
   usar `node:sqlite` se a versão de Node do servidor suportar, senão
   `better-sqlite3`.
2. Criar `apps/plataforma/src/lib/schema.sql` com as 8 tabelas da seção 5, os
   `CHECK`, as chaves estrangeiras e os índices. Aplicar na primeira abertura,
   em `db.ts`.
3. Criar `apps/plataforma/src/lib/cofre.ts`: cifra AES-256-GCM com chave de
   `AGENCIA_COFRE_KEY`; `gravarCredencial` e `lerCredencial`. Nunca loga segredo
   e nunca escreve em markdown. Motivo de segurança na seção 10 (LGPD, art. 46).
4. Criar `apps/plataforma/src/lib/empresas.ts` com o CRUD mínimo por
   `empresa_id`: criar, ler, listar e mudar `estagio_crm`.
5. Criar `_scripts/db/migrar-vault.mjs`: lê `40 Comercial/Leads/*.md`,
   `40 Comercial/Clientes/*.md`, `40 Comercial/Propostas/` e `30 Projetos/`, faz
   upsert idempotente por slug, monta o relatório e NUNCA escreve no vault.
   Mapeamento do frontmatter em `lib/vault.ts:127` para `vault.ts:154`.
6. Criar `_scripts/db/backup.mjs`: copia `AGENCIA_DB` para
   `apps/plataforma/data/backups/plataforma-AAAA-MM-DD.sqlite`, aplica a rotação
   e sai com código 1 em falha. Deixar prontas a linha de cron e a unit do
   systemd timer. Pasta fora do git.
7. Expor leitura por rota autenticada para a v3-04 consumir, reusando
   `isAuthed` (`apps/plataforma/src/app/api/financas/route.ts:6`).
8. Rodar a migração nos dados reais e guardar o relatório com a contagem.
9. Escrever o teste de ponta a ponta da seção 11 e ajustar esta story com o
   resultado.

## 8. Fora de escopo

- Banco, tabelas, chaves, rotas, Supabase, Stripe e OpenAI do Studio Web Pro. A plataforma tem banco próprio do seu código.
- Aulas, lives, biblioteca, dicas, códigos, admin, billing Stripe e prospector do SWP.
- Migrar documento ou demanda do vault para o banco. O vault continua a fonte de conhecimento, documentos e demandas.
- Card de cliente, CRM, cofre na tela e contrato rápido (v3-04).
- Relatório mensal, link com token e botão de WhatsApp (v3-05).
- Apagar ou alterar qualquer arquivo do vault nesta entrega.
- Alterar apps/site, git push e deploy.

## 9. Arquivos prováveis

- `apps/plataforma/src/lib/db.ts` (novo)
- `apps/plataforma/src/lib/schema.sql` (novo)
- `apps/plataforma/src/lib/cofre.ts` (novo)
- `apps/plataforma/src/lib/empresas.ts` (novo)
- `apps/plataforma/src/app/api/banco/route.ts` (novo, leitura autenticada)
- `apps/plataforma/package.json` (dependência de SQLite)
- `apps/plataforma/.gitignore` ou `.gitignore` da raiz (pasta `data/`)
- `_scripts/db/migrar-vault.mjs` (novo)
- `_scripts/db/backup.mjs` (novo)
- `_scripts/dados/relatorio-migracao.json` (saída da migração)
- `_scripts/qa/e2e-banco.mjs` (novo, teste da seção 11)

## 10. Riscos

- **Migração da VPS em 30/09:** os caminhos absolutos e o `VAULT` quebram se a
  variável não estiver certa (`lib/vault.ts:4`, `lib/demandas.ts:6`,
  `lib/infinitepay.ts:7`; theo.md, seção 4a, item 1). Fazer esta entrega só
  depois da VPS estável e setar `AGENCIA_DB` e `VAULT` no servidor.
- **Escrita concorrente:** app e personas gravam ao mesmo tempo. No banco, o
  SQLite resolve com transação e uma conexão só; no vault, a regra dura de
  `lib/demandas.ts:192` continua valendo e a migração nunca escreve no vault.
- **Perda do arquivo:** é um arquivo só. Por isso o backup diário com rotação,
  fora do git, e a cópia antes de migrar.
- **Chave do cofre vazando:** se a chave cair no banco ou no git, a cifra não
  protege nada. Chave só em `AGENCIA_COFRE_KEY` no servidor; `.env` fica fora do
  git.
- **Migração irreversível se o vault for apagado antes de validar:** a migração
  lê o vault e não o altera. Ninguém apaga nem move arquivo do vault nesta
  entrega. Só depois de conferir o relatório e o banco.
- **Ficha fora do padrão:** `Dra Aline Schwanck.md` tem frontmatter
  `titulo, data, cliente, tags` (caio.md:17), sem status nem valor. Entra como
  empresa de estágio `oportunidade` e origem `analise`, sem valor fabricado, e o
  arquivo do vault fica intacto.
- **Caminho do `VAULT` no Windows:** padrão `D:/Obsidian - Claude/🏢 Agência`
  (`lib/vault.ts:4`). Sem a variável, a migração acha 0 arquivo e relata 0 sem
  erro. O relatório tem que deixar isso visível.

## 11. Teste de ponta a ponta (um só)

Script novo `_scripts/qa/e2e-banco.mjs`, no padrão de
`_scripts/qa/e2e-demanda.mjs` (mesma leitura de `.env.local` em
`e2e-demanda.mjs:76`, mesmo `fail` em `e2e-demanda.mjs:26`, mesmo
`process.exit(1)` em qualquer falha e `process.exit(0)` no fim em
`e2e-demanda.mjs:132`). Usa um banco temporário (`AGENCIA_DB` apontando para a
pasta de temporários), nunca o banco real.

Passos:

1. Lê `apps/plataforma/.env.local` (`VAULT`, `AGENCIA_COFRE_KEY`) e aponta
   `AGENCIA_DB` para um arquivo temporário, como em `e2e-demanda.mjs:76` alinha
   o `VAULT`.
2. Roda a migração das fichas reais do vault e confere a contagem: empresas de
   origem `lead` igual ao número de `40 Comercial/Leads/*.md`, e de origem
   `cliente` igual ao número de `40 Comercial/Clientes/*.md`. Roda de novo e
   confere que a contagem não muda (idempotência).
3. Cria uma empresa de teste e lê de volta, conferindo `estagio_crm` correto
   (`lead`, depois `oportunidade`, depois `cliente`).
4. Grava uma credencial de teste no cofre e lê o arquivo do banco como binário,
   provando que a senha não aparece em texto puro. Não imprime a senha nem a
   chave.
5. Lê a credencial de volta pela aplicação e confere que a senha retorna certa.
6. Roda o backup e confere que o arquivo
   `plataforma-AAAA-MM-DD.sqlite` foi criado e abre como banco válido.
7. Remove o banco temporário e os arquivos de teste ao terminar.

Regras do script: nunca imprime credenciais nem a chave; usa banco temporário;
sai com código 1 em qualquer falha; sucesso termina com `process.exit(0)`.
