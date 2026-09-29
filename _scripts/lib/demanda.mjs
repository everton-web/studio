#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  DEMANDA — fonte única de demandas (lado dos SCRIPTS Node).
//
//  Espelha o formato de apps/plataforma/src/lib/demandas.ts: um markdown por
//  demanda em vault/SaaS/Agentes/Demandas/<id>.md, com frontmatter YAML (ordem
//  fixa) + seção ## Log append-only. Não importa TS — reimplementado em JS.
//
//  Usado por _scripts/persona.mjs e por _scripts/qa/e2e-demanda.mjs.
//  Toda escrita é tolerante a falha: nunca lança para fora (console.warn).
// ─────────────────────────────────────────────────────────────────────────────
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const VAULT = process.env.VAULT || join(ROOT, "vault");
const DIR = join(VAULT, "SaaS", "Agentes", "Demandas");

export { ROOT, VAULT, DIR };

// ordem fixa das chaves no frontmatter
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

// ao atualizar uma demanda em_andamento só estes campos podem mudar
const EM_ANDAMENTO_PERMITE = new Set(["status", "iniciada_em", "concluida_em"]);

export function gerarId() {
  return `dem-${Date.now().toString(36)}`;
}

function limpar(v) {
  return String(v ?? "").replace(/\r?\n/g, " ");
}

export function fmBlock(fm = {}) {
  return (
    "---\n" +
    CHAVES.map((k) => `${k}: ${limpar(fm[k])}`).join("\n") +
    "\n---"
  );
}

function parseFrontmatter(md) {
  const m = String(md).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

// extrai as linhas "- ..." da seção ## Log (nunca inventa conteúdo)
function extrairLog(raw) {
  const m = String(raw).match(/^##\s+Log\s*$/m);
  if (!m) return [];
  const desde = String(raw).slice((m.index ?? 0) + m[0].length).replace(/^\r?\n/, "");
  const prox = desde.search(/^##\s/m);
  const secao = prox === -1 ? desde : desde.slice(0, prox);
  return secao
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^-\s+/, ""));
}

function montar(d) {
  const fm = {};
  for (const k of CHAVES) fm[k] = d[k] ?? "";
  const log = Array.isArray(d.log) ? d.log : [];
  const corpo = log.map((l) => `- ${limpar(l)}`).join("\n");
  return `${fmBlock(fm)}\n\n## Log\n${corpo}${corpo ? "\n" : ""}`;
}

async function gravar(d) {
  try {
    await mkdir(DIR, { recursive: true });
    await writeFile(join(DIR, `${d.id}.md`), montar(d), "utf8");
    return true;
  } catch (e) {
    console.warn(`[demanda] falha ao gravar ${d?.id}: ${e?.message || e}`);
    return false;
  }
}

// ---------- API pública ----------

export async function lerDemanda(id) {
  try {
    const raw = await readFile(join(DIR, `${id}.md`), "utf8");
    return { fm: parseFrontmatter(raw), log: extrairLog(raw) };
  } catch {
    return null;
  }
}

export async function criarDemanda(op = {}) {
  try {
    const agora = new Date().toISOString();
    const persona = op.persona || "orion";
    const status = op.status || "fila";
    const d = {
      id: gerarId(),
      titulo: op.titulo || "",
      persona,
      status,
      criada_em: agora,
      iniciada_em: status === "em_andamento" ? agora : "",
      concluida_em: "",
      prazo: op.prazo || "",
      cliente: op.cliente || "",
      projeto: op.projeto || "",
      origem: op.origem || "orion",
      briefing: op.briefing || "",
      log: [`${agora} ${persona} ${status} criada`],
    };
    const ok = await gravar(d);
    return ok ? d : null;
  } catch (e) {
    console.warn(`[demanda] falha ao criar: ${e?.message || e}`);
    return null;
  }
}

export async function atualizarDemanda(id, parcial = {}) {
  try {
    const lido = await lerDemanda(id);
    if (!lido) return null;
    const atual = lido.fm || {};
    const permitido =
      atual.status === "em_andamento" ? EM_ANDAMENTO_PERMITE : null;
    const d = { ...atual, log: lido.log || [] };
    for (const [k, v] of Object.entries(parcial || {})) {
      if (k === "log") continue;
      if (permitido && !permitido.has(k)) continue; // REGRA DURA
      if (!CHAVES.includes(k)) continue;
      d[k] = v;
    }
    const ok = await gravar(d);
    return ok ? d : null;
  } catch (e) {
    console.warn(`[demanda] falha ao atualizar ${id}: ${e?.message || e}`);
    return null;
  }
}

// append-only sob ## Log: cria a seção se faltar, sem tocar no resto.
export async function acrescentarLog(id, linha) {
  try {
    await mkdir(DIR, { recursive: true });
    let raw;
    try {
      raw = await readFile(join(DIR, `${id}.md`), "utf8");
    } catch {
      return false;
    }
    const entry = `- ${limpar(linha)}`;
    const idx = raw.search(/^##\s+Log\s*$/m);

    if (idx === -1) {
      const base = raw.replace(/\s+$/, "");
      raw = `${base}\n\n## Log\n${entry}\n`;
    } else {
      const antes = raw.slice(0, idx);
      const desde = raw.slice(idx);
      const fimTitulo = desde.indexOf("\n") + 1;
      const titulo = desde.slice(0, fimTitulo);
      const corpo = desde.slice(fimTitulo);
      const prox = corpo.search(/^##\s/m);
      if (prox === -1) {
        raw = `${antes}${titulo}${corpo.replace(/\s+$/, "")}\n${entry}\n`;
      } else {
        const secao = corpo.slice(0, prox);
        const resto = corpo.slice(prox);
        raw = `${antes}${titulo}${secao.replace(/\s+$/, "")}\n${entry}\n\n${resto}`;
      }
    }
    await writeFile(join(DIR, `${id}.md`), raw, "utf8");
    return true;
  } catch (e) {
    console.warn(`[demanda] falha no log de ${id}: ${e?.message || e}`);
    return false;
  }
}

// primeiro caminho docs/demandas/.../....md citado no texto (ou "")
export function extrairBriefing(texto) {
  const m = String(texto || "").match(/\bdocs\/demandas\/[\w-]+\/[\w-]+\.md/);
  return m ? m[0] : "";
}

// status final da demanda a partir do relatório do pi:
// se o bloco "PENDENTE:" pedir aprovação/decisão do Everton, fica aguardando_everton
export function statusDoRelatorio(saida = "") {
  const m = String(saida).match(/PENDENTE:\s*([\s\S]*?)(?:\n\s*[A-ZÇÃ]{4,}:|$)/i);
  const bloco = m ? m[1] : "";
  const t = bloco.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return /aprov|decis|everton/.test(t) ? "aguardando_everton" : "concluida";
}
