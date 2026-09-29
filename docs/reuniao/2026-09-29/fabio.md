# Fabio · financeiro no card de cliente

## O que o card precisa mostrar (lado financeiro)
- Contrato: cliente ativo, data de fechamento e status do projeto.
- Valor do projeto: valor único cobrado no fechamento.
- Recorrência / MRR: se tem plano mensal, valor e dia de vencimento.
- Ticket médio: por cliente e da carteira (base do Placar).
- Cobranças InfinitePay: link gerado, status (pago/pendente), data de pagamento.
- Próximos vencimentos: o que vence nos próximos 30 dias.
- Histórico de pagamentos do cliente: lista de cobranças e baixas.

## O que já existe hoje
- valor-projeto e recorrencia existem no frontmatter de cliente: `vault/40 Comercial/Clientes/Concept Implantes Dentários.md:9-10` (R$ 1.997, "não oferecida ainda").
- Placar tem tabela de Clientes e ticket médio: `vault/60 Financeiro/Placar.md:16-26`.
- Link InfinitePay: `criarLink` em `apps/plataforma/src/lib/infinitepay.ts:50`; status pago via `consultarStatus` (linha 105).
- Pagamento aprovado: `processarWebhook` marca paid/paidAt e grava webhook em `SaaS/Financeiro/webhooks` (`infinitepay.ts:135-163`).
- Histórico existe no código: `lerHistorico` lê JSON em `SaaS/Financeiro` (`infinitepay.ts:36-48`) e a API devolve em `apps/plataforma/src/app/api/financas/route.ts:7`.
- NÃO existe: campo de cliente no registro. O tipo `Registro` só tem descricao/valor/order_nsu (`infinitepay.ts:15-32`).
- NÃO existe: persistir o cliente. `criarLink` manda customer só para a InfinitePay, não salva no registro (`infinitepay.ts:61-79`).
- NÃO existe: vencimentos, MRR calculado, histórico por cliente, nem agregação no card.
- NÃO existe dado: `vault/SaaS/Financeiro/` só tem a pasta webhooks vazia; não há JSON de cobrança hoje.
- A ficha da Dra Aline não tem valor-projeto, recorrencia nem status (`vault/40 Comercial/Clientes/Dra Aline Schwanck.md:1-10`).

## Lacunas e proposta (mínima, sem retrabalho)
- Adicionar campo `cliente` (string) ao tipo `Registro` e gravar em `criarLink` o nome recebido em `customer` (`infinitepay.ts:15` e `:69`): sem isso não há como filtrar cobrança por cliente.
- Padronizar frontmatter de cliente: `valor-projeto`, `recorrencia`, `status` nos dois arquivos (hoje só Concept tem).
- Seção de vencimentos e recorrência no `vault/60 Financeiro/Placar.md`, junto da tabela Clientes (linha 16).
- Endpoint de agregação por cliente (reusar `lerHistorico`) e expor no card; a UI lê, não recalcula.
- Alinhar o VAULT default `"D:/Obsidian - Claude/🏢 Agência"` (`infinitepay.ts:7`, também em `vault.ts:4` e `prospector.ts:16`): no repo o vault é `D:/studio/vault` (symlink). Sem `VAULT` setado, grava fora de `D:/studio`.

## Riscos
- `atualizarPlacar` faz regex no Placar.md (`infinitepay.ts:166`): mudar o formato do mês ou das casas quebra a baixa.
- Webhook só conta se o `order_nsu` casar com um registro nosso (`infinitepay.ts:148-150`); link criado fora fica de fora do card.
- Sem banco, tudo é markdown/JSON: concorrência de escrita e dados de pagamento (PII) ficam no vault.
- Números do card ficam errados se valor-projeto e cobrança paga divergirem.

## O que preciso de outra persona
- Caio/Lia: layout do card e onde cada número aparece.
- Mia: fonte de verdade do cliente e padronização do frontmatter (status, recorrência).
- Theo/plataforma: campo `cliente` no Registro, endpoint de agregação e ajuste do VAULT.
- Everton: definir o que é "cliente ativo" para o card contar no MRR.
