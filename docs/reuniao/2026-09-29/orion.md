# Orion · posição de produto (reunião 29/09)

## Diagnóstico de produto
A plataforma cresceu por pedidos somados: cada pedido virou uma aba. Resultado: o trabalho mora em 3 lugares (Time & Fila, Projetos, docs/demandas) e o cliente em 2 (Comercial e o futuro Clientes). O usuário é um só, o Everton, com 1h por dia e muitas vezes no celular. A plataforma precisa se organizar em torno das decisões dele, não dos departamentos das personas.

## Princípios
1. Um objeto, várias visões. Demanda é um objeto; kanban, lista e calendário são visões dela. Empresa é um objeto; lead, oportunidade e cliente são estágios dela.
2. O que pede ação do Everton vem primeiro. Tudo que é "olhar por curiosidade" desce.
3. Pronto = caminho de ponta a ponta testado na tela, com teste automático que falha se quebrar.

## Hierarquia proposta (menu)
| # | Aba | Papel | Substitui / absorve |
|---|---|---|---|
| 1 | Hoje | Única tela do dia: aprovações pendentes, agenda de hoje, alertas de cliente, mensagens a enviar, placar | Início, parte de Resultados |
| 2 | Agenda | Calendário dia/semana/mês: tarefas das personas, reuniões, prazos de cliente, posts, vencimentos | (novo, pedido) |
| 3 | Operação | Demandas em quadro/lista: quem faz, status, entrega, log | Time & Fila + Projetos (kanban vira visão) |
| 4 | Comercial | Prospecção + funil até fechar | Comercial atual |
| 5 | Clientes | Contas ativas: saúde do site, métricas, financeiro, próximos passos | (novo, pedido) + módulo Studio Web Pro |
| 6 | Conteúdo | Calendário editorial e posts para aprovar | Conteúdo atual |
| 7 | Resultados | Receita, conversão, metas (detalhe; o resumo fica no Hoje) | Resultados |
| rodapé | Time | Personas, "ao vivo", logs | painel ao vivo sai do caminho principal |

CRM não é aba: é o modelo de dados por baixo de Comercial e Clientes.

## O que o Everton não pediu e precisa
- Aprovações num lugar só: tudo que espera o "ok" dele (post, mensagem a cliente, proposta, publicação) numa fila no Hoje, aprovável em 1 toque.
- Saúde do site do cliente antes de métrica: site no ar, formulário funcionando, velocidade, certificado. Alerta quando cair. É isso que segura cliente e justifica recorrência.
- Receita recorrente: o card do cliente gera relatório mensal (no mesmo modelo do /relatorio público) que justifica um plano de acompanhamento mensal. Hoje o Studio só vende projeto único.
- Clarity: o painel do Clarity não pode ser embutido (iframe bloqueado). Puxar números pela Data Export API e dar link direto para o painel do cliente.
- Aviso ao Everton fora do app (WhatsApp ou e-mail) quando algo precisa dele.
- Celular primeiro nas telas Hoje, Agenda e Aprovações.
- Teste automático do caminho da demanda (persona cria → aparece no app) rodando após cada deploy.

## O que é irrelevante agora
- Painel "ao vivo" com avatares no caminho principal (vai para Time).
- Aba de CRM separada.
- Métricas detalhadas de cliques antes de ter cliente ativo com site monitorado.

## Ordem que eu recomendo
1. Fonte única de demandas + teste de ponta a ponta (corrige a falha de hoje).
2. Hoje + Aprovações + Agenda.
3. Clientes com saúde do site e financeiro; relatório mensal.
4. Unificar Comercial e Clientes no mesmo modelo de empresa (CRM).
5. Módulo Studio Web Pro, depois da migração para a VPS.
