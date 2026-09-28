# Análise de Arquitetura de Design — raulvbrito.com → evertonbrito.com

> **Nota de escopo:** análise de **ARQUITETURA** (estrutura, ritmo, grid, hierarquia, navegação, interações, tratamento visual). **Referência de princípios, não cópia.**
>
> É **PROIBIDO** copiar textos, imagens, marca, logo, nomes ou código-fonte/CSS do site referência. Tudo abaixo foi extraído como *princípio* e reescrito com minhas palavras, com valores aproximados apenas como guia de escala/ritmo — nunca como valores a copiar.
>
> Preparado por: **Davi** (design) · Para: **Orion** (orquestração) e **Everton** (aprovação).

---

## 1. Resumo executivo

O raulvbrito.com é um portfólio de "Creative Technologist" que trata a **própria página como uma peça de ofício**: o hero não é um banner estático, é uma *interface simulada de geração por IA* (prompt → imagem/vídeo) que demonstra o serviço vendido. A estrutura é **enxuta e vertical** — apenas 4 seções (Hero, Services, Work, About) + footer — sem barras de navegação tradicionais, com um único menu hamburger, cursor customizado e um sistema de **reveal por scroll** consistente em todas as seções.

O que vale importar para o Everton, em ordem de impacto:

1. **Herói que prova, não promete** — substituir o texto de atividade por uma demonstração/statement de resultado.
2. **Ritmo tipográfico de contraste extremo** — headline gigante com tracking negativo (-0.075em) + label micro uppercase (0.14em), quase sem pesos intermediários.
3. **Portfólio como protagonista** — 8 cards com **vídeo/live-preview no hover**, badges de reconhecimento e um card "ver todos" no final do grid.
4. **Footer-CTA monumental** — um "let's talk" gigante com máscara de reveal, em vez de um rodapé burocrático.
5. **Micro-interações de alta costura** — cursor customizado com label contextual, dot-grid de fundo com "torch", blob WebGL que segue o pointer, nav com blur progressivo.

Nada disso exige copiar o visual dele: o vocabulário do Everton (preto `#040404` + laranja `#FF4000` + triângulo côncavo) já é mais forte e distinto. A importação é de **estrutura e motion**, não de estética.

---

## 2. Mapa da estrutura (seções na ordem)

| # | Seção | `id` | Papel | Observações de arquitetura |
|---|---|---|---|---|
| 0 | **Hero** | `top` | Impacto + demonstração do ofício | Nome em 2 linhas ("Raul" / "Brito") com máscara de reveal. Intro em 1–2 frases. Abaixo, uma **grade interativa** (prompt + células de imagem + célula de vídeo, conectadas por "cabos" SVG, com scrubber de gerações). É o serviço em ação. |
| 1 | **Services** | `services` | Entrega / oferta | Eyebrow + headline com reveal linha-a-linha (`stx-line`). Deck com **4 cards numerados** (01–04), cada um com título, lead e tags. Sem grid de 6 cards idênticos — hierarquia clara. |
| 2 | **Work / Gallery** | `work` | Prova (portfólio) | Grid com **8 projetos** (`pcard`). Cada card: imagem estática → **vídeo no hover** (`preload=none`, lazy), overlay com categoria/título, **badge de prêmio** (medalha com brilho) em alguns. Um card final **"See all"** (ver todos) fecha o grid. |
| 3 | **About** | `about` | Posicionamento | Eyebrow "About" + **um único parágrafo editorial** com preenchimento palavra-a-palavra no scroll (`sf-word`). Curto, não é bio — é statement. |
| — | **Footer** | `contact` | Ação / fechamento | CTA gigante "let's talk" com máscara. Acima: email + "Start a project →" + selo de contratação (Contra). Abaixo: barra fina com copyright, links legal/cookies e "back to top". |

**Sobrepostos (fora do fluxo de seções):** dot-grid de fundo com "torch" (`dotgrid`), cursor customizado (`cursor-dot` + label), blob WebGL que segue o pointer (`floating-blob`), blur progressivo na nav (`nav-blur`), dock de tema (toggle auto/light/dark).

### Navegação

