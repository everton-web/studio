# Theo · Entrega 1 da Plataforma v3: fonte única de demandas (hoje, 29/09)

Base obrigatória: docs/reuniao/2026-09-29/ATA.md (seção 2, linha "Fonte das demandas") e a SUA proposta em docs/reuniao/2026-09-29/theo.md, seção 1b. Implemente exatamente o 1b.

## Escopo
1. Pasta `vault/SaaS/Agentes/Demandas/` com um `<id>.md` por demanda (frontmatter do 1b + `## Log` só acrescentando linhas). Use o VAULT do .env do app (não invente caminho).
2. Biblioteca única `apps/plataforma/src/lib/demandas.ts` (listar, criar, atualizar status, acrescentar log), sem sobrescrever campos de execução quando status = em_andamento.
3. `_scripts/persona.mjs`: ao iniciar cria/atualiza a demanda (status em_andamento, iniciada_em, persona, titulo = primeira linha da tarefa, briefing = caminho do .md se a tarefa citar um), e ao terminar grava concluida (ou bloqueada em falha) + linha no Log com o resumo "FEITO:". Continue gravando o ao-vivo como hoje.
4. API e tela: `/api/orquestra` (ou uma `/api/demandas` nova) passa a listar a pasta; a aba "Time & Fila" mostra as demandas reais (título, persona, status, horário, link do briefing), mais recentes primeiro. "Nova demanda" do app cria o arquivo na pasta nova. Pare de gravar em fila.json (NÃO apague o arquivo).
5. Migração única: script `_scripts/migrar-demandas.mjs` que lê `docs/demandas/**/*.md` (briefings, ignorando logs) e `vault/SaaS/Agentes/ao-vivo/*.json` e gera os `.md` na pasta nova, sem duplicar (um briefing citado por um ao-vivo vira uma demanda só). Não apague nada de origem. Rode e diga quantas gerou.
6. Teste de ponta a ponta `_scripts/qa/e2e-demanda.mjs`: cria uma demanda de teste pela mesma função que o persona.mjs usa, faz login no app local (credenciais do .env.local, sem imprimir), confere que ela aparece na API e NA TELA (puppeteer, aba Time & Fila), depois marca como cancelada e confere a mudança. Sai com código 1 se falhar.

## Pronto =
- `npx tsc --noEmit` e `npm run build` do app OK.
- e2e-demanda.mjs passa rodando contra o app reconstruído na porta 3100 (reinicie matando o processo da 3100; o watchdog sobe de novo).
- Print da aba Time & Fila com as demandas reais de 28 e 29/09.

Regras: não commite nem faça push; não mexa em apps/site; sem travessão em texto visível; nada inventado.
