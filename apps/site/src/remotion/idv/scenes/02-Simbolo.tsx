import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Fundo, Simbolo, anim, useLayout } from "../components/base";
import { cor, easeInOut } from "../tokens";

const ORBITAS = [
  { r: 230, vel: 2.2, fase: 0, laranja: false },
  { r: 340, vel: -1.4, fase: 120, laranja: true },
  { r: 460, vel: 0.9, fase: 240, laranja: false },
];

export const SimboloOrbita: React.FC = () => {
  const frame = useCurrentFrame();
  const { u } = useLayout();
  const entrada = anim(frame, [0, 24], [0.6, 1]);
  const opac = anim(frame, [0, 14], [0, 1]);
  const zoom = anim(frame, [72, 104], [1, 90], easeInOut);
  const orbitasOut = anim(frame, [68, 80], [1, 0]);
  const rot = anim(frame, [0, 90], [-10, 6]);
  const cobre = anim(frame, [100, 106], [0, 1]);

  return (
    <Fundo>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: opac * orbitasOut }}>
        {ORBITAS.map((o, i) => {
          const r = o.r * u * entrada;
          const ang = ((o.fase + frame * o.vel) * Math.PI) / 180;
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: "absolute",
                  width: r * 2,
                  height: r * 2,
                  borderRadius: "50%",
                  border: `${1.5 * u}px dashed ${cor.mudo}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  width: 12 * u,
                  height: 12 * u,
                  borderRadius: "50%",
                  background: o.laranja ? cor.laranja : cor.texto,
                  transform: `translate(${Math.cos(ang) * r}px, ${Math.sin(ang) * r}px)`,
                }}
              />
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: opac }}>
        <Simbolo
          size={220 * u}
          style={{ transform: `scale(${entrada * zoom}) rotate(${rot}deg)`, transformOrigin: "50% 50%" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: cor.texto, opacity: cobre }} />
    </Fundo>
  );
};