- **Header mínimo e fixo**: logo/marca à esquerda (âncora `#top`), à direita **apenas um botão hamburger** com rótulo textual "menu" + um ponto. **Não há menu horizontal de links.**
- O menu abre em **overlay fullscreen** (montado via JS após o clique) — provável navegação por itens grandes (typography-first), não uma lista discreta.
- **Blur progressivo**: conforme o scroll avança, o fundo do header ganha desfoque em camadas (3 layers + scrim) controladas por uma variável de progresso (`--nav-p`). Sutil e caro.
- Âncoras suaves (`#top`, `#services`, `#work`, `#about`, `#contact`).

### CTAs (onde e como)

| Local | CTA | Formato |
|---|---|---|
| Hero | (nenhum CTA explícito — a interação *é* a conversão) | interface demonstrativa |
| Services | nenhum | cards de informação pura |
| Work | "See all" | card final do grid, com seta |
| Footer | **"Start a project →"** + email + "Hire me" | CTA primário real + CTA gigante "let's talk" |

Padrão: **um único CTA forte no fim da página**, não CTAs espalhados. O site deixa o visitante percorrer a prova e só "atacar" no footer.

---

## 3. Sistema visual extraído

### 3.1 Grid e larguras

| Aspecto | Valor aproximado | Leitura |
|---|---|---|
| Container máx | `1640px` | Largo — o site "respira" em telas grandes |
| Gutter lateral | `clamp(1.1rem, 4.2vw, 4.5rem)` | Gutter fluido que cresce com a viewport |
| Altura do header | `96px` | Header mais alto que o padrão 64–72px |
| Padding vertical de seção | `clamp(5rem, 12vh, 11rem)` | Ritmo vertical generoso |
| Grid de trabalho | `gallery__grid` (1 col mobile → 2+ desktop) | Cards grandes, densidade baixa |
| Deck de serviços | 4 colunas (CSS var `--n:4`) | Auto-fill/repeat |
| Breakpoints | 380 / 480 / 560 / 640 / 720 / 768 / 900 / 1024 / 1280 | Granularidade fina no mobile |

**Princípio:** container largo + gutter fluido + poucas colunas de alto valor = sensação "galeria/cinema", não "template SaaS".

### 3.2 Escala tipográfica

- **Uma única família**: Inter em todos os papéis (display, corpo, labels, mono). Monótipo — sem misturar serif/grotesk.
- **Tracking muito negativo nas grandes**: headline `-0.075em`, display tight `-0.06em`. **Tracking positivo só nas micro-labels**: caps `+0.14em`, wide `+0.04em`.
- **Line-height comprimido nas grandes**: `1.0` (display) e `1.05` (snug); corpo em `1.42`.

| Nível | Tamanho | Tracking | Uso inferido |
|---|---|---|---|
| Hero | `clamp(2.9rem, 11vw, 11rem)` | -0.075em | Nome em 2 linhas |
| Display | `clamp(2.6rem, 9vw, 8.5rem)` | -0.075em | Headlines de seção, "let's talk" |
| XL | `clamp(2rem, 5.2vw, 4.25rem)` | tight | Statements |
| LG | `clamp(1.5rem, 3vw, 2.4rem)` | snug | Títulos de cards |
| MD | `clamp(1.15rem, 1.6vw, 1.6rem)` | — | Leads |
| Body | `clamp(1rem, 1.05vw, 1.15rem)` | 0 | Corpo |
| SM / XS / Micro | `0.9rem / 0.78rem / 0.68rem` | caps `+0.14em` | Eyebrows, labels, meta |

**Princípio:** a hierarquia é criada por **contraste de escala + tracking**, não por variação de família ou peso. Praticamente não há pesos intermediários visíveis — ou é gigante e tight, ou é micro e espaçado.

### 3.3 Espaçamentos

- `--section-pad: clamp(5rem, 12vh, 11rem)` — padding vertical uniforme e generoso em todas as seções.
- Gutter fluido (acima). Header de 96px. Ritmo vertical consistente — as seções não variam de densidade bruscamente.
- O footer gigante ("let's talk") ocupa quase uma viewport inteira de altura, servindo de "fecho monumental".

### 3.4 Cores

Paleta essencialmente **monocromática quente** (preto quente + creme), com um acento *iridescente* usado com parcimônia (apenas no gradiente de destaque e micro-detalhes):

