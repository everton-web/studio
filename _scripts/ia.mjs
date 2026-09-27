#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  IA Router — o orquestrador delega a tarefa para o motor certo.
//
//  Uso:
//    node _scripts/ia.mjs "sua tarefa" --engine <motor> [--model X] [--dir pasta]
//    node _scripts/ia.mjs --check          # health-check de todos os motores
//
//  Motores (os 3 primeiros são os da operação):
//    bulk      → DeepSeek v4 flash via gateway opencode-go — mecânico, centavos
//    leitura   → Kimi K3 via gateway opencode-go — contexto gigante, barato
//    claude    → Claude Code headless (claude -p) — quem DECIDE e valida
//
//  Motores extra:
//    bulk-pro   → DeepSeek v4 pro (mecânico que exige mais cabeça)
//    raciocinio → GLM 5.3 (segunda opinião barata)
//    opencode   → genérico, exige --model <provider/modelo>
//    anthro     → API Anthropic direta (precisa ANTHROPIC_API_KEY)
//    deepseek   → API DeepSeek direta (precisa DEEPSEEK_API_KEY)  [legado]
//    kimi       → API Moonshot direta (precisa KIMI_API_KEY)      [legado]
//
//  Por que gateway e não API direta: DEEPSEEK_API_KEY e KIMI_API_KEY não existem
//  neste ambiente. O gateway opencode-go já está autenticado e serve os dois.
// ─────────────────────────────────────────────────────────────────────────────
import { spawn } from "node:child_process";
import { appendFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

process.noDeprecation = true; // no Windows o spawn precisa de shell:true — o aviso só polui log

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const LOG = join(HERE, "ia-router.log");

const args = process.argv.slice(2);
const P = { engine: "claude", model: null, dir: ROOT, timeout: 180, prompt: [] };
let CHECK = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--check") { CHECK = true; continue; }
  if (a === "--engine" || a === "--model" || a === "--dir" || a === "--timeout") {
    const v = args[i + 1];
    if (v && !v.startsWith("--")) {
      if (a === "--engine") P.engine = v;
      if (a === "--model") P.model = v;
      if (a === "--dir") P.dir = v;
      if (a === "--timeout") P.timeout = Number(v) || 180;
      i++;
    }
    continue;
  }
  P.prompt.push(a);
}
const prompt = P.prompt.join(" ").trim();

// ── execução de processo com timeout de verdade ──────────────────────────────
//  O prompt vai por STDIN, nunca por argv. No Windows o spawn precisa de
//  shell:true (opencode e claude são .cmd), e o shell concatena os argumentos
//  em vez de escapá-los — prompt com quebra de linha, acento ou aspas chegava
//  truncado ou vazio do outro lado. Stdin não tem esse limite, e é o que
//  permite o motor-leitura despejar um vault inteiro no prompt.
function run(cmd, cmdArgs, cwd, timeoutSec, stdinText) {
  return new Promise((res, rej) => {
    const c = spawn(cmd, cmdArgs, { cwd, shell: process.platform === "win32", stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "", done = false;
    if (stdinText != null) {
      c.stdin.on("error", () => { /* processo fechou stdin antes da hora */ });
      c.stdin.write(stdinText);
      c.stdin.end();
    } else {
      c.stdin.end();
    }
    const t = setTimeout(() => {
      if (!done) { done = true; try { c.kill("SIGKILL"); } catch { /* já morreu */ } rej(new Error(`timeout ${timeoutSec}s`)); }
    }, timeoutSec * 1000);
    c.stdout.on("data", (d) => (out += d));
    c.stderr.on("data", (d) => (err += d));
    c.on("error", (e) => { if (!done) { done = true; clearTimeout(t); rej(e); } });
    c.on("close", (code) => {
      if (done) return;
      done = true; clearTimeout(t);
      code === 0 ? res(out) : rej(new Error(err.slice(0, 800) || `exit ${code}`));
    });
  });
}

// opencode imprime cabeçalho de sessão antes da resposta — tirar do output
function limparOpencode(saida) {
  const ESC = String.fromCharCode(27);
  const ansi = new RegExp(ESC + "\\[[0-9;]*m", "g");
  return saida
    .replace(ansi, "")
    .split("\n")
    .filter((l) => !/^\s*>\s+\S+\s+.\s+\S+\s*$/.test(l))
    .join("\n")
    .trim();
}

const viaOpencode = (modelo) => async (task, dir, timeoutSec) =>
  limparOpencode(await run("opencode", ["run", "--model", modelo], dir, timeoutSec, task));

async function apiChat(base, keyName, modelName, task, timeoutSec) {
  const key = process.env[keyName];
  if (!key) throw new Error(`${keyName} não definido — use --engine bulk/leitura (gateway opencode-go)`);
  const r = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: "Você é um motor de execução da agência Marca Digital. Seja direto e entregue só o resultado pedido." },
        { role: "user", content: task },
      ],
      max_tokens: 4000,
    }),
    signal: AbortSignal.timeout(timeoutSec * 1000),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `HTTP ${r.status}`);
  return j.choices?.[0]?.message?.content?.trim() || "(vazio)";
}

