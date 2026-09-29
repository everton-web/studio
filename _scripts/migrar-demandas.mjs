#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  MIGRAR-DEMANDAS — conversão única (idempotente) das fontes antigas para a
//  fonte única: vault/SaaS/Agentes/Demandas/<id>.md.
//
//  Fontes:
//    · docs/demandas/**/*.md  (briefings; ignora .../logs/, .txt e arquivos sem
//      prefixo <n>-<persona>-)
//    · vault/SaaS/Agentes/ao-vivo/*.json  (execuções registradas pelo persona.mjs)
//
//  Regra do briefing: um briefing citado por um ao-vivo vira UMA demanda só
//  (se vários ao-vivo citam o mesmo, vale o mais recente).
//
//  Idempotente: se vault/SaaS/Agentes/Demandas/<id>.md já existe, pula.
//  NÃO apaga nada de origem. Uso: node _scripts/migrar-demandas.mjs
//
//  Dependências: apenas node:fs/promises, node:path e node:url.
// ─────────────────────────────────────────────────────────────────────────────
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VAULT = process.env.VAULT || join(ROOT, "vault");
const DIR = join(VAULT, "SaaS", "Agentes", "Demandas");
const AO_VIVO = join(VAULT, "SaaS", "Agentes", "ao-vivo");
const DOCS = join(ROOT, "docs", "demandas");

const CHAVES = [
  "id",
  "titulo",
  "persona",
  "status",
  "criada_em",
  "iniciada_em",
  "concluida_em",
  "prazo",
  "cliente",
  "projeto",
  "origem",
  "briefing",
];

// personas conhecidas (mais longas primeiro, para casar "davi-copy" antes de "davi")
const CONHECIDAS = ["davi-copy", "redator", "fabio", "orion", "caio", "davi", "theo", "olga", "mia", "lia"];
const VALIDAS = new Set(["caio", "davi", "davi-copy", "theo", "mia", "lia", "fabio", "olga", "orion"]);

function mapPersona(p) {
  if (p === "redator") return "davi-copy";
  return VALIDAS.has(p) ? p : "orion";
}

function extrairBriefing(texto) {
  const m = String(texto || "").match(/\bdocs\/demandas\/[\w-]+\/[\w-]+\.md/);
  return m ? m[0] : "";
}

function statusDe(estado) {
  if (estado === "pronto") return "concluida";
  if (estado === "falhou") return "bloqueada";
  if (estado === "trabalhando" || estado === "janela" || estado === "tentando de novo") return "em_andamento";
  return "fila";
}

function hashBase36(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36);
}

function limpar(v) {
  return String(v ?? "").replace(/\r?\n/g, " ");
}

// normaliza travessão (—) e meia-risca (–) para · (U+00B7), exceto quando o
// próprio título fala sobre esses caracteres (ex.: "tirar o travessão/meia-risca")
function normalizarTitulo(t) {
  const s = String(t ?? "");
  if (/travess[ãa]o|meia-risca/i.test(s)) return s;
  return s.replace(/[—–]/g, "·");
}

function montar(d) {
  const fm = CHAVES.map((k) => `${k}: ${limpar(d[k])}`).join("\n");
  const log = Array.isArray(d.log) ? d.log : [];
  const corpo = log.map((l) => `- ${limpar(l)}`).join("\n");
  return `---\n${fm}\n---\n\n## Log\n${corpo}${corpo ? "\n" : ""}`;
}