| Papel | Valor aproximado | Nota |
|---|---|---|
| Fundo principal | `#0a0a0b` (preto levemente quente) | idem Everton (`#040404`, ainda mais escuro) |
| Superfícies (1/2/3) | `#0e0e10` / `#151517` / `#1d1d20` | escada sutil de elevação |
| Texto principal | `#edede8` (off-white quente) | Everton: `#FBFBFB` |
| Texto secundário | `#98988f` (cinza quente) | Everton: `#AAAAAA` |
| Texto faint/ghost | `34%` / `12%` de opacidade | para meta e fantasmas |
| **Acento** | `#e9e4da` (creme) + oxblood `#7c2218` | **NÃO importar** — Everton já tem laranja |
| Acento iridescente | gradiente teal→green→blue→purple | efeito "AI/holográfico"; usar com cautela |
| Linhas/bordas | branco a 5.5% / 10% / 22% | três intensidades de hairline |

**Princípio:** fundo quase-preto, texto off-white, **um único acento cromático**, e todo o resto em tons de cinza-quente com opacidade baixa. Alto contraste texto/fundo; acento usado como pontuação, não como preenchimento.

### 3.5 Cantos / raios

| Token | Valor | Uso |
|---|---|---|
| `r-sm` | `8px` | elementos pequenos |
| `r-card` | `14px` | cards |
| `r-lg` | `22px` | blocos maiores |
| `r-pill` | `999px` | pills, botões |

Raios contidos (8–22px) — nada de "glassmorphism" exagerado; a elegância vem do preto + hairline, não de bordas muito arredondadas.

### 3.6 Motion e micro-interações

| Recurso | Descrição (princípio) |
|---|---|
| **Cursor customizado** | dot global + **label textual contextual** (muda sobre links/ícones: ex. "view"). Estados via `data-cursor`. |
| **Dot-grid com torch** | fundo pontilhado sutil com uma "lanterna" que ilumina/segue o pointer. |
| **Blob WebGL** | blob (Three.js) que segue o mouse com parallax e suavização. |
| **Nav blur progressivo** | fundo do header ganha blur conforme scroll (progresso mapeado a camadas). |
| **Reveal por linha** | headlines revelam linha-a-linha com máscara (`stx-line`, `line-mask`). |
| **Reveal por palavra** | parágrafos preenchem palavra-a-palavra no scroll (`sf-word`). |
| **Hover de projeto** | imagem estática → **vídeo autoplay** no hover (lazy, `preload=none`). |
| **Badges com brilho** | medalha de prêmio com micro-brilho animado (shine). |
| **Easings** | `cubic-bezier(.16,1,.3,1)` (saída suave), `(.76,0,.24,1)` (inout). Dur 0.3/0.6/0.9/1.2s. |
| **Acessibilidade** | `prefers-reduced-motion: reduce` respeitado; `aria-hidden` nos decorativos; labels reais nos controles. |

### 3.7 Tratamento de imagens

- **Thumbnails webp** pré-gerados em múltiplas resoluções (`/projects/.thumbs/...`), lazy-load.
- **Vídeos** com `loop playsinline preload="none"` — só carregam no hover; thumb estático como primeiro frame.
- Aspect ratios variados (landscape, square, ultrawide) conforme a célula — não um ratio único engessado.
- Overlays de gradiente escuro (de baixo para cima) para legibilidade de categoria/título.
- Grain/ruído sutil em placeholders de mídia (`media-ph__grain`).

---

## 4. Comparativo com evertonbrito.com

