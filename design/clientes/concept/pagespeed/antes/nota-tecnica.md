# Baseline da Concept

O baseline utilizado vem do briefing de 04/10/2026, que relata o PageSpeed de 03/10/2026 com Lighthouse 13.5. Os valores foram transcritos em `baseline-briefing.json`. Valores não informados no briefing permanecem nulos. Não há mediana de execuções locais.

Na primeira execução foi feito `next build --webpack` antes das alterações e iniciado `next start -p 3215`. A resposta HTTP local tinha 190.798 bytes de HTML e `Cache-Control: s-maxage=31536000`. O mosaico tinha 126 elementos de imagem, ordem aleatória após hidratação e carregamento eager sem otimização.

A coleta Lighthouse não foi concluída: cache global do npm com EPERM, Chrome com acesso negado e rede externa indisponível. Na retomada, o código já estava alterado. Não foi desfeita nenhuma otimização para fabricar um antes local.

A nova tentativa `npx.cmd --offline --cache D:\studio\.tmp-pagespeed-npm-cache lighthouse@13 --version` retornou ENOTCACHED. `curl.exe` para registry.npmjs.org e para o site público retornou erro 7 de conexão. O acesso a `C:\Users\evert\AppData\Local\npm-cache\_npx` e aos navegadores Playwright também foi negado.
