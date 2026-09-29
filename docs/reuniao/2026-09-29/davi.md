# Davi · Arquitetura de informação da plataforma v3

**Objetivo:** o Everton abre a plataforma e navega por área do negócio, enxerga as demandas do dia, o CRM, os clientes e o Studio Web Pro no mesmo lugar, com uma só cor de ação em cada tela.

Base: a navegação por grupos aprovada em `docs/stories/plataforma-etapa1-navegacao-dashboard.story.md` (seção 4) e a estética de `design/design-system/everton-ds.html`. Nada aqui cria cor, componente ou marca fora do DS. A identidade visível é da plataforma (Comando, IDV v2).

## Mapa do menu v3

| Item do menu | Grupo | Estado | O que abre | Fonte de dados no vault |
|---|---|---|---|---|
| Dashboard | Dashboard | nova | visão da operação em 8 blocos (story, seção 5) | `60 Financeiro/Placar.md`, `40 Comercial/Leads/`, `40 Comercial/Clientes/`, `vault/01 Kanban.md`, `vault/SaaS/Financeiro/` |
| Prospecção | Comercial | reaproveitada | pipeline de leads atual (aba Comercial) | `40 Comercial/Leads/*.md` |
| CRM | Comercial | nova | funil, ficha do lead e follow-ups | `40 Comercial/Leads/*.md` (campos `estagio`, `proximo-followup`), `40 Comercial/Propostas/` |
| Vendas | Comercial | em breve | propostas fechadas | `40 Comercial/Propostas/` (a criar) |
| Follow-ups | Comercial | em breve | fila de retomada por lead | campo `proximo-followup` em `40 Comercial/Leads/*.md` |
| Clientes | Clientes | nova | cards do cliente, site, métricas e Clarity | `40 Comercial/Clientes/*.md`, `vault/SaaS/Rastreamento/`, Clarity `ynkvl1zisv` |
| Serviços | Clientes | em breve | catálogo com preço | `40 Comercial/Servicos.md` (a criar) |
| Projetos | Clientes | em breve | ficha e case por cliente | `30 Projetos/<cliente>/` |
| Visão geral | Financeiro | em breve | resumo de entradas, saídas e pendências | `60 Financeiro/Placar.md` |
| Contas a receber | Financeiro | em breve | parcelas e projetos em aberto | `60 Financeiro/Contas a Receber.md` (a criar) |
| Contas a pagar | Financeiro | em breve | despesas a pagar | `60 Financeiro/Contas a Pagar.md` (a criar) |
| Fluxo de caixa | Financeiro | em breve | entradas contra saídas | `60 Financeiro/Placar.md` e `vault/SaaS/Financeiro/` |
| Despesas | Financeiro | em breve | registro de cada despesa | `60 Financeiro/Despesas/<slug>.md` (a criar) |
| MRR | Financeiro | em breve | recorrência por cliente | campo `recorrencia` em `40 Comercial/Clientes/*.md` |
| Demandas | Gestão | nova | calendário dia/semana/mês e fila de itens | `docs/demandas/AAAA-MM-DD/*.md`, `vault/SaaS/Agentes/ao-vivo/*.json`, `vault/01 Kanban.md` |
| Quadro | Gestão | reaproveitada | board do kanban atual (aba Projetos) | `vault/01 Kanban.md` |
| Relatórios | Gestão | reaproveitada | analytics atual (aba Resultados) | `vault/SaaS/Rastreamento/` |
| Studio Web Pro | Gestão | nova | briefings, cofre de senhas, biblioteca, contrato | leitura em `archive/referencias/studiowebpro/` (ver `PLATFORM.md`) |
| Conteúdo | Gestão | reaproveitada | uploads e cases do portfólio | `30 Projetos/` |
| Configurações | rodapé | em breve | preferências da conta | não existe |
| Cartão do usuário | rodapé | nova | sessão, função e logout | não existe |

**CRM dentro de Comercial:** CRM não é área nova, é o motor do funil que a Prospecção já lê em `40 Comercial/Leads/*.md`. Aba solta duplicaria a mesma fonte e quebraria o grupo Comercial.

**Demandas em Gestão:** demanda é operação de pessoas, prazos e reuniões, sem ligação com venda ou caixa. Gestão já reúne Time & Fila e Quadro (story, seção 4), então o calendário evolui essa tela no mesmo lugar.

## Wireframe: Demandas (com calendário)

Cabeçalho fixo: título "Demandas", seletor Dia | Semana | Mês, campo de busca e botão "Nova demanda" (pílula `--ac`). Everton vê PRIMEIRO o dia de hoje, com a linha do horário atual, e os itens de hoje no painel da direita. Ordem dos blocos: barra de período (setas, "Hoje", título do período), calendário, painel do dia selecionado, cartão de item. Cada cartão traz título, tag de tipo com cor, persona ou dono, horário e cliente, e as ações abrir briefing, concluir e remarcar. Estado vazio honesto: "Nada agendado para hoje. As demandas aparecem aqui quando o Orion registra uma tarefa ou reunião." Sem número fabricado.

## Wireframe: CRM

Cabeçalho: título "CRM", filtro por estágio, busca e botão "Novo lead". Everton vê PRIMEIRO o funil com a contagem por estágio e os follow-ups de hoje no topo. Ordem: faixa de funil (6 estágios com contagem e conversão N+1/N), lista de leads, painel do lead selecionado. Cada linha ou cartão traz nome e empresa, estágio, valor, próximo follow-up e último contato, com ações mover estágio, registrar contato e agendar follow-up. Fonte: `40 Comercial/Leads/*.md`. Estado vazio honesto: "Sem leads no funil. Cadastre o primeiro lead para começar."

