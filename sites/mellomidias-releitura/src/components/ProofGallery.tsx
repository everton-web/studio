"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { proofs, results } from "@/data/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const full = (id: string) => `/brand/resultados/${id}.webp`;
const thumb = (id: string) => `/brand/resultados/${id}-480.webp`;

export function ProofGallery() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const dragged = useRef(false);
  const [active, setActive] = useState<number | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  // Entrada dos prints em cascata, só transform e opacity.
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".proof-item", {
        y: 40, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: ".proof-track", start: "top 85%", once: true },
      });
    });
    return () => media.revert();
  }, { scope: root });

  // Estado das setas conforme a posição da faixa.
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const sync = () => {
      const max = element.scrollWidth - element.clientWidth;
      setEdges({ start: element.scrollLeft <= 4, end: element.scrollLeft >= max - 4 });
    };
    sync();
    element.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => { element.removeEventListener("scroll", sync); window.removeEventListener("resize", sync); };
  }, []);

  // Desktop: arrastar com o mouse, com inércia ao soltar. Toque e trackpad usam a rolagem nativa com snap.
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let down = false;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let frame = 0;
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const release = () => {
      element.dataset.dragging = "false";
      if (reduced.matches || Math.abs(velocity) < 0.05) { element.dataset.snap = "true"; return; }
      let v = velocity * 12;
      const glide = () => {
        element.scrollLeft -= v;
        v *= 0.92;
        if (Math.abs(v) > 0.5) frame = requestAnimationFrame(glide);
        else { frame = 0; element.dataset.snap = "true"; }
      };
      frame = requestAnimationFrame(glide);
    };
    const pointerdown = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType !== "mouse" || event.button !== 0) return;
      stop();
      down = true;
      dragged.current = false;
      startX = lastX = event.clientX;
      lastTime = event.timeStamp;
      startScroll = element.scrollLeft;
      velocity = 0;
    };
    const pointermove = (event: PointerEvent) => {
      if (!down) return;
      const distance = event.clientX - startX;
      if (!dragged.current && Math.abs(distance) < 6) return;
      if (!dragged.current) {
        dragged.current = true;
        element.dataset.dragging = "true";
        element.dataset.snap = "false";
        element.setPointerCapture(event.pointerId);
      }
      const elapsed = Math.max(1, event.timeStamp - lastTime);
      velocity = (event.clientX - lastX) / elapsed;
      lastX = event.clientX;
      lastTime = event.timeStamp;
      element.scrollLeft = startScroll - distance;
    };
    const pointerup = (event: PointerEvent) => {
      if (!down) return;
      down = false;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      if (dragged.current) release();
    };
    // Um arraste não deve abrir o print que estava sob o cursor.
    const click = (event: MouseEvent) => {
      if (dragged.current) { event.preventDefault(); event.stopPropagation(); dragged.current = false; }
    };
    element.addEventListener("pointerdown", pointerdown);
    element.addEventListener("pointermove", pointermove);
    element.addEventListener("pointerup", pointerup);
    element.addEventListener("pointercancel", pointerup);
    element.addEventListener("click", click, true);
    element.addEventListener("wheel", stop, { passive: true });
    return () => {
      stop();
      element.removeEventListener("pointerdown", pointerdown);
      element.removeEventListener("pointermove", pointermove);
      element.removeEventListener("pointerup", pointerup);
      element.removeEventListener("pointercancel", pointerup);
      element.removeEventListener("click", click, true);
      element.removeEventListener("wheel", stop);
    };
  }, []);

  const step = (direction: 1 | -1) => {
    const element = track.current;
    const item = element?.querySelector<HTMLElement>(".proof-item");
    if (!element || !item) return;
    const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollBy({ left: direction * (item.offsetWidth + gap), behavior: reduced ? "auto" : "smooth" });
  };

  const open = (index: number, trigger: HTMLButtonElement) => {
    opener.current = trigger;
    setActive(index);
  };

  const close = useCallback(() => dialog.current?.close(), []);

  const go = useCallback((direction: 1 | -1) => {
    setActive((current) => current === null ? current : (current + direction + proofs.length) % proofs.length);
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element || active === null || element.open) return;
    // showModal deixa o resto da página inerte: o foco fica preso no lightbox e Esc fecha.
    element.showModal();
    element.querySelector<HTMLButtonElement>(".lightbox-close")?.focus();
  }, [active]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const closed = () => {
      setActive(null);
      document.documentElement.classList.remove("lightbox-open");
      opener.current?.focus();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
    };
    const backdrop = (event: MouseEvent) => { if (event.target === element) close(); };
    element.addEventListener("close", closed);
    element.addEventListener("keydown", keydown);
    element.addEventListener("click", backdrop);
    return () => {
      element.removeEventListener("close", closed);
      element.removeEventListener("keydown", keydown);
      element.removeEventListener("click", backdrop);
    };
  }, [close, go]);

  useEffect(() => {
    if (active !== null) document.documentElement.classList.add("lightbox-open");
  }, [active]);

  // Tilt leve no hover, só em mouse e sem redução de movimento.
  const tilt = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse" || track.current?.dataset.dragging === "true") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--tilt-x", `${(-y * 6).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${(x * 8).toFixed(2)}deg`);
  };
  const untilt = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  };

  const current = active === null ? null : proofs[active];

  return (
    <div ref={root} className="proof-gallery" role="group" aria-labelledby="provas-title">
      <div className="container proof-heading">
        <div className="proof-heading-copy">
          <p className="eyebrow">{results.galleryEyebrow}</p>
          <h3 id="provas-title">{results.galleryTitle}</h3>
          <p className="proof-hint">{results.galleryHint}</p>
        </div>
        <div className="proof-nav">
          <button type="button" className="proof-arrow" aria-label="Print anterior" aria-controls="provas-faixa" disabled={edges.start} onClick={() => step(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M19 12H5m6 6-6-6 6-6" /></svg>
          </button>
          <button type="button" className="proof-arrow" aria-label="Próximo print" aria-controls="provas-faixa" disabled={edges.end} onClick={() => step(1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
          </button>
        </div>
      </div>

      <ul ref={track} id="provas-faixa" className="proof-track" data-snap="true" data-lenis-prevent-touch>
        {proofs.map((proof, index) => (
          <li key={proof.id} className="proof-item">
            <button type="button" className="proof-card" onClick={(event) => open(index, event.currentTarget)} onPointerMove={tilt} onPointerLeave={untilt} aria-label={`Ampliar print: ${proof.highlight}. ${proof.detail}`}>
              <span className="proof-frame" data-landscape={proof.width > proof.height}>
                <img src={thumb(proof.id)} srcSet={`${thumb(proof.id)} 480w, ${full(proof.id)} 900w`} sizes="(min-width: 1024px) 340px, 78vw" width={proof.width} height={proof.height} alt="" loading="lazy" decoding="async" draggable={false} />
                <span className="proof-zoom" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                </span>
              </span>
              <span className="proof-caption" aria-hidden="true">
                <strong>{proof.highlight}</strong>
                <span>{proof.detail}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dialog} className="lightbox" aria-labelledby="lightbox-title" data-lenis-prevent>
        {current && active !== null && (
          <div className="lightbox-inner">
            <div className="lightbox-top">
              <p className="lightbox-count" aria-live="polite">{active + 1} de {proofs.length}</p>
              <button type="button" className="lightbox-close" onClick={close}>
                Fechar
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
              </button>
            </div>
            <figure className="lightbox-figure">
              <img key={current.id} src={full(current.id)} width={current.width} height={current.height} alt={`Print real de resultado de cliente: ${current.highlight}. ${current.detail}.`} />
              <figcaption>
                <strong id="lightbox-title">{current.highlight}</strong>
                <span>{current.detail}</span>
              </figcaption>
            </figure>
            <div className="lightbox-nav">
              <button type="button" className="proof-arrow" aria-label="Print anterior" onClick={() => go(-1)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M19 12H5m6 6-6-6 6-6" /></svg>
              </button>
              <button type="button" className="proof-arrow" aria-label="Próximo print" onClick={() => go(1)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
