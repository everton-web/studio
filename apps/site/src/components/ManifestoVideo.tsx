"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { PlayerRef } from "@remotion/player";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";

// O player do Remotion só existe no navegador (e só carrega quando a seção chega perto).
const IdvPlayer = dynamic(() => import("./IdvPlayer"), { ssr: false });

// Manifesto: o filme da identidade (projeto Remotion, vetorial e nítido em qualquer tela)
// segue a rolagem. Primeiro o cartão cresce até a tela inteira; depois cada pedaço de
// rolagem avança (ou volta) um quadro do filme. Celular usa a composição vertical.
const IDV_FRAMES = 1117; // mesmo total do filme (IdvPlayer); fica aqui para não puxar o player no carregamento
const CRESCER = 0.06; // fração da rolagem gasta crescendo o cartão

// Ritmo de leitura: quadros (do filme inteiro) em que cada frase acabou de assentar.
// Ali o filme PARA por PAUSA "unidades" de rolagem antes de seguir (1 unidade = 1 quadro andando).
// Se o filme mudar em remotion/idv, revise estes quadros (cenas e duracoes em tokens.ts).
const PAUSAS = [
  14, 36, 58, // sites. · sistemas. · landing pages.
  121, // símbolo
  246, // O que vamos criar hoje?
  356, // faixa de serviços
  496, // cartões
  581, 641, // 100% online · 27 estados
  680, 716, 776, // Estratégia. · Essência. · Público certo.
  822, 880, // Uma identidade. · Infinitas criações. (antes do círculo cobrir a tela)
  1116, // assinatura
];
const PAUSA = 45;

// Trechos [unidadeIni, unidadeFim, quadroIni, quadroFim].
const TRECHOS: [number, number, number, number][] = (() => {
  const t: [number, number, number, number][] = [];
  let u = 0;
  let q = 0;
  for (const p of PAUSAS) {
    if (p > q) { t.push([u, u + (p - q), q, p]); u += p - q; q = p; }
    t.push([u, u + PAUSA, p, p]);
    u += PAUSA;
  }
  if (q < IDV_FRAMES - 1) t.push([u, u + (IDV_FRAMES - 1 - q), q, IDV_FRAMES - 1]);
  return t;
})();
const TOTAL_UNIDADES = TRECHOS[TRECHOS.length - 1][1];

function quadroDaRolagem(p: number): number {
  const u = p * TOTAL_UNIDADES;
  const tr = TRECHOS.find(([, b]) => u <= b) ?? TRECHOS[TRECHOS.length - 1];
  const [a, b, q0, q1] = tr;
  const k = b > a ? Math.min(1, Math.max(0, (u - a) / (b - a))) : 1;
  return Math.min(IDV_FRAMES - 1, q0 + (q1 - q0) * k);
}

export function ManifestoVideo() {
  const secao = useRef<HTMLElement>(null);
  const player = useRef<PlayerRef>(null);
  const alvo = useRef(0);
  const atual = useRef(0);
  const reduced = useReducedMotion();
  const [vertical, setVertical] = useState(false);
  const [perto, setPerto] = useState(false);
  const [proporcao, setProporcao] = useState(16 / 9);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const ler = () => {
      setVertical(mq.matches);
      setProporcao(window.innerWidth / window.innerHeight);
    };
    ler();
    mq.addEventListener("change", ler);
    window.addEventListener("resize", ler);
    return () => {
      mq.removeEventListener("change", ler);
      window.removeEventListener("resize", ler);
    };
  }, []);

  // Carrega o player um pouco antes da seção entrar na tela.
  useEffect(() => {
    const el = secao.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setPerto(true), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: secao, offset: ["start start", "end end"] });
  const escala = useTransform(scrollYProgress, (v) => {
    const ini = vertical ? 0.62 : 0.42;
    return v >= CRESCER ? 1 : ini + (1 - ini) * (v / CRESCER);
  });
  const raio = useTransform(scrollYProgress, (v) => (v >= CRESCER ? 0 : 28 * (1 - v / CRESCER)));
  const fraseOpacidade = useTransform(scrollYProgress, (v) => (v <= 0.015 ? 1 : v >= 0.05 ? 0 : 1 - (v - 0.015) / 0.035));
  const fraseY = useTransform(scrollYProgress, (v) => `${-Math.min(1, v / 0.05) * 40}%`);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    alvo.current = quadroDaRolagem(Math.min(1, Math.max(0, (v - CRESCER) / (1 - CRESCER))));
  });

  // Laço suave: caminha até o quadro-alvo sem saltos quando a rolagem é rápida.
  useEffect(() => {
    if (reduced || !perto) return;
    let raf = 0;
    let ultimo = -1;
    const loop = () => {
      atual.current += (alvo.current - atual.current) * 0.14;
      const q = Math.round(atual.current);
      if (q !== ultimo && player.current) {
        player.current.seekTo(q);
        ultimo = q;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, perto, vertical]);

  if (reduced) {
    return (
      <section id="manifesto" aria-label="Filme da marca" className="container-site" style={{ padding: "var(--section-pad) var(--gutter)" }}>
        <p className="text-center text-[var(--color-text)]" style={{ fontSize: "clamp(2.2rem, 6vw, 5rem)", fontWeight: 500, letterSpacing: "-0.075em", lineHeight: 1 }}>
          Design que <span className="text-[var(--color-accent)]">conecta.</span>
        </p>
      </section>
    );
  }

  return (
    <section ref={secao} id="manifesto" aria-label="Filme da marca" style={{ height: "1600vh", background: "var(--color-bg)" }}>
      <div className="sticky top-0 z-[2] h-screen overflow-hidden grid place-items-center" style={{ background: "var(--color-bg)" }}>
        <motion.div
          className="absolute inset-0 overflow-hidden grid place-items-center"
          style={{ scale: escala, borderRadius: raio, willChange: "transform", background: "#0a0a0b" }}
        >
          {/* O filme é composto na proporção da própria tela: as cenas se adaptam e nada é cortado. */}
          <div aria-hidden className="absolute inset-0">
            {perto && <IdvPlayer key={vertical ? "v" : "h"} ref={player} vertical={vertical} proporcao={proporcao} />}
          </div>
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
