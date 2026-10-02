# Análise de áudio e vídeo dos reels de referência

Gerado localmente por `_scripts/qa/analise-audio.mjs`. Nenhum serviço de rede foi usado. Áudios dos reels foram convertidos para WAV mono a 22,05 kHz. Loudness aqui significa RMS em dBFS por janela de 250 ms, não LUFS integrado.

## Resumo comparativo

| Material | Duração | RMS | Pico | Dinâmica P90-P10 | Onsets fortes | BPM estimado | Indício de voz |
|---|---:|---:|---:|---:|---:|---:|---:|
| Reel 1, motion design com IA | 19,99 s | -15,9 dBFS | -2,9 dBFS | 9,9 dB | 56 | 124,5 | 40% |
| Reel 2, comercial de motion com realismo | 43,49 s | -15,7 dBFS | -1,9 dBFS | 12,8 dB | 109 | 92,0 | 36% |
| Nossa trilha-v2 | 30,00 s | -15,3 dBFS | -1,7 dBFS | 17,9 dB | 56 | 100,0 | 27% |

### Equilíbrio de frequências

Percentuais de energia espectral calculados por FFT de 2.048 pontos, janela Hann e salto de 1.024 amostras. Os valores são relativos e somam aproximadamente 100% em cada linha.

| Material | Sub <80 Hz | Grave 80-250 Hz | Médio 250 Hz-2 kHz | Presença 2-6 kHz | Brilho >6 kHz | Centroide |
|---|---:|---:|---:|---:|---:|---:|
| Reel 1, motion design com IA | 43,7% | 29,3% | 21,0% | 5,2% | 0,8% | 485 Hz |
| Reel 2, comercial de motion com realismo | 46,8% | 38,4% | 12,6% | 1,6% | 0,5% | 273 Hz |
| Nossa trilha-v2 | 67,4% | 24,6% | 5,5% | 1,2% | 1,3% | 251 Hz |

## Reel 1, motion design com IA

### Números principais

| Métrica | Resultado |
|---|---:|
| Duração | 19,994 s |
| RMS global | -15,9 dBFS |
| Pico | -2,9 dBFS |
| Faixa dinâmica P90-P10 em janelas de 250 ms | 9,9 dB |
| Onsets fortes | 56 |
| BPM estimado | 124,5 BPM, confiança 81%, alternativa 130,0 BPM |
| Cortes detectados | 12, limiar de cena 24,71 |
| Cortes em impacto, tolerância 80 ms | 6/12 (50%) |
| Voz versus música | predomínio musical, sem evidência espectral forte de fala, escore 40% |

### Linha do tempo de energia por segundo

Cada valor é a média das janelas RMS de 250 ms que cruzam aquele segundo.

- 0s -21,7 dB respiro | 1s -18,5 dB corpo | 2s -18,6 dB corpo | 3s -21,1 dB respiro | 4s -19,4 dB respiro | 5s -13,1 dB sobe | 6s -19,1 dB cai | 7s -17,4 dB corpo | 8s -18,7 dB corpo | 9s -17,9 dB corpo
- 10s -16,2 dB corpo | 11s -15,2 dB alta | 12s -15,9 dB corpo | 13s -16,7 dB corpo | 14s -15,8 dB corpo | 15s -15,4 dB alta | 16s -15,0 dB alta | 17s -15,9 dB corpo | 18s -15,3 dB alta | 19s -30,4 dB cai

### Impactos e BPM

