// Prospector automático — o agente encontra leads e audita os sites sozinho.
// Fontes, em ordem de tentativa:
//   1. Google Places API  (chave em GOOGLE_PLACES_KEY — critério ouro: nota, avaliações, site)
//   2. Kimi-discovery     (IA Router `_scripts/ia.mjs --engine leitura` lista candidatos; cada
//                          site é VALIDADO com HTTP antes de virar candidato — barra alucinação)
//   3. Overpass/OSM       (fallback sem chave — só funciona se algum mirror global estiver no ar)
//   4. Cache da última leva boa (24h)
// Fluxo: buscar → filtrar (tem site) → auditar site → criar ficha no pipeline (estágio 0).

import { readdir, mkdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { pipelineOp, leadBase, gravarAnaliseNaFicha } from "./vault";
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

export type Candidato = {
  nome: string;
  site: string;
  telefone?: string;
  cidade?: string;
  nota?: number;
  avaliacoes?: number;
  endereco?: string;
  segmento?: string;
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
};

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

async function jaExiste(nome: string): Promise<boolean> {
  const slug = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  try {
    const files = await readdir(LEADS_DIR);
    return files.some((f) => f.toLowerCase() === `${slug}.md`);
  } catch { return false; }
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
      const r = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=name,rating,user_ratings_total,website,formatted_phone_number,formatted_address&language=pt-BR&key=${PLACES_KEY}`);
      const d = await r.json() as { result?: { name?: string; rating?: number; user_ratings_total?: number; website?: string; formatted_phone_number?: string; formatted_address?: string } };
      const res = d.result || {};
      out.push({
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
  return out.filter((c) => c.nome && c.site);
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

async function fonteKimi(nicho: string, cidade: string, limite: number): Promise<Candidato[]> {
  if (!ROOT || !require("node:fs").existsSync(IA_MJS)) return [];
  const prompt =
    `Liste ${Math.min(12, limite * 2)} empresas reais do segmento "${nicho}" em ${cidade} (BA), que hoje (2026) tenham SITE PRÓPRIO funcionando — NÃO página de rede social, NÃO agregador, NÃO ifood/agenda. ` +
    `Responda APENAS com um JSON array válido e nada mais, no formato: [{"nome":"Nome da Empresa","site":"https://dominio.br"}]`;
  const saida = await runIa("leitura", prompt, 60000);
  const arr = extrairJsonArray(saida);
  const out: Candidato[] = [];
  const vistos = new Set<string>();
  for (const it of arr) {
    if (!it?.nome || !it?.site) continue;
    const site = it.site.trim().startsWith("http") ? it.site.trim() : `https://${it.site.trim()}`;
    const chave = `${it.nome.trim()}|${site}`.toLowerCase();
    if (vistos.has(chave)) continue; vistos.add(chave);
    if (!(await siteExiste(site))) continue; // domínio fantasma → fora
    out.push({ nome: it.nome.trim(), site, cidade, segmento: nicho });
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
export async function auditarSite(url: string): Promise<{ ok: boolean; problemas: string[]; info: string[] }> {
  const u = url.startsWith("http") ? url : `https://${url}`;
  const problemas: string[] = [];
  const info: string[] = [];
  try {
    const html = await fetchTexto(u);
    const low = html.toLowerCase();
    if (!/<meta[^>]+name=["']viewport["']/i.test(html)) problemas.push("sem meta viewport (quebra no celular)");
    if (!/wa\.me\/|api\.whatsapp\.com|whatsapp/i.test(low)) problemas.push("sem botão/WhatsApp visível");
    if (!/tel:/i.test(low)) problemas.push("sem telefone clicável");
    if (!/<title>/i.test(low)) problemas.push("sem título de página");
    const year = (html.match(/20\d\d/) || [])[0];
    if (year && Number(year) < 2023) problemas.push(`conteúdo datado (${year})`);
    if (/wix\.com|google\.com\/sites|webnode|gratis/i.test(low)) problemas.push("plataforma gratuita/terceirizada");
    if (/<style/i.test(html) && html.length < 8000) info.push("página minimalista");
    if (/responsive|mobile/i.test(low)) info.push("indícios de responsividade no código");
    return { ok: true, problemas, info };
  } catch (e: any) {
    return { ok: false, problemas: [`site inacessível (${e?.message || "erro"})`], info: [] };
  }
}

// ---------- orquestrador ----------
export async function prospectar(op: { nicho?: string; cidade?: string; limite?: number } = {}): Promise<Resultado> {
  const t0 = Date.now();
  const nicho = (op.nicho || "odontologia").toLowerCase();
  const cidade = op.cidade || "Salvador/BA";
  const limite = Math.min(30, Math.max(1, op.limite || 8));
  const temChave = !!PLACES_KEY;
  const res: Resultado = { fonte: "", auditados: 0, adicionados: [], descartados: [], erros: [], candidatos: 0, aviso: "", tempo: 0 };

  let candidatos: Candidato[] = [];
  let usouCache = false;

  // 1. Google Places (se houver chave)
  if (temChave) {
    try {
      candidatos = await fontePlaces(nicho, cidade, limite);
      res.fonte = "google-places";
    } catch (e: any) { res.erros.push({ nome: "google-places", motivo: e?.message || "falha" }); }
  }

  // 2. Kimi-discovery (IA Router — sem precisar de chave)
  if (!candidatos.length) {
    try {
      const k = await fonteKimi(nicho, cidade, limite);
      if (k.length) { candidatos = k; res.fonte = "kimi-discovery"; }
    } catch (e: any) { res.erros.push({ nome: "kimi", motivo: e?.message || "falha no IA Router" }); }
  }

  // 3. Overpass/OSM (fallback global)
  if (!candidatos.length) {
    try {
      const o = await fonteOsm(nicho, cidade, limite);
      if (o.length) { candidatos = o; res.fonte = "overpass-osm"; }
    } catch (e: any) { res.erros.push({ nome: "overpass", motivo: e?.message || "falha nos mirrors" }); }
  }

  // 4. Cache da última leva boa (24h)
  if (!candidatos.length) {
    const cache = await lerCache();
    if (cache) { candidatos = cache.candidatos.slice(0, limite); usouCache = true; res.fonte = res.fonte || "cache"; }
  }

  if (!candidatos.length) {
    res.aviso = `Nenhuma fonte retornou candidatos de "${nicho}" em ${cidade}. ` +
      (temChave ? "As fontes falharam — confira a chave Google Places e a rede." : "Sem GOOGLE_PLACES_KEY, usei Kimi + OSM — verifique se o IA Router está no ar (node _scripts/ia.mjs --check).");
    res.tempo = Math.round((Date.now() - t0) / 1000);
    return res;
  }
  if (!temChave && !usouCache) await salvarCache(candidatos.slice(0, limite));
  if (usouCache) res.fonte = `${res.fonte} (cache da última leva boa)`;

  res.candidatos = candidatos.length;
  const lote = 4;
  for (let i = 0; i < candidatos.length; i += lote) {
    const fatia = candidatos.slice(i, i + lote);
    await Promise.allSettled(fatia.map(async (c) => {
      try {
        if (await jaExiste(c.nome)) { res.descartados.push({ nome: c.nome, motivo: "já está no pipeline" }); return; }
        const aud = await auditarSite(c.site);
        res.auditados++;
        if (!aud.ok) { res.descartados.push({ nome: c.nome, motivo: aud.problemas.join(" · ") }); return; }
        if (aud.problemas.length < 2) { res.descartados.push({ nome: c.nome, motivo: `site ok (${aud.problemas.length} problema(s))` }); return; }

        const notaTxt = c.nota && c.nota > 0 ? String(c.nota).replace(".", ",") : "";
        const porque = `Auditoria automática do agente: ${aud.problemas.join("; ")}. Fonte da ficha: ${res.fonte}${c.nota ? ` · nota Google ${c.nota}` : ""}${c.avaliacoes ? ` · ${c.avaliacoes} avaliações` : ""}.`;
        const novo = await pipelineOp({
          action: "add",
          nome: c.nome,
          segmento: c.segmento || nicho,
          cidade: c.cidade || cidade,
          nota: notaTxt,
          avaliacoes: c.avaliacoes ? String(c.avaliacoes) : "",
          site: c.site,
          contato: c.telefone || "",
          whatsapp: c.telefone || "",
          categoria: "maps",
          porque,
        });
        res.adicionados.push(c.nome);
        // o lead já chega no quadro com a análise de presença (Google, site, redes, o que falta)
        if (novo && "id" in novo && novo.id) {
          try {
            const base = await leadBase(novo.id);
            if (base) {
              const a = await analisarLead(base);
              await salvarAnalise(a);
              await gravarAnaliseNaFicha(base.id, resumoMd(a), a.pontuacao);
            }
          } catch { /* a análise pode ser refeita pela ficha */ }
        }
      } catch (e: any) {
        res.erros.push({ nome: c.nome, motivo: e?.message || "erro" });
      }
    }));
  }
  res.tempo = Math.round((Date.now() - t0) / 1000);
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
    obs: PLACES_KEY ? "" : "sem GOOGLE_PLACES_KEY — descoberta via Kimi (IA Router) + OSM fallback",
  };
}