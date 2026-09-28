# Theo — redesign do evertonbrito.com: MOVIMENTO e MICRO-INTERAÇÃO (aprovado pelo Everton)

Trabalhe SOMENTE na cópia `D:/studio-redesign` (branch `feat/redesign-motion`), em `apps/site`. Nada em `D:/studio`.

## Direção (leia antes)
- Referência: `D:/studio/docs/design/analise-raulvbrito.md` (arquitetura e motion do raulvbrito.com) e o JS dos mockups `D:/studio/design/site-redesign/main.js` (cursor, dot-grid "torch", reveals) como ponto de partida técnico.
- **NÃO mude a estética**: mantenha cores (#040404, #FF4000), fontes, conteúdo, i18n PT/EN, promo Mês do Zeca, portfólio e preços. O ganho é MOVIMENTO, não visual novo.
- Regras de escrita do Studio: sem travessão, sem viúvas (use `semViuva`/text-wrap já existentes).
- Performance: sem libs pesadas novas (framer-motion já está no projeto; prefira CSS + requestAnimationFrame + IntersectionObserver). `prefers-reduced-motion` desliga tudo que se move. Mobile sem estouro lateral.

## Implementar (fases aprovadas 0, 2, 3, 6)
**Fase 0, fundação de movimento**
- Reveal de títulos palavra por palavra / linha por linha com máscara (revela sozinho ao entrar na tela; nunca depende do mouse).
- Grade de pontos de fundo sutil que acende perto do cursor ("torch"), atrás do conteúdo.
- Cursor próprio (ponto + anel) com rótulo contextual ("ver", "abrir") sobre links/cards; só em dispositivos com mouse (pointer: fine).
- Botões/CTAs magnéticos (puxam levemente em direção ao cursor).
- Rolagem: reveal escalonado de seções; parallax leve em imagens do portfólio.

**Fase 2, navegação**
- Header mínimo (marca + botão "menu" em pílula) com desfoque progressivo conforme rola.
- Menu overlay em tela cheia, tipográfico, itens grandes com entrada escalonada, hover com micro-interação, PT/EN dentro. Tarja Mês do Zeca sempre acima.

**Fase 3, serviços**
- Cards numerados 01–04 (+ consultoria/mentoria), hover vivo (numeração/linha que corre, leve deslocamento), preços com promo intactos.

**Fase 6, rodapé**
- CTA monumental ("Vamos construir seu site?") revelado por máscara no scroll, com e-mail, WhatsApp, redes e voltar ao topo.

**404**
- `src/app/not-found.tsx` no mesmo idioma: fundo com grade de pontos e uma "lanterna" (luz radial) que procura algo no escuro seguindo o cursor (ou orbitando no celular), headline curta e humana, botão voltar ao início.

**Hero**: mantenha o conteúdo atual; deixe preparado (comentado) um slot para uma imagem de fundo que o Everton vai enviar.

## Verificação
`npm run build` em `D:/studio-redesign/apps/site`. Não commite no main; pode commitar na branch `feat/redesign-motion` (git -C D:/studio-redesign), SEM push. Relatório com a lista do que foi feito por fase.
