// Relatório mensal por cliente (v3-05).
// Uma única função de geração, usada pelo agendador e pela rota manual.
// Servido pela própria plataforma em /r/<token>: nada aqui chama git.
// Fora do conteúdo público: telefone, e-mail, senhas do cofre e dados de outro cliente.
import { randomBytes } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { getDb } from "./db";
import { lerSaude, type SaudeSite } from "./saude";

const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export const URL_BASE = (process.env.RELATORIO_BASE_URL || "https://app.evertonbrito.com").replace(/\/+$/, "");
const CLARITY_PAINEL = "https://clarity.microsoft.com/projects";

export type ConteudoRelatorio = {
  versao: 1;
  empresa: { nome: string; cidade: string | null; site: string | null };
  mes: string;
  mesRotulo: string;
  geradoEm: string;
  pixel: { paginas: number | null; ultimo: string | null; fonte: string };
  saude: {
    noAr: boolean | null;
    formulario: string | null;
    certificadoDias: number | null;
    verificadoEm: string | null;
    alerta: boolean;
  };
  leads: { total: number; fonte: string };
  clarity: { url: string; apiConfirmada: boolean };
  searchConsole: { autorizado: boolean };
  enviadoEm: string | null;
};

export type ResultadoGeracao = {
  empresaId: string;
  nome: string;
  mes: string;
  criado: boolean;
};

export function mesAtual(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function validarMes(mes: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);
}

export function rotuloMes(mes: string): string {
  const [a, m] = mes.split("-");
  return `${MESES[Number(m) - 1] ?? ""} de ${a}`;
}

export function novoToken(): string {
  return randomBytes(24).toString("base64url");
}

