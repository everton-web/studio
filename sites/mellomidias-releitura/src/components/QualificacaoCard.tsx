"use client";

import { motion, useReducedMotion } from "motion/react";

export type Qualificacao = {
  ok: boolean;
  qualificado: boolean;
  temperatura: "quente" | "morno" | "frio" | null;
  confianca: number;
  potencial: number | null; // 0 a 2
  dor: number | null; // 0 a 1
  urgencia: number | null; // 0 a 1
  prioridade: 1 | 2 | 3;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const TEMPERATURA = { quente: "Lead quente", morno: "Lead morno", frio: "Lead frio" } as const;
const PRIORIDADE = { 3: "Ligar agora", 2: "Ligar hoje", 1: "Nutrir" } as const;
const pct = (v: number | null) => (v == null ? "sem dado" : `${Math.round(v * 100)}%`);

// Demonstração para o parceiro: a classificação que o comercial receberia junto com o lead.
export function QualificacaoCard({ dados }: { dados: Qualificacao | null }) {
  const reduce = useReducedMotion();
  const entra = (i: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.5 + i * 0.12, ease: EASE } };

  if (!dados?.qualificado || !dados.temperatura) {
    return (
      <motion.div className="qual-card" {...entra(0)}>
        <p className="qual-eyebrow">O que o Gabriel recebe</p>
        <p className="qual-vazio">Lead registrado. A qualificação automática não respondeu agora, então ele entra na fila normal.</p>
      </motion.div>
    );
  }

  const potencial = dados.potencial == null ? 0 : dados.potencial / 2;
  const barras = [
    { rotulo: "Potencial de faturamento", valor: potencial, texto: pct(potencial) },
    { rotulo: "Dor com o marketing atual", valor: dados.dor ?? 0, texto: pct(dados.dor) },
    { rotulo: "Urgência", valor: dados.urgencia ?? 0, texto: pct(dados.urgencia) },
  ];

  return (
    <motion.div className="qual-card" {...entra(0)} aria-label="Classificação do lead pelo JEV">
      <div className="qual-head">
        <p className="qual-eyebrow">O que o Gabriel recebe</p>
        <span className={`qual-selo qual-${dados.temperatura}`}>{TEMPERATURA[dados.temperatura]}</span>
      </div>
      <ul className="qual-barras">
        {barras.map((b, i) => (
          <motion.li key={b.rotulo} {...entra(i + 1)}>
            <div className="qual-linha"><span>{b.rotulo}</span><strong>{b.texto}</strong></div>
            <div className="qual-trilho" aria-hidden="true">
              <motion.span initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: b.valor }}
                transition={{ duration: 0.9, delay: 0.7 + i * 0.12, ease: EASE }} />
            </div>
          </motion.li>
        ))}
      </ul>
      <motion.div className="qual-rodape" {...entra(4)}>
        <span className="qual-prioridade">Prioridade {dados.prioridade} · {PRIORIDADE[dados.prioridade]}</span>
        <span className="qual-confianca">Confiança {pct(dados.confianca)}</span>
      </motion.div>
      <p className="qual-fonte">Classificado em segundos pelo JEV (TypeSafe). Quem preenche o formulário não vê este card.</p>
    </motion.div>
  );
}
