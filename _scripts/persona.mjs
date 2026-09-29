#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  PERSONA — aciona um agente do Studio pela cadeia oficial:
//
//      Orion (Claude)  →  pi (gerente da tarefa)  →  opencode (executa)
//
//  Decisão do Everton (2026-09-27): vale para TODAS as personas.
//  O pi recebe a ficha da persona + a regra de execução (personas/_EXECUCAO.md),
//  delega o trabalho ao `opencode run`, confere o resultado e devolve um relatório.
//
//  Uso:
//    node _scripts/persona.mjs <persona> "tarefa" [--modelo flash|pro|glm|kimi] [--janela]
//
//    personas: orion caio davi theo mia fabio olga lia ops
//    --modelo  modelo do opencode (padrão flash = opencode-go/deepseek-v4.1-flash)
//    --janela  abre uma janela visível do pi para acompanhar (não espera o fim)
//
//  Log de cada persona → vault/SaaS/Agentes/<persona>.log
// ─────────────────────────────────────────────────────────────────────────────
import { spawn } from "node:child_process";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const VAULT = process.env.VAULT || join(ROOT, "vault");
const LOG_DIR = join(VAULT, "SaaS", "Agentes");
const TMP = join(HERE, ".persona-tmp");
const PI_CLI = process.env.PI_CLI || join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "npm", "node_modules", "@earendil-works", "pi-coding-agent", "dist", "cli.js");

const PERSONAS = ["orion", "caio", "davi", "theo", "mia", "fabio", "olga", "lia", "ops"];
const MODELOS = {
  flash: "opencode-go/deepseek-v4.1-flash",
  pro: "opencode-go/deepseek-v4-pro",
  glm: "opencode-go/glm-5.3",
  kimi: "opencode-go/kimi-k3",
};

const args = process.argv.slice(2);
const persona = (args[0] || "").toLowerCase();
if (!PERSONAS.includes(persona)) {
  console.log(`Uso: node _scripts/persona.mjs <${PERSONAS.join("|")}> "tarefa" [--modelo flash|pro|glm|kimi] [--janela]`);
  process.exit(1);
}
let modelo = MODELOS.flash, janela = false;
const task = [];
for (let i = 1; i < args.length; i++) {
  const a = args[i];
  if (a === "--modelo" || a === "--model") { const v = args[++i] || ""; modelo = MODELOS[v] || v || modelo; continue; }
  if (a === "--janela") { janela = true; continue; }
  if (a === "--ia") { i++; continue; } // legado: a cadeia agora é sempre pi → opencode
  task.push(a);
}
const tarefa = task.join(" ").trim();
if (!tarefa) { console.error("tarefa vazia"); process.exit(1); }
if (!existsSync(PI_CLI)) { console.error(`pi não encontrado em ${PI_CLI} (defina PI_CLI)`); process.exit(2); }

// ficha da persona: personas/<nome>/CLAUDE.md → ~/.claude/agents/<nome>.md
async function fichaDaPersona() {
  for (const p of [join(ROOT, "personas", persona, "CLAUDE.md"), join(homedir(), ".claude", "agents", `${persona}.md`)]) {
    if (existsSync(p)) return readFile(p, "utf8");
  }
  return `# ${persona}\nPersona do Studio (Marca Digital). Siga D:\\studio\\CLAUDE.md.`;
}

async function prepararArquivos() {
  await mkdir(TMP, { recursive: true });
  const nome = persona.charAt(0).toUpperCase() + persona.slice(1);
  const regra = (await readFile(join(ROOT, "personas", "_EXECUCAO.md"), "utf8"))
    .replaceAll("{{MODELO}}", modelo).replaceAll("{{PERSONA}}", nome);
  const carimbo = Date.now();
  const fRegra = join(TMP, `${persona}-${carimbo}-regra.md`);
  const fFicha = join(TMP, `${persona}-${carimbo}-ficha.md`);
  const fTarefa = join(TMP, `${persona}-${carimbo}-tarefa.md`);
  await writeFile(fRegra, regra, "utf8");
  await writeFile(fFicha, await fichaDaPersona(), "utf8");
  await writeFile(fTarefa, `# Tarefa para ${nome} (enviada pelo Orion)\n\n${tarefa}\n`, "utf8");
  return { fRegra, fFicha, fTarefa, nome };
}

