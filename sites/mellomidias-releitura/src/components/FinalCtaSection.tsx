"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { finalCta, site, brand } from "@/data/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
      gsap.from(".final-content > *", {
        y: 24, opacity: 0, duration: 0.7, stagger: 0.1, delay: 0.2, ease: "power3.out",
        scrollTrigger: { trigger: ".final-card", start: "top 85%", once: true },
      });
    });
    return () => media.revert();
  }, { scope: section });

  return (
    <section ref={section} id="cta-final" className="section final-section" aria-labelledby="cta-final-title">
      <div className="container">
        <div className="final-card">
          <div className="final-backdrop" aria-hidden="true">
            <div className="final-band final-band-a" />
            <div className="final-band final-band-b" />
            {hasVideo && (
              <video ref={video} className="final-video" muted loop playsInline preload="none" poster={media.poster ? "/media/hero-poster.jpg" : undefined} tabIndex={-1} disablePictureInPicture>
                {media.webm && <source src="/media/hero-loop.webm" type="video/webm" />}
                {media.mp4 && <source src="/media/hero-loop.mp4" type="video/mp4" />}
              </video>
            )}
            <div className="final-shade" />
          </div>
          <div className="final-content">
            <img className="final-symbol" src={brand.symbol.src} width={brand.symbol.width} height={brand.symbol.height} alt="" loading="lazy" />
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
