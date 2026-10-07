"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Manifesto: o filme da identidade começa como um cartão pequeno no meio da tela
// e cresce até ocupar a tela inteira conforme a rolagem, preso (sticky) enquanto toca.
// O vídeo roda sozinho, mudo e em loop; a rolagem controla só o tamanho.
// Celular usa a versão vertical. Só toca enquanto está visível.
export function ManifestoVideo() {
  const secao = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [vertical, setVertical] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const ler = () => setVertical(mq.matches);
    ler();
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);

  useEffect(() => {
    const v = video.current;
    if (!v || reduced) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, [reduced, vertical]);

  const { scrollYProgress } = useScroll({ target: secao, offset: ["start start", "end end"] });
  const escala = useTransform(scrollYProgress, [0, 0.55], [vertical ? 0.62 : 0.42, 1]);
  const raio = useTransform(scrollYProgress, [0, 0.55], [28, 0]);
  // Função em vez de faixas: evita a aceleração nativa (ScrollTimeline) que erra a faixa com sticky.
  const fraseOpacidade = useTransform(scrollYProgress, (v) => (v <= 0.15 ? 1 : v >= 0.32 ? 0 : 1 - (v - 0.15) / 0.17));
  const fraseY = useTransform(scrollYProgress, [0, 0.32], ["0%", "-40%"]);

  const base = vertical ? "/idv/idv-vertical" : "/idv/idv-horizontal";

  if (reduced) {
    return (
      <section id="manifesto" aria-label="Filme da marca" className="container-site" style={{ padding: "var(--section-pad) var(--gutter)" }}>
        <video src={`${base}.mp4`} poster={`${base}.jpg`} controls muted playsInline preload="none" className="w-full rounded-[18px]" />
      </section>
    );
  }

  return (
    <section ref={secao} id="manifesto" aria-label="Filme da marca" style={{ height: "260vh", background: "var(--color-bg)" }}>
      <div className="sticky top-0 z-[2] h-screen overflow-hidden grid place-items-center" style={{ background: "var(--color-bg)" }}>
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{ scale: escala, borderRadius: raio, willChange: "transform" }}
        >
          <video
            key={base}
            ref={video}
            src={`${base}.mp4`}
            poster={`${base}.jpg`}
            muted
            loop
            playsInline
            preload="metadata"
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