## Wireframe: Clientes

Cabeçalho: título "Clientes", busca e botão "Novo cliente". Everton vê PRIMEIRO a grade de cards, com os ativos na frente. Ordem: faixa de métricas (clientes ativos, novos no mês), grade de cards, gaveta do cliente. Cada card traz nome, segmento, status, data de fechamento, valor e recorrência, além do site do cliente com cliques e acessos e o painel do Clarity `ynkvl1zisv`. Ações do card: abrir site, ver métricas, abrir Cofre de Senhas e ver projetos. Fonte: `40 Comercial/Clientes/*.md` e `vault/SaaS/Rastreamento/`. Estado vazio honesto: "Nenhum cliente cadastrado ainda."

## Wireframe: Studio Web Pro

Cabeçalho: título "Studio Web Pro" e sub-abas Briefings (BC Studio) | Cofre de Senhas | Biblioteca | Contrato. Everton vê PRIMEIRO os briefings aguardando resposta do cliente, com botão "Criar briefing". Cada card traz cliente, tipo de página, status e link único, com ações copiar link, abrir respostas e gerar copy. Estado vazio honesto: "Nenhum briefing ainda."

## Calendário: três visões

- **Dia:** uma coluna de horas, itens posicionados pelo horário e a linha do "agora". Mostra a hora exata e serve para executar.
- **Semana:** sete colunas, itens em pílulas compactas. Mostra a carga de cada dia e serve para equilibrar.
- **Mês:** grade de semanas, com contagem e pontos por tipo em cada dia. Mostra o panorama e serve para planejar.

## Tipos de item do calendário

| Tipo | Exemplo | Cor (tokens do DS) | Ícone | De onde vem o dado |
|---|---|---|---|---|
| Tarefa de persona | "Davi, wireframe da aba Clientes" | `--ac #FF4000`, tag acionável | ▲ | `vault/SaaS/Agentes/ao-vivo/*.json` e `docs/demandas/AAAA-MM-DD/*.md` |
| Reunião | "Reunião geral, 29/09" | `--tx #edede8` sobre `--elev #1d1d20` | ● | `vault/01 Kanban.md` e `docs/demandas/AAAA-MM-DD/*.md` |
| Prazo de cliente | "Entrega do site do Concept" | `--ac-sub rgba(255,64,0,.08)` com texto `--ac` | ◼ | `30 Projetos/<cliente>/` e `40 Comercial/Clientes/*.md` |
| Post de conteúdo | "Post do case Concept" | `--tx2 #98988f`, tag pedra | ▤ | `30 Projetos/<cliente>/` e área Conteúdo |

O laranja `--ac` fica reservado para o item acionável do dia; reunião, prazo e post usam neutros `--tx`, `--tx2` e `--muted`, com o ícone separando os tipos. Assim a proporção de cor do DS se mantém.

## Módulo Studio Web Pro

Entra como item próprio em Gestão, porque reúne ferramentas (briefing, copy, biblioteca, contrato), não um cadastro de cliente. Reaproveita o visual do DS e o link com a aba Clientes pelo Cofre de Senhas (ação no card do cliente). O módulo lê o repo `everton-web/studiowebpro` como referência, pela cópia de leitura `archive/referencias/studiowebpro/`, conforme `PLATFORM.md`. A plataforma não acopla Supabase, Stripe nem OpenAI do Studio WP nesta etapa; o estudo é de tela e fluxo. Nenhum dado sensível do cofre é copiado para o vault sem decisão do Everton.

## Componentes do DS que eu uso

Fonte única: `design/design-system/everton-ds.html`. Cores `--bg #0a0a0b`, `--card #151517`, `--elev #1d1d20`, `--tx #edede8`, `--tx2 #98988f`, `--muted`, `--line`, além do `--ac #FF4000` e do hover `--ac-h #E63800`. Tipografia Inter (`--sans`) nos textos e JetBrains Mono (`--mono`) em números e rótulos, com `text-wrap: balance`. Componentes: card e box (raio 14), campo `--elev` (raio 8), botão pílula (raio 999), tag em `--ac-sub`, rótulo micro (caixa alta, `+0.14em`). Movimento: `ease-out cubic-bezier(.16,1,.3,1)`, hover de cartão sobe 4px, line reveal de 1,1s.

## Riscos

- Reunião ainda não tem campo de hora estruturado, então o calendário pode abrir com a agenda vazia até o Orion gravar início e fim.
- Clientes depende de padronizar o frontmatter em `40 Comercial/Clientes/*.md`; hoje só Concept existe.
- Studio Web Pro tem stack própria (`PLATFORM.md`); acoplar cedo cria dependência desnecessária.
- Cofre de Senhas é dado sensível; exige regra de acesso e cuidado de LGPD antes de aparecer na tela.
- Clarity `ynkvl1zisv` precisa de embed ou API definida, senão o card de métricas fica vazio.

## O que preciso de outra persona

- **Theo:** confirmar leitura de `docs/demandas/` e `vault/SaaS/Agentes/ao-vivo/*.json` sem o `fila.json` legado desligado.
- **Lia:** definir os campos de CRM e de Clientes no frontmatter antes de eu fechar o card.
- **Lia e Olga:** confirmar o destino de Conteúdo e o lugar final das Demandas.
- **Everton:** decidir se o Studio Web Pro fica em Gestão, como proponho, ou vira sub-aba de Clientes.