| Tempo | Força de ataque | Nível local |
|---:|---:|---:|
| 0,25 s | 12,8 dB | -18,0 dBFS |
| 0,47 s | 16,5 dB | -18,3 dBFS |
| 0,96 s | 6,8 dB | -19,3 dBFS |
| 1,64 s | 17,4 dB | -11,6 dBFS |
| 2,63 s | 7,5 dB | -18,3 dBFS |
| 2,86 s | 9,6 dB | -18,5 dBFS |
| 3,11 s | 7,6 dB | -16,6 dBFS |
| 3,36 s | 7,5 dB | -17,5 dBFS |
| 3,58 s | 12,6 dB | -17,9 dBFS |
| 3,82 s | 15,8 dB | -15,8 dBFS |
| 4,07 s | 7,4 dB | -16,9 dBFS |
| 4,29 s | 13,9 dB | -19,5 dBFS |
| 4,52 s | 12,7 dB | -17,8 dBFS |
| 4,76 s | 15,3 dB | -9,8 dBFS |
| 5,12 s | 7,8 dB | -9,4 dBFS |
| 5,49 s | 6,8 dB | -8,5 dBFS |
| 6,22 s | 10,1 dB | -17,5 dBFS |
| 6,44 s | 8,1 dB | -16,7 dBFS |
| 6,68 s | 13,7 dB | -17,1 dBFS |
| 6,90 s | 10,5 dB | -19,2 dBFS |
| 7,14 s | 21,8 dB | -14,1 dBFS |
| 7,65 s | 5,2 dB | -15,5 dBFS |
| 7,89 s | 7,0 dB | -16,8 dBFS |
| 8,08 s | 5,0 dB | -15,1 dBFS |
| 8,37 s | 5,9 dB | -16,7 dBFS |
| 8,84 s | 5,9 dB | -16,8 dBFS |
| 9,20 s | 5,0 dB | -16,4 dBFS |
| 9,54 s | 6,4 dB | -14,0 dBFS |
| 9,78 s | 6,3 dB | -14,4 dBFS |
| 10,25 s | 10,4 dB | -11,7 dBFS |
| 10,50 s | 10,0 dB | -11,1 dBFS |
| 10,73 s | 12,0 dB | -12,1 dBFS |
| 11,22 s | 10,3 dB | -11,1 dBFS |
| 11,70 s | 5,2 dB | -11,6 dBFS |
| 11,94 s | 17,1 dB | -15,2 dBFS |
| 12,42 s | 5,3 dB | -9,9 dBFS |
| 12,64 s | 10,4 dB | -13,3 dBFS |
| 12,89 s | 11,5 dB | -15,6 dBFS |
| 13,13 s | 8,5 dB | -9,6 dBFS |
| 13,38 s | 7,1 dB | -16,5 dBFS |
| 13,60 s | 9,6 dB | -12,2 dBFS |
| 13,84 s | 13,9 dB | -17,6 dBFS |
| 14,32 s | 8,2 dB | -9,5 dBFS |
| 14,55 s | 14,2 dB | -12,9 dBFS |
| 15,03 s | 8,4 dB | -8,8 dBFS |
| 15,51 s | 5,4 dB | -11,1 dBFS |
| 16,23 s | 9,1 dB | -9,6 dBFS |
| 16,46 s | 21,9 dB | -13,8 dBFS |
| 16,71 s | 11,6 dB | -14,9 dBFS |
| 16,95 s | 9,5 dB | -8,8 dBFS |
| 17,18 s | 8,3 dB | -16,8 dBFS |
| 17,41 s | 13,8 dB | -15,0 dBFS |
| 17,66 s | 12,8 dB | -17,0 dBFS |
| 18,14 s | 5,9 dB | -10,6 dBFS |
| 18,37 s | 6,1 dB | -12,1 dBFS |
| 18,86 s | 13,0 dB | -8,8 dBFS |

Estimativa de pulso: 124,5 BPM, confiança 81%, alternativa 130,0 BPM. O estimador normaliza intervalos entre onsets para 60 a 180 BPM. Em conteúdo com fala, efeitos e edição livre, o valor deve ser lido como pulso provável, não como grade confirmada.

### Cortes x impactos

- Cortes: 1,27 s, 1,50 s, 2,60 s, 7,33 s, 8,33 s, 9,33 s, 9,53 s, 9,73 s, 10,13 s, 11,90 s, 13,57 s, 14,23 s.
- Cortes casados com onset em até 80 ms: 2,60 s com 2,63 s, 8,33 s com 8,37 s, 9,53 s com 9,54 s, 9,73 s com 9,78 s, 11,90 s com 11,94 s, 13,57 s com 13,60 s.
- Cortes sem casamento: 1,27 s, 1,50 s, 7,33 s, 9,33 s, 10,13 s, 14,23 s.

### Estrutura do áudio

0 a 3 s: intro contida, média -19,6 dBFS; 3 a 6 s: desenvolvimento, média -17,9 dBFS; 6 a 9 s: desenvolvimento, média -18,4 dBFS; 9 a 12 s: desenvolvimento, média -16,5 dBFS; 12 a 15 s: drop ou bloco de maior energia, média -16,1 dBFS; 15 a 18 s: drop ou bloco de maior energia, média -15,5 dBFS; 18 a 20 s: final com retirada de energia, média -22,8 dBFS. A leitura combina energia, onsets e cortes. A legenda do post indica conteúdo autoral sobre motion design feito com IA, mas não fornece transcrição temporizada do áudio.

### Quadros e linguagem visual

Foram extraídos oito quadros em posições centrais de oito intervalos iguais: quadros/Dd1p_PWx0nR-01.jpg (1,26 s), quadros/Dd1p_PWx0nR-02.jpg (3,77 s), quadros/Dd1p_PWx0nR-03.jpg (6,28 s), quadros/Dd1p_PWx0nR-04.jpg (8,79 s), quadros/Dd1p_PWx0nR-05.jpg (11,30 s), quadros/Dd1p_PWx0nR-06.jpg (13,81 s), quadros/Dd1p_PWx0nR-07.jpg (16,32 s), quadros/Dd1p_PWx0nR-08.jpg (18,83 s). A cadência calculada indica montagem rápida, com mudanças visuais frequentes. A câmera permanece fixa em um estúdio de luz quente e enquadra o monitor como palco. Dentro da tela, a direção de arte usa preto, branco e amarelo, tipografia grotesca grande, cartões de interface, partículas, objeto 3D e símbolo dourado. A montagem alterna telas tipográficas, grafismo abstrato, produto e assinatura. O ritmo acelera em uma sequência concentrada de cortes entre 9,33 e 10,13 s, enquanto a moldura física e a legenda branca permanecem estáveis.

