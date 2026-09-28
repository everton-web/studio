# Story — Relatório Público Interativo do Lead

## 1. Título e metadados

- **Título:** Relatório público interativo por lead (`evertonbrito.com/relatorio/<slug>`)
- **Status:** pronta para o Davi
- **Dono:** Everton
- **Prazo:** a definir
- **Origem:** `docs/demandas/2026-09-28/5-lia-relatorio-publico.md`

## 2. Objetivo

**Um único goal de conversão:** o lead abrir o link que o Everton mandou, reconhecer as próprias dores (clicando nelas) e terminar **marcando uma conversa com o Everton no WhatsApp**.

Tudo o que está na página existe para conduzir o lead até o CTA final de WhatsApp. Nada de navegação para outras páginas do site, formulário próprio ou área de contato — só o botão de WhatsApp.

## 3. Escopo

### Incluído nesta entrega
- Rota estática `/relatorio/[slug]` no site (`apps/site`), servida com `noindex`.
- Uma única página por lead com, nesta ordem:
  1. Cabeçalho com identidade da agência (Everton Brito / Studio) e o nome do lead.
  2. Bloco **"O que está faltando"** — resumo das `faltas` da análise (agrupadas, com prioridade).
  3. Bloco **"Marque o que dói"** — itens de dor clicáveis (checklist interativo).
  4. Bloco **"Quanto isso pode estar custando"** — cálculo que aparece ao marcar itens, com as premissas visíveis e a observação de que é estimativa.
  5. CTA final para WhatsApp do Everton.

### NÃO incluído nesta entrega
- Qualquer página de edição do relatório dentro do site (a revisão é feita pela plataforma/vault, antes de publicar).
- Painel de métricas de quem abriu o link (rastreio de abertura do lead) — é pendência futura.
- Login/autenticação, multi-idioma (EN/PT), dark mode.
- Página de "análise completa" além do resumo público.

## 4. Fluxo do Everton (gerar → revisar → publicar → enviar link)

1. **Gerar:** na plataforma, Everton roda a análise do lead (já existe) e aciona **"Exportar relatório público"**, escolhendo o **slug** (`white-odonto`) e o **segmento** (se não vier automático). A plataforma grava `apps/site/src/data/relatorios/<slug>.json` (JSON enxuto, sem dados sensíveis).
2. **Revisar:** Everton (ou Caio) confere o que aparece — nome da empresa, faltas, nota, redes. Se algo estiver errado, reajusta na análise e reexporta.
3. **Publicar:** o Theo dá deploy do site (Hostinger) com o novo JSON. A rota `/relatorio/<slug>` passa a existir automaticamente (estática, `noindex`).
4. **Enviar link:** Everton copia `evertonbrito.com/relatorio/white-odonto` e manda ao lead pelo WhatsApp (junto com a mensagem de abordagem do Caio).

## 5. Critérios de aceite (verificáveis)

1. **Rota estática:** `/relatorio/[slug]` é renderizada estaticamente (SSG) a partir de `src/data/relatorios/*.json`; sem chamada a API externa em tempo de requisição.
2. **noindex:** a página responde com `<meta name="robots" content="noindex, nofollow">` (ou header equivalente) e **não** aparece em `sitemap.ts`.
3. **Responsivo:** a página não quebra em **375px**, **1280px** e **1920px** (sem scroll horizontal, textos sem cortes, CTA visível sem rolar até o fim no mobile).
4. **Identidade visual:** usa a identidade da agência (fonte DM Sans, paleta e componentes do site atual), sem parecer uma página de relatório genérica.
5. **Itens de dor clicáveis:** cada dor é um item selecionável (toggle). Marcar/desmarcar funciona por toque e mouse, sem depender de JS externo.
6. **Cálculo aparece:** ao marcar uma ou mais dores, o bloco "quanto deixa de ganhar" atualiza em tempo real, mostrando **a fórmula e as premissas do segmento** (buscas/mês, taxa de clique, conversão, ticket) — nunca um número solto.
7. **Honestidade do cálculo:** o bloco exibe explicitamente o texto de "estimativa de marketing, não promessa de receita".
8. **CTA WhatsApp:** botão único no final abre `https://wa.me/5571999261967` (número do Everton) com mensagem pré-preenchida citando a empresa.
9. **JSON enxuto:** o JSON por lead contém **apenas** campos públicos definidos na seção 8. **Não contém** `contatos`, e-mails, telefones, WhatsApp do lead, `redes.whatsapp`, `links.whatsapp` nem `avaliacoesRecentes`.
10. **Fallback 404:** slug inexistente (`/relatorio/nao-existe`) devolve **404** (página `not-found`), sem crash e sem página vazia.
11. **Slug seguro:** o exportador valida/normaliza o slug para `[a-z0-9-]+` (minúsculo, sem acentos/espaços).

