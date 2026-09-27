---
titulo: Handoff — Agentes de Pré/Pós-Projeto e de Portfólio (Behance)
autor: Everton
data: 2026-09-19
origem: sessão de construção da LP Concept Implantes Dentários
tags:
  - agentes
  - skills
  - handoff
---

# Handoff — Agentes de Pré/Pós-Projeto e de Portfólio

> Documento para abrir uma **conversa nova** na pasta certa (onde ficam os agentes da agência)
> sem precisar do histórico da sessão da Concept. Tudo que importa daquela sessão está aqui.
>
> **Como usar:** mova este arquivo para a pasta ideal, abra uma sessão nova lá e cole o
> prompt da seção 8.

---

## 1. O que a nova conversa precisa fazer

Criar **dois agentes** para a conta do Everton (uso em qualquer projeto futuro):

1. **Agente de Pré e Pós-Projeto** — antes do projeto, estrutura tudo a partir do briefing
   (ou até antes dele); depois do projeto, audita segurança, SEO, otimização, responsividade
   e rastreamento, e corrige.
2. **Agente de Portfólio (Behance)** — ao finalizar um projeto, gera o case pronto para
   publicar no Behance, no padrão dos cases que o Everton já tem lá.

Antes de criar do zero, **olhar os agentes que já existem** (seção 6): talvez o certo seja
evoluir o Davi/Theo e a Mia em vez de criar papéis novos.

---

## 2. Onde as coisas estão

| O quê | Onde |
|---|---|
| Plano Mestre da agência | `PROJETO DIGITAL/Plano Mestre - Marca Digital.md` |
| Resumo do briefing da Concept | `PROJETO DIGITAL/Concept/resumo-projeto-concept.md` |
| Código do site Concept | `PROJETO DIGITAL/Concept/concept-site/` (Next.js 16, Tailwind 4) |
| Repositório | github.com/everton-web/Concept-Implantes-Dentarios (privado; push com o token da conta `everton-web`) |
| Produção | https://conceptimplantesdentarios.com.br (Hostinger, app Node.js, deploy por zip) |
| Ambiente de teste | https://concept-site-kappa.vercel.app (`npx vercel deploy --prod`) |
| Pacote do projeto | `~/Downloads/concept-site.zip` (gerado com `git archive`) |
| Vídeos originais de pacientes | `~/Downloads/Videos pacientes/` |
| Skills do usuário no Claude Code | `~/.claude/skills/` (hoje só `graphify`) |
| Agentes do usuário no Claude Code | `~/.claude/agents/` (vazio) |

---

## 3. O case Concept (matéria-prima dos dois agentes)

**Cliente:** Concept Implantes Dentários, Camboriú/SC. Responsável técnica Dra. Simone H., CRO-SC 19661.
**Entrega:** One Page de conversão, preto #101010 + dourado, Manrope, Lucide, motion por CSS scroll-timeline.

Seções: Hero → Marquee → Marca → Sobre → Diferenciais (Dra. Simone em foto cheia) →
Especialidades → Método → Resultados (depoimentos em vídeo num iPhone em CSS + Google +
galeria antes/depois com lightbox) → Agende → Localização → FAQ → Rodapé.

Destaques que valem mostrar no portfólio:
- **Hero:** mosaico isométrico de sorrisos (3 colunas em 3D deslizando na vertical, ordem
  aleatória a cada visita, fotos espelhadas para parecer mais variedade) + símbolo gigante da
  marca vetorizado, em branco a 7%, cortado pela seção.
- **Depoimentos em vídeo:** iPhone desenhado em CSS. No desktop a lista ao lado controla;
  no celular, play grande no aparelho, setas, pontinhos e swipe; barra de controle só aparece tocando.
- **Antes/depois:** 5 casos reais em 4 categorias, lightbox, chamada "Clique nas imagens".
- **Nota Google real** (4,5) com selo e avaliações.
- **Formulário em modal** (nome, sobrenome, WhatsApp) → planilha Google (Apps Script) → WhatsApp.
- **404** centralizada sobre o mosaico esmaecido.

