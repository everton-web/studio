// Saúde do site · leitura (lado do app): lê vault/SaaS/Saude/*.json, gravados
// pelo verificador _scripts/saude-site.mjs. Tolerante a falha.
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const DIR = join(VAULT, "SaaS", "Saude");

export type SaudeSite = {
  slug: string;
  cliente: string;
  no_ar: boolean | null;
  certificado_dias: number | null;
  formulario: string | null;
  verificado_em: string;
};

function asBool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

function asNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function asStr(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

function asObj(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

export async function lerSaude(): Promise<SaudeSite[]> {
  let files: string[] = [];
  try {
    files = (await readdir(DIR)).filter((f) => f.toLowerCase().endsWith(".json"));
  } catch {
    return [];
  }
  const out: SaudeSite[] = [];
  for (const f of files) {
    try {
      const raw = await readFile(join(DIR, f), "utf8");
      const obj = asObj(JSON.parse(raw));
      if (!obj) continue;
      const slug = asStr(obj.slug) || f.replace(/\.json$/i, "");
      out.push({
        slug,
        cliente: asStr(obj.cliente) || slug,
        no_ar: asBool(obj.no_ar),
        certificado_dias: asNum(obj.certificado_dias),
        formulario: asStr(obj.formulario),
        verificado_em: asStr(obj.verificado_em) || "",
      });
    } catch {
      /* ignora arquivo ilegível */
    }
  }
  return out.sort((a, b) => a.cliente.localeCompare(b.cliente));
}
