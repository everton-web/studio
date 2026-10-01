"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { form, leadSection, revenueOptions, steps, trafficOptions } from "@/data/content";
import { QualificacaoCard, type Qualificacao } from "@/components/QualificacaoCard";

type Fields = { name: string; phone: string; instagram: string; revenue: string; traffic: string };
type FieldName = keyof Fields;
type Errors = Partial<Record<FieldName, string>>;

const EMPTY: Fields = { name: "", phone: "", instagram: "", revenue: "", traffic: "" };
const STEP_FIELDS: Record<1 | 2, FieldName[]> = { 1: ["name", "phone"], 2: ["instagram", "revenue", "traffic"] };
const EASE = [0.22, 1, 0.36, 1] as const;

function maskPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const head = rest.length > 8 ? rest.slice(0, 5) : rest.slice(0, 4);
  const tail = rest.slice(head.length);
  return `(${ddd}) ${head}-${tail}`;
}

function validate(field: FieldName, value: string): string | undefined {
  const text = value.trim();
  switch (field) {
    case "name":
      return text.length < 2 ? "Conte como podemos chamar você." : undefined;
    case "phone": {
      const digits = text.replace(/\D/g, "");
      if (!digits) return "Informe seu WhatsApp com DDD.";
      return digits.length < 10 ? "Número incompleto. Use DDD e número." : undefined;
    }
    case "instagram":
      if (!text) return "Informe o Instagram da clínica.";
      return /^@?[A-Za-z0-9._]{2,30}$/.test(text) ? undefined : "Use só o perfil, por exemplo @suaclinica.";
    case "revenue":
      return text ? undefined : "Escolha uma faixa de faturamento.";
    case "traffic":
      return text ? undefined : "Escolha uma opção.";
  }
}

