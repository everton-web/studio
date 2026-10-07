import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Fundo, anim, titulo, useLayout } from "../components/base";
import { contadores, cor } from "../tokens";

/** Um dígito que gira como um contador mecânico até o valor final. */
const Digito: React.FC<{ alvo: number; atraso: number; size: number }> = ({ alvo, atraso, size }) => {
  const frame = useCurrentFrame();
  const voltas = 2;
  const total = voltas * 10 + alvo;
  const p = anim(frame, [atraso, atraso + 30], [0, total]);
  const vel = Math.abs(anim(frame, [atraso, atraso + 30], [1, 0]));
  return (
    <span style={{ display: "inline-block", height: size, overflow: "hidden", verticalAlign: "top" }}>
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          transform: `translateY(${-p * size}px)`,
          filter: `blur(${vel * 4}px)`,
        }}
      >
        {Array.from({ length: total + 1 }).map((_, i) => (
          <span key={i} style={{ height: size, lineHeight: `${size}px` }}>
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  );
};

const Contador: React.FC<{ valor: string; legenda: string; claro: boolean }> = ({ valor, legenda, claro }) => {
  const frame = useCurrentFrame();
  const { u, width } = useLayout();
  const size = Math.min(300 * u, (width * 0.7) / (valor.length * 0.6));
  const legY = anim(frame, [14, 41], [20 * u, 0]);
  const legO = anim(frame, [14, 30], [0, 1]);
  const corNum = claro ? cor.bg : cor.laranja;
  return (
    <Fundo claro={claro}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 24 * u }}>
          <div style={{ ...titulo(size), letterSpacing: "-0.06em", color: corNum, display: "flex", fontVariantNumeric: "tabular-nums" }}>
            {valor.split("").map((ch, i) =>
              /\d/.test(ch) ? (
                <Digito key={i} alvo={Number(ch)} atraso={i * 3} size={size} />
              ) : (
                <span key={i} style={{ height: size, lineHeight: `${size}px` }}>
                  {ch}
                </span>
              ),
            )}
          </div>
          <div
            style={{
              ...titulo(48 * u),
              letterSpacing: "-0.04em",
              color: claro ? cor.bg : cor.texto,
              opacity: legO,
              transform: `translateY(${legY}px)`,
              paddingLeft: size * 0.05,
            }}
          >
            {legenda}
          </div>
        </div>
      </AbsoluteFill>
    </Fundo>
  );
};

export const Contadores: React.FC = () => (
  <AbsoluteFill>
    {contadores.map((c, i) => (
      <Sequence key={i} from={i * 60} durationInFrames={60}>
        <Contador valor={c.valor} legenda={c.legenda} claro={i === 0} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
