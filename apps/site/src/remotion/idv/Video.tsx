import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { loadFont } from "@remotion/fonts";
import { cor, duracoes as d } from "./tokens";
import { Palavras } from "./scenes/01-Palavras";
import { SimboloOrbita } from "./scenes/02-Simbolo";
import { Tunel } from "./scenes/03-Tunel";
import { Marquee } from "./scenes/04-Marquee";
import { Cards } from "./scenes/05-Cards";
import { Contadores } from "./scenes/06-Contadores";
import { Manifesto } from "./scenes/07-Manifesto";
import { Identidade } from "./scenes/09-Identidade";
import { Logo } from "./scenes/10-Logo";

// Inter servida pelo próprio site (public/idv/fonts); o filme roda no navegador via @remotion/player.
for (const weight of ["400", "500", "600"]) {
  loadFont({ family: "Inter", url: `/idv/fonts/inter-${weight}.woff2`, weight });
}

export const Video: React.FC = () => (
  <AbsoluteFill style={{ background: cor.bg }}>
    <Series>
      <Series.Sequence durationInFrames={d.palavras}><Palavras /></Series.Sequence>
      <Series.Sequence durationInFrames={d.simbolo}><SimboloOrbita /></Series.Sequence>
      <Series.Sequence durationInFrames={d.tunel}><Tunel /></Series.Sequence>
      <Series.Sequence durationInFrames={d.marquee}><Marquee /></Series.Sequence>
      <Series.Sequence durationInFrames={d.cards}><Cards /></Series.Sequence>
      <Series.Sequence durationInFrames={d.contadores}><Contadores /></Series.Sequence>
      <Series.Sequence durationInFrames={d.manifesto}><Manifesto /></Series.Sequence>
      <Series.Sequence durationInFrames={d.identidade}><Identidade /></Series.Sequence>
      <Series.Sequence durationInFrames={d.logo}><Logo /></Series.Sequence>
    </Series>
  </AbsoluteFill>
);
