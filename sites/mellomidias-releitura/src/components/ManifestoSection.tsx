"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { manifesto } from "@/data/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function ManifestoSection() {
  const section = useRef<HTMLElement>(null);
  useGSAP(() => {
    const root = section.current;
    if (!root) return;
    const words = root.querySelectorAll(".manifesto-word-light");
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(words, { opacity: 0 }, {
        opacity: 1, duration: 1, stagger: 0.7, ease: "none",
        scrollTrigger: { trigger: root, start: "top 80%", end: "bottom 70%", scrub: true, invalidateOnRefresh: true },
      });
    });
    return () => media.revert();
  }, { scope: section });
  return (
    <section ref={section} id="manifesto" className="section manifesto-section" aria-labelledby="manifesto-title">
      <div className="container">
        <h2 id="manifesto-title" className="manifesto-title">
          <span className="sr-only">{manifesto}</span>
          <span aria-hidden="true">{manifesto.split(" ").map((word, index) => <span key={`${word}-${index}`}><span className={`manifesto-word${word === "achismo." ? " manifesto-word-accent" : ""}`}><span>{word}</span><span className="manifesto-word-light">{word}</span></span>{" "}</span>)}</span>
        </h2>
      </div>
    </section>
  );
}
