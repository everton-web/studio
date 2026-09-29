// Reuniões · fonte única (lado do app): um arquivo markdown por reunião em
// vault/SaaS/Agenda/Reunioes/<id>.md, com frontmatter YAML (ordem fixa).
// Mesmo padrão de lib/demandas.ts, tolerante a falha.
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";

const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const DIR = join(VAULT, "SaaS", "Agenda", "Reunioes");

export type Reuniao = {
  id: string;
  titulo: string;
  quando: string;
  duracao: number;
  participante: string;
  criada_em: string;
};

// ordem fixa das chaves no frontmatter
const CHAVES = [
  "id",
  "titulo",
  "quando",
  "duracao",
  "participante",
  "criada_em",
] as const;

// ---------- frontmatter (mesmo padrão de lib/demandas.ts) ----------
function parseFrontmatter(md: string): Record<string, string> {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {} as Record<string, string>;
  const fm: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

function fmBlock(fm: Record<string, string>) {
  return (
    "---\n" +
    CHAVES.map((k) => `${k}: ${(fm[k] || "").replace(/\r?\n/g, " ")}`).join("\n") +
    "\n---"
  );
}

function gerarId() {
  return `reu-${Date.now().toString(36)}`;
}

function toReuniao(raw: string, idFallback: string): Reuniao {
  const fm = parseFrontmatter(raw);
  const dur = Number(fm.duracao);
  return {
    id: fm.id || idFallback,
    titulo: fm.titulo || "",
    quando: fm.quando || "",
    duracao: Number.isFinite(dur) ? dur : 0,
    participante: fm.participante || "",
    criada_em: fm.criada_em || "",
  };
}

async function salvar(r: Reuniao): Promise<void> {
  try {
    await mkdir(DIR, { recursive: true });
    const fm: Record<string, string> = {
      id: r.id,
      titulo: r.titulo,
      quando: r.quando,
      duracao: String(r.duracao),
      participante: r.participante,
      criada_em: r.criada_em,
    };
    await writeFile(join(DIR, `${r.id}.md`), `${fmBlock(fm)}\n`, "utf8");
  } catch {
    /* sem escrita */
  }
}

// ---------- leitura / escrita ----------
export async function listarReunioes(): Promise<Reuniao[]> {
  let files: string[] = [];
  try {
    files = (await readdir(DIR)).filter((f) => f.toLowerCase().endsWith(".md"));
  } catch {
    return [];
  }
  const out: Reuniao[] = [];
  for (const f of files) {
    try {
      const raw = await readFile(join(DIR, f), "utf8");
      out.push(toReuniao(raw, f.replace(/\.md$/i, "")));
    } catch {
      /* ignora arquivo ilegível */
    }
  }
  return out.sort((a, b) => (a.quando < b.quando ? -1 : a.quando > b.quando ? 1 : 0));
}

export async function criarReuniao(op: {
  titulo: string;
  quando: string;
  duracao?: number;
  participante?: string;
}): Promise<Reuniao> {
  const dur = Number(op.duracao);
  const r: Reuniao = {
    id: gerarId(),
    titulo: op.titulo,
    quando: op.quando,
    duracao: Number.isFinite(dur) && dur > 0 ? dur : 30,
    participante: op.participante || "",
    criada_em: new Date().toISOString(),
  };
  await salvar(r);
  return r;
}
