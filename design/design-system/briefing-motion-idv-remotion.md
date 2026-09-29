# Briefing de motion: apresentação da nova IDV de Everton Brito

Crie um vídeo em **Remotion** (React) que apresenta a nova identidade visual de **Everton Brito** (web designer, marca *everton.*, site evertonbrito.com). O vídeo é para Instagram, Behance e para o topo do portfólio. Siga este documento à risca e não invente cores, fontes ou efeitos fora dele.

## 1. Entregas

| Composição | Formato | FPS | Duração |
|---|---|---|---|
| `IdvHorizontal` | 1920×1080 | 30 | 30s (900 frames) |
| `IdvVertical` | 1080×1920 | 30 | 30s (900 frames), mesmas cenas reenquadradas |

- Um projeto Remotion único com as duas composições em `src/Root.tsx`.
- Cenas como componentes separados dentro de `<Series>`, cada uma com a duração em frames indicada no roteiro.
- Tokens da marca num arquivo `src/tokens.ts`, usados em todo lugar (nada de cor solta no código).
- Fonte com `@remotion/google-fonts/Inter` (pesos 400, 500, 600).
- Sem trilha embutida: deixe um `<Audio>` comentado apontando para `public/trilha.mp3`.

## 2. Tokens da marca (use exatamente estes valores)

```ts
export const cor = {
  bg: "#0a0a0b",        // carvão, fundo de tudo
  bgSoft: "#0e0e10",
  card: "#151517",
  elevado: "#1d1d20",
  texto: "#edede8",     // osso, branco quente (nunca #fff puro no texto)
  texto2: "#98988f",    // pedra, parágrafos
  mudo: "rgba(237,237,232,0.34)",
  linha: "rgba(255,255,255,0.055)",
  laranja: "#FF4000",   // única cor de ação
  brilho: "rgba(255,64,0,0.15)",
};
export const ease = { out: [0.16, 1, 0.3, 1], inOut: [0.76, 0, 0.24, 1] } as const;
```

- **Proporção de cor na tela:** cerca de 70% preto, 14% cartão, 10% osso, 4% pedra e só 2% laranja. O laranja é raro de propósito, e é isso que faz ele chamar atenção.
- **Tipografia:** só Inter. Títulos com peso 500, `letterSpacing: "-0.075em"`, `lineHeight: 1`. Rótulos em caixa alta, 500, `letterSpacing: "0.14em"`, tamanho pequeno.
- **Destaque:** em cada frase, uma única palavra em laranja. Sem itálico, sem serifa, sem sublinhado.
- **Textura:** grade de pontos de 26px (ponto de 1px em `rgba(255,255,255,0.05)`) em todo o fundo e um grão leve (ruído com opacidade 0,08).

### Símbolo (SVG oficial, viewBox 0 0 100 100)

```svg
<path d="M50 10 Q58.6 45 84.6 70 Q50 60 15.4 70 Q41.4 45 50 10Z" fill="currentColor"/>
```

Triângulo de lados curvos, como a ponta de um lápis ou uma vela. A assinatura é `everton.` em minúsculas, peso 600, **com o ponto final** (o ponto faz parte do nome).

## 3. Linguagem de movimento

- **Easing padrão:** `Easing.bezier(0.16, 1, 0.3, 1)` em todas as entradas. Use `Easing.bezier(0.76, 0, 0.24, 1)` só em transições entre cenas.
- **Line reveal (assinatura do site):** cada linha de título fica dentro de uma máscara (`overflow: hidden`, com `paddingBottom: "0.18em"` e `marginBottom: "-0.18em"` para não cortar g, p e j). A linha sobe de `translateY(110%)` para `0` em 33 frames (1,1s), com atraso de 4 frames entre linhas.
- **Blocos:** sobem 20px e aparecem em 27 frames (0,9s).
- **Tocha:** um brilho radial laranja (`cor.brilho`, 500px) que desliza devagar pelo fundo, como luz de luminária.
- **Borda acesa:** nos cartões, um gradiente radial laranja de 260px acende a borda de 1px e passa de um cartão para o vizinho.
- **Proibido:** bounce, rotação 3D chamativa, glitch, flash branco, partículas, zoom brusco. O movimento revela conteúdo, nunca enfeita.
- Use `interpolate` com `extrapolateRight: "clamp"` e `spring({ config: { damping: 200 } })` quando precisar de mola suave.