---

## 4. Agente 1 — Pré e Pós-Projeto

### 4.1 Pré-projeto (briefing ou antes)

**Método de entrada: entrevista no estilo `/grill-me`** (aihero.dev/skills-grill-me):
- Transformar uma ideia solta em decisões, por **rodadas de perguntas** que cobrem todo o
  "front" de decisões em aberto de uma vez, cada rodada construída sobre as respostas anteriores.
- O usuário conduz e discorda; passividade é o modo de falha.
- Separar o que se decide conversando do que só se decide prototipando ("ungrillable").
- Não entrar em plano/solução cedo demais.

**Saída esperada (estrutura do projeto):**
1. Objetivo de negócio e conversão principal (ex.: agendamento pelo WhatsApp).
2. Mapa de seções e hierarquia (um H1, H2 por seção).
3. Copy: fonte, voz, regras (ver 4.3) e lacunas.
4. **Checklist de material a pedir ao cliente:** logo em SVG/PNG grande, símbolo em vetor,
   fotos (profissional, fachada, ambiente), antes/depois com autorização, vídeos de depoimento,
   dados da empresa (endereço, horários, telefone, CRO/CRM), link do Google, Instagram, domínio.
5. Direção visual e design system (tokens de cor, tipografia, espaçamento, motion).
6. Stack e hospedagem (se a hospedagem não roda Node, decidir isso **antes**: rota de API e
   cabeçalhos dependem de servidor).
7. Plano de SEO local (título, descrição, palavras-chave, dados estruturados, OG).
8. Plano de conversão e rastreamento (CTA único, formulário, GTM, evento `generate_lead`).

### 4.2 Pós-projeto (auditoria, com o que foi feito na Concept como checklist)

**Segurança**
- Cabeçalhos: HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy, CSP moderada (frame-ancestors, object-src, base-uri, form-action),
  `poweredByHeader: false`. CSP de scripts é evitada porque quebra as tags do GTM.
- Formulário nunca posta direto num webhook exposto: passa por rota do site (`/api/lead`) com
  checagem de origem, UA de robô, **honeypot**, **tempo mínimo** (2,5 s), validação
  (tamanho, sem links, telefone 10–11 dígitos) e limite por IP **folgado** (30/10 min, porque
  equipe testando do mesmo Wi-Fi não pode ser barrada). Robô recebe "ok" falso.
  Reserva: se a rota der 5xx, grava direto na planilha; o WhatsApp abre sempre.
- Nada de dado pessoal em URL ou no dataLayer.

**SEO**
- `metadataBase` via `NEXT_PUBLIC_SITE_URL` (definida **antes** do build na hospedagem).
- Título local, descrição, canonical, Open Graph + Twitter com imagem 1200×630.
- JSON-LD: `Dentist`/`LocalBusiness` (endereço, horários, telefone, serviços, sameAs) e
  `FAQPage`. **Sem** aggregateRating próprio (Google não aceita avaliação autoatribuída).
- `robots.ts`, `sitemap.ts`, 404 com status 404 real e `noindex`.
- Redirecionamento www → domínio principal (301/308).
- Um H1 por página, H2 por seção.

**Otimização**
- Remover fontes não usadas; imagens em WebP no tamanho de uso; vídeos 540×960, webm VP9 +
  mp4 fallback, `preload="none"` e play só quando visíveis; cache de mídia 1 dia + SWR.
- HDR de iPhone precisa de tonemap para SDR (zscale + tonemap) senão fica lavado.

**Rastreamento**
- Confirmar em produção: container GTM carregado (`google_tag_manager[ID]`), `dataLayer`
  com gtm.js/dom/load, noscript no body, evento `generate_lead` no envio.

**Verificação** (sempre com prova, não suposição): curl dos cabeçalhos, 404, robots,
sitemap, canonical/OG, rotas de rejeição da API; navegador em 1280, 1920 e 375 px;
console sem erros; teste real do formulário **feito pelo cliente/usuário** (não gravar
lead falso na planilha do cliente).

