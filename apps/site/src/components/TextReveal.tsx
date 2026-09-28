"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

type Tag = "h1" | "h2" | "h3" | "p";

interface LineRevealProps {
  lines: ReactNode[];
  className?: string;
  delay?: number;
  stagger?: number;
  as?: Tag;
  style?: CSSProperties;
}

export function LineReveal({
  lines,
  className,
  delay = 0,
  stagger = 0.12,
  as = "h2",
  style,
}: LineRevealProps) {
  const reduced = useReducedMotion();
  const Tag = as;

  if (reduced) {
    return (
      <Tag className={className} style={style}>
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={className} style={style}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
              hidden: { y: "110%" },
              visible: (idx: number) => ({
                y: "0%",
                transition: {
                  duration: 0.9,
                  ease,
                  delay: delay + idx * stagger,
                },
              }),
            }}
            className="block"
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

interface WordToken {
  t: string;
  accent?: boolean;
}

interface WordRevealProps {
  text?: string;
  segments?: WordToken[];
  className?: string;
  delay?: number;
  stagger?: number;
  style?: CSSProperties;
}

export function WordReveal({
  text,
  segments,
  className,
  delay = 0,
  stagger = 0.03,
  style,
}: WordRevealProps) {
  const reduced = useReducedMotion();

  const tokens: WordToken[] = segments ?? [{ t: text ?? "" }];
  const words: { t: string; accent: boolean }[] = [];
  for (const seg of tokens) {
    for (const part of seg.t.split(" ")) {
      if (part === "") continue;
      words.push({ t: part, accent: !!seg.accent });
    }
  }

  if (reduced) {
    return (
      <span className={className} style={style}>
        {tokens.map((seg, i) => (
          <span key={i} className={seg.accent ? "serif" : undefined}>
            {seg.t}{" "}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={className} style={style}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
              hidden: { y: "110%" },
              visible: (idx: number) => ({
                y: "0%",
                transition: { duration: 0.9, ease, delay: delay + idx * stagger },
              }),
            }}
            className={`inline-block ${word.accent ? "serif" : ""}`}
          >
            {word.t + (i < words.length - 1 ? "\u00A0" : "")}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
