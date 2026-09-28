# Caio — tirar o travessão (—) e a meia-risca (–) de TODO texto visível dos projetos

Regra do Everton: "não utilizamos travessão na escrita" (ver `D:/studio/CLAUDE.md`, "Regras de escrita").

## Escopo (texto que o cliente ou o Everton LÊ)
- `apps/site/src/**` — i18n (PT e EN), componentes, metadata/SEO, relatório público, promo.
- `apps/plataforma/src/**` — telas, botões, modais, mensagens de WhatsApp (`lib/mensagens.ts`), textos da análise de presença (`lib/analise.ts`: item/porque/fortes), exportador do relatório (`lib/relatorio.ts`), resumo da ficha.
- `apps/site/src/data/relatorios/*.json` — regere pelo texto novo (ou edite direto) para não sobrar travessão no ar.
Liste antes: `grep -rn "—\|–" apps/site/src apps/plataforma/src`.

## Como trocar (sentido, não troca cega)
- Explicação/aposto → vírgula ou dois-pontos. Ex.: "Página única com um objetivo — capturar leads" → "Página única com um objetivo: capturar leads".
- Duas ideias → ponto final. Ex.: "Sem preço — só conversa" → "Sem preço. Só conversa."
- Separador visual em rótulo curto ("Sandy Chambô — Nutrição") → "·" ou dois-pontos.
- Intervalos numéricos com "–" → "a" (ex.: "3–5" → "3 a 5").
- NÃO mexer em comentários de código, nomes de variáveis, nem no hífen normal (-) de palavras compostas.

## Verificação
- `grep -rn "—\|–" apps/site/src apps/plataforma/src` só pode sobrar em comentários de código (liste-os no relatório).
- `npm run build` em apps/site e `npx tsc --noEmit` em apps/plataforma.
Não commite.