## 6. Modelo de cálculo — "quanto deixa de ganhar"

### Fórmula (honesta, com 4 termos visíveis)

```
Receita deixada na mesa/mês ≈
  buscas locais/mês
  × taxa de clique média          (quem encontra → entra no site/perfil)
  × taxa de conversão conservadora (quem entra → vira cliente)
  × ticket médio do segmento
```

> **Aviso obrigatório na tela:** "Estimativa de marketing para fins ilustrativos — não é promessa de receita nem garantia de resultado." Os números refletem o que o negócio **potencialmente deixa de capturar** por não ter uma presença digital completa, não o que ele vai faturar.

### Premissas por segmento

| Segmento | Buscas locais/mês | Taxa de clique | Conversão (conservadora) | Ticket médio | Exemplo (receita/mês) |
|---|---|---|---|---|---|
| Odontologia | 600 | 15% | 5% | R$ 800 | 600 × 0,15 × 0,05 × 800 = **R$ 3.600** |
| Clínica médica / estética | 800 | 15% | 5% | R$ 350 | 800 × 0,15 × 0,05 × 350 = **R$ 2.100** |
| Restaurante | 2.000 | 20% | 8% | R$ 80 | 2.000 × 0,20 × 0,08 × 80 = **R$ 2.560** |
| Hospedagem / pousada | 700 | 20% | 3% | R$ 450 | 700 × 0,20 × 0,03 × 450 = **R$ 1.890** |

- Quando o segmento não for um dos 4 (`outro`), usar uma linha genérica conservadora: **buscas 500, clique 15%, conversão 5%, ticket R$ 250** → **R$ 938/mês**, com a mesma ressalva.
- O cálculo é uma **faixa por segmento**, não por lead individual. A página usa o segmento informado no JSON (seção 8) para escolher a linha da tabela.

## 7. Itens de dor (lista fechada, clicáveis)

Cada dor mapeia para um ou mais tipos de `falta` da análise (campo `faltas[].item`/`area`). O lead marca as que sente; cada marca liga a dor à(s) falta(s) correspondente(s).

1. **"Poucos clientes me encontram pelo Google"** ↔ `google`: nota baixa, poucas avaliações, perfil sem site, perfil sem horário, status fora do normal.
2. **"Não sei de onde vêm as visitas do meu site"** ↔ `rastreio`: sem Google Analytics, sem Pixel da Meta.
3. **"Meu site não funciona bem no celular"** ↔ `site`: não adaptado ao celular, conteúdo só via JavaScript, site lento.
4. **"As pessoas me procuram mas não conseguem falar comigo"** ↔ `contato`: sem WhatsApp visível, site sem formulário, perfil do Google sem telefone.
5. **"Meu site está fora do ar ou dá erro"** ↔ `site`: site fora do ar, sem HTTPS.
6. **"Minhas redes sociais não estão ligadas ao meu site"** ↔ `redes`: Instagram não encontrado no site.
7. **"Meu perfil no Google está incompleto/desatualizado"** ↔ `google`: sem horário, poucas fotos, sem site no perfil, última avaliação antiga.
8. **"Meu link aparece feio quando compartilho no WhatsApp/Instagram"** ↔ `site`: título fraco, sem descrição, sem imagem de compartilhamento (og:image).

## 8. Dados do JSON público enxuto (contrato)

### Decisão de arquitetura (consolidada)

