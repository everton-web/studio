#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  LOOP AUTÔNOMO — os agentes trabalham sozinhos, sem esperar comando.
//  A cada execução (agendada a cada 10 min):
//    1. lê a fila de demandas (orquestra/fila.json)
//    2. pega a 1ª pendente/erro PRIORIZADA (mais antiga, com dono)
//    3. executa (claude p/ o dono com "claude", bulk/barato p/ o resto)
//    4. marca ok/erro + salva saída no resultado + avisa na sala
//    5. log tudo em _scripts/loop-agentes.log
//  Salvo-exceção: demandas com palavras-chave de PRODUÇÃO/DINHEIRO são
//  marcadas como "aguarda-humano" (nunca rodam sozinhas).
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DIR = join(HERE, "orquestra");
const FILA = join(DIR, "fila.json");
const SALA = join(DIR, "sala.json");
const LOG = join(HERE, "loop-agentes.log");
const RES = join(DIR, "resultados");

// palavras que nunca rodam sozinhas (produção/dinheiro = aprovação humana)
const SENSITIVO = /deploy|produção|producao|push|pagamento|webhook|dinheiro|contrato|env\.local|billing|produção real/i;

function log(m) { const l = `[${new Date().toLocaleString("pt-BR")}] ${m}\n`; appendFileSync(LOG, l); console.log(l.trim()); }
function ler(p) { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return []; } }
function gravar(p, v) { try { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 2), "utf8"); } catch { /* noop */ } }

function rodar(t) {
  return new Promise((res) => {
    const saida = join(RES, `${t.id}.txt`);
    const argsT = [];
    const motor = t.engine || (t.ia === "claude" ? "claude" : "bulk");
    const child = spawn(process.execPath, [join(HERE, "ia.mjs"), t.prompt, "--engine", motor, ...(motor === "claude" ? ["--model", "claude-opus-4-8", "--timeout", "480"] : [])], { cwd: ROOT, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    const to = setTimeout(() => child.kill("SIGKILL"), 600000);
    child.on("close", (code) => {
      clearTimeout(to);
      mkdirSync(RES, { recursive: true });
      writeFileSync(saida, out.slice(0, 60000), "utf8");
      res({ code, saida, bytes: out.length });
    });
  });
}

(async () => {
  const fila = ler(FILA);
  // recuperação de crash: "rodando" presa há mais de 15 min volta para pendente
  const AGORA = Date.now();
  for (const t of fila) {
    if (t.status === "rodando") {
      const criado = new Date(String(t.criado || "")).getTime() || AGORA;
      const fimEstimado = new Date(String(t.fim || "")).getTime() || criado;
      if (AGORA - fimEstimado > 15 * 60 * 1000) { t.status = "pendente"; log(`recuperação: ${t.id} estava presa em rodando → pendente`); }
    }
  }
  gravar(FILA, fila);
  const pendentes = fila.filter((t) => t.status === "pendente" || t.status === "erro")
    .sort((a, b) => (String(a.criado || "") < String(b.criado || "") ? -1 : 1));
  if (!pendentes.length) { console.log("[loop] fila vazia — nada a fazer"); return; }

  // demanda mais antiga (FIFO) — 1 por tick para não estourar quota
  const alvo = pendentes[0];
  if (SENSITIVO.test(alvo.prompt)) {
    alvo.status = "aguarda-humano";
    gravar(FILA, fila);
    log(`demanda ${alvo.id} é sensível (produção/dinheiro) → aguarda aprovação humana`);
    return;
  }
  if (alvo.status === "pendente") alvo.status = "rodando";
  gravar(FILA, fila);
  log(`executando ${alvo.id} (motor ${alvo.engine || alvo.ia || "bulk"}) — para ${alvo.atribuido || "orquestra"}`);

  const r = await rodar(alvo);
  const fila2 = ler(FILA);
  const t2 = fila2.find((x) => x.id === alvo.id);
  if (t2) { t2.status = r.code === 0 ? "ok" : "erro"; t2.exit = r.code; t2.saida = r.saida; t2.bytes = r.bytes; t2.fim = new Date().toISOString(); gravar(FILA, fila2); }

  const sala = ler(SALA);
  sala.push({ quando: new Date().toLocaleString("pt-BR"), de: "loop",
    texto: `${r.code === 0 ? "✅" : "❌"} Demanda "${(t2?.prompt || "").slice(0, 60)}" (${t2?.atribuido || "orquestra"}) → ${r.code === 0 ? "feita" : "erro"}. Saída: ${r.code === 0 ? "ver resultado da fila" : r.exit}`, para: t2?.atribuido });
  gravar(SALA, sala.slice(-200));

  log(`${alvo.id} → ${r.code === 0 ? "ok" : `erro (${r.exit})`} · ${r.bytes}b (${((Date.now()) % 60000) / 1000}s)`);
})();