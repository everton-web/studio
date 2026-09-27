"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Check, Trash2 } from "lucide-react";

// ---------- tipos ----------
export type Lead = {
  id: string;
  nome: string;
  segmento: string;
  cidade: string;
  nota: number;
  avaliacoes: number;
  site: string;
  contato: string;
  whatsapp: string;
  email: string;
  categoria: string;
  estagio: number;
  status: string;
  solucao: string;
  motivo: string;
  porque: string;
  mensagem: string;
  movs: string[];
  criado: string;
};

const ESTAGIOS = [
  { nome: "Prospecção", cor: "#54b8f0", qui: "diário 18h–19h · caio" },
  { nome: "Aprovação", cor: "#FF4000", qui: "você decide" },
  { nome: "Contato", cor: "#d9a03a", qui: "pitch · whatsapp" },
  { nome: "Negociação", cor: "#a86ff0", qui: "proposta → fechamento" },
  { nome: "Desenvolvimento", cor: "#7aa2ff", qui: "davi + theo" },
  { nome: "Entrega", cor: "#3ddc84", qui: "indicação ≥ 3" },
];
const WIP_MAX = 3;
const ease = [0.22, 1, 0.36, 1] as const;

  const notaCor = (n: number) => (n >= 4.5 ? "#3ddc84" : n >= 4 ? "#d9a03a" : "#8a8a85");
const notaLbl = (n: number) => (n > 0 ? n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—");
const avalLbl = (a: number) => (a > 0 ? `${a}` : "");

// mensagem de abordagem (Estágio 2 — Contato), base: script de vendas (Junior Lima)
// conversa primeiro, oferta depois — nunca citar preço na primeira mensagem
function msgAbordagem(l: Lead) {
  const alvo = l.nome.trim();
  const sector = l.segmento ? ` no segmento de ${l.segmento}` : "";
  const gancho = l.porque
    ? `Notei que uma presença digital mais forte pode trazer clientes novos para vocês.`
    : `Acredito que um site profissional pode trazer clientes novos para vocês.`;
  return `Olá! Tudo bem? Me chamo Everton, da Marca Digital — trabalho com criação de sites profissionais para empresas${sector}.

Conheci a ${alvo} e percebi uma oportunidade de fortalecer a presença de vocês na internet. ${gancho}

Hoje, quando alguém procura um serviço no Google, um site profissional transmite credibilidade, apresenta melhor a empresa e transforma buscas em novos contatos.

Teria interesse em saber como funcionaria para a ${alvo}? Se sim, pode me responder apenas: TENHO INTERESSE.`;
}
function waLink(numero: string, msg: string) {
  const num = (numero || "").replace(/\D/g, "");
  if (!num) return null;
  const n = num.length === 11 && num.startsWith("9") ? "55" + num : num.startsWith("55") ? num : "55" + num;
  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
}

const CATS: [string, string][] = [
  ["maps", "Maps"],
  ["indicacao", "Indicação"],
  ["site", "Site"],
  ["saas", "SaaS"],
  ["whatsapp", "WhatsApp"],
];
const catLbl = (c: string) => CATS.find(([k]) => k === c)?.[1] || c;

type Flds = {
  nome: string; segmento: string; cidade: string; nota: string; avaliacoes: string;
  site: string; contato: string; whatsapp: string; email: string; categoria: string;
  porque: string; solucao: string;
};
const EMPTY: Flds = {
  nome: "", segmento: "", cidade: "", nota: "", avaliacoes: "", site: "",
  contato: "", whatsapp: "", email: "", categoria: "maps", porque: "", solucao: "",
};

function Field({ label, value, onChange, placeholder, textarea, numero }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; textarea?: boolean; numero?: boolean;
}) {
  const cls = "w-full bg-white/3 border border-[var(--line)] rounded-xl px-4 text-[.92rem] text-[#f7f7f5] outline-none focus:border-[#FF4000]/70 transition-colors placeholder:text-[#5d5d58]";
  return (
    <label className="block">
      <span className="mono block mb-2" style={{ fontSize: "0.66rem" }}>{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} className={cls + " py-3 resize-none"} />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={numero ? "decimal" : undefined}
          className={cls + " h-[50px]"}
        />
      )}
    </label>
  );
}

