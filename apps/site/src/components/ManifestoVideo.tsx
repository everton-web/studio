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
const IDV_FRAMES = 804; // mesmo total do filme (IdvPlayer); fica aqui para não puxar o player no carregamento
const CRESCER = 0.06; // fração da rolagem gasta crescendo o cartão

// Ritmo de leitura: duração de cada cena (igual a duracoes em remotion/idv/tokens.ts,
// copiada para não puxar o Remotion no carregamento). Em cada cena o filme corre até
// o texto assentar (PONTO da cena) e PARA por PAUSA "quadros de rolagem" antes de seguir.
const CENAS = [36, 84, 90, 84, 96, 84, 90, 90, 150];
const PONTO = 0.72;
const PAUSA = 70;

// Trechos [unidadeIni, unidadeFim, quadroIni, quadroFim] da rolagem (1 unidade = 1 quadro andando).
const TRECHOS: [number, number, number, number][] = (() => {
  const t: [number, number, number, number][] = [];
  let u = 0;
  let q = 0;
  CENAS.forEach((dur, i) => {
    const ultima = i === CENAS.length - 1;
    const meio = ultima ? q + dur - 1 : q + Math.round(dur * PONTO);
    t.push([u, u + (meio - q), q, meio]);
    u += meio - q;
    t.push([u, u + PAUSA, meio, meio]);
    u += PAUSA;
    if (!ultima) {
      t.push([u, u + (q + dur - meio), meio, q + dur]);
      u += q + dur - meio;
    }
    q += dur;
  });
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

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const ler = () => setVertical(mq.matches);
    ler();
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
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
    <section ref={secao} id="manifesto" aria-label="Filme da marca" style={{ height: "1300vh", background: "var(--color-bg)" }}>
      <div className="sticky top-0 z-[2] h-screen overflow-hidden grid place-items-center" style={{ background: "var(--color-bg)" }}>
        <motion.div
          className="absolute inset-0 overflow-hidden grid place-items-center"
          style={{ scale: escala, borderRadius: raio, willChange: "transform", background: "#0a0a0b" }}
        >
          {/* "cover": o quadro mantém a proporção do filme e cobre a tela inteira */}
          <div
            aria-hidden
            style={{
              aspectRatio: vertical ? "9 / 16" : "16 / 9",
              width: vertical ? "max(100vw, calc(100svh * 9 / 16))" : "max(100vw, calc(100svh * 16 / 9))",
              flexShrink: 0,
            }}
          >
            {perto && <IdvPlayer key={vertical ? "v" : "h"} ref={player} vertical={vertical} />}
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