## Reel 2, comercial de motion com realismo

### Números principais

| Métrica | Resultado |
|---|---:|
| Duração | 43,492 s |
| RMS global | -15,7 dBFS |
| Pico | -1,9 dBFS |
| Faixa dinâmica P90-P10 em janelas de 250 ms | 12,8 dB |
| Onsets fortes | 109 |
| BPM estimado | 92,0 BPM, confiança 72%, alternativa 90,5 BPM |
| Cortes detectados | 18, limiar de cena 8,00 |
| Cortes em impacto, tolerância 80 ms | 4/18 (22%) |
| Voz versus música | predomínio musical, sem evidência espectral forte de fala, escore 36% |

### Linha do tempo de energia por segundo

Cada valor é a média das janelas RMS de 250 ms que cruzam aquele segundo.

- 0s -26,2 dB respiro | 1s -25,2 dB respiro | 2s -20,3 dB sobe | 3s -17,1 dB corpo | 4s -15,3 dB corpo | 5s -17,1 dB corpo | 6s -15,1 dB alta | 7s -15,9 dB corpo | 8s -16,8 dB corpo | 9s -14,7 dB alta
- 10s -16,9 dB corpo | 11s -16,0 dB corpo | 12s -16,6 dB corpo | 13s -16,8 dB corpo | 14s -14,7 dB alta | 15s -15,6 dB corpo | 16s -15,2 dB alta | 17s -14,3 dB alta | 18s -16,9 dB corpo | 19s -14,3 dB alta
- 20s -15,2 dB corpo | 21s -16,8 dB corpo | 22s -14,4 dB alta | 23s -17,3 dB corpo | 24s -19,7 dB respiro | 25s -16,0 dB corpo | 26s -17,1 dB corpo | 27s -14,4 dB alta | 28s -15,2 dB corpo | 29s -16,3 dB corpo
- 30s -14,0 dB alta | 31s -17,3 dB corpo | 32s -15,4 dB corpo | 33s -15,2 dB alta | 34s -17,0 dB corpo | 35s -14,2 dB alta | 36s -20,6 dB cai | 37s -23,8 dB respiro | 38s -23,4 dB respiro | 39s -21,7 dB respiro
- 40s -20,7 dB respiro | 41s -17,5 dB corpo | 42s -48,5 dB cai | 43s -75,2 dB cai

### Impactos e BPM

