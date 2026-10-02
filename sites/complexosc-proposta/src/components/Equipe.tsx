"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { equipe } from "@/data/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Equipe() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    const q = gsap.utils.selector(root);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: q(".equipe__grade")[0], start: "top 80%" } });
      tl.fromTo(q(".pro"), { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.3, stagger: 0.14, ease: "expo.out" })
        .fromTo(q(".pro__foto"), { clipPath: "inset(100% 0% 0% 0% round 999px 999px 18px 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 18px 18px)", duration: 1.4, stagger: 0.14, ease: "expo.inOut" }, 0)
        .fromTo(q(".pro__foto > img"), { scale: 1.25 }, { scale: 1, duration: 1.8, stagger: 0.14, ease: "expo.out" }, 0.2)
        .fromTo(q(".pro__reg"), { "--fio": 0 }, { "--fio": 1, duration: 1, stagger: 0.14, ease: "power2.out" }, 0.6);
    });
    return () => media.revert();
  }, { scope: root });

  return (
    <section ref={root} id="equipe" className="equipe">
      <div className="wrap">
        <div className="equipe__cab">
          <p className="eyebrow">Equipe</p>
          <h2 data-split>Quem cuida <em>de você.</em></h2>
        </div>
        <div className="equipe__grade">
          {equipe.map((p) => (
            <article key={p.nome} className="pro">
              <div className={`pro__foto${p.foto ? "" : " pro__foto--vazio"}`}>
                {p.foto ? <img src={p.foto} alt={`Retrato de ${p.nome}`} loading="lazy" /> : (<><img src="/img/logo-vinho.webp" alt="" width={56} height={56} /><span>Retrato individual a produzir</span></>)}
              </div>
              <h3 className="pro__nome">{p.nome}{p.pendNome && <span className="pend pend--mini"> [{p.pendNome}]</span>}</h3>
              <p className="pro__cargo">{p.cargo}{p.pendCargo && <span className="pend"> [{p.pendCargo}]</span>}</p>
              <p className="pro__reg">{p.registro}{p.pendRegistro && <span className="pend"> [{p.pendRegistro}]</span>}</p>
              <p className="pro__bio">{p.bio}</p>
            </article>
          ))}
        </div>
        <p className="nota">Registros conferidos nas artes e legendas públicas da clínica. Os itens marcados e o tratamento Dr./Dra. por conselho ficam para confirmação.</p>
      </div>
    </section>
  );
}
