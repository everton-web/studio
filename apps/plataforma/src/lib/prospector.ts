// Prospector automático — o agente encontra leads e audita os sites sozinho.
// Fontes, em ordem de tentativa:
//   1. Google Places API  (chave em GOOGLE_PLACES_KEY — critério ouro: nota, avaliações, site)
//   2. Kimi-discovery     (IA Router `_scripts/ia.mjs --engine leitura` lista candidatos; cada
//                          site é VALIDADO com HTTP antes de virar candidato — barra alucinação)
//   3. Overpass/OSM       (fallback sem chave — só funciona se algum mirror global estiver no ar)
//   4. Cache da última leva boa (24h)
// Fluxo: buscar → diagnosticar o site → classificar em uma das 3 frentes → criar ficha (estágio 0).
// Frentes (pedido do Everton, 02/10):
//   sem-gmn        Perfil no Google não configurado: sem site ou com o perfil incompleto (só com Places).
//   site-quebrado  Tem perfil/negócio real, mas o site está fora do ar, com erro ou estacionado.
//   site-ruim      Site funcionando, porém mal construído (a auditoria de sempre).

import { readdir, mkdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { lookup, resolveNs } from "node:dns/promises";
import { pipelineOp, gravarAnaliseNaFicha } from "./vault";
import { analisarLead, salvarAnalise, resumoMd } from "./analise";

const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const LEADS_DIR = join(VAULT, "40 Comercial", "Leads");
const PLACES_KEY = process.env.GOOGLE_PLACES_KEY || "";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

// localiza o IA Router do monorepo (_scripts/ia.mjs) a partir do cwd do app
function localizarRaiz(): string {
  const candidatos = [process.cwd()];
  let p = process.cwd();
  for (let i = 0; i < 3; i++) { p = dirname(p); candidatos.push(p); }
  const fs = require("node:fs");
  return candidatos.find((c) => fs.existsSync(join(c, "_scripts", "ia.mjs"))) || dirname(process.cwd());
}
const ROOT = localizarRaiz();
const IA_MJS = join(ROOT, "_scripts", "ia.mjs");
const CACHE_FILE = join(VAULT, "SaaS", "Prospeccao", "ultima-leva.json");
const ROTACAO_FILE = join(VAULT, "SaaS", "Prospeccao", "rotacao-brasil.json");

const CIDADES_BRASIL = [
  "São Paulo/SP", "Rio de Janeiro/RJ", "Belo Horizonte/MG", "Brasília/DF", "Curitiba/PR",
  "Porto Alegre/RS", "Recife/PE", "Fortaleza/CE", "Salvador/BA", "Goiânia/GO",
  "Campinas/SP", "Florianópolis/SC", "Manaus/AM", "Belém/PA", "Vitória/ES",
  "Joinville/SC", "Ribeirão Preto/SP", "Uberlândia/MG", "Natal/RN", "João Pessoa/PB",
];

const UF_NOME: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão",
  MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba",
  PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
};

export type Candidato = {
  nome: string;
  site: string;
  telefone?: string;
  cidade?: string;
  nota?: number;
  avaliacoes?: number;
  endereco?: string;
  segmento?: string;
  gmn?: boolean; // veio do Google Places: o perfil no Google existe de fato
  perfilFaltas?: string[]; // o que falta no perfil do Google (sem site, sem horário...)
};

export type Frente = "sem-gmn" | "site-quebrado" | "site-ruim";
export const FRENTES: Frente[] = ["sem-gmn", "site-quebrado", "site-ruim"];
export const FRENTE_LABEL: Record<Frente, string> = {
  "sem-gmn": "Google Meu Negócio não configurado",
  "site-quebrado": "Google Meu Negócio com site quebrado",
  "site-ruim": "Google Meu Negócio com site mal construído",
};

export type Resultado = {
  fonte: string;
  auditados: number;
  adicionados: string[];
  descartados: { nome: string; motivo: string }[];
  erros: { nome: string; motivo: string }[];
  candidatos: number;
  aviso: string;
  tempo: number;
  regiao: string;
  cidades: string[];
  porFrente: Record<Frente, number>;
};

export const progressoAtual = {
  ativo: false,
  fase: "",
  feito: 0,
  total: 0,
  nicho: "",
  regiao: "",
};

type Alvo = { prompt: string; ficha: string };

