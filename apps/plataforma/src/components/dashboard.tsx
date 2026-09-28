"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  Home, LayoutGrid, Target, Users, Inbox, ListChecks, MessageCircle, ListTodo,
  FolderOpen, Ellipsis, Activity, Wallet, BarChart3,
  Search, Calendar, MoreHorizontal, Info, Trash2,
  LogOut, ChevronsRight, ChevronsLeft,
} from "lucide-react";
import { Chat } from "./chat";
import { Files } from "./files";
import { Pipeline } from "./pipeline";
import { AgentAvatar } from "./agent-avatar";
import { Rastreamento } from "./rastreamento";
import { Despacho } from "./despacho";
import { Demandas } from "./demandas";
import { Analytics } from "./analytics";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

// ---------- tipos ----------
type Item = { done: boolean; text: string };
type Col = { nome: string; itens: Item[] };
type Section = { h: string; html: string };
type Agente = { nome: string; departamento: string; comando: string; html: string };
type Data = {
  placar: { progresso: number; acumulado: number; meta: number; fase: string };
  comando: Section[];
  inbox: Section[];
  backlog: Section[];
  kanban: Col[];
  agentes: Agente[];
  pipeline: {
    id: string; nome: string; segmento: string; cidade: string; nota: number;
    avaliacoes: number; site: string; contato: string; whatsapp: string; email: string;
    categoria: string; estagio: number; status: string;
    solucao: string; motivo: string; porque: string; mensagem: string; movs: string[]; criado: string;
    contatadoEm: string; respondeuEm: string; desfecho: string; desfechoEm: string;
  }[];
  rastreamento: { sites: Record<string, { n: number; primeiro: string; ultimo: string }>; total: number };
};

const COLS = ["Backlog", "Esta semana", "Fazendo (máx. 2)", "Aguardando cliente", "Feito"];
const CORES = ["#FF4000", "#54b8f0", "#a86ff0", "#3ddc84", "#d9a03a", "#fb7185"];
const NAV = [
  { id: "comando", label: "Início", dot: "#FF4000" },
  { id: "demandas", label: "Time & Fila", dot: "#a86ff0" },
  { id: "kanban", label: "Projetos", dot: "#54b8f0" },
  { id: "pipeline", label: "Comercial", dot: "#7aa2ff" },
  { id: "analytics", label: "Resultados", dot: "#3ddc84" },
  { id: "arquivos", label: "Conteúdo", dot: "#d9a03a" },
];
// navegação de app no celular: 4 destinos + "Mais" (sheet com o restante)
const TABS = [
  { id: "comando", label: "Início" },
  { id: "demandas", label: "Time" },
  { id: "kanban", label: "Projetos" },
  { id: "pipeline", label: "Comercial" },
  { id: "mais", label: "Mais" },
];
const NAV_GRUPOS: { nome: string; ids: string[] }[] = [
  { nome: "Operar", ids: ["comando", "demandas", "kanban"] },
  { nome: "Crescer", ids: ["pipeline", "analytics", "arquivos"] },
];
const MORE_IDS = ["analytics", "arquivos"];
const ease = [0.22, 1, 0.36, 1] as const;
const fmt = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");

// cabeçalho padrão do SaaS (título + subtítulo) por view
const VIEW_META: Record<string, { titulo: string; sub: string }> = {
  comando: { titulo: "Início", sub: "A operação num só lugar: placar, o que precisa de decisão e a captura rápida." },
  demandas: { titulo: "Time & Fila", sub: "A agência virtual: agentes, demandas em execução e a fila priorizada. Tudo num lugar." },
  kanban: { titulo: "Projetos", sub: "A fábrica da operação: do backlog à entrega. Vendas ficam no Comercial." },
  pipeline: { titulo: "Comercial", sub: "Leads do estágio 0 ao 5: o agente audita os sites, você aprova e aborda." },
  analytics: { titulo: "Resultados", sub: "Como estamos: tráfego, CPL e ROI + o placar dos R$ 100k. A vitrine da plataforma." },
  arquivos: { titulo: "Conteúdo", sub: "Insumo (uploads do cliente) e saída (cases/portfólio) no mesmo lugar." },
};

// ícones lucide (referência: https://lucide.dev)
const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  comando: Home,
  kanban: LayoutGrid,
  pipeline: Target,
  demandas: ListTodo,
  agentes: Users,
  inbox: Inbox,
  backlog: ListChecks,
  chat: MessageCircle,
  arquivos: FolderOpen,
  rastreamento: Activity,
  analytics: BarChart3,
  financas: Wallet,
  mais: Ellipsis,
};

function Triangle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 10 Q58.6 45 84.6 70 Q50 60 15.4 70 Q41.4 45 50 10Z" />
    </svg>
  );
}
function Md({ html }: { html: string }) {
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ---------- hero do placar (na sidebar) ----------
function Placar({ p, menor }: { p: Data["placar"]; menor?: boolean }) {
  if (menor) {
    const title = `${fmt(p.acumulado)} de ${fmt(p.meta)} (progresso ${p.progresso}%)`;
    return (
      <div className="flex justify-center" title={title}>
        <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90" role="img" aria-label={title}>
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3ddc84" strokeWidth="3" strokeLinecap="round" pathLength="100" strokeDasharray={`${Math.min(100, p.progresso)} 100`} />
        </svg>
      </div>
    );
  }
  return (
    <div>
      <div className="mono mb-2">Faturado</div>
      <div className="text-[1.7rem] leading-none font-medium tracking-[-.03em] text-[#3ddc84] tabular-nums mb-3">
        {fmt(p.acumulado)}
      </div>
      <div className="h-[3px] rounded-full bg-white/8 overflow-hidden mb-2">
        <motion.div
          className="h-full bg-[#3ddc84]"
          initial={{ width: 0 }}
          animate={{ width: Math.min(100, p.progresso) + "%" }}
          transition={{ duration: 1.2, ease, delay: 0.3 }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[.75rem] text-[var(--warn)]">{p.fase || "-"}</span>
        <span className="mono">{p.progresso}%</span>
      </div>
    </div>
  );
}

// ---------- gráficos SVG (sem lib — referência: dashboard analytics premium) ----------
const shortDom = (d: string) =>
  d.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").replace(/\.(com\.br|com|br|net|org)$/, "").slice(0, 12);

function niceCeil(v: number) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * mag;
}

// sparkline minúscula dentro dos KPI cards
function Sparkline({ points, color = "var(--accent)", w = 74, h = 26 }: { points: number[]; color?: string; w?: number; h?: number }) {
  if (points.length < 2) return null;
  const max = Math.max(...points), min = Math.min(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((p - min) / span) * (h - 3) - 1.5).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 overflow-visible" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// gráfico de linha com marcadores + área (referência: "Predicted Churn Rate Over Time")
function ChartLine({ series, labels, color = "var(--accent)", yfmt = (n: number) => String(n), gid = "cl" }: { series: number[]; labels: string[]; color?: string; yfmt?: (n: number) => string; gid?: string }) {
  const W = 560, H = 240, pl = 42, pr = 16, pt = 16, pb = 30;
  const iw = W - pl - pr, ih = H - pt - pb;
  const max = niceCeil(Math.max(...series, 1));
  const step = series.length > 1 ? iw / (series.length - 1) : iw;
  const X = (i: number) => pl + i * step;
  const Y = (v: number) => pt + ih - (v / max) * ih;
  const path = series.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const area = `${path} L${X(series.length - 1).toFixed(1)},${(pt + ih).toFixed(1)} L${pl},${(pt + ih).toFixed(1)} Z`;
  const rows = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[560px] sm:min-w-0" role="img" aria-label="gráfico de linha">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: rows + 1 }).map((_, r) => {
        const gy = pt + (ih / rows) * r, val = max - (max / rows) * r;
        return (
          <g key={r}>
            <line x1={pl} x2={W - pr} y1={gy} y2={gy} stroke="rgba(255,255,255,.06)" strokeWidth="1" />
            <text x={pl - 8} y={gy + 3} textAnchor="end" fontSize="11" fill="var(--muted)" fontFamily="DM Mono, monospace">{yfmt(Math.round(val))}</text>
          </g>
        );
      })}
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {series.map((v, i) => (
        <circle key={i} cx={X(i)} cy={Y(v)} r="3.5" fill="var(--bg)" stroke={color} strokeWidth="2" />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={X(i)} y={H - 9} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="DM Mono, monospace">{l}</text>
      ))}
    </svg>
  );
}

