"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clamp, scrollMotion } from "@/lib/scroll-motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const WORDS = ["Tráfego", "Comercial", "Dados"];

function Row({ outline }: { outline?: boolean }) {
  // Dois grupos idênticos: a faixa anda até -50% e volta ao início sem emenda.
  return (
    <div className={`kinetic-row${outline ? " kinetic-row-outline" : ""}`}>
      <div className="kinetic-track">
        {[0, 1].map((copy) => (
          <span key={copy} className="kinetic-group">
            {[0, 1].flatMap((repeat) => WORDS.map((word, index) => (
              <span key={`${repeat}-${word}`} className={`kinetic-word${(index + repeat) % 2 ? " kinetic-word-ghost" : ""}`}>{word}<i>·</i></span>
            )))}
          </span>
        ))}
      </div>
    </div>
  );
}

export function KineticBand() {
  const section = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = section.current;
    if (!root) return;
    const tracks = gsap.utils.toArray<HTMLElement>(".kinetic-track", root);
    const media = gsap.matchMedia();

    media.add({
      motion: "(prefers-reduced-motion: no-preference)",
      desktop: "(min-width: 1024px) and (pointer: fine)",
    }, (context) => {
      const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
      if (!motion) return;
      const wrap = gsap.utils.wrap(-50, 0);
      const setters = tracks.map((track) => gsap.quickSetter(track, "xPercent"));
      const skewers = desktop ? tracks.map((track) => gsap.quickTo(track, "skewX", { duration: 0.4, ease: "power3.out" })) : [];
      const positions = [0, -25];
      let visible = false;

      // Deslocamento amarrado ao scroll: as linhas correm em sentidos opostos enquanto a faixa passa.
      const travel = { value: 0 };
      gsap.to(travel, {
        value: 1, ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true, onToggle: (self) => { visible = self.isActive; } },
      });

      let lastTravel = 0;
      const tick = (_time: number, delta: number) => {
        if (!visible) return;
        const velocity = scrollMotion.velocity;
        const step = (travel.value - lastTravel) * 40; // parte proporcional ao scroll
        lastTravel = travel.value;
        const drift = (delta / 1000) * 1.6; // deriva lenta mesmo parado
        positions[0] = wrap(positions[0] - drift - step);
        positions[1] = wrap(positions[1] + drift + step);
        setters[0](positions[0]);
        setters[1](positions[1]);
        if (skewers.length) {
          const skew = clamp(velocity * -0.35, -10, 10);
          skewers[0](skew);
          skewers[1](-skew);
        }
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        gsap.set(tracks, { clearProps: "transform" });
      };
    });
    return () => media.revert();
  }, { scope: section });

  return (
    <section ref={section} id="faixa-cinetica" className="kinetic-band" aria-hidden="true">
      <Row />
      <Row outline />
    </section>
  );
}
