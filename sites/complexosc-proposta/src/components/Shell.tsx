"use client";

import { useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { site } from "@/data/content";
import { scrollMotion } from "@/lib/scroll-motion";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/** Lenis dirige o scroll e o ticker do GSAP dirige o Lenis: um relógio só para tudo. */
function ScrollSetup() {
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ autoRaf: false, smoothWheel: true, anchors: true, lerp: 0.085 });
      const tick = (time: number) => { lenis.raf(time * 1000); scrollMotion.velocity *= 0.9; };
      const onScroll = () => { scrollMotion.velocity = lenis.velocity; ScrollTrigger.update(); };
      lenis.on("scroll", onScroll);
      gsap.ticker.lagSmoothing(0);
      gsap.ticker.add(tick);
      const refresh = () => lenis.resize();
      ScrollTrigger.addEventListener("refresh", refresh);
      return () => {
        gsap.ticker.remove(tick);
        ScrollTrigger.removeEventListener("refresh", refresh);
        lenis.off("scroll", onScroll);
        lenis.destroy();
        gsap.ticker.lagSmoothing(500, 33);
      };
    });

    // Sem motion: vídeos ficam parados no primeiro quadro (poster).
    media.add("(prefers-reduced-motion: reduce)", () => {
      document.querySelectorAll("video").forEach((v) => { v.autoplay = false; v.pause(); });
    });

    // Títulos de seção: palavra por palavra saindo de uma máscara, amarrado ao scroll.
    let active = true;
    const splits: SplitText[] = [];
    media.add("(prefers-reduced-motion: no-preference)", () => {
      void document.fonts.ready.then(() => {
        if (!active) return;
        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((heading) => {
          splits.push(SplitText.create(heading, {
            type: "words", mask: "words", autoSplit: true,
            onSplit: (self) => gsap.fromTo(self.words,
              { yPercent: 110, opacity: 0 },
              { yPercent: 0, opacity: 1, ease: "power3.out", stagger: 0.06, duration: 1.1,
                scrollTrigger: { trigger: heading, start: "top 88%", toggleActions: "play none none reverse" } }),
          }));
        });
        ScrollTrigger.refresh();
      });
      return () => { splits.forEach((s) => s.revert()); splits.length = 0; };
    });

    // Imagens lazy mudam alturas: recalcula os gatilhos quando carregam.
    let timer = 0;
    const queue = () => { window.clearTimeout(timer); timer = window.setTimeout(() => ScrollTrigger.refresh(), 200); };
    window.addEventListener("load", queue, { once: true });
    void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh(); });
    return () => { active = false; window.clearTimeout(timer); window.removeEventListener("load", queue); media.revert(); };
  }, []);
  return null;
}

function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const set = gsap.quickSetter(bar.current, "scaleX");
      ScrollTrigger.create({ start: 0, end: () => Math.max(1, ScrollTrigger.maxScroll(window)), onUpdate: (s) => set(s.progress), onRefresh: (s) => set(s.progress) });
    });
    return () => media.revert();
  }, { scope: bar });
  return <div ref={bar} className="progresso" aria-hidden="true" />;
}

const nav = [
  { href: "#mama", label: "Cirurgia de mama" },
  { href: "#cuidado", label: "Cuidado" },
  { href: "#rpp", label: "Método RPP" },
  { href: "#estrutura", label: "Estrutura" },
  { href: "#equipe", label: "Equipe" },
];

function Header() {
  const header = useRef<HTMLElement>(null);
  const [aberto, setAberto] = useState(false);
  useGSAP(() => {
    const el = header.current;
    if (!el) return;
    let lastY = window.scrollY, frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      el.dataset.rolado = String(y > 24);
      if (Math.abs(y - lastY) < 8) return;
      el.dataset.oculto = String(y > 400 && y > lastY && !el.contains(document.activeElement));
      lastY = y;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); };
  }, { scope: header });

  return (
    <header ref={header} className="topo" data-aberto={aberto}>
      <div className="wrap topo__linha">
        <a className="marca" href="#hero" onClick={() => setAberto(false)} aria-label="Complexo SC, início">
          <img src="/img/logo-vinho.webp" width={34} height={34} alt="" />
          <span><b>Complexo SC</b><small>Medicina · Estética · Educação</small></span>
        </a>
        <nav className="topo__nav" aria-label="Seções">
          {nav.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        </nav>
        <a className="btn btn--sm topo__cta" href={site.ctaHref}>{site.cta}</a>
        <button type="button" className="topo__menu" aria-expanded={aberto} aria-controls="menu-celular" onClick={() => setAberto((v) => !v)}>
          <span className="sr">{aberto ? "Fechar menu" : "Abrir menu"}</span><i aria-hidden="true" />
        </button>
      </div>
      <nav id="menu-celular" className="topo__gaveta" hidden={!aberto} aria-label="Seções" data-lenis-prevent>
        {nav.map((l) => <a key={l.href} href={l.href} onClick={() => setAberto(false)}>{l.label}</a>)}
        <a className="btn" href={site.ctaHref} onClick={() => setAberto(false)}>{site.cta}</a>
      </nav>
    </header>
  );
}

export function SiteShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <a className="pular" href="#conteudo">Pular para o conteúdo</a>
      <ScrollSetup />
      <ReadingProgress />
      <Header />
      <main id="conteudo" tabIndex={-1}>{children}</main>
    </>
  );
}
