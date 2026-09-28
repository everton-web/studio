# Mia — tirar 2 projetos do portfólio do site
Em `apps/site/src/data/projects.ts`, remova do array `projects` os itens com slug `sandy-chambo` e `dr-guilherme-vieira` (as capas não foram aprovadas).
Não apague os arquivos de imagem em `apps/site/public/projects/` (o Orion decide depois). Não mexa em mais nada.
Confira com `git -C D:/studio diff apps/site/src/data/projects.ts` que só essas duas entradas saíram e que o arquivo continua válido (o primeiro item volta a ser `concept-implantes`).
