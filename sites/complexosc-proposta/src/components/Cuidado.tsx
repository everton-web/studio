"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { bastidores } from "@/data/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Padrão de cuidado: a seção fica fixa e as fotos passam para o lado conforme a rolagem
// (pedido do Everton: sem setas nem arrasto). Com movimento reduzido, vira faixa com rolagem nativa.
export function Cuidado() {
  const root = useRef<HTMLElement>(null);
  const trilho = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const t = trilho.current;
    if (!t) return;
    const q = gsap.utils.selector(root);
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const janela = t.parentElement as HTMLElement;
      const distancia = () => Math.max(0, t.scrollWidth - janela.clientWidth);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${distancia() + window.innerHeight * 0.4}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      tl.to(t, { x: () => -distancia() })
        .to(q(".cuidado__progresso span"), { scaleX: 1 }, 0);

      // Cada foto ganha vida ao cruzar o centro da tela: leve escala e o véu some.
      q<HTMLElement>(".bastidor").forEach((card) => {
        gsap.fromTo(card.querySelector(".bastidor__img"), { scale: 0.92, filter: "saturate(.7)" }, {
          scale: 1, filter: "saturate(1)", ease: "power2.out",
          scrollTrigger: { trigger: card, containerAnimation: tl, start: "left 85%", end: "left 45%", scrub: true },
        });
      });

      gsap.from(q(".bastidor"), {
        y: 60, opacity: 0, stagger: 0.06, ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 75%", end: "top 30%", scrub: 0.8 },
      });
    });

    return () => media.revert();
  }, { scope: root });

  return (
    <section ref={root} id="cuidado" className="cuidado">
      <div className="wrap cuidado__cab">
        <div>
          <p className="eyebrow">Padrão de cuidado</p>
          <h2 data-split>O cuidado aparece <em>nos detalhes.</em></h2>
        </div>
        <div>
          <p className="lead">Bastidores reais do Complexo SC: consultas sem pressa, café servido com flor, retornos e reencontros.</p>
          <div className="cuidado__progresso" aria-hidden="true"><span /></div>
        </div>
      </div>
      <div className="cuidado__janela">
        <div ref={trilho} className="cuidado__trilho">
          {bastidores.map((b, i) => (
            <figure key={b.img} className={`bastidor${i % 3 === 1 ? " bastidor--baixo" : ""}`}>
              <div className="bastidor__img">
                {b.video ? (
                  <video src={b.video} poster={b.img} muted loop playsInline autoPlay preload="metadata" aria-label={b.alt} />
                ) : (
                  <img src={b.img} alt={b.alt} loading="lazy" draggable={false} />
                )}
              </div>
              <figcaption>{b.legenda}</figcaption>
              <small className="bastidor__origem">{b.origem}</small>
            </figure>
          ))}
        </div>
      </div>
      <div className="wrap cuidado__rodape">
        <p className="nota">Fotos e vídeos do Instagram da clínica, usados aqui como prévia. Uso no site depende de arquivos originais e autorização de cada pessoa.</p>
      </div>
    </section>
  );
}
