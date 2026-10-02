"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { selos, site } from "@/data/content";
import { WaIcon, Seta } from "@/components/Icones";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(root);
      let split: SplitText | null = null;
      const intro = gsap.timeline({ defaults: { ease: "expo.out" }, paused: true });

      // 1. Revelação por máscara: a foto da equipe abre do centro, com zoom lento assentando.
      intro.fromTo(q(".hero__midia"), { clipPath: "inset(18% 22% 18% 22% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 28px)", duration: 2.2 }, 0.1)
        .fromTo(q(".hero__midia img"), { scale: 1.28 }, { scale: 1.08, duration: 2.6 }, 0.1)
        .fromTo(q(".hero .eyebrow"), { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 1.2 }, 0.2)
        .fromTo(q(".hero__lead, .hero__acoes"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.4, stagger: 0.12 }, 0.9)
;

      // 2. Selos de confiança entram em sequência quando chegam à tela, cada um com o fio champanhe desenhando.
      const selos = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
        .fromTo(q(".selo"), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.14 }, 0)
        .fromTo(q(".selo__fio"), { scaleX: 0 }, { scaleX: 1, duration: 1.2, stagger: 0.14, ease: "power2.inOut" }, 0);
      ScrollTrigger.create({ trigger: q(".selos")[0], start: "top 92%", once: true, onEnter: () => { selos.delay(intro.progress() < 0.5 ? 1.2 : 0).play(); } });

      gsap.set(q("[data-hero-hide]:not(h1)"), { visibility: "visible" });
      const titulo = q("h1")[0] as HTMLElement;
      let vivo = true;
      void document.fonts.ready.then(() => {
        if (!vivo) return;
        split = SplitText.create(titulo, { type: "lines,words", mask: "lines" });
        gsap.set(titulo, { visibility: "visible" });
        intro.fromTo(split.lines, { yPercent: 105 }, { yPercent: 0, duration: 1.6, stagger: 0.12, ease: "expo.out" }, 0.35);
        intro.play();
      });

      // 3. Scroll: a foto desce mais devagar que a página (parallax) e o texto sobe e esmaece.
      gsap.to(q(".hero__midia img"), { yPercent: 12, ease: "none", scrollTrigger: { trigger: q(".hero__midia")[0], start: "top 70%", end: "bottom top", scrub: true } });
      gsap.to(q(".hero__midia"), { scale: 0.94, ease: "none", scrollTrigger: { trigger: q(".hero__midia")[0], start: "center center", end: "bottom top", scrub: true } });
      gsap.to(q(".hero__top"), { yPercent: -18, opacity: 0.25, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "45% top", scrub: true } });

      return () => { vivo = false; split?.revert(); intro.kill(); selos.kill(); gsap.set(q("[data-hero-hide]"), { clearProps: "visibility" }); };
    });
    return () => media.revert();
  }, { scope: root });

  return (
    <section ref={root} id="hero" className="hero">
      <div className="wrap">
        <div className="hero__top">
          <div>
            <p className="eyebrow" data-hero-hide>Cirurgia plástica e estética em Fortaleza</p>
            <h1 data-hero-hide>Alcance o extraordinário <em>em si.</em></h1>
          </div>
          <div>
            <p className="hero__lead" data-hero-hide>
              Há 17 anos cuidando das pessoas. Cirurgia plástica, estética e recuperação no mesmo complexo, da primeira consulta ao último retorno.
            </p>
            <div className="hero__acoes" data-hero-hide>
              <a className="btn" href={site.ctaHref}>{site.cta}<Seta /></a>
              <a className="btn btn--wa" href="#contato"><WaIcon />Conversar no WhatsApp</a>
            </div>
          </div>
        </div>
        <figure className="hero__midia" data-hero-hide>
          <img src="/img/hero-equipe.webp" width={1672} height={941} alt="Equipe do Complexo SC reunida no lounge da clínica" fetchPriority="high" />
          <figcaption>A equipe do Complexo SC</figcaption>
        </figure>
        <ul className="selos" aria-label="Por que confiar">
          {selos.map((s) => (
            <li key={s.forte} className="selo" data-hero-hide>
              <span className="selo__fio" aria-hidden="true" />
              <b>{s.forte}</b>
              <span>{s.leve}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
