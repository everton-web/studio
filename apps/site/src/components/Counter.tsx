"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

// Número que conta até o valor quando entra na tela (uma vez só), formatado em pt-BR.
export function Counter({ to, duration = 1.6 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");

  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduced) {
      ref.current.textContent = fmt(to);
      return;
    }
    const ctrl = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = fmt(v);
      },
    });
    return () => ctrl.stop();
  }, [inView, reduced, to, duration]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {reduced ? fmt(to) : "0"}
    </span>
  );
}