function slugNome(nome: string): string {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function hostnameDe(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch { return ""; }
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchTexto(url: string, timeoutMs = 7000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally { clearTimeout(t); }
}

// Site existe de verdade? (DNS/HTTP ok) — barra domínios fantasma vindos de LLM
async function siteExiste(url: string): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "User-Agent": UA } });
    return res.status >= 200 && res.status < 400;
  } catch { return false; }
  finally { clearTimeout(t); }
}

// "aponta": o endereço resolve para um servidor. "registrado": o domínio existe (tem NS), mas
// pode não apontar para nada, como um domínio estacionado. Domínio sem NS costuma ser invenção da IA.
async function estadoDominio(url: string): Promise<"aponta" | "registrado" | "inexistente"> {
  const host = hostnameDe(url);
  if (!host) return "inexistente";
  try { await lookup(host); return "aponta"; } catch { /* segue */ }
  // Consulta o NS do domínio registrável (nunca do sufixo, como "com.br", que sempre tem NS).
  const partes = host.split(".");
  const sufixoDuplo = /^(com|net|org|edu|gov|art|adv|eng|med|odo|blog|eco|ind|inf|tur|psi|vet|arq|co|ac)\.[a-z]{2}$/.test(partes.slice(-2).join("."));
  const registravel = partes.slice(-(sufixoDuplo ? 3 : 2)).join(".");
  if (registravel.split(".").length < (sufixoDuplo ? 3 : 2)) return "inexistente";
  try { if ((await resolveNs(registravel)).length) return "registrado"; } catch { /* sem NS */ }
  return "inexistente";
}

async function dominioExiste(url: string): Promise<boolean> {
  return (await estadoDominio(url)) !== "inexistente";
}

