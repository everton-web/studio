# Theo — construir o relatório público do lead (APROVADO pelo Everton)

Base: story `docs/stories/relatorio-publico.story.md` + protótipo aprovado `design/relatorio/prototipo.html` (Davi). Replicar o protótipo fielmente.

## 1. Site (`apps/site`, Next.js — publicado na Hostinger)
- Rota `/relatorio/[slug]` estática (`generateStaticParams` a partir de `src/data/relatorios/*.json`), `robots: noindex,nofollow`, sem link no menu/sitemap.
- Converter o protótipo em componentes (React, CSS do site / tokens do `globals.css`), mantendo: cabeçalho, nota com animação, "o que já está forte", oportunidades agrupadas, dores clicáveis, cálculo de "quanto pode estar deixando de ganhar" com premissas visíveis/editáveis, CTA WhatsApp 5571999261967 com texto citando a empresa.
- Slug inexistente → 404 do site.
- Mobile-first (375px) sem estouro de largura.

## 2. Plataforma (`apps/plataforma`)
- Exportador: `src/lib/relatorio.ts` gera o JSON público enxuto de um lead (contrato da story; SEM telefones, e-mails, WhatsApp do lead, avaliações de terceiros) a partir da análise salva (`lerAnalise`) + ficha, e grava em `D:/studio/apps/site/src/data/relatorios/<slug>.json`.
- Rota `POST /api/relatorio` { id } (autenticada) que exporta e devolve `{ slug, url: "https://evertonbrito.com/relatorio/<slug>" }`. Grave `relatorio: <url>` no frontmatter da ficha.
- Na ficha do lead (modal de detalhe, `src/components/pipeline.tsx`), botão "gerar relatório" → chama a rota e mostra o link com botão "copiar". Aviso: "o link só funciona depois que o Orion publicar o site".
- Em `src/lib/mensagens.ts`, se a ficha tiver `relatorio`, a mensagem DETALHE termina com: "Preparei um diagnóstico rápido da {empresa}: {relatorio}" (placeholder novo).

## Verificação
`npm run build` em apps/site E apps/plataforma; `npx tsc --noEmit` na plataforma. Gere o JSON de exemplo para `white-odonto` e confirme que `/relatorio/white-odonto` aparece no build.
Não commitar, não publicar, não reiniciar o app (o Orion faz).
