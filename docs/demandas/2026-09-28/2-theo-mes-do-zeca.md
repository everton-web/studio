# Theo — "Mês do Zeca": 20% OFF nos serviços do site até 30/09 23:59

**Contexto:** o filho do Everton, Zeca, faz 2 anos em 29/09. Promoção de aniversário no site evertonbrito.com (`apps/site`, Next.js).

## Regras
- Desconto de **20%** em TODOS os preços de `apps/site/src/lib/i18n.ts` (PT e EN): Landing Page, Página de Vendas, One Page, Site Institucional, Consultoria, Mentoria.
- Válido **até 2026-09-30T23:59:59-03:00** (horário de Brasília). Depois disso, o site volta sozinho ao normal (sem deploy): preços originais, sem tarja, sem timer.
- Mostrar o preço original **riscado** + o preço com desconto em destaque. Preço com desconto = `Math.floor(preço × 0,8)` (mantém o final 7): Landing R$ 1.997 → **R$ 1.597** · Página de Vendas R$ 2.297 → **R$ 1.837** · One Page R$ 1.897 → **R$ 1.517** · Institucional R$ 3.097 → **R$ 2.477** · Consultoria R$ 197 → **R$ 157** · Mentoria R$ 2.997 → **R$ 2.397**.
- **Tarja bem evidente** no topo do site: "Mês do Zeca 🎈 — 20% OFF em todos os projetos até 30/09" + **contador regressivo** (dias, horas, min, seg) até 30/09 23:59. Tarja também perto da seção de preços.
- Use o design system do site (`apps/site/DESIGN-SYSTEM.md`, tokens do `globals.css`). Responsivo (celular 375px sem estourar largura).
- A lógica de data deve estar num só lugar (ex.: `src/lib/promo.ts` com `PROMO_FIM` e `promoAtiva(now)`), usada no servidor e no cliente, para não piscar o preço errado.
- Rodar `npm run build` em `apps/site` e garantir que passa.

## Não fazer
Não commitar, não publicar, não mexer em `projects.ts` (outra persona está nele).
