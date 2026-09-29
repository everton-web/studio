# Ata · Reunião geral do Studio · 29/09/2026

Presentes: Orion (condução), Lia, Theo, Davi, Caio, Olga, Fábio, Mia. Contribuições completas nesta pasta.

## 1. Causa da falha (consenso, confirmada no código)
O app lê demandas só de `_scripts/orquestra/fila.json` (`lib/orquestra.ts:8`), a fila do robô legado desligado em 28/09. O fluxo atual grava em `docs/demandas/`, `vault/SaaS/Agentes/ao-vivo/` e `01 Kanban.md`. Nunca foram ligados. As auditorias checaram peças, não o caminho de ponta a ponta.

## 2. Decisões do Orion onde o time divergiu
| Tema | Propostas | Decisão | Por quê |
|---|---|---|---|
| Fonte das demandas | Lia: app lê as 3 fontes e remove duplicadas. Olga: calendário agrega 4 fontes. Theo: fonte única, um arquivo por demanda em `vault/SaaS/Agentes/Demandas/`. | **Theo.** | Ler várias fontes e deduplicar é remendo que repete a falha de hoje. Um objeto, várias visões. |
| Kanban Projetos | Olga: kanban e Demandas convivem. Davi: Quadro separado em Gestão. | **Kanban vira visão da mesma demanda** (quadro, lista, calendário), numa aba Operação. | Três lugares para o mesmo trabalho é o problema, não a solução. |
| Tamanho do menu | Davi: ~20 itens, 11 "em breve" (Contas a pagar, Despesas, MRR, Serviços…). | **Cortar para 7 abas + Time no rodapé.** Nada de "em breve" no menu. | Item vazio no menu é ruído e parece plataforma inacabada. Aparece quando existir. |
| CRM | Davi e Caio: CRM dentro de Comercial. | **Concordo, e vai além:** CRM é o modelo de dados (empresa com estágios lead → oportunidade → cliente) por baixo de Comercial E Clientes. | Evita cadastro duplicado quando o lead vira cliente. |
| Studio Web Pro | Lia: portar cofre e BC Studio como módulo. Davi: menu próprio com Biblioteca e Contrato. Theo: manter separado, entrar como link. | **Theo agora; depois, só briefings e contrato entram DENTRO de Clientes.** Biblioteca, aulas e billing ficam fora (são do infoproduto). Cofre de senhas nunca vai para markdown. | Supabase, Stripe e OpenAI acoplados; cofre é dado sensível. |
| Clarity | Theo: embed "a confirmar". | **Não embute.** Verificado: o Clarity responde `X-Frame-Options: SAMEORIGIN`. Números via Data Export API + botão para o painel. | Fato verificado em 29/09. |
| Reuniões no calendário | Olga: vir de `sala.json`. | **Não.** `sala.json` é o chat legado. Reuniões vêm do Google Agenda do Everton (conector disponível) ou são criadas no app. | Reunião real mora na agenda real. |
| Quando mexer nas demandas | Theo: só depois da VPS. | **Hoje (29/09), com teste de ponta a ponta; VPS amanhã; o resto depois da VPS estável.** | A migração é amanhã, não hoje: não somamos risco no mesmo dia, e o Everton não espera mais. |

## 3. Hierarquia aprovada para proposta ao Everton
1. **Hoje**: aprovações pendentes (fila única, 1 toque), agenda do dia, alertas de cliente, placar.
2. **Agenda**: calendário dia, semana e mês (tarefas, reuniões, prazos de cliente, posts, vencimentos).
3. **Operação**: demandas em quadro, lista e calendário (absorve Time & Fila e Projetos).
4. **Comercial**: prospecção e funil (CRM por baixo).
5. **Clientes**: contas ativas com saúde do site, métricas, financeiro (Fábio), portfólio/case (Mia), briefings.
6. **Conteúdo**: calendário editorial e posts para aprovar.
7. **Resultados**: receita e conversão em detalhe.
Rodapé: **Time** (personas, ao vivo, logs).

## 4. O que ninguém pediu e entra no plano
- Saúde do site do cliente (no ar, formulário, velocidade, certificado) com alerta, antes de métricas de clique.
- Relatório mensal automático por cliente (modelo do /relatorio), base de um plano mensal de acompanhamento (receita recorrente).
- Aviso ao Everton fora do app quando algo precisa dele.
- Teste automático do caminho da demanda após cada deploy.

## 5. Ordem de entrega
| # | Entrega | Quando | Dono | Pronto quando o Everton… |
|---|---|---|---|---|
| 1 | Fonte única de demandas + migração dos itens atuais + teste de ponta a ponta | hoje 29/09 | Theo | vê na tela a demanda que pediu hoje, com persona, status e horário |
| 2 | Migração VPS | 30/09 | Theo | abre app.evertonbrito.com na VPS e o checklist do Theo (seção 4c) passa |
| 3 | Hoje + Aprovações + Agenda (com Google Agenda) | após VPS | Theo + Davi | resolve o dia em uma tela no celular |
| 4 | Operação (quadro/lista/calendário da mesma demanda) | após 3 | Theo + Olga | não precisa mais do kanban antigo |
| 5 | Clientes: cards, saúde do site, métricas (pixel + Clarity API), financeiro | após 4 | Theo + Fábio + Mia | abre um cliente e sabe se o site está bem e se deve algo |
| 6 | CRM unificado (empresa com estágios) | após 5 | Caio + Theo | fecha um lead e ele vira card em Clientes sem redigitar |
| 7 | Studio Web Pro: link agora; briefings e contrato dentro de Clientes depois | link após VPS | Theo | acessa o SWP a partir da plataforma |

## 6. Decisões pendentes do Everton
1. Aprovar a hierarquia de 7 abas (seção 3), incluindo fundir Time & Fila + Projetos em Operação.
2. Quer vender plano mensal de acompanhamento (base do relatório mensal por cliente)?
3. Liberar o Google Agenda como fonte das reuniões?
4. Studio Web Pro: confirma link agora e porte parcial depois?
