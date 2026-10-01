import { existsSync } from "node:fs";
import { join } from "node:path";
import { HeroSection } from "@/components/HeroSection";
import { PartnersSection } from "@/components/PartnersSection";
import { ManifestoSection } from "@/components/ManifestoSection";
import { MethodSection } from "@/components/MethodSection";
import { KineticBand } from "@/components/KineticBand";
import { ResultsSection } from "@/components/ResultsSection";
import { AboutSection } from "@/components/AboutSection";
import { LeadFormSection } from "@/components/LeadFormSection";
import { FaqSection } from "@/components/FaqSection";
import { FinalCtaSection } from "@/components/FinalCtaSection";

export function LandingPageSections() {
  // O export estático só referencia mídia que existe de fato: sem 404 de vídeo opcional.
  const available = (filename: string) => existsSync(join(process.cwd(), "public", "media", filename));
  const media = { webm: available("hero-loop.webm"), mp4: available("hero-loop.mp4"), poster: available("hero-poster.jpg") };
  return (
    <>
      <HeroSection media={media} />
      <PartnersSection />
      <ManifestoSection />
      <MethodSection />
      <KineticBand />
      <ResultsSection />
      <AboutSection />
      <LeadFormSection />
      <FaqSection />
      <FinalCtaSection media={media} />
    </>
  );
}
