#!/usr/bin/env bash
# _render.sh — renderiza módulos Behance em PNG 2x
# Execute de D:/studio
set -euo pipefail

echo "=== Renderizando módulos Behance ==="

node _scripts/qa/render.mjs design/behance/01-capa.html design/behance/01-capa.png 1400 1400
echo "✓ 01-capa.png"

node _scripts/qa/render.mjs design/behance/02-contexto.html design/behance/02-contexto.png 1400 1330
echo "✓ 02-contexto.png"

node _scripts/qa/render.mjs design/behance/03-marca.html design/behance/03-marca.png 1400 1200
echo "✓ 03-marca.png"

node _scripts/qa/render.mjs design/behance/04-cor.html design/behance/04-cor.png 1400 1200
echo "✓ 04-cor.png"

node _scripts/qa/render.mjs design/behance/05-tipografia.html design/behance/05-tipografia.png 1400 1200
echo "✓ 05-tipografia.png"

node _scripts/qa/render.mjs design/behance/06-componentes.html design/behance/06-componentes.png 1400 1400
echo "✓ 06-componentes.png"

node _scripts/qa/render.mjs design/behance/07-movimento.html design/behance/07-movimento.png 1400 1200
echo "✓ 07-movimento.png"

node _scripts/qa/render.mjs design/behance/08-paginas.html design/behance/08-paginas.png 1400 1500
echo "✓ 08-paginas.png"

node _scripts/qa/render.mjs design/behance/09-mobile.html design/behance/09-mobile.png 1400 1300
echo "✓ 09-mobile.png"

node _scripts/qa/render.mjs design/behance/10-fechamento.html design/behance/10-fechamento.png 1400 1000
echo "✓ 10-fechamento.png"

echo "=== Todos os módulos renderizados ==="