// Sinais de site quebrado mesmo respondendo 200: estacionado, suspenso, expirado, erro de banco...
const SINAIS_QUEBRADO: [RegExp, string][] = [
  [/account (has been )?suspended|conta suspensa/i, "hospedagem suspensa"],
  [/domain (is )?(for sale|expired|parked)|este dom[ií]nio (est[aá] )?(à|a) venda|parked domain|domain parking|dom[ií]nio expirado/i, "domínio estacionado ou expirado"],
  [/error establishing a database connection|erro ao estabelecer (uma )?conex[aã]o com o banco/i, "erro de banco de dados (WordPress)"],
  [/<title>\s*index of \//i, "listagem de pasta (site não publicado)"],
  [/site em constru[cç][aã]o|under construction|coming soon|em manuten[cç][aã]o|maintenance mode/i, "site em construção ou manutenção"],
  [/welcome to nginx|apache2 (ubuntu|debian) default page|<h1>it works!<\/h1>/i, "página padrão do servidor"],
  [/<b>(fatal error|parse error|warning)<\/b>|uncaught exception/i, "erro de programação visível"],
];

export type DiagnosticoSite = { estado: "ok" | "quebrado" | "offline" | "inexistente"; motivo: string };

export async function diagnosticarSite(url: string): Promise<DiagnosticoSite> {
  const u = url.startsWith("http") ? url : `https://${url}`;
  const dns = await estadoDominio(u);
  if (dns === "inexistente") return { estado: "inexistente", motivo: "domínio não existe no DNS" };
  if (dns === "registrado") return { estado: "quebrado", motivo: "domínio registrado, mas sem site apontado" };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(u, { signal: ctrl.signal, redirect: "follow", headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9" } });
    if (res.status >= 500) return { estado: "quebrado", motivo: `erro do servidor (HTTP ${res.status})` };
    if (res.status === 404 || res.status === 410) return { estado: "quebrado", motivo: `página inicial não encontrada (HTTP ${res.status})` };
    if (res.status === 403 || res.status === 401) return { estado: "quebrado", motivo: `acesso bloqueado (HTTP ${res.status})` };
    if (res.status >= 400) return { estado: "quebrado", motivo: `erro HTTP ${res.status}` };
    const html = await res.text();
    for (const [re, motivo] of SINAIS_QUEBRADO) if (re.test(html)) return { estado: "quebrado", motivo };
    const texto = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (texto.length < 120 && !/<script/i.test(html)) return { estado: "quebrado", motivo: "página praticamente vazia" };
    return { estado: "ok", motivo: "" };
  } catch (e: any) {
    if (e?.name === "AbortError" || ctrl.signal.aborted) return { estado: "offline", motivo: "site não respondeu (tempo esgotado)" };
    const m = String(e?.cause?.code || e?.code || e?.message || "");
    if (/CERT|SSL|TLS|SELF_SIGNED|UNABLE_TO_VERIFY/i.test(m)) return { estado: "quebrado", motivo: "certificado de segurança inválido" };
    if (/ECONNREFUSED/i.test(m)) return { estado: "offline", motivo: "servidor recusou a conexão" };
    return { estado: "offline", motivo: `site fora do ar (${m.slice(0, 40) || "sem resposta"})` };
  } finally { clearTimeout(t); }
}

async function jaExiste(nome: string): Promise<boolean> {
  const slug = slugNome(nome);
  try {
    const files = await readdir(LEADS_DIR);
    return files.some((f) => f.toLowerCase() === `${slug}.md`);
  } catch { return false; }
}

async function dominiosExistentes(): Promise<Set<string>> {
  const set = new Set<string>();
  try {
    const files = await readdir(LEADS_DIR);
    for (const f of files) {
      if (!f.toLowerCase().endsWith(".md")) continue;
      const raw = await readFile(join(LEADS_DIR, f), "utf8");
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!m) continue;
      const kv = m[1].match(/^site-atual:\s*(.*)$/m);
      if (!kv) continue;
      const host = hostnameDe(kv[1].trim());
      if (host) set.add(host);
    }
  } catch { /* sem leads */ }
  return set;
}

async function proximasDuasCidades(): Promise<string[]> {
  let indice = 0;
  try {
    const raw = await readFile(ROTACAO_FILE, "utf8");
    const j = JSON.parse(raw);
    if (typeof j.indice === "number" && Number.isFinite(j.indice)) indice = j.indice % CIDADES_BRASIL.length;
  } catch { /* começa do 0 */ }
  const i = indice % CIDADES_BRASIL.length;
  const a = CIDADES_BRASIL[i];
  const b = CIDADES_BRASIL[(i + 1) % CIDADES_BRASIL.length];
  try {
    await mkdir(join(VAULT, "SaaS", "Prospeccao"), { recursive: true });
    await writeFile(ROTACAO_FILE, JSON.stringify({ indice: (indice + 2) % CIDADES_BRASIL.length }), "utf8");
  } catch { /* sem vault */ }
  return [a, b];
}

function ehSalvador(ficha: string): boolean {
  const s = ficha.trim().toLowerCase();
  return s === "salvador" || s === "salvador/ba";
}

async function resolverRegiao(op: { cidade?: string; regiao?: string }): Promise<{ alvos: Alvo[]; label: string }> {
  const cidade = (op.cidade || "").trim();
  const regiao = (op.regiao || "").trim();
  if (cidade && !regiao) {
    return { alvos: [{ prompt: cidade, ficha: cidade }], label: cidade };
  }
  if (!regiao || regiao.toLowerCase() === "brasil") {
    const cidades = await proximasDuasCidades();
    return { alvos: cidades.map((c) => ({ prompt: c, ficha: c })), label: "Brasil (rodízio)" };
  }
  const uf = regiao.toUpperCase();
  if (/^[A-Z]{2}$/.test(uf) && UF_NOME[uf]) {
    return { alvos: [{ prompt: `estado da ${UF_NOME[uf]} (${uf})`, ficha: uf }], label: `${UF_NOME[uf]} (${uf})` };
  }
  return { alvos: [{ prompt: regiao, ficha: regiao }], label: regiao };
}

// ---------- fonte 1: Google Places (chave opcional) ----------
async function fontePlaces(nicho: string, cidade: string, limite: number): Promise<Candidato[]> {
  const q = encodeURIComponent(`${nicho} ${cidade}`);
  const search = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&language=pt-BR&key=${PLACES_KEY}`);
  const data = await search.json() as { results?: { place_id: string }[] };
  const ids = (data.results || []).slice(0, limite);
  const out: Candidato[] = [];
  for (const { place_id } of ids) {
    try {
      const r = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=name,rating,user_ratings_total,website,formatted_phone_number,formatted_address,opening_hours,photos,business_status&language=pt-BR&key=${PLACES_KEY}`);
      const d = await r.json() as { result?: { name?: string; rating?: number; user_ratings_total?: number; website?: string; formatted_phone_number?: string; formatted_address?: string; opening_hours?: unknown; photos?: unknown[]; business_status?: string } };
      const res = d.result || {};
      if (res.business_status && res.business_status !== "OPERATIONAL") continue; // fechado: não é lead
      const faltas: string[] = [];
      if (!res.website) faltas.push("sem site no perfil");
      if (!res.opening_hours) faltas.push("sem horário de funcionamento");
      if (!res.formatted_phone_number) faltas.push("sem telefone");
      if ((res.photos?.length || 0) < 5) faltas.push("poucas fotos");
      if ((res.user_ratings_total || 0) < 10) faltas.push("poucas avaliações");
      out.push({
        gmn: true,
        perfilFaltas: faltas,
        nome: res.name || "",
        site: res.website || "",
        telefone: res.formatted_phone_number || "",
        cidade: res.formatted_address || "",
        nota: res.rating,
        avaliacoes: res.user_ratings_total,
      });
      await sleep(120);
    } catch { /* segue */ }
  }
  return out.filter((c) => c.nome); // sem site também entra: é a frente "sem-gmn"
}

