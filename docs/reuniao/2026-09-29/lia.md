# PRD enxuto · Plataforma v3 · Reunião 29/09/2026

## 1. Objetivo único da v3 e causa raiz

Objetivo único: fazer a plataforma virar a fonte única de verdade do Estúdio, começando por fazer as demandas subirem e aparecerem no app, depois ampliar em CRM, Clientes e Studio Web Pro.

Causa raiz das demandas não subirem (confirmada): o app lê a fila apenas de `_scripts/orquestra/fila.json`, em `apps/plataforma/src/lib/orquestra.ts:8` (const FILA). Esse é o arquivo da fila do loop-daemon legado, desligado em 28/09. O fluxo atual (Orion, pi, opencode via `_scripts/persona.mjs`) grava em outros lugares:
- briefings e logs em `docs/demandas/AAAA-MM-DD/`
- registro ao vivo em `vault/SaaS/Agentes/ao-vivo/<id>.json` (ver `_scripts/persona.mjs:106-108`)
- cartões em `vault/01 Kanban.md`

Resultado: dois sistemas paralelos que nunca foram ligados. Nada do fluxo atual aparece na aba Time e Fila.

## 2. Os 4 pedidos do Everton (mais a correção)

1. Aba Demandas com calendário: tarefas do dia e possíveis reuniões.
2. CRM de verdade: estrutura de relacionamento, não só lista.
3. Aba Clientes: cards por cliente, acompanhar os sites de cada um, métricas de cliques e acessos, e incorporar Microsoft Clarity (já instalado, id `ynkvl1zisv`, ver `apps/plataforma/src/components/rastreamento.tsx:96`).
4. Studio Web Pro como módulo da plataforma (cópia de leitura em `archive/referencias/studiowebpro`, ver `PLATFORM.md`).
5. Correção transversal: demandas com fonte única de verdade, do briefing até a tela.

## 3. Definição de pronto verificável

O Everton abre o app em app.evertonbrito.com e:
- vê a demanda que ele mandou hoje na tela, sem precisar abrir o vault nem o terminal.
- vê a demanda com status, responsável e horário, atualizando sozinha ao longo do dia, e abre a aba Clientes com um card por cliente ligado ao site.
- clica num cliente e vê cliques e acessos do site, com atalho funcional para o painel do Clarity.
- abre a aba Demandas e vê as tarefas do dia num calendário, com dia vazio mostrando estado honesto ("nada para hoje").

## 4. Épico v3 em stories pequenas, ordenado por valor

Ordem de execução = ordem de valor para o Everton: primeiro as demandas subirem e aparecerem, depois o resto.

### v3-01 · Demandas com fonte única de verdade
- Objetivo: o app passa a ler o fluxo real (vault ao-vivo, `docs/demandas/`, Kanban) e a fila legada deixa de ser a única fonte.
- Entrega visível: demandas do dia real aparecem na aba Time e Fila.
- Critérios de aceite:
  1. Dada uma demanda gravada em `vault/SaaS/Agentes/ao-vivo/`, ela aparece na aba em ate 60s.
  2. Uma demanda de `docs/demandas/AAAA-MM-DD/` aparece com status e responsável corretos.
  3. Demanda duplicada nas duas fontes aparece uma única vez (chave estável).
  4. Fonte sem itens mostra estado vazio honesto ("nenhuma demanda hoje") e layout legível em 375, 1280 e 1920.

### v3-02 · Aba Demandas com calendário do dia
- Objetivo: visão de calendário com tarefas do dia e possíveis reuniões.
- Entrega visível: nova aba Demandas com grade de dia e lista lateral.
- Critérios de aceite:
  1. Dia com tarefas mostra cada tarefa com horário ou período.
  2. Dia sem tarefas mostra "nada agendado para este dia".
  3. Botão de navegação troca de dia e mantém o estado ao voltar.
  4. Possíveis reuniões aparecem marcadas como "possível", sem afirmar confirmação.
  5. Responsivo em 375, 1280 e 1920 e o clique na tarefa abre a demanda de origem.

### v3-03 · CRM de verdade
- Objetivo: estruturar relacionamento por estágio, com histórico e próximo passo.
- Entrega visível: aba Comercial com estágios claros e ficha de contato.
- Critérios de aceite:
  1. Cada lead tem estágio, origem, último contato e próximo passo.
  2. Mudar estágio atualiza a visão e persiste após recarregar.
  3. Ficha do lead mostra histórico em ordem cronológica.
  4. Base vazia mostra estado honesto ("sem leads ainda") com ação de criar o primeiro; sem dado, mostra "sem dados".
  5. Responsivo em 375, 1280 e 1920.

