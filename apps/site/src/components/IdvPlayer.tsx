"use client";

import { forwardRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Video } from "@/remotion/idv/Video";

export const IDV_FPS = 30;
export const IDV_FRAMES = 1117; // soma de duracoes em remotion/idv/tokens.ts

// O filme da identidade (projeto Remotion) renderizado ao vivo no navegador.
// Sem controles nem reprodução própria: quem decide o quadro é a rolagem.
const IdvPlayer = forwardRef<PlayerRef, { vertical: boolean; proporcao: number }>(function IdvPlayer({ vertical, proporcao }, ref) {
  // Lado de referência fixo (1080 no celular, 1920 no computador) e o outro lado pela tela.
  const w = vertical ? 1080 : 1920;
  const h = Math.max(540, Math.round(w / Math.max(0.3, proporcao)));
  return (
    <Player
      ref={ref}
      component={Video}
      durationInFrames={IDV_FRAMES}
      fps={IDV_FPS}
      compositionWidth={w}
      compositionHeight={h}
      controls={false}
      loop={false}
      clickToPlay={false}
      doubleClickToFullscreen={false}
      spaceKeyToPlayOrPause={false}
      acknowledgeRemotionLicense
      style={{ width: "100%", height: "100%" }}
    />
  );
});

export default IdvPlayer;
