import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Fundo, ComPonto, anim, titulo, useLayout } from "../components/base";
import { cor } from "../tokens";

const PALAVRAS = ["sites.", "sistemas.", "landing pages."];
const CADA = 12;

const Palavra: React.FC<{ texto: string; claro: boolean }> = ({ texto, claro }) => {
  const frame = useCurrentFrame();
  const { u, width } = useLayout();
  const size = Math.min(300 * u, (width * 0.86) / (texto.length * 0.5));
  const s = anim(frame, [0, CADA], [1.08, 1]);
  return (
    <Fundo claro={claro} grade={!claro}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...titulo(size), color: claro ? cor.bg : cor.texto, transform: `scale(${s})` }}>
          <ComPonto texto={texto} />
        </div>
      </AbsoluteFill>
    </Fundo>
  );
};

export const Palavras: React.FC = () => (
  <AbsoluteFill>
    {PALAVRAS.map((p, i) => (
      <Sequence key={p} from={i * CADA} durationInFrames={CADA}>
        <Palavra texto={p} claro={i % 2 === 0} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
