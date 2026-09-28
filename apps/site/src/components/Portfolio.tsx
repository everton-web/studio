"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
import { projects } from "@/data/projects";
import { AnimatedSection } from "./AnimatedSection";
import { TriangleIcon } from "./TriangleIcon";
import { useLang } from "@/context/LanguageContext";
import { semViuva } from "@/lib/texto";

const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };

function ProjectCard({
  project,
  featured = false,
}: {
  project: (typeof projects)[0];
  featured?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const imgX = useMotionValue(0);
  const imgY = useMotionValue(0);
  const springX = useSpring(imgX, springConfig);
  const springY = useSpring(imgY, springConfig);

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    imgX.set(cx * -10);
    imgY.set(cy * -10);
  };

  const handleLeave = () => {
    setHovered(false);
    imgX.set(0);
    imgY.set(0);
  };

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <motion.div
        ref={ref}
        onMouseEnter={() => setHovered(true)}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        className="relative rounded-[20px] overflow-hidden"
        style={{
          aspectRatio: featured ? "21 / 10" : "16 / 10",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <motion.div
          className="absolute inset-[-10px]"
          style={{ x: springX, y: springY, scale: hovered ? 1.06 : 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <Image
            src={project.cover}
            alt={project.title}
            fill
            className="object-cover"
            sizes={featured ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
            priority={featured}
          />
        </motion.div>

        <div
          className="absolute inset-0 flex items-end p-8 max-md:p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-400 z-[1]"
          style={{
            background: "linear-gradient(to top, rgba(4,4,4,0.95) 0%, rgba(4,4,4,0.5) 40%, transparent 100%)",
          }}
        >
          <div className="flex items-end justify-between w-full max-md:flex-col max-md:items-start max-md:gap-2">
            <div>
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)] block mb-1">
                {semViuva(project.category)}
              </span>
              <h3
                className="text-[var(--color-text)] font-medium"
                style={{ fontSize: featured ? "1.5rem" : "1.1rem", letterSpacing: "-0.01em" }}
              >
                {semViuva(project.title)}
              </h3>
            </div>
            <span className="text-[0.75rem] text-[var(--color-text-dim)]">
              {project.year}
            </span>
          </div>
        </div>
      </motion.div>
    </a>
  );
}

export function Portfolio() {
  const [featured, ...rest] = projects;
  const { t } = useLang();

  return (
    <section
      id="portfolio"
      style={{ background: "var(--color-bg)", padding: "clamp(6rem, 12vh, 10rem) 0" }}
    >
      <div className="max-w-[1280px] mx-auto px-8 max-md:px-6">
        <AnimatedSection>
          <div className="flex items-center gap-6 mb-16 max-md:mb-10">
            <span className="section-number">03</span>
            <div className="divider-accent" />
            <span className="section-label">
              <TriangleIcon className="w-3 h-3" />
              {t.portfolio.label}
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
              {t.portfolio.titleBefore}{" "}
              <span className="serif">{t.portfolio.titleAccent}</span>
            </h2>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-medium text-[var(--color-text)] border border-[var(--color-border)] rounded-full hover:border-[var(--color-text)] transition-all hover:-translate-y-0.5 group"
            >
              {t.portfolio.cta}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                <path d="m7 17 9.2-9.2M17 17V8H8" />
              </svg>
            </a>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mb-6">
          <ProjectCard project={featured} featured />
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rest.map((project, i) => (
            <AnimatedSection key={project.slug} delay={0.05 * (i + 1)}>
              <ProjectCard project={project} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
