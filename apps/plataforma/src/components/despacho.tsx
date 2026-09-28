"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, RefreshCw } from "lucide-react";

type Tarefa = {
  id: string; engine: string; model: string | null; prompt: string;
  status: "pendente" | "ok" | "erro"; criado: string; exit?: number; saida?: string; bytes?: number;
};
type Health = Record<string, boolean>;

const ENGINES: { id: string; label: string; uso: string }[] = [
  { id: "leitura", label: "leitura · Kimi", uso: "contexto gigante: listar, ler, resumir" },
  { id: "bulk", label: "bulk · DeepSeek", uso: "mecânico e barato: alto volume" },
  { id: "bulk-pro", label: "bulk-pro · DeepSeek", uso: "mecânico que exige mais cabeça" },
  { id: "raciocinio", label: "raciocínio · GLM", uso: "segunda opinião barata" },
  { id: "claude", label: "claude · Claude Code", uso: "decide, valida, produz (20%)" },
  { id: "shell", label: "shell · script local", uso: "automações da operação" },
];
// engine sugerida por agente (rota do 20 Playbooks/Roteamento de Modelos)
const SUGESTAO: Record<string, string> = {
  comando: "claude", caio: "leitura", davi: "claude", theo: "claude", mia: "bulk",
};
const labelAgent = (nome: string) => SUGESTAO[nome.toLowerCase().replace(/\s+/g, "")] || "leitura";

const Frase = ({ a }: { a: { nome: string; departamento: string } }) => {
  const n = a.nome.toLowerCase();
  if (n.includes("caio")) return "Qualifique 5 leads novos do pipeline (estágio 0) com motivo objetivo.";
  if (n.includes("davi")) return "Faça o pré-projeto (briefing, arquitetura, copy) da ficha do cliente X.";
  if (n.includes("theo")) return "Audite tecnicamente o site Y: segurança, SEO local, performance, com prova.";
  if (n.includes("mia")) return "Transforme o projeto Z em case para o portfólio / post."
  return "Analise a operação e aponte as 3 prioridades da semana.";
};

