"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { avisoEtico, site } from "@/data/content";
import { Seta, WaIcon } from "@/components/Icones";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Contato() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    const q = gsap.utils.selector(root);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      // A faixa escura sobe como cortina com os cantos se abrindo, e o monograma gira de leve até assentar.
      gsap.fromTo(q(".cta"), { clipPath: "inset(6% 3% 0% 3% round 40px 40px 0px 0px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 25%", scrub: true } });
      gsap.fromTo(q(".cta__mono"), { rotation: -25, opacity: 0, scale: 0.8 }, { rotation: 0, opacity: 1, scale: 1, ease: "power2.out", scrollTrigger: { trigger: root.current, start: "top 70%", end: "top 30%", scrub: 0.8 } });
      gsap.fromTo(q(".cta__acoes > *"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.12, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: q(".cta__acoes")[0], start: "top 92%" } });
    });
    return () => media.revert();
  }, { scope: root });

  return (
    <section ref={root} id="contato" className="contato">
      <div className="cta">
        <div className="wrap cta__corpo">
          <img className="cta__mono" src="/img/logo-champanhe.webp" width={88} height={88} alt="" />
          <h2 data-split>Comece<br /> pela <em>avaliação.</em></h2>
          <p className="cta__lead">Toda indicação começa em uma avaliação individual. Conte o que você deseja e a equipe responde com calma.</p>
          <div className="cta__acoes">
            <a className="btn btn--claro" href={site.ctaHref}>{site.cta}<Seta /></a>
            <a className="btn btn--fantasma" href={site.ctaHref}><WaIcon />Conversar no WhatsApp</a>
          </div>
          <p className="cta__pend"><span className="pend pend--escuro">[número do WhatsApp e link de agendamento a confirmar com a clínica]</span></p>
        </div>
        <footer className="rodape">
          <div className="wrap rodape__grade">
            <div>
              <a className="marca marca--clara" href="#hero"><img src="/img/logo-marfim.webp" width={34} height={34} alt="" /><span><b>Complexo SC</b><small>Medicina · Estética · Educação</small></span></a>
              <p className="rodape__texto">Há 17 anos cuidando das pessoas em Fortaleza.</p>
            </div>
            <div>
              <h3>Endereço</h3>
              <p>{site.endereco}</p>
            </div>
            <div>
              <h3>Contato</h3>
              <p><a href={site.instagram} rel="noopener" target="_blank">Instagram @complexosc_</a></p>
              <p><span className="pend pend--escuro">[telefone e e-mail a confirmar]</span></p>
            </div>
            <div>
              <h3>Responsável técnico</h3>
              <p><span className="pend pend--escuro">[nome, CRM e RQE do diretor técnico a confirmar]</span></p>
            </div>
          </div>
          <div className="wrap rodape__base">
            <p>{avisoEtico}</p>
            <p>© 2026 Complexo SC · Protótipo de proposta, não publicado</p>
          </div>
        </footer>
      </div>
    </section>
  );
}
