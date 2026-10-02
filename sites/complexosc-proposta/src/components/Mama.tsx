"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { avisoEtico, passosMama, site } from "@/data/content";
import { Seta } from "@/components/Icones";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Mama() {
  const root = useRef<HTMLElement>(null);
  const [veuAberto, setVeuAberto] = useState(false);

  useGSAP(() => {
    const media = gsap.matchMedia();
    const q = gsap.utils.selector(root);

    // Desktop: a seção fixa e o scroll conta a história em 4 passos, trocando as imagens por cortina.
    media.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const quadros = q<HTMLElement>(".mama__quadro");
      const passos = q<HTMLElement>(".mama__passo");
      const n = quadros.length;
      gsap.set(quadros.slice(1), { clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(passos.slice(1), { opacity: 0.28 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: q(".mama__palco")[0], start: "top top", end: () => `+=${window.innerHeight * (n - 0.4)}`,
          pin: true, scrub: 0.8, anticipatePin: 1,
          snap: { snapTo: "labelsDirectional", duration: { min: 0.3, max: 0.9 }, delay: 0.15, ease: "power2.inOut" },
          onUpdate: () => {
            const i = gsap.utils.clamp(0, n - 1, Math.floor(tl.time() + 0.5));
            root.current?.style.setProperty("--passo", String(i));
            root.current?.setAttribute("data-passo", String(i + 1));
            const atual = q(".mama__atual")[0];
            if (atual) atual.textContent = String(i + 1);
          },
        },
      });
      tl.addLabel("p0");
      for (let i = 1; i < n; i++) {
        const at = i - 1;
        tl.to(quadros[i], { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power2.inOut" }, at + 0.1)
          .fromTo(quadros[i].querySelector(".mama__img"), { scale: 1.18, yPercent: 6 }, { scale: 1, yPercent: 0, duration: 0.9, ease: "power2.out" }, at + 0.1)
          .to(quadros[i - 1].querySelector(".mama__img"), { scale: 0.94, yPercent: -4, duration: 0.8, ease: "power2.inOut" }, at + 0.1)
          .to(passos[i - 1], { opacity: 0.28, duration: 0.4 }, at + 0.2)
          .to(passos[i], { opacity: 1, duration: 0.4 }, at + 0.35)
          .addLabel(`p${i}`, at + 0.9);
      }
      tl.fromTo(q(".mama__trilho i")[0], { scaleY: 1 / n }, { scaleY: 1, duration: n - 1, ease: "none" }, 0);
      tl.to({}, { duration: 0.3 });
      return () => { gsap.set([...quadros, ...passos], { clearProps: "all" }); };
    });

    // Celular: sem pin. Cada passo traz sua imagem abrindo por cortina quando entra na tela.
    media.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
      q<HTMLElement>(".mama__passo").forEach((passo) => {
        const fig = passo.querySelector(".mama__mini");
        if (!fig) return;
        gsap.fromTo(fig, { clipPath: "inset(12% 8% 12% 8% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 18px)", ease: "power2.out", scrollTrigger: { trigger: fig, start: "top 92%", end: "top 45%", scrub: 0.6 } });
        gsap.fromTo(fig.querySelector("img, video"), { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true } });
      });
    });

    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(q(".resultado"), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: q(".resultado")[0], start: "top 85%" } });
    });
    return () => media.revert();
  }, { scope: root });

  return (
    <section ref={root} id="mama" className="mama" data-passo="1">
      <div className="mama__palco">
        <div className="wrap mama__grade">
          <div className="mama__texto">
            <p className="eyebrow">Cirurgia de mama</p>
            <h2 data-split>Proporção que conversa <em>com o seu corpo.</em></h2>
            <div className="mama__lista">
              <div className="mama__trilho" aria-hidden="true"><i /></div>
              <ol>
                {passosMama.map((p) => (
                  <li key={p.n} className="mama__passo">
                    <span className="mama__n">{p.n}</span>
                    <div>
                      <h3>{p.titulo}</h3>
                      <p>{p.texto}</p>
                      <figure className="mama__mini">
                        <img src={p.midia.img} alt={p.midia.alt} loading="lazy" />
                        {p.midia.pendente && <span className="chip-pend">{p.midia.pendente}</span>}
                      </figure>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="mama__quadros" aria-hidden="true">
            {passosMama.map((p, i) => (
              <figure key={p.n} className="mama__quadro" style={{ zIndex: i + 1 }}>
                {p.midia.video ? (
                  <video className="mama__img" src={p.midia.video} poster={p.midia.img} muted loop playsInline autoPlay preload="metadata" />
                ) : (
                  <img className="mama__img" src={p.midia.img} alt="" loading="lazy" />
                )}
              </figure>
            ))}
            {passosMama.map((p, i) => (
              <div key={p.n} className="mama__leg" data-i={i + 1}>
                <p className="mama__legenda"><span>{p.n}</span>{p.midia.legenda}</p>
                {p.midia.pendente && <span className="chip-pend chip-pend--quadro">{p.midia.pendente}</span>}
              </div>
            ))}
            <p className="mama__contador"><b>0<span className="mama__atual">1</span></b> / 04</p>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="resultado">
          <div className="resultado__veu" data-aberto={veuAberto}>
            <div className="resultado__casos" aria-hidden={!veuAberto}>
              {["Mastopexia com prótese", "Prótese de mama", "Mastopexia"].map((c) => (
                <div key={c} className="resultado__caso">
                  <span className="resultado__ph">Caso autorizado a receber da clínica</span>
                  <b>{c}</b>
                </div>
              ))}
            </div>
            {!veuAberto && (
              <div className="resultado__cortina">
                <p className="eyebrow">Resultados reais</p>
                <p className="resultado__titulo">Imagens de cirurgia ficam atrás deste véu.</p>
                <p className="resultado__sub">Você escolhe se quer ver. Antes, leia o aviso abaixo.</p>
                <button type="button" className="btn btn--sec" onClick={() => setVeuAberto(true)}>Li o aviso e quero ver</button>
              </div>
            )}
          </div>
          <div className="resultado__lado">
            <p className="aviso"><b>Aviso ético.</b> {avisoEtico}</p>
            <p className="resultado__fala">Toda indicação começa em uma avaliação individual.</p>
            <a className="btn" href={site.ctaHref}>{site.cta}<Seta /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