| Tempo | Força de ataque | Nível local |
|---:|---:|---:|
| 0,80 s | 15,0 dB | -18,6 dBFS |
| 1,44 s | 23,4 dB | -20,2 dBFS |
| 1,77 s | 14,0 dB | -18,7 dBFS |
| 2,08 s | 12,6 dB | -20,3 dBFS |
| 2,41 s | 29,6 dB | -18,2 dBFS |
| 2,74 s | 30,7 dB | -13,4 dBFS |
| 3,06 s | 32,2 dB | -16,2 dBFS |
| 3,39 s | 25,6 dB | -15,3 dBFS |
| 3,72 s | 17,3 dB | -11,4 dBFS |
| 4,04 s | 16,6 dB | -12,6 dBFS |
| 4,24 s | 11,8 dB | -12,6 dBFS |
| 4,57 s | 13,9 dB | -12,6 dBFS |
| 5,35 s | 7,9 dB | -9,6 dBFS |
| 5,89 s | 21,5 dB | -10,8 dBFS |
| 6,32 s | 8,0 dB | -10,3 dBFS |
| 6,65 s | 10,6 dB | -13,7 dBFS |
| 6,87 s | 18,8 dB | -17,9 dBFS |
| 7,05 s | 6,6 dB | -15,1 dBFS |
| 7,31 s | 10,1 dB | -8,9 dBFS |
| 7,55 s | 5,7 dB | -16,3 dBFS |
| 7,96 s | 7,8 dB | -10,6 dBFS |
| 8,18 s | 7,6 dB | -19,8 dBFS |
| 8,50 s | 18,3 dB | -13,5 dBFS |
| 8,94 s | 10,6 dB | -9,4 dBFS |
| 9,26 s | 10,0 dB | -10,5 dBFS |
| 9,48 s | 8,9 dB | -12,1 dBFS |
| 9,91 s | 9,6 dB | -10,7 dBFS |
| 10,56 s | 9,4 dB | -11,8 dBFS |
| 10,82 s | 4,6 dB | -21,4 dBFS |
| 11,11 s | 27,0 dB | -14,5 dBFS |
| 11,55 s | 11,0 dB | -9,4 dBFS |
| 11,87 s | 12,4 dB | -11,4 dBFS |
| 12,10 s | 15,0 dB | -16,0 dBFS |
| 12,52 s | 9,5 dB | -11,5 dBFS |
| 12,77 s | 4,8 dB | -15,7 dBFS |
| 13,18 s | 8,2 dB | -9,8 dBFS |
| 13,53 s | 7,4 dB | -19,2 dBFS |
| 13,72 s | 15,6 dB | -11,7 dBFS |
| 14,14 s | 10,5 dB | -15,0 dBFS |
| 14,47 s | 11,9 dB | -12,2 dBFS |
| 14,70 s | 8,9 dB | -10,9 dBFS |
| 14,88 s | 4,7 dB | -17,0 dBFS |
| 15,12 s | 15,3 dB | -12,4 dBFS |
| 15,47 s | 6,2 dB | -12,0 dBFS |
| 15,79 s | 7,4 dB | -10,0 dBFS |
| 16,05 s | 4,8 dB | -21,0 dBFS |
| 16,33 s | 19,0 dB | -11,9 dBFS |
| 16,76 s | 11,5 dB | -9,7 dBFS |
| 17,09 s | 10,6 dB | -9,7 dBFS |
| 17,31 s | 18,0 dB | -16,2 dBFS |
| 17,49 s | 5,3 dB | -15,6 dBFS |
| 17,74 s | 9,4 dB | -8,7 dBFS |
| 17,98 s | 4,8 dB | -15,5 dBFS |
| 18,39 s | 7,2 dB | -10,7 dBFS |
| 18,74 s | 8,8 dB | -19,6 dBFS |
| 18,93 s | 15,1 dB | -12,5 dBFS |
| 19,36 s | 8,9 dB | -11,7 dBFS |
| 19,69 s | 7,5 dB | -10,6 dBFS |
| 19,92 s | 6,7 dB | -12,3 dBFS |
| 20,35 s | 9,4 dB | -10,1 dBFS |
| 21,00 s | 7,9 dB | -11,9 dBFS |
| 21,35 s | 10,0 dB | -19,9 dBFS |
| 21,54 s | 17,2 dB | -13,8 dBFS |
| 21,97 s | 11,0 dB | -13,5 dBFS |
| 22,30 s | 6,6 dB | -12,8 dBFS |
| 22,68 s | 6,4 dB | -12,1 dBFS |
| 22,96 s | 7,4 dB | -9,6 dBFS |
| 23,61 s | 11,7 dB | -14,0 dBFS |
| 24,26 s | 9,9 dB | -11,3 dBFS |
| 24,59 s | 12,6 dB | -11,3 dBFS |
| 24,92 s | 14,9 dB | -14,1 dBFS |
| 25,12 s | 15,9 dB | -10,9 dBFS |
| 25,45 s | 12,6 dB | -11,0 dBFS |
| 26,22 s | 8,0 dB | -9,5 dBFS |
| 26,46 s | 9,6 dB | -20,1 dBFS |
| 26,76 s | 17,4 dB | -13,4 dBFS |
| 27,19 s | 11,7 dB | -11,1 dBFS |
| 27,51 s | 9,5 dB | -12,8 dBFS |
| 27,75 s | 10,1 dB | -16,0 dBFS |
| 28,17 s | 7,4 dB | -10,0 dBFS |
| 28,42 s | 5,8 dB | -16,2 dBFS |
| 28,83 s | 6,8 dB | -12,0 dBFS |
| 29,18 s | 11,4 dB | -19,9 dBFS |
| 29,37 s | 23,8 dB | -13,3 dBFS |
| 29,80 s | 16,0 dB | -12,1 dBFS |
| 30,13 s | 7,7 dB | -11,2 dBFS |
| 30,35 s | 8,9 dB | -11,7 dBFS |
| 30,78 s | 9,8 dB | -10,7 dBFS |
| 31,43 s | 7,6 dB | -11,8 dBFS |
| 31,67 s | 15,8 dB | -20,6 dBFS |
| 31,97 s | 20,0 dB | -15,5 dBFS |
| 32,41 s | 10,3 dB | -9,7 dBFS |
| 32,73 s | 10,3 dB | -12,1 dBFS |
| 32,97 s | 9,3 dB | -16,0 dBFS |
| 33,40 s | 8,6 dB | -8,1 dBFS |
| 34,04 s | 7,8 dB | -12,8 dBFS |
| 34,40 s | 12,7 dB | -19,3 dBFS |
| 34,59 s | 25,5 dB | -10,9 dBFS |
| 35,02 s | 11,3 dB | -10,0 dBFS |
| 35,34 s | 11,8 dB | -12,0 dBFS |
| 35,57 s | 9,5 dB | -10,0 dBFS |
| 36,00 s | 9,8 dB | -9,4 dBFS |
| 36,65 s | 16,7 dB | -18,2 dBFS |
| 37,30 s | 11,2 dB | -19,2 dBFS |
| 37,97 s | 9,4 dB | -15,9 dBFS |
| 38,48 s | 9,9 dB | -20,3 dBFS |
| 39,27 s | 8,8 dB | -16,2 dBFS |
| 40,57 s | 8,3 dB | -15,5 dBFS |
| 41,21 s | 13,7 dB | -13,0 dBFS |