// ---------- fonte 2: Kimi-discovery (IA Router) ----------
// Kimi (leitura) tem contexto gigante e lista negócios com site próprio. Cada site é
// validado com HTTP antes de virar candidato — o modelo pode errar, o fetch não.

function runIa(engine: string, prompt: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve) => {
    let child: any = null;
    try {
      child = spawn(process.execPath, [IA_MJS, prompt, "--engine", engine], { cwd: ROOT, windowsHide: true });
    } catch { resolve(""); return; }
    let out = "";
    const timer = setTimeout(() => { try { child.kill(); } catch {} }, timeoutMs);
    child.stdout?.on("data", (d: Buffer) => (out += d.toString()));
    child.stderr?.on("data", (d: Buffer) => (out += d.toString()));
    child.on("close", () => { clearTimeout(timer); resolve(out); });
    child.on("error", () => { clearTimeout(timer); resolve(""); });
  });
}

function extrairJsonArray(texto: string): { nome?: string; site?: string }[] {
  const ini = texto.indexOf("[");
  const fim = texto.lastIndexOf("]");
  if (ini === -1 || fim <= ini) return [];
  try {
    const arr = JSON.parse(texto.slice(ini, fim + 1));
    return Array.isArray(arr) ? arr : [];
  } catch {
    // fallback por linha: "Nome — https://…"
    return texto.split(/\r?\n/).map((l) => {
      const m = l.match(/(?:["'“”]?)([^"'“”:,-]{4,})(?:["'”]?)\s*[—:|]\s*(https?:\/\/[^\s"'”]+)/);
      if (!m) return {};
      return { nome: m[1].trim(), site: m[2].replace(/[.,;)\]}>]+$/, "") };
    }).filter((x) => x.nome && x.site);
  }
}

async function fonteKimi(nicho: string, lugar: string, ficha: string, limite: number): Promise<Candidato[]> {
  if (!ROOT || !require("node:fs").existsSync(IA_MJS)) return [];
  const alvo = Math.min(24, limite * 3);
  const prompt =
    `Liste ${alvo} negócios LOCAIS reais de pequeno e médio porte do segmento "${nicho}" em ${lugar}, que hoje (2026) tenham SITE PRÓPRIO funcionando. ` +
    `Priorize consultórios, clínicas de bairro, escritórios, lojas, restaurantes, pousadas e similares independentes. ` +
    `EXCLUA: redes, franquias, grandes marcas, portais, agregadores, marketplaces, páginas de rede social, ifood/agenda. ` +
    `Responda APENAS com um JSON array válido e nada mais, no formato: [{"nome":"Nome da Empresa","site":"https://dominio.br"}]`;
  // 30/09: OpenCode Go (Kimi) sem crédito. Ordem: Gemini (API, rápido) → Codex (assinatura) → Kimi.
  let arr: { nome?: string; site?: string }[] = [];
  for (const [motor, ms] of [["gemini", 60000], ["codex", 150000], ["leitura", 60000]] as const) {
    arr = extrairJsonArray(await runIa(motor, prompt, ms));
    if (arr.length) break;
  }
  const out: Candidato[] = [];
  const vistos = new Set<string>();
  for (const it of arr) {
    if (!it?.nome || !it?.site) continue;
    const site = it.site.trim().startsWith("http") ? it.site.trim() : `https://${it.site.trim()}`;
    const chave = `${it.nome.trim()}|${site}`.toLowerCase();
    if (vistos.has(chave)) continue; vistos.add(chave);
    // Domínio que nem existe no DNS costuma ser invenção da IA: fora. Domínio real com site
    // fora do ar fica (é a frente "site-quebrado"); o diagnóstico decide depois.
    if (!(await dominioExiste(site))) continue;
    out.push({ nome: it.nome.trim(), site, cidade: ficha, segmento: nicho });
    if (out.length >= limite) break;
  }
  return out;
}

