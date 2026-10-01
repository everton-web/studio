"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { method } from "@/data/content";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

export function MethodSection() {
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const line = useRef<SVGSVGElement>(null);
  const progress = useRef<SVGPathElement>(null);

  useGSAP(() => {
    const root = section.current;
    const windowElement = viewport.current;
    const rail = track.current;
    const svg = line.current;
    const path = progress.current;
    if (!root || !windowElement || !rail || !svg || !path) return;

    // O traço é desenhado em pixels reais: o SVG ganha o tamanho medido da linha a cada refresh.
    const fitLine = () => {
      const box = svg.getBoundingClientRect();
      const width = Math.max(2, Math.round(box.width));
      const height = Math.max(2, Math.round(box.height));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      path.setAttribute("d", width >= height ? `M0 ${height / 2}H${width}` : `M${width / 2} 0V${height}`);
    };

    const media = gsap.matchMedia();
    media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      root.dataset.horizontal = "true";
      fitLine();
      ScrollTrigger.addEventListener("refreshInit", fitLine);
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
      journey.fromTo(path, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1 }, 0);

      // Cada card gira e cresce de leve até assentar quando chega ao centro da janela.
      rail.querySelectorAll<HTMLElement>(".method-step").forEach((step, index) => {
        const card = step.querySelector(".method-card");
        const number = step.querySelector(".method-number");
        if (index === 0) return; // o primeiro já começa no lugar
        gsap.fromTo(card, { rotate: 3, scale: 0.92, opacity: 0.35, transformOrigin: "50% 50%" }, {
          rotate: 0, scale: 1, opacity: 1, ease: "power2.out",
          scrollTrigger: { trigger: step, containerAnimation: journey, start: "left 95%", end: "center 55%", scrub: true },
        });
        gsap.fromTo(number, { scale: 0.6, opacity: 0.4 }, {
          scale: 1, opacity: 1, ease: "back.out(2)",
          scrollTrigger: { trigger: step, containerAnimation: journey, start: "left 80%", end: "left 55%", scrub: true },
        });
      });
      return () => {
        ScrollTrigger.removeEventListener("refreshInit", fitLine);
        delete root.dataset.horizontal;
      };
    });

    media.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
      fitLine();
      ScrollTrigger.addEventListener("refreshInit", fitLine);
      gsap.fromTo(path, { drawSVG: "0%" }, {
        drawSVG: "100%", ease: "none",
        scrollTrigger: { trigger: rail, start: "top 65%", end: "bottom 65%", scrub: true, invalidateOnRefresh: true },
      });
      rail.querySelectorAll<HTMLElement>(".method-step").forEach((step, index) => {
        gsap.fromTo(step.querySelector(".method-card"), { y: 36, rotate: index % 2 ? -2.5 : 2.5, opacity: 0, transformOrigin: "0% 100%" }, {
          y: 0, rotate: 0, opacity: 1, ease: "power2.out",
          scrollTrigger: { trigger: step, start: "top 92%", end: "top 62%", scrub: 0.5 },
        });
      });
      return () => ScrollTrigger.removeEventListener("refreshInit", fitLine);
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
            <div className="method-line" aria-hidden="true">
              <svg ref={line} className="method-line-svg" viewBox="0 0 2 2" preserveAspectRatio="none" focusable="false">
                <path ref={progress} className="method-line-draw" d="M1 0V2" />
              </svg>
            </div>
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
