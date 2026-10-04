# Theo · PageSpeed do site da Concept

Pedido do Everton (04/10): melhorar o PageSpeed de https://conceptimplantesdentarios.com.br/ (cliente entregue, está no ar).

## Resultado atual (PageSpeed, Lighthouse 13.5, 03/10)
**Celular:** desempenho 68, acessibilidade 89, práticas 100, SEO 100.
- FCP 1,7 s, LCP 5,4 s, TBT 410 ms, CLS 0, SI 3,6 s.
- Insights: solicitações que bloqueiam renderização (450 ms), JS legado (17 KiB), cache ineficiente (647 KiB), entrega de imagens (535 KiB), tamanho do DOM, 3ºs (GTM).
- Diagnóstico: thread principal 2,3 s, JS não usado 239 KiB, 8 tarefas longas, 12 animações não compostas.

**Computador:** desempenho 90, LCP 2,0 s, TBT 20 ms.

**Acessibilidade (os dois):**
- contraste insuficiente;
- listas com filhos que não são li;
- li fora de ul/ol;
- video sem track de legendas.

## Projeto
- Código: D:/studio/archive/Concept/concept-site (repo git próprio).
- Next com headers de segurança no next.config.ts; build "next build --webpack" (Turbopack quebra na Hostinger, não volte para ele).
- Roda como app Node na Hostinger atrás da CDN deles (header server: hcdn).
- Tem GTM e o pixel da Marca Digital no layout: mantenha os dois funcionando (pode adiar o carregamento, não remover).
- Hoje o HTML responde com Cache-Control s-maxage=31536000.

## O que fazer
1. **Medir antes, localmente.**
   - Faça build e `next start` numa porta livre.
   - Rode Lighthouse 13 em modo mobile e desktop: `npx lighthouse@13`, com o Chrome em `~/AppData/Local/Google/Chrome/Application/chrome.exe`, `--output=json`, 3 execuções cada, use a mediana.
   - Rode também contra o site no ar, para calibrar.
   - Guarde os JSON em `D:/studio/design/clientes/concept/pagespeed/antes/`.
2. **LCP no celular** (o maior ganho):
   - identifique o elemento LCP;
   - imagem do hero com `priority`/`fetchPriority="high"`, `sizes` correto, formato AVIF/WebP no tamanho real exibido;
   - nada de animação de opacidade ou transform segurando o LCP no primeiro paint;
   - fontes com `display: swap` e preload só das usadas acima da dobra.
3. **TBT e JS:**
   - GTM e scripts de terceiros com `next/script` `strategy="lazyOnload"` ou após interação;
   - componentes pesados abaixo da dobra com import dinâmico;
   - animações (GSAP/Motion, se houver) só depois da hidratação e com transform/opacity (compostas);
   - remova o JS não usado que estiver ao seu alcance;
   - ajuste o browserslist para tirar o JS legado.
4. **Imagens:** comprima e redimensione as que o relatório aponta; `next/image` com `sizes` em todas; `loading="lazy"` abaixo da dobra; vídeos com `preload="none"` ou `metadata` e poster.
5. **Cache:**
   - headers `Cache-Control` `public, max-age=31536000, immutable` para `/_next/static`, fontes e imagens com hash;
   - assets de public/ sem hash com cache longo razoável.
   - Não mude o cache do HTML sem explicar no relatório.
6. **Acessibilidade:**
   - corrija o contraste apontado sem mudar a identidade (escureça o tom do texto, não a paleta);
   - arrume a semântica das listas;
   - vídeos decorativos sem áudio: `aria-hidden` e sem controles, ou track vazio com justificativa (o objetivo é passar na auditoria de forma honesta).
7. **Medir depois,** com os mesmos critérios, salvando em `.../pagespeed/depois/`.
   - Meta: celular ≥ 90 em desempenho e acessibilidade ≥ 95, sem quebrar o visual.
   - Confira com Puppeteer e prints (desktop 1440 e mobile 390) que o site ficou visualmente igual: hero, seções, rodapé com o Instagram @concept.implantesdentarios.
8. **Commit local** no repo do concept-site com mensagem descritiva.

## Entrega
Arquivo `D:/studio/design/clientes/concept/pagespeed/relatorio.md` com:
- tabela antes x depois (mobile e desktop, as 4 categorias e as 5 métricas);
- o que foi feito em cada item;
- o que ficou de fora e por quê (por exemplo, o que depende da CDN da Hostinger).

## Limites
- Não faça push, não gere zip, não publique: o Orion revisa, gera o pacote e o Everton sobe na Hostinger.
- Sem travessão nos textos.

## Autorização (Orion, 04/10)
Exceção explícita à regra de archive/: o Everton pediu esta otimização e D:/studio/archive/Concept/concept-site é o código ativo do site da Concept no ar (já foi editado nesta semana para o Instagram e o pixel). Pode editar, buildar e commitar localmente nessa pasta, e só nela.
Um primeiro passe (04/10, 12:33 a 12:39) já deixou 22 arquivos modificados e não commitados (imagens AVIF/WebP, headers de cache, componentes). Revise esse diff com git diff, aproveite o que estiver certo e continue a partir dele. Não descarte sem medir.
