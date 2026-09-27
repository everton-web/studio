#!/usr/bin/env node
// Prospecção automática da rotina 07h–08h — chama a API do app e imprime o resumo.
// Usado pelo agendamento (Claude Code): node _scripts/prospeccao-automatica.mjs
// O agente (claude/opencode) lê o JSON e registra no diário do vault.
import { writeFile, unlink, readFile } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(dirname(fileURLToPath(import.meta.url))));
const BASE = "http://localhost:3100";
// credenciais: única fonte = .env.local do app (nunca hardcoded)
async function creds() {
  const envLocal = join(ROOT, "apps", "plataforma", ".env.local");
  try {
    const raw = await readFile(envLocal, "utf8");
    const get = (k) => (raw.match(new RegExp(`^${k}=(.+)$`, "m")) || [])[1]?.trim();
    return { user: get("AGENCIA_USER") || "everton", pass: get("AGENCIA_PASS") || "" };
  } catch { return { user: "everton", pass: "" }; }
}
const NICHO = process.env.PROSPECCAO_NICHO || "geral";
const LIMITE = Number(process.env.PROSPECCAO_LIMITE) || 6;
const CK = join(dirname(fileURLToPath(import.meta.url)), ".cj-prosp.txt");

async function login() {
  const { user, pass } = await creds();
  const r = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, pass }),
  });
  const cookies = r.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  await writeFile(CK, cookies);
  if (!r.ok) throw new Error(`login falhou: ${r.status}`);
}

async function prospectar() {
  const cookies = await readFile(CK, "utf8");
  const r = await fetch(`${BASE}/api/prospector`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({ nicho: NICHO, limite: LIMITE }),
    signal: AbortSignal.timeout(90000),
  });
  if (!r.ok) throw new Error(`prospector falhou: ${r.status} ${await r.text()}`);
  return r.json();
}

async function main() {
  const t0 = Date.now();
  await login();
  const res = await prospectar();
  console.log(`[rotina ${new Date().toLocaleString("pt-BR")}]`);
  console.log(JSON.stringify(res.resumo || res, null, 2));
  console.log(`tempo: ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

main()
  .catch((e) => {
    console.error(`[rotina ERROR] ${e.message}`);
    process.exit(1);
  })
  .finally(() => unlink(CK).catch(() => {}));