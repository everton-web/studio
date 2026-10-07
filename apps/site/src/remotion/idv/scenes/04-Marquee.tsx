import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Fundo, Simbolo, anim, titulo, useLayout } from "../components/base";
import { cor } from "../tokens";

const ITENS = ["Landing Page", "One Page", "Site Institucional", "Página de Vendas", "Sistemas", "Automações"];

export const Marquee: React.FC = () => {
  const frame = useCurrentFrame();
  const { u, vertical } = useLayout();
  const size = 124 * u;
  const linhas = vertical ? 13 : 8;
  const entrada = anim(frame, [0, 18], [0, 1]);

  return (
    <Fundo claro grade={false}>
      <AbsoluteFill
        style={{
          transform: `rotate(-7deg) scale(1.35)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: size * 0.12,
        }}
      >
        {Array.from({ length: linhas }).map((_, i) => {
          const dir = i % 2 === 0 ? -1 : 1;
          const offset = (i * 3) % ITENS.length;
          const seq = [...ITENS.slice(offset), ...ITENS.slice(0, offset)];
          const x = dir * (frame * 9 * u) - 1400 * u + (1 - entrada) * dir * -600 * u;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: size * 0.35,
                whiteSpace: "nowrap",
                transform: `translateX(${x}px)`,
                ...titulo(size),
                letterSpacing: "-0.05em",
                color: i % 2 === 0 ? cor.bg : cor.texto2,
              }}
            >
              {[...seq, ...seq, ...seq].map((t, k) => (
                <React.Fragment key={k}>
                  <span>{t}</span>
                  <Simbolo size={size * 0.42} color={i % 2 === 0 ? cor.bg : cor.texto2} />
                </React.Fragment>
              ))}
            </div>
          );
        })}
      </AbsoluteFill>
    </Fundo>
  );
};
