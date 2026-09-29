# CRM do Studio: estrutura de verdade (Caio, comercial)

O comercial já roda num pipeline funcional. O que falta é modelar o que acontece depois do "aprovar": oportunidade, proposta e cliente. Abaixo digo o que existe, o que existe pela metade e o que ainda não nasceu.

## Entidades e campos mínimos

| Entidade | Campos mínimos | Onde vive hoje | Estado |
|---|---|---|---|
| Empresa | nome, segmento, cidade, site, nota Google, avaliações | dentro do lead | parcial |
| Contato | nome, whatsapp, email | `contato`, `whatsapp`, `email` no lead | parcial |
| Lead | `lead, segmento, cidade, nota-google, avaliacoes, site-atual, contato, whatsapp, email, categoria, estagio, status, solucao, motivo-arquivo, porque, mensagem, criado, contatado-em, respondeu-em, desfecho, desfecho-em` | `40 Comercial/Leads/*.md` (vault.ts:113, 127) | existe |
| Oportunidade | valor, probabilidade, data prevista, dono | nada | não existe |
| Proposta | versão, valor, validade, estado, arquivo | `40 Comercial/Propostas/` (pasta vazia) | não existe |
| Cliente ativo | `cliente, contato, telefone, localizacao, segmento, status, data-fechamento, valor-projeto, recorrencia, tags` | `40 Comercial/Clientes/*.md` | parcial (2 fichas) |
| Projeto | nome, responsável, etapa, checklist QA | `30 Projetos/` | parcial |

O frontmatter de lead é exatamente o que `listLeads()` lê em `vault.ts:127` a `vault.ts:154`. O de cliente saiu de `Clientes/Concept Implantes Dentários.md:1`. As duas fichas de `Clientes/` não são o mesmo tipo de documento: a da Concept é ficha de cliente, a da `Dra Aline Schwanck.md:1` é análise de migração, com frontmatter `titulo, data, cliente, tags`. Hoje lead, cliente e projeto vivem em markdown separados, sem id que ligue um ao outro.

## Funil: seis estágios e gatilhos

Reaproveito os seis estágios de `vault.ts:102`, iguais aos donos descritos em `pipeline.tsx:40`.

| # | Estágio | Dono | Precisa ter na ficha | Gatilho objetivo | Aprova |
|---|---|---|---|---|---|
| 0 | Prospecção | Caio | ficha completa | ficha completa | nível do sistema |
| 1 | Aprovação | Everton | `solucao` | dor real e porte que paga | Everton, humano |
| 2 | Contato | Caio | `contatado-em` | interesse claro | Caio registra |
| 3 | Negociação | Caio | valor e proposta | pagamento e contrato | Everton |
| 4 | Desenvolvimento | Davi e Theo | projeto em `30 Projetos/` | checklist QA e no ar | Theo |
| 5 | Entrega | Mia e Caio | case e indicação | indicação mínima de 3 | Everton |

Os gatilhos vêm de `Pipeline.md:39` (pagamento recebido mais contrato assinado criam o projeto) e de `Pipeline.md:44` (pronto com checklist QA assinado e no ar). A aprovação do estágio 1 é humana, feita pelo botão "aceitar" de `pipeline.tsx:219`, que hoje só move para o Contato em `pipeline.tsx:443`.

Buraco: o estágio 3 não tem artefato próprio. `pipelineOp` não grava valor nem proposta em lugar nenhum (`vault.ts:166`), e `Propostas/` está vazia.

## Onde o lead vira cliente

Hoje nenhuma ação de `pipelineOp` cria ficha de cliente: as ações em `vault.ts:166` mexem só em `40 Comercial/Leads/`. A regra nova, que precisa da aprovação do Everton, é esta: quando o `move` leva o lead ao estágio 5 e existe evidência de pagamento e contrato, o app cria uma ficha em `40 Comercial/Clientes/`. O `move` para 5 já registra "entregue · pedir indicação" em `vault.ts:203`, e é o ponto natural para esse disparo.

O card do cliente deve ler o frontmatter real de `Concept Implantes Dentários.md:1` mais site, métricas de acesso do `vault/SaaS/Rastreamento/hits.json` (lido em `vault.ts:275`) e o Microsoft Clarity `ynkvl1zisv` citado em `00-pauta.md:19`. A aba e o leitor de `Clientes` não existem ainda: `listLeads()` só lê `Leads` (`vault.ts:114`) e as abas atuais são Início, Time, Projetos, Comercial e Mais (`dashboard.tsx:54`), sem Clientes. Isso é trabalho novo.

## Atividades que alimentam o calendário

Modelo de atividade: tipo (ligação, mensagem, reunião), data, hora, canal, resultado e vínculo com o lead. Hoje esse histórico vive apenas como texto livre em `## Movimentações`, escrito por `appendMov` em `vault.ts:160` e devolvido cru em `movs` por `vault.ts:123`. Proponho registrar cada atividade como uma linha datada e estruturada nessa mesma seção, por append no arquivo do lead, sem banco novo.

Esse registro alimenta o calendário da aba Demandas. Atenção: hoje a aba Demandas é a sala de reunião e a fila da agência, com chat e agentes em `demandas.tsx:26`, e não um calendário de tarefas. O calendário é construção nova sobre esse mesmo arquivo.

## Métricas do funil

Já dá para calcular hoje: `contatados, responderam, interessados` (estágio maior ou igual a 3)`, fechados` (estágio igual a 5)`, semResposta, semInteresse` e os percentuais, nas janelas 7, 30 e tudo, em `conversao.ts:36`. A tela usa isso em `pipeline.tsx:385`.

Falta o que exige campo novo: tempo médio por estágio e ciclo entre `contatado-em` e o fechamento. Não existe campo de data de fechamento no lead (`vault.ts:127`), então o ciclo não fecha. Também não há histórico datado legível: `movs` chega como texto (`vault.ts:123`). Um risco de leitura: `interessados` em `conversao.ts:40` conta quem está do estágio 3 ao 5, misturando negociação com quem já é cliente.

## Riscos

- Duplicação de dado: lead em `Leads/`, cliente em `Clientes/`, projeto em `30 Projetos/`, sem id que amarre os três.
- Ficha sem dono: o frontmatter de lead (`vault.ts:127`) não tem campo de responsável.
- Métrica que mente por campo vazio: `contatado-em` e `respondeu-em` só nascem nas passagens 2 e 3 (`vault.ts:200`), então contato fora do quadro não conta.
- Migração para a VPS em 30/09 (`00-pauta.md:20`): o caminho do `VAULT` hoje é `D:/studio/vault`, um junction para o Obsidian, e muda de lugar.
- Cota do OpenCode a 86% no fim do mês (`00-pauta.md:22`): a estrutura tem que nascer enxuta.

## O que preciso de outra persona

- Davi: modelar oportunidade e proposta, e escrever o leitor de `Clientes/` no `vault.ts` mais o card e a aba.
- Mia: padronizar o conteúdo das fichas de cliente, porque uma é ficha e a outra é análise de migração.
- Theo: QA do fluxo, teste de ponta a ponta e o deploy no ar depois da VPS.
- Everton: aprovar a regra de passagem de lead para cliente e o campo `fechado-em`.
