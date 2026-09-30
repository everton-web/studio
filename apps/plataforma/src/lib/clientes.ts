// Clientes · lado do app (v3-04). Lê o MESMO modelo de empresa do banco
// (estagio_crm = 'cliente') e monta o card e a gaveta. Valor e recorrência vêm
// da empresa; enquanto não gravados, caem na ficha antiga do vault.
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { getDb } from "./db";
import { briefingDaEmpresa, type BriefingInfo } from "./briefing";
import { cofreConfigurado, listarCredenciais, type CredencialResumo } from "./cofre";
import { contratosDaEmpresa, type ContratoInfo } from "./contrato";
import { atualizarEmpresa, criarEmpresa, lerEmpresa, listarPorEstagio, type Empresa } from "./empresas";
import { hostDoSite, lerValor } from "./formato";
import { lerRegistrosCliente } from "./infinitepay";
import { lerSaude, type SaudeSite } from "./saude";
import { rastreamentoData } from "./vault";

const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const DIR = join(VAULT, "40 Comercial", "Clientes");

export type CardCliente = {
  id: string;
  nome: string;
  segmento: string;
  cidade: string;
  status: string;
  fechadoEm: string | null;
  valorProjeto: number | null;
  recorrencia: number | null;
  site: string | null;
  pageviews: number | null;
};

export type AlertaSaude = { tipo: "fora_do_ar" | "formulario" | "certificado"; dias?: number };

export type Cobranca = {
  id: string;
  descricao: string;
  valor: number;
  status: "pago" | "pendente";
  data: string | null;
  pagoEm: string | null;
  vencimento: string | null;
  tipo: "projeto" | "recorrencia";
};

export type DetalheCliente = CardCliente & {
  saude: (SaudeSite & { alertas: AlertaSaude[] }) | null;
  pixel: { n: number; primeiro: string; ultimo: string } | null;
  clarityUrl: string;
  financeiro: {
    cobrancas: Cobranca[];
    proximosVencimentos: Cobranca[];
    totalPago: number;
    divergencia: { pago: number; esperado: number } | null;
  };
  briefing: BriefingInfo | null;
  cofreAtivo: boolean;
  credenciais: CredencialResumo[];
  contratos: ContratoInfo[];
};

// ---------- ficha antiga do vault (fallback de valor, recorrência e site) ----------
type Ficha = { valor: number | null; recorrencia: number | null; fechadoEm: string | null; site: string | null };

function slug(s: string) {
  return (
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "cliente"
  );
}

function frontmatter(md: string): Record<string, string> {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm: Record<string, string> = {};
  if (!m) return fm;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

async function fichasDoVault(): Promise<Map<string, Ficha>> {
  const mapa = new Map<string, Ficha>();
  let files: string[] = [];
  try {
    files = (await readdir(DIR)).filter((f) => f.toLowerCase().endsWith(".md"));
  } catch {
    return mapa;
  }
  for (const f of files) {
    try {
      const raw = await readFile(join(DIR, f), "utf8");
      const fm = frontmatter(raw);
      if (!fm.status) continue; // ficha de análise, não é cliente
      const site = fm.site || raw.match(/\*\*Site:\*\*\s*(https?:\/\/[^\s)]+)/)?.[1] || null;
      const rec = /\d/.test(fm.recorrencia || "") ? lerValor(fm.recorrencia) : null;
      mapa.set(slug(f.replace(/\.md$/i, "")), {
        valor: lerValor(fm["valor-projeto"]),
        recorrencia: rec,
        fechadoEm: fm["data-fechamento"] || null,
        site,
      });
    } catch {
      /* ficha ilegível */
    }
  }
  return mapa;
}

async function pixelDe(site: string | null): Promise<{ n: number; primeiro: string; ultimo: string } | null> {
  const host = hostDoSite(site);
  if (!host) return null;
  const { sites } = await rastreamentoData();
  const mapa = sites as Record<string, { n: number; primeiro: string; ultimo: string }>;
  const chave = Object.keys(mapa).find((k) => hostDoSite(k) === host);
  const h = chave ? mapa[chave] : null;
  return h && h.n > 0 ? { n: h.n, primeiro: h.primeiro, ultimo: h.ultimo } : null;
}

function montarCard(e: Empresa, ficha: Ficha | undefined, pixel: { n: number } | null): CardCliente {
  const site = e.site || ficha?.site || null;
  return {
    id: e.id,
    nome: e.nome,
    segmento: e.segmento || "",
    cidade: e.cidade || "",
    status: e.status || "",
    fechadoEm: e.fechado_em || ficha?.fechadoEm || null,
    valorProjeto: e.valor_projeto ?? ficha?.valor ?? null,
    recorrencia: e.recorrencia ?? ficha?.recorrencia ?? null,
    site,
    pageviews: pixel ? pixel.n : null,
  };
}

export async function listarClientes(): Promise<CardCliente[]> {
  const fichas = await fichasDoVault();
  const out: CardCliente[] = [];
  for (const e of listarPorEstagio(["cliente"])) {
    const ficha = fichas.get(e.id);
    out.push(montarCard(e, ficha, await pixelDe(e.site || ficha?.site || null)));
  }
  // ativos na frente, depois ordem alfabética
  const inativo = (c: CardCliente) => (c.status === "encerrado" || c.status === "arquivado" ? 1 : 0);
  return out.sort((a, b) => inativo(a) - inativo(b) || a.nome.localeCompare(b.nome));
}

