#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  PERSONA — deixa os agentes da Marca Digital (Caio, Davi, Theo, Mia) usarem
//  as IAs de forma independente e "flutuarem" entre elas.
//
//  Uso:
//    node _scripts/persona.mjs <orion|caio|davi|theo|mia|ops> "tarefa" [--ia barata|claude] [--model X]
//
//  --ia barata (padrão, o 80%) → engine bulk (deepseek via gateway pi.dev)
//     --ia leitura            → kimi (contexto gigante)
//     --ia claude             → Claude subscription (o 20%: decide, valida, entrega)
//
//  Regra de flutuação por persona (ver 20 Playbooks/Roteamento de Modelos.md):
//    Orion → orquestrar/dividir/decidir: claude · rotina de fila/painel: barata
//    Caio → mensagem final/benchmark comercial: claude · volume/rotina: barata
//    Davi → auditoria visual (impeccable) e proposta criativa: claude · ajuste UI: barata
//    Theo → deploy, dinheiro, integração nova: claude · refactor/docs/testes: barata
//    Mia  → voz final e case: claude · rascunho em massa/tradução: barata
//
//  Log de cada persona → D:/Obsidian - Claude/🏢 Agência/SaaS/Agentes/<persona>.log
// ─────────────────────────────────────────────────────────────────────────────
import { spawn } from "node:child_process";
import { appendFile, mkdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const LOG_DIR = join(VAULT, "SaaS", "Agentes");

const args = process.argv.slice(2);
const persona = (args[0] || "").toLowerCase();
const VALIDAS = ["orion", "caio", "davi", "theo", "mia", "ops"];
if (!VALIDAS.includes(persona)) {
  console.log(`Uso: node _scripts/persona.mjs <orion|caio|davi|theo|mia|ops> "tarefa" [--ia barata|leitura|claude] [--model X]`);
  process.exit(1);
}

let ia = "barata", model = null, task = [];
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--ia") { ia = args[i + 1]; i++; continue; }
  if (args[i] === "--model") { model = args[i + 1]; i++; continue; }
  task.push(args[i]);
}
const prompt = task.join(" ").trim();
if (!prompt) { console.error("tarefa vazia"); process.exit(1); }

// mapeia o pedido "barata/leitura/claude" para o motor do ia.mjs
const MOTOR = { barata: "bulk", leitura: "leitura", claude: "claude", raciocinio: "raciocinio" }[ia] || "bulk";
const IA_NOME = ia === "claude" ? "Claude (20%)" : ia === "leitura" ? "Kimi (contexto)" : "DeepSeek (80%)";

function rodar() {
  return new Promise((res, rej) => {
    const cmd = process.execPath;
    const cArgs = [join(HERE, "ia.mjs"), prompt, "--engine", MOTOR, ...(model ? ["--model", model] : []), ...(MOTOR === "claude" ? ["--timeout", "480"] : [])];
    const c = spawn(cmd, cArgs, { cwd: ROOT, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    c.stdout.on("data", (d) => (out += d));
    c.stderr.on("data", (d) => (err += d));
    const t = setTimeout(() => c.kill("SIGKILL"), 600000);
    c.on("error", rej);
    c.on("close", (code) => { clearTimeout(t); code === 0 ? res(out) : rej(new Error(err.slice(0, 400) || `exit ${code}`)); });
  });
}

(async () => {
  const linha = `[${new Date().toLocaleString("pt-BR")}] ${persona.toUpperCase()} · ${IA_NOME} · ${prompt.slice(0, 90).replace(/\s+/g, " ")}`;
  console.log(`\n🧑‍🎨 ${persona.charAt(0).toUpperCase() + persona.slice(1)} → ${IA_NOME}\n`);
  await mkdir(LOG_DIR, { recursive: true });
  await appendFile(join(LOG_DIR, `${persona}.log`), linha + "\n", "utf8").catch(() => {});
  try {
    const out = await rodar();
    console.log(String(out).trim());
    await appendFile(join(LOG_DIR, `${persona}.log`), `     → ${out.trim().slice(0, 120).replace(/\n/g, " ")}\n`, "utf8").catch(() => {});
  } catch (e) {
    console.error(`[${persona}] erro: ${e.message}`);
    await appendFile(join(LOG_DIR, `${persona}.log`), `     → ERRO: ${e.message.slice(0, 120)}\n`, "utf8").catch(() => {});
    process.exit(3);
  }
})();