export function Despacho({ agentes }: { agentes: { nome: string; departamento: string }[] }) {
  const [motores, setMotores] = useState<Health>({});
  const [fila, setFila] = useState<Tarefa[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [painelOk, setPainelOk] = useState(false);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [engines, setEngines] = useState<Record<string, string>>({});

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/orquestra");
      if (!r.ok) return;
      const j = await r.json();
      setMotores(j.motores || {});
      setFila(j.fila || []);
      setPainelOk(true);
    } catch { setPainelOk(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function despachar(a: { nome: string }) {
    const key = a.nome;
    const prompt = (prompts[key] || "").trim() || Frase({ a: { nome: a.nome, departamento: "" } });
    const engine = engines[key] || labelAgent(a.nome);
    setBusy(key); setErro("");
    try {
      const r = await fetch("/api/orquestra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "nova", engine, prompt }),
      });
      const j = await r.json();
      if (!j.ok) { setErro(j.error || "erro"); }
      if (j.tarefa?.id) setPrompts((p) => ({ ...p, [key]: "" }));
      await carregar();
    } catch { setErro("falha de rede"); }
    finally { setBusy(null); }
  }

  async function health() {
    setErro("");
    try {
      const r = await fetch("/api/orquestra", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "health" }) });
      const j = await r.json();
      setMotores(j.motores || {});
    } catch { setErro("health-check falhou"); }
  }

  async function limpar() {
    setErro("");
    try {
      await fetch("/api/orquestra", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "limpar" }) });
      await carregar();
    } catch { setErro("limpeza falhou"); }
  }

  return (
    <div className="space-y-6">
      {/* painel de despacho */}
      <div className="rounded-2xl border border-[#a86ff0]/20 bg-[var(--bg-2)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="mono" style={{ fontSize: "0.68rem" }}>orquestração · fila do IA Router</span>
              <span className={`w-2 h-2 rounded-full ${painelOk ? "bg-[#3ddc84]" : "bg-[#fb7185]"}`} />
            </div>
            <p className="text-[.78rem] text-[#8a8a85] mt-1">
              despacha do app pra <span className="text-[#b8b8b3]">_scripts/ia.mjs</span> (kimi/deepseek/claude/shell): resultado fica na fila.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={health} className="flex items-center gap-2 h-[38px] px-4 rounded-[10px] border border-white/10 text-[#b8b8b3] hover:text-white hover:border-white/25 text-[.78rem] transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> motores
            </button>
            <button onClick={limpar} className="flex items-center gap-2 h-[38px] px-4 rounded-[10px] border border-white/10 text-[#b8b8b3] hover:text-white hover:border-white/25 text-[.78rem] transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> limpar fila
            </button>
          </div>
        </div>

        {/* status dos motores */}
        <div className="flex flex-wrap gap-2 mb-5">
          {ENGINES.map((e) => {
            const ok = motores[e.id];
            return (
              <span key={e.id} className={`mono px-2.5 py-1.5 rounded-lg border ${ok === undefined ? "border-[var(--line)] text-[#8a8a85]" : ok ? "border-[#3ddc84]/25 text-[#3ddc84] bg-[#3ddc84]/6" : "border-[#fb7185]/30 text-[#fb7185] bg-[#fb7185]/6"}`} style={{ fontSize: "0.7rem" }} title={e.uso}>
                {ok === undefined ? "?" : ok ? "✓" : "✗"} {e.id}
              </span>
            );
          })}
        </div>

        {/* cards de despacho por agente */}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {agentes.map((a) => {
            const key = a.nome;
            const eng = engines[key] || labelAgent(a.nome);
            const rodando = busy === key;
            return (
              <div key={key} className="bg-[var(--bg-1)] border border-[var(--line)] rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-7 h-7 rounded-lg grid place-items-center text-[.75rem] font-semibold text-[var(--accent-ink)]" style={{ background: "#a86ff0" }}>
                    {a.nome.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[.82rem] font-medium tracking-[-.01em] leading-none truncate">{a.nome}</div>
                    <div className="mono mt-1" style={{ fontSize: "0.68rem" }}>{a.departamento}</div>
                  </div>
                </div>
                <select
                  value={eng}
                  onChange={(e) => setEngines((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full h-[38px] mb-2 px-3 rounded-[10px] bg-[#141416] border border-[var(--line)] text-[.76rem] text-[#e8e8e6] outline-none focus:border-[#a86ff0]/60"
                >
                  {ENGINES.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
                <input
                  value={prompts[key] || ""}
                  onChange={(e) => setPrompts((p) => ({ ...p, [key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); despachar(a); } }}
                  placeholder={Frase({ a }).slice(0, 44) + "…"}
                  aria-label={`prompt para ${a.nome}`}
                  className="w-full h-[42px] mb-2 bg-white/3 border border-[var(--line)] rounded-[10px] px-3 text-[.76rem] text-[#f7f7f5] outline-none focus:border-[#a86ff0]/70 placeholder:text-[#5d5d58]"
                />
                <div className="mono mb-2.5 text-[#5d5d58]" style={{ fontSize: "0.68rem" }} title={ENGINES.find((e) => e.id === eng)?.uso}>
                  {ENGINES.find((e) => e.id === eng)?.uso}
                </div>
                <button
                  onClick={() => despachar(a)}
                  disabled={rodando}
                  className="w-full flex items-center justify-center gap-2 h-[40px] rounded-[10px] bg-[#a86ff0]/14 border border-[#a86ff0]/35 text-[#a86ff0] hover:bg-[#a86ff0]/24 text-[.8rem] font-medium transition-colors disabled:opacity-50"
                >
                  {rodando ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[#a86ff0]/30 border-t-[#a86ff0] animate-spin" />
                      rodando…
                    </>
                  ) : (
                    <><Send className="w-3.5 h-3.5" /> despachar</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        {erro && <p className="mt-3 text-[.78rem] text-[#fb7185]">{erro}</p>}
      </div>

      {/* fila / resultados */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="mono" style={{ fontSize: "0.68rem" }}>fila da operação</div>
          <span className="mono" style={{ fontSize: "0.7rem" }}>{fila.length} tarefas</span>
        </div>
        {fila.length === 0 && <div className="text-[.76rem] italic text-[#5d5d58]">vazia: despache um agente acima</div>}
        <div className="space-y-0">
          <AnimatePresence initial={false}>
            {[...fila].reverse().map((t) => (
              <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-b border-[var(--line)] last:border-0 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${t.status === "ok" ? "bg-[#3ddc84]" : t.status === "erro" ? "bg-[#fb7185]" : "bg-[#d9a03a]"}`} />
                  <span className="mono shrink-0" style={{ fontSize: "0.7rem", color: "#9a9a95" }}>{t.engine}</span>
                  <span className="text-[.84rem] truncate flex-1">{t.prompt}</span>
                  <span className={`mono shrink-0 ${t.status === "ok" ? "text-[#3ddc84]" : t.status === "erro" ? "text-[#fb7185]" : "text-[#d9a03a]"}`} style={{ fontSize: "0.7rem" }}>
                    {t.status === "ok" ? `ok · ${t.bytes ? (t.bytes / 1024).toFixed(1) + "KB" : ""}` : t.status}
                  </span>
                </div>
                {t.saida && t.saida.trim() && (
                  <pre className="mt-2 ml-5 text-[.72rem] text-[#9a9a95] whitespace-pre-wrap break-words bg-white/3 rounded-lg p-3 max-h-[160px] overflow-y-auto">{t.saida.trim().slice(0, 1200)}</pre>
                )}
                {t.status === "erro" && t.exit !== undefined && (
                  <div className="ml-5 mt-1 mono text-[#fb7185]/80" style={{ fontSize: "0.68rem" }}>exit {t.exit}</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <p className="mono mt-3" style={{ fontSize: "0.68rem" }}>resultado bruto em <span className="text-[#f7f7f5]">_scripts/orquestra/resultados/&lt;id&gt;.txt</span> · regras em 20 Playbooks/Orquestração de Agentes.md</p>
      </div>
    </div>
  );
}