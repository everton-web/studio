"use client";

import { useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { brand, navigation, site } from "@/data/content";
import { SiteFooter } from "@/components/SiteFooter";
import { MotionDirector } from "@/components/MotionDirector";
import { scrollMotion } from "@/lib/scroll-motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function ScrollSetup() {
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      // Lenis reads scroll-padding and scroll-margin from CSS, including breakpoints.
      const lenis = new Lenis({ autoRaf: false, smoothWheel: true, anchors: true });
      const tick = (time: number) => {
        lenis.raf(time * 1000);
        // Decai para zero quando o scroll para; o evento de scroll repõe o valor real.
        scrollMotion.velocity *= 0.9;
      };
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
        scrollMotion.velocity = 0;
        lenis.destroy();
        // Restore GSAP defaults when this page-level scroll owner is removed.
        gsap.ticker.lagSmoothing(500, 33);
      };
    });
    // Refresh after fonts settle, without retaining callbacks after unmount.
    let active = true;
    void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh(); });
    return () => { active = false; media.revert(); };
  }, []);
  return null;
}

export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const setProgress = gsap.quickSetter(bar.current, "scaleX");
      ScrollTrigger.create({
        start: 0,
        end: () => Math.max(1, ScrollTrigger.maxScroll(window)),
        onUpdate: (self) => setProgress(self.progress),
        onRefresh: (self) => setProgress(self.progress),
      });
    });
    return () => media.revert();
  }, { scope: bar });
  return <div ref={bar} className="reading-progress" aria-hidden="true" />;
}

export function CustomCursor() {
  const cursor = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const element = cursor.current;
      if (!element) return;
      const setX = gsap.quickSetter(element, "x", "px");
      const setY = gsap.quickSetter(element, "y", "px");
      const interactive = "a, button, input, select, textarea, summary, [role='button'], [data-cursor='interactive']";
      const updateTarget = (target: EventTarget | null) => {
        element.dataset.interactive = String(target instanceof Element && Boolean(target.closest(interactive)));
      };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") { element.dataset.visible = "false"; return; }
        setX(event.clientX);
        setY(event.clientY);
        element.dataset.visible = "true";
        updateTarget(event.target);
      };
      const over = (event: PointerEvent) => updateTarget(event.target);
      const out = (event: PointerEvent) => {
        updateTarget(event.relatedTarget);
        if (!event.relatedTarget) hide();
      };
      const hide = () => { element.dataset.visible = "false"; };
      document.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerover", over, { passive: true });
      document.addEventListener("pointerout", out, { passive: true });
      document.addEventListener("pointercancel", hide);
      document.addEventListener("visibilitychange", hide);
      document.addEventListener("keydown", hide);
      window.addEventListener("blur", hide);
      window.addEventListener("scroll", hide, { passive: true });
      return () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerover", over);
        document.removeEventListener("pointerout", out);
        document.removeEventListener("pointercancel", hide);
        document.removeEventListener("visibilitychange", hide);
        document.removeEventListener("keydown", hide);
        window.removeEventListener("blur", hide);
        window.removeEventListener("scroll", hide);
        hide();
      };
    });
    return () => media.revert();
  }, { scope: cursor });
  return <div ref={cursor} className="custom-cursor" aria-hidden="true"><span /></div>;
}

export function Header() {
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useGSAP(() => {
    const element = header.current;
    if (!element) return;
    let lastY = Math.max(0, window.scrollY);
    let frame = 0;
    const update = () => {
      frame = 0;
      // Clamp elastic overscroll so reaching the bottom does not fake an upward scroll.
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.min(maxY, Math.max(0, window.scrollY));
      const threshold = parseFloat(getComputedStyle(element).getPropertyValue("--header-height"));
      if (Math.abs(y - lastY) < 8 && y > threshold) return;
      element.dataset.hidden = String(y > threshold && y > lastY && !element.contains(document.activeElement));
      lastY = y;
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const show = () => { element.dataset.hidden = "false"; };
    window.addEventListener("scroll", scroll, { passive: true });
    element.addEventListener("focusin", show);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      element.removeEventListener("focusin", show);
    };
  }, { scope: header });

  useGSAP(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { close(); toggle.current?.focus(); }
    };
    const outside = (event: Event) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) close();
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const resize = () => { if (desktop.matches) close(); };
    document.addEventListener("keydown", keydown);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    window.addEventListener("hashchange", close);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      window.removeEventListener("hashchange", close);
      desktop.removeEventListener("change", resize);
    };
  }, { scope: header, dependencies: [menuOpen], revertOnUpdate: true });

  return (
    <>
      {menuOpen && <div className="menu-backdrop" aria-hidden="true" data-lenis-prevent onClick={() => setMenuOpen(false)} />}
      <header ref={header} className="site-header" data-menu-open={menuOpen}>
        <div className="container header-row">
          <a className="brand-logo" href="#hero" onClick={() => setMenuOpen(false)}><img src={brand.logo.src} width={brand.logo.width} height={brand.logo.height} alt={brand.logo.alt} fetchPriority="high" /></a>
          <nav className="desktop-nav" aria-label="Navegação principal">
            {navigation.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </nav>
          <a className="button button-primary header-cta" href={site.ctaHref}>Quero meu plano</a>
          <button ref={toggle} type="button" className="menu-toggle" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? "Fechar" : "Menu"}
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              {menuOpen ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
        <nav id="mobile-navigation" className="mobile-nav container" aria-label="Navegação mobile" hidden={!menuOpen} data-lenis-prevent>
          {navigation.map((link) => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>)}
          <a className="button button-primary" href={site.ctaHref} onClick={() => setMenuOpen(false)}>{site.cta}</a>
        </nav>
      </header>
    </>
  );
}

export function SiteShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <ScrollSetup />
      <ReadingProgress />
      <CustomCursor />
      <Header />
      <main id="conteudo" tabIndex={-1}>{children}</main>
      <SiteFooter />
      <MotionDirector />
    </>
  );
}
