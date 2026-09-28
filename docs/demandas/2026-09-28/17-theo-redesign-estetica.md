# Theo — redesign do evertonbrito.com: ESTÉTICA do raulvbrito.com (decisão do Everton: "a estética do Raul me agrada bastante")

Continue em `D:/studio-redesign` (branch `feat/redesign-motion`), `apps/site`, sobre o movimento que você já implementou.
Aplique o SISTEMA VISUAL medido em `D:/studio/docs/design/analise-raulvbrito.md` §3 (valores exatos abaixo). Não copie textos, imagens, logos, nem CSS/JS dele: recrie os tokens no nosso código.

## Tokens (substituir/ajustar em `src/app/globals.css` e onde os componentes usam valores fixos)
- **Tipografia: uma única família, Inter** (Google Fonts/next/font), em todos os papéis. Hierarquia por ESCALA + TRACKING, poucos pesos:
  - Hero `clamp(2.9rem, 11vw, 11rem)` · tracking `-0.075em` · line-height `1.0`
  - Display (títulos de seção, CTA do rodapé) `clamp(2.6rem, 9vw, 8.5rem)` · `-0.075em` · `1.0`
  - XL `clamp(2rem, 5.2vw, 4.25rem)` · `-0.06em` · `1.05`
  - LG (títulos de card) `clamp(1.5rem, 3vw, 2.4rem)` · `-0.04em`
  - MD (leads) `clamp(1.15rem, 1.6vw, 1.6rem)`
  - Body `clamp(1rem, 1.05vw, 1.15rem)` · line-height `1.42`
  - Micro/labels `0.68rem`–`0.78rem`, CAIXA ALTA, tracking `+0.14em`
- **Cores:** fundo `#0a0a0b`; superfícies `#0e0e10` / `#151517` / `#1d1d20`; texto `#edede8`; secundário `#98988f`; meta/ghost com opacidade 34% e 12%; hairlines brancas a 5.5% / 10% / 22%.
  **Acento único = laranja da marca `#FF4000`**, usado só como pontuação (CTA principal, destaque de palavra, cursor, detalhes). Nada de blocos grandes laranja (exceto a tarja da promo até 30/09).
- **Grid/espaço:** container máx `1640px`; gutter `clamp(1.1rem, 4.2vw, 4.5rem)`; header `96px`; padding de seção `clamp(5rem, 12vh, 11rem)`; poucas colunas, cards grandes, sensação de galeria.
- **Raios:** `8px` (pequenos), `14px` (cards), `22px` (blocos), `999px` (pílulas/botões).
- **Easing:** `cubic-bezier(.16,1,.3,1)` (saída) e `cubic-bezier(.76,0,.24,1)` (in-out); durações 0.3/0.6/0.9/1.2s.
- **Imagens do portfólio:** overlay de gradiente escuro de baixo para cima para legibilidade, grain sutil em placeholders, proporções variadas conforme a célula.

## Estrutura (enxuta, como a do Raul)
Hero (nome/statement gigante, poucas palavras, reveal por linha) → Serviços (deck 01–04) → Trabalhos (galeria grande, card final "ver todos") → Sobre (um parágrafo editorial com preenchimento palavra a palavra no scroll) → Rodapé-CTA monumental. Remova/condense seções que competem com esse ritmo (liste no relatório o que saiu e para onde foi o conteúdo; nada de apagar conteúdo importante: preços, contato, promo).

Regras de escrita: sem travessão, sem viúvas. Mobile 375px sem estouro. prefers-reduced-motion. `npm run build`. Commit na branch `feat/redesign-motion` (sem push).
