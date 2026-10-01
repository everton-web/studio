"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { finalCta, site } from "@/data/content";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

// Símbolo M redesenhado em vetor a partir de /brand/simbolo-m.webp (256 x 202) para poder desenhar o contorno.
const SYMBOL_PATHS = [
  "M62 1L128 52L195 1V37L128 91L62 37Z",
  "M0 27L128 126L256 27V142L204 182V141L128 202L52 141V181L0 141Z",
];

type Media = { webm: boolean; mp4: boolean; poster: boolean };

export function FinalCtaSection({ media }: { media: Media }) {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const hasVideo = media.webm || media.mp4;

  // Mesmo loop do hero (já em cache): só toca enquanto o bloco está na tela.
  useEffect(() => {
    const element = video.current;
    const root = section.current;
    if (!element || !root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      if (reduced.matches || !visible || document.hidden) element.pause();
      else {
        element.dataset.ready = "true";
        void element.play().catch(() => { /* Política de autoplay: fica o poster. */ });
      }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { rootMargin: "200px" });
    observer.observe(root);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      element.pause();
    };
  }, []);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".final-card", {
        y: 48, opacity: 0, scale: 0.97, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".final-card", start: "top 85%", once: true },
      });
      gsap.from(".final-content > :not(.final-symbol)", {
        y: 24, opacity: 0, duration: 0.7, stagger: 0.1, delay: 0.2, ease: "power3.out",
        scrollTrigger: { trigger: ".final-card", start: "top 85%", once: true },
      });

      // O M desenha o contorno e depois preenche, conforme o bloco sobe na tela.
      gsap.timeline({
        scrollTrigger: { trigger: ".final-card", start: "top 80%", end: "top 25%", scrub: 0.6 },
      })
        .fromTo(".final-symbol path", { drawSVG: "0%", fillOpacity: 0 }, { drawSVG: "100%", duration: 1, stagger: 0.25, ease: "power1.inOut" })
        .to(".final-symbol path", { fillOpacity: 1, duration: 0.5, ease: "power2.out" }, ">-0.1")
        .fromTo(".final-symbol", { scale: 0.85 }, { scale: 1, duration: 1.5, ease: "power2.out" }, 0);

      // A faixa de luz atravessa o bloco acompanhando o scroll.
      gsap.fromTo(".final-bands", { yPercent: 28, xPercent: -8, rotate: 4 }, {
        yPercent: -30, xPercent: 8, rotate: -4, ease: "none",
        scrollTrigger: { trigger: ".final-card", start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    return () => media.revert();
  }, { scope: section });

  return (
    <section ref={section} id="cta-final" className="section final-section" aria-labelledby="cta-final-title">
      <div className="container">
        <div className="final-card">
          <div className="final-backdrop" aria-hidden="true">
            <div className="final-bands">
              <div className="final-band final-band-a" />
              <div className="final-band final-band-b" />
            </div>
            {hasVideo && (
              <video ref={video} className="final-video" muted loop playsInline preload="none" poster={media.poster ? "/media/hero-poster.jpg" : undefined} tabIndex={-1} disablePictureInPicture>
                {media.webm && <source src="/media/hero-loop.webm" type="video/webm" />}
                {media.mp4 && <source src="/media/hero-loop.mp4" type="video/mp4" />}
              </video>
            )}
            <div className="final-shade" />
          </div>
          <div className="final-content">
            <svg className="final-symbol" viewBox="-2 -2 260 206" width="64" height="51" aria-hidden="true" focusable="false">
              {SYMBOL_PATHS.map((d) => <path key={d} d={d} />)}
            </svg>
            <h2 id="cta-final-title">{finalCta.title}</h2>
            <p className="lead">{finalCta.description}</p>
            <a className="button button-light final-cta" href={site.ctaHref}>
              {site.cta}
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
