# Theo · Ajustes da revisão do Orion na v3-02 (cópia D:/studio-v3-02, branch feat/v3-02)

Mesmas regras de segurança do briefing 29 (porta 3102, não tocar a 3100 nem D:/studio). Commite na branch.

1. Status novo `aguardando_everton` (rótulo "Aguardando você") em lib/demandas.ts, _scripts/lib/demanda.mjs, operacao.tsx (coluna própria, logo após Em andamento) e onde houver mapa de status. A caixa "Aprovações pendentes" do Hoje (components/hoje.tsx:113) passa a listar `aguardando_everton` (não `bloqueada`); aprovar = concluida, devolver = em_andamento com linha no Log.
2. `_scripts/persona.mjs`: ao terminar com sucesso, se o relatório da persona tiver "PENDENTE:" com decisão/aprovação do Everton (palavras aprovar, aprovação, decisão, Everton), gravar status `aguardando_everton`; senão `concluida`. Ajuste o e2e para cobrir isso.
3. Marcar como `aguardando_everton` as demandas dem-2026-09-28-4 (e-mail Blue Heaven aguarda aprovação) e dem-2026-09-29-25 (6 posts aguardam aprovação), com linha no Log.
4. Agenda do dia (Hoje e aba Agenda, visão Dia): além dos itens com prazo/reunião de hoje, mostrar as demandas `em_andamento` e as `aguardando_everton` (seção "Em andamento" e "Esperando você"), para a tela nunca ficar vazia com o time trabalhando. Nova demanda criada sem prazo recebe prazo = hoje por padrão (editável).
5. Placar aparece uma vez só no Hoje: tirar a linha "R$ 1.997 · 2% da meta" do cabeçalho do Hoje (fica o card Placar; a barra lateral continua).
6. Botões do cabeçalho por aba: "prospecção" só aparece em Comercial; "nova demanda" do cabeçalho some em Operação (já existe na barra de ferramentas dela). Em Hoje e Agenda fica só "nova demanda".
7. Data em minúsculas no padrão brasileiro: "terça-feira, 29 de setembro" (Hoje e Agenda; hoje sai "Terça-Feira, 29 De Setembro").
Pronto = tsc + build OK, e2e-operacao.mjs e e2e-demanda.mjs PASS na 3102, prints novos em _scripts/qa/prints-v3-02/ (hoje, agenda, operacao em 1280 e 375). Pare o servidor de teste no fim.