Estimativa de pulso: 92,0 BPM, confiança 72%, alternativa 90,5 BPM. O estimador normaliza intervalos entre onsets para 60 a 180 BPM. Em conteúdo com fala, efeitos e edição livre, o valor deve ser lido como pulso provável, não como grade confirmada.

### Cortes x impactos

- Cortes: 6,93 s, 8,67 s, 10,23 s, 12,40 s, 14,00 s, 19,67 s, 20,50 s, 21,47 s, 22,80 s, 23,80 s, 24,70 s, 25,70 s, 26,67 s, 28,20 s, 30,93 s, 32,17 s, 33,20 s, 38,17 s.
- Cortes casados com onset em até 80 ms: 6,93 s com 6,87 s, 19,67 s com 19,69 s, 21,47 s com 21,54 s, 28,20 s com 28,17 s.
- Cortes sem casamento: 8,67 s, 10,23 s, 12,40 s, 14,00 s, 20,50 s, 22,80 s, 23,80 s, 24,70 s, 25,70 s, 26,67 s, 30,93 s, 32,17 s, 33,20 s, 38,17 s.

### Estrutura do áudio

0 a 7 s: intro contida, média -19,5 dBFS; 7 a 14 s: build, média -16,3 dBFS; 14 a 21 s: drop ou bloco de maior energia, média -15,2 dBFS; 21 a 28 s: desenvolvimento, média -16,5 dBFS; 28 a 35 s: drop ou bloco de maior energia, média -15,8 dBFS; 35 a 42 s: respiro ou redução, média -20,3 dBFS; 42 a 43 s: final com retirada de energia, média -61,9 dBFS. A leitura combina energia, onsets e cortes. A legenda do post indica conteúdo autoral sobre um comercial de motion com realismo, mas não fornece transcrição temporizada do áudio.

### Quadros e linguagem visual

Foram extraídos oito quadros em posições centrais de oito intervalos iguais: quadros/DdpnXQpMcGv-01.jpg (2,72 s), quadros/DdpnXQpMcGv-02.jpg (8,17 s), quadros/DdpnXQpMcGv-03.jpg (13,62 s), quadros/DdpnXQpMcGv-04.jpg (19,07 s), quadros/DdpnXQpMcGv-05.jpg (24,51 s), quadros/DdpnXQpMcGv-06.jpg (29,96 s), quadros/DdpnXQpMcGv-07.jpg (35,41 s), quadros/DdpnXQpMcGv-08.jpg (40,86 s). A cadência calculada indica montagem moderada, alternando planos e blocos de motion. A câmera também usa o monitor como palco, com moldura física estável e legenda social sobreposta. O comercial dentro da tela segue uma identidade financeira em amarelo, preto e branco. Ele progride de formulário e cartões 3D para slogan, celular, personagem em ambiente de aeroporto, pagamento por aproximação, notificações e logo final. A edição alterna UI limpa, produto e cenas realistas, com maior concentração de cortes entre 19,67 e 33,20 s e desaceleração para a assinatura.


## Nossa trilha-v2

### Medições

| Métrica | Resultado |
|---|---:|
| Duração | 30,000 s |
| RMS global | -15,3 dBFS |
| Pico | -1,7 dBFS |
| Faixa dinâmica P90-P10 | 17,9 dB |
| Onsets fortes | 56 |
| BPM medido | 100,0 BPM, confiança 83% |
| Indício de voz | predomínio musical, sem evidência espectral forte de fala, escore 27% |

### Linha do tempo

- 0s -36,4 dB respiro | 1s -15,2 dB sobe | 2s -18,1 dB respiro | 3s -17,8 dB corpo | 4s -13,1 dB sobe | 5s -14,8 dB alta | 6s -15,6 dB corpo | 7s -15,3 dB corpo | 8s -15,6 dB corpo | 9s -14,9 dB alta
- 10s -15,2 dB corpo | 11s -15,6 dB corpo | 12s -14,8 dB alta | 13s -15,1 dB corpo | 14s -15,6 dB corpo | 15s -15,2 dB corpo | 16s -14,5 dB alta | 17s -15,4 dB corpo | 18s -15,4 dB corpo | 19s -15,0 dB alta
- 20s -16,4 dB corpo | 21s -24,6 dB cai | 22s -30,0 dB cai | 23s -30,4 dB respiro | 24s -18,5 dB sobe | 25s -15,7 dB corpo | 26s -11,9 dB alta | 27s -12,8 dB alta | 28s -21,0 dB cai | 29s -39,2 dB cai

### Impactos

