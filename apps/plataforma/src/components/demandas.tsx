"use client";

import { useEffect, useRef, useState } from "react";
import { AgentAvatar } from "./agent-avatar";

type Demanda = {
  id: string; engine: string; prompt: string; status: string;
  criado?: string; atribuido?: string; ia?: string;
};
type Mensagem = { quando: string; de: string; para?: string; texto: string };
type Data = { fila: Demanda[]; sala: Mensagem[]; agentes: Record<string, { ocupado: boolean; demanda?: string }> };

const CORES: Record<string, string> = { caio: "#FF4000", davi: "#a86ff0", theo: "#54b8f0", mia: "#3ddc84", orquestra: "#7aa2ff" };
const IA_LBL = { barata: "80% · barato", claude: "20% · claude" } as Record<string, string>;
const ST_LBL = { pendente: "na fila", rodando: "rodando", ok: "feito", erro: "falhou" } as Record<string, string>;
const AGENTES = [
  { id: "orquestra", nome: "Orquestra", desc: "despacha e decide" },
  { id: "caio", nome: "Caio", desc: "comercial" },
  { id: "davi", nome: "Davi", desc: "design / UI" },
  { id: "theo", nome: "Theo", desc: "dev / deploy" },
  { id: "mia", nome: "Mia", desc: "conteúdo / portfólio" },
];

import { Despacho } from "./despacho";

