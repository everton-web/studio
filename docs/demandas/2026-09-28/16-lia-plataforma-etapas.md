# Lia — story: nova navegação + Dashboard da plataforma (etapa 1 de 3, APROVADA)

Referência visual do Everton (print de um dashboard "JR Agency"): sidebar por ÁREA DO NEGÓCIO com grupos
Dashboard · COMERCIAL (Prospecção, Vendas, Follow-ups) · CLIENTES (Clientes, Serviços, Projetos) · FINANCEIRO (Visão geral, Contas a receber, Contas a pagar, Fluxo de caixa, Despesas, MRR) · GESTÃO (Relatórios) + Configurações e cartão do usuário no rodapé.
Dashboard com: saudação ("Boa tarde, Everton."), 4 cards (Faturamento do mês, MRR, A receber, A pagar), faixa (Clientes ativos, Novos clientes, Vendas no mês, Ticket médio), gráfico Fluxo de caixa (receitas x despesas), Pipeline comercial por estágio com % conversão, Próximas ações (pendências/follow-ups de hoje), Receita recorrente, Últimas movimentações.
NÃO copiar marca/nome da referência; manter a marca da plataforma (IDV v2 "Comando").

Plataforma atual: `apps/plataforma` (abas em `src/components/dashboard.tsx`: Início, Time & Fila, Projetos, Comercial, Resultados, Conteúdo). Dados existentes no vault: leads (40 Comercial/Leads), placar (60 Financeiro/Placar.md), links/pagamentos InfinitePay (SaaS/Financeiro), analytics (SaaS/Rastreamento), kanban (01 Kanban.md), execuções das personas (SaaS/Agentes/ao-vivo). "Time & Fila" vai para GESTÃO.

Entregue `docs/stories/plataforma-etapa1-navegacao-dashboard.story.md`:
1. Mapa da nova navegação: cada item → tela atual reaproveitada, tela nova, ou "em breve" (etapas 2 e 3).
2. Dashboard: cada bloco → fonte de dados real existente (ou regra de cálculo), e o que fica com estado vazio honesto quando não houver dado.
3. Critérios de aceite numerados (desktop e mobile, sem travessão/viúvas, estados vazios).
4. Esboço das etapas 2 (Comercial: Prospecção/Vendas/Follow-ups) e 3 (Clientes + Financeiro: novos dados necessários e onde gravar no vault).
Não implemente código. Não commite.
