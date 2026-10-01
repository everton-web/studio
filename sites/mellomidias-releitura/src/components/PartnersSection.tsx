"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { partners } from "@/data/content";
import { clamp, scrollMotion } from "@/lib/scroll-motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function PartnersSection() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useGSAP(() => {
    const root = section.current;
    const rail = track.current;
    if (!root || !rail) return;
    const media = gsap.matchMedia();

    media.add({
      motion: "(prefers-reduced-motion: no-preference)",
      desktop: "(min-width: 1024px) and (pointer: fine)",
    }, (context) => {
      const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
      if (!motion) return;
      root.dataset.motionReady = "true";
      const wrap = gsap.utils.wrap(-50, 0);
      const setX = gsap.quickSetter(rail, "xPercent");
      // No celular a velocidade reage ao scroll, mas sem skew (menos trabalho por frame).
      const skew = desktop ? gsap.quickTo(rail, "skewX", { duration: 0.5, ease: "power3.out" }) : null;
      let position = 0;
      let visible = false;
      let hovering = false;
      let boost = 1;

      ScrollTrigger.create({ trigger: root, start: "top bottom", end: "bottom top", onToggle: (self) => { visible = self.isActive; } });
      const enter = () => { hovering = true; };
      const leave = () => { hovering = false; };
      rail.addEventListener("pointerenter", enter);
      rail.addEventListener("pointerleave", leave);

      // Base: meia volta em 36s. O scroll acelera a faixa e inverte o sentido quando a página sobe.
      const tick = (_time: number, delta: number) => {
        if (!visible || document.hidden) return;
        const velocity = scrollMotion.velocity;
        const stopped = pausedRef.current || hovering;
        const target = stopped ? 0 : 1 + Math.min(6, Math.abs(velocity) * 0.5);
        boost += (target - boost) * 0.08;
        const direction = velocity < -0.5 ? -1 : 1;
        position = wrap(position - (delta / 1000) * (50 / 36) * boost * direction);
        setX(position);
        if (skew) skew(stopped ? 0 : clamp(velocity * -0.3, -8, 8));
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        rail.removeEventListener("pointerenter", enter);
        rail.removeEventListener("pointerleave", leave);
        gsap.set(rail, { clearProps: "transform" });
        delete root.dataset.motionReady;
      };
    });
    return () => media.revert();
  }, { scope: section });

  return (
    <section ref={section} id="parceiros" className="partners-section" aria-labelledby="parceiros-title" data-motion-paused={paused}>
      <div className="container partners-heading">
        <div className="partners-title"><p className="eyebrow">Parceiros</p><h2 id="parceiros-title">Clínicas que já cresceram com a Mello Mídias</h2></div>
        <button className="motion-toggle motion-toggle-icon" type="button" aria-label={paused ? "Retomar faixa de parceiros" : "Pausar faixa de parceiros"} aria-controls="partners-marquee" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{paused ? <path d="m8 5 11 7-11 7Z" /> : <path d="M8 5v14M16 5v14" />}</svg>
        </button>
      </div>
      <div id="partners-marquee" className="partners-window">
        <div ref={track} className="partners-track">
          {[0, 1].map((copy) => <ul key={copy} className="partners-list" aria-hidden={copy === 1 ? true : undefined}>
            {partners.map((partner) => <li key={partner.id} className={`partner-logo partner-logo-${partner.id}`}>
              <img src={`/brand/parceiros/${partner.id}.webp`} width={partner.width} height={partner.height} alt={copy === 1 ? "" : partner.name} loading="lazy" decoding="async" draggable={false} />
            </li>)}
          </ul>)}
        </div>
      </div>
    </section>
  );
}
