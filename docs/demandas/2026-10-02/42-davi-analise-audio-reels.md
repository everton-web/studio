# Davi · Análise de áudio e vídeo de dois reels de referência

Pedido do Everton (02/10): analisar o vídeo e principalmente o ÁUDIO de dois reels, para guiar a trilha do vídeo de proposta do Complexo SC (a trilha atual, sintetizada em código, ainda não convenceu; ele quer "produção de apresentação de nova marca").

## Material (já baixado, sem rede necessária)
- D:/studio/design/referencias/audio/Dd1p_PWx0nR.mp4 (+ .txt com a legenda) · reel do @fernandoaraujo sobre motion design feito por IA
- D:/studio/design/referencias/audio/DdpnXQpMcGv.mp4 (+ .txt)
- ffmpeg: D:/studio/sites/mellomidias-releitura/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe (e ffprobe.exe na mesma pasta). Neste ambiente o padrão de saída com %02d falha: gere um arquivo por comando.
- Nossa trilha atual para comparar: D:/studio/design/clientes/stetic-class/video/trilha-v2.wav (100 BPM, 30 s) e o gerador D:/studio/sites/complexosc-video/scripts/trilha-v2.mjs.

## O que fazer (escreva um script Node em D:/studio/_scripts/qa/analise-audio.mjs e rode)
Para cada reel:
1. Extraia o áudio em WAV mono 22 kHz e leia as amostras em Node.
2. Medições: duração; loudness por janela de 250 ms (RMS em dB) e o perfil de energia ao longo do tempo (onde sobe, onde respira, onde explode); picos/impactos (onsets fortes) com os segundos; BPM estimado (autocorrelação ou histograma dos intervalos entre onsets); equilíbrio de frequências por faixa (sub <80 Hz, grave 80 a 250, médio 250 a 2k, presença 2k a 6k, brilho >6k) com uma FFT simples; se há voz falada (energia concentrada em 300 a 3k com ritmo de fala) ou só música.
3. Cortes do vídeo: detecte trocas de cena (diferença entre quadros, ou ffmpeg select scene) e compare com os impactos do áudio (quantos cortes caem em impacto, com tolerância de 80 ms).
4. Quadros: extraia 8 quadros espaçados de cada vídeo para D:/studio/design/referencias/audio/quadros/ e descreva o estilo visual e o ritmo de edição.
5. Faça as mesmas medições na nossa trilha-v2.wav.

## Entrega
D:/studio/design/referencias/audio/analise.md com:
- Para cada reel: tabela de números, linha do tempo da energia (texto, por segundo), lista de impactos, BPM, frequências, relação cortes x impactos, e uma descrição do que o áudio faz (estrutura: intro, build, drop, respiro, final).
- Comparação direta com a nossa trilha-v2: o que eles têm que a nossa não tem (ex.: mais grave, sub nos impactos, drop mais forte, menos notas, mais silêncio antes do impacto, sound design de UI, voz).
- Uma receita concreta para a trilha-v3 do Complexo SC: BPM, estrutura com segundos, camadas, onde ficam os impactos e os respiros, níveis por faixa de frequência. Nada de copiar a música deles: só a estrutura e o tipo de produção.
Sem travessão nos textos. Não publique, não faça commit, não mande nada a ninguém.
