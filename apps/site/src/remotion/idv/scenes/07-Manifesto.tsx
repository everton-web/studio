import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Fundo, ComPonto, anim, titulo, useLayout } from "../components/base";
import { cor } from "../tokens";

const Slam: React.FC<{ texto: string; claro: boolean; dur: number }> = ({ texto, claro, dur }) => {
  const frame = useCurrentFrame();
  const { u, width } = useLayout();
  const size = Math.min(230 * u, (width * 0.84) / (texto.length * 0.5));
  const s = anim(frame, [0, dur], [1.12, 1]);
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

/** Letras entram desfocadas, uma a uma. */
const Desfoque: React.FC<{ texto: string }> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { u, width } = useLayout();
  const size = Math.min(200 * u, (width * 0.84) / (texto.length * 0.5));
  return (
    <Fundo>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...titulo(size), color: cor.texto, whiteSpace: "pre" }}>
          {texto.split("").map((ch, i) => {
            const t0 = i * 1.5;
            const b = anim(frame, [t0, t0 + 20], [24, 0]);
            const o = anim(frame, [t0, t0 + 14], [0, 1]);
            const isPonto = i === texto.length - 1 && ch === ".";
            return (
              <span key={i} style={{ filter: `blur(${b * u}px)`, opacity: o, color: isPonto ? cor.laranja : undefined }}>
                {ch}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </Fundo>
  );
};

export const Manifesto: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={36}>
      <Slam texto="Estratégia." claro dur={20} />
    </Sequence>
    <Sequence from={36} durationInFrames={36}>
      <Slam texto="Essência." claro={false} dur={20} />
    </Sequence>
    <Sequence from={72} durationInFrames={6}>
      <AbsoluteFill style={{ background: cor.laranja }} />
    </Sequence>
    <Sequence from={78} durationInFrames={48}>
      <Desfoque texto="Público certo." />
    </Sequence>
  </AbsoluteFill>
);
