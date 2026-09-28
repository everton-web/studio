# Davi — layout do relatório público do lead (evertonbrito.com/relatorio/<empresa>)

Leia a story: `docs/stories/relatorio-publico.story.md` (objetivo, itens de dor, cálculo de "quanto deixa de ganhar", contrato do JSON).
Contexto novo: o link vai ser enviado ao lead **depois** que ele responder a 1ª mensagem — a página precisa gerar **conexão e confiança**, não expor a empresa. Linguagem de **oportunidade**, nunca de "erro" ou "problema de vocês".

## Entregar (protótipo, não é código de produção)
`design/relatorio/prototipo.html` — um HTML autossuficiente, mobile-first (375px) e ok em desktop, com dados de exemplo da **White Odonto** (use `vault/SaaS/Prospeccao/analises/white-odonto.json`):
1. Topo: "Diagnóstico de presença digital · {empresa}" + data + assinatura Everton (evertonbrito.com), visual do site do Everton (escuro, premium; ver `apps/site/DESIGN-SYSTEM.md` e `apps/site/src/app/globals.css`).
2. Nota de presença (0–100) com leitura positiva ("o que já está forte" antes do que falta).
3. "Oportunidades" (as faltas reescritas como oportunidade).
4. Bloco interativo: a pessoa marca as dores que sente (checkbox grandes, tocáveis) e um contador mostra "quanto pode estar deixando de ganhar por mês" (estimativa com premissas visíveis e editáveis: ticket médio, buscas/mês), JS simples inline.
5. CTA final: WhatsApp do Everton (5571999261967) com texto pré-preenchido citando a empresa.
Sem dados sensíveis (sem telefones/e-mails do lead). `noindex`. No máx. 2 famílias de fonte.
Não mexa em apps/site nem apps/plataforma. Não commite. Delegue a escrita do HTML ao opencode e confira.