// "1/10/2026, 14:32:10" ou "01/10/2026 14:32:10" -> ISO. Sem data legível, null.
function brParaIso(s: string | undefined): string | null {
  if (!s) return null;
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const p = (n: string) => n.padStart(2, "0");
  return `${m[3]}-${p(m[2])}-${p(m[1])}T${p(m[4] || "0")}:${m[5] || "00"}:00`;
}

export async function cobrancasDoCliente(id: string): Promise<Cobranca[]> {
  const regs = await lerRegistrosCliente(id);
  return regs
    .filter((r) => r.ok)
    .map((r) => ({
      id: r.id,
      descricao: r.descricao,
      valor: r.valor * (r.quantidade || 1),
      status: (r.paid ? "pago" : "pendente") as "pago" | "pendente",
      data: brParaIso(r.data),
      pagoEm: brParaIso(r.paidAt),
      vencimento: r.vencimento || null,
      tipo: (r.tipo === "recorrencia" ? "recorrencia" : "projeto") as "projeto" | "recorrencia",
    }))
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}

function alertasDaSaude(s: SaudeSite): AlertaSaude[] {
  const a: AlertaSaude[] = [];
  if (s.no_ar === false) a.push({ tipo: "fora_do_ar" });
  if (s.formulario === "falha") a.push({ tipo: "formulario" });
  if (s.certificado_dias !== null && s.certificado_dias <= 15) a.push({ tipo: "certificado", dias: s.certificado_dias });
  return a;
}

export async function detalheCliente(id: string): Promise<DetalheCliente | null> {
  const e = lerEmpresa(id);
  if (!e || e.estagio_crm !== "cliente") return null;
  const fichas = await fichasDoVault();
  const ficha = fichas.get(id);
  const site = e.site || ficha?.site || null;
  const pixel = await pixelDe(site);
  const card = montarCard(e, ficha, pixel);

  const saudes = await lerSaude();
  const s = saudes.find((x) => x.slug === id) || null;

  const cobrancas = await cobrancasDoCliente(id);
  const totalPago = cobrancas.filter((c) => c.status === "pago" && c.tipo === "projeto").reduce((t, c) => t + c.valor, 0);
  const temProjeto = cobrancas.some((c) => c.tipo === "projeto");
  const divergencia =
    temProjeto && card.valorProjeto !== null && Math.abs(totalPago - card.valorProjeto) > 0.5
      ? { pago: totalPago, esperado: card.valorProjeto }
      : null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = new Date(hoje.getTime() + 30 * 86400000);
  const proximos = cobrancas
    .filter((c) => c.status === "pendente" && c.vencimento)
    .filter((c) => {
      const [y, m, d] = c.vencimento!.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt >= hoje && dt <= limite;
    })
    .sort((a, b) => (a.vencimento || "").localeCompare(b.vencimento || ""));

  return {
    ...card,
    saude: s ? { ...s, alertas: alertasDaSaude(s) } : null,
    pixel,
    clarityUrl: "https://clarity.microsoft.com/",
    financeiro: { cobrancas, proximosVencimentos: proximos, totalPago, divergencia },
    briefing: briefingDaEmpresa(id),
    cofreAtivo: cofreConfigurado(),
    credenciais: listarCredenciais(id),
    contratos: contratosDaEmpresa(id),
  };
}

// ---------- escrita ----------
export function criarClienteNovo(d: {
  nome: string;
  segmento?: string;
  cidade?: string;
  site?: string;
  valor_projeto?: number | null;
  recorrencia?: number | null;
}): { id: string } {
  let id = slug(d.nome);
  if (lerEmpresa(id)) id = `${id}-${Date.now().toString(36)}`;
  return criarEmpresa({
    id,
    nome: d.nome,
    segmento: d.segmento || null,
    cidade: d.cidade || null,
    site: d.site || null,
    estagio_crm: "cliente",
    status: "ativo",
    origem: "cliente",
    valor_projeto: d.valor_projeto ?? null,
    recorrencia: d.recorrencia ?? null,
  });
}

export function editarCliente(
  id: string,
  d: { nome?: string; segmento?: string; cidade?: string; site?: string; valor_projeto?: number | null; recorrencia?: number | null },
): boolean {
  const e = lerEmpresa(id);
  if (!e || e.estagio_crm !== "cliente") return false;
  return atualizarEmpresa(id, d);
}

// Resumo da faixa de métricas: ativos e novos no mês.
export function resumoClientes(cards: CardCliente[]): { ativos: number; novosNoMes: number } {
  const mes = new Date().toISOString().slice(0, 7);
  return {
    ativos: cards.filter((c) => c.status !== "encerrado" && c.status !== "arquivado").length,
    novosNoMes: cards.filter((c) => (c.fechadoEm || "").slice(0, 7) === mes).length,
  };
}

// Remove o cliente e tudo que depende dele (briefing fica solto por SET NULL, então sai junto).
export function removerClienteDoBanco(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM briefing WHERE empresa_id = ?").run(id);
  db.prepare("DELETE FROM empresa WHERE id = ?").run(id);
}
