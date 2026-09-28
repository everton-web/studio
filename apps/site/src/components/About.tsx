"use client";

import { AnimatedSection } from "./AnimatedSection";
import { TriangleIcon } from "./TriangleIcon";
import { useLang } from "@/context/LanguageContext";
import { semViuva } from "@/lib/texto";

export function About() {
  const { t } = useLang();

  return (
    <section
      id="about"
      style={{ background: "var(--color-bg)", padding: "clamp(6rem, 12vh, 10rem) 0" }}
    >
      <div className="max-w-[1280px] mx-auto px-8 max-md:px-6">
        <div className="flex items-start justify-between gap-20 max-lg:flex-col max-lg:gap-12">
          <div className="flex-1 max-w-[720px]">
            <AnimatedSection>
              <div className="flex items-center gap-6 mb-16 max-md:mb-10">
                <span className="section-number">01</span>
                <div className="divider-accent" />
                <span className="section-label">
                  <TriangleIcon className="w-3 h-3" />
                  {t.about.label}
                </span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "clamp(1.6rem, 3.2vw, 2.5rem)",
                  fontWeight: 400,
                  lineHeight: 1.35,
                  letterSpacing: "-0.01em",
                  color: "var(--color-text-secondary)",
                  textWrap: "balance",
                }}
              >
                {t.about.statementBefore}{" "}
                <strong className="font-semibold text-[var(--color-text)]">
                  {t.about.statementStrong}
                </strong>{" "}
                {t.about.statementMiddle}{" "}
                <span className="serif">{t.about.statementAccent}</span>
                {semViuva(t.about.statementAfter)}
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="mt-12 flex items-start gap-6 max-md:flex-col max-md:gap-4">
                <div className="flex-1">
                  <p
                    className="text-[var(--color-text-muted)]"
                    style={{ fontSize: "0.9rem", lineHeight: 1.75, textWrap: "balance" }}
                  >
                    {t.about.body}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>

          <AnimatedSection delay={0.3} direction="right" className="max-lg:w-full">
            <div
              className="rounded-[20px] p-8 max-lg:p-6"
              style={{
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
                minWidth: "280px",
              }}
            >
              <div className="flex items-baseline gap-2 mb-6">
                <span
                  className="font-semibold text-[var(--color-text)]"
                  style={{ fontSize: "3rem", letterSpacing: "-0.04em", lineHeight: 1 }}
                >
                  7<span className="text-[var(--color-accent)]">+</span>
                </span>
                <span className="text-sm text-[var(--color-text-muted)] whitespace-pre-line">
                  {t.about.yearsLabel}
                </span>
              </div>

              <div className="divider mb-6" />

              <div className="space-y-4">
                {t.about.skills.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <TriangleIcon className="w-2.5 h-2.5 text-[var(--color-accent)] shrink-0" />
                    <span className="text-sm text-[var(--color-text-secondary)]">{item}</span>
                  </div>
                ))}
              </div>

              <div className="divider my-6" />

              <p
                className="text-[0.75rem] text-[var(--color-text-dim)] whitespace-pre-line"
                style={{ lineHeight: 1.6 }}
              >
                {t.about.footnote}
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
