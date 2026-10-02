"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { bastidores } from "@/data/content";

gsap.registerPlugin(useGSAP, ScrollTrigger, Draggable, InertiaPlugin);

export function Cuidado() {
  const root = useRef<HTMLElement>(null);
  const trilho = useRef<HTMLDivElement>(null);
  const arrasto = useRef<Draggable | null>(null);

  // Limites do arrasto: a faixa nunca descola das bordas do contêiner.
  const limites = () => {
    const t = trilho.current, janela = t?.parentElement;
    if (!t || !janela) return { minX: 0, maxX: 0 };
    return { minX: Math.min(0, janela.clientWidth - t.scrollWidth), maxX: 0 };
  };

  const mover = (dir: 1 | -1) => {
    const t = trilho.current;
    if (!t) return;
    const card = t.querySelector<HTMLElement>(".bastidor");
    const passo = (card?.offsetWidth ?? 300) + 20;
    const { minX, maxX } = limites();
    const atual = Number(gsap.getProperty(t, "x")) || 0;
    const alvo = gsap.utils.clamp(minX, maxX, atual - dir * passo * 2);
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(t, { x: alvo, duration: reduz ? 0 : 1, ease: "expo.out", onUpdate: () => arrasto.current?.update() });
  };

  useGSAP(() => {
    const t = trilho.current;
    if (!t) return;
    const q = gsap.utils.selector(root);
    arrasto.current = Draggable.create(t, {
      type: "x", inertia: true, edgeResistance: 0.85, dragClickables: true, cursor: "grab", activeCursor: "grabbing",
      bounds: limites(), zIndexBoost: false,
      onPress() { this.applyBounds(limites()); },
    })[0];
    const onResize = () => arrasto.current?.applyBounds(limites());
    window.addEventListener("resize", onResize);

    const media = gsap.matchMedia();
    // Entrada em leque: as fotos nascem empilhadas e giradas no centro e abrem até a fila.
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const cards = q<HTMLElement>(".bastidor");
      const janela = t.parentElement as HTMLElement;
      const centro = janela.clientWidth / 2;
      const meio = (cards.length - 1) / 2;
      gsap.fromTo(cards,
        {
          x: (i: number) => centro - (cards[i].offsetLeft + cards[i].offsetWidth / 2),
          rotation: (i: number) => (i - meio) * 7,
          y: (i: number) => Math.abs(i - meio) * 18 + 40,
          transformOrigin: "50% 130%",
        },
        { x: 0, rotation: 0, y: 0, ease: "power3.inOut", stagger: { each: 0.03, from: "center" },
          scrollTrigger: { trigger: janela, start: "top 88%", end: "top 30%", scrub: 0.9 } });
      gsap.fromTo(q(".cuidado__dica"), { opacity: 0 }, { opacity: 1, scrollTrigger: { trigger: janela, start: "top 35%", end: "top 25%", scrub: true } });
    });

    return () => { window.removeEventListener("resize", onResize); arrasto.current?.kill(); media.revert(); };
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
          <div className="cuidado__setas">
            <button type="button" className="seta" onClick={() => mover(-1)} aria-label="Fotos anteriores"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M14 8H3M7 4 3 8l4 4" /></svg></button>
            <button type="button" className="seta" onClick={() => mover(1)} aria-label="Próximas fotos"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" /></svg></button>
          </div>
        </div>
      </div>
      <div className="cuidado__janela" data-lenis-prevent-touch>
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
        <p className="cuidado__dica" aria-hidden="true">Arraste para o lado</p>
        <p className="nota">Fotos e vídeos do Instagram da clínica, usados aqui como prévia. Uso no site depende de arquivos originais e autorização de cada pessoa.</p>
      </div>
    </section>
  );
}