function rodarPi({ fRegra, fFicha, fTarefa }, piModelo) {
  return new Promise((res, rej) => {
    const pArgs = [PI_CLI, "-p", "--no-session", ...(piModelo ? ["--model", piModelo] : []),
      "--append-system-prompt", fFicha, "--append-system-prompt", fRegra,
      `@${fTarefa}`, "Execute a tarefa anexada seguindo a regra de execução (delegue ao opencode, confira e responda com o relatório)."];
    const c = spawn(process.execPath, pArgs, { cwd: ROOT, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    c.stdout.on("data", (d) => { out += d; process.stdout.write(d); });
    c.stderr.on("data", (d) => (err += d));
    const t = setTimeout(() => c.kill("SIGKILL"), 25 * 60 * 1000);
    c.on("error", rej);
    c.on("close", (code) => { clearTimeout(t); code === 0 ? res(out) : rej(new Error(err.slice(-400) || `exit ${code}`)); });
  });
}

function abrirJanela({ fRegra, fFicha, fTarefa, nome }) {
  const linha = `"${process.execPath}" "${PI_CLI}" --append-system-prompt "${fFicha}" --append-system-prompt "${fRegra}" "@${fTarefa}" "Execute a tarefa anexada seguindo a regra de execucao."`;
  // cmd /k descarta o primeiro e o último " — por isso a linha inteira vai envolvida em aspas extras
  spawn("cmd.exe", ["/c", "start", `"${nome.toUpperCase()} - pi"`, "cmd", "/k", `"${linha}"`], { cwd: ROOT, detached: true, stdio: "ignore", windowsVerbatimArguments: true }).unref();
}

// ---------- painel ao vivo ----------
// Cada execução grava seu estado em vault/SaaS/Agentes/ao-vivo/<id>.json (um arquivo por execução,
// para personas em paralelo não se sobrescreverem). A plataforma lê essa pasta e mostra quem está trabalhando.
const AO_VIVO = join(LOG_DIR, "ao-vivo");
const EXEC_ID = `${new Date().toISOString().replace(/[:.]/g, "-")}-${persona}-${process.pid}`;
const execucao = {
  id: EXEC_ID, persona, tarefa: tarefa.replace(/\s+/g, " ").slice(0, 220), modelo,
  estado: "trabalhando", tentativa: 1, inicio: new Date().toISOString(), fim: null, resumo: "", erro: "",
};
async function registrar(parcial = {}) {
  Object.assign(execucao, parcial, { atualizado: new Date().toISOString() });
  try {
    await mkdir(AO_VIVO, { recursive: true });
    await writeFile(join(AO_VIVO, `${EXEC_ID}.json`), JSON.stringify(execucao, null, 2), "utf8");
  } catch { /* painel é acessório: nunca derruba a execução */ }
}
// resumo curto do relatório do pi: a linha "FEITO:" (ou o fim da saída)
function resumoDoRelatorio(out) {
  const m = out.match(/FEITO:\s*([\s\S]*?)(?:\n\s*[A-ZÇÃ]{4,}:|$)/);
  return (m ? m[1] : out.slice(-300)).replace(/\s+/g, " ").trim().slice(0, 400);
}

(async () => {
  const arq = await prepararArquivos();
  await registrar();
  const cab = `[${new Date().toLocaleString("pt-BR")}] ${persona.toUpperCase()} · pi → opencode (${modelo}) · ${tarefa.slice(0, 90).replace(/\s+/g, " ")}`;
  await mkdir(LOG_DIR, { recursive: true });
  await appendFile(join(LOG_DIR, `${persona}.log`), cab + "\n", "utf8").catch(() => {});
  console.log(`\n🧭 Orion → pi (${arq.nome}) → opencode · ${modelo}\n`);
  if (janela) {
    abrirJanela(arq);
    await registrar({ estado: "janela", resumo: "rodando numa janela visível do pi" });
    console.log("Janela do pi aberta — acompanhe por lá.");
    return;
  }
  // O gateway às vezes derruba o streaming em tarefas longas ("stream interrupted") ou o pi
  // termina sem relatório. Tenta de novo sozinho; na última tentativa o pi usa o modelo flash (mais estável).
  // Economia de cota (28/09): o pi só gerencia, então roda em flash; pro só quando a tarefa pede --modelo pro.
  const PI = modelo === MODELOS.pro ? MODELOS.pro : MODELOS.flash;
  const TENTATIVAS = [PI, PI, MODELOS.flash];
  let ultimoErro = null;
  for (let n = 0; n < TENTATIVAS.length; n++) {
    if (n > 0) {
      console.log(`\n↻ [${persona}] tentativa ${n + 1}/${TENTATIVAS.length}${TENTATIVAS[n] ? ` (pi em ${TENTATIVAS[n]})` : ""} — motivo: ${ultimoErro?.message.slice(0, 120)}\n`);
      await registrar({ estado: "tentando de novo", tentativa: n + 1, erro: ultimoErro?.message.slice(0, 200) || "" });
      await new Promise((r) => setTimeout(r, 5000));
    }
    try {
      const out = await rodarPi(arq, TENTATIVAS[n]);
      if (!/PERSONA:/i.test(out)) throw new Error("pi terminou sem relatório (PERSONA: ...)");
      await appendFile(join(LOG_DIR, `${persona}.log`), `     → ${out.trim().slice(-160).replace(/\n/g, " ")}\n`, "utf8").catch(() => {});
      await registrar({ estado: "pronto", fim: new Date().toISOString(), resumo: resumoDoRelatorio(out), erro: "" });
      return;
    } catch (e) {
      ultimoErro = e;
      await appendFile(join(LOG_DIR, `${persona}.log`), `     → tentativa ${n + 1} falhou: ${e.message.slice(0, 140)}\n`, "utf8").catch(() => {});
    }
  }
  {
    console.error(`\n[${persona}] erro após ${TENTATIVAS.length} tentativas: ${ultimoErro?.message}`);
    await registrar({ estado: "falhou", fim: new Date().toISOString(), erro: ultimoErro?.message.slice(0, 300) || "" });
    process.exit(3);
  }
})();
