#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  PRINTS v3-02 — captura as telas Hoje, Agenda, Operação e Clientes em
//  desktop (1280x800) e celular (375x812) e salva em
//  _scripts/qa/prints-v3-02/<tela>-<largura>.png.
//
//  Login via POST /api/login lendo as credenciais do apps/plataforma/.env.local.
//  NUNCA imprime credenciais nem token. Sai com código 1 em qualquer falha.
//
//  Uso: node _scripts/qa/prints-v3-02.mjs   (o app de teste precisa estar no ar)
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from "puppeteer-core";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = process.env.PORT ? "http://localhost:" + process.env.PORT : "http://localhost:3102";
const ENV_FILE = join(ROOT, "apps", "plataforma", ".env.local");
const CHROME = join(homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe");
const PRINTS = join(ROOT, "_scripts", "qa", "prints-v3-02");

const TELAS = [
  { nome: "hoje", label: "Hoje" },
  { nome: "agenda", label: "Agenda" },
  { nome: "operacao", label: "Operação" },
  { nome: "clientes", label: "Clientes" },
];
const TAMANHOS = [
  { width: 1280, height: 800 },
  { width: 375, height: 812 },
];

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

async function main() {
  const txt = await readFile(ENV_FILE, "utf8").catch(() => fail("não li apps/plataforma/.env.local"));
  const env = parseEnv(txt);
  if (!env.AGENCIA_USER || !env.AGENCIA_PASS) fail("AGENCIA_USER/AGENCIA_PASS ausentes no .env.local");

  await mkdir(PRINTS, { recursive: true });

  const token = await login(env.AGENCIA_USER, env.AGENCIA_PASS);

  const clicar = (page, alvo) =>
    page.evaluate((t) => {
      const el = [...document.querySelectorAll("button,a")].find(
        (x) => x.textContent.trim() === t || x.getAttribute("aria-label") === t,
      );
      if (el) el.click();
      return !!el;
    }, alvo);

  // No celular algumas abas ficam no sheet "Mais"; tenta direto e cai no sheet.
  async function abrirTela(page, label) {
    if (await clicar(page, label)) return true;
    if (await clicar(page, "Mais")) {
      await new Promise((r) => setTimeout(r, 600));
      return clicar(page, label);
    }
    return false;
  }

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
  const feitas = [];
  try {
    for (const tela of TELAS) {
      for (const { width, height } of TAMANHOS) {
        const page = await browser.newPage();
        await page.setViewport({ width, height, deviceScaleFactor: 1 });
        await page.setCookie({ name: "agencia_token", value: token, domain: "localhost", path: "/" });
        await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
        await new Promise((r) => setTimeout(r, 1200));
        if (!(await abrirTela(page, tela.label))) fail(`não achei a aba "${tela.label}" (${width}px)`);
        await new Promise((r) => setTimeout(r, 2000));
        const arquivo = join(PRINTS, `${tela.nome}-${width}.png`);
        await page.screenshot({ path: arquivo, fullPage: false });
        await page.close();
        feitas.push(`${tela.nome}-${width}.png`);
        console.log(`ok · ${tela.nome}-${width}.png`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`PASS: ${feitas.length} prints em ${PRINTS}`);
  process.exit(0);
}

main().catch((e) => fail(e?.message || "erro inesperado"));
