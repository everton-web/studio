# Relatório de PageSpeed da Concept

Data: 04/10/2026

## Resumo

O site recebeu otimizações de LCP, JavaScript, imagens, cache e acessibilidade. O build local responde normalmente e preserva GTM, pixel da Marca Digital e o Instagram `@concept.implantesdentarios`.

O Lighthouse 13 não pôde ser executado neste ambiente. O acesso ao registro npm foi negado, o pacote não estava no cache, processos Node receberam `EPERM` ao consultar o Chrome e a rede do terminal não alcançou o site publicado. Por isso, não existe mediana local ou publicada desta sessão. O antes usa somente o baseline informado no briefing e o depois permanece não medido. Nenhuma pontuação foi estimada.

## Lighthouse: antes e depois

### Mobile

| Campo | Antes | Depois |
| --- | ---: | ---: |
| Desempenho | 68 | não medido |
| Acessibilidade | 89 | não medido |
| Boas práticas | 100 | não medido |
| SEO | 100 | não medido |
| FCP | 1,7 s | não medido |
| LCP | 5,4 s | não medido |
| TBT | 410 ms | não medido |
| CLS | 0 | não medido |
| Speed Index | 3,6 s | não medido |

### Desktop

| Campo | Antes | Depois |
| --- | ---: | ---: |
| Desempenho | 90 | não medido |
| Acessibilidade | não informado | não medido |
| Boas práticas | não informado | não medido |
| SEO | não informado | não medido |
| FCP | não informado | não medido |
| LCP | 2,0 s | não medido |
| TBT | 20 ms | não medido |
| CLS | não informado | não medido |
| Speed Index | não informado | não medido |

Fonte do antes: `antes/baseline-briefing.json`, transcrito do briefing de 03/10/2026. Esses valores não representam três execuções desta sessão.

## Comparação técnica local

O estado inicial local já continha o primeiro passe não commitado descrito no briefing. Ele foi buildado e medido antes dos ajustes adicionais desta sessão.

| Indicador | Antes local | Depois local | Variação |
| --- | ---: | ---: | ---: |
| HTML bruto | 359.523 B | 327.198 B | menos 9,0% |
| HTML gzip | 69.317 B | 70.251 B | mais 1,3% |
| Elementos `img` no HTML | 77 | 15 | menos 80,5% |
| JavaScript inicial bruto | 513.209 B | 508.959 B | menos 0,8% |
| JavaScript inicial gzip | 154.847 B | 153.433 B | menos 0,9% |
| Chunk da página bruto | 27.120 B | 24.995 B | menos 7,8% |
| Chunk da página gzip | 8.525 B | 7.847 B | menos 8,0% |

Fontes: `antes/http-build-local.json` e `depois/http-build-local.json`.

O HTML gzip aumentou 934 bytes porque os fundos decorativos agora carregam URLs explícitas do otimizador de imagens. Em troca, o DOM perdeu 62 elementos de imagem, o hero deixou de hidratar no cliente e cada uma das sete fotos decorativas usa uma URL AVIF otimizada e deduplicável.

## O que foi feito

### LCP e hero

1. Removidas animações de entrada que escondiam hero, título, texto, CTA e mosaico no primeiro paint.
2. O mosaico passou a ter ordem determinística e renderização no servidor.
3. O loop mantém três colunas com duas cópias contínuas, em vez da estrutura anterior com 126 imagens e da primeira otimização com 63 imagens.
4. Uma única imagem semântica visível recebe `loading="eager"`, `fetchPriority="high"` e `sizes` responsivo.
5. As demais peças do mosaico são decorativas e usam fundos AVIF gerados pelo otimizador do Next. A geometria, máscaras, inclinação e movimento foram preservados.
6. A fonte Manrope continua auto hospedada por `next/font` com `display: swap`.

### TBT e JavaScript

1. A página principal voltou a ser Server Component.
2. Estado e eventos do formulário ficaram isolados em `AppointmentProvider` e `AppointmentButton`.
3. O formulário e Framer Motion são carregados dinamicamente somente quando o usuário abre o agendamento.
4. FAQ usa `details` e `summary`, sem estado React e sem Framer Motion.
5. O ticker usa animação CSS e um intervalo pequeno, sem Framer Motion.
6. GTM e pixel da Marca Digital usam `strategy="lazyOnload"` e continuam presentes no HTML.
7. O mosaico deixou de ser Client Component, reduzindo hidratação e o chunk da página.
8. O `browserslist` explicita os mesmos navegadores modernos suportados pelo Next 16. O arquivo `nomodule` observado é o fallback do próprio Next e não é baixado por navegadores modernos.

