# Instagram do Complexo SC: análise para o site

Coleta em 02/10/2026, sem login, só leitura (nada curtido, seguido ou comentado). Perfis: @complexosc_, @drvalderivieiraplastica e @draolgavieira. Sem login o Instagram mostra os 12 posts mais recentes de cada perfil; com os collabs repetidos, ficaram **30 posts únicos** (23 com vídeo).

Arquivos desta pasta:

- `posts.json`: link, data, tipo, legenda completa (página `/embed/captioned`) e URLs de mídia
- `jev.json`: respostas do JEV por post, com probabilidades
- `midia/`: og:image de cada post (miniatura de 320 a 640 px)
- `hd/`: imagem na maior resolução pública (de 540 a 3072 px), os vídeos em MP4 (720p) e os filhos dos carrosséis principais (`-s1`, `-s2`, `-s3`)
- `quadros/`: 5 quadros por vídeo, usados na leitura visual
- `_folha-hd.jpg`, `_q1.jpg`, `_q2.jpg`, `_q3.jpg`, `_folha-s.jpg`: folhas de contato

Scripts (reexecutáveis): `D:/studio/_scripts/qa/_ig-sc.mjs` (perfis), `_ig-sc-embed.mjs` (HD e legenda), `_ig-sc-filhos.mjs` (carrosséis), `_ig-jev.mjs` (classificação), `_sc-midia.mjs` (webp e loops do protótipo).

## Achados principais