// ---------- fonte 3: Overpass/OSM (fallback, sem chave) ----------
const OSM_MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.osm.ch/api/interpreter"];
const OSM_CELLS: [number, number, number, number][] = [
  [-13.08, -38.62, -12.9, -38.45], // centro + orla
  [-12.9, -38.62, -12.75, -38.45], // norte (Liberdade/Periperi)
  [-13.08, -38.45, -12.9, -38.28], // leste (Stella Maris/Itapuã)
  [-12.9, -38.45, -12.75, -38.28], // nordeste
];
const BLOQ = /(instagram|facebook|linkedin|youtube|wikipedia|blogspot|wordpress\.com|\.wordpress\.|medium\.com|substack|notion\.so|github\.io|wixsite|behance|dribbble|twitter\.com|x\.com|tiktok|pinterest|tripadvisor|whatsapp|linktr\.ee|canva\.com|google\.com\/(maps|site)|\.gov\.br|\.edu\.br|mcdonalds|burger\s?king|accor|ibis\b|subway|habibs|giraffas|spoleto|fridos|madero|outback|americangrill|ticket\b|ifood|rappi|pedidosja|pedidosj[áa]|amazon|magazineluiza|americanas|melhorcelular|mercado\s?livre)/;
const BLOQ_NOME = /(blog|revista|jornal|not[íi]cias|enciclop[ée]dia|wikipedia|prefeitura|secretaria|c[âa]mara|universidade|faculdade|associa[çc][ãa]o de bairro|portal)/i;
const TAG_NEGOCIO = ["amenity", "shop", "office", "healthcare", "tourism", "leisure", "club", "craft", "landuse", "cuisine", "fee"];
function tSeg(t: Record<string, string>): string {
  return t.amenity || t.shop || t.office || t.healthcare || t.tourism || t.leisure || "";
}
async function osmQuery(mirror: string, data: string): Promise<any> {
  const r = await fetch(mirror, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
    body: new URLSearchParams({ data }),
    signal: AbortSignal.timeout(6000),
  });
  const txt = await r.text();
  return JSON.parse(txt);
}
async function fonteOsm(_nicho: string, _cidade: string, limite: number): Promise<Candidato[]> {
  const seen = new Set<string>();
  const out: Candidato[] = [];
  for (const mirror of OSM_MIRRORS) {
    const cells = OSM_CELLS.map(async (cell) => {
      try {
        const b = cell.join(",");
        const q = `[out:json][timeout:5];(nwr["website"](${b}););out center tags 50;`;
        const d = await osmQuery(mirror, q);
        if (!Array.isArray(d.elements)) return [];
        const achados: Candidato[] = [];
        for (const e of d.elements) {
          const t = e.tags || {};
          if (!t.name || !t.website) continue;
          if (BLOQ.test(t.website) || BLOQ.test(t.name || "") || BLOQ_NOME.test(t.name || "")) continue;
          if (!TAG_NEGOCIO.some((k) => t[k])) continue;
          const key = `${t.name}|${t.website}`;
          if (seen.has(key)) continue;
          seen.add(key);
          achados.push({ nome: t.name, site: t.website, telefone: t.phone || "", cidade: t["addr:city"] || "Salvador/BA", segmento: tSeg(t) });
          if (achados.length >= Math.ceil(limite / 2)) break;
        }
        return achados;
      } catch { return []; }
    });
    const resultados = await Promise.allSettled(cells);
    for (const r of resultados) if (r.status === "fulfilled") out.push(...r.value);
    if (out.length > 0) break;
  }
  return out.slice(0, limite);
}

// ---------- auditoria de site ----------
export type Contatos = { whatsapp?: string; telefone?: string; email?: string };

// Canais de contato publicados no próprio site: sem pelo menos um, o lead não tem como ser abordado.
// Telefone brasileiro válido: DDD + 8 dígitos (fixo, começa com 2 a 5) ou DDD + 9 + 8 (celular).
// Celular antigo sem o 9 ganha o 9. Qualquer outra coisa (número de tema, de outro país) é descartada.
function foneBR(v: string): string {
  let d = String(v || "").replace(/D/g, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (!/^[1-9][1-9]/.test(d)) return "";
  if (d.length === 10 && /[6-9]/.test(d[2])) d = d.slice(0, 2) + "9" + d.slice(2);
  if (d.length === 10 && /[2-5]/.test(d[2])) return "55" + d;
  if (d.length === 11 && d[2] === "9") return "55" + d;
  return "";
}

function extrairContatos(html: string): Contatos {
  const so = (v: string) => v.replace(/\D/g, "");
  const wa = html.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\/?\?phone=)(\+?\d{10,13})/i)?.[1];
  const tel = html.match(/href=["']tel:([+\d\s().-]{8,20})["']/i)?.[1];
  const email = html.match(/href=["']mailto:([^"'?\s]+@[^"'?\s]+)/i)?.[1];
  return {
    whatsapp: (wa && foneBR(wa)) || undefined,
    telefone: (tel && foneBR(tel)) || undefined,
    email: email && !/example|seudominio|email@/i.test(email) ? email.toLowerCase() : undefined,
  };
}

