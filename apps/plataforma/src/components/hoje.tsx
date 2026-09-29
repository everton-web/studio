"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, RotateCcw, AlertTriangle, ShieldAlert } from "lucide-react";
import { AGENTES, CORES } from "./demandas";

type Demanda = {
  id: string;
  titulo: string;
  persona: string;
  status: string;
  prazo: string;
  cliente: string;
  log: string[];
};
type Reuniao = { id: string; titulo: string; quando: string; duracao: number; participante: string; criada_em: string };
type Saude = {
  slug: string;
  cliente: string;
  no_ar: boolean | null;
  certificado_dias: number | null;
  formulario: string | null;
  verificado_em: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

const nomeAgente = (id: string) => AGENTES.find((a) => a.id === id)?.nome || id || "orion";
const corAgente = (id: string) => CORES[id] || "#8a8a85";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function diaDe(q: string) {
  return (q || "").slice(0, 10);
}
function fmtCurto(q: string) {
  const s = diaDe(q);
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}`;
}
function fmtHora(q: string) {
  const t = (q || "").match(/T(\d{2}):(\d{2})/);
  return t ? `${t[1]}:${t[2]}` : "";
}
function fmtChecado(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtMoeda(v: number) {
  return "R$ " + Math.round(v).toLocaleString("pt-BR");
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <h2 className="mono mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

export function Hoje({ placar }: { placar: { progresso: number; acumulado: number; meta: number; fase: string } }) {
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [saude, setSaude] = useState<Saude[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [ro, ra, rs] = await Promise.all([
        fetch("/api/orquestra"),
        fetch("/api/agenda"),
        fetch("/api/saude"),
      ]);
      if ([ro, ra, rs].some((r) => r.status === 401)) {
        location.href = "/login";
        return;
      }
      const [jo, ja, js] = await Promise.all([ro.json(), ra.json(), rs.json()]);
      setDemandas(Array.isArray(jo.fila) ? jo.fila : []);
      setReunioes(Array.isArray(ja.reunioes) ? ja.reunioes : []);
      setSaude(Array.isArray(js.alertas) ? js.alertas : []);
    } catch {
      /* offline */
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const dataExtenso = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const hoje = ymd(new Date());
  const aguardando = demandas.filter((d) => d.status === "aguardando_everton");
  const emAndamento = demandas.filter((d) => d.status === "em_andamento");
  const reunioesHoje = reunioes.filter((r) => diaDe(r.quando) === hoje);
  const demandasHoje = demandas.filter((d) => d.prazo && diaDe(d.prazo) === hoje);
  const alertas = saude.filter(
    (s) =>
      s.no_ar === false ||
      (s.certificado_dias != null && s.certificado_dias <= 14) ||
      s.formulario === "falha",
  );

  function agendaDoDia() {
    type Item = { id: string; titulo: string; hora: string; tipo: "reuniao" | "tarefa"; detalhe: string };
    const itens: Item[] = [
      ...reunioesHoje.map((r) => ({
        id: r.id,
        titulo: r.titulo,
        hora: fmtHora(r.quando),
        tipo: "reuniao" as const,
        detalhe: r.participante ? `reunião com ${r.participante}` : "reunião",
      })),
      ...demandasHoje.map((d) => ({
        id: d.id,
        titulo: d.titulo,
        hora: fmtHora(d.prazo),
        tipo: "tarefa" as const,
        detalhe: `tarefa de ${nomeAgente(d.persona)}`,
      })),
    ];
    return itens.sort((a, b) => a.hora.localeCompare(b.hora));
  }

  async function decidir(id: string, action: "aprovar" | "devolver") {
    setBusyId(id + action);
    try {
      await fetch("/api/orquestra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      await load();
    } catch {
      /* offline */
    } finally {
      setBusyId(null);
    }
  }

  const itensDia = agendaDoDia();

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h2 className="text-[clamp(1.3rem,3vw,1.6rem)] font-semibold tracking-[-.025em] leading-tight text-balance">
          {saudacao}, Everton
        </h2>
        <p className="text-[.85rem] text-[var(--muted)] mt-1.5">{dataExtenso}</p>
      </motion.div>

      {carregando ? (
        <div className="text-[.85rem] text-[#8a8a85]">carregando o dia…</div>
      ) : (
        <>
          {/* a) aprovações pendentes */}
          <Bloco titulo="Aprovações pendentes">
            {aguardando.length === 0 ? (
              <div className="text-[.82rem] text-[#6b6b66]">Nada para aprovar agora.</div>
            ) : (
              <div className="space-y-3">
                {aguardando.map((d) => {
                  const motivo = d.log.length > 0 ? d.log[d.log.length - 1] : "";
                  return (
                    <div key={d.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-3.5">
                      <div className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#FF4000" }} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[.9rem] font-medium leading-snug text-balance">{d.titulo}</div>
                          <div className="mono mt-1" style={{ fontSize: "0.64rem" }}>
                            <span style={{ color: corAgente(d.persona) }}>{nomeAgente(d.persona)}</span>
                            {d.prazo ? ` · prazo ${fmtCurto(d.prazo)}` : ""}
                          </div>
                          {motivo && (
                            <p className="text-[.76rem] text-[#9a9a95] mt-1.5 leading-relaxed line-clamp-2">{motivo}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2.5 mt-3">
                        <button
                          onClick={() => decidir(d.id, "aprovar")}
                          disabled={busyId === d.id + "aprovar"}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#FF4000] hover:bg-[#ff5c22] disabled:opacity-60 text-[var(--accent-ink)] text-[.84rem] font-semibold transition-colors"
                        >
                          <Check className="w-4 h-4" strokeWidth={2.2} />
                          aprovar
                        </button>
                        <button
                          onClick={() => decidir(d.id, "devolver")}
                          disabled={busyId === d.id + "devolver"}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-[var(--line-2)] text-[#c4c4c0] hover:text-white disabled:opacity-60 text-[.84rem] font-medium transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" strokeWidth={2} />
                          devolver
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Bloco>

          {/* b) agenda do dia */}
          <Bloco titulo="Agenda do dia">
            {itensDia.length === 0 && emAndamento.length === 0 && aguardando.length === 0 ? (
              <div className="text-[.82rem] text-[#6b6b66] leading-relaxed text-balance">
                Nada agendado para hoje. As demandas aparecem aqui quando o Orion registra uma tarefa ou reunião.
              </div>
            ) : (
              <div className="space-y-4">
                {itensDia.length > 0 && (
                  <div className="space-y-2">
                    {itensDia.map((it) => (
                      <div key={`${it.tipo}-${it.id}`} className="flex items-start gap-3 py-2 border-b border-[var(--line)] last:border-0">
                        <span className="w-14 shrink-0 nums text-[.78rem] text-[var(--ink-2)] pt-0.5">{it.hora || "dia"}</span>
                        <span
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ background: it.tipo === "reuniao" ? "#FF4000" : "#7aa2ff" }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[.86rem] leading-snug truncate">{it.titulo}</div>
                          <div className="mono mt-0.5" style={{ fontSize: "0.62rem" }}>{it.detalhe}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {emAndamento.length > 0 && (
                  <div>
                    <div className="mono mb-2" style={{ fontSize: "0.62rem" }}>Em andamento</div>
                    <div className="space-y-1.5">
                      {emAndamento.map((d) => (
                        <div key={d.id} className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#54b8f0" }} />
                          <div className="min-w-0 flex-1 text-[.84rem] leading-snug truncate">{d.titulo}</div>
                          <span className="mono shrink-0" style={{ fontSize: "0.62rem", color: corAgente(d.persona) }}>
                            {nomeAgente(d.persona)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aguardando.length > 0 && (
                  <div>
                    <div className="mono mb-2" style={{ fontSize: "0.62rem" }}>Esperando você</div>
                    <div className="space-y-1.5">
                      {aguardando.map((d) => (
                        <div key={d.id} className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#FF4000" }} />
                          <div className="min-w-0 flex-1 text-[.84rem] leading-snug truncate">{d.titulo}</div>
                          <span className="mono shrink-0" style={{ fontSize: "0.62rem", color: corAgente(d.persona) }}>
                            {nomeAgente(d.persona)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Bloco>

          {/* c) alertas de cliente */}
          <Bloco titulo="Alertas de cliente">
            {alertas.length === 0 ? (
              <div className="text-[.82rem] text-[#6b6b66] leading-relaxed text-balance">
                Sem alerta de cliente. Nenhum site verificado ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {alertas.map((s) => {
                  const linhas: { texto: string; valor: string }[] = [];
                  if (s.no_ar === false) linhas.push({ texto: "site fora do ar", valor: "offline" });
                  if (s.certificado_dias != null && s.certificado_dias <= 14) {
                    linhas.push({ texto: "certificado a vencer", valor: `${s.certificado_dias} dias` });
                  }
                  if (s.formulario === "falha") linhas.push({ texto: "formulário com falha", valor: "falha" });
                  return (
                    <div key={s.slug} className="rounded-xl border border-[#fb7185]/30 bg-[#fb7185]/6 p-3.5">
                      <div className="flex items-center gap-2">
                        {s.no_ar === false ? (
                          <ShieldAlert className="w-4 h-4 text-[#fb7185] shrink-0" strokeWidth={1.9} />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-[#d9a03a] shrink-0" strokeWidth={1.9} />
                        )}
                        <span className="text-[.88rem] font-medium truncate">{s.cliente}</span>
                        {s.verificado_em && (
                          <span className="mono ml-auto shrink-0" style={{ fontSize: "0.6rem" }}>
                            {fmtChecado(s.verificado_em)}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        {linhas.map((l) => (
                          <div key={l.texto} className="flex items-center gap-2 text-[.78rem] text-[#c4c4c0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#fb7185] shrink-0" />
                            <span>{l.texto}:</span>
                            <span className="nums text-[var(--ink)]">{l.valor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Bloco>

          {/* d) placar */}
          <Bloco titulo="Placar">
            {placar.acumulado === 0 ? (
              <div className="text-[.85rem] text-[#6b6b66]">R$ 0, sem faturamento no mês</div>
            ) : (
              <div>
                <div className="nums text-[clamp(1.6rem,4vw,2.2rem)] leading-none font-semibold text-[#3ddc84]">
                  {fmtMoeda(placar.acumulado)}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-[4px] rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full bg-[#3ddc84]" style={{ width: `${Math.min(100, placar.progresso)}%` }} />
                  </div>
                  <span className="mono shrink-0" style={{ fontSize: "0.66rem" }}>
                    {placar.progresso}%
                  </span>
                </div>
                <p className="mono mt-3" style={{ fontSize: "0.66rem" }}>
                  fase atual · {placar.fase || "-"}
                </p>
              </div>
            )}
          </Bloco>
        </>
      )}
    </div>
  );
}
