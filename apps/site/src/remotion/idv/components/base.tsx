import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { cor, easeOut, fonte } from "../tokens";

export const SIMBOLO = "M50 10 Q58.6 45 84.6 70 Q50 60 15.4 70 Q41.4 45 50 10Z";

/** Unidade de escala: 1 = 1px num quadro de 1080 no lado menor. */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  return { width, height, u, vertical: height > width };
};

/** interpolate com clamp e easing de entrada padrão. */
export const anim = (
  frame: number,
  range: [number, number],
  out: [number, number],
  easing: (t: number) => number = easeOut,
) =>
  interpolate(frame, range, out, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Fundo com grade de pontos de 26px e grão leve. */
export const Fundo: React.FC<{ claro?: boolean; grade?: boolean; children?: React.ReactNode }> = ({
  claro,
  grade = true,
  children,
}) => {
  const frame = useCurrentFrame();
  const { u } = useLayout();
  const passo = 26 * u;
  return (
    <AbsoluteFill style={{ background: claro ? cor.texto : cor.bg, fontFamily: fonte, overflow: "hidden" }}>
      {grade && (
        <AbsoluteFill
          style={{
            backgroundImage: `radial-gradient(circle, ${claro ? cor.pontoEscuro : cor.ponto} ${1.1 * u}px, transparent ${1.3 * u}px)`,
            backgroundSize: `${passo}px ${passo}px`,
          }}
        />
      )}
      {children}
      <Grao seed={frame % 8} />
    </AbsoluteFill>
  );
};

const Grao: React.FC<{ seed: number }> = ({ seed }) => (
  <AbsoluteFill style={{ opacity: 0.08, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <svg width="100%" height="100%">
      <filter id={`grao${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grao${seed})`} />
    </svg>
  </AbsoluteFill>
);

export const Simbolo: React.FC<{ size: number; color?: string; style?: React.CSSProperties }> = ({
  size,
  color = cor.texto,
  style,
}) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
    <path d={SIMBOLO} fill={color} />
  </svg>
);

/** Texto com o ponto final em laranja. */
export const ComPonto: React.FC<{ texto: string; corPonto?: string }> = ({ texto, corPonto = cor.laranja }) =>
  texto.endsWith(".") ? (
    <>
      {texto.slice(0, -1)}
      <span style={{ color: corPonto }}>.</span>
    </>
  ) : (
    <>{texto}</>
  );

export const titulo = (size: number): React.CSSProperties => ({
  fontFamily: fonte,
  fontWeight: 500,
  fontSize: size,
  letterSpacing: "-0.075em",
  lineHeight: 1,
});

export const rotulo = (size: number): React.CSSProperties => ({
  fontFamily: fonte,
  fontWeight: 500,
  fontSize: size,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
});

/** Line reveal: cada linha sobe de 110% dentro de uma máscara, 33f, 4f entre linhas. */
export const LineReveal: React.FC<{
  linhas: React.ReactNode[];
  inicio?: number;
  style?: React.CSSProperties;
  align?: "flex-start" | "center" | "flex-end";
}> = ({ linhas, inicio = 0, style, align = "flex-start" }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align, ...style }}>
      {linhas.map((l, i) => {
        const y = anim(frame, [inicio + i * 4, inicio + i * 4 + 33], [110, 0]);
        return (
          <div key={i} style={{ overflow: "hidden", paddingBottom: "0.18em", marginBottom: "-0.18em" }}>
            <div style={{ transform: `translateY(${y}%)`, whiteSpace: "nowrap" }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
};
