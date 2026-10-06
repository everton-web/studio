"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TriangleIcon } from "./TriangleIcon";
import { useLang } from "@/context/LanguageContext";

// Faixa de serviços correndo sem parar: conteúdo duplicado e x de 0 a -50%,
// assim o fim de uma cópia encaixa no começo da outra. Bordas esfumadas por máscara.
export function ServicesMarquee() {
  const { t } = useLang();
  const reduced = useReducedMotion();
  const itens = [...t.services.core.map((s) => s.title), ...t.services.special.items.map((s) => s.title)];

  return (
    <div
      aria-hidden
      className="relative overflow-hidden py-7 max-md:py-5"
      style={{
        background: "var(--color-bg)",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
        maskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
      }}
    >
      <motion.div
        className="flex w-max items-center"
        animate={reduced ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 35, ease: "linear", repeat: Infinity }}
      >
        {[0, 1].map((copia) => (
          <div key={copia} className="flex items-center">
            {[...itens, ...itens].map((nome, i) => (
              <span
                key={`${copia}-${i}`}
                className="flex items-center gap-8 pr-8 whitespace-nowrap text-[var(--color-text)]"
                style={{ fontSize: "clamp(1.6rem, 3.4vw, 3rem)", fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 1 }}
              >
                {nome}
                <TriangleIcon className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
