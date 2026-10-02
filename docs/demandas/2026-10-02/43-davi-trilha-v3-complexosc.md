# Davi · Trilha v3 do vídeo de proposta do Complexo SC

Pedido do Everton (02/10): a trilha-v2 não convenceu. Ele quer algo "mais expressivo, com produção de apresentação de nova marca". A análise dos dois reels de referência está pronta em D:/studio/design/referencias/audio/analise.md (leia inteiro, principalmente "Comparação direta" e "Receita concreta para a trilha-v3").

## Diagnóstico medido da v2 (resumo)
- 67% da energia abaixo de 80 Hz (referências: 44% e 47%). Médio e presença fracos: no celular soa abafada e "calma".
- Poucos microeventos (1,9 onsets/s contra 2,5 a 2,8 nas referências): falta sound design de interface (cliques, whooshes, ticks) pontuando o motion.
- Notas demais ao mesmo tempo, sem vácuo antes dos impactos.

## O que fazer
1. Crie D:/studio/sites/complexosc-video/scripts/trilha-v3.mjs (mesma abordagem de síntese em Node do trilha-v2.mjs, WAV 48 kHz estéreo, 30 s, sem samples externos, sem nada copiado das referências).
2. Sincronia com o vídeo: o vídeo já existe e está cronometrado por src/tempo.ts e src/Video.tsx (100 BPM, cenas e passos de piano). NÃO mude o vídeo. Leia os dois arquivos, liste os segundos das trocas de cena e marcos de texto, e posicione os 4 impactos principais, os acentos secundários e os respiros da receita nesses marcos reais (ajuste os segundos da receita ao vídeo, não o contrário). Mantenha 100 BPM se isso alinhar melhor com os marcos.
3. Produção de "lançamento de marca": abertura em suspensão, impactos em camadas (sub curto + corpo + clique de presença + ar), whooshes de entrada, ticks de UI nos movimentos, um motivo de 3 notas que volta na assinatura final, vácuo de 120 a 180 ms antes do impacto de marca, sub mono e com decaimento curto, sidechain no pad.
4. Metas por faixa (confira com a mesma medição de _scripts/qa/analise-audio.mjs, rodando-a só no seu arquivo): sub 37 a 53%, grave 28 a 40%, médio 14 a 20%, presença 2,8 a 4%. Pico abaixo de -1 dBFS, RMS global perto de -15 dBFS. Itere até cair nas faixas e escreva os números finais.
5. Gere design/clientes/stetic-class/video/trilha-v3.wav. Copie para sites/complexosc-video/public/trilha.wav (antes, salve a atual como public/trilha-v2.wav se ainda não existir).
6. Renderize de novo os dois vídeos com a trilha nova, como foi feito na v2 (veja package.json e o histórico do projeto), saindo em design/clientes/stetic-class/video/complexosc-proposta-vertical-v3.mp4 e complexosc-proposta-horizontal-v3.mp4. Não apague as versões v1 e v2.

## Entrega
- Os arquivos acima e um bloco "Trilha v3" no final de design/referencias/audio/analise.md com: marcos usados (segundo e o que acontece na tela), números medidos da v3 ao lado da v2 e das referências.
Sem travessão nos textos. Não publique, não faça commit, não mande nada a ninguém.
