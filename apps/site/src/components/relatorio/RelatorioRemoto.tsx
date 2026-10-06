"use client";

import { useEffect, useState } from "react";
import type { RelatorioPublico } from "@/lib/relatorio";
import { RelatorioView } from "@/components/relatorio/RelatorioView";

const API = "https://app.evertonbrito.com/api/relatorio/publico/";

type Estado =
  | { fase: "carregando" }
  | { fase: "erro"; mensagem: string }
  | { fase: "ok"; rel: RelatorioPublico; temDetalhado: boolean };

function slugDaUrl(): string | null {
  const m = window.location.pathname.match(/^\/relatorio\/([a-z0-9-]+)\/?$/);
  return m && m[1] !== "ver" ? m[1] : null;
}

export function RelatorioRemoto() {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });

  useEffect(() => {
    const slug = slugDaUrl();
    if (!slug) {
      setEstado({ fase: "erro", mensagem: "Relatório não encontrado." });
      return;
    }
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(API + slug, { signal: ctrl.signal, headers: { Accept: "application/json" } });
        if (res.status === 404) {
          setEstado({ fase: "erro", mensagem: "Relatório não encontrado." });
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const rel = (await res.json()) as RelatorioPublico;
        const det = await fetch(`/relatorio/${slug}/detalhado/`, { method: "HEAD", signal: ctrl.signal }).catch(() => null);
        document.title = `${rel.empresa} · Diagnóstico de presença digital`;
        setEstado({ fase: "ok", rel, temDetalhado: Boolean(det?.ok) });
      } catch {
        if (!ctrl.signal.aborted) {
          setEstado({ fase: "erro", mensagem: "Não foi possível carregar o relatório agora. Tente de novo em alguns minutos." });
        }
      }
    })();
    return () => ctrl.abort();
  }, []);

  if (estado.fase === "ok") return <RelatorioView data={estado.rel} temDetalhado={estado.temDetalhado} />;

  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: "24px", textAlign: "center" }}>
      <p aria-live="polite" style={{ opacity: 0.75 }}>
        {estado.fase === "carregando" ? "Carregando o diagnóstico…" : estado.mensagem}
      </p>
    </main>
  );
}