1. **O ouro está nos vídeos, não nas capas.** Quase toda capa tem texto aplicado ("O que eu aprendi dentro de uma fábrica de próteses", "Sua pele está pedindo socorro!") e quase todo reel tem legenda queimada palavra por palavra. Os quadros limpos que existem são bastidores filmados no celular: consulta, café servido com flor, entrega de flores no pós, evento A Nova Era.
2. **A luz já é a do design system.** Interiores em marfim e areia, cadeiras de couro claro, mesa de vidro com base de pedra, ripas verticais com LED dourado, bambu e arranjos de flor em terracota e rosa. A paleta real conversa com marfim, areia e champanhe sem precisar de tratamento. O vinho aparece forte no evento A Nova Era (camisetas, arte "Nova Era · rumo ao extraordinário", parede com o monograma), o que confirma o vinho como cor de assinatura.
3. **Duas marcas convivem.** O Dr. Valderi usa uma identidade própria em azul-marinho e branco (#PadrãoVV, coração azul, artes "ReLift VV", "React VV"). O site do Complexo deve manter o vinho e tratar o #PadrãoVV como selo de conteúdo, não como paleta.
4. **A clínica já escreve com ética.** As legendas do Dr. Valderi e do @complexosc_ trazem o bloco completo: Resolução CFM nº 2.336/2023, autorização expressa da paciente, resultados variam, sem promessa, todo procedimento tem riscos. O JEV encontrou aviso ético em 12 dos 30 posts. O site pode usar esse mesmo texto, que a clínica já aprovou na prática.
5. **A história de paciente é o formato mais forte.** O caso de mastopexia com prótese (Ddo-xwIiYcC) descreve o percurso que virou o storytelling da seção de mama do protótipo: consulta com expectativa alinhada, indicação pela anatomia, centro cirúrgico, pós com flores e pulseira. A série da Fabrícia (DdzrRcsJkHq) é contada em capítulos e rende uma seção de histórias no futuro.
6. **Dados confirmados nas legendas:** 17 anos, + de 20 mil autoestimas renovadas, Rua Barão de Aracati, 1304, Aldeota; Dr. Valderi com 21 anos de cirurgia plástica, CRM 8688, RQE 4045; participação no Congresso Mundial de Implantes Ergonômicos em Istambul (set/2026); evento A Nova Era em 15/03/2025 com missão, visão e valores.
7. **Divergência de nome continua.** A arte da profissional do Método RPP diz "Olgà Ramos" (inclusive bordado no jaleco no post do Setembro Amarelo) e a conta é @draolgavieira. O site atual diz "Dra. Olga Vieira". O protótipo mantém "Olga Vieira" com marca de confirmação. Aparece também uma "Ethel Vieira, fisioterapeuta do Complexo SC" (DdrzVNwjPwp), que não está na equipe do site.
8. **Resolução limita o uso.** Os vídeos públicos saem em 720 × 1280 e as fotos em 1080 px na maioria. Servem para cards, galeria e loops pequenos; não servem para fundo em tela cheia no desktop.

## O que o JEV encontrou

Modelo `jev-latest`, 1 chamada por post com 5 perguntas em paralelo sobre a legenda completa: tema (choice), formato narrativo (choice), potencial para o site (score de 3 níveis, 0 a 2), prova de autoridade ou segurança (noul) e aviso ético (noul). Entre parênteses, a confiança da choice ou o valor do score.

**Totais:** potencial Alto em 15 posts, Médio em 9, Baixo em 6. Prova de autoridade ou segurança em 15 de 30 (noul acima de 0,5). Aviso ético em 12 de 30. Temas: bastidores e equipe 9, institucional e datas 8, pós-operatório 5, mama 3, rosto e pele 3, Método RPP 2. Formatos: educativo 11, promocional 6, bastidor 6, celebração 5, história de paciente 2.

**Leitura:** o feed é forte em autoridade (congresso, protocolos, pós acompanhado) e fraco em mama como assunto principal (só 3 de 30), apesar de ser o foco do site. As peças de mama que existem têm potencial Alto e o maior score de todos (1,99). O Método RPP aparece pouco no perfil da clínica e quase só no perfil pessoal da Olga, com legendas educativas e sem aviso ético.

**Onde o JEV errou ou ficou incerto (revisado por mim):** Ddoe5LjxAzy ("Te recebendo, te escutando, te cuidando") veio como institucional e promocional com confiança 0,51; é bastidor de acolhimento e serve ao site. DczJ0WjDEa8 ("Na estética, saber dizer não também é uma forma de cuidar") veio como institucional; é o manifesto de cuidado mais bem escrito do feed. DdxCIQ6ib18 veio como celebração com confiança 0,48; é pós-operatório. DUljDiIiCM3 tem potencial Alto pela legenda, mas o carrossel é de depoimentos em arte, sem uso direto. As classificações de baixa confiança foram justamente as ambíguas, o que é o comportamento esperado.

| Post | Perfil | Data | Tipo | Tema | Formato | Potencial | Autoridade | Aviso ético |
|---|---|---|---|---|---|---|---|---|
| DHWE8TDR7zL | @complexosc_ | 18/03/2025 | reel | institucional (1,00) | celebração (1,00) | Baixo (0,55) | 0,03 | 0,02 |
| Dd3x51hlLpE | @drvalderivieiraplastica | 29/09/2026 | reel | bastidores (0,76) | bastidor (0,62) | Baixo (0,00) | 0,03 | 0,04 |
| DdzrRcsJkHq | @drvalderivieiraplastica | 27/09/2026 | reel | bastidores (0,81) | história de paciente (1,00) | Alto (1,52) | 0,96 | 0,99 |
| DdxCIQ6ib18 | @drvalderivieiraplastica | 26/09/2026 | foto e vídeo | pós-operatório (0,85) | celebração (0,48) | Alto (1,73) | 0,96 | 0,99 |
| DducgJWCtL1 | @complexosc_ | 25/09/2026 | reel | pós-operatório (0,83) | educativo (0,99) | Médio (1,12) | 0,85 | 0,28 |
| DdrzVNwjPwp | @complexosc_ | 24/09/2026 | reel | pós-operatório (1,00) | educativo (0,99) | Alto (1,54) | 0,93 | 0,83 |
| Ddo-xwIiYcC | @drvalderivieiraplastica | 23/09/2026 | foto | mama (1,00) | história de paciente (1,00) | Alto (1,99) | 0,97 | 0,98 |
| Ddoe5LjxAzy | @draolgavieira | 23/09/2026 | reel | institucional (0,83) | promocional (0,51) | Alto (1,45) | 0,09 | 0,04 |
| DdkJYuFH61a | @complexosc_ | 21/09/2026 | carrossel | bastidores (0,98) | bastidor (0,98) | Alto (1,43) | 0,86 | 0,99 |
| DdZu8tSgK6k | @complexosc_ | 17/09/2026 | reel | rosto e pele (1,00) | promocional (0,38) | Médio (1,31) | 0,80 | 0,07 |
| DdT-ZIqOzY4 | @complexosc_ | 15/09/2026 | foto | institucional (1,00) | celebração (1,00) | Baixo (0,23) | 0,03 | 0,03 |
| DdKYbyhOcU6 | @complexosc_ | 11/09/2026 | foto | institucional (1,00) | celebração (0,40) | Baixo (0,17) | 0,08 | 0,10 |
| DNWonOPxG-9 | @drvalderivieiraplastica | 14/08/2025 | carrossel | institucional (0,90) | promocional (1,00) | Médio (0,86) | 0,08 | 0,04 |
| DQ-M1_Ik7SL | @drvalderivieiraplastica | 12/11/2025 | carrossel | rosto e pele (1,00) | promocional (0,43) | Alto (1,62) | 0,96 | 0,97 |
| DUljDiIiCM3 | @drvalderivieiraplastica | 10/02/2026 | carrossel | institucional (0,96) | celebração (0,90) | Alto (1,64) | 0,07 | 0,06 |
| Ddue_CnFCoE | @drvalderivieiraplastica | 25/09/2026 | reel | rosto e pele (1,00) | educativo (0,42) | Alto (1,58) | 0,96 | 0,99 |
| DdrQMsSlH4D | @drvalderivieiraplastica | 24/09/2026 | carrossel | bastidores (0,82) | bastidor (0,96) | Alto (1,80) | 0,96 | 0,98 |
| DdmEFUPjCJO | @drvalderivieiraplastica | 22/09/2026 | reel | mama (1,00) | educativo (1,00) | Alto (1,68) | 0,96 | 0,99 |
| DdkE9Y_jYUJ | @drvalderivieiraplastica | 21/09/2026 | reel | mama (1,00) | educativo (0,99) | Alto (1,49) | 0,96 | 0,98 |
| DdgiO8KIiHu | @drvalderivieiraplastica | 20/09/2026 | reel | bastidores (1,00) | bastidor (0,93) | Baixo (0,33) | 0,11 | 0,03 |
| DdeCZWgoKND | @drvalderivieiraplastica | 19/09/2026 | reel | bastidores (1,00) | bastidor (0,99) | Médio (1,05) | 0,55 | 0,03 |
| DMvcFKJxd21 | @draolgavieira | 30/07/2025 | foto | bastidores (0,42) | promocional (0,80) | Médio (0,99) | 0,09 | 0,04 |
| Dd_tqXwxIR9 | @draolgavieira | 02/10/2026 | reel | Método RPP (0,90) | educativo (0,92) | Médio (1,00) | 0,07 | 0,82 |
| Dd7QEBYnx4J | @draolgavieira | 30/09/2026 | reel | pós-operatório (1,00) | educativo (1,00) | Alto (1,60) | 0,12 | 0,11 |
| Dd2FmV2Exwe | @draolgavieira | 28/09/2026 | reel | pós-operatório (1,00) | educativo (1,00) | Alto (1,37) | 0,64 | 0,81 |
| DdMMDamx9r3 | @draolgavieira | 12/09/2026 | reel | bastidores (0,95) | promocional (0,26) | Baixo (0,00) | 0,02 | 0,02 |
| DdFLc-Yk2-u | @draolgavieira | 09/09/2026 | reel | Método RPP (1,00) | educativo (1,00) | Médio (1,28) | 0,09 | 0,08 |
| DdDBhZaxVx4 | @draolgavieira | 08/09/2026 | reel | bastidores (1,00) | bastidor (0,70) | Médio (1,19) | 0,42 | 0,03 |
| Dc_EFU9gQy5 | @draolgavieira | 07/09/2026 | reel | institucional (0,54) | educativo (0,99) | Médio (1,06) | 0,13 | 0,07 |
| DczJ0WjDEa8 | @complexosc_ | 02/09/2026 | reel | institucional (1,00) | educativo (0,99) | Alto (1,73) | 0,84 | 0,27 |

Escala do potencial: abaixo de 0,67 é Baixo, até 1,33 é Médio, acima é Alto.

## Leitura visual

- **Luz:** quente e difusa, de LED embutido e janela. Contraste baixo e pele bonita, típico do celular em interior claro. Os quadros escuros são de eventos externos (congresso, Biothera) e de carro, que não entram no site.
- **Paleta real:** marfim, areia, couro claro, pedra travertino, ouro do LED, verde do bambu e terracota e rosa das flores. O vinho só aparece no evento A Nova Era e no monograma.
- **Enquadramento:** vertical 9:16, câmera na mão, plano médio. Nos educativos é sempre a profissional sentada à mesa de vidro, com as ripas douradas atrás, o que dá um "cenário de marca" reconhecível.
- **Pessoas:** a equipe aparece muito; pacientes aparecem em momentos de afeto (abraço, flores, surpresa), sempre com o bloco de autorização na legenda.
- **Ambientes:** consultório da Olga (mesa de vidro, cadeira de couro, estante com bustos), sala do Dr. Valderi (ripas douradas e bambu), fachada com parede 3D branca, quarto de recuperação, área do evento com parede do monograma.
- **Vídeos que funcionam como loop sem som:** café servido com flor (DdkJYuFH61a, slide 3), consulta à mesa (slide 2 do mesmo carrossel), entrega de flores no pós (DdxCIQ6ib18), comemoração A Nova Era (DHWE8TDR7zL, trechos sem texto). Todos curtos, sem legenda queimada e com movimento lento. No protótipo viraram loops de 6 a 7 s, 540 px, de 310 a 460 KB.
- **Não servem para o site:** capas com texto, reels com legenda queimada, a collab de moda (DdMMDamx9r3), trend e meme (Dd3x51hlLpE), campanhas de data e a imagem de resultado com tarja (só atrás de véu e com aviso).

## As 10 melhores peças para o site

| # | Peça | Onde entra | Por quê |
|---|---|---|---|
| 1 | DdxCIQ6ib18, foto 1 (2268 × 3021) | Mama, passo 4 (pós-operatório) | A foto de maior resolução do feed. Abraço, flores e cirurgião presente: prova o pós acompanhado sem mostrar corpo. JEV: Alto 1,73, autoridade 0,96, aviso 0,99. |
| 2 | DdkJYuFH61a, slide 3 (vídeo do café) | Padrão de cuidado, primeiro card em loop | Café servido com flor no consultório: o detalhe de hospitalidade que o site atual só promete em texto. Sem legenda queimada. |
| 3 | DdkJYuFH61a, slides 1 e 2 (consulta) | Mama, passo 1, e galeria | Consulta sem pressa à mesa, luz quente e ambiente de marca. JEV: Alto 1,43, aviso 0,99. |
| 4 | DdrQMsSlH4D, foto 1 (3072 × 2304) | Mama, passo 2 (planejamento) | Congresso Mundial de Implantes Ergonômicos: autoridade em cirurgia mamária com foto boa. JEV: Alto 1,80. |
| 5 | Ddo-xwIiYcC (legenda) | Roteiro do storytelling da mama | A legenda é a história pronta em quatro etapas e já traz o aviso CFM. A imagem é de resultado e só pode entrar atrás de véu. JEV: Alto 1,99, o maior score. |
| 6 | DHWE8TDR7zL (vídeo A Nova Era) | Galeria, equipe e institucional | Equipe de camiseta vinho, parede do monograma, brinde: identidade e cultura no mesmo quadro. O JEV deu Baixo pela legenda de celebração; visualmente é das melhores. |
| 7 | DczJ0WjDEa8 (legenda) | Manifesto de cuidado | "Saber dizer não também é uma forma de cuidar" é o texto mais diferenciador do feed e diz 17 anos, 20 mil autoestimas e endereço. O vídeo tem legenda queimada; pedir o bruto. |
| 8 | Ddoe5LjxAzy (reel em três telas) | Futuro bloco "Te recebendo, te escutando, te cuidando" | A estrutura de três verbos é um roteiro pronto de scroll storytelling. Precisa do bruto sem o texto aplicado. |
| 9 | DdzrRcsJkHq (série Fabrícia) | Futura seção de histórias | História em capítulos com autorização na legenda e o melhor engajamento do perfil do cirurgião (301 curtidas). JEV: história de paciente 1,00. |
| 10 | Dd7QEBYnx4J e Dd3x51hlLpE (cenário das ripas douradas) | Fundo da seção de equipe ou retratos | O cenário mais reconhecível da marca. Os quadros limpos são raros; pedir uma sessão curta neste ambiente. |

## O que pedir à clínica

1. **Arquivos originais** das fotos e vídeos acima, na resolução da câmera (de preferência 4K ou 1080p na horizontal e na vertical), sem compressão do Instagram.
2. **Vídeos sem legenda queimada e sem texto aplicado**, principalmente: café com flor, consulta, entrega de flores, A Nova Era, o reel "Te recebendo, te escutando, te cuidando" e o "saber dizer não".
3. **Autorização de uso de imagem para o site**, por escrito, de cada paciente que aparece (a do Instagram não cobre automaticamente o site) e de cada profissional.
4. **Fotos que faltam:** centro cirúrgico, retrato individual de Diana Saboya, e retratos da equipe no cenário das ripas douradas.
5. **Casos de resultado autorizados** para a galeria atrás do véu, com procedimento, tempo de pós e o aviso CFM de cada caso.
6. **Confirmações:** nome da criadora do Método RPP (Olga Vieira ou Olgà Ramos), área de Diana Saboya, RQE de Andreia Mendes, se Ethel Vieira entra na equipe, tratamento Dr./Dra. por conselho, número de WhatsApp e link de agendamento, telefone, e-mail, e o nome, CRM e RQE do responsável técnico.
