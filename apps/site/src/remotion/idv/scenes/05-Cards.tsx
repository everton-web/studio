import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Fundo, anim, titulo, useLayout } from "../components/base";
import { cor } from "../tokens";

type Tipo = "escuro" | "claro" | "acao";
const CARDS: { t: string; tipo: Tipo }[] = [
  { t: "Landing Page", tipo: "escuro" },
  { t: "Web design", tipo: "claro" },
  { t: "One Page", tipo: "escuro" },
  { t: "Design responsivo", tipo: "claro" },
  { t: "100% online", tipo: "claro" },
  { t: "Site Institucional", tipo: "escuro" },
  { t: "Solicite um orçamento ↗", tipo: "acao" },
  { t: "Sistemas", tipo: "escuro" },
  { t: "Página de Vendas", tipo: "escuro" },
  { t: "Todo o Brasil", tipo: "claro" },
  { t: "Automações", tipo: "escuro" },
  { t: "Performance", tipo: "claro" },
];

const Cursor: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M4 2 L4 19 L8.5 14.8 L11.6 21.5 L14.4 20.2 L11.3 13.6 L17.5 13.6 Z" fill={cor.bg} stroke={cor.texto} strokeWidth="1.2" />
  </svg>
);

export const Cards: React.FC = () => {
  const frame = useCurrentFrame();
  const { u, width, height, vertical } = useLayout();
  const cols = vertical ? 2 : 4;
  const cw = vertical ? 470 * u : 440 * u;
  const ch = 230 * u;
  const gap = 24 * u;

  // Cursor: entra e clica no frame 20
  const cx = anim(frame, [0, 18], [width * 0.8, width * 0.5]);
  const cy = anim(frame, [0, 18], [height * 0.85, height * 0.5]);
  const clique = frame >= 18 && frame < 24 ? 0.85 : 1;
  const cursorOut = anim(frame, [24, 30], [1, 0]);

  const pan = anim(frame, [24, 130], [60 * u, -60 * u], (t) => t);
  const tiltIn = anim(frame, [24, 60], [0, 1]);

  return (
    <Fundo claro>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 2200 * u }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${cw}px)`,
            gap,
            transform: `rotateX(${18 * tiltIn}deg) rotateZ(${-6 * tiltIn}deg) translateX(${pan}px) scale(${1.05 + 0.08 * tiltIn})`,
          }}
        >
          {CARDS.map((c, i) => {
            const t0 = 24 + i * 2;
            const y = anim(frame, [t0, t0 + 27], [40 * u, 0]);
            const o = anim(frame, [t0, t0 + 12], [0, 1]);
            const bg = c.tipo === "escuro" ? cor.card : c.tipo === "acao" ? cor.laranja : cor.texto;
            const fg = c.tipo === "escuro" ? cor.texto : cor.bg;
            return (
              <div
                key={i}
                style={{
                  height: ch,
                  borderRadius: 28 * u,
                  background: bg,
                  border: `${1.5 * u}px solid ${c.tipo === "escuro" ? cor.linha : cor.linhaEscura}`,
                  padding: 32 * u,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: o,
                  transform: `translateY(${y}px)`,
                }}
              >
                <div
                  style={{
                    width: 36 * u,
                    height: 36 * u,
                    borderRadius: "50%",
                    border: `${2 * u}px solid ${c.tipo === "escuro" ? cor.mudo : cor.linhaEscura}`,
                  }}
                />
                <div style={{ ...titulo(38 * u), letterSpacing: "-0.04em", lineHeight: 1.1, color: fg }}>{c.t}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          opacity: cursorOut,
          transform: `scale(${clique})`,
        }}
      >
        <Cursor size={64 * u} />
      </div>
    </Fundo>
  );
};
