# Theo — desfecho do lead + taxa de conversão da prospecção (plataforma, apps/plataforma em D:/studio)

Pedido do Everton: nos cards de leads, poder marcar **"sem interesse"** (recusou / declinou) e **"sem continuidade"** (não respondeu a mensagem), para medir a taxa de conversão da prospecção.

## Dados (vault, ficha do lead `vault/40 Comercial/Leads/<id>.md`)
- Novos campos no frontmatter: `desfecho: sem-interesse | sem-resposta | (vazio)`, `desfecho-em: AAAA-MM-DD`, `contatado-em: AAAA-MM-DD` (grave quando o Everton abre o WhatsApp pelo modal "abordar" ou quando o lead vai para o estágio Contato, o que vier primeiro), `respondeu-em` (quando sai de Contato para Negociação, ou marcado à mão).
- Marcar um desfecho: `status: arquivado` + `motivo-arquivo` legível ("Sem interesse (recusou)" / "Sem continuidade (não respondeu)") + linha em Movimentações. "Reativar" limpa o desfecho.
- Leads antigos já arquivados: sem desfecho (não inventar).

## Card e ficha (`src/components/pipeline.tsx`)
- Nos estágios Prospecção, Aprovação e Contato: dois botões discretos no rodapé do card (ícone + tooltip, 44px no celular): **"sem interesse"** (ThumbsDown) e **"sem resposta"** (MessageCircleOff ou Clock). Confirmação curta antes. Também no modal da ficha.
- Arquivados: mostrar o chip do desfecho (cinza "sem resposta", vermelho suave "sem interesse").

## Taxas (topo da aba Comercial, e exportar a função para o Dashboard futuro)
Funil de prospecção com números e %:
**Contatados → Responderam → Interessados (Negociação+) → Fechados (Entrega)**, mais **Sem resposta %** e **Sem interesse %** sobre os contatados. Filtro de período: 7 dias · 30 dias · tudo. Estados vazios honestos ("ainda sem contatos registrados").
Coloque o cálculo em `src/lib/conversao.ts` (função pura sobre a lista de leads), usada pela UI.

Regras: sem travessão, sem viúvas, celular primeiro. `npx tsc --noEmit` + `npm run build`. Não commite, não reinicie o app.
