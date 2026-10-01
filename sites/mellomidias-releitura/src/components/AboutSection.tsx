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
    media.add("(prefers-reduced-motion: no-preference)", () => {
      // Retrato abre de baixo para cima com máscara; o miolo desliza mais devagar (parallax).
      gsap.fromTo(".about-portrait", { clipPath: "inset(100% 0% 0% 0% round 20px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 1.2, ease: "power4.inOut",
        scrollTrigger: { trigger: ".about-portrait", start: "top 80%", once: true },
      });
      gsap.fromTo(".about-portrait-art", { yPercent: -8, scale: 1.12 }, {
        yPercent: 8, scale: 1.12, ease: "none",
        scrollTrigger: { trigger: ".about-portrait", start: "top bottom", end: "bottom top", scrub: true },
      });
      gsap.from(".about-founder-tag", {
        y: 16, opacity: 0, duration: 0.6, delay: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: ".about-portrait", start: "top 80%", once: true },
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

        <figure className="about-founder">
          <div className="about-portrait">
            <div className="about-portrait-art" aria-hidden="true">
              <span className="about-initials">{about.founder.initials}</span>
            </div>
            <span className="about-placeholder-note">{about.founder.placeholder}</span>
          </div>
          <figcaption className="about-founder-tag">
            <strong>{about.founder.name}</strong>
            <span>{about.founder.role}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
