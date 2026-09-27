"use client";

import { TriangleIcon } from "./TriangleIcon";
import { useLang } from "@/context/LanguageContext";

const socialLinks = [
  {
    label: "Behance",
    href: "https://www.behance.net/evertonbrito1",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.5 11c1.38 0 2.5-1.12 2.5-2.5S8.88 6 7.5 6H3v5h4.5zM3 18h5c1.38 0 2.5-1.12 2.5-2.5S9.38 13 8 13H3v5zm12-8.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5h-5zM21 12.5c0 2.76-2.24 5-5 5s-5-2.24-5-5h10zM15 3h5v1.5h-5V3z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/everton.brito.design",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/evertonbrito",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
      </svg>
    ),
  },
];

export function Footer() {
  const { t } = useLang();

  return (
    <footer style={{ background: "var(--color-bg)" }}>
      <div className="divider" />

      <div
        className="max-w-[1280px] mx-auto px-8 max-md:px-6"
        style={{ padding: "clamp(3rem, 6vh, 5rem) 2rem clamp(2rem, 4vh, 3rem)" }}
      >
        <div className="flex items-start justify-between gap-16 max-md:flex-col max-md:gap-10 mb-12 max-md:mb-8">
          <div>
            <a href="#" className="inline-flex items-center gap-2 font-semibold text-[var(--color-text)] mb-4">
              <TriangleIcon className="w-4 h-4" />
              everton.
            </a>
            <p className="text-[0.8rem] text-[var(--color-text-dim)] max-w-[260px]" style={{ lineHeight: 1.6 }}>
              {t.footer.tagline}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] transition-all"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="divider mb-6" />

        <div className="flex items-center justify-between max-md:flex-col max-md:gap-4 max-md:text-center">
          <p className="text-[0.7rem] text-[var(--color-text-dim)]">
            &copy; 2026 Everton Brito. {t.footer.rights}
          </p>
          <a
            href="#hero"
            className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-[var(--color-text-dim)] hover:text-[var(--color-accent)] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 15-6-6-6 6" />
            </svg>
            {t.footer.backToTop}
          </a>
        </div>
      </div>
    </footer>
  );
}
