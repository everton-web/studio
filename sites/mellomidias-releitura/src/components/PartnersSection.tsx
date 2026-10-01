"use client";

import { useEffect, useRef, useState } from "react";
import { partners } from "@/data/content";

export function PartnersSection() {
  const section = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const root = section.current;
    if (!root) return;
    root.dataset.motionReady = "true";
    let visible = false;
    const sync = () => { root.dataset.motionInactive = String(!visible || document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(root);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); delete root.dataset.motionReady; };
  }, []);
  return (
    <section ref={section} id="parceiros" className="partners-section" aria-labelledby="parceiros-title" data-motion-paused={paused}>
      <div className="container partners-heading">
        <div className="partners-title"><p className="eyebrow">Parceiros</p><h2 id="parceiros-title">Clínicas que já cresceram com a Mello Mídias</h2></div>
        <button className="motion-toggle motion-toggle-icon" type="button" aria-label={paused ? "Retomar faixa de parceiros" : "Pausar faixa de parceiros"} aria-controls="partners-marquee" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{paused ? <path d="m8 5 11 7-11 7Z" /> : <path d="M8 5v14M16 5v14" />}</svg>
        </button>
      </div>
      <div id="partners-marquee" className="partners-window">
        <div className="partners-track">
          {[0, 1].map((copy) => <ul key={copy} className="partners-list" aria-hidden={copy === 1 ? true : undefined}>
            {partners.map((partner) => <li key={partner.id} className={`partner-logo partner-logo-${partner.id}`}>
              <img src={`/brand/parceiros/${partner.id}.webp`} width={partner.width} height={partner.height} alt={copy === 1 ? "" : partner.name} loading="lazy" decoding="async" draggable={false} />
            </li>)}
          </ul>)}
        </div>
      </div>
    </section>
  );
}
