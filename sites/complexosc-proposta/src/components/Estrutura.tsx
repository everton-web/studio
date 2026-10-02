"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { publicPath } from "@/lib/public-path";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Peca = { img?: string; alt: string; titulo: string; texto: string; classe: string; vel: number; pendente?: string };

// vel = deslocamento em % da própria altura ao atravessar a tela: camadas com velocidades diferentes dão profundidade.
const pecas: Peca[] = [
  { img: publicPath("/img/recepcao.webp"), alt: "Recepção do Complexo SC", titulo: "Recepção", texto: "Acolhimento desde o primeiro instante.", classe: "e1", vel: -6 },
  { img: publicPath("/img/beike.webp"), alt: "Fachada da Beike, cafeteria e doceria anexa ao Complexo SC", titulo: "Beike", texto: "Cafeteria e doceria anexa, para a espera e a recuperação.", classe: "e2", vel: -22 },
  { img: publicPath("/img/fachada.webp"), alt: "Fachada do Complexo SC na Rua Barão de Aracati", titulo: "Espaço SC", texto: "Rua Barão de Aracati, 1304, Aldeota.", classe: "e3", vel: -14 },
  { img: publicPath("/img/apartamento.webp"), alt: "Apartamento de recuperação", titulo: "Apartamento", texto: "Recuperação reservada depois da cirurgia.", classe: "e4", vel: -28 },
  { alt: "", titulo: "Centro cirúrgico", texto: "Estrutura própria dentro do Complexo.", classe: "e5", vel: -10, pendente: "Foto a produzir na sessão" },
];

export function Estrutura() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    const q = gsap.utils.selector(root);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const celular = window.innerWidth < 768;
      q<HTMLElement>(".estr__peca").forEach((el) => {
        const vel = Number(el.dataset.vel);
        if (!celular) gsap.fromTo(el, { yPercent: -vel / 2 }, { yPercent: vel / 2, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        const img = el.querySelector(".estr__moldura > img");
        if (img) gsap.fromTo(img, { scale: 1.22, yPercent: -6 }, { scale: 1.06, yPercent: 6, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.fromTo(el.querySelector(".estr__moldura"), { clipPath: "inset(14% 10% 14% 10% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 18px)", ease: "power2.out", scrollTrigger: { trigger: el, start: "top 95%", end: "top 55%", scrub: 0.6 } });
      });
    });
    return () => media.revert();
  }, { scope: root });

  return (
    <section ref={root} id="estrutura" className="estrutura">
      <div className="wrap estr__cab">
        <div>
          <p className="eyebrow">Estrutura</p>
          <h2 data-split>Um complexo inteiro, <em>pensado para você.</em></h2>
        </div>
        <p className="lead">Da recepção ao centro cirúrgico, tudo acontece no mesmo endereço. Você não precisa trocar de lugar para se cuidar.</p>
      </div>
      <div className="wrap estr__palco">
        {pecas.map((p) => (
          <figure key={p.titulo} className={`estr__peca ${p.classe}`} data-vel={p.vel}>
            <div className={`estr__moldura${p.img ? "" : " estr__moldura--vazia"}`}>
              {p.img ? <img src={p.img} alt={p.alt} loading="lazy" /> : (
                <div className="estr__vazio"><img src={publicPath("/img/logo-vinho.webp")} alt="" width={48} height={48} /><span className="pend">{p.pendente}</span></div>
              )}
            </div>
            <figcaption><b>{p.titulo}</b><span>{p.texto}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