### v3-04 · Aba Clientes com cards e sites
- Objetivo: um card por cliente, ligado ao site e ao rastreamento.
- Entrega visível: aba Clientes com cards e detalhe do cliente.
- Critérios de aceite:
  1. Cada card mostra nome, site e status (ativo, pausado, sem site).
  2. Cliente sem site mostra "sem site cadastrado", não um card quebrado.
  3. Clicar no card abre o detalhe com o site do cliente.
  4. Card sem métricas mostra "sem dados" em vez de zero enganoso.
  5. Grade reflui em 375, 1280 e 1920.
  6. Lista vazia mostra "nenhum cliente cadastrado" com ação de criar.

### v3-05 · Métricas de cliques e acessos por cliente
- Objetivo: mostrar cliques e acessos por site, usando os hits já gravados.
- Entrega visível: números e barras por site dentro do detalhe do cliente.
- Critérios de aceite:
  1. Visualizações por site batem com a fonte de hits em `vault/SaaS/Rastreamento/`.
  2. Site sem hit mostra "nenhum hit ainda: instale o pixel e visite o site".
  3. Alternância de período (hoje, 7 dias, total) recalcula os números.
  4. Números em tabular, sem salto de layout ao carregar, e responsivo em 375, 1280 e 1920.

### v3-06 · Microsoft Clarity no detalhe do cliente
- Objetivo: incorporar o acesso ao Clarity por cliente.
- Entrega visível: bloco do Clarity no detalhe, com id e atalho para o painel.
- Critérios de aceite:
  1. Bloco mostra o id instalado (`ynkvl1zisv`) e a instrução de trocar o id por site.
  2. Cliente sem id mostra "Clarity não configurado" com passo a passo curto.
  3. Atalho abre o painel do Clarity em nova aba.
  4. Bloco não promete dados embutidos se a integração não existir; informa onde ver. Responsivo em 375, 1280 e 1920.

### v3-07 · Studio Web Pro como módulo
- Objetivo: trazer as funções úteis do Studio Web Pro (ver `PLATFORM.md`) como módulo.
- Entrega visível: entrada "Studio Web Pro" na navegação, com as telas essenciais.
- Critérios de aceite:
  1. Cofre de senhas por cliente acessível a partir do detalhe do cliente.
  2. BC Studio (briefing e copy) abre e salva no mesmo padrão de dados do app.
  3. Módulo não cria um segundo cadastro de cliente: reusa a base existente.
  4. Tela sem recurso pronto mostra "em preparação", sem botão morto.
  5. Navegação legível em 375, 1280 e 1920.

## 5. O que cortar ou adiar

- Adiar geração de copy com IA, Contrato Rápido em PDF e Biblioteca Pro: consomem cota e são valor secundário frente a demandas, CRM e Clientes (cota do OpenCode em 86% no fim do mês).
- Cortar a fila legada `_scripts/orquestra/fila.json` como fonte: vira apenas compatibilidade de leitura, sem novas gravações nela.
- Adiar embutir dados do Clarity dentro do app (iframe/API) e migrar a base para banco: a VPS em 30/09 pede entrega mínima estável; o app segue em markdown/JSON até estabilizar.

## Riscos

- Migração para VPS em 30/09 pode derrubar o túnel e a leitura do vault; v3-01 depende de caminhos locais ainda válidos no novo host.
- Duas fontes de demanda (ao-vivo e `docs/demandas/`) podem gerar duplicidade se a chave estável não cobrir todos os formatos.
- Cota do OpenCode no fim: retrabalho em v3-01 pode consumir o restante e travar as stories seguintes.
- Sem dados de rastreamento, as telas de métricas podem passar impressão de vazio; o estado honesto precisa ser explícito.

## O que preciso de outra persona

- Theo: confirmar o caminho de deploy na VPS e como o app vai ler o vault após a migração (caminhos e permissões).
- Davi: garantir backend de leitura dos hits em `vault/SaaS/Rastreamento/` e a chave estável de deduplicação das demandas.
- Caio: definir os estágios reais do CRM e os campos obrigatórios de um lead.
- Everton: confirmar a ordem de valor e o que entra ou fica fora da v3.