export function LeadFormSection() {
  const id = useId();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [sending, setSending] = useState(false);
  const [qualif, setQualif] = useState<Qualificacao | null>(null);
  const [demo, setDemo] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  // Card "O que o Gabriel recebe" só aparece com ?demo=1 (quem preenche nunca vê a classificação).
  useEffect(() => { setDemo(new URLSearchParams(window.location.search).has("demo")); }, []);
  const firstRender = useRef(true);

  // Move o foco para o início de cada passo (exceto no carregamento da página).
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const target = panel.current?.querySelector<HTMLElement>("[data-autofocus]");
    target?.focus({ preventScroll: true });
  }, [step]);

  const update = (field: FieldName, value: string) => {
    const next = field === "phone" ? maskPhone(value) : value;
    setFields((current) => ({ ...current, [field]: next }));
    if (touched[field] || errors[field]) setErrors((current) => ({ ...current, [field]: validate(field, next) }));
  };

  const blur = (field: FieldName) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: validate(field, fields[field]) }));
  };

  const checkStep = (current: 1 | 2) => {
    const found: Errors = {};
    for (const field of STEP_FIELDS[current]) {
      const message = validate(field, fields[field]);
      if (message) found[field] = message;
    }
    setErrors((existing) => ({ ...existing, ...found }));
    setTouched((existing) => ({ ...existing, ...Object.fromEntries(STEP_FIELDS[current].map((field) => [field, true])) }));
    const firstInvalid = STEP_FIELDS[current].find((field) => found[field]);
    if (firstInvalid) {
      panel.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return false;
    }
    return true;
  };

  // Envia para a qualificação (JEV, no servidor). O lead nunca se perde: se a IA falhar, segue para o sucesso.
  const enviar = async () => {
    setSending(true);
    try {
      const r = await fetch("/api/qualificar.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: fields.name, whatsapp: fields.phone, instagram: fields.instagram, faturamento: fields.revenue, investe: fields.traffic }),
        signal: AbortSignal.timeout(12000),
      });
      const j = await r.json();
      if (j?.ok) setQualif(j as Qualificacao);
    } catch { /* segue sem classificação */ }
    setSending(false);
    setStep(3);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    if (step === 1 && checkStep(1)) setStep(2);
    else if (step === 2 && checkStep(2)) void enviar();
  };

  const reset = () => { setFields(EMPTY); setErrors({}); setTouched({}); setQualif(null); setStep(1); };

  const fieldProps = (field: FieldName) => ({
    id: `${id}-${field}`,
    name: field,
    value: fields[field],
    "aria-invalid": Boolean(errors[field]) || undefined,
    "aria-describedby": errors[field] ? `${id}-${field}-error` : undefined,
    onChange: (event: { target: { value: string } }) => update(field, event.target.value),
    onBlur: () => blur(field),
  });

  const errorText = (field: FieldName) => (
    <AnimatePresence initial={false}>
      {errors[field] && (
        <motion.p key="error" id={`${id}-${field}-error`} className="field-error" role="alert"
          initial={reduce ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {errors[field]}
        </motion.p>
      )}
    </AnimatePresence>
  );

  const progress = step === 1 ? 0.5 : step === 2 ? 0.85 : 1;
  const slide = reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 } };
  const firstName = fields.name.trim().split(/\s+/)[0];

  return (
    <section id="formulario" className="section lead-section" aria-labelledby="formulario-title">
      <div className="container lead-layout">
        <div className="lead-copy">
          <p className="eyebrow">{leadSection.eyebrow}</p>
          <h2 id="formulario-title">Não saia sem receber seu <span className="text-accent">Plano Estratégico</span></h2>
          <p className="lead">{leadSection.description}</p>
          <ol className="lead-steps">
            {steps.map((item) => (
              <li key={item.number} className="lead-step">
                <span className="lead-step-number" aria-hidden="true">{item.number}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="lead-card">
          <div className="lead-card-head">
            <p className="lead-card-title">{form.title}</p>
            <p className="lead-card-step" aria-live="polite">
              {step < 3 ? `Passo ${step} de 2 · ${form.stepLabels[step - 1]}` : "Concluído"}
            </p>
          </div>
          <div className="lead-progress" role="progressbar" aria-label="Progresso do formulário" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
            <motion.span initial={false} animate={{ scaleX: progress }} transition={{ duration: reduce ? 0 : 0.6, ease: EASE }} />
          </div>

          <div ref={panel} className="lead-panel">
            <AnimatePresence mode="wait" initial={false}>
              {step === 3 ? (
                <motion.div key="success" className="lead-success" {...slide} transition={{ duration: 0.4, ease: EASE }}>
                  <svg className="lead-success-icon" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
                    <motion.circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2"
                      initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: EASE }} />
                    <motion.path d="m20 33 8 8 16-17" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                      initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.45, ease: EASE }} />
                  </svg>
                  <h3 tabIndex={-1} data-autofocus>{form.successTitle}{firstName ? `, ${firstName}` : ""}.</h3>
                  <p>{form.successDescription}</p>
                  {demo && <QualificacaoCard dados={qualif} />}
                  {demo && <button type="button" className="button button-ghost" onClick={reset}>Testar outro lead</button>}
                </motion.div>
              ) : (
                <motion.form key={`step-${step}`} noValidate onSubmit={submit} {...slide} transition={{ duration: 0.35, ease: EASE }}>
                  {step === 1 ? (
                    <div className="lead-fields">
                      <div className="field">
                        <label htmlFor={`${id}-name`}>{form.labels.name}</label>
                        <input {...fieldProps("name")} type="text" autoComplete="name" placeholder="Como podemos chamar você" data-autofocus />
                        {errorText("name")}
                      </div>
                      <div className="field">
                        <label htmlFor={`${id}-phone`}>{form.labels.phone}</label>
                        <input {...fieldProps("phone")} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="(71) 99999-9999" />
                        {errorText("phone")}
                      </div>
                    </div>
                  ) : (
                    <div className="lead-fields">
                      <div className="field">
                        <label htmlFor={`${id}-instagram`}>{form.labels.instagram}</label>
                        <input {...fieldProps("instagram")} type="text" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="@suaclinica" data-autofocus />
                        {errorText("instagram")}
                      </div>
                      <fieldset className="field" aria-describedby={errors.revenue ? `${id}-revenue-error` : undefined}>
                        <legend>{form.labels.revenue}</legend>
                        <div className="chip-group">
                          {revenueOptions.map((option) => (
                            <label key={option.value} className="chip">
                              <input type="radio" name="revenue" value={option.value} checked={fields.revenue === option.value} onChange={() => update("revenue", option.value)} />
                              <span>{option.label}</span>
                            </label>
                          ))}
                        </div>
                        {errorText("revenue")}
                      </fieldset>
                      <fieldset className="field" aria-describedby={errors.traffic ? `${id}-traffic-error` : undefined}>
                        <legend>{form.labels.traffic}</legend>
                        <div className="chip-group">
                          {trafficOptions.map((option) => (
                            <label key={option.value} className="chip">
                              <input type="radio" name="traffic" value={option.value} checked={fields.traffic === option.value} onChange={() => update("traffic", option.value)} />
                              <span>{option.label}</span>
                            </label>
                          ))}
                        </div>
                        {errorText("traffic")}
                      </fieldset>
                    </div>
                  )}
                  <div className="lead-actions">
                    {step === 2 && (
                      <button type="button" className="button button-ghost lead-back" onClick={() => setStep(1)}>
                        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5m6 6-6-6 6-6" /></svg>
                        Voltar
                      </button>
                    )}
                    <button type="submit" className="button button-primary lead-submit" disabled={sending} aria-busy={sending}>
                      {step === 1 ? "Continuar" : sending ? "Enviando" : "Quero meu plano estratégico"}
                      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                    </button>
                  </div>
                  <p className="lead-safety">
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                    {form.safety}
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
