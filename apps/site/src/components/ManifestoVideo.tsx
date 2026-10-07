"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Manifesto: o filme da identidade segue a rolagem. Primeiro o cartão cresce até a
// tela inteira; depois cada pedaço de rolagem avança (ou volta) o tempo do vídeo.
// Os arquivos *-scrub.mp4 têm todos os quadros como quadro-chave (-g 1), o que deixa
// a busca de tempo instantânea. Celular usa a versão vertical.
const CRESCER = 0.12; // fração da rolagem gasta crescendo o cartão

export function ManifestoVideo() {
  const secao = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const alvo = useRef(0);
  const reduced = useReducedMotion();
  const [vertical, setVertical] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const ler = () => setVertical(mq.matches);
    ler();
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);

  const { scrollYProgress } = useScroll({ target: secao, offset: ["start start", "end end"] });
  const escala = useTransform(scrollYProgress, (v) => {
    const ini = vertical ? 0.62 : 0.42;
    return v >= CRESCER ? 1 : ini + (1 - ini) * (v / CRESCER);
  });
  const raio = useTransform(scrollYProgress, (v) => (v >= CRESCER ? 0 : 28 * (1 - v / CRESCER)));
  const fraseOpacidade = useTransform(scrollYProgress, (v) => (v <= 0.03 ? 1 : v >= 0.1 ? 0 : 1 - (v - 0.03) / 0.07));
  const fraseY = useTransform(scrollYProgress, (v) => `${-Math.min(1, v / 0.1) * 40}%`);

  // Rolagem define o tempo-alvo; um laço suaviza o caminho até ele (sem saltos).
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const d = video.current?.duration || 0;
    alvo.current = d * Math.min(1, Math.max(0, (v - CRESCER) / (1 - CRESCER)));
  });

  useEffect(() => {
    if (reduced) return;
    const v = video.current;
    if (!v) return;
    let raf = 0;
    const loop = () => {
      if (v.readyState >= 1) {
        const atual = v.currentTime;
        const diff = alvo.current - atual;
        if (Math.abs(diff) > 0.01) v.currentTime = atual + diff * 0.25;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // iOS só permite buscar tempo depois de um play iniciado por gesto.
    const destravar = () => {
      v.play().then(() => v.pause()).catch(() => {});
      window.removeEventListener("touchstart", destravar);
    };
    window.addEventListener("touchstart", destravar, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("touchstart", destravar);
    };
  }, [reduced, vertical]);

  const base = vertical ? "/idv/idv-vertical" : "/idv/idv-horizontal";

  if (reduced) {
    return (
      <section id="manifesto" aria-label="Filme da marca" className="container-site" style={{ padding: "var(--section-pad) var(--gutter)" }}>
        <video src={`${base}-scrub.mp4`} poster={`${base}.jpg`} controls muted playsInline preload="none" className="w-full rounded-[18px]" />
      </section>
    );
  }

  return (
    <section ref={secao} id="manifesto" aria-label="Filme da marca" style={{ height: "600vh", background: "var(--color-bg)" }}>
      <div className="sticky top-0 z-[2] h-screen overflow-hidden grid place-items-center" style={{ background: "var(--color-bg)" }}>
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{ scale: escala, borderRadius: raio, willChange: "transform" }}
        >
          <video
            key={base}
            ref={video}
            src={`${base}-scrub.mp4`}
            muted
            playsInline
            preload="auto"
            aria-hidden
            className="h-full w-full object-cover"
          />
        </motion.div>

        <motion.p
          aria-hidden
          className="relative z-[1] pointer-events-none text-center text-[var(--color-text)]"
          style={{
            opacity: fraseOpacidade,
            y: fraseY,
            fontSize: "clamp(2.6rem, 8vw, 7.5rem)",
            fontWeight: 500,
            letterSpacing: "-0.075em",
            lineHeight: 1,
            mixBlendMode: "difference",
          }}
        >
          Design que <span className="text-[var(--color-accent)]">conecta.</span>
        </motion.p>
      </div>
    </section>
  );
}
