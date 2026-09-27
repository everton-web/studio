// Orquestra — leitura/escrita da fila de demandas + sala de reunião dos agentes.
// Fonte: _scripts/orquestra/fila.json e sala.json (raiz do projeto, compartilhado com os terminais).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const PROJECT_ROOT = resolve(process.cwd(), ".."); // PROJETO DIGITAL
const DIR = join(PROJECT_ROOT, "_scripts", "orquestra");
const FILA = join(DIR, "fila.json");
const SALA = join(DIR, "sala.json");

export type Demanda = {
  id: string;
  engine: string;
  prompt: string;
  status: "pendente" | "rodando" | "ok" | "erro";
  criado?: string;
  saida?: string;
  atribuido?: string; // agente (caio|davi|theo|mia|orquestra)
  ia?: string; // barata | claude
};
export type MensagemSala = { quando: string; de: string; para?: string; texto: string };

async function ler(path: string): Promise<any[]> {
  try { return JSON.parse(await readFile(path, "utf8")); } catch { return []; }
}
async function gravar(path: string, v: any[]) {
  try { await mkdir(DIR, { recursive: true }); await writeFile(path, JSON.stringify(v, null, 2), "utf8"); } catch { /* sem escrita */ }
}

export async function listarFila(): Promise<Demanda[]> {
  const fila = await ler(FILA);
  return fila.filter((t) => t && t.id).sort((a, b) => (a.status === b.status ? 0 : a.status === "pendente" ? -1 : 1));
}

export async function novaDemanda(op: { texto: string; atribuido?: string; ia?: string }): Promise<Demanda> {
  const fila = await ler(FILA);
  const d: Demanda = {
    id: `dem-${Date.now().toString(36)}`,
    engine: op.atribuido === "theo" ? "shell" : "claude",
    prompt: op.texto,
    status: "pendente",
    criado: new Date().toISOString(),
    atribuido: op.atribuido || "orquestra",
    ia: op.ia || "barata",
  };
  fila.push(d);
  await gravar(FILA, fila);
  return d;
}

export async function atribuir(op: { id: string; agente?: string; status?: string }): Promise<Demanda | null> {
  const fila = await ler(FILA);
  const d = fila.find((x) => x.id === op.id);
  if (!d) return null;
  if (op.agente) d.atribuido = op.agente;
  if (op.status) d.status = op.status;
  await gravar(FILA, fila);
  return d;
}

export async function removerDemanda(id: string) {
  await gravar(FILA, (await ler(FILA)).filter((x) => x.id !== id));
}

export async function mensagensSala(): Promise<MensagemSala[]> {
  const m = await ler(SALA);
  return m.slice(-80);
}

export async function postarSala(op: { de: string; texto: string; para?: string }): Promise<MensagemSala> {
  const m: MensagemSala = {
    quando: new Date().toLocaleString("pt-BR"),
    de: op.de || "orquestra",
    para: op.para,
    texto: op.texto,
  };
  const sala = await ler(SALA);
  sala.push(m);
  await gravar(SALA, sala.slice(-200));
  return m;
}

export async function estadoAgentes(): Promise<Record<string, { ocupado: boolean; demanda?: string }>> {
  const fila = await listarFila();
  const out: Record<string, { ocupado: boolean; demanda?: string }> = {
    caio: { ocupado: false }, davi: { ocupado: false }, theo: { ocupado: false }, mia: { ocupado: false }, orquestra: { ocupado: false },
  };
  for (const d of fila) {
    if (d.status === "pendente" || d.status === "rodando") {
      const alvo = out[d.atribuido || "orquestra"];
      if (alvo) { alvo.ocupado = true; alvo.demanda = d.prompt.slice(0, 80); }
    }
  }
  return out;
}