| Dimensão | raulvbrito.com | evertonbrito.com (atual) | Recomendação (inspirada, sem copiar) |
|---|---|---|---|
| **Hero** | Interface demonstrativa do ofício (IA) | Headline + subtitle + badge + CTA + parallax | Manter statement bold; **substituir o texto de atividade por resultado**; reduzir para 1 CTA; manter parallax como assinatura |
| **Navegação** | Header mínimo + hamburger overlay | Header fixo com logo + toggle idioma (sem menu de links) | Manter header do Everton; **adicionar menu** (hoje não há nav de âncoras) com overlay tipográfico |
| **Services** | 4 cards numerados, hierarquia clara | 4 cards core + bloco especial, com preço/tags | Manter preços + promo; **numerar os cards** (01–04) e dar hierarchy visual core vs. complementar |
| **Portfólio** | 8 cards com vídeo no hover + badge de prêmio + "see all" | 1 destaque + grid 2col (imagem estática, hover parallax) | Manter destaque + parallax; **adicionar preview no hover** (vídeo/GIF se houver) e um card "ver todos" |
| **About** | Statement editorial curto, fill palavra-a-palavra | Editorial com destaque + card lateral (anos/skills) | Manter card lateral; **encurtar o texto** para um statement de posicionamento |
| **Prova social** | (ausente — usa prêmios nos cards) | Metrics (200+ / 7+ / 100%) | Manter Metrics; **enriquecer os cards** com reconhecimento/resultado |
| **Footer/CTA** | "let's talk" gigante + email + CTA | Logo + tagline + sociais + copyright | **Adicionar headline-CTA monumental** no topo do footer; manter sociais |
| **Cursor** | Dot + label contextual | Dot mix-blend-difference (cresce em hover) | Manter cursor do Everton; opcional: label contextual no hover de projeto |
| **Fundo decorativo** | Dot-grid com torch + blob WebGL | Sólido `#040404` | **Adicionar dot-grid sutil** (opcional) — barato e eleva o "cinema" |
| **Tema** | Dark/light + toggle | Dark only | Manter dark only (identidade); light theme é escopo futuro |
| **Tipografia** | Inter única, tracking -0.075em | DM Sans, escala display/H1/H2 | Manter DM Sans; **apertar tracking nas headlines** e reforçar contraste micro-label |
| **Container** | 1640px + gutter fluido | 1280px + gutter 32px fixo | **Alargar container** (ex. 1400–1520px) e tornar gutter fluido |
| **Cantos** | 8/14/22px | 12/16/20px | Manter os tokens atuais (já próximos) |
| **Motion reveal** | Por linha / por palavra | Reveal + blur por bloco (AnimatedSection) | Manter; **adicionar reveal por palavra** no statement do Hero |

### O que MANTER (obrigatório, não negociável)

1. **Marca "everton."** + **triângulo côncavo** (`M50 10 Q58.6 45 84.6 70 ...`).
2. **Cor laranja `#FF4000`** como acento único (não trocar por creme/iridescente do referência).
3. **Conteúdo existente**: serviços, métricas, portfólio (7 projetos), formulário de contato com WhatsApp.
4. **i18n PT/EN** completo (todo texto passa por `src/lib/i18n.ts`).
5. **Promo "Mês do Zeca" 20% OFF** via `PromoBanner` (top + inline) e `usePromo`/`promo.ts` (lógica de countdown + desconto).
6. **Paleta preto-profundo + tipografia DM Sans** (identidade já consolidada).
7. **Fluxo narrativo de 7 beats** do DESIGN-SYSTEM.md (Impacto → Credibilidade → Posicionamento → Entrega → Prova → Confiança → Ação).

---

## 5. Plano de redesign em etapas (para APROVAÇÃO — nada implementado ainda)

> **Aviso:** este é um **plano**. Nenhuma etapa abaixo deve ser codificada antes da aprovação explícita do Everton (via Orion). Cada fase é independente e reversível.

### Fase 0 — Fundações de ritmo (tokens + motion)
- **Ajustar tokens** em `globals.css`: tracking mais negativo nas headlines, gutter fluido (`clamp`), container 1400–1520px, manter laranja/preto intactos.
- **Adicionar reveal por palavra** como variante do `AnimatedSection` (reuso, sem reescrever).
- **Dot-grid de fundo sutil** (opcional, atrás de `--bg`, com `aria-hidden`).
- *Riscos:* baixo. *Trava:* aprovação dos novos valores de tracking/container.

### Fase 1 — Hero (Impacto)
- Reescrever headline para **statement de resultado** (i18n PT/EN) — não mais "atividade".
- 1 CTA apenas; manter parallax e badge; remover/cortar elementos competindo.
- *Riscos:* texto é decisão de marca — precisa do Everton. *Trava:* copy aprovada.

