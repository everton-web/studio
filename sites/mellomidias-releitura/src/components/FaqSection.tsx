"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { faq } from "@/data/content";

const EASE = [0.22, 1, 0.36, 1] as const;

export function FaqSection() {
  const id = useId();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<string | null>(faq[0].id);

  return (
    <section id="faq" className="section faq-section" aria-labelledby="faq-title">
      <div className="container faq-layout">
        <div className="faq-heading">
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title">Dúvidas frequentes</h2>
          <p>O que as clínicas mais perguntam antes de pedir o plano estratégico.</p>
        </div>
        <ul className="faq-list">
          {faq.map((item) => {
            const expanded = open === item.id;
            const buttonId = `${id}-${item.id}-button`;
            const panelId = `${id}-${item.id}-panel`;
            return (
              <li key={item.id} className="faq-item" data-open={expanded}>
                <h3>
                  <button id={buttonId} type="button" className="faq-trigger" aria-expanded={expanded} aria-controls={panelId} onClick={() => setOpen(expanded ? null : item.id)}>
                    <span>{item.question}</span>
                    <span className="faq-icon" aria-hidden="true"><i /><i /></span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div id={panelId} role="region" aria-labelledby={buttonId} className="faq-panel"
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}>
                      <p>{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
