"use client";

import { forwardRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Video } from "@/remotion/idv/Video";

export const IDV_FPS = 30;
export const IDV_FRAMES = 804; // soma de duracoes em remotion/idv/tokens.ts

// O filme da identidade (projeto Remotion) renderizado ao vivo no navegador.
// Sem controles nem reprodução própria: quem decide o quadro é a rolagem.
const IdvPlayer = forwardRef<PlayerRef, { vertical: boolean }>(function IdvPlayer({ vertical }, ref) {
  return (
    <Player
      ref={ref}
      component={Video}
      durationInFrames={IDV_FRAMES}
      fps={IDV_FPS}
      compositionWidth={vertical ? 1080 : 1920}
      compositionHeight={vertical ? 1920 : 1080}
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
