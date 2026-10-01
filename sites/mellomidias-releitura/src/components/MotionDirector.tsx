"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// Tom do fundo por seção: a luz ambiente muda de lugar e de intensidade conforme a página avança,
// o que costura as seções num movimento contínuo (motion design) sem tocar no layout.
type Tone = { tint: number; x: number; y: number; glow: number; scale: number };
const TONES: Record<string, Tone> = {
  manifesto: { tint: 0, x: 0, y: 10, glow: 0.35, scale: 0.9 },
  "faixa-cinetica": { tint: 0.35, x: 30, y: 0, glow: 0.7, scale: 1.2 },
  metodo: { tint: 0.15, x: -35, y: -20, glow: 0.45, scale: 1 },
  resultados: { tint: 0.55, x: -30, y: 25, glow: 0.8, scale: 1.25 },
  "quem-somos": { tint: 0.4, x: 35, y: -10, glow: 0.75, scale: 1.15 },
  formulario: { tint: 0.1, x: 0, y: 30, glow: 0.3, scale: 0.9 },
  faq: { tint: 0, x: -30, y: 0, glow: 0.2, scale: 0.8 },
  "cta-final": { tint: 0.6, x: 0, y: 20, glow: 0.9, scale: 1.3 },
};
const REST: Tone = { tint: 0, x: 0, y: 0, glow: 0, scale: 0.8 };

// Seções que recebem a linha de luz (wipe) desenhando no topo quando entram.
const SEAMS = ["manifesto", "metodo", "resultados", "quem-somos", "faq", "cta-final"];

export function MotionDirector() {
  const ambient = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const layer = ambient.current;
    if (!layer) return;
    const tint = layer.querySelector<HTMLElement>(".ambient-tint");
    const glow = layer.querySelector<HTMLElement>(".ambient-glow");
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      // 1. Tom e luz ambiente por seção.
      const go = (tone: Tone) => {
        gsap.to(tint, { opacity: tone.tint, duration: 1.4, ease: "power2.out", overwrite: "auto" });
        gsap.to(glow, { xPercent: tone.x, yPercent: tone.y, opacity: tone.glow, scale: tone.scale, duration: 1.8, ease: "power3.out", overwrite: "auto" });
      };
      Object.entries(TONES).forEach(([id, tone]) => {
        const section = document.getElementById(id);
        if (!section) return;
        ScrollTrigger.create({
          trigger: section, start: "top 55%", end: "bottom 55%",
          onToggle: (self) => { if (self.isActive) go(tone); },
        });
      });
      const hero = document.getElementById("hero");
      if (hero) ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom 55%", onEnterBack: () => go(REST) });

      // 2. Wipe: uma linha de luz vermelha abre do centro para as bordas no topo da seção.
      const seamHosts: HTMLElement[] = [];
      SEAMS.forEach((id) => {
        const section = document.getElementById(id);
        if (!section) return;
        section.classList.add("seam-host");
        seamHosts.push(section);
        gsap.fromTo(section, { "--seam": 0 }, {
          "--seam": 1, ease: "none",
          scrollTrigger: { trigger: section, start: "top 95%", end: "top 35%", scrub: 0.6 },
        });
      });

      // 3. Títulos de seção: palavra por palavra saindo de uma máscara, amarrado ao scroll.
      let active = true;
      const splits: SplitText[] = [];
      const context = gsap.context(() => {});
      void document.fonts.ready.then(() => {
        if (!active) return;
        context.add(() => {
          gsap.utils.toArray<HTMLElement>("main section:not(#hero):not(#manifesto):not(#parceiros) h2").forEach((heading) => {
            splits.push(SplitText.create(heading, {
              type: "words", mask: "words", wordsClass: "h2-word", autoSplit: true,
              onSplit: (self) => gsap.fromTo(self.words,
                { yPercent: 115, rotate: 5, opacity: 0 },
                {
                  yPercent: 0, rotate: 0, opacity: 1, ease: "power3.out", stagger: 0.08,
                  scrollTrigger: { trigger: heading, start: "top 92%", end: "top 58%", scrub: 0.7 },
                }),
            }));
          });
          ScrollTrigger.sort();
          ScrollTrigger.refresh();
        });
      });

      return () => {
        active = false;
        context.revert();
        splits.forEach((split) => split.revert());
        seamHosts.forEach((section) => { section.classList.remove("seam-host"); section.style.removeProperty("--seam"); });
      };
    });

    // 4. Imagens lazy mudam alturas medidas: recalcula os gatilhos depois que carregam.
    let timer = 0;
    const queueRefresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
    };
    const pending = Array.from(document.querySelectorAll<HTMLImageElement>("main img")).filter((image) => !image.complete);
    pending.forEach((image) => image.addEventListener("load", queueRefresh, { once: true }));
    window.addEventListener("load", queueRefresh, { once: true });
    ScrollTrigger.sort();

    return () => {
      window.clearTimeout(timer);
      pending.forEach((image) => image.removeEventListener("load", queueRefresh));
      window.removeEventListener("load", queueRefresh);
      media.revert();
    };
  }, []);

  return (
    <div ref={ambient} className="ambient" aria-hidden="true">
      <div className="ambient-tint" />
      <div className="ambient-glow" />
    </div>
  );
}
