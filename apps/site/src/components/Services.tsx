"use client";

import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";
import { TriangleIcon } from "./TriangleIcon";
import { useLang } from "@/context/LanguageContext";

const cardTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

export function Services() {
  const { t } = useLang();

  return (
    <section
      id="services"
      style={{ background: "var(--color-bg-soft)", padding: "clamp(6rem, 12vh, 10rem) 0" }}
    >
      <div className="max-w-[1280px] mx-auto px-8 max-md:px-6">
        <AnimatedSection>
          <div className="flex items-center gap-6 mb-16 max-md:mb-10">
            <span className="section-number">02</span>
            <div className="divider-accent" />
            <span className="section-label">
              <TriangleIcon className="w-3 h-3" />
              {t.services.label}
            </span>
          </div>

          <div className="flex items-end justify-between gap-8 mb-16 max-md:flex-col max-md:items-start max-md:gap-4">
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(1.9rem, 4vw, 3.2rem)",
                fontWeight: 500,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {t.services.titleBefore}{" "}
              <span className="serif">{t.services.titleAccent}</span>
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] max-w-[340px]" style={{ lineHeight: 1.7 }}>
              {t.services.intro}
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {t.services.core.map((service, i) => (
            <AnimatedSection key={service.title} delay={0.1 * (i + 1)}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={cardTransition}
                className="group relative overflow-hidden rounded-[20px] p-10 max-md:p-7 h-full flex flex-col"
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[var(--color-accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500" />

                <h3
                  className="text-[var(--color-text)] mb-4"
                  style={{
                    fontSize: "clamp(1.2rem, 1.9vw, 1.45rem)",
                    fontWeight: 500,
                    lineHeight: 1.3,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {service.title}
                </h3>

                <p className="text-sm text-[var(--color-text-muted)] mb-8" style={{ lineHeight: 1.7 }}>
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
                  <span
                    className="font-semibold text-[var(--color-text)]"
                    style={{ fontSize: "1.25rem", letterSpacing: "-0.01em" }}
                  >
                    {service.price}
                  </span>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        {/* Seção especial: Consultoria & Mentoria (acompanhamento, não entregável) */}
        <div
          className="mt-6 rounded-[20px] p-10 max-md:p-7"
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
                className="text-sm text-[var(--color-text-muted)] max-w-[360px] max-md:max-w-none"
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
                  className="group relative overflow-hidden rounded-[16px] p-7 h-full flex flex-col"
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500" />

                  <h4 className="text-[var(--color-text)] text-lg font-medium mb-3">
                    {item.title}
                  </h4>
                  <p
                    className="text-sm text-[var(--color-text-muted)] mb-8"
                    style={{ lineHeight: 1.7 }}
                  >
                    {item.description}
                  </p>

                  <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span
                      className="font-semibold text-[var(--color-text)]"
                      style={{ fontSize: "1.25rem", letterSpacing: "-0.01em" }}
                    >
                      {item.price}
                    </span>
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
