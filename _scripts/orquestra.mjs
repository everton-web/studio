#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  ORQUESTRA — fila de agentes da Marca Digital.
//  Distribui tarefas entre os motores, roda em paralelo e devolve ao vault.
//
//  Uso:
//    node _scripts/orquestra.mjs nova   --fila fila.json --id t1 --engine anthro --model claude-opus-4-8 "prompt"
//    node _scripts/orquestra.mjs nova   --fila fila.json --id t2 --engine shell   "node _scripts/prospeccao-automatica.mjs"
//    node _scripts/orquestra.mjs run    --fila fila.json [--jobs 2] [--somente t1]
//    node _scripts/orquestra.mjs status --fila fila.json
//    node _scripts/orquestra.mjs limpar --fila fila.json (apaga concluídas/erro)
//
//  Motores (os que a operação usa — ver _scripts/ia.mjs):
//    bulk | bulk-pro  → DeepSeek via gateway opencode-go — mecânico, barato
//    leitura          → Kimi K3 — contexto gigante
//    raciocinio       → GLM 5.3 — segunda opinião barata
//    claude           → Claude Code headless — quem decide e valida
//    shell            → comando local (ex.: node _scripts/prospeccao-automatica.mjs)
//    anthro | deepseek | kimi → APIs diretas; exigem chave no env (hoje não há)
//
//  Resultados → _scripts/orquestra/resultados/<id>.txt · fila default _scripts/orquestra/fila.json
// ─────────────────────────────────────────────────────────────────────────────
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(dirname(fileURLToPath(import.meta.url))));
const DIR = join(ROOT, "_scripts", "orquestra");
const FILA_DEFAULT = join(DIR, "fila.json");
const RES_DIR = join(DIR, "resultados");

function flag(name, def = null) {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : def;
}
const args = process.argv.slice(2);
const cmd = args[0] || "help";
const filaPath = flag("--fila", FILA_DEFAULT);

function ler() { return existsSync(filaPath) ? JSON.parse(readFileSync(filaPath, "utf8")) : []; }
function gravar(fila) { mkdirSync(dirname(filaPath), { recursive: true }); writeFileSync(filaPath, JSON.stringify(fila, null, 2), "utf8"); }

function help() {
  console.log(`ORQUESTRA — fila de agentes
  nova  --fila <json> --id <id> --engine <motor> [--model <m>] "prompt"
  run   --fila <json> [--jobs N] [--somente ids] 
  status --fila <json>
  limpar --fila <json>`);
}

// ── copiar prompt (texto livre ao final) ──
function promptTexto() {
  const out = [];
  for (let i = 1; i < args.length; i++) {
    if (["--fila", "--id", "--engine", "--model", "--jobs", "--somente"].includes(args[i])) { i++; continue; }
    out.push(args[i]);
  }
  return out.join(" ").trim();
}

function nova() {
  const id = flag("--id");
  const engine = flag("--engine");
  const model = flag("--model");
  const prompt = promptTexto();
  if (!id || !engine || !prompt) { console.error("uso: nova --id <id> --engine <m> [--model <m>] \"prompt\""); process.exit(1); }
  const fila = ler();
  if (fila.some((t) => t.id === id)) { console.error(`já existe tarefa '${id}'`); process.exit(1); }
  fila.push({ id, engine, model, prompt, status: "pendente", criado: new Date().toISOString() });
  gravar(fila);
  console.log(`✓ tarefa '${id}' (${engine}) na fila — ${fila.length} pendente(s)`);
}

// ── executar uma tarefa ──
async function runTask(t) {
  const saída = join(RES_DIR, `${t.id}.txt`);
  return new Promise((res) => {
    let cmdSpawn, cmdArgs;
    if (t.engine === "shell") {
      const p = t.prompt; // p é o comando shell
      cmdSpawn = /^win/i.test(process.platform) ? "cmd" : "sh";
      cmdArgs = /^win/i.test(process.platform) ? ["/c", p] : ["-c", p];
    } else {
      cmdSpawn = process.execPath;
      cmdArgs = [join(ROOT, "_scripts", "ia.mjs"), t.prompt, "--engine", t.engine, ...(t.model ? ["--model", t.model] : [])];
    }
    const c = spawn(cmdSpawn, cmdArgs, { cwd: ROOT, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    c.stdout.on("data", (d) => (out += d));
    c.stderr.on("data", (d) => (out += d));
    const to = setTimeout(() => c.kill("SIGKILL"), 360000);
    c.on("close", (code) => {
      clearTimeout(to);
      mkdirSync(RES_DIR, { recursive: true });
      writeFileSync(saída, out.slice(0, 60000), "utf8");
      // engine vai no retorno senão o log da fila mostra "shell" em toda tarefa
      res({ id: t.id, engine: t.engine, status: code === 0 ? "ok" : "erro", exit: code, saida: saída, bytes: out.length });
    });
  });
}

async function run() {
  const jobs = Math.max(1, Number(flag("--jobs", "2")) || 2);
  const somente = (flag("--somente") || "").split(",").filter(Boolean);
  let fila = ler();
  const pendentes = fila.filter((t) => t.status === "pendente" || t.status === "erro" || t.status === "rodando")
    .filter((t) => (somente.length ? somente.includes(t.id) : true));
  if (!pendentes.length) { console.log("nada a rodar (fila vazia)."); return; }

  console.log(`rodando ${pendentes.length} tarefa(s) com ${jobs} agente(s) em paralelo…`);
  for (let i = 0; i < pendentes.length; i += jobs) {
    const lote = pendentes.slice(i, i + jobs);
    // marca como rodando
    fila = ler(); lote.forEach((t) => { const x = fila.find((y) => y.id === t.id); if (x) x.status = "rodando"; }); gravar(fila);
    const results = await Promise.all(lote.map(runTask));
    fila = ler();
    for (const r of results) {
      const x = fila.find((y) => y.id === r.id);
      if (x) { x.status = r.status; x.exit = r.exit; x.saida = r.saida; x.bytes = r.bytes; x.fim = new Date().toISOString(); }
      console.log(`  ${r.status === "ok" ? "✅" : "❌"} ${r.id} (${r.engine || "shell"}) exit=${r.exit} → ${r.saida}`);
    }
    gravar(fila);
  }
  // contar só o que esta execução rodou — não a fila histórica inteira
  const ids = new Set(pendentes.map((t) => t.id));
  const rodadas = fila.filter((t) => ids.has(t.id));
  const ok = rodadas.filter((t) => t.status === "ok").length;
  console.log(`fila concluída: ${ok}/${rodadas.length} ok → ${filaPath}`);
  if (ok < rodadas.length) {
    for (const t of rodadas.filter((x) => x.status !== "ok")) {
      console.log(`  falhou: ${t.id} (${t.engine}) exit=${t.exit} → ${t.saida}`);
    }
    process.exitCode = 1; // para o agendador saber que o lote não passou limpo
  }
}

function status() {
  const fila = ler();
  if (!fila.length) { console.log("fila vazia."); return; }
  console.log("ID	MOTOR	STATUS	PROMPT");
  for (const t of fila) console.log(`${t.id || "?"}	${t.engine || "shell"}	${t.status || "?"}	${(t.prompt || "").slice(0, 46)}`);
}

if (cmd === "nova") nova();
else if (cmd === "run") run();
else if (cmd === "status") status();
else if (cmd === "limpar") { gravar(ler().filter((t) => !["ok", "erro"].includes(t.status))); console.log("limpo"); }
else help();