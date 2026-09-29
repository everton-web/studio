// Orquestra · sala de reunião dos agentes + estado ao vivo.
// As demandas agora vivem em lib/demandas.ts (fonte única: vault/SaaS/Agentes/Demandas/<id>.md).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { listarDemandas } from "./demandas";

export { listarDemandas, criarDemanda, atualizarStatus, atualizarPersona, lerDemanda, acrescentarLog } from "./demandas";
export type { Demanda, DemandaStatus } from "./demandas";

const PROJECT_ROOT = resolve(process.cwd(), ".."); // PROJETO DIGITAL
const SALA_DIR = join(PROJECT_ROOT, "_scripts", "orquestra");
const SALA = join(SALA_DIR, "sala.json");

export type MensagemSala = { quando: string; de: string; para?: string; texto: string };

async function ler(path: string): Promise<any[]> {
  try { return JSON.parse(await readFile(path, "utf8")); } catch { return []; }
}
async function gravar(path: string, v: any[]) {
  try { await mkdir(SALA_DIR, { recursive: true }); await writeFile(path, JSON.stringify(v, null, 2), "utf8"); } catch { /* sem escrita */ }
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
  const demandas = await listarDemandas();
  const out: Record<string, { ocupado: boolean; demanda?: string }> = {
    caio: { ocupado: false },
    davi: { ocupado: false },
    theo: { ocupado: false },
    mia: { ocupado: false },
    orquestra: { ocupado: false },
    lia: { ocupado: false },
    fabio: { ocupado: false },
    olga: { ocupado: false },
    "davi-copy": { ocupado: false },
  };
  for (const d of demandas) {
    if (d.status === "em_andamento") {
      const alvo = out[d.persona];
      if (alvo) { alvo.ocupado = true; alvo.demanda = d.titulo.slice(0, 80); }
    }
  }
  return out;
}

// Compat: nomes antigos apontando para a fonte única.
export const listarFila = listarDemandas;