export function tokenValido(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,64}$/.test(token);
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hostDe(site: string | null): string {
  if (!site) return "";
  try {
    return new URL(/^https?:\/\//i.test(site) ? site : `https://${site}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Chaves que identificam o cliente nas fontes (pixel, saúde, formulário).
function chavesDe(e: { id: string; nome: string; site: string | null }): string[] {
  return [...new Set([e.id, hostDe(e.site), slug(e.nome)].filter(Boolean))];
}

type Hits = Record<string, { n: number; primeiro: string; ultimo: string }>;

async function lerHits(): Promise<Hits> {
  try {
    return JSON.parse(await readFile(join(VAULT, "SaaS", "Rastreamento", "hits.json"), "utf8"));
  } catch {
    return {};
  }
}

async function contarLeads(chaves: string[]): Promise<number> {
  const dir = join(VAULT, "40 Comercial", "Leads");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith(".md"));
  } catch {
    return 0;
  }
  let total = 0;
  for (const f of files) {
    try {
      const raw = await readFile(join(dir, f), "utf8");
      const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
      const porque = fm.match(/^porque:\s*(.*)$/m)?.[1] ?? "";
      const m = porque.match(/Formulário de ([^\s·]+)/);
      if (m && chaves.includes(m[1])) total += 1;
    } catch {
      /* ignora arquivo ilegível */
    }
  }
  return total;
}

type ConfigCliente = { searchConsoleAutorizado?: boolean; clarityUrl?: string };

// Autorizações e links por cliente ficam no vault (SaaS/Relatorio/config.json),
// nunca no git: { "<id da empresa>": { searchConsoleAutorizado, clarityUrl } }.
async function lerConfig(empresaId: string): Promise<ConfigCliente> {
  try {
    const j = JSON.parse(await readFile(join(VAULT, "SaaS", "Relatorio", "config.json"), "utf8"));
    const c = j?.[empresaId];
    return c && typeof c === "object" ? c : {};
  } catch {
    return {};
  }
}

function urlClarity(v: unknown): string {
  return typeof v === "string" && /^https:\/\/clarity\.microsoft\.com\//.test(v) ? v : CLARITY_PAINEL;
}

type LinhaEmpresa = { id: string; nome: string; cidade: string | null; site: string | null };

async function montarConteudo(e: LinhaEmpresa, mes: string, enviadoEm: string | null): Promise<ConteudoRelatorio> {
  const chaves = chavesDe(e);
  const [hits, saudes, leads, cfg] = await Promise.all([lerHits(), lerSaude(), contarLeads(chaves), lerConfig(e.id)]);

  const chaveHit = chaves.find((k) => hits[k]);
  const hit = chaveHit ? hits[chaveHit] : null;

  const nomeSlug = slug(e.nome);
  const s: SaudeSite | undefined = saudes.find((x) => chaves.includes(x.slug) || slug(x.cliente) === nomeSlug);
  const alerta = !!s && (s.no_ar === false || (s.certificado_dias != null && s.certificado_dias <= 14) || s.formulario === "falha");

  return {
    versao: 1,
    empresa: { nome: e.nome, cidade: e.cidade, site: e.site },
    mes,
    mesRotulo: rotuloMes(mes),
    geradoEm: new Date().toISOString(),
    pixel: {
      paginas: hit ? hit.n : null,
      ultimo: hit ? hit.ultimo : null,
      fonte: "pixel próprio da plataforma",
    },
    saude: {
      noAr: s ? s.no_ar : null,
      formulario: s ? s.formulario : null,
      certificadoDias: s ? s.certificado_dias : null,
      verificadoEm: s ? s.verificado_em || null : null,
      alerta,
    },
    leads: { total: leads, fonte: "formulário do site" },
    clarity: { url: urlClarity(cfg.clarityUrl), apiConfirmada: false },
    searchConsole: { autorizado: cfg.searchConsoleAutorizado === true },
    enviadoEm,
  };
}

// Gera (ou atualiza) o relatório do mês de um cliente. Idempotente: a linha
// (empresa_id, mes) é única; rodar de novo atualiza o conteúdo e mantém o link.
export async function gerarRelatorioMensal(empresaId: string, mes: string = mesAtual()): Promise<ResultadoGeracao> {
  if (!validarMes(mes)) throw new Error("mês inválido");
  const db = getDb();
  const e = db
    .prepare("SELECT id, nome, cidade, site FROM empresa WHERE id = ? AND estagio_crm = 'cliente'")
    .get(empresaId) as LinhaEmpresa | undefined;
  if (!e) throw new Error("cliente ativo não encontrado");

  const atual = db
    .prepare("SELECT id, link_token, conteudo FROM relatorio WHERE empresa_id = ? AND mes = ?")
    .get(empresaId, mes) as { id: string; link_token: string | null; conteudo: string | null } | undefined;

  let enviadoEm: string | null = null;
  if (atual?.conteudo) {
    try {
      enviadoEm = (JSON.parse(atual.conteudo) as ConteudoRelatorio).enviadoEm ?? null;
    } catch {
      /* conteúdo antigo ilegível: recomeça */
    }
  }
  const conteudo = JSON.stringify(await montarConteudo(e, mes, enviadoEm));
  const agora = new Date().toISOString();

  if (atual) {
    // Link revogado (vazio) volta com token novo; link vivo é mantido.
    db.prepare("UPDATE relatorio SET conteudo = ?, gerado_em = ?, link_token = ? WHERE id = ?").run(
      conteudo,
      agora,
      atual.link_token || novoToken(),
      atual.id,
    );
    return { empresaId, nome: e.nome, mes, criado: false };
  }
  db.prepare("INSERT INTO relatorio (id, empresa_id, mes, conteudo, link_token, gerado_em) VALUES (?, ?, ?, ?, ?, ?)").run(
    `${empresaId}-${mes}`,
    empresaId,
    mes,
    conteudo,
    novoToken(),
    agora,
  );
  return { empresaId, nome: e.nome, mes, criado: true };
}

// Gera para todos os clientes ativos. Uma falha isolada não derruba as demais.
export async function gerarRelatoriosAtivos(mes: string = mesAtual()) {
  const linhas = getDb().prepare("SELECT id FROM empresa WHERE estagio_crm = 'cliente' ORDER BY nome").all() as { id: string }[];
  const geradas: ResultadoGeracao[] = [];
  const falhas: { empresaId: string; erro: string }[] = [];
  for (const l of linhas) {
    try {
      geradas.push(await gerarRelatorioMensal(l.id, mes));
    } catch (err) {
      falhas.push({ empresaId: l.id, erro: err instanceof Error ? err.message : "erro" });
    }
  }
  return { mes, geradas, falhas };
}

// Troca o token: o link antigo passa a responder 404, o novo funciona.
export function rotacionarToken(empresaId: string, mes: string): boolean {
  const r = getDb().prepare("UPDATE relatorio SET link_token = ? WHERE empresa_id = ? AND mes = ?").run(novoToken(), empresaId, mes);
  return Number(r.changes) > 0;
}

// Revoga o link (token vazio): 404 até gerar de novo ou rotacionar.
export function revogarToken(empresaId: string, mes: string): boolean {
  const r = getDb().prepare("UPDATE relatorio SET link_token = NULL WHERE empresa_id = ? AND mes = ?").run(empresaId, mes);
  return Number(r.changes) > 0;
}

// Busca pública pelo token. Devolve null para qualquer token que não sirva
// (inexistente, revogado, malformado): quem chama responde 404 igual.
export function relatorioPorToken(token: string): ConteudoRelatorio | null {
  if (!tokenValido(token)) return null;
  const linha = getDb().prepare("SELECT conteudo FROM relatorio WHERE link_token = ?").get(token) as { conteudo: string | null } | undefined;
  if (!linha?.conteudo) return null;
  try {
    return JSON.parse(linha.conteudo) as ConteudoRelatorio;
  } catch {
    return null;
  }
}

export function marcarEnviado(empresaId: string, mes: string): boolean {
  const db = getDb();
  const l = db.prepare("SELECT id, conteudo FROM relatorio WHERE empresa_id = ? AND mes = ?").get(empresaId, mes) as
    | { id: string; conteudo: string | null }
    | undefined;
  if (!l?.conteudo) return false;
  const c = JSON.parse(l.conteudo) as ConteudoRelatorio;
  c.enviadoEm = new Date().toISOString();
  db.prepare("UPDATE relatorio SET conteudo = ? WHERE id = ?").run(JSON.stringify(c), l.id);
  return true;
}

// ---------- lista do Hoje ----------
export type ItemHoje = {
  empresaId: string;
  nome: string;
  gerado: boolean;
  enviado: boolean;
  semWhatsapp: boolean;
  wa: string | null; // wa.me com número, mensagem e link prontos (só o Everton autenticado recebe)
  link: string | null;
};

function numeroWa(bruto: string | null): string | null {
  const d = (bruto || "").replace(/\D/g, "");
  if (d.length < 10) return null;
  return d.length <= 11 ? `55${d}` : d;
}

export function mensagemWhatsapp(nome: string, mesRot: string, link: string): string {
  return `Oi! Tudo bem? Aqui é o Everton. Já saiu o relatório de ${mesRot} do site da ${nome}, com visitas, saúde do site e contatos recebidos. Dá uma olhada: ${link}`;
}

export function listarParaHoje(mes: string = mesAtual()): { mes: string; mesRotulo: string; itens: ItemHoje[] } {
  const db = getDb();
  const clientes = db
    .prepare(
      `SELECT e.id, e.nome, r.link_token, r.conteudo,
              (SELECT c.whatsapp FROM contato c WHERE c.empresa_id = e.id AND c.whatsapp IS NOT NULL AND c.whatsapp <> '' LIMIT 1) AS whatsapp
         FROM empresa e
         LEFT JOIN relatorio r ON r.empresa_id = e.id AND r.mes = ?
        WHERE e.estagio_crm = 'cliente'
        ORDER BY e.nome`,
    )
    .all(mes) as { id: string; nome: string; link_token: string | null; conteudo: string | null; whatsapp: string | null }[];

  const rotulo = rotuloMes(mes);
  const itens = clientes.map((c): ItemHoje => {
    let enviado = false;
    if (c.conteudo) {
      try {
        enviado = !!(JSON.parse(c.conteudo) as ConteudoRelatorio).enviadoEm;
      } catch {
        /* ignora */
      }
    }
    const link = c.link_token ? `${URL_BASE}/r/${c.link_token}` : null;
    const num = numeroWa(c.whatsapp);
    return {
      empresaId: c.id,
      nome: c.nome,
      gerado: !!c.conteudo,
      enviado,
      semWhatsapp: !num,
      link,
      wa: num && link ? `https://wa.me/${num}?text=${encodeURIComponent(mensagemWhatsapp(c.nome, rotulo, link))}` : null,
    };
  });
  return { mes, mesRotulo: rotulo, itens };
}
