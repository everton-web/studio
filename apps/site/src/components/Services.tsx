"use client";

import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";
import { TriangleIcon } from "./TriangleIcon";
import { LineReveal } from "./TextReveal";
import { useLang } from "@/context/LanguageContext";
import { usePromo } from "@/hooks/usePromo";
import { precoComDesconto, formatBRL } from "@/lib/promo";
import { PromoBanner } from "./PromoBanner";
import { semViuva } from "@/lib/texto";

const cardTransition = { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const };

export function Services() {
  const { t } = useLang();
  const { ativa } = usePromo();

  return (
    <section
      id="services"
      style={{ background: "var(--color-bg-soft)", padding: "var(--section-pad) 0" }}
    >
      <div className="relative z-[2] container-site">
        <AnimatedSection>
          <div className="flex items-center gap-6 mb-16 max-md:mb-10">
            <span className="section-number">01</span>
            <div className="divider-accent" />
            <span className="section-label">
              <TriangleIcon className="w-3 h-3" />
              {t.services.label}
            </span>
          </div>

          <div className="flex items-end justify-between gap-8 mb-16 max-md:flex-col max-md:items-start max-md:gap-4">
            <LineReveal
              lines={[
                t.services.titleBefore,
                <span key="accent" className="serif">{t.services.titleAccent}</span>,
              ]}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(2.6rem, 9vw, 8.5rem)",
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: "-0.075em",
              }}
            />
            <p className="text-[var(--color-text-secondary)] max-w-[340px]" style={{ lineHeight: 1.7 }}>
              {t.services.intro}
            </p>
          </div>
        </AnimatedSection>

        <PromoBanner variant="inline" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {t.services.core.map((service, i) => (
            <AnimatedSection key={service.title} delay={0.1 * (i + 1)}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={cardTransition}
                className="group relative overflow-hidden rounded-[14px] p-10 max-md:p-7 h-full flex flex-col"
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[var(--color-accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500" />

                <span
                  className="block transition-colors transition-opacity duration-300 text-[var(--color-text-dim)] opacity-[0.55] group-hover:opacity-100 group-hover:text-[var(--color-accent)]"
                  style={{
                    fontSize: "clamp(2.4rem, 4vw, 3.4rem)",
                    fontWeight: 300,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                    marginBottom: "1rem",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3
                  className="text-[var(--color-text)] mb-4"
                  style={{
                    fontSize: "clamp(1.5rem, 3vw, 2.4rem)",
                    fontWeight: 500,
                    lineHeight: 1.1,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {semViuva(service.title)}
                </h3>

                <p className="text-[var(--color-text-secondary)] mb-8" style={{ lineHeight: 1.7 }}>
                  {service.result}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {service.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[0.65rem] font-medium uppercase tracking-[0.08em] px-3 py-1.5 rounded-full"
                      style={{
                        background: "var(--color-accent-subtle)",
                        color: "var(--color-accent)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div
                  className="mt-auto flex items-baseline gap-2 pt-6"
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  <span className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
                    {t.services.priceFrom}
                  </span>
                  {ativa ? (
                    <>
                      <s
                        className="text-[var(--color-text-dim)]"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {service.price}
                      </s>
                      <span
                        className="font-semibold text-[var(--color-accent)]"
                        style={{ fontSize: "1.4rem", letterSpacing: "-0.01em" }}
                      >
                        {formatBRL(precoComDesconto(service.priceValue))}
                      </span>
                    </>
                  ) : (
                    <span
                      className="font-semibold text-[var(--color-text)]"
                      style={{ fontSize: "1.25rem", letterSpacing: "-0.01em" }}
                    >
                      {service.price}
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        {/* Seção especial: Consultoria & Mentoria (acompanhamento, não entregável) */}
        <div
          className="mt-6 rounded-[22px] p-10 max-md:p-7"
          style={{
            background:
              "linear-gradient(180deg, var(--color-accent-subtle), transparent 60%)",
            border: "1px solid var(--color-border)",
          }}
        >
          <AnimatedSection>
            <div className="flex items-start justify-between gap-8 mb-10 max-md:flex-col max-md:gap-4">
              <div>
                <span className="section-label mb-4">
                  <TriangleIcon className="w-3 h-3" />
                  {t.services.special.label}
                </span>
                <h3
                  style={{
                    fontSize: "clamp(1.5rem, 2.6vw, 2rem)",
                    fontWeight: 500,
                    lineHeight: 1.15,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {t.services.special.titleBefore}{" "}
                  <span className="serif">{t.services.special.titleAccent}</span>
                </h3>
              </div>
              <p
                className="text-[var(--color-text-secondary)] max-w-[360px] max-md:max-w-none"
                style={{ lineHeight: 1.7 }}
              >
                {t.services.special.intro}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.services.special.items.map((item, i) => (
              <AnimatedSection key={item.title} delay={0.1 * (i + 1)}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={cardTransition}
                  className="group relative overflow-hidden rounded-[14px] p-7 h-full flex flex-col"
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500" />

                  <h4 className="text-[var(--color-text)] text-lg font-medium mb-3">
                    {semViuva(item.title)}
                  </h4>
                  <p
                    className="text-[var(--color-text-secondary)] mb-8"
                    style={{ lineHeight: 1.7 }}
                  >
                    {item.description}
                  </p>

                  <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {ativa ? (
                      <>
                        <s
                          className="text-[var(--color-text-dim)]"
                          style={{ fontSize: "0.9rem" }}
                        >
                          {item.price}
                        </s>
                        <span
                          className="font-semibold text-[var(--color-accent)]"
                          style={{ fontSize: "1.25rem", letterSpacing: "-0.01em" }}
                        >
                          {formatBRL(precoComDesconto(item.priceValue))}
                        </span>
                      </>
                    ) : (
                      <span
                        className="font-semibold text-[var(--color-text)]"
                        style={{ fontSize: "1.25rem", letterSpacing: "-0.01em" }}
                      >
                        {item.price}
                      </span>
                    )}
                    <span className="text-[0.7rem] text-[var(--color-text-dim)]">
                      {item.priceNote}
                    </span>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
