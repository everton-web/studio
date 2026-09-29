// Demandas · fonte única (lado do app): um arquivo markdown por demanda em
// vault/SaaS/Agentes/Demandas/<id>.md, com frontmatter YAML + seção ## Log append-only.
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";

const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const DIR = join(VAULT, "SaaS", "Agentes", "Demandas");

export type DemandaStatus =
  | "fila"
  | "em_andamento"
  | "bloqueada"
  | "aguardando_cliente"
  | "concluida"
  | "cancelada";

export type Demanda = {
  id: string;
  titulo: string;
  persona: string;
  status: DemandaStatus;
  criada_em: string;
  iniciada_em: string;
  concluida_em: string;
  prazo: string;
  cliente: string;
  projeto: string;
  origem: string;
  briefing: string;
  log: string[];
};

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
] as const;

// ---------- frontmatter (mesmo padrão de lib/vault.ts) ----------
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
  return `dem-${Date.now().toString(36)}`;
}

// extrai as linhas "- ..." da seção ## Log (nunca inventa conteúdo)
function extrairLog(raw: string): string[] {
  const m = raw.match(/^##\s+Log\s*$/m);
  if (!m) return [];
  const desde = raw.slice((m.index ?? 0) + m[0].length).replace(/^\r?\n/, "");
  const prox = desde.search(/^##\s/m);
  const secao = prox === -1 ? desde : desde.slice(0, prox);
  return secao
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^-\s+/, ""));
}

function toDemanda(raw: string, idFallback: string): Demanda {
  const fm = parseFrontmatter(raw);
  return {
    id: fm.id || idFallback,
    titulo: fm.titulo || "",
    persona: fm.persona || "",
    status: (fm.status as DemandaStatus) || "fila",
    criada_em: fm.criada_em || "",
    iniciada_em: fm.iniciada_em || "",
    concluida_em: fm.concluida_em || "",
    prazo: fm.prazo || "",
    cliente: fm.cliente || "",
    projeto: fm.projeto || "",
    origem: fm.origem || "",
    briefing: fm.briefing || "",
    log: extrairLog(raw),
  };
}

async function salvar(d: Demanda): Promise<void> {
  try {
    await mkdir(DIR, { recursive: true });
    const fm: Record<string, string> = {
      id: d.id,
      titulo: d.titulo,
      persona: d.persona,
      status: d.status,
      criada_em: d.criada_em,
      iniciada_em: d.iniciada_em,
      concluida_em: d.concluida_em,
      prazo: d.prazo,
      cliente: d.cliente,
      projeto: d.projeto,
      origem: d.origem,
      briefing: d.briefing,
    };
    const corpo = d.log.map((l) => `- ${l.replace(/\r?\n/g, " ")}`).join("\n");
    const md = `${fmBlock(fm)}\n\n## Log\n${corpo}${corpo ? "\n" : ""}`;
    await writeFile(join(DIR, `${d.id}.md`), md, "utf8");
  } catch {
    /* sem escrita */
  }
}

// ---------- leitura / escrita ----------
export async function listarDemandas(): Promise<Demanda[]> {
  let files: string[] = [];
  try {
    files = (await readdir(DIR)).filter((f) => f.toLowerCase().endsWith(".md"));
  } catch {
    return [];
  }
  const out: Demanda[] = [];
  for (const f of files) {
    try {
      const raw = await readFile(join(DIR, f), "utf8");
      out.push(toDemanda(raw, f.replace(/\.md$/i, "")));
    } catch {
      /* ignora arquivo ilegível */
    }
  }
  return out.sort((a, b) =>
    a.criada_em < b.criada_em ? 1 : a.criada_em > b.criada_em ? -1 : 0,
  );
}

export async function lerDemanda(id: string): Promise<Demanda | null> {
  try {
    const raw = await readFile(join(DIR, `${id}.md`), "utf8");
    return toDemanda(raw, id);
  } catch {
    return null;
  }
}

export async function criarDemanda(op: {
  titulo: string;
  persona?: string;
  briefing?: string;
  origem?: string;
  prazo?: string;
  cliente?: string;
  projeto?: string;
}): Promise<Demanda> {
  const agora = new Date().toISOString();
  const persona = op.persona || "orion";
  const d: Demanda = {
    id: gerarId(),
    titulo: op.titulo,
    persona,
    status: "fila",
    criada_em: agora,
    iniciada_em: "",
    concluida_em: "",
    prazo: op.prazo || "",
    cliente: op.cliente || "",
    projeto: op.projeto || "",
    origem: op.origem || "orion",
    briefing: op.briefing || "",
    log: [`${agora} ${persona} fila criada`],
  };
  await salvar(d);
  return d;
}

// REGRA DURA: atualizarStatus lê o arquivo e só troca status, timestamps de
// transição e Log. Campos de execução (titulo, persona, criada_em, iniciada_em,
// briefing, prazo, cliente, projeto, origem) vêm do disco e nunca são sobrescritos
// por este caminho, em especial quando o status atual é "em_andamento".
export async function atualizarStatus(
  id: string,
  status: DemandaStatus,
  op?: { quem?: string; nota?: string },
): Promise<Demanda | null> {
  const d = await lerDemanda(id);
  if (!d) return null;

  const agora = new Date().toISOString();
  const quem = op?.quem || "orion";
  const nota = op?.nota ? ` ${op.nota}` : "";

  d.status = status;
  if (status === "em_andamento" && !d.iniciada_em) d.iniciada_em = agora;
  if ((status === "concluida" || status === "cancelada") && !d.concluida_em) {
    d.concluida_em = agora;
  }
  d.log.push(`${agora} ${quem} ${status}${nota}`);

  await salvar(d);
  return d;
}

// Atualiza a persona. Respeita a REGRA DURA: se a demanda está em_andamento,
// não mexe (retorna a demanda como está).
export async function atualizarPersona(
  id: string,
  persona: string,
): Promise<Demanda | null> {
  const d = await lerDemanda(id);
  if (!d) return null;
  if (d.status === "em_andamento") return d;
  d.persona = persona;
  await salvar(d);
  return d;
}

// append-only sob ## Log: insere a linha no fim da seção, sem tocar no resto.
export async function acrescentarLog(id: string, linha: string): Promise<void> {
  try {
    await mkdir(DIR, { recursive: true });
    let raw: string;
    try {
      raw = await readFile(join(DIR, `${id}.md`), "utf8");
    } catch {
      return;
    }
    const entry = `- ${linha.replace(/\r?\n/g, " ")}`;
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
  } catch {
    /* sem escrita */
  }
}