export function Demandas({ agentes }: { agentes?: { nome: string; departamento: string; comando: string; html: string }[] }) {
  const [data, setData] = useState<Data | null>(null);
  const [texto, setTexto] = useState("");
  const [atr, setAtr] = useState("orquestra");
  const [ia, setIa] = useState("barata");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const salaRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const r = await fetch("/api/orquestra");
      if (r.status === 401) { location.href = "/login"; return; }
      setData(await r.json());
    } catch { /* offline */ }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 8000); // os agentes "trabalhando" atualizam sozinhos
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (salaRef.current) salaRef.current.scrollTop = salaRef.current.scrollHeight; }, [data?.sala?.length]);

  const post = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      const r = await fetch("/api/orquestra", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
      const j = await r.json();
      if (!j.ok) alert(j.error || "erro");
      await load();
      return j;
    } finally { setBusy(false); }
  };

  const nova = () => {
    if (!texto.trim()) return;
    post("nova", { texto: texto.trim(), atribuido: atr, ia }).then(() => setTexto(""));
  };
  const enviarSala = () => {
    if (!msg.trim()) return;
    post("sala", { de: "everton", texto: msg.trim() }).then(() => setMsg(""));
  };

  if (!data) return <div className="text-[.85rem] text-[#8a8a85]">carregando a agência…</div>;

  const statusCor = (s: string) => (s === "ok" ? "#3ddc84" : s === "rodando" ? "#7aa2ff" : s === "erro" ? "#fb7185" : "#d9a03a");

  return (
    <div className="space-y-6">
      {/* espaços dos agentes — quem está trabalhando */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {AGENTES.map((a) => {
          const st = data.agentes[a.id] || { ocupado: false };
          const cor = CORES[a.id] || "#8a8a85";
          return (
            <div key={a.id} className={`bg-[var(--bg-2)] border rounded-2xl p-5 transition-colors ${st.ocupado ? "border-[#7aa2ff]/50" : "border-[var(--line)]"}`}>
              <div className="flex items-center gap-3 mb-2.5">
                <AgentAvatar nome={a.nome} cor={cor} size={40} />
                <div className="min-w-0">
                  <div className="text-[.9rem] font-medium leading-none truncate">{a.nome}</div>
                  <div className="mono mt-1" style={{ fontSize: "0.68rem" }}>{a.desc}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${st.ocupado ? "bg-[#7aa2ff] animate-pulse" : "bg-[#3ddc84]"}`} />
                <span className="mono" style={{ fontSize: "0.68rem" }}>{st.ocupado ? "trabalhando" : "disponível"}</span>
              </div>
              {st.demanda && <p className="text-[.7rem] text-[#9a9a95] mt-2 line-clamp-2">{st.demanda}</p>}
            </div>
          );
        })}
      </div>

      {/* cria demanda */}
      <div className="card p-5">
        <div className="mono mb-3" style={{ fontSize: "0.66rem" }}>nova demanda → orquestra escolhe quem ajuda</div>
        <div className="flex flex-col md:flex-row gap-3">
          <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && nova()}
            placeholder="ex.: Mia, prepara o case Behance da Multibela" aria-label="nova demanda"
            className="flex-1 h-[50px] bg-white/3 border border-[var(--line)] rounded-xl px-4 text-[.92rem] outline-none focus:border-[#7aa2ff]/60 placeholder:text-[#5d5d58]" />
          <select value={atr} onChange={(e) => setAtr(e.target.value)} aria-label="atribuir a"
            className="h-[50px] bg-[#141416] border border-[var(--line)] rounded-xl px-3 text-[.85rem] outline-none focus:border-[#7aa2ff]/60">
            {AGENTES.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
          <select value={ia} onChange={(e) => setIa(e.target.value)} aria-label="ia"
            className="h-[50px] bg-[#141416] border border-[var(--line)] rounded-xl px-3 text-[.85rem] outline-none focus:border-[#7aa2ff]/60">
            <option value="barata">80% · barato</option>
            <option value="claude">20% · claude</option>
          </select>
          <button onClick={nova} disabled={busy} className="h-[50px] px-6 rounded-[14px] bg-[#7aa2ff] hover:bg-[#8ab3ff] disabled:opacity-60 text-[var(--accent-ink)] text-[.88rem] font-semibold transition-colors">
            despachar
          </button>
        </div>
      </div>

      {/* fila de demandas */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="mono" style={{ fontSize: "0.66rem" }}>demandas</div>
          <span className="mono" style={{ fontSize: "0.68rem" }}>{data.fila.length} na agência</span>
        </div>
        <div className="space-y-2">
          {data.fila.length === 0 && <div className="text-[.8rem] italic text-[#5d5d58]">nenhuma demanda: a agência está quieta</div>}
          {data.fila.map((d) => (
            <div key={d.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white/3 border border-[var(--line)]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: statusCor(d.status) }} />
              <div className="min-w-0 flex-1">
                <div className="text-[.85rem] truncate">{d.prompt}</div>
                <div className="mono mt-0.5" style={{ fontSize: "0.66rem" }}>
                  para <b style={{ color: CORES[d.atribuido || "orquestra"] }}>{d.atribuido || "orquestra"}</b> · {d.ia ? (IA_LBL[d.ia] || d.ia) : d.engine} · {ST_LBL[d.status] || d.status}
                </div>
              </div>
              <select value={d.atribuido || ""} onChange={(e) => e.target.value && post("atribuir", { id: d.id, agente: e.target.value })}
                aria-label="re-atribuir" className="shrink-0 h-[36px] bg-[#141416] border border-[var(--line)] rounded-lg px-2 text-[.78rem] outline-none">
                {AGENTES.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
              <button onClick={() => post("atribuir", { id: d.id, status: d.status === "ok" ? "pendente" : "ok" })} title="concluir/reabrir" aria-label="concluir"
                className="shrink-0 w-9 h-9 rounded-lg border border-white/10 hover:border-white/25 transition-colors" style={{ color: d.status === "ok" ? "#3ddc84" : "#8a8a85" }}>
                {d.status === "ok" ? "↺" : "✓"}
              </button>
              <button onClick={() => post("remover", { id: d.id })} title="remover" aria-label="remover"
                className="shrink-0 w-9 h-9 rounded-lg border border-white/10 text-[#8a8a85] hover:border-[#fb7185]/40 hover:text-[#fb7185] transition-colors">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* sala de reunião */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="mono" style={{ fontSize: "0.66rem" }}>sala de reunião</div>
          <span className="mono" style={{ fontSize: "0.68rem" }}>agentes se encontram aqui</span>
        </div>
        <div ref={salaRef} className="max-h-[320px] overflow-y-auto space-y-2 pr-1 scrollbar-thin" aria-live="polite">
          {data.sala.length === 0 && <div className="text-[.8rem] italic text-[#5d5d58]">sala vazia: envie o 1º assunto</div>}
          {data.sala.map((m, i) => (
            <div key={i} className="flex gap-3 items-start">
              <AgentAvatar nome={m.de} cor={CORES[m.de] || "#8a8a85"} size={30} />
              <div className="min-w-0">
                <div className="text-[.72rem]"><b style={{ color: CORES[m.de] || "#fff" }}>{m.de}</b> <span className="mono text-[#5d5d58]" style={{ fontSize: "0.66rem" }}>{m.quando}</span></div>
                <p className="text-[.84rem] text-[#cacac4] leading-relaxed">{m.texto}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarSala()}
            placeholder="Assunto para a sala… (será atribuído como demanda?)" aria-label="mensagem da sala"
            className="flex-1 h-[48px] bg-white/3 border border-[var(--line)] rounded-xl px-4 text-[.9rem] outline-none focus:border-[#06b6d4]/60 placeholder:text-[#5d5d58]" />
          <button onClick={enviarSala} disabled={busy} className="h-[48px] px-5 rounded-xl bg-[#06b6d4] hover:bg-[#22c8e5] disabled:opacity-60 text-[#04181d] text-[.86rem] font-semibold transition-colors">
            mandar
          </button>
        </div>
      </div>
      {agentes && agentes.length > 0 && (
        <div className="mt-6"><Despacho agentes={agentes} /></div>
      )}
    </div>
  );
}