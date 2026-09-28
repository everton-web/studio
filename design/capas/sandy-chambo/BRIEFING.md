# Briefing — Capa de portfólio · Sandy Chambô (Nutrição Funcional)

**De:** Orion · **Para:** Davi (design / direção de arte) · **Data:** 2026-09-27

## O problema
A capa atual (`apps/site/public/projects/sandy-chambo.webp`) é só um print do site dentro de uma moldura de navegador.
O Everton reprovou: "não ficou nada profissional". Precisamos de **direção de arte de studio**, nível Behance.

## Onde ela aparece
Card do portfólio em evertonbrito.com (site escuro, premium). Arquivo final **1616×1264 px**.
O card recorta a imagem: em destaque vira **21:10** (mostra só a faixa central ~1616×770) e no grid vira **16:10** (~1616×1010).
➜ Tudo que importa (rosto, título, mockup, marca) precisa caber na **faixa central de 1616×770**.

## Marca da cliente (extraia do site para confirmar)
- Site: https://nutrisandychambo.com.br — baixe o HTML/CSS (curl) e extraia **fontes** e **cores** reais.
- O que já se vê: fundo off-white rosado, marrom quase preto no título (sans condensada/grotesca), **"Nutrição Funcional" em serifada itálica rosé/terracota**, botão terracota `~#9A6A5D`, símbolo de **pétalas/gota** em marca d'água atrás da foto.
- Tom: acolhedor, feminino sem ser infantil, saúde integrativa, sofisticado.

## Material (pasta `assets/`)
- `foto-sandy.jpg` — Sandy recortada (fundo branco com halo). Baixa resolução: não amplie muito.
- `site-desktop.png`, `site-celular.png` (2x), `site-pagina-inteira.png` — prints do site para usar DENTRO de mockups.
- `referencia-dental-class.png` — capa do portfólio que é o padrão de qualidade: celular em perspectiva, cenário escuro com textura, luz.
- `referencia-flaren.webp` — referência editorial: foto grande, marca sobreposta, micro-texto em mono embaixo.

## O que entregar
**3 direções diferentes**, cada uma como um arquivo HTML autossuficiente 1616×1264 (CSS inline, fontes do Google Fonts, imagens por caminho relativo `assets/...`):
1. `direcao-1-editorial.html` — editorial/tipográfica: foto da Sandy + "Nutrição Funcional" grande na serifada itálica, paleta nude/rosé, grid e respiro de revista.
2. `direcao-2-mockup.html` — mockup: celular (e/ou notebook) com o site, em perspectiva CSS 3D, cenário na paleta dela (luz suave, sombra real, textura/gradiente), nível da referência Dental Class.
3. `direcao-3-marca.html` — marca/símbolo: o motivo de pétala/gota da identidade como elemento gráfico grande, composição limpa e sofisticada, com um recorte do site ou da foto.

Regras de design: tipografia real e hierarquia clara; no máx. 2 famílias de fonte; nada de texto longo; sem moldura de navegador genérica; contraste bom; nada importante fora da faixa central 1616×770.

Também crie `index.html` que mostra as 3 lado a lado (para o Orion comparar).

## Não fazer
- Não substituir a capa no site, não mexer em `apps/site`, não commitar, não publicar. O Orion renderiza, revisa visualmente e decide com o Everton.
- Não apagar nada.

## Relatório
No fim, liste: fontes e cores extraídas do site, o conceito de cada direção em 1 frase e os arquivos criados.