// gráfico de barras (referência: "Revenue at Risk Over Time")
function ChartBars({ series, labels, color = "var(--accent)", yfmt = (n: number) => String(n) }: { series: number[]; labels: string[]; color?: string; yfmt?: (n: number) => string }) {
  const W = 560, H = 240, pl = 46, pr = 16, pt = 16, pb = 30;
  const iw = W - pl - pr, ih = H - pt - pb;
  const max = niceCeil(Math.max(...series, 1));
  const n = series.length || 1;
  const slot = iw / n, bw = Math.min(40, slot * 0.56);
  const rows = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[560px] sm:min-w-0" role="img" aria-label="gráfico de barras">
      {Array.from({ length: rows + 1 }).map((_, r) => {
        const gy = pt + (ih / rows) * r, val = max - (max / rows) * r;
        return (
          <g key={r}>
            <line x1={pl} x2={W - pr} y1={gy} y2={gy} stroke="rgba(255,255,255,.06)" strokeWidth="1" />
            <text x={pl - 8} y={gy + 3} textAnchor="end" fontSize="11" fill="var(--muted)" fontFamily="DM Mono, monospace">{yfmt(Math.round(val))}</text>
          </g>
        );
      })}
      {series.map((v, i) => {
        const x = pl + slot * i + (slot - bw) / 2, h = (v / max) * ih;
        return (
          <g key={i}>
            <rect x={x} y={pt + ih - h} width={bw} height={Math.max(h, 1)} rx="4" fill={color} opacity="0.9" />
            <text x={x + bw / 2} y={H - 9} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="DM Mono, monospace">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// KPI card com número grande + sparkline/progresso (referência: linha de 4 cards do topo)
function Kpi({ label, value, sub, color, spark, progress, onClick }: {
  label: string; value: React.ReactNode; sub?: string; color?: string; spark?: number[]; progress?: number; onClick?: () => void;
}) {
  const c = color || "rgba(255,255,255,.30)";
  return (
    <button onClick={onClick} className="group text-left bg-[var(--panel)] border border-[var(--line)] hover:border-white/15 rounded-2xl p-5 transition-colors">
      <div className="mono mb-3">{label}</div>
      <div className="flex items-end justify-between gap-3">
        <div className="nums text-[1.5rem] sm:text-[1.85rem] leading-none font-semibold whitespace-nowrap" style={color ? { color } : undefined}>{value}</div>
        {spark && spark.length > 1 && <Sparkline points={spark} color={c} />}
      </div>
      {progress != null && (
        <div className="mt-3 h-[3px] rounded-full bg-white/8 overflow-hidden">
          <motion.div className="h-full" style={{ background: c }} initial={{ width: 0 }} animate={{ width: Math.min(100, progress) + "%" }} transition={{ duration: 1, ease, delay: 0.2 }} />
        </div>
      )}
      {sub && <div className="mono mt-2.5">{sub}</div>}
    </button>
  );
}

// ---------- dashboard ----------
export function Dashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [view, setView] = useState("comando");
  const [busy, setBusy] = useState(false);
  const [inboxText, setInboxText] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [kanDragging, setKanDragging] = useState<string | null>(null);
  const [kanOver, setKanOver] = useState<number | null>(null);
  const [navMenor, setNavMenor] = useState<boolean>(() => {
    try { return typeof window !== "undefined" && localStorage.getItem("navMenor") === "1"; } catch { return false; }
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [homeTab, setHomeTab] = useState<"visao" | "atividade">("visao");
  const [homeQuery, setHomeQuery] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/data");
    if (r.status === 401) { location.href = "/login"; return; }
    setData(await r.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    try { localStorage.setItem("navMenor", navMenor ? "1" : "0"); } catch {}
  }, [navMenor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setChatOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(id: string) {
    setView(id);
    setMoreOpen(false);
    // cada aba abre no topo (no celular a rolagem da aba anterior deixava a nova "vazia")
    window.scrollTo({ top: 0 });
  }

  async function api(path: string, body: object) {
    setBusy(true);
    try {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!j.ok) alert(j.error || "Erro");
      else await load();
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    location.href = "/login";
  }

  if (!data) {
    return (
      <div className="grain min-h-screen grid place-items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-7 h-7 rounded-full border-2 border-white/15 border-t-[#FF4000]"
        />
      </div>
    );
  }

  const activeNav = NAV.find((n) => n.id === view)!;

  // ----- métricas reais para o dashboard "Início" (referência: analytics premium) -----
  const ESTAGIOS = ["Prospecção", "Aprovação", "Contato", "Negociação", "Desenv.", "Entrega"];
  const ESTAGIO_CORES = ["#54b8f0", "#FF4000", "#d9a03a", "#a86ff0", "#7aa2ff", "#3ddc84"];
  const ativos = data.pipeline.filter((l) => l.status !== "arquivado");
  const funil = [0, 1, 2, 3, 4, 5].map((s) => ativos.filter((l) => l.estagio === s).length);
  const sitesArr = Object.entries(data.rastreamento.sites)
    .map(([dom, v]) => ({ dom, n: v.n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);
  const fazendo = data.kanban.find((c) => c.nome === "Fazendo (máx. 2)")?.itens.length ?? 0;
  const feitos = data.kanban.find((c) => c.nome === "Feito")?.itens.length ?? 0;
  const cohorts = ativos
    .map((l) => ({ ...l, score: Math.min(1, (Number(l.nota) || 0) / 5 * 0.6 + (l.estagio / 5) * 0.4) }))
    .sort((a, b) => b.score - a.score);
  const q = homeQuery.trim().toLowerCase();
  const cohortsF = (q
    ? cohorts.filter((l) => `${l.nome} ${l.segmento} ${l.cidade}`.toLowerCase().includes(q))
    : cohorts
  ).slice(0, 7);

  return (
    <MotionConfig reducedMotion="user">
      <div className="grain flex min-h-screen">
        {/* ===== sidebar (desktop ≥ 1024) ===== */}
        <aside className={`hidden lg:flex ${navMenor ? "w-[var(--sidebar-w-min)]" : "w-[var(--sidebar-w)]"} shrink-0 min-w-0 overflow-hidden flex-col bg-[var(--bg-1)] border-r border-[var(--line)] transition-[width] duration-200 sticky top-0 h-screen`}>
          <div className={`flex items-center gap-3 h-16 border-b border-[var(--line)] ${navMenor ? "justify-center px-2" : "px-5"}`}>
            <motion.span whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}>
              <Triangle className="w-[17px] h-[17px] text-[#FF4000]" />
            </motion.span>
            <div className="overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200" style={{ maxWidth: navMenor ? 0 : 220, opacity: navMenor ? 0 : 1 }}>
              <div className="text-[.92rem] font-medium tracking-[-.02em] leading-none">Agência</div>
              <div className="mono mt-1" style={{ fontSize: "0.7rem" }}>{data.placar.fase || "Comando"}</div>
            </div>
          </div>

          <nav className="flex-1 py-4 px-2.5 space-y-4 overflow-y-auto">
            {NAV_GRUPOS.map((g) => (
              <div key={g.nome}>
                <div className={`mono mb-1.5 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${navMenor ? "px-0" : "px-3"}`} style={{ maxWidth: navMenor ? 0 : 220, opacity: navMenor ? 0 : 1, fontSize: "0.68rem" }}>{g.nome}</div>
                <div className="space-y-0.5">
                  {g.ids.map((id) => {
                    const n = NAV.find((x) => x.id === id)!;
                    const active = view === n.id;
                    const Icon = ICONS[n.id];
                    return (
                      <button
                        key={n.id}
                        onClick={() => go(n.id)}
                        aria-current={active ? "page" : undefined}
                        aria-label={navMenor ? n.label : undefined}
                        title={n.label}
                        className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl relative transition-colors ${
                          active ? "bg-white/5 text-white" : "text-[#7d7d78] hover:text-[#d8d8d4] hover:bg-white/3"
                        } ${navMenor ? "justify-center !px-2 !gap-0" : ""}`}
                      >
                        {active && (
                          <motion.span
                            layoutId="nav-line"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-full bg-[#FF4000]"
                            transition={{ duration: 0.45, ease }}
                          />
                        )}
                        <Icon className="w-[17px] h-[17px] shrink-0" strokeWidth={1.7} />
                        <span className="text-[.83rem] tracking-[-.01em] overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200" style={{ maxWidth: navMenor ? 0 : 200, opacity: navMenor ? 0 : 1 }}>{n.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {!navMenor && (
            <button onClick={() => setNavMenor(true)} aria-label="recolher menu"
              className="ml-auto mr-3 mb-1 h-8 flex items-center gap-1.5 mono text-[#5c5c58] hover:text-white transition-colors" style={{ fontSize: "0.68rem" }}>
              <ChevronsLeft className="w-4 h-4" strokeWidth={1.7} />
              recolher
            </button>
          )}
          <div className={`py-4 border-t border-[var(--line)] ${navMenor ? "px-3" : "px-5"}`}>
            <Placar p={data.placar} menor={navMenor} />
            {navMenor ? (
              <button
                onClick={logout}
                title="sair da sessão"
                aria-label="sair da sessão"
                className="w-10 h-10 mt-4 mx-auto flex items-center justify-center rounded-lg border border-[var(--line)] hover:border-white/20 hover:text-white text-[#7d7d78] transition-colors"
              >
                <LogOut className="w-[18px] h-[18px]" strokeWidth={1.7} />
              </button>
            ) : (
              <button
                onClick={logout}
                className="w-full mt-4 flex items-center justify-center gap-2 mono py-2.5 rounded-lg border border-[var(--line)] hover:border-white/20 hover:text-white text-[#7d7d78] transition-colors"
                style={{ fontSize: "0.66rem" }}
              >
                sair da sessão
              </button>
            )}
            {navMenor && (
              <button onClick={() => setNavMenor(false)} title="expandir menu" aria-label="expandir menu"
                className="w-10 h-10 mt-3 mx-auto flex items-center justify-center rounded-lg border border-[var(--line)] text-[#5c5c58] hover:text-white transition-colors">
                <ChevronsRight className="w-4 h-4" strokeWidth={1.7} />
              </button>
            )}
          </div>
        </aside>

        {/* ===== coluna do app ===== */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* top app bar (mobile < 1024) */}
          <header
            className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-4 border-b border-[var(--line)] bg-[rgba(10,10,11,.82)] backdrop-blur-2xl"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)", paddingBottom: "10px" }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Triangle className="w-[16px] h-[16px] text-[#FF4000] shrink-0" />
              <span className="text-[.92rem] font-medium tracking-[-.02em] leading-none truncate">Agência</span>
              <span className="mono truncate">{activeNav.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="mono text-[#3ddc84] tabular-nums">{data.placar.progresso}%</span>
              <span className="text-[.72rem] text-[#8a8a85]">R$ {Math.round(data.placar.acumulado / 1000)}k</span>
            </div>
          </header>

          {/* conteúdo */}
          <main className="flex-1 min-w-0 px-5 md:px-8 lg:px-10 pt-6 lg:pt-10 pb-24 lg:pb-14">
            <div className="max-w-[var(--content-max)] mx-auto">
              {/* header — padrão studio (título + subtítulo) */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease }}
                className="mb-8"
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mono mb-3">{activeNav.label}</div>
                    <h1 className="text-[clamp(1.5rem,2.6vw,1.75rem)] font-semibold tracking-[-.025em] leading-tight text-balance">
                      {VIEW_META[view]?.titulo}
                    </h1>
                    <p className="text-[.875rem] text-[var(--muted)] mt-2 max-w-[620px] leading-relaxed">
                      {VIEW_META[view]?.sub}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 pt-1">
                    <button onClick={() => go("demandas")}
                      className="flex items-center gap-2 h-[42px] px-4 rounded-xl bg-[#06b6d4]/12 border border-[#06b6d4]/30 text-[#22c8e5] text-[.8rem] font-semibold transition-colors hover:bg-[#06b6d4]/20">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      nova demanda
                    </button>
                    <button onClick={() => { localStorage.setItem("prospeccao.auto-start", "1"); go("pipeline"); }}
                      className="flex items-center gap-2 h-[42px] px-4 rounded-xl bg-[#FF4000] hover:bg-[#ff5c22] text-[var(--accent-ink)] text-[.8rem] font-semibold transition-colors">
                      prospecção
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* corpo */}
              <AnimatePresence mode="wait">
                {(
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.45, ease }}
                  >
                    {view === "comando" && (
                      <div>
                        {/* sub-abas + ferramentas (referência: Overview/Cohorts + busca + intervalo) */}
                        <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] mb-6">
                          <div className="flex items-center gap-6">
                            {([["visao", "Visão geral"], ["atividade", "Atividade"]] as const).map(([id, lab]) => (
                              <button
                                key={id}
                                onClick={() => setHomeTab(id)}
                                className={`relative pb-3 text-[.9rem] transition-colors ${homeTab === id ? "text-white font-medium" : "text-[#8d8d88] hover:text-[#bfbeb8]"}`}
                              >
                                {lab}
                                {homeTab === id && (
                                  <motion.span layoutId="home-tab" className="absolute left-0 -bottom-px h-[2px] w-full bg-[#FF4000]" transition={{ duration: 0.35, ease }} />
                                )}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 pb-2">
                            {homeTab === "visao" && (
                              <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--line)] bg-white/[.02] focus-within:border-[#FF4000]/50 transition-colors">
                                <Search className="w-3.5 h-3.5 text-[#6b6b66]" />
                                <input
                                  value={homeQuery}
                                  onChange={(e) => setHomeQuery(e.target.value)}
                                  placeholder="Buscar lead, segmento…"
                                  aria-label="Buscar lead"
                                  className="bg-transparent outline-none text-[.8rem] w-[180px] placeholder:text-[#6b6b66]"
                                />
                              </div>
                            )}
                            <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--line)] text-[#8d8d88]">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="mono" style={{ fontSize: "0.62rem" }}>últimos 30 dias</span>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence mode="wait">
                          <motion.div key={homeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease }}>
                            {homeTab === "visao" ? (
                              <div className="space-y-3">
                                {/* KPIs (referência: 4 cards com número grande + sparkline) */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                  <Kpi label="faturado" value={fmt(data.placar.acumulado)} color="#3ddc84" progress={data.placar.progresso} sub={`${data.placar.progresso}% · meta R$ 100k`} onClick={() => go("analytics")} />
                                  <Kpi label="leads ativos" value={ativos.length} spark={funil} sub={`${funil[0]} em prospecção`} onClick={() => go("pipeline")} />
                                  <Kpi label="em andamento" value={fazendo} spark={data.kanban.map((c) => c.itens.length)} sub={`máx. 2 · ${feitos} entregues`} onClick={() => go("kanban")} />
                                  <Kpi label="pageviews" value={data.rastreamento.total} spark={sitesArr.map((s) => s.n)} sub={`${sitesArr.length} sites com pixel`} onClick={() => go("analytics")} />
                                </div>

                                {/* 2 gráficos (referência: linha + barras) */}
                                <div className="grid lg:grid-cols-2 gap-3">
                                  <div className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
                                    <div className="flex items-start justify-between mb-4">
                                      <div>
                                        <h2 className="text-[1rem] font-semibold tracking-[-.01em]">Funil de prospecção</h2>
                                        <p className="mono mt-1" style={{ fontSize: "0.62rem" }}>leads por estágio</p>
                                      </div>
                                      <span className="mono" style={{ fontSize: "0.62rem", color: "#8d8d88" }}>{ativos.length} ativos</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <ChartLine series={funil} labels={ESTAGIOS} gid="funil" />
                                    </div>
                                  </div>
                                  <div className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
                                    <div className="flex items-start justify-between mb-4">
                                      <div>
                                        <h2 className="text-[1rem] font-semibold tracking-[-.01em]">Tráfego por site</h2>
                                        <p className="mono mt-1" style={{ fontSize: "0.62rem" }}>pageviews · pixel</p>
                                      </div>
                                      <span className="mono" style={{ fontSize: "0.62rem", color: "#8d8d88" }}>{data.rastreamento.total} total</span>
                                    </div>
                                    {sitesArr.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <ChartBars series={sitesArr.map((s) => s.n)} labels={sitesArr.map((s) => shortDom(s.dom))} />
                                      </div>
                                    ) : (
                                      <div className="h-[200px] grid place-items-center text-[.8rem] text-[#6b6b66]">sem pageviews ainda</div>
                                    )}
                                  </div>
                                </div>

                                {/* tabela de leads (referência: At-Risk Subscriber Cohorts) */}
                                <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
                                  <div className="flex items-center justify-between gap-3 px-5 sm:px-6 pt-5 pb-4">
                                    <h2 className="text-[1.02rem] font-semibold tracking-[-.01em]">Leads no funil</h2>
                                    <span className="mono" style={{ fontSize: "0.64rem" }}>{cohortsF.length} de {ativos.length}</span>
                                  </div>
                                  <div className="hidden md:grid grid-cols-[1.7fr_.6fr_1.3fr_.6fr_.85fr_28px] gap-3 px-6 pb-2 mono" style={{ fontSize: "0.58rem" }}>
                                    <span>Lead</span><span>Nota</span><span>Estágio</span><span>Aval.</span><span>Prioridade</span><span aria-hidden="true"></span>
                                  </div>
                                  <div>
                                    {cohortsF.map((l) => (
                                      <button
                                        key={l.id}
                                        onClick={() => go("pipeline")}
                                        className="w-full text-left flex items-center justify-between gap-3 md:grid md:grid-cols-[1.7fr_.6fr_1.3fr_.6fr_.85fr_28px] md:gap-3 md:items-center px-6 py-3.5 border-t border-[var(--line)] hover:bg-white/[.02] transition-colors"
                                      >
                                        <div className="min-w-0 flex-1 md:flex-none">
                                          <div className="text-[.9rem] font-medium truncate">{l.nome}</div>
                                          <div className="mono truncate" style={{ fontSize: "0.6rem" }}>{[l.segmento, l.cidade].filter(Boolean).join(" · ") || "-"}</div>
                                        </div>
                                        <div className="nums text-[.9rem] hidden md:block">{Number(l.nota) ? Number(l.nota).toFixed(1) : "-"}</div>
                                        <div className="hidden md:flex items-center gap-2 min-w-0">
                                          <div className="flex-1 h-[6px] rounded-full bg-white/8 overflow-hidden max-w-[120px]">
                                            <div className="h-full rounded-full" style={{ width: `${(l.estagio / 5) * 100}%`, background: ESTAGIO_CORES[l.estagio] || "#FF4000" }} />
                                          </div>
                                          <span className="mono whitespace-nowrap" style={{ fontSize: "0.58rem" }}>{ESTAGIOS[l.estagio] || "-"}</span>
                                        </div>
                                        <div className="nums text-[.85rem] hidden md:block">{l.avaliacoes || "-"}</div>
                                        <div className="shrink-0 md:justify-self-start">
                                          <span className="nums inline-block px-2 py-1 rounded-md" style={{ fontSize: "0.72rem", color: "#FF4000", background: "rgba(255,64,0,.12)", border: "1px solid rgba(255,64,0,.25)" }}>{l.score.toFixed(2)}</span>
                                        </div>
                                        <MoreHorizontal className="w-4 h-4 text-[#6b6b66] hidden md:block md:justify-self-end" />
                                      </button>
                                    ))}
                                    {cohortsF.length === 0 && (
                                      <div className="px-6 py-8 text-center text-[.82rem] text-[#6b6b66] border-t border-[var(--line)]">
                                        Nenhum lead {homeQuery ? `para “${homeQuery}”` : "ativo"}.
                                      </div>
                                    )}
                                  </div>
                                  <div className="px-6 py-4 border-t border-[var(--line)] flex items-start gap-2 text-[#8d8d88]">
                                    <Info className="w-3.5 h-3.5 text-[#FF4000] shrink-0 mt-0.5" />
                                    <span className="text-[.74rem] leading-relaxed">Prioridade combina a nota do Google e o estágio no funil. Toque num lead para abrir a Prospecção.</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {/* funil em carrossel (shadcn/ui) */}
                                <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] p-5 sm:p-6">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="mono" style={{ fontSize: "0.68rem" }}>funil rápido · swipe</div>
                                    <span className="mono" style={{ fontSize: "0.7rem" }}>{ativos.length} leads</span>
                                  </div>
                                  <Carousel opts={{ align: "start" }} className="w-full">
                                    <CarouselContent className="-ml-3">
                                      {[0, 1, 2, 3, 4, 5].map((si) => {
                                        const cor = ESTAGIO_CORES[si];
                                        const nome = ["Prospecção", "Aprovação", "Contato", "Negociação", "Desenvolvimento", "Entrega"][si];
                                        const n = ativos.filter((l) => l.estagio === si).length;
                                        return (
                                          <CarouselItem key={si} className="pl-3 basis-1/2 lg:basis-1/3">
                                            <button onClick={() => go("pipeline")} className="w-full text-left p-4 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] hover:border-white/18 transition-colors h-full">
                                              <div className="flex items-center gap-2.5 mb-3">
                                                <span className="w-6 h-6 rounded-lg grid place-items-center mono text-[var(--accent-ink)]" style={{ fontSize: "0.68rem", background: cor }}>{si}</span>
                                                <span className="text-[.86rem] font-medium tracking-[-.01em] truncate">{nome}</span>
                                              </div>
                                              <div className="text-[1.6rem] leading-none font-semibold tracking-[-.03em] tabular-nums">{n}</div>
                                              <div className="mono mt-1.5" style={{ fontSize: "0.68rem" }}>no estágio · toca pra abrir</div>
                                            </button>
                                          </CarouselItem>
                                        );
                                      })}
                                    </CarouselContent>
                                    <CarouselPrevious className="hidden sm:flex -left-4" />
                                    <CarouselNext className="hidden sm:flex -right-4" />
                                  </Carousel>
                                </div>

                                {data.comando.map((s, i) => (
                                  <motion.section key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i, duration: 0.5, ease }}>
                                    {s.h && <h2 className="mono mb-4" style={{ color: "#8a8a85" }}>{s.h}</h2>}
                                    <div className="card p-6 sm:p-8"><Md html={s.html} /></div>
                                  </motion.section>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    )}

                    {view === "kanban" && (
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin items-start">
                        {data.kanban.map((c, ci) => (
                          <div
                            key={ci}
                            className={`w-[300px] shrink-0 flex flex-col rounded-2xl border bg-[var(--bg-1)] p-3 max-h-[calc(100vh-15rem)] transition-colors ${
                              kanOver === ci ? "border-[var(--accent)]" : "border-[var(--line)]"
                            }`}
                            onDragOver={(e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setKanOver(ci); }}
                            onDragLeave={() => setKanOver((v) => (v === ci ? null : v))}
                            onDrop={(e: React.DragEvent) => {
                              e.preventDefault();
                              const raw = e.dataTransfer.getData("text/plain");
                              if (!raw || !kanDragging) return;
                              const [from, text] = JSON.parse(raw);
                              setKanDragging(null); setKanOver(null);
                              if (from === c.nome) return;
                              api("/api/kanban", { action: "move", from, to: c.nome, text });
                            }}
                          >
                            <div className="flex items-center justify-between px-2 pt-1 pb-3">
                              <span className="label">{c.nome}</span>
                              <span className="chip nums">{String(c.itens.length).padStart(2, "0")}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto scrollbar-thin px-1 space-y-2.5">
                              {c.itens.map((it, ii) => {
                                const kid = JSON.stringify([c.nome, it.text]);
                                return (
                                  <div
                                    key={ii}
                                    style={{ opacity: kanDragging === kid ? 0.4 : 1 }}
                                    draggable
                                    onDragStart={(e: React.DragEvent) => { e.dataTransfer.setData("text/plain", kid); e.dataTransfer.effectAllowed = "move"; setKanDragging(kid); }}
                                    onDragEnd={() => { setKanDragging(null); setKanOver(null); }}
                                    className={`group rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-3.5 transition-colors hover:border-[var(--line-2)] cursor-grab active:cursor-grabbing ${it.done ? "opacity-55" : ""}`}
                                  >
                                    <p className={`text-[.84rem] leading-relaxed text-[var(--ink-2)] ${it.done ? "line-through" : ""}`}>{it.text}</p>
                                    <div className="mt-3 flex gap-1.5 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 transition-opacity">
                                      <Btn title={it.done ? "reabrir" : "concluir"} color={it.done ? "#3ddc84" : undefined} onClick={() => api("/api/kanban", { action: "toggle", column: c.nome, text: it.text })}>{it.done ? "↺" : "✓"}</Btn>
                                      <Btn title="voltar" onClick={() => ci > 0 && api("/api/kanban", { action: "move", from: c.nome, to: COLS[ci - 1], text: it.text })}>←</Btn>
                                      <Btn title="avançar" onClick={() => ci < COLS.length - 1 && api("/api/kanban", { action: "move", from: c.nome, to: COLS[ci + 1], text: it.text })}>→</Btn>
                                      <span className="ml-auto" />
                                      <Btn title="excluir cartão" color="#ff6b4a" onClick={() => { if (confirm(`Excluir o cartão "${it.text.slice(0, 80)}"?`)) api("/api/kanban", { action: "delete", column: c.nome, text: it.text }); }}>
                                        <Trash2 className="w-[13px] h-[13px]" strokeWidth={2} />
                                      </Btn>
                                    </div>
                                  </div>
                                );
                              })}
                              {c.itens.length === 0 && (
                                <div className="rounded-xl border border-dashed border-[var(--line)] px-3 py-6 text-center text-[.78rem] text-[var(--dim)]">
                                  Nada aqui: arraste um cartão
                                </div>
                              )}
                            </div>
                            <div className="pt-2.5">
                              <AddCard onAdd={(text) => api("/api/kanban", { action: "add", column: c.nome, text })} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {view === "demandas" && (
                      <div className="space-y-6 mt-6">
                        <h2 className="label">Time</h2>
                        <div className="grid gap-5 md:grid-cols-2">
                          {data.agentes.map((a, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.07 * i, duration: 0.5, ease }}
                            className="bg-[var(--bg-2)] border border-[var(--line)] rounded-2xl p-7 sm:p-8 hover:border-white/13 transition-colors group"
                          >
                            <div className="flex items-center gap-4 mb-6">
                              <AgentAvatar nome={a.nome} cor={CORES[i % CORES.length]} size={68} />
                              <div className="min-w-0">
                                <div className="text-[1.2rem] font-medium tracking-[-.02em] leading-none">{a.nome}</div>
                                <div className="mono mt-2" style={{ fontSize: "0.68rem" }}>{a.departamento}</div>
                              </div>
                              {a.comando && (
                                <span className="ml-auto shrink-0 font-mono text-[.72rem] text-[#3ddc84] bg-[#3ddc84]/8 border border-[#3ddc84]/15 rounded-lg px-2.5 py-1">{a.comando}</span>
                              )}
                            </div>
                            <div className="border-t border-[var(--line)] pt-5 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                              <Md html={a.html} />
                            </div>
                          </motion.div>
                        ))}
                        </div>
                      </div>
                    )}

                    {view === "comando" && (
                      <div className="space-y-8 mt-6">
                        <h2 className="label">Caixa</h2>
                        {data.inbox.map((s, i) => (
                          <div key={i}>
                            {s.h && <h2 className="mono mb-4" style={{ color: "#8a8a85" }}>{s.h}</h2>}
                            <div className="card p-6 sm:p-8"><Md html={s.html} /></div>
                          </div>
                        ))}
                        <div className="card p-6">
                          <label className="mono block mb-3" style={{ fontSize: "0.68rem" }}>Nova ideia</label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              value={inboxText}
                              onChange={(e) => setInboxText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && inboxText.trim()) { api("/api/inbox", { text: inboxText.trim() }); setInboxText(""); } }}
                              placeholder="O que você quer que eu averigue?"
                              aria-label="Nova ideia"
                              className="field-input flex-1"
                            />
                            <button
                              onClick={() => { if (inboxText.trim()) { api("/api/inbox", { text: inboxText.trim() }); setInboxText(""); } }}
                              disabled={busy}
                              className="h-[52px] px-6 bg-[#FF4000] hover:bg-[#ff5c22] disabled:opacity-60 text-white rounded-[14px] text-[.9rem] font-medium transition-colors"
                            >
                              Jogar
                            </button>
                          </div>
                          <p className="mono mt-3" style={{ fontSize: "0.66rem" }}>vai direto pro vault · 10 INBOX.md</p>
                        </div>
                      </div>
                    )}

                    {view === "demandas" && (
                      <div className="space-y-6 mt-6">
                        <h2 className="label">Fila</h2>
                        {data.backlog.map((s, i) => (
                          <div key={i}>
                            {s.h && <h2 className="mono mb-4" style={{ color: "#8a8a85" }}>{s.h}</h2>}
                            <div className="card p-6 sm:p-8"><Md html={s.html} /></div>
                          </div>
                        ))}
                      </div>
                    )}

                    {view === "pipeline" && <Pipeline leads={data.pipeline} refresh={load} />}

                    {view === "demandas" && <Demandas agentes={data.agentes} />}

                    {view === "arquivos" && <Files />}

                    {view === "analytics" && (
                      <div className="space-y-6">
                        <Analytics sites={data.rastreamento.sites} leads={data.pipeline} siteAlvo="evertonbrito.com" />
                        <Rastreamento data={data.rastreamento} site="evertonbrito.com" />
                        <Financas p={data.placar} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* ===== assistente transversal (⌘K / botão flutuante) ===== */}
        <button
          onClick={() => setChatOpen(true)}
          aria-label="abrir assistente"
          className="fixed z-40 right-4 lg:right-6 bottom-[88px] lg:bottom-6 h-11 px-5 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-[.82rem] shadow-[var(--shadow-overlay)] hover:bg-[var(--accent-2)] transition-colors inline-flex items-center gap-2"
        >
          <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.9} />
          <span className="hidden sm:inline">Assistente</span>
        </button>

        <AnimatePresence>
          {chatOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setChatOpen(false)}
              />
              <motion.aside
                className="fixed top-0 right-0 z-50 h-screen w-full sm:w-[440px] bg-[var(--bg-1)] border-l border-[var(--line)] flex flex-col"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.28, ease }}
                role="dialog"
                aria-label="assistente"
              >
                <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-[var(--line)]">
                  <span className="label">Assistente</span>
                  <button
                    onClick={() => setChatOpen(false)}
                    aria-label="fechar assistente"
                    className="w-9 h-9 grid place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--line-2)] transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-5"><Chat /></div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ===== bottom tab bar (mobile < 1024) ===== */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--line)] bg-[rgba(10,10,11,.86)] backdrop-blur-2xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="navegação"
        >
          <div className="grid grid-cols-5">
            {TABS.map((t) => {
              const isMore = t.id === "mais";
              const active = isMore ? moreOpen || MORE_IDS.includes(view) : view === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => (isMore ? setMoreOpen(true) : go(t.id))}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center justify-center gap-1 h-16 transition-colors ${
                    active ? "text-white" : "text-[#5c5c58] hover:text-[#b8b8b3]"
                  }`}
                >
                  <span className={`absolute top-0 w-8 h-[3px] rounded-b-full transition-colors ${active ? "bg-[#FF4000]" : "bg-transparent"}`} />
                  {(() => { const Icon = ICONS[t.id]; return <Icon className={`w-6 h-6 ${active ? "text-[#FF4000]" : ""}`} strokeWidth={1.8} />; })()}
                  <span className="text-[.75rem] tracking-tight leading-none">{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ===== sheet "Mais" (mobile) ===== */}
        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMoreOpen(false)}
              />
              <motion.div
                className="fixed bottom-0 inset-x-0 z-50 lg:hidden rounded-t-[24px] border-t border-[var(--line)] bg-[var(--bg-2)] max-h-[82vh] overflow-y-auto"
                style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
                initial={{ y: 90, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.32, ease }}
                role="dialog"
                aria-label="mais opções"
              >
                <div className="sticky top-0 z-10 bg-[var(--bg-2)]/95 backdrop-blur px-5 pt-4 pb-3 flex items-center justify-between border-b border-[var(--line)]">
                  <span className="mono">Mais</span>
                  <button
                    onClick={() => setMoreOpen(false)}
                    aria-label="fechar"
                    className="w-9 h-9 grid place-items-center rounded-lg border border-white/10 text-[#b8b8b3] hover:text-white hover:border-white/25 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 space-y-1">
                  {MORE_IDS.map((id) => {
                    const n = NAV.find((x) => x.id === id)!;
                    const active = view === id;
                    return (
                      <button
                        key={id}
                        onClick={() => go(id)}
                        className={`w-full flex items-center gap-3.5 px-3.5 py-4 rounded-xl text-left transition-colors ${
                          active ? "text-white bg-white/5" : "text-[#b8b8b3] hover:bg-white/4"
                        }`}
                      >
                        {(() => { const Icon = ICONS[id]; return <Icon className="w-[19px] h-[19px] shrink-0" strokeWidth={1.7} />; })()}
                        <span className="text-[.9rem] tracking-[-.01em]">{n.label}</span>
                        {active && <span className="ml-auto text-[#FF4000] text-[.7rem]">●</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="px-4 pb-4">
                  <div className="bg-white/4 border border-[var(--line)] rounded-2xl p-4 mb-3 mt-1">
                    <Placar p={data.placar} />
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 mono py-3.5 rounded-xl border border-[var(--line)] hover:border-white/20 hover:text-white text-[#8a8a85] transition-colors"
                    style={{ fontSize: "0.7rem" }}
                  >
                    sair da sessão
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

// ---------- peças ----------
function Btn({ children, title, color, onClick }: { children: React.ReactNode; title: string; color?: string; onClick: () => void }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className="w-11 h-11 sm:w-9 sm:h-9 lg:w-[24px] lg:h-[24px] grid place-items-center text-[.72rem] rounded-lg border border-white/12 text-[#8a8a85] hover:text-white hover:border-white/30 active:bg-white/8 transition-all"
      style={color ? { color, borderColor: color + "55" } : undefined}
    >
      {children}
    </button>
  );
}

function AddCard({ onAdd }: { onAdd: (text: string) => void }) {
  const [t, setT] = useState("");
  return (
    <div className="flex gap-2 mt-auto pt-1">
      <input
        value={t}
        onChange={(e) => setT(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && t.trim()) { onAdd(t.trim()); setT(""); } }}
        placeholder="novo cartão…"
        aria-label="novo cartão"
        className="flex-1 h-11 sm:h-10 bg-white/3 border border-[var(--line)] rounded-lg text-[.78rem] px-3.5 outline-none focus:border-[#FF4000]/60 placeholder:text-[#5d5d58] transition-colors"
      />
      <button onClick={() => { if (t.trim()) { onAdd(t.trim()); setT(""); } }} aria-label="adicionar" className="h-11 sm:h-10 px-4 sm:px-5 bg-[#FF4000] hover:bg-[#ff5c22] text-white rounded-lg text-[.82rem] font-medium transition-colors">
        +
      </button>
    </div>
  );
}

// ---------- finanças (InfinitePay) ----------
type LinkReg = {
  id: string; data: string; descricao: string; valor: number; quantidade: number;
  url: string | null; handle: string; ok: boolean; erro?: string;
  order_nsu?: string; slug?: string; paid?: boolean; paidAt?: string; capture_method?: string;
};
function Financas({ p }: { p: Data["placar"] }) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [qtd, setQtd] = useState("1");
  const [nomeCli, setNomeCli] = useState("");
  const [emailCli, setEmailCli] = useState("");
  const [telCli, setTelCli] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");
  const [criado, setCriado] = useState<LinkReg | null>(null);
  const [historico, setHistorico] = useState<LinkReg[]>([]);
  const [handle, setHandle] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const carregar = async () => {
    try {
      const r = await fetch("/api/financas");
      if (r.status === 401) { location.href = "/login"; return; }
      const j = await r.json();
      setHandle(j.handle || null);
      setHistorico(j.historico || []);
    } catch { /* offline */ }
  };
  useEffect(() => { carregar(); }, []);

  async function gerar() {
    setErro(""); setCriado(null);
    if (!descricao.trim()) { setErro("Dê uma descrição para a cobrança."); return; }
    if (!valor || Number(valor) <= 0) { setErro("Informe um valor válido (R$)."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/financas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link", descricao: descricao.trim(), valor: Number(String(valor).replace(",", ".")), quantidade: Number(qtd) || 1, customer: { nome: nomeCli.trim(), email: emailCli.trim(), telefone: telCli.trim() } }),
      });
      const j = await r.json();
      if (j.ok && j.registro?.url) { setCriado(j.registro); carregar(); }
      else setErro(j.erro || "Não foi possível gerar o link.");
    } catch { setErro("Falha de rede."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      {/* placar grande */}
      <div className="card p-6">
        <div className="mono mb-3">Faturamento acumulado</div>
        <div className="text-[clamp(2.4rem,6vw,3.6rem)] leading-none font-medium tracking-[-.04em] text-[#3ddc84] tabular-nums">
          {fmt(p.acumulado)}
        </div>
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 h-[4px] rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className="h-full bg-[#3ddc84]"
              initial={{ width: 0 }}
              animate={{ width: Math.min(100, p.progresso) + "%" }}
              transition={{ duration: 1.2, ease }}
            />
          </div>
          <span className="mono tabular-nums" style={{ fontSize: "0.68rem" }}>{p.progresso}% · meta R$ 100k</span>
        </div>
        <p className="mono mt-4" style={{ fontSize: "0.7rem" }}>fase atual · {p.fase || "-"}</p>
      </div>

      {/* gerar link de pagamento (InfinitePay) */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-3 justify-between mb-5">
          <div>
            <div className="text-[1.05rem] font-medium tracking-[-.01em]">Link de pagamento <span className="text-[#3ddc84]">Pix</span></div>
            <p className="text-[.78rem] text-[#8a8a85] mt-1">
              {handle
                ? <>conta conectada · handle <b className="text-[#b8b8b3]">${handle}</b> · webhook ativo: <span className="text-[#b8b8b3]">app.evertonbrito.com/api/infinitepay/webhook</span></>
                : "conta não conectada: coloque INFINITEPAY_HANDLE no .env.local da agência"}
            </p>
          </div>
          {handle && <span className="mono px-2.5 py-1.5 rounded-lg bg-[#3ddc84]/10 border border-[#3ddc84]/25 text-[#3ddc84]" style={{ fontSize: "0.66rem" }}>online</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block sm:col-span-1">
            <span className="mono block mb-2" style={{ fontSize: "0.66rem" }}>O que é</span>
            <input
              value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder="ex.: LP · Clínica X"
              className="w-full h-[50px] bg-white/3 border border-[var(--line)] rounded-xl px-4 text-[.92rem] text-[#f7f7f5] outline-none focus:border-[#FF4000]/70 transition-colors placeholder:text-[#5d5d58]"
            />
          </label>
          <label className="block">
            <span className="mono block mb-2" style={{ fontSize: "0.66rem" }}>Valor (R$)</span>
            <input
              value={valor} onChange={(e) => setValor(e.target.value)} placeholder="1997" inputMode="decimal"
              className="w-full h-[50px] bg-white/3 border border-[var(--line)] rounded-xl px-4 text-[.92rem] text-[#f7f7f5] outline-none focus:border-[#FF4000]/70 transition-colors placeholder:text-[#5d5d58]"
            />
          </label>
          <label className="block">
            <span className="mono block mb-2" style={{ fontSize: "0.66rem" }}>Qtd.</span>
            <input
              value={qtd} onChange={(e) => setQtd(e.target.value)} inputMode="numeric" aria-label="quantidade"
              className="w-full h-[50px] bg-white/3 border border-[var(--line)] rounded-xl px-4 text-[.92rem] text-[#f7f7f5] outline-none focus:border-[#FF4000]/70 transition-colors placeholder:text-[#5d5d58]"
            />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <label className="block">
            <span className="mono block mb-2" style={{ fontSize: "0.66rem" }}>Cliente (opcional)</span>
            <input value={nomeCli} onChange={(e) => setNomeCli(e.target.value)} placeholder="Nome" className="w-full h-[50px] bg-white/3 border border-[var(--line)] rounded-xl px-4 text-[.92rem] text-[#f7f7f5] outline-none focus:border-[#FF4000]/70 transition-colors placeholder:text-[#5d5d58]" />
          </label>
          <label className="block">
            <span className="mono block mb-2" style={{ fontSize: "0.66rem" }}>E-mail</span>
            <input value={emailCli} onChange={(e) => setEmailCli(e.target.value)} placeholder="cliente@…" inputMode="email" className="w-full h-[50px] bg-white/3 border border-[var(--line)] rounded-xl px-4 text-[.92rem] text-[#f7f7f5] outline-none focus:border-[#FF4000]/70 transition-colors placeholder:text-[#5d5d58]" />
          </label>
          <label className="block">
            <span className="mono block mb-2" style={{ fontSize: "0.66rem" }}>Telefone</span>
            <input value={telCli} onChange={(e) => setTelCli(e.target.value)} placeholder="+55 71 …" inputMode="tel" className="w-full h-[50px] bg-white/3 border border-[var(--line)] rounded-xl px-4 text-[.92rem] text-[#f7f7f5] outline-none focus:border-[#FF4000]/70 transition-colors placeholder:text-[#5d5d58]" />
          </label>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
          <button
            onClick={gerar} disabled={busy || !handle}
            className="h-[50px] px-6 rounded-[14px] bg-[#FF4000] hover:bg-[#ff5c22] disabled:opacity-50 text-white text-[.88rem] font-medium transition-colors"
          >
            {busy ? "gerando…" : "gerar link de pagamento"}
          </button>
          {erro && <span className="text-[.8rem] text-[#fb7185]">{erro}</span>}
        </div>

        {criado?.url && (
          <div className="mt-5 bg-[#3ddc84]/6 border border-[#3ddc84]/20 rounded-2xl p-5">
            <div className="mono mb-2 text-[#3ddc84]">link gerado · clique pra enviar / copiar</div>
            <a href={criado.url} target="_blank" rel="noreferrer" className="block text-[.92rem] text-[#54b8f0] hover:text-[#8ad0ff] break-all mb-3">
              {criado.url}
            </a>
            <button
              onClick={async () => { try { await navigator.clipboard.writeText(criado.url!); } catch {} setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="h-[44px] px-5 rounded-xl border border-white/12 text-[#e8e8e6] hover:border-white/28 transition-colors"
            >
              {copied ? "copiado ✓" : "copiar link"}
            </button>
          </div>
        )}
      </div>

      {/* histórico recente */}
      {historico.length > 0 && (
        <div className="card p-6">
          <div className="mono mb-4" style={{ fontSize: "0.66rem" }}>links gerados (últimos)</div>
          <div className="space-y-0">
            {historico.map((h) => (
              <div key={h.id} className="flex items-center gap-4 py-3 border-b border-[var(--line)] last:border-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${h.paid ? "bg-[#3ddc84]" : h.ok ? "bg-[#d9a03a]" : "bg-[#fb7185]"}`} />
                <span className="text-[.85rem] truncate flex-1">{h.descricao}</span>
                {h.paid ? (
                  <span className="mono px-2 py-1 rounded-md bg-[#3ddc84]/10 border border-[#3ddc84]/25 text-[#3ddc84] shrink-0" style={{ fontSize: "0.7rem" }}>✓ pago{h.capture_method ? ` · ${h.capture_method}` : ""}</span>
                ) : h.ok ? (
                  <span className="mono shrink-0" style={{ fontSize: "0.7rem", color: "#d9a03a" }}>aguardando pagamento</span>
                ) : (
                  <span className="mono shrink-0" style={{ fontSize: "0.7rem", color: "#fb7185" }}>falhou</span>
                )}
                <span className="mono tabular-nums shrink-0" style={{ fontSize: "0.66rem" }}>R$ {h.valor.toLocaleString("pt-BR")}</span>
                <span className="mono text-[#5d5d58] hidden sm:block shrink-0" style={{ fontSize: "0.68rem" }}>{h.data}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* roteiro do módulo */}
      <div className="card p-6">
        <div className="mono mb-5" style={{ fontSize: "0.66rem" }}>próximos passos do módulo</div>
        <div className="space-y-0">
          {[
            ["Recebimentos", "consultar status do link (payment_check) e marcar como pago no placar", "#3ddc84"],
            ["Placar automático", "faturamento entra direto quando o pagamento confirmar", "#54b8f0"],
            ["QR code", "mostrar o Pix na tela do app pro cliente escanear", "#d9a03a"],
            ["MRR", "recorrências (R$ 350 a 500/mês) cobradas no dia certo", "#a86ff0"],
          ].map(([t, d, c], i) => (
            <div key={i} className="flex items-start gap-4 py-3.5 border-b border-[var(--line)] last:border-0">
              <span className="mono w-6 h-6 shrink-0 rounded-lg grid place-items-center text-[var(--accent-ink)] mt-0.5" style={{ fontSize: "0.66rem", background: c }}>{i}</span>
              <div>
                <div className="text-[.9rem] font-medium tracking-[-.01em]">{t}</div>
                <p className="text-[.78rem] text-[#8a8a85] mt-0.5">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}