## 4. Roteiro (30s)

| # | Tempo | Frames | Cena |
|---|---|---|---|
| 1 | 0–3s | 0–90 | **Abertura.** Fundo carvão com a grade de pontos. A tocha laranja acende no canto esquerdo. O símbolo nasce no centro: o path é desenhado (stroke-dashoffset) em 1s e depois é preenchido de osso. |
| 2 | 3–6s | 90–180 | **Assinatura.** O símbolo desliza para a esquerda e `everton.` aparece letra a letra ao lado. O ponto final entra por último, em laranja, com um leve pulso. Rótulo abaixo: `WEB DESIGNER`. |
| 3 | 6–10s | 180–300 | **Manifesto.** Line reveal em duas linhas: "Crio experiências digitais **estratégicas**" / "que conectam sua essência ao público certo." Só "estratégicas" em laranja. |
| 4 | 10–14s | 300–420 | **Cor.** Cinco faixas verticais entram da esquerda na proporção real (70/14/10/4/2): carvão, cartão, osso, pedra e laranja. A faixa laranja, a mais fina, cresce por último. Em cada faixa, nome e hex em rótulo pequeno: Carvão #0a0a0b, Cartão #151517, Osso #edede8, Pedra #98988f, Laranja #FF4000. |
| 5 | 14–18s | 420–540 | **Tipografia.** "Aa" gigante em Inter 500. Em seguida a escala: Hero, Display, XL, Corpo e Rótulo, empilhados com line reveal. Legenda: "Uma família. Espaçamento de −0,075em." |
| 6 | 18–23s | 540–690 | **Componentes.** Um bento de 4 cartões (Landing Page, One Page, Site Institucional, Página de Vendas) monta em cascata. Uma luz laranja percorre o grid e acende as bordas, como o hover do site. Depois, o botão pílula osso "Solicite um orçamento ↗" entra e a seta desliza 2px. |
| 7 | 23–27s | 690–810 | **Movimento.** Três demonstrações lado a lado: a curva de easing sendo traçada, o line reveal e a tocha sobre a grade. Rótulos: EASE OUT, LINE REVEAL, TOCHA. |
| 8 | 27–30s | 810–900 | **Fechamento.** Tudo se apaga para o carvão. O símbolo e `everton.` voltam ao centro. Abaixo: `evertonbrito.com`. O ponto final pisca uma vez em laranja e o vídeo termina parado 1s. |

**Versão vertical:** mesmas cenas, com os títulos quebrados em mais linhas, as faixas de cor na horizontal (empilhadas) e o bento em 2 colunas.

## 5. Textos (usar exatamente assim)

- WEB DESIGNER
- Crio experiências digitais estratégicas / que conectam sua essência ao público certo.
- Uma família. Espaçamento de −0,075em.
- Landing Page · One Page · Site Institucional · Página de Vendas
- Solicite um orçamento
- evertonbrito.com

**Regras de escrita:** nunca use travessão (— ou –). Nenhuma palavra pode ficar sozinha na última linha de um título: quebre as linhas à mão. Português do Brasil, com acentos.

## 6. Checklist antes de entregar

- [ ] Nenhuma cor fora de `tokens.ts`; laranja em no máximo uma palavra ou elemento por cena.
- [ ] Nenhum g, p ou j cortado nas máscaras de reveal.
- [ ] Todas as entradas com o easing (0.16, 1, 0.3, 1).
- [ ] Texto legível pausando em qualquer frame (título parado por pelo menos 1,5s depois de revelado).
- [ ] As duas composições renderizam: `npx remotion render IdvHorizontal` e `npx remotion render IdvVertical`.

Referência viva do sistema completo: design system do evertonbrito.com (marca, cor, tipografia, espaço, componentes, movimento e escrita).