### Fase 2 — Navegação + header
- Adicionar **menu overlay tipográfico** (âncoras `#hero/#about/#services/#portfolio/#contact`) que abre do hamburger.
- Manter `PromoBanner top` **acima** de tudo (não esconder sob o overlay).
- *Riscos:* interação com promo e com `LanguageToggle`. *Trava:* definir se menu tem idioma embutido.

### Fase 3 — Services (Entrega)
- Numerar os cards core (01–04) e hierarquizar core vs. complementar.
- **Manter preços + desconto da promo** (riscado/novo valor) intactos.
- *Riscos:* baixo (estrutura interna do componente). *Trava:* nenhuma crítica.

### Fase 4 — Portfolio (Prova)
- Adicionar **preview no hover** (vídeo/GIF quando houver; senão zoom/grain).
- Adicionar **card "ver todos"** no fim do grid.
- Badge de reconhecimento/resultado por card (se houver dados).
- *Riscos:* performance de vídeos; criar assets. *Trava:* disponibilidade de vídeo/GIF por projeto.

### Fase 5 — About (Posicionamento)
- Encurtar para **statement editorial** (1 parágrafo) + manter card lateral (anos/skills).
- *Riscos:* perda de conteúdo. *Trava:* copy aprovada.

### Fase 6 — Footer-CTA monumental
- **Headline gigante** no topo do footer (ex. "Vamos construir seu site?") com máscara de reveal, substituindo/estendendo a tagline atual.
- Manter logo, sociais, copyright, voltar ao topo.
- *Riscos:* baixo. *Trava:* copy aprovada.

### Fase 7 — Polimento (cursor, micro-interações, a11y)
- Label contextual no cursor sobre projetos (opcional).
- Verificar `prefers-reduced-motion`, contraste, e foco em teclado.
- *Riscos:* regressões visuais. *Trava:* QA gate final.

### Ordem de execução e dependências
F0 (tokens/motion) → F1 (Hero) → F2 (nav) → F3 (Services) → F4 (Portfolio) → F5 (About) → F6 (Footer) → F7 (polimento).
Cada fase entrega valor isolado e pode ser **commitada/testada separadamente** (nada em `master` até aprovação — regra da Solução de Abas).

### O que NÃO pode ser perdido (guard-rails contínuos)
- Marca "everton." + triângulo côncavo + laranja `#FF4000`.
- i18n PT/EN (qualquer novo texto entra em `src/lib/i18n.ts`).
- Promo "Mês do Zeca" (PromoBanner top/inline + countdown + desconto 20%).
- Portfólio do Everton (7 projetos, dados em `src/data/projects.ts`).
- Formulário de contato → WhatsApp (lead não pode quebrar).

---

## 6. Riscos e guard-rails

### Anti-cópia
- **Zero** texto, imagem, marca, logo, nome ou CSS copiado. Tudo foi traduzido em princípio + valores de *escala* (que são padrão de mercado).
- Não usar a fonte/tratamento "iridescente" nem a paleta creme/oxblood dele — o Everton tem identidade própria (laranja + preto + triângulo).
- O que se importa é **arquitetura** (ordem das seções, papel de cada uma, contraste tipográfico, motion de reveal, CTA único no fechamento) — não o "look".

### Não perder marca/laranja/i18n/promo/portfólio
- Qualquer mudança de cor/fonte passa pelo gate de identidade (laranja `#FF4000` é intocável).
- Todo texto novo é i18n (PT/EN). Nunca hardcode string.
- A lógica de promo (`promo.ts`, `usePromo`, `PromoBanner`) é isolada e não deve ser tocada — apenas posicionada.
- O portfólio vem de `projects.ts` e não deve ter dados removidos.

### Riscos de execução
- **Performance**: vídeos no hover exigem lazy-load agressivo (`preload="none"`); senão degrada o Lighthouse (target 95+).
- **A11y**: `prefers-reduced-motion` deve desligar reveals/cursor/blob; decorativos com `aria-hidden`.
- **Regressão de promo**: mudanças no header não podem ocultar o `PromoBanner top`.
- **Decisão de copy**: hero, about e footer-CTA dependem de texto aprovado pelo Everton — são fases "travadas por copy".

---

*Fim da análise. Próximo passo: Everton aprova o plano (ou ajusta fases) antes de qualquer código em `apps/site`.*
