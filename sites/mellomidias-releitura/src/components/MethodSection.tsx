"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { method } from "@/data/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function MethodSection() {
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const progress = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const root = section.current;
    const windowElement = viewport.current;
    const rail = track.current;
    if (!root || !windowElement || !rail) return;

    const media = gsap.matchMedia();
    media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      root.dataset.horizontal = "true";
      const distance = () => Math.max(0, rail.scrollWidth - windowElement.clientWidth);
      const journey = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: () => {
            const header = parseFloat(getComputedStyle(root).getPropertyValue("--header-height"));
            // Short windows can read the entire section before it pins.
            return `top ${Math.min(header, window.innerHeight - root.offsetHeight)}`;
          },
          end: () => `+=${Math.max(distance(), window.innerHeight)}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      journey.to(rail, { x: () => -distance(), duration: 1 }, 0);
      journey.fromTo(progress.current, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
      return () => { delete root.dataset.horizontal; };
    });

    media.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(progress.current, { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: rail, start: "top 65%", end: "bottom 65%", scrub: true },
      });
      rail.querySelectorAll<HTMLElement>(".method-step").forEach((step) => {
        gsap.from(step.querySelector(".method-card"), {
          y: 20, opacity: 0, duration: 0.6, ease: "power3.out",
          scrollTrigger: { trigger: step, start: "top 88%", once: true },
        });
      });
    });

    // matchMedia also reverts the pin, transforms and triggers on preference changes.
    return () => media.revert();
  }, { scope: section });

  return (
    <section ref={section} id="metodo" className="section method-section" aria-labelledby="metodo-title">
      <div className="container">
        <div className="method-heading">
          <h2 id="metodo-title">Como estruturamos o crescimento da sua clínica</h2>
          <p>Diagnóstico, tráfego, comercial e dados. Cada etapa prepara a próxima.</p>
        </div>
        <div ref={viewport} className="method-viewport">
          <div className="method-journey">
            <div className="method-line" aria-hidden="true"><span ref={progress} /></div>
            <ol ref={track} className="method-track">
              {method.map((step) => (
                <li key={step.id} className="method-step">
                  <span className="method-number" aria-hidden="true">{step.number}</span>
                  <div className="method-card">
                    <span className="method-ghost" aria-hidden="true">{step.number}</span>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