export async function auditarSite(url: string): Promise<{ ok: boolean; problemas: string[]; info: string[]; contatos: Contatos }> {
  const u = url.startsWith("http") ? url : `https://${url}`;
  const problemas: string[] = [];
  const info: string[] = [];
  try {
    const html = await fetchTexto(u);
    const contatos = extrairContatos(html);
    const low = html.toLowerCase();
    if (!/<meta[^>]+name=["']viewport["']/i.test(html)) problemas.push("sem meta viewport (quebra no celular)");
    if (!/wa\.me\/|api\.whatsapp\.com|whatsapp/i.test(low)) problemas.push("sem botão/WhatsApp visível");
    if (!/tel:/i.test(low) && !contatos.whatsapp) problemas.push("sem telefone clicável");
    if (!/<title>/i.test(low)) problemas.push("sem título de página");
    const year = (html.match(/20\d\d/) || [])[0];
    if (year && Number(year) < 2023) problemas.push(`conteúdo datado (${year})`);
    if (/wix\.com|google\.com\/sites|webnode|gratis/i.test(low)) problemas.push("plataforma gratuita/terceirizada");
    if (/<style/i.test(html) && html.length < 8000) info.push("página minimalista");
    if (/responsive|mobile/i.test(low)) info.push("indícios de responsividade no código");
    return { ok: true, problemas, info, contatos };
  } catch (e: any) {
    return { ok: false, problemas: [`site inacessível (${e?.message || "erro"})`], info: [], contatos: {} };
  }
}

// ---------- orquestrador ----------
export async function prospectar(op: { nicho?: string; cidade?: string; regiao?: string; limite?: number; frentes?: string[] } = {}): Promise<Resultado> {
  const frentes = new Set<Frente>((op.frentes || FRENTES).filter((x): x is Frente => (FRENTES as string[]).includes(x)));
  if (!frentes.size) FRENTES.forEach((x) => frentes.add(x));
  const t0 = Date.now();
  const nicho = (op.nicho || "odontologia").toLowerCase();
  const limite = Math.min(30, Math.max(1, op.limite || 8));
  const temChave = !!PLACES_KEY;

  const { alvos, label } = await resolverRegiao({ cidade: op.cidade, regiao: op.regiao });
  const subLimite = Math.ceil(limite / alvos.length);
  const osmValido = alvos.length === 1 && ehSalvador(alvos[0].ficha);

  progressoAtual.ativo = true;
  progressoAtual.fase = "buscando empresas";
  progressoAtual.feito = 0;
  progressoAtual.total = 0;
  progressoAtual.nicho = nicho;
  progressoAtual.regiao = label;

  const res: Resultado = { fonte: "", auditados: 0, adicionados: [], descartados: [], erros: [], candidatos: 0, aviso: "", tempo: 0, regiao: label, cidades: alvos.map((a) => a.ficha), porFrente: { "sem-gmn": 0, "site-quebrado": 0, "site-ruim": 0 } };

  let candidatos: Candidato[] = [];
  let usouCache = false;

  // 1. Google Places (se houver chave)
  if (temChave) {
    const encontrados: Candidato[] = [];
    for (const alvo of alvos) {
      try { encontrados.push(...(await fontePlaces(nicho, alvo.prompt, subLimite))); }
      catch (e: any) { res.erros.push({ nome: "google-places", motivo: e?.message || "falha" }); }
    }
    if (encontrados.length) { candidatos = encontrados; res.fonte = "google-places"; }
  }

  // 2. Kimi-discovery (IA Router — sem precisar de chave), uma chamada por alvo
  if (!candidatos.length) {
    const encontrados: Candidato[] = [];
    for (const alvo of alvos) {
      try { encontrados.push(...(await fonteKimi(nicho, alvo.prompt, alvo.ficha, subLimite))); }
      catch (e: any) { res.erros.push({ nome: "kimi", motivo: e?.message || "falha no IA Router" }); }
    }
    if (encontrados.length) { candidatos = encontrados; res.fonte = "kimi-discovery"; }
  }

  // 3. Overpass/OSM (só para Salvador, que tem células pré-mapeadas)
  if (!candidatos.length && osmValido) {
    try {
      const o = await fonteOsm(nicho, alvos[0].ficha, limite);
      if (o.length) { candidatos = o; res.fonte = "overpass-osm"; }
    } catch (e: any) { res.erros.push({ nome: "overpass", motivo: e?.message || "falha nos mirrors" }); }
  }

  // 4. Cache da última leva boa (24h)
  if (!candidatos.length) {
    const cache = await lerCache();
    if (cache) { candidatos = cache.candidatos.slice(0, limite); usouCache = true; res.fonte = res.fonte || "cache"; }
  }

  if (!candidatos.length) {
    res.aviso = `Nenhuma fonte retornou candidatos de "${nicho}" em ${label}. ` +
      (temChave ? "As fontes falharam: confira a chave Google Places e a rede." : "Sem GOOGLE_PLACES_KEY, usei IA (Gemini, Codex) + OSM: rode node _scripts/ia.mjs --check para ver quais motores estão vivos.");
    res.tempo = Math.round((Date.now() - t0) / 1000);
    progressoAtual.ativo = false;
    progressoAtual.fase = "";
    return res;
  }
  if (!temChave && !usouCache) await salvarCache(candidatos.slice(0, limite));
  if (usouCache) res.fonte = `${res.fonte} (cache da última leva boa)`;

  res.candidatos = candidatos.length;
  progressoAtual.fase = "auditando";
  progressoAtual.total = candidatos.length;

  const dominios = await dominiosExistentes();
  const lote = 4;
  for (let i = 0; i < candidatos.length; i += lote) {
    const fatia = candidatos.slice(i, i + lote);
    await Promise.allSettled(fatia.map(async (c) => {
      try {
        if (await jaExiste(c.nome)) { res.descartados.push({ nome: c.nome, motivo: "já está no pipeline" }); return; }
        const host = hostnameDe(c.site);
        if (host && dominios.has(host)) { res.descartados.push({ nome: c.nome, motivo: "domínio já está no pipeline" }); return; }

        const origem = res.fonte.startsWith("google-places") ? "Google Maps" : res.fonte.startsWith("overpass") ? "OpenStreetMap" : "busca por IA";
        const fonteTxt = `Encontrado via ${origem}${c.nota ? ` · nota Google ${c.nota}` : ""}${c.avaliacoes ? ` · ${c.avaliacoes} avaliações` : ""}.`;
        const addFicha = async (frente: Frente, porque: string, contatos: Contatos = {}) => {
          const notaTxt = c.nota && c.nota > 0 ? String(c.nota).replace(".", ",") : "";
          const fone = c.telefone || contatos.telefone || "";
          const novo = await pipelineOp({
            action: "add", nome: c.nome, segmento: c.segmento || nicho, cidade: c.cidade || "",
            nota: notaTxt, avaliacoes: c.avaliacoes ? String(c.avaliacoes) : "", site: c.site,
            contato: fone, whatsapp: contatos.whatsapp || fone, email: contatos.email || "",
            categoria: origem === "busca por IA" ? "ia" : "maps", frente,
            porque: `${FRENTE_LABEL[frente]}. ${porque} ${fonteTxt}`,
          });
          res.adicionados.push(c.nome);
          res.porFrente[frente]++;
          return novo;
        };

        // Frente 1: perfil do Google sem site
        if (!c.site) {
          if (!c.gmn || !frentes.has("sem-gmn")) { res.descartados.push({ nome: c.nome, motivo: "sem site (frente não selecionada)" }); return; }
          if (!c.telefone) { res.descartados.push({ nome: c.nome, motivo: "perfil sem site e sem telefone: sem como abordar" }); return; }
          await addFicha("sem-gmn", `Perfil no Google sem site. Falta: ${(c.perfilFaltas || []).join(", ") || "site"}.`);
          return;
        }

        // Frente 2: site quebrado ou fora do ar
        const diag = await diagnosticarSite(c.site);
        res.auditados++;
        if (diag.estado === "inexistente") { res.descartados.push({ nome: c.nome, motivo: diag.motivo }); return; }
        if (diag.estado !== "ok") {
          if (!frentes.has("site-quebrado")) { res.descartados.push({ nome: c.nome, motivo: `${diag.motivo} (frente não selecionada)` }); return; }
          if (!c.telefone) { res.descartados.push({ nome: c.nome, motivo: `${diag.motivo}, mas sem telefone para abordar` }); return; }
          const gmnTxt = c.gmn ? "Perfil no Google ativo." : "Perfil no Google a confirmar (veio da busca por IA).";
          await addFicha("site-quebrado", `${gmnTxt} Site: ${diag.motivo}.`);
          return;
        }

        // Perfil do Google muito incompleto, mesmo com o site no ar, também é a frente 1
        if (c.gmn && (c.perfilFaltas?.length || 0) >= 3 && frentes.has("sem-gmn")) {
          await addFicha("sem-gmn", `Perfil no Google incompleto: ${(c.perfilFaltas || []).join(", ")}. O site responde.`);
          return;
        }

        // Frente 3: site no ar, mas mal construído
        if (!frentes.has("site-ruim")) { res.descartados.push({ nome: c.nome, motivo: "site no ar (frente não selecionada)" }); return; }
        const aud = await auditarSite(c.site);
        if (!aud.ok) { res.descartados.push({ nome: c.nome, motivo: "site inacessível na auditoria" }); return; }
        const temContato = !!(c.telefone || aud.contatos.whatsapp || aud.contatos.telefone || aud.contatos.email);
        if (!temContato) { res.descartados.push({ nome: c.nome, motivo: "nenhum telefone, WhatsApp ou e-mail no site" }); return; }

        const a = await analisarLead({
          id: slugNome(c.nome),
          nome: c.nome,
          cidade: c.cidade || "",
          site: c.site,
          nota: c.nota,
          avaliacoes: c.avaliacoes,
          whatsapp: c.telefone || "",
          contato: c.telefone || "",
        });

        // "Sem telefone clicável" sozinho não justifica abordagem: precisa de problema de verdade.
        const fortes = aud.problemas.filter((p) => !/sem telefone clicável/.test(p));
        const entra = a.pontuacao <= 60 || fortes.length >= 2 || (fortes.length >= 1 && a.pontuacao <= 75);
        if (!entra) {
          let motivo = `presença ${a.pontuacao}/100: site forte`;
          if (aud.problemas.length === 1) motivo += ` · ${aud.problemas[0]}`;
          res.descartados.push({ nome: c.nome, motivo });
          return;
        }

        const novo = await addFicha("site-ruim", `Presença ${a.pontuacao}/100. Auditoria: ${aud.problemas.join("; ") || "site ok"}.`, aud.contatos);
        // reusa a análise já calculada em vez de rodar de novo
        if (novo && "id" in novo && novo.id) {
          try {
            a.id = novo.id;
            await salvarAnalise(a);
            await gravarAnaliseNaFicha(novo.id, resumoMd(a), a.pontuacao, a);
          } catch { /* a análise pode ser refeita pela ficha */ }
        }
      } catch (e: any) {
        res.erros.push({ nome: c.nome, motivo: e?.message || "erro" });
      }
    }));
    progressoAtual.feito = res.auditados;
  }
  res.tempo = Math.round((Date.now() - t0) / 1000);
  progressoAtual.ativo = false;
  progressoAtual.fase = "";
  return res;
}

async function lerCache(): Promise<{ quando: string; candidatos: Candidato[] } | null> {
  try {
    const raw = await readFile(CACHE_FILE, "utf8");
    const c = JSON.parse(raw);
    const idade = Date.now() - new Date(c.quando).getTime();
    if (idade < 24 * 3600 * 1000 && Array.isArray(c.candidatos) && c.candidatos.length) return c;
  } catch { /* sem cache */ }
  return null;
}
async function salvarCache(candidatos: Candidato[]) {
  try {
    await mkdir(join(VAULT, "SaaS", "Prospeccao"), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify({ quando: new Date().toISOString(), candidatos }, null, 2), "utf8");
  } catch { /* sem vault */ }
}
async function iaDisponivel(): Promise<boolean> {
  try {
    const fs = require("node:fs");
    return fs.existsSync(IA_MJS);
  } catch { return false; }
}

export async function prospectorStatus() {
  return {
    google_places: !!PLACES_KEY,
    fonte_ativa: PLACES_KEY ? "google-places" : "kimi-discovery",
    ia_router: await iaDisponivel(),
    obs: PLACES_KEY ? "" : "sem GOOGLE_PLACES_KEY: descoberta via Kimi (IA Router) + OSM fallback",
  };
}