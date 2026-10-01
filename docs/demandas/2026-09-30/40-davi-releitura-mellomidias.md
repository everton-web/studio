# Davi · Releitura Mello Mídias (LP com motion)

Pedido do Everton (30/09): analisar https://mellomidias.com.br/ e fazer uma **releitura** no padrão de desenvolvimento da agência, com scroll effects, GSAP, motion, Remotion e microinterações.

**O que é:** peça de releitura (portfólio e material de prospecção). Não vai ao ar, não tem cliente contratado. Nada de publicar, enviar ou fazer push.

## Onde trabalhar

- Projeto já criado e com dependências instaladas: `D:/studio/sites/mellomidias-releitura/`
- **NÃO rode `npm install`** (o sandbox não tem rede). Já instalado: `next@16.3.5`, `react@19.2.8`, `tailwindcss@4`, `gsap@3.15` (com `ScrollTrigger` e `SplitText`, que agora são gratuitos), `@gsap/react` (`useGSAP`), `lenis`, `motion` (import de `motion/react`), `remotion` + `@remotion/cli`.
- **Fontes locais** (não use `next/font/google`, precisa de rede): `public/fonts/inter-var.woff2` (texto) e `public/fonts/inter-tight-var.woff2` (títulos). Declare com `@font-face` no `globals.css`.
- `next.config.ts` já está com `output: "export"` (padrão da agência para LP). Nada de API route nem server action.
- Referência: prints em `D:/studio/design/releituras/mellomidias/ref/` (`desktop-01..07.png`, `celular-01..09.png`, `_folha-desktop.png`) e todo o texto em `ref/conteudo.txt`.
- Manual da agência: `D:/studio/CRITERIOS-UI-E-RESPONSIVIDADE.md` (tokens, mobile-first, gate de qualidade).

## Diagnóstico da referência (Orion)

Mantém o que funciona:
- Identidade escura com vermelho intenso e a faixa de luz vermelha. Oferta clara ("Plano Estratégico"), nicho claro (clínicas odontológicas), números de prova (+R$10M, +40 clínicas, +4 anos).

O que a releitura resolve:
1. Hero estático e genérico: o fundo é uma imagem, os números não têm peso e o CTA é pequeno.
2. O formulário fica longe do topo e repete o pedido do hero sem progressão.
3. Os logos de parceiros entram cortados e há um vazio grande antes do método.
4. O método são 4 cards chapados, sem sensação de processo.
5. A prova de resultado é uma foto de celular com prints ilegíveis.
6. "Quem somos" e o fundador têm pouca força; o texto é um bloco corrido.
7. Rodapé quase vazio.

## Estrutura e motion por seção

Tokens: fundo `#0a0507`, superfície `#140a0c`, vermelho principal `#e1141e` (confira contra os prints e ajuste para o vermelho deles), texto `#f4efef`, texto secundário 65% de opacidade. Raio 20px nos cards. Espaçamento em escala de 4.

1. **Hero**
   - Fundo: vídeo em loop gerado no Remotion (ver abaixo) com `poster` para o primeiro quadro. Enquanto o vídeo não existe, use o poster/gradiente; o componente deve funcionar sem o arquivo.
   - Título com `SplitText` por linha, entrando com máscara de baixo para cima (stagger). A palavra "Plano Estratégico" em vermelho.
   - Números (+R$10M, +40, +4 anos) com contador animado quando entram na tela.
   - CTA principal grande com efeito magnético no desktop (segue levemente o cursor) e brilho que percorre o botão no hover.
   - Selo "Exclusivo para clínicas odontológicas" com borda animada.
2. **Faixa de parceiros**: marquee infinito com os nomes como wordmarks em texto (não há logos), pausa no hover, máscara de fade nas bordas.
3. **Manifesto**: uma frase forte do diagnóstico ("Sem diagnóstico, qualquer ação é achismo.") com as palavras acendendo conforme o scroll (scrub).
4. **Método** (4 etapas: Diagnóstico, Tráfego Estratégico, Processo Comercial, Inteligência de Dados):
   - Desktop: seção fixa (pin) com scroll horizontal pelas 4 etapas e uma linha de progresso que se desenha.
   - Celular (< 768px): sem pin; cards verticais com reveal e a linha de progresso vertical.
5. **Resultados**: "Números reais. Clínicas reais." Refaça a prova como interface, não como foto: um celular desenhado em CSS com bolhas de conversa de WhatsApp entrando em sequência (os textos que aparecem nos prints, por exemplo "Clínica odontológica fechando orçamentos de 25k"). Contadores grandes ao lado.
6. **Quem somos / fundador**: texto em 3 pontos curtos (os 3 diferenciais), foto do Gabriel Mello como placeholder elegante (gradiente com iniciais e legenda "foto do fundador"), revelação com máscara (clip-path) no scroll e leve parallax.
7. **Plano Estratégico (formulário)**: formulário em 2 passos com barra de progresso (1: nome e WhatsApp; 2: Instagram, faturamento, investe em tráfego). Máscara de telefone, validação inline, microinteração de sucesso. Sem envio real: no envio mostra a tela de sucesso. Os 3 passos "como funciona" ao lado.
8. **FAQ**: acordeão com altura animada (motion), um aberto por vez, use as perguntas do `conteudo.txt`.
9. **CTA final + rodapé**: bloco com a faixa de luz vermelha animada, CTA, e rodapé completo (logo em texto, links das seções, Instagram, aviso de direitos).

Global:
- **Lenis** para scroll suave, integrado ao `ScrollTrigger` (`lenis.on("scroll", ScrollTrigger.update)` e `gsap.ticker`).
- Cursor customizado sutil no desktop (ponto que cresce sobre links e botões); desligado em toque.
- Barra de progresso de leitura no topo.
- Header fixo que some ao descer e volta ao subir, com fundo em blur.
- Tudo respeita `prefers-reduced-motion` (sem pin, sem scrub, só fade).
- Animar só `transform` e `opacity`. Nada de layout shift. `useGSAP` com escopo e limpeza.

## Remotion

Crie `remotion/index.ts` (registerRoot) e `remotion/Root.tsx` com a composição **`HeroLoop`**: 1920x1080, 30 fps, 180 frames (6 s), **loop perfeito** (o último quadro emenda no primeiro). Faixas de luz vermelha fluindo sobre fundo quase preto, como na referência, desenhadas com SVG/gradientes e `interpolate`/`Math.sin` por frame. Sem texto no vídeo. O Orion renderiza com `npm run render:hero`, `render:hero-webm` e `render:poster` (os arquivos saem em `public/media/`). Não tente renderizar.

## Copy

- Use o conteúdo de `ref/conteudo.txt`. Pode encurtar e reorganizar, sem inventar números nem resultados.
- **Sem travessão** (— ou –) em nenhum texto. **Sem viúvas**: use `text-wrap: balance` nos títulos e `text-wrap: pretty` nos parágrafos.
- Corrija os erros da referência ("Anda não invisto" → "Ainda não invisto", "RS50k" → "R$ 50k").

## Qualidade (gate antes de responder)

1. `npx tsc --noEmit` sem erros e `npm run build` gerando `out/`.
2. Sem rolagem horizontal em 375px; toques com no mínimo 44px.
3. Contraste AA nos textos.
4. Nenhum `console.error` esperado; nada de `any` sem motivo.
5. Mobile-first: escreva o celular primeiro.

## Proibido

`git push`, publicar, apagar arquivos fora de `sites/mellomidias-releitura/`, mexer em `.env`, instalar pacotes.

## Entrega

Relatório no formato padrão, com a lista de arquivos e o que não deu para fazer.
