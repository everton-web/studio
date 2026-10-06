"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import { projects } from "@/data/projects";
import { AnimatedSection } from "./AnimatedSection";
import { TriangleIcon } from "./TriangleIcon";
import { LineReveal } from "./TextReveal";
import { useLang } from "@/context/LanguageContext";
import { semViuva } from "@/lib/texto";

const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";


function ProjectCard({
  project,
  featured = false,
  ratio = "16 / 10",
}: {
  project: (typeof projects)[0];
  featured?: boolean;
  ratio?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const imgX = useMotionValue(0);
  const imgY = useMotionValue(0);
  const springX = useSpring(imgX, springConfig);
  const springY = useSpring(imgY, springConfig);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rawParallaxY = useTransform(scrollYProgress, [0, 1], [18, -18]);
  const parallaxY = reduced ? 0 : rawParallaxY;

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
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
        className="relative rounded-[14px] overflow-hidden"
        style={{
          aspectRatio: featured ? "21 / 10" : ratio,
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <motion.div
          className="absolute inset-[-10px]"
          style={{ y: parallaxY }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ x: springX, y: springY, scale: hovered ? 1.06 : 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
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
        </motion.div>

        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ backgroundImage: GRAIN, opacity: 0.05, mixBlendMode: "overlay" }}
        />

        <div
          className="absolute inset-0 flex items-end p-8 max-md:p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-400 z-[2]"
          style={{
            background: "linear-gradient(to top, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.5) 40%, transparent 100%)",
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

function SeeAllCard() {
  const { t } = useLang();
  return (
    <a
      href="https://www.behance.net/evertonbritoweb"
      target="_blank"
      rel="noopener noreferrer"
      data-cursor={t.cursor.open}
      className="group flex items-center justify-between gap-4 rounded-[14px] px-8 py-6 max-md:px-6 transition-colors duration-300 hover:border-[var(--color-border-active)]"
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <span
        className="link-sub text-[var(--color-text)]"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2.4rem)", fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.1 }}
      >
        {t.portfolio.seeAll}
      </span>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--color-accent)] shrink-0 group-hover:translate-x-1 transition-transform duration-500"
        aria-hidden
      >
        <path d="m7 17 9.2-9.2M17 17V8H8" />
      </svg>
    </a>
  );
}

// Cases em showreel horizontal: a seção fica alta e o trilho fica preso (sticky)
// enquanto a rolagem vertical vira deslocamento lateral. No celular e com movimento
// reduzido vira um carrossel nativo com scroll-snap.
function Showreel({ items }: { items: typeof projects }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [ativo, setAtivo] = useState(false);
  const [dist, setDist] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const medir = () => {
      const on = mq.matches && !reduced;
      setAtivo(on);
      setDist(on && track.current ? Math.max(0, track.current.scrollWidth - window.innerWidth) : 0);
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (track.current) ro.observe(track.current);
    mq.addEventListener("change", medir);
    window.addEventListener("resize", medir);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", medir);
      window.removeEventListener("resize", medir);
    };
  }, [reduced]);

  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist]);

  return (
    <div ref={wrap} style={{ height: ativo ? `calc(100vh + ${dist}px)` : "auto" }}>
      <div className={ativo ? "sticky top-0 h-screen flex flex-col justify-center overflow-hidden" : ""}>
        <motion.div
          ref={track}
          style={{ x: ativo ? x : 0 }}
          className={
            ativo
              ? "flex w-max items-center gap-6 px-[var(--gutter)]"
              : "flex gap-4 overflow-x-auto snap-x snap-mandatory px-[var(--gutter)] pb-4 [scrollbar-width:none]"
          }
        >
          {items.map((p) => (
            <div key={p.slug} className={ativo ? "w-[min(52vw,760px)] shrink-0" : "w-[86vw] max-w-[560px] shrink-0 snap-start"}>
              <ProjectCard project={p} ratio="16 / 10" />
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <span className="text-[var(--color-text)] font-medium" style={{ fontSize: "1.05rem", letterSpacing: "-0.01em" }}>{semViuva(p.title)}</span>
                <span className="text-[0.7rem] uppercase tracking-[0.12em] text-[var(--color-text-dim)]">{semViuva(p.category)}</span>
              </div>
            </div>
          ))}
          <div className={ativo ? "w-[min(40vw,520px)] shrink-0" : "w-[86vw] max-w-[560px] shrink-0 snap-start"}>
            <SeeAllCard />
          </div>
        </motion.div>
        {ativo && (
          <div className="container-site mt-10">
            <div className="h-px w-full bg-[var(--color-border)] overflow-hidden">
              <motion.div className="h-full origin-left bg-[var(--color-accent)]" style={{ scaleX: scrollYProgress }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Portfolio() {
  const { t } = useLang();

  return (
    <section
      id="portfolio"
      style={{ background: "var(--color-bg)", padding: "var(--section-pad) 0" }}
    >
      <div className="relative z-[2] container-site">
        <AnimatedSection>
          <div className="flex items-center gap-6 mb-16 max-md:mb-10">
            <span className="section-number">02</span>
            <div className="divider-accent" />
            <span className="section-label">
              <TriangleIcon className="w-3 h-3" />
              {t.portfolio.label}
            </span>
          </div>

          <div className="flex items-end justify-between gap-8 mb-16 max-md:flex-col max-md:items-start max-md:gap-4">
            <LineReveal
              lines={[
                t.portfolio.titleBefore,
                <span key="accent" className="serif">{t.portfolio.titleAccent}</span>,
              ]}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(2.4rem, 6vw, 5.25rem)",
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: "-0.075em",
              }}
            />
            <a
              href="#contact"
              className="btn-roll inline-flex items-center gap-2 px-7 py-3 text-sm font-medium text-[var(--color-text)] border border-[var(--color-border)] rounded-full hover:border-[var(--color-text)] transition-all hover:-translate-y-0.5 group"
            >
              <span className="btn-roll__txt"><span data-t={t.portfolio.cta}>{t.portfolio.cta}</span></span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-roll__seta" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>
        </AnimatedSection>

      </div>

      <Showreel items={projects} />
    </section>
  );
}
