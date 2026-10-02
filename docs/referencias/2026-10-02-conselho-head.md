# Referência: página do Conselho Head (Head Academy · Jessica Laine)

Gravação de tela do Everton em 02/10/2026. Quadros em `design/referencias/gravacao-2026-10-02/` (`_folha.png`).
Análise do time: Davi (design e motion), Redator (copy), Caio (oferta). Consolidado pelo Orion.

## Espinha dorsal
Problema de excesso (cursos, formações, "378 conteúdos salvos"), solução de escassez: um caminho só.
Sequência: prova social cedo → espelho do excesso → reenquadre ("não é falta de conhecimento") → pergunta interna ("tá, mas o que eu faço agora?") → degraus ("importa qual é o próximo") → produto como direção → plano individual → ritual semanal ("um lugar à mesa") → âncora R$ 31.000+ relativizada → autoridade → FAQ → CTA de conversa.

## Frases que funcionam (padrão, não para copiar)
- Número exato e constrangedor ("salvou 378 conteúdos").
- Inversão de crença ("talvez não seja falta de conhecimento").
- Resultado concreto sem prometer faturamento ("você sai sabendo o que fazer, em qual ordem e por quê").
- Âncora que se desmonta ("o maior valor não está na quantidade de coisa").

## Oferta
Degraus por estágio com meta, plano de ação individual, encontros semanais com tema, âncora de valor, autoridade com números, FAQ, CTA repetido para conversa (não checkout).
Ausentes: preço, escassez, garantia, prazo, carga horária. Os degraus "R$5k → R$10k" roçam promessa de resultado.

## Design e motion (como faríamos)
- Paleta preto, violeta elétrico, lime; caixa alta bold; troca de fundo marca capítulo.
- Cards flutuantes em parallax (GSAP scrub): custo baixo.
- Frases linha a linha (SplitText): baixo.
- Túnel 3D com moeda, fixo em degraus: sequência de imagens em canvas renderizada (Blender/Remotion), médio. R3F de verdade não vale.
- Tabuleiro isométrico com post-its: CSS 3D + stagger, médio-baixo.
- Mesa em perspectiva com assentos acendendo: SVG, médio.
- Números grandes com contador: baixo.
- Excesso: túnel prende scroll demais, corpo cinza ~12px ilegível no escuro, seções repetidas; precisa de fallback no celular e reduced motion.

## Aplicação
**Mentoria do Everton (público: quem quer viver de web design):**
1. Espelho: "Você já sabe Figma, já viu tutorial de Next e ainda não fechou o primeiro cliente."
2. Reenquadre: "O que falta não é mais uma ferramenta. É saber qual site vender primeiro."
3. Pergunta: "Tá, mas quem eu procuro amanhã de manhã?"
4. Degraus (2 no máximo, com o triângulo da marca no lugar da moeda): "Do freela de indicação ao cliente que paga pelo segundo site."
5. Método: "Você sai sabendo o que oferecer, para quem e em que ordem."
6. Prova de processo, não de faturamento: sites no ar, clientes reais (Concept), processo aberto.
7. Ritual: "Uma conversa por semana com quem faz isso todo dia."
8. Fechamento: "Seu próximo site começa antes do código." CTA único de conversa.
Comercial: vagas reais por turma (o que cabe em 1h/dia), garantia de entrega do plano (não de faturamento), valor das entregas ancorando o preço.

**Escada da agência (público: dono de negócio), separada da mentoria:**
Diagnóstico gratuito → Plano de ação → Site/LP → Site + tráfego + relatório mensal → Parceria contínua. Cada degrau aponta o próximo.

**Sites de clientes:** frase-dor com chips flutuantes do contexto do cliente; processo em degraus com scroll fixo; objeto isométrico em CSS 3D como "como funciona".
