# Mia · Portfólio, conteúdo e voz

Reunião geral do Studio, 29/09/2026. Escrevo só este arquivo.

## A. Conteúdo no calendário da aba Demandas

Hoje cada peça de conteúdo vive solta em `vault/50 Conteúdo/ideias.md`: a lista "A publicar" tem 9 itens e "Publicados" está vazio (linhas 11 a 25). Não existe data nem etapa.

A aba Conteúdo (`dashboard.tsx:51`, `files.tsx:12`) é só upload e listagem de arquivo. Não é calendário.

A aba Demandas usa `Demandas` (`dashboard.tsx:831`) e a demanda tem id, prompt, status, atribuído e ia (`demandas.tsx:6`). Não tem data nem etapa. O único calendário do app é o filtro "últimos 30 dias" do Início (`dashboard.tsx:545`).

Minha proposta: cada peça vira uma demanda com data. Etapa separa aprovação de publicação.

Fluxo por peça:
1. Mia escreve o roteiro: demanda aberta, dono mia, data definida.
2. Davi produz a arte no design system: mesma demanda, etapa arte.
3. Redator revisa voz e travessão: etapa revisão (`cadencia-proposta.md:74`).
4. Everton aprova em lote: etapa aprovado. Sem isso, não publica (`primeiros-posts.md:164`).
5. Everton publica manual: etapa publicado. A publicação é manual (`cadencia-proposta.md:6`).
6. Alguém marca publicado: muda status e grava a data real.

Depois de publicar, a peça faz duas coisas. Move a linha de "A publicar" para "Publicados" em `ideias.md`. E se a peça for de case, atualiza o status do case no cliente.

## B. O que o card de cliente precisa do portfólio

Campos que o card deve mostrar, do lado de portfólio:
- Status do case: não iniciado, em produção, publicado.
- Link do case publicado e link do Behance.
- Antes e depois disponível (sim ou não).
- Depoimento autorizado por escrito (sim ou não).
- Peças de conteúdo derivadas do case, com link.
- Behance publicado (sim ou não) e data.

O que existe hoje. O case Concept tem tags case e portfolio, mas nenhum campo de status (`case.md:13`). A estrutura do Behance tem o upload como não feito (`behance-estrutura.md:76`). O card do cliente lista "coletar depoimento" e "acompanhar métricas" como tarefas, sem campo de autorização (`40 Comercial/Clientes/Concept Implantes Dentários.md:37`). As métricas do case estão como checklist aberto (`case.md:91`).

Falta transformar essas tarefas em campos de verdade para o card ler. Depoimento autorizado, link do case, link do Behance e status. Assim o portfólio nasce do projeto e não de um trabalho separado.

## Riscos

- Sem campo de data, o calendário das Demandas não existe, só lista.
- Aprovação e publicação na mesma etapa tiram o controle do que já saiu.
- Case sem status vira case esquecido, como o upload do Behance parado (`behance-estrutura.md:76`).
- Depoimento sem autorização registrada não pode virar prova social.

## O que preciso de outra persona

- Theo: campo data e etapa na demanda, e o calendário na aba Demandas.
- Davi: a arte da peça aponta para a demanda certa.
- Lia: quem marca publicado no fluxo e em que momento.
- Caio: o card de cliente lê o status do case direto do arquivo.
