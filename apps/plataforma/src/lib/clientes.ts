// Clientes · leitura (lado do app): lê vault/40 Comercial/Clientes/*.md e
// devolve nome, status e segmento do frontmatter. Tolerante a falha.
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const DIR = join(VAULT, "40 Comercial", "Clientes");

export type Cliente = {
  id: string;
  nome: string;
  status: string;
  segmento: string;
};

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

export async function listarClientes(): Promise<Cliente[]> {
  let files: string[] = [];
  try {
    files = (await readdir(DIR)).filter((f) => f.toLowerCase().endsWith(".md"));
  } catch {
    return [];
  }
  const out: Cliente[] = [];
  for (const f of files) {
    try {
      const raw = await readFile(join(DIR, f), "utf8");
      const fm = parseFrontmatter(raw);
      const id = f.replace(/\.md$/i, "");
      out.push({
        id,
        nome: fm.cliente || id,
        status: fm.status || "",
        segmento: fm.segmento || "",
      });
    } catch {
      /* ignora arquivo ilegível */
    }
  }
  return out.sort((a, b) => a.nome.localeCompare(b.nome));
}