### 4.3 Regras de design e copy aprendidas na Concept (viram padrão)

- Sem travessão na copy (usar vírgula). Voz da marca, não da profissional.
- Nunca chamar marca de "nova" se o cliente já tem anos de prática.
- CTA único ("Agende sua consulta"); botão flutuante verde de WhatsApp abre o formulário.
- Sem menu no topo em One Page. Linhas balanceadas (`text-wrap: balance`).
- Preto profundo (#101010), não cinza. Evitar degradê "amador"/duro: quedas longas e suaves,
  de preferência "assadas" na imagem, não máscara CSS curta.
- Responsividade de controles: um controle por tamanho de tela (ex.: lista no desktop,
  controles no aparelho no celular).
- Explicar antes de mexer quando o usuário pedir ("não faz nada até me explicar").
- Todo ajuste: commit + push + deploy, e dizer o commit e o link.

---

## 5. Agente 2 — Portfólio para o Behance

**Referências do padrão do Everton:**
- https://www.behance.net/gallery/245345571/Logo-Renato-Cardoso
- https://www.behance.net/gallery/241985859/AGFP-Transportes-One-Page
- https://www.behance.net/gallery/241985255/Dental-Class-One-Page
- https://www.behance.net/gallery/217732821/Allmeida-midias-Landing-Page
- https://www.behance.net/gallery/198869793/iPower-Support-Shop-Lab-One-Page

**Primeiro passo da nova conversa:** analisar esses 5 cases e extrair o padrão real
(ordem dos blocos, estilo de mockup, quantidade de texto, tipo de capa, paleta de fundo).

**Entregáveis por projeto:**
- Estrutura do case (capa, apresentação, desafio, solução, telas desktop/mobile em mockup,
  detalhes de seções, paleta, tipografia, resultado).
- Imagens nos tamanhos do Behance (capa 808×632; módulos com 1400 px de largura), geradas a
  partir de capturas do site e composições de mockup.
- Textos: título, descrição, tags, ferramentas, créditos.

**Limitação:** o Behance não tem API pública de publicação. O agente entrega tudo pronto
(imagens numeradas na ordem + textos para colar) e o upload é manual.

**Primeiro case a gerar:** Concept Implantes Dentários (seção 3).

---

## 6. Relação com a agência de 8 agentes (Plano Mestre, seção 7.1)

| Agente existente | Ligação provável |
|---|---|
| Davi — Design e Web | Pré-projeto (estrutura, design system) e parte da auditoria visual/responsiva |
| Theo — Dev e Dados | Auditoria técnica (segurança, SEO técnico, deploy) |
| Mia — Conteúdo | Case de portfólio e posts a partir dele |
| Caio — Comercial | O case alimenta a prova social das propostas |

Decidir na nova conversa: **criar dois agentes novos** ou **dar essas skills ao Davi/Theo e à Mia**.
Respeitar a regra do Plano Mestre: "estrutura não é entrega". O agente de portfólio gira o
volante (entrego → case → conteúdo → prova social), então tem prioridade.

---

## 7. Decisões em aberto

1. **Onde instalar:** Claude Code (`~/.claude/agents` + `~/.claude/skills`, valem em qualquer
   projeto desta máquina) e/ou claude.ai (skills enviadas em Configurações).
2. **Agente 1, pós-projeto:** só aponta problemas ou já corrige?
3. **Agente 2:** gera as imagens do case ou só estrutura + textos (imagens no Figma/Photoshop)?
4. Novos agentes ou evolução do Davi/Theo/Mia?

---

## 8. Prompt para abrir a nova conversa

```
Leia o arquivo "Handoff - Agentes Pré-Pós Projeto e Portfólio.md" e o "Plano Mestre - Marca Digital.md".
Quero criar os dois agentes descritos no handoff. Antes de escrever qualquer arquivo:
1) veja os agentes que já existem na agência e diga se faz mais sentido criar novos ou evoluir os atuais;
2) analise os 5 cases do Behance listados e me mostre o padrão que encontrou;
3) me faça as perguntas da seção 7 em uma única rodada.
```
