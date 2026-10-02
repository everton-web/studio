import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Manrope, Newsreader } from "next/font/google";
import { SiteShell } from "@/components/Shell";
import { site } from "@/data/content";
import "./globals.css";

const display = Newsreader({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"], variable: "--f-display", display: "swap" });
const texto = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-texto", display: "swap" });

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  robots: { index: false, follow: false },
  openGraph: { title: site.title, description: site.description, locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#F7F2EA" };

// Marca o documento antes da primeira pintura: só com motion liberado os elementos do hero nascem ocultos.
const motionFlag = `try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("motion")}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${texto.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionFlag }} />
      </head>
      <body><SiteShell>{children}</SiteShell></body>
    </html>
  );
}
