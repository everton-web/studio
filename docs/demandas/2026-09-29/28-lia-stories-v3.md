# Lia · Stories da Plataforma v3 (entregas 2 a 5)

Fonte da verdade: docs/reuniao/2026-09-29/ATA.md INTEIRA (seções 2, 3, 5, 7, 8 e 9 valem sobre as contribuições individuais). Contribuições de apoio: docs/reuniao/2026-09-29/{davi,caio,olga,fabio,mia,theo,orion}.md. Formato de story: docs/stories/ (siga o padrão existente, ex.: docs/stories/plataforma-etapa1-navegacao-dashboard.story.md).

Decisões já tomadas pelo Everton (não reabrir):
- Menu: Hoje (tela inicial), Agenda, Operação (Time & Fila + Projetos juntos), Comercial, Clientes, Conteúdo, Resultados; Time no rodapé. Nada de item "em breve" no menu.
- Demandas: fonte única já pronta em vault/SaaS/Agentes/Demandas (entrega 1 concluída, apps/plataforma/src/lib/demandas.ts).
- Google Agenda: em espera (reuniões criadas no próprio app).
- Studio Web Pro fica separado. A plataforma reescreve só: carteira de clientes, briefing por link, cofre de senhas por cliente (criptografado), contrato rápido.
- Banco próprio da plataforma: SQLite no servidor, um arquivo, backup diário; cofre criptografado. Vault segue para conhecimento, documentos e demandas.
- Relatório mensal por cliente todo dia 1, link público com token, fase 1 com botão de WhatsApp em 1 toque na aba Hoje (fase 2 API oficial fica fora desta leva).
- Publicação de conteúdo é manual.

Entregue em docs/stories/:
- v3-02-hoje-agenda-operacao.story.md (navegação nova + Hoje + Agenda + Operação com quadro/lista/calendário da mesma demanda)
- v3-03-banco-da-plataforma.story.md (SQLite, esquema de empresa/contato/oportunidade/projeto/contrato/credencial/briefing/relatorio, migração das fichas de lead do vault, backup, cofre criptografado)
- v3-04-clientes-crm.story.md (Comercial e Clientes sobre o mesmo modelo de empresa com estágios; card do cliente com saúde do site, métricas do pixel, Clarity por link, financeiro, briefing por link, cofre, contrato)
- v3-05-relatorio-mensal.story.md (geração dia 1, link com token, dashboard público do cliente, lista no Hoje com botão de WhatsApp)
Cada story: objetivo, o que o Everton vê na tela, critérios de aceite testáveis (incluindo celular 375px e estados vazios honestos), tarefas técnicas em ordem, arquivos prováveis, fora de escopo, riscos, e UM teste de ponta a ponta que prove a entrega (no padrão de _scripts/qa/e2e-demanda.mjs).
Regras: sem travessão, sem viúvas nos títulos, nada inventado (cite arquivo quando afirmar algo sobre o código). Não edite código, não commite.