| Tempo | Força de ataque | Nível local |
|---:|---:|---:|
| 1,22 s | 9,0 dB | -7,2 dBFS |
| 1,44 s | 5,1 dB | -10,3 dBFS |
| 1,72 s | 6,6 dB | -10,9 dBFS |
| 1,91 s | 5,7 dB | -13,5 dBFS |
| 2,12 s | 6,9 dB | -14,4 dBFS |
| 2,31 s | 5,1 dB | -16,5 dBFS |
| 2,53 s | 4,9 dB | -17,0 dBFS |
| 2,74 s | 5,5 dB | -17,7 dBFS |
| 3,60 s | 19,4 dB | -9,6 dBFS |
| 3,89 s | 11,1 dB | -6,7 dBFS |
| 4,20 s | 10,4 dB | -10,8 dBFS |
| 4,54 s | 5,4 dB | -13,4 dBFS |
| 4,80 s | 10,8 dB | -11,7 dBFS |
| 5,40 s | 16,0 dB | -9,1 dBFS |
| 6,00 s | 12,2 dB | -11,3 dBFS |
| 6,59 s | 15,7 dB | -13,7 dBFS |
| 7,20 s | 15,8 dB | -13,4 dBFS |
| 7,80 s | 19,0 dB | -12,4 dBFS |
| 8,40 s | 19,7 dB | -11,5 dBFS |
| 9,00 s | 21,6 dB | -9,4 dBFS |
| 9,25 s | 4,6 dB | -12,8 dBFS |
| 9,60 s | 14,6 dB | -10,7 dBFS |
| 10,20 s | 15,4 dB | -10,1 dBFS |
| 10,80 s | 14,1 dB | -11,0 dBFS |
| 11,40 s | 18,3 dB | -12,4 dBFS |
| 12,00 s | 20,5 dB | -9,7 dBFS |
| 12,27 s | 5,0 dB | -11,7 dBFS |
| 12,60 s | 19,9 dB | -12,0 dBFS |
| 13,20 s | 18,9 dB | -11,5 dBFS |
| 13,80 s | 16,9 dB | -11,0 dBFS |
| 14,40 s | 16,0 dB | -11,0 dBFS |
| 15,00 s | 14,8 dB | -10,4 dBFS |
| 15,60 s | 17,5 dB | -11,4 dBFS |
| 15,87 s | 4,8 dB | -11,6 dBFS |
| 16,20 s | 14,8 dB | -12,5 dBFS |
| 16,80 s | 14,3 dB | -12,7 dBFS |
| 17,40 s | 17,6 dB | -11,6 dBFS |
| 18,00 s | 19,5 dB | -10,7 dBFS |
| 18,60 s | 14,7 dB | -10,3 dBFS |
| 19,20 s | 15,8 dB | -10,0 dBFS |
| 19,80 s | 14,4 dB | -11,0 dBFS |
| 24,00 s | 19,1 dB | -12,2 dBFS |
| 24,60 s | 14,6 dB | -15,1 dBFS |
| 25,20 s | 13,5 dB | -14,3 dBFS |
| 25,80 s | 9,6 dB | -13,4 dBFS |
| 26,40 s | 14,0 dB | -11,5 dBFS |
| 26,59 s | 5,8 dB | -10,2 dBFS |
| 26,92 s | 6,4 dB | -7,0 dBFS |
| 27,13 s | 7,3 dB | -8,3 dBFS |
| 27,31 s | 6,7 dB | -10,3 dBFS |
| 27,53 s | 6,4 dB | -10,6 dBFS |
| 27,71 s | 7,1 dB | -12,7 dBFS |
| 27,92 s | 7,0 dB | -13,8 dBFS |
| 28,11 s | 6,1 dB | -16,3 dBFS |
| 28,32 s | 6,5 dB | -17,3 dBFS |
| 28,53 s | 5,5 dB | -19,5 dBFS |

### Leitura estrutural

0 a 5 s: intro contida, média -20,1 dBFS; 5 a 10 s: drop ou bloco de maior energia, média -15,2 dBFS; 10 a 15 s: desenvolvimento, média -15,3 dBFS; 15 a 20 s: drop ou bloco de maior energia, média -15,1 dBFS; 20 a 25 s: respiro ou redução, média -24,0 dBFS; 25 a 30 s: final com retirada de energia, média -20,1 dBFS. O gerador declara 100 BPM e organiza abertura, groove, queda para manifesto, build e impacto final. A medição de BPM pode cair em múltiplo ou subdivisão por causa da densidade de hats, arpejos e efeitos.

## Comparação direta com a trilha-v2