**Endosso a proposta do Orion, com dois ajustes.** A plataforma **exporta** um JSON enxuto por lead para `apps/site/src/data/relatorios/<slug>.json`; o site gera a rota estática `/relatorio/[slug]` importando esses arquivos no build (via `generateStaticParams`) e serve com `noindex`. Justificativa: a análise mora no vault/PC e não deve ser copiada inteira para o repo público; o JSON enxuto é o único "contrato" entre plataforma e site, e o build estático dispensa qualquer runtime/banco.

Ajustes:
1. **Slug normalizado** no exportador (`[a-z0-9-]`) e gravado como `slug` dentro do próprio JSON.
2. **Campo `segmento` obrigatório** no JSON (não existe em `Analise`): o exportador deriva das `google.categorias` ou o Everton escolhe na hora de exportar — é ele que seleciona a linha da tabela de cálculo.

### Contrato (tipos derivados de `Analise`, apenas dados públicos)

```ts
type RelatorioPublico = {
  slug: string;                 // "white-odonto" — [a-z0-9-]+
  empresa: string;              // nome do lead (ex.: "White Odonto")
  segmento: "odontologia" | "clinica" | "restaurante" | "hospedagem" | "outro";
  cidade: string;               // derivada do lead (ex.: "Salvador")
  geradoEm: string;             // "YYYY-MM-DD"
  pontuacao: number;            // 0–100
  google: {
    nota: number | null;        // nota pública do Google
    avaliacoes: number | null;  // total público de avaliações
    categorias: string[];       // tipos públicos (ex.: ["dentista"])
    mapsUrl: string;            // link público do Maps
  };
  site: {
    url: string;                // site público do lead
    ok: boolean;
  };
  redes: {                      // SÓ URLs públicas de redes — SEM whatsapp do lead
    instagram: string;
    facebook: string;
    tiktok: string;
    linkedin: string;
    youtube: string;
  };
  faltas: Array<{ area: "google" | "site" | "redes" | "rastreio" | "contato";
                   prioridade: "alta" | "media" | "baixa";
                   item: string;
                   porque: string }>;
  fortes: string[];
};
```

**Explicitamente EXCLUÍDO do JSON** (vem de `Analise` mas é sensível ou desnecessário):
- `contatos` (e-mails e telefones), `redes.whatsapp`, `links.whatsapp`, `google.telefone`, `google.avaliacoesRecentes`, `google.horario`, `google.siteNoPerfil`, `links.buscaGoogle`, `links.buscaInstagram`.

O número do **Everton** no CTA (5571999261967) é uma **constante do site**, não um dado do lead — nunca sai do JSON do lead.

## 9. Divisão por persona (quem faz o quê)

- **Davi (design/UI):** layout e visual da página `/relatorio/[slug]` (header com identidade, blocos de faltas, checklist de dores, bloco de cálculo, CTA WhatsApp), garantindo os breakpoints 375/1280/1920.
- **Theo (dev/deploy):** rota Next estática `[slug]` + `generateStaticParams` + `noindex` + `not-found`; e o **exportador na plataforma** que grava o JSON enxuto em `apps/site/src/data/relatorios/<slug>.json` (com slug normalizado e sem dados sensíveis).
- **Caio (conteúdo):** textos dos itens de dor, os textos das premissas/"aviso de estimativa" e a mensagem de CTA que o Everton manda junto com o link.
- **Everton (aprovação):** aprovar o tom comercial, os segmentos/tickets da tabela e o texto final do CTA.

## 10. Definição de pronto

O Davi pode passar para o Theo (deploy) quando:
- A página estiver construída e responsiva nos 3 breakpoints, sem quebras.
- Os itens de dor estiverem clicáveis e o cálculo atualizar com premissas visíveis.
- O CTA apontar para o WhatsApp do Everton.
- Os critérios 1–11 da seção 5 estiverem atendidos (validados por QA), incluindo `noindex`, 404 e a ausência de dados sensíveis no JSON.

## 11. Fora de escopo / pendências

- Rastreio de quem abriu o relatório (métricas de abertura para o Everton) — futuro, fora desta story.
- Edição do relatório direto no site (é feita na plataforma/vault).
- Integração automática do exportador com o fluxo de prospecção (por ora é acionado manualmente pelo Everton).
- Multi-idioma (EN/PT) e qualquer outra página além de `/relatorio/[slug]`.
