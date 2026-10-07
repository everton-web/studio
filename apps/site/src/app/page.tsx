import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import { Portfolio } from "@/components/Portfolio";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { CustomCursor } from "@/components/CustomCursor";
import { DotGrid } from "@/components/DotGrid";
import { ManifestoVideo } from "@/components/ManifestoVideo";
import { ServicesMarquee } from "@/components/ServicesMarquee";
import { SmoothScroll } from "@/components/SmoothScroll";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { LanguageProvider } from "@/context/LanguageContext";

export default function Home() {
  return (
    <LanguageProvider>
      <SmoothScroll />
      <DotGrid />
      <CustomCursor />
      <Header />
      <main>
        <Hero />
        <ServicesMarquee />
        <Services />
        <Portfolio />
        <ManifestoVideo />
        <About />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </LanguageProvider>
  );
}