- Reel 1 versus trilha-v2 nas maiores diferenças espectrais: sub -23,7 pp, médio +15,4 pp, grave +4,7 pp.
- Reel 2 versus trilha-v2 nas maiores diferenças espectrais: sub -20,5 pp, grave +13,8 pp, médio +7,1 pp.
- As referências têm 165 onsets fortes em 63,5 s. A trilha-v2 tem 56 em 30,0 s.
- A trilha-v2 apresenta 17,9 dB de variação P90-P10. As referências apresentam 9,9 e 12,8 dB. Uma diferença maior indica contraste mais marcado entre respiro e bloco cheio.
- Os escores de voz das referências são 40% e 36%, contra 27% na trilha-v2. Isto é classificação espectral e rítmica, não transcrição.
- A trilha-v2 já chega a RMS e pico comparáveis aos reels. O problema mensurável não é falta de volume. É o balanço: 67,4% da energia está abaixo de 80 Hz, contra 43,7% e 46,8% nas referências, enquanto médio e presença ficam menores.
- A densidade de onsets é 2,80 por segundo no Reel 1, 2,51 no Reel 2 e 1,87 na trilha-v2. As referências pontuam mais microeventos sem necessariamente colocar sub em cada um.
- Só 50% e 22% dos cortes detectados coincidem com onset forte na tolerância rígida de 80 ms. A lição é hierarquia, não sincronizar cada corte com uma batida grande.
- O ganho mais transferível não é copiar timbre ou melodia. É reduzir a simultaneidade de notas, reservar silêncio ou cauda curta antes dos marcos, concentrar sub e grave nos impactos e usar efeitos de interface, whooshes e transientes como pontuação do motion.

## Receita concreta para a trilha-v3 do Complexo SC

### Direção

- Pulso: 108 BPM em 4/4. Use meio-tempo perceptivo nos trechos institucionais e subdivisão apenas nos builds.
- Duração: 30 s.
- Princípio: apresentação de nova marca, com poucos motivos, contraste alto, impacto grave controlado e espaço real para texto e locução eventual.
- Não reutilizar melodias, samples ou desenho sonoro identificável das referências. Transferir somente arquitetura de energia, densidade e função dos eventos.

### Estrutura por segundos

| Tempo | Função | Camadas e ação |
|---|---|---|
| 0,00 a 1,20 s | Suspensão | Ar filtrado, ruído de sala muito baixo e um tom de marca. Sem kick. Crescendo curto a partir de 0,65 s. |
| 1,20 s | Primeiro impacto | Sub curto, hit médio, clique de interface e cauda de 450 ms. Retirar o som nos 80 ms anteriores. |
| 1,20 a 5,40 s | Apresentação | Pad simples, baixo em notas longas e no máximo um motivo de 3 notas. Um pulso discreto a cada 2 tempos. |
| 5,40 a 5,90 s | Respiro | Cortar baixo e bateria. Manter apenas cauda e um detalhe estéreo. |
| 5,90 s | Segundo impacto | Whoosh de entrada, sub de 45 a 60 Hz, hit de corpo e tick agudo alinhado ao corte principal. |
| 5,90 a 12,00 s | Corpo A | Groove mínimo em meio-tempo, baixo sincopado leve, textura tecnológica e efeitos de UI nos pontos de motion. |
| 12,00 a 12,35 s | Respiro | Pausa de 200 a 350 ms, deixando somente pré-cauda reversa. |
| 12,35 a 19,20 s | Corpo B | Reintroduzir kick e uma camada harmônica adicional. Automatizar abertura de filtro, sem aumentar a quantidade de notas. |
| 19,20 a 21,00 s | Queda | Retirar kick, sub e hats. Piano ou timbre de assinatura com uma nota por mudança de frase. |
| 21,00 a 25,80 s | Build | Riser em duas etapas, pulsos de caixa espaçados que aceleram só depois de 24,00 s e automação de largura estéreo. |
| 25,80 a 26,00 s | Vácuo | Silêncio quase total de 120 a 180 ms antes do fecho. |
| 26,00 s | Impacto de marca | Maior impacto, com sub, corpo, presença e brilho em camadas separadas. Evitar cauda grave longa. |
| 26,00 a 30,00 s | Assinatura e saída | Acorde aberto, motivo de 3 notas em versão final, textura de brilho e fade limpo a partir de 28,20 s. |

### Impactos e respiros

- Impactos principais: 1,20 s, 5,90 s, 12,35 s e 26,00 s.
- Acentos secundários: 8,30 s, 10,70 s, 15,20 s, 18,00 s, 22,40 s e 24,60 s. Eles devem usar clique, hit curto ou whoosh, sem sub em todos.
- Respiros: 5,40 a 5,90 s, 12,00 a 12,35 s, 19,20 a 21,00 s e 25,80 a 26,00 s.
- Regra de edição: cada impacto principal deve ter ataque preciso. A cauda pode atravessar o corte, mas o sub deve decair antes do evento seguinte.

### Meta de energia por faixa

As metas partem da média medida nas duas referências, com faixa operacional de aproximadamente 18%, e devem ser conferidas por ouvido em caixas pequenas e fones.

| Faixa | Meta de participação | Função e controle |
|---|---:|---|
| Sub <80 Hz | 37,1% a 53,4% | Concentrar nos quatro impactos principais. Filtro passa-altas em 28 a 32 Hz. |
| Grave 80-250 Hz | 27,8% a 39,9% | Corpo do hit e baixo. Evitar sobreposição contínua entre kick e baixo. |
| Médio 250 Hz-2 kHz | 13,8% a 19,8% | Identidade harmônica. Abrir espaço entre 500 Hz e 1,5 kHz se houver locução. |
| Presença 2-6 kHz | 2,8% a 4,0% | Cliques, definição dos hits e legibilidade em celular. Controlar aspereza. |
| Brilho >6 kHz | 0,6% a 0,8% | Ar, hats e transições. Usar em rajadas, não como camada constante. |