function CardBtn({ children, title, onClick, disabled, color, danger }: {
  children: React.ReactNode; title: string; onClick: (e: React.MouseEvent) => void; disabled?: boolean;
  color?: string; danger?: boolean;
}) {
  return (
    <button
      title={title} aria-label={title} disabled={disabled} onClick={onClick}
      className="w-10 h-10 grid place-items-center text-[.78rem] rounded-lg border transition-all active:scale-95
        disabled:opacity-25 disabled:cursor-not-allowed
        border-white/12 text-[#8a8a85] hover:text-white hover:border-white/30 bg-transparent"
      style={color ? { color, borderColor: color + "44" } : danger ? { color: "#fb7185", borderColor: "#fb718544" } : undefined}
    >
      {children}
    </button>
  );
}

function LeadCard({ lead, onEdit, onMove, onAbordar, onValidar, onApagar, onOpen, dragging, onDragStart, onDragEnd }: {
  lead: Lead; onEdit: (l: Lead) => void; onMove: (l: Lead, dir: number) => void; onAbordar: (l: Lead) => void;
  onValidar: (l: Lead) => void; onApagar: (l: Lead) => void; onOpen: (l: Lead) => void;
  dragging?: boolean; onDragStart: (l: Lead) => void; onDragEnd: () => void;
}) {
  const sp = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
  return (
    <div
      style={{ opacity: dragging ? 0.4 : 1 }}
      draggable
      onDragStart={(e: React.DragEvent) => { e.dataTransfer.setData("text/plain", lead.id); e.dataTransfer.effectAllowed = "move"; onDragStart(lead); }}
      onDragEnd={() => onDragEnd()}
      onClick={() => onOpen(lead)}
      className="bg-[var(--bg-2)] border border-[var(--line)] rounded-2xl p-5 mb-3 hover:border-white/16 transition-opacity group cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[.92rem] font-medium tracking-[-.01em] truncate">{lead.nome}</span>
            <span className="mono shrink-0 rounded px-1.5 py-0.5" style={{ fontSize: "0.68rem", color: "#b8b8b3", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)" }}>{catLbl(lead.categoria)}</span>
          </div>
          <div className="mono mt-1 truncate" style={{ fontSize: "0.7rem" }}>
            {lead.segmento || "segmento —"}{lead.cidade ? ` · ${lead.cidade}` : ""}
            {avalLbl(lead.avaliacoes) ? ` · ${avalLbl(lead.avaliacoes)} aval.` : ""}
          </div>
        </div>
        <span
          className="shrink-0 nums rounded-md px-2 py-1 tabular-nums"
          style={{ fontSize: "0.78rem", fontWeight: 600, color: "#050505", background: notaCor(lead.nota), opacity: lead.nota > 0 ? 1 : 0.5 }}
        >
          ★ {notaLbl(lead.nota)}
        </span>
      </div>

      {lead.site && (
        <a
          href={lead.site.startsWith("http") ? lead.site : `https://${lead.site}`}
          target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-[.74rem] text-[#54b8f0] hover:text-[#8ad0ff] truncate mb-1.5"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="truncate">{lead.site.replace(/^https?:\/\//, "")}</span>
        </a>
      )}
      {!lead.site && <div className="mono mb-1.5" style={{ fontSize: "0.7rem", color: "#5d5d58" }}>sem site — o ponto</div>}

      {lead.email && (
        <div className="mono mb-1 truncate text-[#54b8f0]/85 hover:text-[#54b8f0]" style={{ fontSize: "0.7rem" }}>{lead.email}</div>
      )}
      {lead.whatsapp && lead.estagio === 2 && (
        <button
          onClick={sp(() => onAbordar(lead))}
          className="flex items-center justify-center gap-2 mt-2 mb-3 w-full h-[40px] rounded-xl bg-[#3ddc84]/12 border border-[#3ddc84]/25 text-[#3ddc84] text-[.78rem] font-medium transition-colors hover:bg-[#3ddc84]/20"
        >
          abordar no WhatsApp
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><path d="m21.854 2.147-10.94 10.939" /></svg>
        </button>
      )}

      {lead.porque && <p className="text-[.76rem] text-[#b8b8b3] leading-relaxed mb-3 line-clamp-2">{lead.porque}</p>}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--line)]">
        <div className="flex gap-1.5 min-w-0">
          <CardBtn title="voltar estágio" onClick={sp(() => onMove(lead, -1))} disabled={lead.estagio <= 0}>←</CardBtn>
          <CardBtn title="avançar estágio" onClick={sp(() => onMove(lead, 1))} disabled={lead.estagio >= 5}>→</CardBtn>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          {lead.estagio === 1 && (
            <button
              onClick={sp(() => onValidar(lead))}
              className="flex items-center gap-1.5 h-[40px] px-3 rounded-lg bg-[#3ddc84]/12 border border-[#3ddc84]/30 text-[#3ddc84] text-[.76rem] font-semibold transition-colors hover:bg-[#3ddc84]/22"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2.4} /> aceitar
            </button>
          )}
          <CardBtn title="apagar lead" onClick={sp(() => onApagar(lead))} danger>
            <Trash2 className="w-[13px] h-[13px]" strokeWidth={2} />
          </CardBtn>
          <button
            onClick={sp(() => onEdit(lead))}
            className="flex items-center gap-2 mono px-2.5 py-2 rounded-lg text-[#8a8a85] hover:text-white hover:bg-white/5 transition-colors"
            style={{ fontSize: "0.7rem" }}
          >
            ficha
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children }: {
  open: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed z-[60] lg:mx-auto lg:inset-0 lg:flex lg:items-center lg:justify-center pointer-events-none"
            initial="exit" animate="enter" exit="exit"
          >
            <motion.div
              variants={{
                enter: { y: 0, opacity: 1, transition: { duration: 0.34, ease } },
                exit: { y: 40, opacity: 0, transition: { duration: 0.24, ease } },
              }}
              className="pointer-events-auto fixed bottom-0 inset-x-0 lg:static lg:w-[min(92vw,680px)] max-h-[88vh] overflow-y-auto rounded-t-[26px] lg:rounded-[22px] border-t lg:border border-white/9 bg-[var(--bg-2)] shadow-2xl"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 18px)" }}
              role="dialog" aria-label={title}
            >
              <div className="sticky top-0 z-10 bg-[var(--bg-1)] backdrop-blur px-5 sm:px-7 pt-4 pb-3 flex items-center justify-between border-b border-[var(--line)]">
                <span className="mono" style={{ color: "#8a8a85" }}>{title}</span>
                <button onClick={onClose} aria-label="fechar"
                  className="w-9 h-9 grid place-items-center rounded-lg border border-white/10 text-[#b8b8b3] hover:text-white hover:border-white/25 transition-colors">
                  ✕
                </button>
              </div>
              <div className="px-5 sm:px-7 pt-5">{children}</div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Pipeline({ leads, refresh }: { leads: Lead[]; refresh: () => Promise<void> }) {
  const [modal, setModal] = useState<{ kind: "novo" } | { kind: "editar"; lead: Lead } | null>(null);
  const [abordar, setAbordar] = useState<{ lead: Lead; msg: string } | null>(null);
  const [detalhe, setDetalhe] = useState<Lead | null>(null);
  const [f, setF] = useState<Flds>(EMPTY);
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);
  const [nicho, setNicho] = useState("odontologia");
  const [prospectBusy, setProspectBusy] = useState(false);
  const [prospectRes, setProspectRes] = useState<{ adicionados: string[]; descartados: { nome: string; motivo: string }[]; erros: { nome: string; motivo: string }[]; fonte: string; auditados: number; candidatos: number; aviso: string; tempo: number } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [fonteInfo, setFonteInfo] = useState<{ google_places: boolean; fonte_ativa: string; ia_router: boolean; obs: string } | null>(null);

  // status da fonte de prospecção (chave Google? IA Router no ar?)
  useEffect(() => {
    fetch("/api/prospector")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setFonteInfo(j))
      .catch(() => {});
  }, []);

  const ativos = leads.filter((l) => l.status !== "arquivado");
  const arq = leads.filter((l) => l.status === "arquivado");

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const r = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!j.ok) { alert(j.error || "Erro"); return false; }
      await refresh();
      return true;
    } catch { alert("Falha de rede"); return false; }
    finally { setBusy(false); }
  }

  const openNovo = () => { setF(EMPTY); setMotivo(""); setModal({ kind: "novo" }); };
  const openEdit = (lead: Lead) => {
    setF({
      nome: lead.nome, segmento: lead.segmento, cidade: lead.cidade,
      nota: lead.nota ? String(lead.nota).replace(".", ",") : "",
      avaliacoes: lead.avaliacoes ? String(lead.avaliacoes) : "",
      site: lead.site, contato: lead.contato, whatsapp: lead.whatsapp, email: lead.email,
      categoria: lead.categoria || "maps", porque: lead.porque, solucao: lead.solucao,
    });
    setMotivo(lead.motivo);
    setModal({ kind: "editar", lead });
  };

  async function salvar() {
    if (!f.nome.trim()) { alert("Nome do lead é obrigatório"); return; }
    const m = modal;
    const p = {
      nome: f.nome.trim(), segmento: f.segmento.trim(), cidade: f.cidade.trim(),
      nota: f.nota.trim(), avaliacoes: f.avaliacoes.trim(), site: f.site.trim(),
      contato: f.contato.trim(), whatsapp: f.whatsapp.trim(), email: f.email.trim(),
      categoria: f.categoria, porque: f.porque.trim(),
    };
    const ok = m?.kind === "novo"
      ? await post({ action: "add", ...p })
      : await post({ action: "update", id: m!.lead.id, ...p, solucao: f.solucao.trim() });
    if (ok) setModal(null);
  }

  const mover = async (l: Lead, dir: number) => {
    await post({ action: "move", id: l.id, estagio: l.estagio + dir });
  };

  const moverId = async (id: string, to: number) => {
    setDragOver(null);
    await post({ action: "move", id, estagio: to });
  };

  const aceitar = async (l: Lead) => {
    // aprovação (estágio 1): avançar para o Contato — solução pode ser detalhada na ficha depois
    await post({ action: "move", id: l.id, estagio: 2 });
  };
  const apagar = async (l: Lead) => {
    if (!confirm(`Apagar "${l.nome}"? A ficha sai do vault — é permanente.`)) return;
    await post({ action: "delete", id: l.id });
  };

  const arquivar = async () => {
    if (!modal || modal.kind !== "editar") return;
    if (!motivo.trim()) { alert("Registre o motivo antes de arquivar"); return; }
    if (await post({ action: "archive", id: modal.lead.id, motivo: motivo.trim() })) setModal(null);
  };
  const reativar = async (l: Lead) => { await post({ action: "reactivate", id: l.id }); };
  const excluir = async () => {
    if (!modal || modal.kind !== "editar") return;
    if (!confirm(`Excluir "${modal.lead.nome}"? O arquivo sai do vault.`)) return;
    if (await post({ action: "delete", id: modal.lead.id })) setModal(null);
  };

  const openAbordar = (lead: Lead) => setAbordar({ lead, msg: lead.mensagem || msgAbordagem(lead) });
  const openDetalhe = (lead: Lead) => setDetalhe(lead);
  const [mensagemSalva, setMensagemSalva] = useState(false);
  const salvarMensagem = async () => {
    if (!abordar) return;
    await post({ action: "update", id: abordar.lead.id, mensagem: abordar.msg });
    setMensagemSalva(true);
    setTimeout(() => setMensagemSalva(false), 1800);
  };

  async function rodarProspeccao() {
    setProspectBusy(true); setProspectRes(null);
    try {
      const r = await fetch("/api/prospector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nicho, limite: 8 }),
      });
      const j = await r.json();
      if (!j.ok) { alert(j.error || "erro na prospecção"); return; }
      setProspectRes(j.resumo);
      await refresh();
    } catch { alert("falha de rede"); }
    finally { setProspectBusy(false); }
  }

  const totalValendo = ativos.filter((l) => l.estagio >= 1).length;
  const fechados = ativos.filter((l) => l.estagio === 5).length;

  return (
    <MotionConfig reducedMotion="user">
      {/* barra de comando do pipeline */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { n: ativos.length, lbl: "leads ativos" },
            { n: totalValendo, lbl: "em jogo (aprovado+)" },
            { n: fechados, lbl: "entregues" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col gap-1.5 bg-[var(--bg-2)] border border-[var(--line)] rounded-2xl px-4 py-3 min-w-[104px]">
              <b className="nums tabular-nums text-[1.15rem] leading-none" style={{ color: "#f7f7f5" }}>{String(s.n).padStart(2, "0")}</b>
              <span className="mono" style={{ fontSize: "0.68rem" }}>{s.lbl}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={nicho}
            onChange={(e) => setNicho(e.target.value)}
            aria-label="Nicho da prospecção"
            className="h-[52px] px-3 rounded-[14px] bg-[var(--bg-2)] border border-[var(--line)] text-[.84rem] text-[#e8e8e6] outline-none focus:border-[#7aa2ff]/60 transition-colors"
          >
            {[["odontologia", "Odontologia"], ["clinica", "Clínicas médicas"], ["advocacia", "Advocacia"], ["estetica", "Estética/beleza"]].map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={rodarProspeccao}
              disabled={prospectBusy || busy}
              className="flex items-center justify-center gap-2 h-[52px] px-5 rounded-[14px] bg-[#7aa2ff]/12 border border-[#7aa2ff]/30 text-[#7aa2ff] hover:bg-[#7aa2ff]/20 text-[.86rem] font-medium transition-colors disabled:opacity-60"
            >
              {prospectBusy ? "prospectando…" : "▶ prospecção automática"}
            </button>
            {fonteInfo && (
              <span
                title={fonteInfo.obs || fonteInfo.fonte_ativa}
                className={`mono shrink-0 px-2.5 py-1.5 rounded-lg border ${fonteInfo.google_places ? "border-[#3ddc84]/30 text-[#3ddc84] bg-[#3ddc84]/8" : "border-[#d9a03a]/30 text-[#d9a03a] bg-[#d9a03a]/8"} hidden sm:block`}
                style={{ fontSize: "0.7rem" }}
              >
                {fonteInfo.google_places ? "fonte: google" : fonteInfo.fonte_ativa + (fonteInfo.ia_router ? "" : " · IA Router off")}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={openNovo}
          disabled={busy}
          className="shrink-0 flex items-center justify-center gap-2 h-[52px] px-6 bg-[#FF4000] hover:bg-[#ff5c22] disabled:opacity-60 text-white rounded-[14px] text-[.9rem] font-medium transition-colors"
        >
          + novo lead
        </button>
      </div>

      {prospectRes && (
        <div className="mb-6 bg-[var(--bg-2)] border border-[#7aa2ff]/25 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="mono text-[#7aa2ff]">prospecção rodada</span>
            <span className="mono" style={{ fontSize: "0.7rem" }}>fonte: {prospectRes.fonte}</span>
            <button onClick={() => setProspectRes(null)} aria-label="fechar" className="ml-auto w-8 h-8 grid place-items-center rounded-lg border border-white/10 text-[#8a8a85] hover:text-white transition-colors">✕</button>
          </div>
          <div className="text-[.9rem] mb-3">
            <b className="text-[#3ddc84]">{prospectRes.adicionados.length}</b> lead(s) adicionado(s) ao estágio 0 ·
            <b className="text-[#7aa2ff]"> {prospectRes.auditados}</b> site(s) auditados ·
            <b className="text-[#b8b8b3]"> {prospectRes.candidatos}</b> candidato(s) da fonte
            {prospectRes.tempo ? <> · <span className="text-[#8a8a85]">{prospectRes.tempo}s</span></> : null}
          </div>
          {prospectRes.aviso && (
            <div className="mb-3 rounded-xl border border-[#d9a03a]/25 bg-[#d9a03a]/6 px-4 py-3 text-[.8rem] text-[#d9a03a]">
              ⚠ {prospectRes.aviso}
            </div>
          )}
          {prospectRes.erros.length > 0 && (
            <div className="mb-3">
              <div className="mono mb-1 text-[#fb7185]" style={{ fontSize: "0.68rem" }}>erros da fonte</div>
              <div className="space-y-1">
                {prospectRes.erros.slice(0, 6).map((e: { nome: string; motivo: string }, i: number) => (
                  <div key={i} className="text-[.74rem] text-[#fb7185]/85">— {e.nome}: {e.motivo}</div>
                ))}
              </div>
            </div>
          )}
          {prospectRes.adicionados.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {prospectRes.adicionados.map((n) => (
                <span key={n} className="mono px-2.5 py-1.5 rounded-lg bg-[#3ddc84]/10 border border-[#3ddc84]/25 text-[#3ddc84]" style={{ fontSize: "0.66rem" }}>{n}</span>
              ))}
            </div>
          )}
          {prospectRes.descartados.length > 0 && (
            <>
              <div className="mono mb-1" style={{ fontSize: "0.68rem" }}>descartados</div>
              <div className="space-y-1">
                {prospectRes.descartados.slice(0, 12).map((d, i) => (
                  <div key={i} className="text-[.74rem] text-[#8a8a85]">— {d.nome}: <span className="text-[#fb7185]/80">{d.motivo}</span></div>
                ))}
              </div>
            </>
          )}
          <p className="mono mt-3" style={{ fontSize: "0.68rem" }}>aprovar = estágio 1 · cada auditoria fica registrada na ficha</p>
        </div>
      )}

      {/* funil de conversão (studio) */}
      <div className="mb-6 card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="mono" style={{ fontSize: "0.66rem" }}>funil de conversão</div>
          <span className="mono" style={{ fontSize: "0.7rem" }}>{ativos.length} leads ativos</span>
        </div>
        <div className="space-y-2.5">
          {ESTAGIOS.map((s, si) => {
            const n = ativos.filter((l) => l.estagio === si).length;
            const max = Math.max(1, ...ESTAGIOS.map((_, x) => ativos.filter((l) => l.estagio === x).length));
            return (
              <div key={si} className="flex items-center gap-3">
                <span className="w-28 text-[.74rem] text-[#9a9a95] shrink-0 truncate">{s.nome}</span>
                <div className="flex-1 h-6 rounded-lg bg-white/4 overflow-hidden">
                  <div
                    className="nums h-full rounded-lg flex items-center px-2.5 transition-all"
                    style={{ width: `${Math.max(n > 0 ? 6 : 0, (n / max) * 100)}%`, background: s.cor + (n ? "E6" : "22") }}
                  >
                    {n > 0 && <span className="text-[.75rem] font-semibold text-[var(--accent-ink)] tabular-nums">{n}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6 estágios + arquivo */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 md:-mx-10 lg:-mx-14 px-6 md:px-10 lg:px-14 snap-x snap-mandatory scrollbar-thin">
        {ESTAGIOS.map((s, si) => {
          const col = ativos.filter((l) => l.estagio === si);
          const over = col.length > WIP_MAX;
          return (
            <div key={si} className="w-[82vw] min-w-[300px] max-w-[340px] shrink-0 snap-start lg:w-[340px]">
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-2xl flex flex-col" style={{ minHeight: 420 }}>
                <div className="px-4 pt-4 pb-3 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="nums w-6 h-6 rounded-[8px] grid place-items-center shrink-0"
                      style={{ fontSize: "0.74rem", fontWeight: 700, color: "#050505", background: s.cor }}
                    >
                      {si}
                    </span>
                    <span className="text-[.92rem] font-medium tracking-[-.01em]">{s.nome}</span>
                    <span
                      className={`nums ml-auto tabular-nums ${over ? "text-[#fb7185]" : "text-[#f7f7f5]"}`}
                      style={{ fontSize: "0.74rem", fontWeight: 600 }}
                    >
                      {col.length}/{WIP_MAX}
                    </span>
                  </div>
                  <div className="mono mt-2 truncate" style={{ fontSize: "0.68rem" }}>{s.qui}</div>
                  {over && (
                    <div className="mono mt-2 text-[#fb7185]" style={{ fontSize: "0.68rem" }}>
                      ⚠ acima do wip — não atropelar
                    </div>
                  )}
                </div>
                <div
                  className={`p-3 flex-1 rounded-b-2xl transition-colors ${dragOver === si && dragging ? "bg-[#7aa2ff]/8 ring-1 ring-inset ring-[#7aa2ff]/30" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(si); }}
                  onDragLeave={() => setDragOver((v) => (v === si ? null : v))}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain");
                    if (id && dragging) moverId(id, si);
                  }}
                >
                  {col.length === 0 && (
                    <div className="text-[.74rem] italic text-[#5d5d58] px-2 py-2">vazio — rotina 18h–19h</div>
                  )}
                  {col.map((l) => (
                    <LeadCard
                      key={l.id} lead={l} onEdit={openEdit} onMove={mover} onAbordar={openAbordar}
                      onValidar={aceitar} onApagar={apagar} onOpen={openDetalhe}
                      dragging={dragging === l.id}
                      onDragStart={() => setDragging(l.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* arquivo */}
        <div className="w-[82vw] min-w-[300px] max-w-[340px] shrink-0 snap-start lg:w-[340px]">
          <div className="border border-dashed border-white/13 rounded-2xl flex flex-col" style={{ minHeight: 420 }}>
            <div className="px-4 pt-4 pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-[8px] grid place-items-center mono text-[var(--accent-ink)] shrink-0" style={{ fontSize: "0.68rem", background: "#5d5d58" }}>×</span>
                <span className="text-[.92rem] font-medium tracking-[-.01em] text-[#8a8a85]">Arquivo</span>
                <span className="ml-auto mono tabular-nums" style={{ fontSize: "0.66rem" }}>{arq.length}</span>
              </div>
              <div className="mono mt-2" style={{ fontSize: "0.68rem" }}>motivo registrado · reativável</div>
            </div>
            <div className="p-3 flex-1">
              {arq.length === 0 && <div className="text-[.74rem] italic text-[#5d5d58] px-2 py-2">nada arquivado</div>}
              {arq.map((l) => (
                <motion.div key={l.id} layout className="bg-[var(--bg-2)] border border-[var(--line)] rounded-2xl p-5 mb-3 opacity-70">
                  <div className="text-[.88rem] font-medium tracking-[-.01em] truncate mb-1">{l.nome}</div>
                  {l.motivo && <p className="text-[.74rem] text-[#8a8a85] leading-relaxed mb-3 line-clamp-2">{l.motivo}</p>}
                  <button onClick={() => reativar(l)} disabled={busy}
                    className="mono px-3 py-2 rounded-lg border border-[#3ddc84]/25 text-[#3ddc84] hover:bg-[#3ddc84]/8 transition-colors"
                    style={{ fontSize: "0.7rem" }}>
                    ↺ reativar
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* rodapé básico do volante */}
      <div className="mono mt-5 flex items-center gap-3" style={{ fontSize: "0.7rem" }}>
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#3ddc84]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" />
        </svg>
        volante: entrega → case → conteúdo → próxima venda · ficha de cada lead em <span className="text-[#f7f7f5]">vault/40 Comercial/Leads</span>
      </div>

      {/* ===== modal novo / editar ===== */}
      <Modal open={!!modal} title={modal?.kind === "editar" ? `ficha — ${modal.lead.nome}` : "novo lead"} onClose={() => setModal(null)}>
        <div className="space-y-4 pb-2">
          <Field label="Nome *" value={f.nome} onChange={(v) => setF({ ...f, nome: v })} placeholder="ex.: Clínica Sorriso Forte" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Segmento" value={f.segmento} onChange={(v) => setF({ ...f, segmento: v })} placeholder="ex.: odontologia" />
            <Field label="Cidade" value={f.cidade} onChange={(v) => setF({ ...f, cidade: v })} placeholder="Salvador/BA" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nota no Google" value={f.nota} onChange={(v) => setF({ ...f, nota: v })} placeholder="4.8" numero />
            <Field label="Avaliações" value={f.avaliacoes} onChange={(v) => setF({ ...f, avaliacoes: v })} placeholder="ex.: 120" numero />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Site atual" value={f.site} onChange={(v) => setF({ ...f, site: v })} placeholder="https://… (ou vazio)" />
            <label className="block">
              <span className="mono block mb-2" style={{ fontSize: "0.66rem" }}>Categoria</span>
              <select
                value={f.categoria}
                onChange={(e) => setF({ ...f, categoria: e.target.value })}
                className="w-full h-[50px] bg-[#141416] border border-[var(--line)] rounded-xl px-4 text-[.92rem] text-[#f7f7f5] outline-none focus:border-[#FF4000]/70 transition-colors"
              >
                {CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="WhatsApp (com DDD, 9 dígitos)" value={f.whatsapp} onChange={(v) => setF({ ...f, whatsapp: v })} placeholder="71 98888-0000" />
            <Field label="E-mail público" value={f.email} onChange={(v) => setF({ ...f, email: v })} placeholder="contato@…" />
          </div>
          <Field label="Por que é um bom lead" value={f.porque} onChange={(v) => setF({ ...f, porque: v })} textarea placeholder="nota alta + site fraco (motivo objetivo) + porte que paga…" />

          {modal?.kind === "editar" && (
            <Field label="Solução validada (aprovado → registrar)" value={f.solucao} onChange={(v) => setF({ ...f, solucao: v })} placeholder="ex.: landing page + recorrência" />
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={salvar} disabled={busy}
              className="flex-1 h-[52px] rounded-[14px] bg-[#FF4000] hover:bg-[#ff5c22] disabled:opacity-60 text-white text-[.9rem] font-medium transition-colors"
            >
              {busy ? "salvando…" : modal?.kind === "editar" ? "salvar ficha" : "criar lead — estágio 0"}
            </button>
            {modal?.kind === "editar" && modal.lead.estagio === 5 && (
              <button
                onClick={arquivar} disabled={busy}
                className="h-[52px] px-5 rounded-[14px] border border-[#3ddc84]/25 text-[#3ddc84] hover:bg-[#3ddc84]/8 transition-colors"
              >
                concluir / arquivar
              </button>
            )}
          </div>

          {modal?.kind === "editar" && modal.lead.estagio !== 5 && (
            <div className="border-t border-[var(--line)] pt-4 mt-2">
              <Field label="Motivo do arquivo (não validou)" value={motivo} onChange={setMotivo} placeholder="ex.: site bom, não gasta com isso" />
              <div className="flex gap-3 mt-3">
                <button onClick={arquivar} disabled={busy || modal.lead.status === "arquivado"}
                  className="flex-1 h-[48px] rounded-[12px] border border-white/10 text-[#b8b8b3] hover:text-white hover:border-white/25 transition-colors">
                  {modal.lead.status === "arquivado" ? "já arquivado" : "arquivar"}
                </button>
                <button onClick={excluir} disabled={busy}
                  className="px-5 h-[48px] rounded-[12px] border border-[#fb7185]/30 text-[#fb7185] hover:bg-[#fb7185]/8 transition-colors">
                  excluir
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== modal de abordagem (validação antes de enviar) ===== */}
      <Modal open={!!abordar} title={abordar ? `abordar — ${abordar.lead.nome}` : ""} onClose={() => setAbordar(null)}>
        <p className="text-[.8rem] text-[#b8b8b3] mb-4">
          Rascunho da 1ª mensagem (base: <span className="text-[#f7f7f5]">40 Comercial/Pitch.md</span> — conversa primeiro, sem preço).
          <b className="text-[#f7f7f5]"> Edite até ficar do seu jeito antes de abrir o WhatsApp.</b>
        </p>
        <textarea
          value={abordar ? abordar.msg : ""}
          onChange={(e) => abordar && setAbordar({ ...abordar, msg: e.target.value })}
          rows={12}
          aria-label="Mensagem de abordagem"
          className="w-full bg-white/3 border border-[var(--line)] rounded-xl px-4 py-3 text-[.92rem] text-[#f7f7f5] outline-none focus:border-[#3ddc84]/70 transition-colors placeholder:text-[#5d5d58] resize-y"
        />
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={salvarMensagem}
            className={`flex-1 h-[52px] rounded-[14px] border transition-colors ${
              mensagemSalva
                ? "border-[#3ddc84]/40 text-[#3ddc84] bg-[#3ddc84]/8"
                : "border-white/12 text-[#b8b8b3] hover:text-white hover:border-white/28"
            }`}
          >
            {mensagemSalva ? "salva ✓" : "salvar mensagem nesta ficha"}
          </button>
          {abordar && waLink(abordar.lead.whatsapp || abordar.lead.contato, abordar.msg) && (
            <a
              href={waLink(abordar.lead.whatsapp || abordar.lead.contato, abordar.msg)!}
              target="_blank" rel="noreferrer"
              onClick={salvarMensagem}
              className="flex-1 flex items-center justify-center gap-2 h-[52px] rounded-[14px] bg-[#25d366] hover:bg-[#2ee06f] text-[#04210f] text-[.9rem] font-semibold transition-colors"
            >
              abrir WhatsApp com a mensagem
            </a>
          )}
          {abordar && !waLink(abordar.lead.whatsapp || abordar.lead.contato, abordar.msg) && (
            <div className="flex-1 flex items-center justify-center h-[52px] rounded-[14px] border border-[var(--line)] text-[#8a8a85] text-[.82rem]">
              sem WhatsApp cadastrado — edite a ficha e adicione
            </div>
          )}
        </div>
        <p className="mono mt-4" style={{ fontSize: "0.7rem" }}>
          você valida, edita e decide o envio — a mensagem fica salva na ficha do lead para o próximo contato
        </p>
      </Modal>

      {/* ===== modal de ficha (clique no card) ===== */}
      <Modal open={!!detalhe} title={detalhe ? `ficha — ${detalhe.nome}` : ""} onClose={() => setDetalhe(null)}>
        {detalhe && (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="mono px-2 py-1 rounded-md" style={{ fontSize: "0.66rem", background: "#7aa2ff14", color: "#7aa2ff", border: "1px solid #7aa2ff33" }}>{catLbl(detalhe.categoria)}</span>
              <span className="mono" style={{ fontSize: "0.7rem" }}>{ESTAGIOS[detalhe.estagio].nome} · estágio {detalhe.estagio}</span>
              <button onClick={() => { setDetalhe(null); openEdit(detalhe); }} className="ml-auto mono px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-white/25 transition-colors" style={{ fontSize: "0.7rem" }}>
                ✎ editar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                ["Segmento", detalhe.segmento || "—"],
                ["Cidade", detalhe.cidade || "—"],
                ["Nota Google", detalhe.nota > 0 ? `★ ${detalhe.nota.toLocaleString("pt-BR")}` : "—"],
                ["Avaliações", detalhe.avaliacoes > 0 ? String(detalhe.avaliacoes) : "—"],
                ["E-mail", detalhe.email || "—"],
                ["WhatsApp", detalhe.whatsapp || detalhe.contato || "—"],
              ].map(([k, v]) => (
                <div key={k} className="bg-white/3 border border-[var(--line)] rounded-xl px-4 py-3">
                  <div className="mono mb-1" style={{ fontSize: "0.68rem" }}>{k}</div>
                  <div className="text-[.86rem] break-words">{v}</div>
                </div>
              ))}
            </div>

            {detalhe.site && (
              <a href={detalhe.site.startsWith("http") ? detalhe.site : `https://${detalhe.site}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-[.88rem] text-[#54b8f0] hover:text-[#8ad0ff] break-all mb-5">
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                {detalhe.site.replace(/^https?:\/\//, "")}
              </a>
            )}

            <div className="mb-5">
              <div className="mono mb-2" style={{ fontSize: "0.68rem" }}>por que é bom lead</div>
              <p className="text-[.86rem] text-[#cacac4] leading-relaxed">{detalhe.porque || "—"}</p>
            </div>

            {detalhe.solucao && (
              <div className="mb-5">
                <div className="mono mb-2" style={{ fontSize: "0.68rem" }}>solução validada</div>
                <p className="text-[.86rem] text-[#3ddc84]">{detalhe.solucao}</p>
              </div>
            )}

            {detalhe.movs.length > 0 && (
              <div className="mb-6">
                <div className="mono mb-3" style={{ fontSize: "0.68rem" }}>movimentações</div>
                <div className="space-y-2.5 border-l border-[var(--line)] pl-4">
                  {detalhe.movs.map((m, i) => (
                    <div key={i} className="relative text-[.8rem] text-[#9a9a95]">
                      <span className="absolute -left-[17px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#FF4000]" />
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {detalhe.estagio === 2 && waLink(detalhe.whatsapp || detalhe.contato, msgAbordagem(detalhe)) && (
                <a href={waLink(detalhe.whatsapp || detalhe.contato, msgAbordagem(detalhe))!} target="_blank" rel="noreferrer" onClick={() => setDetalhe(null)}
                  className="flex-1 flex items-center justify-center gap-2 h-[50px] rounded-[14px] bg-[#25d366] hover:bg-[#2ee06f] text-[#04210f] text-[.88rem] font-semibold transition-colors">
                  abordar no WhatsApp
                </a>
              )}
              <button onClick={() => { setDetalhe(null); mover(detalhe, 1); }} disabled={detalhe.estagio >= 5}
                className="flex-1 h-[50px] rounded-[14px] border border-white/12 text-[#cacac4] hover:border-white/28 transition-colors disabled:opacity-40">
                avançar → {detalhe.estagio + 1 < 6 ? ESTAGIOS[detalhe.estagio + 1].nome : "—"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </MotionConfig>
  );
}