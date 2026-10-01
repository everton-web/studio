import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/SiteShell";
import { site } from "@/data/content";
import "./globals.css";

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  robots: { index: false, follow: false },
  openGraph: { title: site.title, description: site.description, locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#0a0507" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/inter-tight-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body><SiteShell>{children}</SiteShell></body>
    </html>
  );
}
