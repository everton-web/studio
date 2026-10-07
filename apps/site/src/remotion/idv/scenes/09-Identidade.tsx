import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Fundo, ComPonto, LineReveal, anim, titulo, useLayout } from "../components/base";
import { cor, easeInOut } from "../tokens";

const Uma: React.FC = () => {
  const { u, vertical } = useLayout();
  const size = vertical ? 190 * u : 240 * u;
  return (
    <Fundo>
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: vertical ? 80 * u : 200 * u }}>
        <LineReveal
          style={{ ...titulo(size), color: cor.texto }}
          linhas={["Uma", <ComPonto key="i" texto="identidade." />]}
        />
      </AbsoluteFill>
    </Fundo>
  );
};

const Infinitas: React.FC = () => {
  const frame = useCurrentFrame();
  const { u, width, height, vertical } = useLayout();
  const size = vertical ? 260 * u : 300 * u;
  const x1 = anim(frame, [0, 70], [width * 0.25, -width * 0.02], (t) => t);
  const x2 = anim(frame, [0, 70], [-width * 0.25, width * 0.02], (t) => t);
  const raio = Math.hypot(width, height);
  const circ = anim(frame, [44, 66], [0, raio], easeInOut);
  return (
    <Fundo claro grade={false}>
      <AbsoluteFill style={{ justifyContent: "center", gap: 20 * u }}>
        <div style={{ ...titulo(size), color: cor.bg, transform: `translateX(${x1}px)`, whiteSpace: "nowrap", paddingLeft: 60 * u }}>
          Infinitas
        </div>
        <div style={{ ...titulo(size), color: cor.bg, transform: `translateX(${x2}px)`, whiteSpace: "nowrap", paddingLeft: 60 * u }}>
          <ComPonto texto="criações." />
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: width * 0.62 - circ,
          top: height * 0.55 - circ,
          width: circ * 2,
          height: circ * 2,
          borderRadius: "50%",
          background: cor.bg,
        }}
      />
    </Fundo>
  );
};

export const Identidade: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={60}>
      <Uma />
    </Sequence>
    <Sequence from={60} durationInFrames={70}>
      <Infinitas />
    </Sequence>
  </AbsoluteFill>
);
