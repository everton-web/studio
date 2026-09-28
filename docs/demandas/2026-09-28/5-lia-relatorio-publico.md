# Lia — story: relatório interativo público do lead (evertonbrito.com/relatorio/<empresa>)

Ideia do Everton: um link curto que ele manda ao lead, ex. `evertonbrito.com/relatorio/white-odonto`, com um **relatório breve e interativo**:
- o que a empresa **não tem / o que falta** (vem da "análise de presença" que a plataforma já gera: `vault/SaaS/Prospeccao/analises/<id>.json`, lib `apps/plataforma/src/lib/analise.ts`);
- as **dores** em forma de itens clicáveis (o dono marca o que sente: "poucos clientes pelo Google", "não sei de onde vêm as visitas"...);
- a cada item marcado, mostra **quanto ela está deixando de ganhar** (estimativa simples e honesta, com premissas visíveis — ex.: buscas locais/mês × taxa de clique × ticket médio do segmento);
- CTA final para falar com o Everton no WhatsApp.

Restrições técnicas (verificadas pelo Orion):
- evertonbrito.com é Next.js publicado na Hostinger a partir do repo `everton-web/evertonbrito.com`; a análise mora no vault/PC. Proposta: a plataforma **exporta** um JSON público enxuto por lead para `apps/site/src/data/relatorios/<slug>.json` e o site renderiza a rota `/relatorio/[slug]` (estática, `noindex`). Avalie e proponha a melhor forma.
- Não expor dados sensíveis (só o que é público: site, redes, nota Google, faltas).

Entregue `docs/stories/relatorio-publico.story.md` com: objetivo, fluxo do Everton (gerar → revisar → publicar → enviar link), critérios de aceite numerados, modelo de cálculo de "quanto deixa de ganhar" por segmento (odontologia, clínica, restaurante, hospedagem), itens de dor, dados do JSON, e divisão por persona (Davi: layout; Theo: rota + export; Caio: textos das dores).
Não implemente código.
