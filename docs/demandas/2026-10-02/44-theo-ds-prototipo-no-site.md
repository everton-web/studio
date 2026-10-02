# Theo · Design system e protótipo do Complexo SC no domínio do site

Pedido do Everton (02/10): o design system e o protótipo do Complexo SC devem morar no mesmo padrão de link do relatório, no site dele, e não mais em vercel.app.

## URLs finais
- https://evertonbrito.com/relatorio/stetic-class/design-system
- https://evertonbrito.com/relatorio/stetic-class/prototipo
(o relatório já existe em /relatorio/stetic-class e /relatorio/stetic-class/detalhado)

## Origem
- Design system: D:/studio/design/clientes/stetic-class/design-system/index.html (HTML estático com imagens em img/ e img/prototipo/; os ds-parte-*.jpg NÃO vão para o site).
- Protótipo: D:/studio/sites/complexosc-proposta (Next, output export). Hoje no ar em proposta-csc-7k2q.vercel.app.
- Site: D:/studio/apps/site (Next 16, roda como app Node na Hostinger, build "next build --webpack"). Existe rota dinâmica src/app/relatorio/[slug]/.

## O que fazer
1. Protótipo: gere o export com basePath "/relatorio/stetic-class/prototipo" (via variável de ambiente no next.config do protótipo, para o build da Vercel continuar funcionando sem basePath). Confira que CSS, JS, imagens, vídeos e fontes saem com o prefixo, inclusive caminhos escritos à mão em src (img src="/..." , staticFile, url() no CSS, data/content). Copie o out/ para apps/site/public/relatorio/stetic-class/prototipo/.
2. Design system: copie index.html e img/ para apps/site/public/relatorio/stetic-class/design-system/. Troque o texto "proposta-csc-7k2q.vercel.app" pelo novo endereço evertonbrito.com/relatorio/stetic-class/prototipo (barras das telas e o parágrafo da seção 09) e transforme a menção em link para o protótipo.
3. Next não serve index.html de pasta em public sozinho. Em apps/site/next.config.ts adicione rewrites (beforeFiles) de /relatorio/stetic-class/design-system e /relatorio/stetic-class/prototipo (com e sem barra final, e subcaminhos do protótipo se houver) para os respectivos index.html, sem quebrar /relatorio/[slug] e /relatorio/[slug]/detalhado. Prefira uma regra genérica (/relatorio/:slug/design-system e /relatorio/:slug/prototipo) para servir os próximos clientes também.
4. Privacidade: as duas páginas devem ter noindex (meta robots no HTML e header X-Robots-Tag via headers() no next.config para /relatorio/:slug/design-system/:path* e /prototipo/:path*). O protótipo usa fotos do Instagram da clínica como prévia, então nada de indexar.
5. Relatório detalhado: na seção "O que propomos" (src/components/relatorio/RelatorioDetalhadoView.tsx), adicione dois botões, "Ver design system" e "Abrir protótipo", que só aparecem quando o JSON do relatório detalhado tiver os campos (adicione "designSystem" e "prototipo" com os caminhos em src/data/relatorios-detalhados/stetic-class.json e no tipo em src/lib/relatorio-detalhado.ts). Siga o estilo dos botões que já existem nos relatórios.
6. Verificação: rode o build do site (npm run build dentro de apps/site), suba com next start numa porta livre e confira com fetch ou Puppeteer (D:/studio/_scripts/qa) que as 4 URLs (/relatorio/stetic-class, /detalhado, /design-system, /prototipo) respondem 200, que o protótipo carrega sem 404 de assets (liste as requisições com erro) e que a galeria do cuidado e o hero aparecem. Tire 2 prints (protótipo desktop e DS) em D:/studio/design/clientes/stetic-class/publicacao/.

## Limites
Não faça commit, push nem deploy: o Orion revisa e publica. Não altere o projeto na Vercel. Sem travessão nos textos.
