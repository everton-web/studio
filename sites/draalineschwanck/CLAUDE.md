# Terminal da Dra. Aline Schwanck — projeto do site

> Este folder = o projeto do novo site da Dra. Aline (sites/draalineschwanck).
> Abrir um agente aqui é abrir o **terminal da Aline**. Escopo: **Davi (design)**,
> com apoio do Theo (deploy Hostinger).

## O que já existe (do site real, não apagar)

- `assets/dra-aline.webp` — foto real da dra. (hero)
- `assets/logo.png` — logo (Oral Sin / logotipo sem fundo do site atual)
- `assets/texto-circular.png` — selo circular com o nome

## O que construir (do zero — o orquestra APAGOU o scaffold anterior)

**Site institucional one-page, vanilla (HTML/CSS/JS), mobile-first — substitui o WordPress.**
Identidade (extraída do site atual, não inventar): navy `#0A2747` + teal `#0fa38f` + Plus Jakarta Sans + dourado sutil.

Seções:
1. Hero: "Volte a sorrir com confiança e comer tudo que gosta." + foto `dra-aline.webp` + selo + CTA WhatsApp
2. Proposta: "Livre-se das dentaduras que machucam…" (cópia real do site)
3. Serviços: **Implantes · Protocolos · Dentaduras**
4. Sobre a Dra. Aline (cópia curta + foto)
5. Prova (números/depoimentos placeholder honestos `[depoimento]`)
6. Contato: WhatsApp **5548991105505** em TODOS os CTAs · endereço/horários como `[preencher]` (nunca inventar)

Regras técnicas: mobile até 360px, sem scroll horizontal, inputs ≥16px, alvos ≥44px, `prefers-reduced-motion`, JS vanilla (menu + reveal + WhatsApp).

## Entregar (Daví)

- [ ] index.html + assets/style.css + assets/main.js (do zero, premium)
- [ ] Validar no `python -m http.server 4200` na pasta
- [ ] Deixar placeholders claros onde só a dra. fornece dado
- [ ] Recado no PAINEL DOS AGENTES (vault/SaaS/Agentes/painel.md) + status da demanda na fila

## Contexto

- Conteúdo extraído do backup WP: `40 Comercial/Clientes/Dra Aline Schwanck.md` (vault)
- Regras da agência: CLAUDE.md (raiz) · skill ui-studio · IA flutuante (barata p/ rotina, Claude p/ decisão/entrega)