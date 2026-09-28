# Davi — mockups do redesign do evertonbrito.com (APROVADO: fases 0, 2, 3 e 6 + hero com a foto + 404)

Base: sua análise `docs/design/analise-raulvbrito.md` + skill `~/.claude/skills/skill-mockup-jrmk/SKILL.md` (Padrão JRMK + Adaptação Studio).
Recado do Everton: "o site do Raul tem toda uma animação, micro interação" → **movimento e micro-interação são a espinha do redesign, não acabamento.** Sem travessão (—) nos textos, sem viúvas (text-wrap balance/pretty).

## Entregar em `design/site-redesign/` (HTML/CSS/JS autossuficientes, fontes/cores do site atual: `apps/site/src/app/globals.css`, preto #040404, laranja #FF4000)
1. `hero.html` — **hero com a foto do Everton** (`assets/everton-recorte.webp`, PNG transparente já sem fundo, 1024×1024):
   - foto **bem esmaecida**, fundida no fundo do site (sem retângulo, sem fundo branco): escura, dessaturada, ~20–35% de presença, com fade inferior;
   - **interação das luzes do site com a foto (seja criativo)** — proposta base, melhore se tiver ideia melhor:
     a) o cursor é uma **luz quente** (laranja #FF4000 → âmbar): onde ela passa, uma 2ª camada da foto, colorida e iluminada, é revelada por máscara radial (spotlight), o resto continua na penumbra;
     b) **luz de recorte (rim light)** laranja no contorno da silhueta do lado virado para o cursor (drop-shadow/filtro deslocado pelo vetor cursor→foto);
     c) **grade de pontos** no fundo (como a "torch" do Raul) que acende perto da luz;
     d) sem cursor (celular/ocioso): a luz orbita devagar sozinha; no celular pode seguir o giroscópio ou a rolagem;
     e) ao rolar, a luz diminui e a foto sobe em leve parallax;
     f) `prefers-reduced-motion`: luz estática suave, sem animação.
   - Texto do hero: mantenha o atual do site ("Crio experiências digitais estratégicas que conectam sua essência ao público certo.") com reveal por palavra/linha. CTA "Solicite um orçamento". Tarja Mês do Zeca acima de tudo (até 30/09).
2. `menu.html` — fase 2: header mínimo (marca + botão "menu" em pílula) + **menu overlay em tela cheia** tipográfico com reveal escalonado, hover com micro-interação, idioma PT/EN.
3. `servicos.html` — fase 3: serviços numerados 01–04 (+ consultoria/mentoria), preços com a promo (riscado + novo) mantidos, hover com micro-interação.
4. `rodape.html` — fase 6: CTA monumental ("Vamos construir seu site?" como placeholder de copy) com reveal por máscara, e-mail, WhatsApp, redes, voltar ao topo.
5. `404.html` — página de erro no mesmo idioma visual (ex.: a luz "procurando" algo no escuro, grade de pontos, headline curta e humana, botão voltar ao início).
6. `index.html` — índice linkando os 5.
Cada peça em desktop 1440 e mobile 390. Performance: nada de bibliotecas pesadas; CSS/JS nativo (pode usar requestAnimationFrame). Não mexa em `apps/`. Não commite.
