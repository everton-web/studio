import React from "react";
import { AbsoluteFill, Sequence, random, useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import { Fundo, SIMBOLO, anim, rotulo, titulo, useLayout } from "../components/base";
import { cor, easeInOut } from "../tokens";

const PIXELS = Array.from({ length: 46 }).map((_, i) => ({
  x: random(`x${i}`) * 2 - 1,
  y: random(`y${i}`) * 2 - 1,
  t: 50 + Math.floor(random(`t${i}`) * 18),
  vida: 8 + Math.floor(random(`v${i}`) * 10),
  laranja: random(`c${i}`) > 0.86,
  s: 0.6 + random(`s${i}`) * 0.8,
}));

const Construcao: React.FC = () => {
  const frame = useCurrentFrame();
  const { u, width, height, vertical } = useLayout();

  const tracado = anim(frame, [0, 34], [0, 1], easeInOut);
  const { strokeDasharray, strokeDashoffset } = evolvePath(tracado, SIMBOLO);
  const preench = anim(frame, [28, 42], [0, 1]);
  const tam = anim(frame, [42, 62], [400 * u, 130 * u], easeInOut);
  const pontosO = anim(frame, [6, 20], [0, 1]) * anim(frame, [40, 50], [1, 0]);
  const girar = anim(frame, [0, 60], [0, 50], (t) => t);

  // Palavras abrindo a partir do símbolo
  const abre = anim(frame, [72, 96], [0, 1]);
  const some = anim(frame, [100, 106], [1, 0]);
  const dist = (vertical ? 150 : 330) * u * abre;

  // Assinatura final
  const lock = anim(frame, [104, 120], [0, 1], easeInOut);
  const nomeW = anim(frame, [106, 124], [0, 1]);
  const tamFinal = tam * (1 - 0.25 * lock);

  return (
    <Fundo>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* pontos em órbita */}
        {[0, 1, 2].map((i) => {
          const a = ((girar + i * 120) * Math.PI) / 180;
          const r = 280 * u;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: (i === 1 ? 22 : 14) * u,
                height: (i === 1 ? 22 : 14) * u,
                borderRadius: "50%",
                background: i === 1 ? cor.laranja : cor.texto,
                opacity: pontosO,
                transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px)`,
              }}
            />
          );
        })}

        {/* pixels */}
        {PIXELS.map((p, i) => {
          const vivo = frame >= p.t && frame < p.t + p.vida;
          if (!vivo) return null;
          const s = 26 * u * p.s;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: s,
                height: s,
                background: p.laranja ? cor.laranja : cor.texto,
                transform: `translate(${p.x * width * 0.42}px, ${p.y * height * 0.4}px)`,
                opacity: anim(frame, [p.t, p.t + 3], [0, 1]),
              }}
            />
          );
        })}

        {/* palavras */}
        <div
          style={{
            position: "absolute",
            ...titulo(84 * u),
            letterSpacing: "-0.05em",
            color: cor.texto,
            opacity: abre * some,
            transform: vertical ? `translateY(${-dist}px)` : `translateX(${-dist}px)`,
          }}
        >
          Design que
        </div>
        <div
          style={{
            position: "absolute",
            ...titulo(84 * u),
            letterSpacing: "-0.05em",
            color: cor.texto,
            opacity: abre * some,
            transform: vertical ? `translateY(${dist}px)` : `translateX(${dist}px)`,
          }}
        >
          conecta.
        </div>

        {/* símbolo + assinatura */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 * u * lock }}>
          <svg viewBox="0 0 100 100" width={tamFinal} height={tamFinal} style={{ overflow: "visible" }}>
            <path
              d={SIMBOLO}
              fill={cor.texto}
              fillOpacity={preench}
              stroke={cor.texto}
              strokeWidth={0.8}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div style={{ overflow: "hidden", width: nomeW * 600 * u, whiteSpace: "nowrap" }}>
            <span style={{ fontWeight: 600, fontSize: 130 * u, letterSpacing: "-0.06em", color: cor.texto, lineHeight: 1.2 }}>
              everton<span style={{ color: cor.laranja }}>.</span>
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </Fundo>
  );
};

const Final: React.FC = () => {
  const frame = useCurrentFrame();
  const { u } = useLayout();
  const aceso = frame >= 4;
  return (
    <Fundo claro grade={false}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 * u, flexDirection: "column" }}>
        <span style={{ fontWeight: 600, fontSize: 110 * u, letterSpacing: "-0.06em", color: cor.bg, lineHeight: 1.2 }}>
          everton<span style={{ color: aceso ? cor.laranja : cor.bg }}>.</span>
        </span>
        <span style={{ ...rotulo(24 * u), color: cor.bg }}>evertonbrito.com</span>
      </AbsoluteFill>
    </Fundo>
  );
};

export const Logo: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={120}>
      <Construcao />
    </Sequence>
    <Sequence from={120} durationInFrames={30}>
      <Final />
    </Sequence>
  </AbsoluteFill>
);