function rel(p) {
  return p.replace(ROOT, "").replace(/\\/g, "/").replace(/^\//, "");
}

async function existe(id) {
  try {
    await readFile(join(DIR, `${id}.md`), "utf8");
    return true;
  } catch {
    return false;
  }
}

async function escrever(id, base, contadores) {
  if (await existe(id)) return false;
  try {
    await mkdir(DIR, { recursive: true });
    await writeFile(join(DIR, `${id}.md`), montar({ ...base, id }), "utf8");
    contadores.ids.push(id);
    return true;
  } catch (e) {
    console.warn(`[migrar] falha ao gravar ${id}: ${e?.message || e}`);
    return false;
  }
}

// ---------- varredura recursiva de briefings ----------
async function briefingsMd(dir) {
  const out = [];
  let entradas = [];
  try {
    entradas = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entradas) {
    const p = join(dir, e.name);
    if (p.replace(/\\/g, "/").includes("/logs/")) continue; // ignora logs
    if (e.isDirectory()) out.push(...(await briefingsMd(p)));
    else if (e.isFile() && /\.md$/i.test(e.name)) out.push(p);
  }
  return out;
}

async function main() {
  const agora = new Date().toISOString();
  const contadores = { briefings: 0, aoVivo: 0, ids: [] };

  // 1) mapa briefingPath -> { numero, data, titulo, persona }
  const briefings = new Map();
  for (const p of await briefingsMd(DOCS)) {
    const base = p.replace(/\\/g, "/").split("/").pop().replace(/\.md$/i, "");
    const m = base.match(/^(\d+)-(.+)$/);
    if (!m) continue; // pula arquivos sem prefixo <n>- (ex.: mensagens-whatsapp)
    const numero = m[1];
    const resto = m[2];
    let persona = "";
    for (const cand of CONHECIDAS) {
      if (resto === cand || resto.startsWith(cand + "-")) {
        persona = mapPersona(cand);
        break;
      }
    }
    if (!persona) persona = "orion";
    const partes = p.replace(/\\/g, "/").split("/");
    const data = partes[partes.length - 2] || "";
    let titulo = base;
    try {
      const md = await readFile(p, "utf8");
      const h = md.match(/^#\s+(.+)$/m);
      if (h) titulo = normalizarTitulo(h[1].trim().replace(/\s+/g, " "));
    } catch {
      /* usa o nome do arquivo */
    }
    briefings.set(rel(p), { numero, data, titulo: titulo.slice(0, 140), persona, aoVivo: null });
  }

  // 2) ao-vivo: casa briefing ou vira demanda própria
  const orfaos = [];
  let arquivosAoVivo = [];
  try {
    arquivosAoVivo = (await readdir(AO_VIVO)).filter((f) => f.toLowerCase().endsWith(".json"));
  } catch {
    /* pasta inexistente */
  }
  for (const f of arquivosAoVivo) {
    let av;
    try {
      av = JSON.parse(await readFile(join(AO_VIVO, f), "utf8"));
    } catch {
      continue;
    }
    if (!av || !av.id) continue;
    const br = extrairBriefing(av.tarefa);
    if (br && briefings.has(br)) {
      const b = briefings.get(br);
      const quando = av.inicio || av.atualizado || "";
      const atual = b.aoVivo;
      if (!atual || new Date(quando).getTime() >= new Date(atual.inicio || atual.atualizado || 0).getTime()) {
        b.aoVivo = av;
      }
    } else {
      orfaos.push(av);
    }
  }

  // 3a) briefing com ao-vivo
  for (const [briefingRel, b] of briefings) {
    const av = b.aoVivo;
    if (av) {
      const status = statusDe(av.estado);
      const terminal = status === "concluida" || status === "bloqueada";
      const data = b.data || "";
      const base = {
        titulo: b.titulo,
        persona: mapPersona(av.persona || b.persona),
        status,
        criada_em: data ? `${data}T00:00:00.000Z` : agora,
        iniciada_em: av.inicio || "",
        concluida_em: terminal ? av.fim || av.atualizado || "" : "",
        prazo: "",
        cliente: "",
        projeto: "",
        origem: "migracao",
        briefing: briefingRel,
        log: [`${agora} migracao ${briefingRel} (ao-vivo ${av.id}, estado ${av.estado})`],
      };
      if (await escrever(`dem-${data}-${b.numero}`, base, contadores)) contadores.briefings++;
    } else {
      // 3b) briefing sem ao-vivo
      const data = b.data || "";
      const base = {
        titulo: b.titulo,
        persona: b.persona,
        status: "fila",
        criada_em: data ? `${data}T00:00:00.000Z` : agora,
        iniciada_em: "",
        concluida_em: "",
        prazo: "",
        cliente: "",
        projeto: "",
        origem: "migracao",
        briefing: briefingRel,
        log: [`${agora} migracao ${briefingRel}`],
      };
      if (await escrever(`dem-${data}-${b.numero}`, base, contadores)) contadores.briefings++;
    }
  }

  // 3c) ao-vivo sem briefing
  for (const av of orfaos) {
    const status = statusDe(av.estado);
    const terminal = status === "concluida" || status === "bloqueada";
    const base = {
      titulo: (av.tarefa || "").replace(/\s+/g, " ").trim().slice(0, 120),
      persona: mapPersona(av.persona || "orion"),
      status,
      criada_em: av.inicio || agora,
      iniciada_em: av.inicio || "",
      concluida_em: terminal ? av.fim || av.atualizado || "" : "",
      prazo: "",
      cliente: "",
      projeto: "",
      origem: "migracao",
      briefing: "",
      log: [`${agora} migracao ao-vivo ${av.id}`],
    };
    const id = `dem-ao-${hashBase36(String(av.id))}`;
    if (await escrever(id, base, contadores)) contadores.aoVivo++;
  }

  // 5) relatório
  const total = contadores.briefings + contadores.aoVivo;
  console.log(
    `gerou ${total} demandas (${contadores.briefings} briefings, ${contadores.aoVivo} ao-vivo)`,
  );
  if (total === 0) console.log("(nada novo: todos os ids já existem)");
  for (const id of contadores.ids) console.log(`  ${id}`);
}

main().catch((e) => {
  console.error(`[migrar] erro: ${e?.message || e}`);
  process.exit(1);
});
