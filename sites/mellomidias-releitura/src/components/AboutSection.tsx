"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { about } from "@/data/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function AboutSection() {
  const section = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = section.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add({
      motion: "(prefers-reduced-motion: no-preference)",
      desktop: "(min-width: 1024px)",
    }, (context) => {
      const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
      if (!motion) return;

      // 1. Revelação: o retrato abre de um círculo no rosto até a tela cheia, amarrado ao scroll.
      gsap.fromTo(".about-photo", { clipPath: "circle(12% at 50% 30%)" }, {
        clipPath: "circle(80% at 50% 45%)", ease: "power2.inOut",
        scrollTrigger: { trigger: ".about-founder", start: desktop ? "top 75%" : "top 90%", end: desktop ? "top 5%" : "top 20%", scrub: 0.8 },
      });

      // 2. Parallax em camadas: luz < retrato < texto. A foto anda mais devagar que a página.
      const passage = { trigger: root, start: "top bottom", end: "bottom top", scrub: true } as const;
      gsap.fromTo(".about-photo", { y: desktop ? -70 : -30 }, { y: desktop ? 90 : 40, ease: "none", scrollTrigger: passage });
      gsap.fromTo(".about-glow-wrap", { y: desktop ? -140 : -60 }, { y: desktop ? 160 : 70, ease: "none", scrollTrigger: passage });

      // 3. Nome gigante vazado atravessando por trás do retrato.
      gsap.fromTo(".about-name span", { xPercent: desktop ? 8 : 12 }, { xPercent: desktop ? -58 : -72, ease: "none", scrollTrigger: passage });

      // 4. Etiqueta de nome entra depois do retrato, em cascata.
      gsap.from(".about-founder-tag > *", {
        y: 18, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: ".about-founder", start: desktop ? "top 20%" : "top 35%", once: true },
      });

      gsap.from(".about-point", {
        y: 24, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: ".about-points", start: "top 85%", once: true },
      });
    });
    return () => media.revert();
  }, { scope: section });

  return (
    <section ref={section} id="quem-somos" className="section about-section" aria-labelledby="quem-somos-title">
      <figure className="about-founder">
        <div className="about-glow-wrap" aria-hidden="true"><div className="about-glow" /></div>
        <div className="about-name" aria-hidden="true"><span>{about.founder.name}</span></div>
        <div className="about-photo">
          <img src={about.founder.photo} srcSet={`${about.founder.photoSmall} 480w, ${about.founder.photo} 880w`} sizes="(min-width: 1024px) 54vw, (min-width: 640px) 640px, 100vw" width={880} height={1100} alt={about.founder.alt} loading="lazy" decoding="async" />
        </div>
        <figcaption className="about-founder-tag">
          <span className="about-tag-line" aria-hidden="true" />
          <strong>{about.founder.name}</strong>
          <span>{about.founder.role}</span>
        </figcaption>
      </figure>

      <div className="container about-layout">
        <div className="about-copy">
          <p className="eyebrow">{about.eyebrow}</p>
          <h2 id="quem-somos-title">Uma assessoria que pensa no <span className="text-accent">crescimento</span> da sua clínica. Não só nas campanhas.</h2>
          <p className="lead">{about.description}</p>
          <p>{about.approach}</p>
          <ol className="about-points">
            {about.differentiators.map((point, index) => (
              <li key={point.id} className="about-point">
                <span className="about-point-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{point.title}</h3>
                  <p>{point.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
