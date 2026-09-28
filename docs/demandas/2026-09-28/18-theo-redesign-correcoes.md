# Theo — correções de revisão do Orion no redesign (D:/studio-redesign, branch feat/redesign-motion)

Medido com puppeteer rolando a página (1440×900 e iPhone 390×844). Ferramentas para você conferir depois:
`node D:/studio/_scripts/qa/sonda.mjs http://localhost:3010/` (mede se cada título ficou visível após rolar até ele) e
`node D:/studio/_scripts/qa/secoes.mjs http://localhost:3010/ <pasta> ambos` (fotografa seção por seção). O dev server da cópia roda na porta 3010.

1. **Títulos de 2 linhas: a 2ª linha nunca aparece** (LineReveal). Sonda: "O que eu entrego" 1/2 linhas visíveis, "Projetos selecionados" 1/2, "Vamos construir seu site?" 1/2. Nas capturas as seções ficam com um vazio no lugar do título e o CTA monumental do rodapé não aparece. Corrija para cada linha revelar quando o título entra na tela (um único gatilho por título, linhas escalonadas), sempre terminando visível.
2. **Sobre**: o parágrafo editorial com preenchimento palavra a palavra fica praticamente invisível (base fantasma muito fraca). Base mínima 34% de opacidade e as palavras chegam a 100% conforme a seção passa pelo centro da tela; no celular também.
3. **Hero desktop não cabe**: a 1440×900 o título ocupa 5 linhas e a última sai da tela. Faça o tamanho do hero caber em 1 viewport (ex.: `font-size: min(clamp(2.9rem, 11vw, 11rem), calc((100svh - 260px) / 4.2))` ou equivalente), no máx. 4 linhas em 1440×900 e 1280×720, mantendo o texto atual.
4. **Mancha laranja fixa no centro de toda seção**: sem cursor (carregamento, celular, toque), a "torch"/brilho deve ficar apagada (opacidade 0) e só acender após pointermove de mouse. Em `pointer: coarse` desligue.
5. **Card "Ver todos"** do portfólio está enorme e vazio: vire um card compacto (altura de uma linha de texto grande + seta) ou um link-rodapé da galeria.
6. Rode `sonda.mjs` e `secoes.mjs` ao final e só entregue quando: todos os títulos com linhas visíveis = total de linhas; nenhum estouro lateral; hero cabe em 900px de altura.
`npm run build`. Commit na branch (sem push).
