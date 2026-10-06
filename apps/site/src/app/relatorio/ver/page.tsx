import type { Metadata } from "next";
import { RelatorioRemoto } from "@/components/relatorio/RelatorioRemoto";

// Casca para relatórios publicados na plataforma depois do último export.
// O .htaccess de /relatorio/ manda para cá todo slug sem pasta própria;
// o slug sai da URL e os dados vêm da API pública da plataforma.
export const metadata: Metadata = {
  title: "Diagnóstico de presença digital",
  robots: { index: false, follow: false },
};

export default function RelatorioVerPage() {
  return <RelatorioRemoto />;
}
