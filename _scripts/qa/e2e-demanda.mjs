#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  E2E DEMANDA — prova de ponta a ponta da fonte única de demandas.
//
//  Fluxo:
//    1. lê apps/plataforma/.env.local (VAULT, AGENCIA_USER, AGENCIA_PASS)
//    2. cria uma demanda de teste pela MESMA lib que o persona.mjs usa
//    3. faz login na API local (porta 3100) e confere a demanda em /api/orquestra
//    4. confere NA TELA (puppeteer, aba "Time & Fila")
//    5. marca como cancelada e confere a mudança (arquivo + API)
//
//  Uso: node _scripts/qa/e2e-demanda.mjs   (o app precisa estar na porta 3100)
//  Nunca imprime credenciais/token. Sai com código 1 em qualquer falha.
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from "puppeteer-core";
import { readFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = "http://localhost:3100";
const ENV_FILE = join(ROOT, "apps", "plataforma", ".env.local");
const CHROME = join(homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe");

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function parseEnv(txt) {
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

async function login(user, pass) {
  let ultimo = "";
  for (let n = 0; n < 3; n++) {
    try {
      const r = await fetch(`${BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass }),
      });
      const sc = r.headers.get("set-cookie") || "";
      const m = sc.match(/agencia_token=([^;]+)/);
      if (r.ok && m) return m[1];
      ultimo = `HTTP ${r.status}`;
    } catch (e) {
      ultimo = e?.message || "fetch falhou";
    }
    if (n < 2) await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`login falhou (${ultimo})`);
}

async function apiFila(token) {
  const r = await fetch(`${BASE}/api/orquestra`, {
    headers: { Cookie: `agencia_token=${token}` },
  });
  if (!r.ok) throw new Error(`GET /api/orquestra → HTTP ${r.status}`);
  const j = await r.json();
  return Array.isArray(j.fila) ? j.fila : [];
}

async function main() {
  const txt = await readFile(ENV_FILE, "utf8").catch(() => fail("não li apps/plataforma/.env.local"));
  const env = parseEnv(txt);
  if (!env.AGENCIA_USER || !env.AGENCIA_PASS) fail("AGENCIA_USER/AGENCIA_PASS ausentes no .env.local");
  if (!process.env.VAULT && env.VAULT) process.env.VAULT = env.VAULT; // alinha com o vault do app

  const { criarDemanda, atualizarDemanda, lerDemanda, DIR } = await import("../lib/demanda.mjs");

  const titulo = "E2E demanda de teste " + Date.now();
  const criada = await criarDemanda({ titulo, persona: "theo", origem: "e2e", status: "fila" });
  if (!criada?.id) fail("não foi possível criar a demanda de teste");
  const id = criada.id;
  console.log(`ok · demanda criada (${id})`);

  const token = await login(env.AGENCIA_USER, env.AGENCIA_PASS);
  console.log("ok · login na API");

  const fila = await apiFila(token);
  if (!fila.some((d) => d.id === id && d.titulo === titulo)) {
    fail("demanda não apareceu na API /api/orquestra");
  }
  console.log("ok · API lista a demanda");

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
  try {
    const page = await browser.newPage();
    await page.setCookie({ name: "agencia_token", value: token, domain: "localhost", path: "/" });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.evaluate((t) => {
      const el = [...document.querySelectorAll("button,a")].find(
        (x) => x.textContent.trim() === t || x.getAttribute("aria-label") === t,
      );
      if (el) el.click();
    }, "Time & Fila");
    await new Promise((r) => setTimeout(r, 2500));
    const corpo = await page.evaluate(() => document.body.innerText || "");
    if (!corpo.includes(titulo)) fail('título de teste não apareceu na tela ("Time & Fila")');
  } finally {
    await browser.close();
  }
  console.log("ok · tela mostra a demanda");

  await atualizarDemanda(id, { status: "cancelada" });
  const lido = await lerDemanda(id);
  if (lido?.fm?.status !== "cancelada") fail("arquivo da demanda não ficou cancelada");

  const fila2 = await apiFila(token);
  const naApi = fila2.find((d) => d.id === id);
  if (!naApi || naApi.status !== "cancelada") fail("API não refletiu o status cancelada");
  console.log("ok · demanda marcada como cancelada (arquivo + API)");

  // limpa: a demanda de teste não fica poluindo a lista do Everton
  const { unlink } = await import("node:fs/promises");
  const { join } = await import("node:path");
  await unlink(join(DIR, id + ".md")).catch(() => {});
  console.log(`PASS: demanda ${id} criada, visível na API e na tela, cancelada e removida`);
  process.exit(0);
}

main().catch((e) => fail(e?.message || "erro inesperado"));
