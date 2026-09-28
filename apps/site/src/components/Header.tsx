"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TriangleIcon } from "./TriangleIcon";
import { LanguageToggle } from "./LanguageToggle";
import { PromoBanner } from "./PromoBanner";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const update = () => {
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.header
      ref={headerRef}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="fixed top-0 left-0 w-full z-[1000]"
    >
      <PromoBanner variant="top" />
      <div
        className="max-w-[1280px] mx-auto px-8 max-md:px-6 flex items-center justify-between transition-[border-color,background] duration-500"
        style={{
          height: "72px",
          background: scrolled ? "rgba(4,4,4,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: scrolled
            ? "1px solid var(--color-border)"
            : "1px solid transparent",
        }}
      >
        <a
          href="#hero"
          className="flex items-center gap-2 font-semibold tracking-tight text-[var(--color-text)]"
        >
          <TriangleIcon className="w-4 h-4" />
          everton.
        </a>

        <LanguageToggle />
      </div>
    </motion.header>
  );
}
