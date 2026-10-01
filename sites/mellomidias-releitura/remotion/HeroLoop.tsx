import { AbsoluteFill, useCurrentFrame } from "remotion";

export const HERO_LOOP = { width: 1920, height: 1080, fps: 30, frames: 180 } as const;

/*
 * Loop perfeito: todo movimento depende de `phase = 2π · frame / 180` multiplicado
 * por inteiros (ou de frações de período 1 no dashoffset). O quadro 180 é idêntico
 * ao quadro 0, então o vídeo emenda sem salto. Sem texto, só luz.
 */

type Point = readonly [number, number];

type Ribbon = {
  id: string;
  from: Point;
  to: Point;
  amp: number; // amplitude da ondulação, em px
  waves: number; // quantas meias ondas ao longo da faixa
  speed: number; // inteiro: voltas da fase por loop
  seed: number;
  threads: number; // fios de luz que formam a faixa
  spacing: number; // distância entre fios
  glow: number; // largura do halo desfocado
  intensity: number;
};

const RIBBONS: Ribbon[] = [
  { id: "a", from: [760, 1240], to: [1980, -120], amp: 70, waves: 1.6, speed: 1, seed: 0.4, threads: 9, spacing: 9, glow: 220, intensity: 1 },
  { id: "b", from: [1040, 1260], to: [2080, 40], amp: 90, waves: 1.2, speed: 1, seed: 2.1, threads: 7, spacing: 12, glow: 260, intensity: 0.75 },
  { id: "c", from: [560, 1220], to: [1720, -160], amp: 55, waves: 2, speed: 2, seed: 4.3, threads: 5, spacing: 7, glow: 140, intensity: 0.5 },
  { id: "d", from: [1320, 1200], to: [2120, 320], amp: 60, waves: 1, speed: 1, seed: 5.6, threads: 6, spacing: 10, glow: 200, intensity: 0.55 },
];

const SAMPLES = 120;
const TAU = Math.PI * 2;

function ribbonPath(ribbon: Ribbon, phase: number, offset: number) {
  const [x0, y0] = ribbon.from;
  const [x1, y1] = ribbon.to;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const length = Math.hypot(dx, dy);
  const nx = -dy / length;
  const ny = dx / length;
  let d = "";
  for (let i = 0; i < SAMPLES; i++) {
    const t = i / (SAMPLES - 1);
    const envelope = Math.sin(Math.PI * t) ** 0.6;
    const wave = ribbon.amp * envelope * Math.sin(t * Math.PI * ribbon.waves + phase * ribbon.speed + ribbon.seed);
    // A faixa abre e fecha como tecido: o espaçamento entre fios respira no tempo.
    const breathe = 1 + 0.45 * Math.sin(t * TAU + phase + ribbon.seed);
    const shift = wave + offset * breathe;
    const x = x0 + dx * t + nx * shift;
    const y = y0 + dy * t + ny * shift;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

export function HeroLoop() {
  const frame = useCurrentFrame();
  const progress = (frame % HERO_LOOP.frames) / HERO_LOOP.frames;
  const phase = progress * TAU;
  const ambient = 0.5 + 0.5 * Math.sin(phase);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0507" }}>
      <svg width={HERO_LOOP.width} height={HERO_LOOP.height} viewBox={`0 0 ${HERO_LOOP.width} ${HERO_LOOP.height}`}>
        <defs>
          <radialGradient id="ambient-top" cx="0.08" cy="0" r="0.55">
            <stop offset="0" stopColor="#7a0a10" stopOpacity={0.55 + 0.15 * ambient} />
            <stop offset="1" stopColor="#0a0507" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ambient-low" cx="0.62" cy="1" r="0.6">
            <stop offset="0" stopColor="#b3101a" stopOpacity={0.4 + 0.15 * (1 - ambient)} />
            <stop offset="1" stopColor="#0a0507" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.6" />
          </radialGradient>
          {RIBBONS.map((ribbon) => (
            <linearGradient key={ribbon.id} id={`fade-${ribbon.id}`} gradientUnits="userSpaceOnUse" x1={ribbon.from[0]} y1={ribbon.from[1]} x2={ribbon.to[0]} y2={ribbon.to[1]}>
              <stop offset="0" stopColor="#e1141e" stopOpacity="0" />
              <stop offset="0.25" stopColor="#c0101a" stopOpacity="0.9" />
              <stop offset="0.55" stopColor="#ff3b2f" />
              <stop offset="0.8" stopColor="#c0101a" stopOpacity="0.8" />
              <stop offset="1" stopColor="#e1141e" stopOpacity="0" />
            </linearGradient>
          ))}
          {RIBBONS.map((ribbon) => (
            <linearGradient key={`hot-${ribbon.id}`} id={`hot-${ribbon.id}`} gradientUnits="userSpaceOnUse" x1={ribbon.from[0]} y1={ribbon.from[1]} x2={ribbon.to[0]} y2={ribbon.to[1]}>
              <stop offset="0.2" stopColor="#ff6a4a" stopOpacity="0" />
              <stop offset="0.5" stopColor="#ffb39c" />
              <stop offset="0.85" stopColor="#ff6a4a" stopOpacity="0" />
            </linearGradient>
          ))}
          <filter id="glow-wide" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="60" /></filter>
          <filter id="glow-mid" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14" /></filter>
          <filter id="glow-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4" /></filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#ambient-top)" />
        <rect width="100%" height="100%" fill="url(#ambient-low)" />

        {RIBBONS.map((ribbon) => {
          const center = ribbonPath(ribbon, phase, 0);
          const half = (ribbon.threads - 1) / 2;
          return (
            <g key={ribbon.id} style={{ mixBlendMode: "screen" }}>
              <path d={center} stroke={`url(#fade-${ribbon.id})`} strokeWidth={ribbon.glow} fill="none" opacity={0.32 * ribbon.intensity} filter="url(#glow-wide)" strokeLinecap="round" />
              <path d={center} stroke={`url(#fade-${ribbon.id})`} strokeWidth={ribbon.spacing * ribbon.threads} fill="none" opacity={0.45 * ribbon.intensity} filter="url(#glow-mid)" />
              <g filter="url(#glow-soft)">
                {Array.from({ length: ribbon.threads }, (_, index) => {
                  const offset = (index - half) * ribbon.spacing;
                  const weight = 1 - Math.abs(index - half) / (half + 1);
                  return <path key={index} d={ribbonPath(ribbon, phase, offset)} stroke={`url(#fade-${ribbon.id})`} strokeWidth={0.8 + weight * 1.6} fill="none" opacity={(0.25 + weight * 0.6) * ribbon.intensity} />;
                })}
              </g>
              <path d={center} stroke={`url(#hot-${ribbon.id})`} strokeWidth={1.6} fill="none" opacity={0.7 * ribbon.intensity} filter="url(#glow-soft)" />
              {/* Pulso de luz percorrendo a faixa: dashoffset com período 1 fecha o loop. */}
              <path d={center} pathLength={1} stroke="#ffd2c4" strokeWidth={5} fill="none" strokeDasharray="0.14 0.86" strokeDashoffset={-(progress * ribbon.speed) - ribbon.seed / TAU} opacity={0.8 * ribbon.intensity} filter="url(#glow-mid)" strokeLinecap="round" />
            </g>
          );
        })}

        <rect width="100%" height="100%" fill="url(#vignette)" />
      </svg>
    </AbsoluteFill>
  );
}
