---
titulo: Critérios de UI, Responsividade e Stack — Manual da Agência
autor: Everton
versao: 1.0
data: 2026-09-24
tags:
  - agencia
  - ui
  - responsividade
  - stack
  - qualidade
---

# Critérios de UI, Responsividade e Stack — Manual da Agência

> Documento canônico. Todo projeto que sair da oficina (site de cliente, portfolio,
> app interno) é avaliado contra este manual. Os critérios são **verificáveis item a item**
> — ou passa, ou não passa. Não existe "acho que está bom".
>
> **Como usar:** leia inteiro uma vez, consulte seções por projeto
> (Pré-projeto → seção 3 e 4; Pós-projeto → seção 5; dúvida de stack → seção 4).

**Índice**

1. [Fundamentos de UI (regras de partida)](#1-fundamentos-de-ui)
2. [Critérios de responsividade](#2-criterios-de-responsividade)
3. [Mobile-first: o jeito de escrever](#3-mobile-first)
4. [Stack: Next.js vs JS puro na Hostinger](#4-stack-nextjs-vs-js-puro-na-hostinger)
5. [Gate de qualidade (pós-projeto)](#5-gate-de-qualidade-pos-projeto)
6. [Checklist de auditoria rápida](#6-checklist-de-auditoria-rapida)

---

## 1. Fundamentos de UI

Regras mínimas que todo projeto herda. Não é criatividade — é a base que liberta a
criatividade. O cliente paga por *decisões consistentes*, não por *elementos bonitos*.

### 1.1 Tokens (nunca valores soltos)

Tudo o que se repete vira token em `:root` (CSS) ou `theme` (Tailwind):

```
--color-bg      neutro mais escuro
--color-surface painel/cartão
--color-ink     texto principal (contraste ≥ 4.5:1 contra bg)
--color-ink-2   texto secundário (≥ 4.5:1 contra bg)
--color-accent  1 cor de ação (CTAs, links, foco)
--color-gold    (se a marca pedir 2ª cor: dourado, verde, etc.)
--radius        UM valor de raio para tudo (ex.: 14–16px)
--shadow        1 sombra suave + 1 elevada (máximo 2)
--ease          [0.22, 1, 0.36, 1]
```

> **Passe:** nenhum `#hex` solto fora dos tokens. Se aparecer cor nova, é token novo ou erro.

### 1.2 Tipografia fluida

Escala modular (1.25: h6 1rem → h1 ≈ 3rem) aplicada com `clamp()`:

```css
h1 { font-size: clamp(2.25rem, 5vw, 3.5rem); line-height: 1.05; letter-spacing: -0.03em; }
h2 { font-size: clamp(1.75rem, 3.6vw, 2.75rem); }
p  { max-width: 65ch; }          /* legibilidade */
```

Regras:
- 1 família sans (UI) + opcional 1 display (marca) + 1 mono (dados/código). Nada além.
- `text-balance` em títulos (`text-wrap: balance`).
- Nunca deixar o texto crescer com `vw` puro — sempre `clamp()`.

### 1.3 Espaçamento e grade

- **Grade de 8px** (4px nos micro-elementos): paddings, gaps, margens multipliam de 8.
- **Container:** `max-width: 1200px` (sites) / `1280px` (apps) / `1140px` (LP curta) + `padding: 24px` lateral no mobile, 32–64px no desktop.
- **Grade:** 12 colunas no desktop (`lg:grid-cols-12`), 1 coluna no mobile (empilha). Grid fluido com `repeat(auto-fit, minmax(280px, 1fr))` quando as colunas forem iguais.

### 1.4 Estados de componente

Qualquer elemento interativo tem **todos** estes estados:

| Estado | Exigência mínima |
|---|---|
| `hover` (desktop) | mudança visível ≤ 0.2s (cor, borda, elevação) |
| `focus-visible` | anel de foco visível (nunca só mudar a cor; nunca `outline: none` puro) |
| `active` / `pressed` | feedback de toque/click |
| `disabled` | opacidade ≤ 50% + `cursor: not-allowed` |
| `loading` | spinner ou estado bloqueado (botão não duplica clique) |
| `error` / `empty` | mensagem legível + como corrigir (forms) |

### 1.5 Acessibilidade base (não negociável)

1. HTML semântico: `header/nav/main/section/article/footer`, 1 único `h1` por página,
   hierarquia de heading sem pular níveis.
2. Todo `input` com `<label>` (visível ou `aria-label`).
3. Todo `img` com `alt` descritivo (decorativa → `alt=""`).
4. Ícones sozinhos nunca são o único affordance: texto ou `aria-label`.
5. Contraste AA (4.5:1 texto, 3:1 texto grande/UI).
6. `prefers-reduced-motion`: desliga paralaxe/scroll-driven (já é prática no Concept ✔).
7. Mobile: nada depende só de `hover`.

### 1.6 Motion

- Micro: 150ms · Hover/estado: 200–250ms · Reveal/entrada: 500–800ms.
- Easing único `[0.22, 1, 0.36, 1]` (cubic-bezier). Sai de cena mais rápido que entra.
- Animações de entrada: `once: true` (não repetir a cada scroll).
- Nada de animar `top/left/width/height` se der pra animar `transform/opacity`.

---

## 2. Critérios de responsividade

### 2.1 Breakpoints padrão (mobile-first, alinhado ao Tailwind)

| Ponto de quebra | Largura | Uso típico |
|---|---|---|
| Base (siempre testada) | **360px** (iPhone SE/Android nível entrada) | celular pequeno |
| `sm` | ≥ 640px | celular grande / rotação |
| `md` | ≥ 768px | tablet retrato |
| `lg` | ≥ 1024px | **tablet paisagem + desktop vira grade** |
| `xl` | ≥ 1280px | desktop largo |
| Teste extra | 320px, 375px, 390px, 1440px | pontos de mercado |

> A mudança de layout grande (sidebar vira menu, 1 coluna vira 12) acontece no `lg`.
> Intermediários ajustam espaçamento e fontes com `clamp()`.

### 2.2 Regras que valem ponto de reprovação ❌

1. **Scroll horizontal** em qualquer largura ≥ 320px (causa nº 1 de site "quebrado").
   - Sintoma: `width: 100vw`, `min-width` fixo, tabela sem wrapper, `white-space: nowrap`.
   - Remédio: fluidez (`minmax(0,1fr)`, `max-width:100%`), e `overflow-x: clip` só na seção
     que precisar (marquee). **`overflow-x: hidden` no body esconde o problema — não resolve.**
2. **Sidebar fixa de app em celular.** Em < 1024px ela vira: drawer com backdrop, bottom-nav,
   ou menu de navegação horizontal. Nunca 228px fixos + conteúdo espremido.
3. **Topbar empilhada sem quebra.** Brand + nav + placar + CTAs precisam de estratégia ≤ 640px
   (esconder secundário, hambúrguer, wrap).
4. **Alvo de toque < 44×44px.** Botões, links de menu, ícones, setas de carrossel ≥ 44px
   (48px ideal). Espaçamento entre alvos ≥ 8px para não errar o dedo.
5. **Input < 16px de fonte** → iOS dá zoom ao focar. Todo input ≥ 16px e largura 100% do container.
6. **Vídeo com som autoplay** no mobile → `playsinline muted autoplay loop` sempre.
7. **Imagem sem dimensão** → salto de layout (CLS). Toda imagem tem `width/height` ou `aspect-ratio`
   no CSS, mesmo as de fundo (`aspect-[4/5] sm:aspect-[4/3]` como no Concept ✔).
8. **Menu que não fecha / sem backdrop** em celular; âncora que não respeita o header fixo
   (`scroll-margin-top`).

### 2.3 Imagens responsivas (padrão)

- Hero e fotos grandes: `<img sizes="(max-width: 1024px) 100vw, 50vw">` + `srcset` (µp + WebP/AVIF).
- Lazy loading em imagem abaixo da dobra (`loading="lazy"`); hero carrega imediato (`fetchpriority="high"`).
- Nunca upscale: imagem ≥ 2× do maior container que ela ocupa.

### 2.4 Performance mobile (Core Web Vitals em 4G)

| Métrica | Alvo |
|---|---|
| LCP | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |
| JS total (gzip) | < 200KB (LP) — sem framework além de React+Next quando possível |
| Lighthouse mobile | ≥ 90 nos 4 eixos (PageSpeed Insights, não apenas DevTools) |

### 2.5 Como testar (checklist de verificação)

1. DevTools → device toolbar → presets **360×640 · 390×844 · 768×1024 · 1440×900**.
2. Em cada uma: navegar a página inteira rolando; clicar cada CTA/form; abrir/fechar o menu.
3. **Device real** (seu celular via Tailscale, como já faz com o painel): mesma navegação +
   digitar num form (zoom do iOS) + orientação retrato/paisagem.
4. PageSpeed Insights na URL pública (móvel) — anotar os 3 números no check final.

---

## 3. Mobile-first (o jeito de escrever)

```
ESTILO BASE  →  é o celular (360px)
@media (min-width: 640px)  →  ajusta
@media (min-width: 1024px) →  vira grade/sidebar
```

- Escreva o CSS do **celular primeiro**, sem media query. O `min-width` só adiciona.
- Use `md:/lg:` do Tailwind como *aditivos* — o layout base jamais depende deles.
- Evite `max-width` de quebra (o `painel-agencia` usa `@media (max-width:820px)` — padrão
  errado, vira remendo a cada dispositivo novo; migrar para `min-width`).

---

## 4. Stack: Next.js vs JS puro na Hostinger

### 4.1 A realidade da Hostinger (facts)

| Hospedagem | Roda o quê | Como sobe |
|---|---|---|
| **Compartilhada (qualquer plano hPanel)** | PHP + **arquivos estáticos** (HTML/CSS/JS) | FTP/File Manager no `public_html` |
| **Compartilhada com Node.js** (produto "Node.js" do hPanel) | app Node (Next SSR, Express) | zip → painel Node.js; porta fixa 3000; precisa manter o app vivo |
| **VPS** | tudo | Docker/PM2 |

A regra de ouro: **quanto menos runtime, mais barato, mais rápido e menos dor de cabeça.**
O site do cliente não pode "cair" porque um processo Node morreu na madrugada.

### 4.2 A decisão por tipo de projeto

| Tipo de projeto | Stack recomendada | Por quê |
|---|---|---|
| **Landing Page / One Page / Site Institucional** | **Next.js + Tailwind com `output: "export"`** (estático) → sobe a pasta `out/` no `public_html` | Mesmo padrão de build do Concept, mas **zero runtime**: TTFB mínimo, cache infinito, funciona em qualquer plano, não cai nunca |
| Site muito simples (1–2 págs) pra cliente que vai mexer nos arquivos | **Vanilla HTML/CSS/JS** (sem build) | Cliente pode abrir/editar no cPanel sem ferramenta; sem node_modules pra manutenir |
| Site com runtime de verdade: login, painel, API própria, proxy de form server-side, redirects por host | **Next.js SSR (app Node na Hostinger)** — como o Concept já roda | Quando o servidor é obrigatório |
| Formulário de contato (quase todos os clientes) | **PHP `mail()`/PHPMailer** ou **Google Apps Script** (já usado no evertonbrito.com) | Form não precisa de app Node; navegador → mesma origem → PHP/Sheets |

### 4.3 Next.js `output: "export"` — passo a passo (padrão da agência)

```ts
// next.config.ts
const nextConfig = { output: "export", images: { unoptimized: true } };
```

1. `npm run build` → gera `out/`.
2. Subir o conteúdo de `out/` em `public_html/` (ou `public_html/<subpasta>`).
3. `.htaccess` básico (compressão + cache + segurança):
   ```apache
   <IfModule mod_deflate.c>AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml</IfModule>
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType image/webp "access plus 1 month"
     ExpiresByType text/css "access plus 1 week"
   </IfModule>
   ```
4. Form de contato: `public_html/contato-envia.php` apontando para o form (ou Apps Script).

> **Quando NÃO usar export:** o site precisa de `redirects()` no Next (troca do www → usa
> .htaccess na Hostinger, resolve igual), cookies/server, auth, API própria, ou conteúdo
> dinâmico por usuário. Aí sim: app Node.

### 4.4 Critérios de escolha (pergunte ao projeto, não ao gosto)

1. **Precisa de servidor?** (login, painel, dados por usuário, API) → SSR. Senão → estático.
2. **Quem edita depois?** Cliente abre arquivos no cPanel? → vanilla ou estático simples.
3. **Orçamento de hospedagem do cliente?** Plano barato → estático (cabe em qualquer um).
4. **SEO precisa de velocidade?** Estático vence sempre (é o que o Google mede).
5. **Quantas páginas?** 1–5 → LP/One Page estática. Site com 10+ págs → institucional estático
   com gerador (Next export) ou vanilla com include.
6. **Form do cliente aparece como?** API de terceiro (Sheets/hub) → estático. E-mail do próprio
   domínio → PHP simples.

**Padrão da agência:** *todo* site de cliente Default → **Next.js export estático**.
SSR e vanilla são exceções justificadas, nunca o ponto de partida.

---

## 5. Gate de qualidade (pós-projeto)

Roda antes de entregar ao cliente, em **todos** os projetos. Saída: lista de "passe" ou
"reprovado no item X" com a captura (screenshot + número da métrica).

### 5.1 Responsividade
- [ ] Sem scroll horizontal em 320 · 360 · 390 · 480 · 768 · 1024 · 1280 · 1440
- [ ] Navegação colapsada e utilizável ≤ 1024 (menu fecha, backdrop, alvos ≥ 44px)
- [ ] Formulários: inputs ≥ 16px, largura total, sem zoom iOS ao focar
- [ ] Vídeo: `playsinline muted autoplay` no mobile
- [ ] Fotos: sem salto de layout (aspect-ratio/dimensões setadas)

### 5.2 Acessibilidade
- [ ] Heading hierarchy ok (1 h1, sem pular)
- [ ] `alt` em todas as imagens informativas
- [ ] Contraste AA nos textos (checar com axe/DevTools)
- [ ] `focus-visible` visível em todos os interativos
- [ ] `prefers-reduced-motion` respeitado

### 5.3 SEO
- [ ] `<title>` + `meta description` únicos por página
- [ ] Open Graph + favicon
- [ ] `sitemap.xml` + `robots.txt`
- [ ] Dados estruturados (LocalBusiness/Schema) quando aplicável
- [ ] URL canônica + 301 www → sem-www

### 5.4 Performance
- [ ] LCP < 2.5s · CLS < 0.1 · INP < 200ms (PageSpeed móvel, 4G)
- [ ] Imagens comprimidas (WebP/AVIF, < 300KB as maiores)
- [ ] JS gzip < 200KB (LP)

### 5.5 Segurança
- [ ] HTTPS forçado (+ HSTS se o host permitir)
- [ ] Headers básicos: `X-Content-Type-Options: nosniff`, `X-Frame-Options DENY`, CSP moderada
- [ ] Nada de credencial/API key no repositório (sempre `.env.local` + `.gitignore`)

### 5.6 Conteúdo e UX
- [ ] Zero lorem ipsum; textos reais do cliente no ar
- [ ] 404 funcional (não quebra, volta pra home)
- [ ] Mensagens de erro/sucesso nos forms (estado visível)
- [ ] Links externos abrem corretamente; tel/whats clicáveis no mobile

---

## 6. Checklist de auditoria rápida (2 minutos)

Quando alguém perguntar "esse site está bom?", rodar isto antes de opinar:

```
1. Abre em 360px → scroll horizontal? SIM/NÃO
2. Alvos de toque ≥ 44px? SIM/NÃO
3. Título divide em >20 palavras num celular? (fonte muito grande/fixa) SIM/NÃO
4. fotos pulam de lugar ao carregar (CLS)? SIM/NÃO
5. Input clica no iPhone e dá zoom? SIM/NÃO
6. Menu funciona com 1 dedo sem depender de hover? SIM/NÃO
7. PageSpeed mobile: LCP/CLS/INP verdes? SIM/NÃO
```
> 1 "NÃO" → não chegou no nível da agência. Encaminhar para o gate completo.

---

*Memória de sessão — 2026-09-24: criado este manual; auditoria inicial: Concept ✔ (referência de mobile-first), evertonbrito.com ✔ (fluido, revisar overflow-x oculto no body), painel-agencia ❌ (1 breakpoint max-width), agencia-app ❌ (sidebar fixa desktop-only). evertonbrito.com estava fora do ar (521 Cloudflare — túnel inexistente para o domínio principal).*