async function anthropic(task, _dir, timeoutSec, modelo) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY não definido — use --engine claude (headless, usa a assinatura)");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: modelo || "claude-opus-5", max_tokens: 8000, messages: [{ role: "user", content: task }] }),
    signal: AbortSignal.timeout(timeoutSec * 1000),
  });
  if (!r.ok) throw new Error(`anthropic HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return j.content?.[0]?.text?.trim() || "(vazio)";
}

const MOTORES = {
  bulk:       { desc: "DeepSeek v4 flash (mecânico)", fn: viaOpencode("opencode-go/deepseek-v4-flash") },
  "bulk-pro": { desc: "DeepSeek v4 pro (mecânico+)",  fn: viaOpencode("opencode-go/deepseek-v4-pro") },
  leitura:    { desc: "Kimi K3 (contexto gigante)",   fn: viaOpencode("opencode-go/kimi-k3") },
  raciocinio: { desc: "GLM 5.3 (segunda opinião)",    fn: viaOpencode("opencode-go/glm-5.3") },
  claude:     {
    desc: "Claude Code headless (decide) — subscription",
    fn: (task, _dir, t, modelo) => {
      // Recipe subscription: cwd neutro (evita skills do projeto virarem pergunta),
      // modo plan (só leitura) + add-dir do projeto p/ leitura explícita.
      const neutro = process.env.TEMP || process.env.TMP || "/tmp";
      const SYS = "Headless mode. NEVER ask questions, NEVER request confirmation, NEVER present options, NEVER use question tools. You are a silent auditor: read the source under the exact path given in the task, run your analysis, and return ONLY the final deliverable in markdown, starting directly with it.";
      return run("claude", ["-p", "--output-format", "text",
        "--permission-mode", "acceptEdits", "--add-dir", ROOT, "--add-dir", process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência", "--allowedTools", "Read,Bash,WebFetch,Write,Edit",
        "--append-system-prompt", SYS,
        ...(modelo ? ["--model", modelo] : [])], neutro, t, task);
    },
  },
  opencode:   {
    desc: "opencode genérico (--model)",
    fn: (task, dir, t, modelo) => {
      if (!modelo) throw new Error("engine opencode exige --model <provider/modelo>");
      return viaOpencode(modelo)(task, dir, t);
    },
  },
  anthro:     { desc: "API Anthropic direta", fn: anthropic },
  deepseek:   {
    desc: "API DeepSeek direta (legado)",
    fn: (task, _d, t, modelo) => apiChat("https://api.deepseek.com", "DEEPSEEK_API_KEY", modelo || "deepseek-chat", task, t),
  },
  kimi:       {
    desc: "API Moonshot direta (legado)",
    fn: (task, _d, t, modelo) => apiChat("https://api.moonshot.cn/v1", "KIMI_API_KEY", modelo || "kimi-k2-0711-preview", task, t),
  },
};

async function registrar(linha) {
  try { await appendFile(LOG, linha + "\n", "utf8"); } catch { /* log não bloqueia trabalho */ }
}

// ── health-check: descobre quais motores estão vivos AGORA ───────────────────
//  O motor claude carrega o CLAUDE.md e responde em persona, então exigir que
//  ele ecoe uma senha dá falso negativo. Nele o que importa é o que mata o
//  loop 24/7: OAuth expirado. Por isso o critério é por motor.
const FALHA_AUTH = /failed to authenticate|oauth session expired|not logged in|invalid api key|credit balance/i;

async function health() {
  const alvos = ["bulk", "leitura", "claude", "bulk-pro", "raciocinio"];
  console.log("Health-check dos motores:\n");
  const res = await Promise.all(alvos.map(async (nome) => {
    const t0 = Date.now();
    try {
      const out = String(await MOTORES[nome].fn("Responda apenas com a palavra: VIVO", ROOT, 90, null)).trim();
      if (FALHA_AUTH.test(out)) return { nome, ok: false, ms: Date.now() - t0, nota: "AUTENTICAÇÃO — precisa relogar" };
      // claude: basta responder algo; os motores de API devem ecoar a senha
      const ok = nome === "claude" ? out.length > 0 : /VIVO/i.test(out);
      return { nome, ok, ms: Date.now() - t0, nota: ok ? "" : `resposta inesperada: ${out.slice(0, 60)}` };
    } catch (e) {
      const auth = FALHA_AUTH.test(e.message);
      return { nome, ok: false, ms: Date.now() - t0, nota: auth ? "AUTENTICAÇÃO — precisa relogar" : e.message.slice(0, 120) };
    }
  }));
  for (const r of res) {
    const status = r.ok ? "OK   " : "FALHA";
    console.log(`  ${status} ${r.nome.padEnd(11)} ${String(r.ms + "ms").padStart(7)}  ${MOTORES[r.nome].desc}${r.nota ? "  — " + r.nota : ""}`);
  }
  const vivos = res.filter((r) => r.ok).length;
  console.log(`\n${vivos}/${res.length} motores vivos.`);
  await registrar(`${new Date().toISOString()}\tcheck\t${vivos}/${res.length} vivos\t${res.map((r) => r.nome + "=" + (r.ok ? "ok" : "falha")).join(",")}`);
  process.exit(vivos === res.length ? 0 : 4);
}

(async () => {
  if (CHECK) return health();

  if (!prompt) {
    console.log('Uso: node _scripts/ia.mjs "tarefa" --engine <motor> [--model X] [--dir pasta] [--timeout seg]');
    console.log("     node _scripts/ia.mjs --check\n");
    console.log("Motores:");
    for (const [k, v] of Object.entries(MOTORES)) console.log(`  ${k.padEnd(11)} ${v.desc}`);
    process.exit(1);
  }

  const motor = MOTORES[P.engine];
  if (!motor) {
    console.error(`motor desconhecido: ${P.engine}\nDisponíveis: ${Object.keys(MOTORES).join(", ")}`);
    process.exit(2);
  }

  const t0 = Date.now();
  try {
    const out = await motor.fn(prompt, P.dir, P.timeout, P.model);
    console.log(String(out).trim());
    await registrar(`${new Date().toISOString()}\t${P.engine}\tok\t${Date.now() - t0}ms\t${prompt.slice(0, 90).replace(/\s+/g, " ")}`);
  } catch (e) {
    console.error(`[ia:${P.engine}] erro: ${e.message}`);
    await registrar(`${new Date().toISOString()}\t${P.engine}\tERRO\t${Date.now() - t0}ms\t${e.message.slice(0, 90)}\t${prompt.slice(0, 60).replace(/\s+/g, " ")}`);
    process.exit(3);
  }
})();
