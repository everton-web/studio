import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Fundo, anim, titulo, useLayout } from "../components/base";
import { cor, easeInOut } from "../tokens";

const FRASE = "O que vamos criar hoje?";
const CAMADAS = 9;

export const Tunel: React.FC = () => {
  const frame = useCurrentFrame();
  const { u, width, height } = useLayout();
  const zoom = anim(frame, [0, 40], [1.35, 1], easeInOut);
  const letras = Math.floor(anim(frame, [16, 58], [0, FRASE.length], (t) => t));
  const piscando = frame > 58 ? Math.floor(frame / 8) % 2 === 0 : true;
  const size = Math.min(80 * u, (width * 0.7) / (FRASE.length * 0.5));

  return (
    <Fundo grade={false}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        {Array.from({ length: CAMADAS }).map((_, i) => {
          const inset = i * Math.min(width, height) * 0.045;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: inset,
                top: inset,
                right: inset,
                bottom: inset,
                borderRadius: 40 * u,
                border: `${1 * u}px solid ${cor.linha}`,
                background: i % 2 === 0 ? cor.bgSoft : cor.card,
                boxShadow: `0 ${20 * u}px ${60 * u}px ${cor.bg}`,
              }}
            />
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...titulo(size), letterSpacing: "-0.04em", color: cor.texto, display: "flex", alignItems: "center" }}>
          <span>{FRASE.slice(0, letras)}</span>
          <span
            style={{
              display: "inline-block",
              width: size * 0.34,
              height: size * 0.34,
              borderRadius: "50%",
              background: cor.laranja,
              marginLeft: size * 0.25,
              opacity: piscando ? 1 : 0,
            }}
          />
        </div>
      </AbsoluteFill>
    </Fundo>
  );
};