### Imagens, vídeos e cache

1. Todas as instâncias restantes de `next/image` possuem `sizes` coerente com o layout.
2. Imagens abaixo da dobra usam carregamento preguiçoso.
3. O Next negocia AVIF e WebP e mantém TTL mínimo de sete dias para respostas otimizadas.
4. Vídeos usam `preload="none"` e poster WebP.
5. `/_next/static` responde com `public, max-age=31536000, immutable`.
6. Assets públicos sem hash respondem com sete dias de cache e um dia de revalidação em segundo plano.
7. O cache do HTML não foi alterado. A resposta continua `s-maxage=31536000`, conforme o comportamento existente informado no briefing.

### Acessibilidade

1. Tons de texto foram escurecidos em fundos claros e clareados em fundos escuros, sem trocar a paleta da marca.
2. A lista do método agora tem `li` como filho direto de `ol`.
3. O FAQ usa semântica nativa de expansão.
4. O modal recebe foco inicial, prende o foco durante a abertura, fecha com Escape e devolve o foco ao acionador.
5. Placeholders, textos auxiliares e CTA do WhatsApp tiveram contraste reforçado.
6. Ícones decorativos receberam `aria-hidden` onde aplicável.

## QA e checks

| Verificação | Resultado |
| --- | --- |
| `npm run lint` | passou |
| `npm run typecheck` | passou |
| `npm run build -- --webpack` | passou com Next 16.3.5 e webpack |
| Resposta HTTP local | 200 |
| GTM presente | sim |
| Pixel da Marca Digital presente | sim |
| Instagram correto no rodapé | sim |
| Imagens quebradas | não verificável sem navegador |
| Overflow em 1440 e 390 | não verificável sem navegador |
| Modal abre e fecha | não verificável sem navegador |
| Lighthouse 13, três execuções por perfil | bloqueado pelo ambiente |
| Site publicado pelo terminal | bloqueado pela rede |
| Puppeteer e prints | bloqueado por `EPERM` e acesso negado ao Chrome |
| Impeccable desktop e mobile | bloqueado porque o scanner não localizou navegador acessível |

O script `verificar-local.mjs` está pronto para gerar prints em desktop 1440 por 1000 e mobile 390 por 844, além de testar hero, seções, rodapé, Instagram, overflow, imagens e modal. Ele também aceita conexão CDP por `CONCEPT_CDP_URL`. As tentativas diretas e por CDP foram bloqueadas antes da captura.

## Comandos de medição bloqueados

Disponibilidade do Lighthouse:

```text
npx --yes --cache D:\studio\design\clientes\concept\pagespeed\.npm-cache lighthouse@13 --version
```

Resultado: `FetchError` ao acessar `https://registry.npmjs.org/lighthouse`, código `EACCES`.

Site publicado:

```text
curl.exe -I --max-time 20 https://conceptimplantesdentarios.com.br/
```

Resultado: erro 7, conexão indisponível.

Chrome pelo Node:

```text
node -e "fs.statSync('C:/Users/evert/AppData/Local/Google/Chrome/Application/chrome.exe')"
```

Resultado: `EPERM`.

Os detalhes estruturados estão em `antes/lighthouse-bloqueio.json` e `depois/lighthouse-bloqueio.json`.

## Pendências reais

1. Rodar Lighthouse 13.5 em um ambiente com rede e Chrome acessível, com três execuções mobile e três desktop no local e no site publicado. Só então calcular medianas e confirmar as metas de desempenho 90 e acessibilidade 95.
2. Executar o QA visual com os prints previstos. A preservação de conteúdo e estrutura foi verificada no HTML, mas a equivalência visual não pôde ser aprovada sem renderização.
3. Produzir legendas reais para os quatro depoimentos em vídeo. Os vídeos contêm fala e não receberam track vazio ou ocultação semântica, pois isso simularia conformidade. É necessário transcrever e revisar o conteúdo com o cliente.
4. Validar na Hostinger os headers finais entregues pela CDN. O servidor local aplica os headers corretos, mas a CDN pode sobrescrevê-los.