### Níveis e master

- Master provisório: cerca de -14 LUFS integrados e pico verdadeiro abaixo de -1 dBTP.
- Impactos principais: pico de 4 a 7 dB acima do RMS do bloco imediatamente anterior.
- Respiros: queda de 6 a 12 dB no RMS por pelo menos 200 ms.
- Sub: mono abaixo de 100 Hz. Sidechain curto no pad e no baixo, com recuperação entre 100 e 180 ms.
- Efeitos de UI: 6 a 10 dB abaixo do impacto principal, com alternância estéreo acima de 250 Hz.
- Locução futura: reservar o centro, reduzir 2 a 4 dB em 700 Hz a 3 kHz por sidechain dinâmico quando houver voz.

## Método e limitações

- RMS em dBFS não é LUFS. A comparação é consistente entre os arquivos, mas não substitui medidor BS.1770.
- A FFT usa o áudio mono. Ela mede distribuição de energia, não separa voz, música e efeitos.
- Voz falada é um indício calculado por concentração espectral, taxa de cruzamento por zero e densidade de onsets. Música com synth ou guitarra na faixa vocal pode elevar o escore.
- BPM vem de histograma de intervalos entre onsets fortes. Fala, edição livre e efeitos podem produzir metade, dobro ou alternativa próxima do pulso real.
- Cortes são detectados por diferença média entre quadros em cinza 64x114, decodificados pelo ffmpeg e comparados em Node. Transições suaves, flashes, motion interno e cortes com enquadramento parecido podem gerar falsos negativos ou positivos.
- O casamento corte x impacto usa tolerância rígida de 80 ms e não considera antecipações criativas maiores.
- As legendas disponíveis descrevem os posts, mas não trazem timecodes. Por isso não foram usadas para afirmar palavras faladas em instantes específicos.

## Trilha v3

### Marcos reais usados

Marcos derivados de `src/tempo.ts` e `src/Video.tsx`:

| Tempo | Marco visual |
|---:|---|
| 0,00 s | Abertura |
| 1,20 s | Lema aparece e monograma pulsa |
| 3,60 s | Cena Menos dúvida |
| 5,40 s | Equipe |
| 9,00 s | Pós-operatório |
| 12,00 s | Números do Complexo |
| 15,60 s | Cirurgia de mama em 4 passos e passo 1 |
| 16,50 s | Passo 2 |
| 17,40 s | Passo 3 |
| 18,30 s | Passo 4 |
| 19,80 s | Manifesto |
| 24,00 s | Faixa de procedimentos |
| 26,40 s | Site novo |
| 28,90 s | Assinatura e fade |

### Impactos, acentos e respiros

- Impactos principais: 1,20 s, 5,40 s, 15,60 s e 26,40 s.
- Acentos secundários: 3,60 s, 9,00 s, 12,00 s, 16,50 s, 17,40 s, 18,30 s, 22,45 s, 24,00 s, 24,60 s e 25,20 s.
- Respiros: 1,04 a 1,20 s, 5,18 a 5,40 s, 11,78 a 12,00 s, 19,64 a 19,80 s e 26,25 a 26,40 s.

### Comparativo final

| Material | Duração | RMS | Pico | Dinâmica P90-P10 | Onsets fortes | BPM medido | Sub <80 Hz | Grave 80-250 Hz | Médio 250 Hz-2 kHz | Presença 2-6 kHz | Brilho >6 kHz | Centroide |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Reel 1, motion design com IA | 19,99 s | -15,9 dBFS | -2,9 dBFS | 9,9 dB | 56 | 124,5 BPM, confiança 81% | 43,7% | 29,3% | 21,0% | 5,2% | 0,8% | 485 Hz |
| Reel 2, comercial de motion com realismo | 43,49 s | -15,7 dBFS | -1,9 dBFS | 12,8 dB | 109 | 92,0 BPM, confiança 72% | 46,8% | 38,4% | 12,6% | 1,6% | 0,5% | 273 Hz |
| Nossa trilha-v2 | 30,00 s | -15,3 dBFS | -1,7 dBFS | 17,9 dB | 56 | 100,0 BPM, confiança 83% | 67,4% | 24,6% | 5,5% | 1,2% | 1,3% | 251 Hz |
| Nossa trilha-v3 | 30,000 s | -15,1 dBFS | -1,25 dBFS | 10,2 dB | 59 | 100,0 BPM, confiança 84% | 39,4% | 36,5% | 19,7% | 3,8% | 0,7% | 364 Hz |

Todas as metas por faixa foram atingidas pela trilha-v3.
