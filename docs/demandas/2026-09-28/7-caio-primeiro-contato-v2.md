# Caio — reescrever o PRIMEIRO CONTATO (v2): conexão, sem apontar erro

Feedback do Everton sobre a mensagem atual (ex.: "reparei uma coisa: título da página fraco ou ausente"):
- NÃO apresentar um erro/problema escancarado na 1ª mensagem. Pode ter sido a própria empresa que fez aquilo, e no momento de venda precisamos de **conexão**, não de acusação.
- A 1ª mensagem deve **identificar com quem falar** e gerar curiosidade. Ideia dele: "Com quem posso tratar sobre um ponto referente ao site / Google Meu Negócio de vocês?" — citando o link da empresa (site dela) para a pessoa validar do que se trata.
- O detalhe (o que falta, o que ela está deixando de ganhar) vai DEPOIS, quando a pessoa responder — e em breve num link de relatório (evertonbrito.com/relatorio/<empresa>), ainda em construção.

## Entregar
1. Em `apps/plataforma/src/lib/mensagens.ts`: reescreva `CONTATO_A` e `CONTATO_B` (primeiro contato) seguindo isso:
   - começa com "Olá! Tudo bem? Me chamo Everton, crio experiências digitais estratégicas que conectam sua essência ao público certo." (frase aprovada, manter);
   - pergunta com quem pode falar sobre um ponto que ele notou na **presença digital** (site ou Google) da {empresa}, citando o link do site: `{site}` (se o lead não tiver site, falar do perfil no Google);
   - tom leve, respeitoso, curioso; **sem citar o problema**, sem preço, sem desconto na 1ª mensagem (o Mês do Zeca vai para a mensagem de oferta), máx. ~350 caracteres;
   - CTA curto: pedir o nome/contato da pessoa responsável ou "posso te explicar por aqui?".
   - CONTATO_A e CONTATO_B podem ficar iguais (a promo sai da 1ª mensagem).
2. Crie uma nova mensagem `DETALHE` (tipo "detalhe" no seletor do modal, entre "Primeiro contato" e "Oferta"): para quando a pessoa responder — agradece, apresenta com delicadeza o ponto {ponto} como **oportunidade** ("vi que dá pra fortalecer…"), nunca como erro deles, e convida para ver os trabalhos em evertonbrito.com. Aqui pode entrar a promo (versão A) até 30/09.
3. Suporte a `{site}` no `preencher` (use o site do lead sem "https://"; sem site → "o perfil de vocês no Google"). Ajuste tipos (`MsgTipo`, seletor do modal em `src/components/pipeline.tsx`) para o novo tipo "detalhe".
4. Atualize `docs/demandas/2026-09-28/mensagens-whatsapp.md` com a v2.
5. `npx tsc --noEmit` em apps/plataforma. Não commite.
