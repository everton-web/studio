# Story: Migração Supabase, etapa 2

## Objetivo

Substituir toda persistência local da plataforma por uma camada única, server-only,
baseada em Supabase Postgres e Storage, com a opção A para recursos dependentes de
processos locais.

## Status

Ready for Review. Ajustes pós-revisão implementados pelo Theo em 2026-10-06.

## Critérios de aceite

- [x] Camada única em `src/lib/data`, sem adaptador legado
- [x] Rotas sem `vault.ts`, `db.ts`, `fs` ou `ARQUIVOS_DIR`
- [x] Storage privado com bucket configurável e download autenticado (proxy em `/api/file`, URL assinada disponível em `urlAssinada`)
- [x] Migration incremental cria bucket e colunas necessárias (`0002`), e `supabase/SETUP-COMPLETO.sql` junta 0001 e 0002
- [x] Importador Node com `scan`, `dry-run`, `apply` e `verify` (`scripts/importar-supabase.mjs`)
- [x] Console, mirror, orquestra por processo e disparo do prospector removidos
- [x] Relatórios persistidos em `reports`, sem Git; leitura pública em `GET /api/relatorio/publico/<slug>`
- [x] Ambiente de exemplo e deploy Hostinger documentados (`.env.example`, `docs/DEPLOY-HOSTINGER.md`)
- [x] Lint, typecheck e build aprovados; não há suíte de testes automatizados no pacote
- [x] Busca final sem `fs`, `child_process` ou `node-pty` em `src`

## Correções da revisão

- `reports` e `briefings` usavam colunas inexistentes (`kind`, `slug`, `link_token`, `published_at`, `token`): criadas na 0002, com único (empresa, mês) só para o mensal e único por slug para o relatório do lead.
- A 0002 criava funções com `storage.create_signed_url`, que não existe no Postgres: removidas.
- Bucket sem lista de MIME (a plataforma aceitava qualquer arquivo); o download força `attachment` para tipos que o navegador executaria (HTML, SVG).
- Imports apontando para arquivos esvaziados quebravam o typecheck; os arquivos vazios foram apagados e as rotas importam de `@/lib/data`.
- Restos do prospector em `pipeline.tsx` quebravam o build: removidos.
- `xterm` sem uso removido do `package.json` e do lock.
- `lint` não existia: `scripts/lint.mjs` verifica as regras da migração sem dependências.
- Webhook InfinitePay confirma `success` e `paid` em `payment_check` antes de persistir o evento, marcar o registro ou atualizar o placar.
- Tokens de briefing e relatório ficam somente como hash. O servidor reconstitui o token com HMAC, ID e versão, e links legados exigem rotação.
- Privilégios atuais e futuros de tabelas, sequências e funções foram revogados para `anon` e `authenticated`.
- Cliente Supabase do servidor ganhou `server-only` e `LEADS_TOKEN` passou a usar comparação em tempo constante.
- O guard de autenticação passou a validar cada método HTTP, e `GET /api/relatorio` agora exige sessão.

## File list

- `apps/plataforma/src/lib/data/*` (camada nova)
- `apps/plataforma/src/lib/data/{client,briefings,relatorios,public-tokens}.ts`
- `apps/plataforma/src/lib/infinitepay.ts`, `src/app/api/leads/route.ts`, `src/components/clientes.tsx`
- `apps/plataforma/src/app/api/**/route.ts` (rotas migradas), `src/app/api/relatorio/publico/[slug]/route.ts` (nova)
- `apps/plataforma/src/components/{pipeline,dashboard,demandas,clientes,relatorio-cliente}.tsx`
- `apps/plataforma/src/lib/{analise,infinitepay,publicar-relatorio,relatorio}.ts`
- Removidos: `src/lib/{db,funil-db,console,mirror,prospector,vault,files,briefing,clientes,cofre,contrato,demandas,empresas,orquestra,relatorio-mensal,reunioes,saude}.ts`, `src/lib/schema.sql`, `src/components/{console,despacho}.tsx`, rotas `console/*`, `mirror`, `prospector`
- `apps/plataforma/supabase/migrations/{0001_init,0002_storage_bucket}.sql`, `apps/plataforma/supabase/SETUP-COMPLETO.sql`
- `apps/plataforma/scripts/importar-supabase.mjs`, `apps/plataforma/scripts/lint.mjs`
- `apps/plataforma/.env.example`, `apps/plataforma/.gitignore`, `apps/plataforma/docs/DEPLOY-HOSTINGER.md`
- `apps/plataforma/docs/MIGRACAO-SUPABASE.md`
- `apps/plataforma/package.json`, `apps/plataforma/package-lock.json`, `apps/plataforma/next.config.ts`
