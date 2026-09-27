#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  LOOP DAEMON — os agentes trabalham sozinhos, checando a cada 10 SEGUNDOS.
//  A cada tick (10s):
//    1. lê a fila de demandas (orquestra/fila.json)
//    2. pega a 1ª pendente/erro PRIORIZADA (mais antiga, com dono)
//    3. ABRE UM TERMINAL NO PC (janela real) acompanhando a demanda ao vivo
//    4. executa (claude p/ o dono com "claude", bulk/barato p/ o resto)
//    5. marca ok/erro + salva saída no resultado + avisa na sala
//    6. log tudo em _scripts/loop-daemon.log
//  Salvo-exceção: demandas com palavras-chave de PRODUÇÃO/DINHEIRO são
//  marcadas como "aguarda-humano" (nunca rodam sozinhas).
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DIR = join(HERE, "orquestra");
const FILA = join(DIR, "fila.json");
const SALA = join(DIR, "sala.json");
const LOG = join(HERE, "loop-daemon.log");
const RES = join(DIR, "resultados");
const TICK = 10 * 1000;
let ocupado = false; // 1 demanda por vez (sem duplicar)

const SENSITIVO = /deploy|produção|producao|push|pagamento|webhook|dinheiro|contrato|env\.local|billing|produção real/i;

function log(m) { const l = `[${new Date().toLocaleString("pt-BR")}] ${m}\n`; appendFileSync(LOG, l); console.log(l.trim()); }
function ler(p) { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return []; } }
function gravar(p, v) { try { mkdirSync(dirname(p), { recursive: true }); const tmp = p + ".tmp"; writeFileSync(tmp, JSON.stringify(v, null, 2), "utf8"); renameSync(tmp, p); } catch { /* noop */ } }

// abre uma janela de terminal REAL no desktop do operador acompanhando a demanda
function abrirTerminal(t) {
  const live = join(RES, `${t.id}.live.txt`);
  const tailjs = join(HERE, "tail.mjs");
  const titulo = `${t.atribuido || "orquestra"} · ${t.id} · ${(t.prompt || "").slice(0, 40)}`;
  const inner = `title ${titulo} & echo ───────────────────────────── & echo DEMANDA ${t.id} — ${t.atribuido || "orquestra"} & echo Procurando... & node "${tailjs}" "${live}"`;
  spawn("cmd.exe", ["/c", `start "${titulo}" cmd /k "${inner}"`], { cwd: ROOT, detached: true, stdio: "ignore" }).unref();
  log(`terminal aberto para ${t.id} (${titulo.slice(0, 60)})`);
}

function rodar(t) {
  return new Promise((res) => {
    const saida = join(RES, `${t.id}.txt`);
    const live = join(RES, `${t.id}.live.txt`);
    appendFileSync(live, `[${new Date().toLocaleString("pt-BR")}] DEMANDA ${t.id}\n${t.prompt}\n${"─".repeat(50)}\n`);
    const motor = t.engine || (t.ia === "claude" ? "claude" : "bulk");
    const args = [join(HERE, "ia.mjs"), t.prompt, "--engine", motor];
    if (motor === "claude") args.push("--model", "claude-opus-4-8", "--timeout", "480");
    const child = spawn(process.execPath, args, { cwd: ROOT, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    const grava = (d) => { out += d; try { appendFileSync(live, d); } catch { /* noop */ } };
    child.stdout.on("data", grava);
    child.stderr.on("data", grava);
    const to = setTimeout(() => child.kill("SIGKILL"), 600000);
    child.on("close", (code) => {
      clearTimeout(to);
      const fim = `\n${"─".repeat(50)}\n[${new Date().toLocaleString("pt-BR")}] ${code === 0 ? "✅ CONCLUÍDA (ok)" : `❌ encerrou c/ código ${code}`} — saída salva na fila.\n`;
      try { appendFileSync(live, fim); } catch { /* noop */ }
      mkdirSync(RES, { recursive: true });
      writeFileSync(saida, out.slice(0, 60000), "utf8");
      res({ code, saida, bytes: out.length });
    });
  });
}

async function tick() {
  if (ocupado) return; // já tem 1 rodando
  const fila = ler(FILA);
  const AGORA = Date.now();
  for (const t of fila) {
    if (t.status === "rodando") {
      const base = new Date(String(t.iniciado || t.fim || t.criado || "")).getTime() || AGORA;
      if (AGORA - base > 15 * 60 * 1000) { t.status = "pendente"; log(`recuperação: ${t.id} presa em rodando → pendente`); }
    }
  }
  gravar(FILA, fila);

  const pendentes = fila.filter((t) => t.status === "pendente" || t.status === "erro")
    .sort((a, b) => (String(a.criado || "") < String(b.criado || "") ? -1 : 1));
  if (!pendentes.length) return; // fila vazia — espera o próximo tick

  const alvo = pendentes[0];
  if (SENSITIVO.test(alvo.prompt)) {
    alvo.status = "aguarda-humano"; gravar(FILA, fila);
    log(`demanda ${alvo.id} é sensível (produção/dinheiro) → aguarda aprovação humana`);
    return;
  }
  if (alvo.status === "pendente") alvo.status = "rodando";
  alvo.iniciado = new Date().toISOString();
  gravar(FILA, fila);
  log(`executando ${alvo.id} (motor ${alvo.engine || alvo.ia || "bulk"}) — para ${alvo.atribuido || "orquestra"}`);
  abrirTerminal(alvo);
  ocupado = true;

  try {
    const r = await rodar(alvo);
    const fila2 = ler(FILA);
    const t2 = fila2.find((x) => x.id === alvo.id);
    if (t2) { t2.status = r.code === 0 ? "ok" : "erro"; t2.exit = r.code; t2.saida = r.saida; t2.bytes = r.bytes; t2.fim = new Date().toISOString(); gravar(FILA, fila2); }

    const sala = ler(SALA);
    sala.push({ quando: new Date().toLocaleString("pt-BR"), de: "loop",
      texto: `${r.code === 0 ? "✅" : "❌"} Demanda "${(t2?.prompt || "").slice(0, 60)}" (${t2?.atribuido || "orquestra"}) → ${r.code === 0 ? "feita" : "erro"}. Saída: ver resultado da fila`, para: t2?.atribuido });
    gravar(SALA, sala.slice(-200));
    log(`${alvo.id} → ${r.code === 0 ? "ok" : `erro (${r.exit})`} · ${r.bytes}b`);
  } finally {
    ocupado = false; // libera o próximo tick — sem isso o daemon processa só 1 demanda e trava
  }
}

const LOCK = join(DIR, "daemon.lock");
if (existsSync(LOCK)) {
  const pid = Number(readFileSync(LOCK, "utf8").trim()) || 0;
  if (pid > 0) {
    try { process.kill(pid, 0); console.log(`[daemon] outro processo ativo (pid ${pid}) — saindo`); process.exit(0); } catch { /* morto, segue */ }
  }
}
writeFileSync(LOCK, String(process.pid), "utf8");
process.on("exit", () => { try { readFileSync(LOCK, "utf8") === String(process.pid) && writeFileSync(LOCK, "", "utf8"); } catch { /* noop */ } });
log(`daemon iniciado — checando a fila a cada ${TICK / 1000}s`);
setInterval(() => tick().catch((e) => log(`erro no tick: ${e.message}`)), TICK);
tick().catch((e) => log(`erro inicial: ${e.message}`));