# Olga · Operações · Modelo operacional do calendário e das demandas

Modelo proposto para ligar a demanda do nascimento à entrega, sem cadastro duplicado. Fontes reais: `vault/01 Kanban.md`, `docs/demandas/`, `vault/SaaS/Agentes/ao-vivo/`, `apps/plataforma/src/lib/orquestra.ts` e `_scripts/persona.mjs`.

## 1. Como uma demanda nasce (três portas)

Porta A, Everton pede no chat. Quem cria: Everton, na sala da aba Time & Fila (`components/demandas.tsx:104`), ou o Orion despachando por `_scripts/persona.mjs:5`. Obrigatório no nascimento: dono (persona), origem ("pedido direto"), prazo e critério de pronto. Registro: briefing em `docs/demandas/AAAA-MM-DD/NN-persona-slug.md`, modelo em `docs/demandas/2026-09-29/25-conteudo-social.md:1`.

Porta B, card criado no kanban. Quem cria: Olga na sessão diária, ou Everton direto em `vault/01 Kanban.md`, coluna Backlog (`vault/01 Kanban.md:13`). Obrigatório: dono humano, origem ("plano/sessão"), prazo e critério de pronto. Registro: o próprio `vault/01 Kanban.md`.

Porta C, alerta de cliente. Quem cria: Olga, ao ver alerta (o playbook prevê `ALERTA loop 24-7 parado.md` no Diário de Bordo, `vault/20 Playbooks/Loop dos Agentes.md:72`) ou pedido do cliente. Obrigatório: cliente afetado, dono, prazo e critério de pronto. Registro: card novo no Backlog e, se virar execução, briefing em `docs/demandas/`.

## 2. Estados da demanda (ciclo de vida)

A fazer. Dispara: nascimento em qualquer porta. Dono da entrada: Olga. A demanda fica registrada, sem execução.

Fazendo. Dispara: o dono aciona a persona; `persona.mjs` grava estado "trabalhando" em `vault/SaaS/Agentes/ao-vivo/<id>.json` (`persona.mjs:114`). No kanban o card vai para "Fazendo (máx. 2)" (`vault/01 Kanban.md:30`). Dono: Orion.

Em revisão. Dispara: o relatório do pi traz a linha `FEITO:` (`persona.mjs:123`) e o ao-vivo vai para "pronto" (`persona.mjs:156`). Confere o critério de pronto e as regras de escrita (sem travessão, sem viúva). Dono: Orion.

Aguardando Everton. Dispara: item que exige decisão humana. Exemplo real: publicação de post é MANUAL (`docs/demandas/2026-09-29/25-conteudo-social.md:13`). Dono: Everton.

Feito. Dispara: aprovação do Everton. Dono: Olga, que move o card para Feito (`vault/01 Kanban.md:40`).

Estado externo: Aguardando cliente, quando a bola está com o cliente (`vault/01 Kanban.md:36`).

## 3. Rituais

Sessão diária do Everton (1h). Abrir o kanban e escolher UM card, receita antes de presença (`vault/01 Kanban.md:47`); executar só esse card; registrar a sessão em `vault/70 Diário de Bordo/`; anotar uma ideia de post em `vault/50 Conteúdo/ideias.md` (ficha da Olga em `vault/10 Agentes/`, linha 23). Regra de ouro: máximo 2 em Fazendo, ideia nova vai para o Backlog (ficha da Olga, linha 37).

Revisão semanal (domingo, 30 min). O que saiu, quantas propostas, quantos posts, o placar, o que está parado há 7 dias, os 3 cards da semana (ficha da Olga em `vault/10 Agentes/`, linha 30).

## 4. O que entra no "dia" do Everton

A aba Demandas deve montar o dia agregando quatro insumos, sem criar base nova:

Tarefas: cards com prazo de hoje, lidos de `vault/01 Kanban.md` (colunas "Esta semana" e "Fazendo", `vault/01 Kanban.md:24`).
Reuniões: mensagens da sala (`_scripts/orquestra/sala.json`, lido em `lib/orquestra.ts:9`).
Aprovações pendentes: itens no estado "aguardando Everton" (seção 2).
Posts a publicar: o calendário de conteúdo em rascunho, aprovado, agendado, publicado (`docs/demandas/2026-09-29/25-conteudo-social.md:7`).

O calendário é somente leitura e agrupa por data. Cada insumo vira um card do dia com origem, dono e link de volta ao arquivo.

## 5. Fronteira entre Projetos e Demandas

Regra: Projetos (aba kanban) = cards de trabalho da agência com dono humano e decisão. Demandas (Time & Fila) = execuções das personas com registro automático. O kanban é a unidade de decisão; a demanda é o registro da execução.

Um item só sai do kanban para virar execução quando o dono humano aciona a persona, gerando o briefing em `docs/demandas/`. O card referencia a demanda pelo caminho do briefing. Não há cadastro duplicado: o card permanece a fonte, a execução fica ligada a ele.

Passagem: card vai para "Fazendo" (`vault/01 Kanban.md:30`), dono cria a linha em `docs/demandas/`, persona grava ao-vivo "pronto" (`persona.mjs:156`), card vai para "Feito" (`vault/01 Kanban.md:40`). Sem dono humano ou sem decisão pendente, o item fica no Backlog e não vira execução.

## Riscos

A aba Time & Fila hoje lê `_scripts/orquestra/fila.json` (`lib/orquestra.ts:8`), desligado em 28/09 (itens marcados "arquivada", "legado do loop-daemon, substituído por persona.mjs", `fila.json:62`). Enquanto não mudar, a aba mostra fila morta.
Dois vocabulários de status convivem: `pendente/rodando/ok/erro` (`lib/orquestra.ts:15`) e os estados operacionais. Sem mapa único, ninguém sabe onde a demanda está.
Card sem dono, prazo ou critério de pronto vira órfão.
Cadência de conteúdo ainda não decidida pelo Everton (`25-conteudo-social.md:14`): o calendário de posts não pode ser fixo.
Cota do OpenCode no fim do mês (`docs/reuniao/2026-09-29/00-pauta.md:22`): modelo operacional só vale se evitar retrabalho.

## O que preciso de outra persona

Orion: ligar a cadeia real (`docs/demandas/` e `ao-vivo/`) na aba Demandas e fixar o mapa de estados e a fonte única.
Davi: desenhar o calendário do dia consumindo os quatro insumos da seção 4.
Theo: endpoint que lê `docs/demandas/`, `ao-vivo/` e o kanban sem tocar em `fila.json`.
Caio: alimentar a porta C e os cards comerciais com dono, prazo e follow-up.
Mia: publicar o calendário de conteúdo para virar os posts a publicar do dia.
Everton: decidir a cadência de conteúdo e a janela fixa da sessão diária e da revisão.
