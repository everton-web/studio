"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export function Console({ active = true }: { active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const sessionRef = useRef<string | null>(null);
  const [live, setLive] = useState(false);

  // cria o terminal xterm uma única vez
  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"Cascadia Mono", "JetBrains Mono", Consolas, monospace',
      theme: {
        background: "#050505", foreground: "#f7f7f5", cursor: "#ff4000", cursorAccent: "#050505",
        selectionBackground: "rgba(255,64,0,0.3)",
        black: "#050505", red: "#ff5c5c", green: "#3ddc84", yellow: "#d9a03a",
        blue: "#5f9fe8", magenta: "#a86ff0", cyan: "#54b8f0", white: "#d8d8d3",
        brightBlack: "#8a8a85", brightRed: "#ff8a66", brightGreen: "#7ee9a6",
        brightYellow: "#e8c06a", brightBlue: "#8ec4f5", brightMagenta: "#c6a2f5",
        brightCyan: "#93d6f5", brightWhite: "#f7f7f5",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(ref.current!);
    try { fit.fit(); } catch { /* ok */ }
    termRef.current = term;
    fitRef.current = fit;
    // teclado → agente vivo
    term.onData((d) => {
      if (sessionRef.current) fetch("/api/console/input", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionRef.current, data: d }),
      });
    });
    const onResize = () => {
      if (!fit || !term || !sessionRef.current) return;
      try {
        fit.fit();
        fetch("/api/console/resize", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: sessionRef.current, cols: term.cols, rows: term.rows }),
        });
      } catch { /* ok */ }
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      term.dispose();
      termRef.current = null;
    };
  }, []);

  // anexa/desanexa conforme a aba fica visível
  useEffect(() => {
    if (!active) { esRef.current?.close(); return; }
    let cancelled = false;

    async function attach() {
      const r = await fetch("/api/console", { method: "POST" });
      if (!r.ok) return;
      const { id } = await r.json();
      if (cancelled) return;
      sessionRef.current = id;
      const term = termRef.current;
      const fit = fitRef.current;
      if (!term) return;
      term.clear();
      if (fit) { try { fit.fit(); } catch { /* ok */ } }
      fetch("/api/console/resize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, cols: term.cols, rows: term.rows }),
      });
      esRef.current?.close();
      const es = new EventSource(`/api/console/stream?id=${id}`);
      esRef.current = es;
      es.onmessage = (ev) => {
        try { term.write(JSON.parse(ev.data)); } catch { /* ok */ }
        setLive(true);
      };
      es.onerror = () => { es.close(); setLive(false); };
    }
    attach();
    return () => { cancelled = true; esRef.current?.close(); setLive(false); };
  }, [active]);

  async function restart() {
    const term = termRef.current;
    esRef.current?.close();
    if (sessionRef.current) {
      await fetch("/api/console", { method: "DELETE", body: JSON.stringify({ id: sessionRef.current }) });
      sessionRef.current = null;
    }
    const r = await fetch("/api/console", { method: "POST" });
    const { id } = await r.json();
    sessionRef.current = id;
    term?.clear();
    esRef.current?.close();
    const es = new EventSource(`/api/console/stream?id=${id}`);
    esRef.current = es;
    es.onmessage = (ev) => { try { term?.write(JSON.parse(ev.data)); } catch { /* ok */ } setLive(true); };
    es.onerror = () => { es.close(); setLive(false); };
    setLive(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${live ? "bg-[#3ddc84] animate-pulse" : "bg-[#71716c]"}`} />
          <span className="mono" style={{ fontSize: "0.7rem" }}>
            {live ? "anexado ao agente vivo da máquina" : "anexando…"}
          </span>
        </span>
        <button
          onClick={restart}
          className="mono px-3.5 py-2 rounded-lg border border-white/10 hover:border-white/25 hover:text-white text-[#8a8a85] transition-colors"
          style={{ fontSize: "0.68rem" }}
        >
          reiniciar agente
        </button>
      </div>
      <div ref={ref} className="h-[70vh] rounded-2xl border border-white/10 overflow-hidden bg-[#050505] p-2" />
      <p className="mono" style={{ fontSize: "0.7rem" }}>
        é o mesmo agente da máquina, sempre vivo — digite aqui e ele executa. trocar de aba não mata a sessão.
      </p>
    </div>
  );
}