"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { hero, site, stats } from "@/data/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type HeroMedia = { webm: boolean; mp4: boolean; poster: boolean };

export function HeroSection({ media }: { media: HeroMedia }) {
  const section = useRef<HTMLElement>(null);
  const title = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLAnchorElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const failedSources = useRef(new Set<string>());
  const [paused, setPaused] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const hasVideo = (media.webm || media.mp4) && !mediaFailed;
  const [before, after] = hero.title.split("Plano Estratégico");

  useEffect(() => {
    const element = video.current;
    const root = section.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      root.dataset.motionInactive = String(!visible || document.hidden);
      if (!element) return;
      if (paused || reduced.matches || !visible || document.hidden) element.pause();
      else void element.play().catch((error: unknown) => {
        // Autoplay policy and interrupted play() are recoverable. Keep the poster.
        if (error instanceof DOMException && error.name === "NotSupportedError") setMediaFailed(true);
      });
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(root);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      element?.pause();
    };
  }, [paused, hasVideo]);

  useGSAP(() => {
    const root = section.current;
    const heading = title.current;
    if (!root || !heading) return;
    const queries = gsap.matchMedia();
    queries.add("(prefers-reduced-motion: no-preference)", () => {
      let active = true;
      let split: { revert: () => void } | undefined;
      const original = heading.innerHTML;
      const animationContext = gsap.context(() => {}, root);
      const reveal = (targets: Element[]) => gsap.fromTo(targets,
        { yPercent: 105 },
        { yPercent: 0, duration: 0.8, stagger: 0.065, ease: "power4.out", clearProps: "transform" },
      );

      // Keep the server-rendered heading visible until fonts and the plugin are ready.
      void Promise.all([import("gsap/SplitText"), document.fonts.ready]).then(([{ SplitText }]) => {
        if (!active) return;
        animationContext.add(() => {
          gsap.registerPlugin(SplitText);
          split = SplitText.create(heading, {
            type: "lines", mask: "lines", linesClass: "hero-title-line",
            autoSplit: true, aria: "none",
            onSplit: (instance) => reveal(instance.lines),
          });
        });
      }).catch(() => {
        if (!active) return;
        split?.revert();
        heading.innerHTML = original;
        // A failed split must never change wrapping or leave partially hidden text.
        animationContext.add(() => {
          gsap.fromTo(heading, { opacity: 0.65 }, {
            opacity: 1, duration: 0.6, ease: "power2.out", clearProps: "opacity",
          });
        });
      });

      stats.forEach((stat) => {
        const target = root.querySelector<HTMLElement>(`[data-stat="${stat.id}"]`);
        if (!target) return;
        const count = { value: 0 };
        gsap.to(count, {
          value: stat.value, duration: 1.5, ease: "power2.out", snap: { value: 1 },
          scrollTrigger: { trigger: target, start: "top 92%", once: true },
          onStart: () => { target.textContent = `${stat.prefix}0${stat.suffix}`; },
          onUpdate: () => { target.textContent = `${stat.prefix}${count.value}${stat.suffix}`; },
          onComplete: () => { target.textContent = stat.display; },
        });
      });
      return () => {
        active = false;
        animationContext.revert();
        split?.revert();
        heading.innerHTML = original;
        stats.forEach((stat) => {
          const target = root.querySelector(`[data-stat="${stat.id}"]`);
          if (target) target.textContent = stat.display;
        });
      };
    });
    // Saída do hero amarrada ao scroll: título sobe e desfoca, vídeo aproxima e escurece,
    // números sobem em cascata. Volta tudo ao lugar quando a página sobe de novo.
    queries.add({
      motion: "(prefers-reduced-motion: no-preference)",
      desktop: "(min-width: 1024px)",
    }, (context) => {
      const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
      if (!motion) return;
      const statItems = gsap.utils.toArray<HTMLElement>(".hero-stat", root);
      gsap.from(".hero-stat > *", { y: 28, opacity: 0, duration: 0.8, stagger: 0.09, delay: 0.5, ease: "power3.out" });
      const exit = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.5 },
      });
      // Desfoque só no desktop: no celular o filtro em texto grande custa caro.
      exit.to(".hero-title", desktop
        ? { yPercent: -38, opacity: 0.15, filter: "blur(8px)", duration: 1 }
        : { yPercent: -22, opacity: 0.15, duration: 1 }, 0)
        .to(".hero-badge", { y: -60, opacity: 0, duration: 0.6 }, 0)
        .to([".hero-description", ".hero-cta-area"], { y: desktop ? -90 : -50, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.05)
        .to(".hero-media", { scale: 1.15, duration: 1 }, 0)
        .to(".hero-darken", { opacity: 0.75, duration: 1 }, 0);
      statItems.forEach((stat, index) => {
        exit.to(stat, { y: -(desktop ? 70 : 40) - index * (desktop ? 45 : 25), duration: 1 }, 0);
      });
    });
    queries.add("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const cta = button.current;
      const hitArea = cta?.parentElement;
      if (!cta || !hitArea) return;
      const x = gsap.quickTo(cta, "x", { duration: 0.3, ease: "power3.out" });
      const y = gsap.quickTo(cta, "y", { duration: 0.3, ease: "power3.out" });
      const reset = () => { x(0); y(0); };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        const rect = hitArea.getBoundingClientRect();
        x((event.clientX - rect.left - rect.width / 2) * 0.045);
        y((event.clientY - rect.top - rect.height / 2) * 0.12);
      };
      hitArea.addEventListener("pointermove", move);
      hitArea.addEventListener("pointerleave", reset);
      cta.addEventListener("focus", reset);
      return () => {
        hitArea.removeEventListener("pointermove", move);
        hitArea.removeEventListener("pointerleave", reset);
        cta.removeEventListener("focus", reset);
      };
    });
    return () => queries.revert();
  }, { scope: section });

  const sourceFailed = (format: "webm" | "mp4") => {
    failedSources.current.add(format);
    if ((!media.webm || failedSources.current.has("webm")) && (!media.mp4 || failedSources.current.has("mp4"))) {
      setMediaFailed(true);
    }
  };

  return (
    <section ref={section} id="hero" className="hero-section" aria-labelledby="hero-title" data-motion-paused={paused}>
      <div id="hero-motion" className="hero-backdrop" aria-hidden="true">
        <div className="hero-light hero-light-primary" />
        <div className="hero-light hero-light-secondary" />
        <div className="hero-media">
        {media.poster && <div className="hero-poster" />}
        {hasVideo && <video ref={video} className="hero-video" data-ready={videoReady} muted loop playsInline preload="none" poster={media.poster ? "/media/hero-poster.jpg" : undefined} onPlaying={() => setVideoReady(true)} onError={() => setMediaFailed(true)} tabIndex={-1} disablePictureInPicture>
          {media.webm && <source src="/media/hero-loop.webm" type="video/webm" onError={() => sourceFailed("webm")} />}
          {media.mp4 && <source src="/media/hero-loop.mp4" type="video/mp4" onError={() => sourceFailed("mp4")} />}
        </video>}
        </div>
        <div className="hero-backdrop-shade" />
        <div className="hero-darken" />
      </div>
      <div className="container hero-content">
        <p id="hero-badge" className="hero-badge"><span aria-hidden="true" className="hero-badge-dot" />{hero.badge}</p>
        <h1 id="hero-title" className="hero-title">
          <span className="sr-only">{hero.title}</span>
          <span ref={title} className="hero-title-visual" aria-hidden="true">{before}<span className="hero-title-accent">Plano Estratégico</span>{after}</span>
        </h1>
        <p className="lead hero-description">{hero.description}</p>
        <div className="hero-cta-area">
          <a ref={button} className="button button-primary hero-cta" href={site.ctaHref}>
            <span>{site.cta}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
          </a>
        </div>
        <dl className="hero-stats">
          {stats.map((stat) => <div key={stat.id} className="hero-stat">
            <dt>{stat.label}</dt>
            <dd><span className="sr-only">{stat.display}</span><span className="hero-stat-reserve" aria-hidden="true">{stat.display}</span><span className="hero-stat-counter" aria-hidden="true" data-stat={stat.id}>{stat.display}</span></dd>
          </div>)}
        </dl>
      </div>
      <button className="motion-toggle motion-toggle-icon hero-motion-toggle" type="button" aria-label={paused ? "Retomar animação de fundo" : "Pausar animação de fundo"} aria-controls="hero-motion hero-badge" aria-pressed={paused} onClick={() => setPaused((value) => !value)}><MotionIcon paused={paused} /></button>
    </section>
  );
}

function MotionIcon({ paused }: { paused: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{paused ? <path d="m8 5 11 7-11 7Z" /> : <path d="M8 5v14M16 5v14" />}</svg>;
}
