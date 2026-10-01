"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cases, chat, results, site, stats } from "@/data/content";
import { ProofGallery } from "@/components/ProofGallery";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function ResultsSection() {
  const section = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = section.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const messages = gsap.utils.toArray<HTMLElement>(".results-message", root);
      const typing = root.querySelector<HTMLElement>(".results-typing");
      // O chat tem altura fixa e cresce de baixo para cima, como no app: nada empurra a página.
      gsap.set(messages, { display: "none", opacity: 0, y: 18, scale: 0.96 });
      // Conversa em sequência: digitando, mensagem; digitando, mensagem.
      // A conversa começa quando o celular chega ao centro da tela.
      const conversation = gsap.timeline({
        scrollTrigger: { trigger: ".results-phone", start: "center 58%", once: true },
      });
      messages.forEach((message, index) => {
        const incoming = message.dataset.side === "in";
        if (incoming && typing) {
          conversation.set(typing, { display: "inline-flex" });
          conversation.fromTo(typing, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 });
          conversation.to(typing, { opacity: 0, duration: 0.15, delay: index === 0 ? 0.35 : 0.45 });
          conversation.set(typing, { display: "none" });
        }
        conversation.set(message, { display: "flex" }, incoming ? ">" : ">+0.15");
        conversation.to(message, {
          opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)",
          transformOrigin: incoming ? "left bottom" : "right bottom",
        }, "<");
      });

      // Tilt 3D amarrado ao scroll: o celular chega inclinado, assenta de frente no centro e sai girando ao contrário.
      gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: ".results-proof", start: "top bottom", end: "bottom top", scrub: 0.6 },
      })
        .fromTo(".results-phone", { rotateX: 22, rotateY: -18, rotateZ: -3, y: 60 }, { rotateX: 0, rotateY: 0, rotateZ: 0, y: 0, duration: 1 })
        .to(".results-phone", { rotateX: -10, rotateY: 12, rotateZ: 2, y: -30, duration: 1 }, ">0.35");

      gsap.from(".results-case", {
        y: 24, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: ".results-cases", start: "top 85%", once: true },
      });

      const counters = root.querySelectorAll<HTMLElement>("[data-result-counter]");
      counters.forEach((counter, index) => {
        const stat = stats[index];
        const count = { value: 0 };
        gsap.to(count, {
          value: stat.value, duration: 1.6, ease: "power2.out",
          scrollTrigger: { trigger: counter, start: "top 90%", once: true },
          onStart: () => { counter.textContent = `${stat.prefix}0${stat.suffix}`; },
          onUpdate: () => { counter.textContent = `${stat.prefix}${Math.round(count.value)}${stat.suffix}`; },
          onComplete: () => { counter.textContent = stat.display; },
        });
      });
      return () => counters.forEach((counter, index) => { counter.textContent = stats[index].display; });
    });
    return () => media.revert();
  }, { scope: section });

  return (
    <section ref={section} id="resultados" className="section results-section" aria-labelledby="resultados-title">
      <div className="results-glow" aria-hidden="true" />
      <div className="container results-layout">
        <div className="results-heading section-stack">
          <p className="eyebrow">{results.eyebrow}</p>
          <h2 id="resultados-title">Números reais. <span className="text-accent">Clínicas reais.</span></h2>
          <p className="lead">{results.description}</p>
        </div>

        <figure className="results-proof">
          <div className="results-phone">
            <div className="results-phone-island" aria-hidden="true" />
            <div className="results-chat-header">
              <span className="results-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM21 19v-1a4 4 0 0 0-3-3.87M15 4.13a3 3 0 0 1 0 5.74" /></svg>
              </span>
              <div>
                <strong>{results.chatTitle}</strong>
                <span>{results.chatSubtitle}</span>
              </div>
            </div>
            <div className="results-chat">
              <p className="results-chat-day">Hoje</p>
              {chat.map((message) => (
                <div key={message.id} className={`results-message results-message-${message.side}`} data-side={message.side}>
                  <p>
                    {message.text}
                    {"value" in message && <strong>{message.value}</strong>}
                  </p>
                  <span className="results-message-meta">
                    {message.time}
                    {message.side === "out" && (
                      <svg width="16" height="11" viewBox="0 0 20 14" fill="none" aria-label="lida"><path d="m1 7 4 4L14 2M10 10l1 1 8-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </span>
                </div>
              ))}
              <span className="results-typing" aria-hidden="true"><i /><i /><i /></span>
            </div>
            <div className="results-phone-bar" aria-hidden="true">
              <span>Mensagem</span>
              <span className="results-phone-send">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 20.5v-6l8-2.5-8-2.5v-6L22 12Z" /></svg>
              </span>
            </div>
          </div>
          <figcaption>{results.caption}</figcaption>
        </figure>

        <div className="results-evidence">
          <dl className="results-stats">
            {stats.map((stat) => (
              <div className="results-stat" key={stat.id}>
                <dt>{stat.label}</dt>
                <dd>
                  <span className="sr-only">{stat.display}</span>
                  <span className="results-stat-reserve" aria-hidden="true">{stat.display}</span>
                  <span className="results-stat-counter" data-result-counter aria-hidden="true">{stat.display}</span>
                </dd>
              </div>
            ))}
          </dl>
          <ul className="results-cases">
            {cases.map((item) => (
              <li key={item.id} className="results-case">
                <span className="results-case-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 5 5L20 7" /></svg>
                </span>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
          <a className="button button-ghost results-cta" href={site.ctaHref}>
            {site.cta}
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </div>
      </div>
      <ProofGallery />
    </section>
  );
}
