# Theo — botão de WhatsApp nos cards da aba Comercial (plataforma)

App: `apps/plataforma` (Next 16). Arquivo principal: `src/components/pipeline.tsx` (função `msgAbordagem`, `waLink`, `LeadCard`, modal de ficha e modal "abordar").

## O que mudar
1. **Botão "falar no WhatsApp" em todos os cards ativos que tenham número** (whatsapp ou contato), nos estágios 0 (Prospecção), 1 (Aprovação) e 2 (Contato) — hoje só aparece no estágio 2. Nos estágios 3–5 continua como está.
   - O botão abre o **modal "abordar"** já existente (validação humana antes de enviar — o Everton edita e só então clica para abrir o WhatsApp). Nunca enviar direto.
2. **Texto da mensagem** = "Etapa 1 — Primeiro contato" de `docs/demandas/2026-09-28/mensagens-whatsapp.md`:
   - enquanto a promoção valer (até `2026-09-30T23:59:59-03:00`) usar a **versão (a) com Mês do Zeca**; depois, automaticamente a **versão (b)**.
   - `{empresa}` = nome do lead; `{segmento}` = segmento do lead (se vazio, "empresas"); `{ponto}` = **1ª falta de prioridade alta** da análise de presença do lead (GET `/api/analise?id=<id>` → `analise.faltas[0].item`, reescrito em linguagem natural e minúscula, ex.: "o site de vocês não tem botão de WhatsApp"); se não houver análise, usar a frase genérica "vi uma oportunidade de fortalecer a presença de vocês na internet".
   - Se `lead.mensagem` (mensagem salva) existir, ela tem prioridade, como já é hoje.
3. No modal "abordar", adicionar abaixo do texto um seletor pequeno com as outras mensagens do arquivo: **Oferta**, **Follow-up 1**, **Follow-up 2** (preenchidas com os mesmos placeholders; oferta com/sem 20% conforme a data).
4. Coloque as mensagens num módulo próprio `src/lib/mensagens.ts` (textos + função `montarMensagem(tipo, lead, analise, agora)`), para o Caio poder editar texto sem mexer em componente.

## Regras
- Celular primeiro: botão com ≥ 44px de altura, texto "WhatsApp".
- `npx tsc --noEmit` e `npm run build` em `apps/plataforma` precisam passar.
- Não commitar, não reiniciar o app, não mexer em `apps/site` (outro Theo está nele).
