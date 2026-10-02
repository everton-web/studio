"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { site } from "@/data/content";
import { Seta } from "@/components/Icones";
import { publicPath } from "@/lib/public-path";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// Top 3 de tratamentos pós-parto citados pela criadora do método (Instagram, out/2026).
const focos = ["Gordura localizada", "Flacidez da pele", "Fortalecimento da musculatura"];

export function Rpp() {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    const q = gsap.utils.selector(root);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      let vivo = true;
      const splits: SplitText[] = [];
      void document.fonts.ready.then(() => {
        if (!vivo) return;
        // Letreiro: as letras acendem uma a uma, de champanhe apagado a marfim, conforme o scroll.
        const grande = SplitText.create(q(".rpp__grande")[0], { type: "chars,words" });
        splits.push(grande);
        gsap.fromTo(grande.chars, { opacity: 0.12, yPercent: 30 }, { opacity: 1, yPercent: 0, stagger: 0.04, ease: "power2.out", scrollTrigger: { trigger: q(".rpp__grande")[0], start: "top 85%", end: "bottom 45%", scrub: 0.8 } });
        // Frase: o texto se preenche palavra por palavra, como leitura guiada.
        const frase = SplitText.create(q(".rpp__frase")[0], { type: "words" });
        splits.push(frase);
        gsap.fromTo(frase.words, { opacity: 0.22 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: q(".rpp__frase")[0], start: "top 80%", end: "bottom 50%", scrub: true } });
        ScrollTrigger.refresh();
      });
      gsap.fromTo(q(".rpp__sigla"), { xPercent: 8 }, { xPercent: -18, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.fromTo(q(".rpp__retrato"), { clipPath: "inset(100% 0% 0% 0% round 999px 999px 18px 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 18px 18px)", ease: "power2.out", scrollTrigger: { trigger: q(".rpp__retrato")[0], start: "top 85%", end: "top 40%", scrub: 0.8 } });
      gsap.fromTo(q(".rpp__foco"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.12, duration: 1, ease: "expo.out", scrollTrigger: { trigger: q(".rpp__focos")[0], start: "top 85%" } });
      return () => { vivo = false; splits.forEach((s) => s.revert()); };
    });
    return () => media.revert();
  }, { scope: root });

  return (
    <section ref={root} id="rpp" className="rpp">
      <span className="rpp__sigla" aria-hidden="true">RPP</span>
      <div className="wrap">
        <p className="eyebrow eyebrow--escuro">Método RPP</p>
        <h2 className="rpp__grande">Reestruturação <em>Pós-Parto</em></h2>
        <div className="rpp__grade">
          <figure className="rpp__retrato">
            <img src={publicPath("/img/retrato-olga.webp")} width={518} height={648} alt="Olga Vieira, fisioterapeuta e criadora do Método RPP" loading="lazy" />
          </figure>
          <div>
            <p className="rpp__frase">Recuperar a funcionalidade e a estética do corpo depois da maternidade, com um cuidado pensado para cada mulher. Cada corpo é único.</p>
            <p className="rpp__autora">Criado por Olga Vieira <span className="pend pend--escuro">[confirmar nome]</span>, fisioterapeuta · CREFITO 123.553</p>
            <p className="rpp__focos-tit">Top 3 de tratamentos pós-parto, segundo a criadora</p>
            <ul className="rpp__focos">
              {focos.map((f, i) => (
                <li key={f} className="rpp__foco"><span>0{i + 1}</span><b>{f}</b></li>
              ))}
            </ul>
            <a className="btn btn--claro" href={site.ctaHref}>Conhecer o Método RPP<Seta /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
