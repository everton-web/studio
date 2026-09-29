#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  PRINT TIME & FILA — abre a plataforma (porta 3100), entra na aba
//  "Time & Fila" e salva _scripts/qa/print-time-fila.png (1440x900) com as
//  demandas reais. Login via POST /api/login lendo as credenciais do
//  apps/plataforma/.env.local. NUNCA imprime credenciais nem token.
//
//  Uso: node _scripts/qa/print-time-fila.mjs
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from "puppeteer-core";
import { readFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = "http://localhost:3100";
const ENV_FILE = join(ROOT, "apps", "plataforma", ".env.local");
const SAIDA = join(ROOT, "_scripts", "qa", "print-time-fila.png");
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

async function main() {
  const txt = await readFile(ENV_FILE, "utf8").catch(() => fail("não li apps/plataforma/.env.local"));
  const env = parseEnv(txt);
  if (!env.AGENCIA_USER || !env.AGENCIA_PASS) fail("AGENCIA_USER/AGENCIA_PASS ausentes no .env.local");

  const token = await login(env.AGENCIA_USER, env.AGENCIA_PASS);

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.setCookie({ name: "agencia_token", value: token, domain: "localhost", path: "/" });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));

    const clicou = await page.evaluate((t) => {
      const el = [...document.querySelectorAll("button,a")].find(
        (x) => x.textContent.trim() === t || x.getAttribute("aria-label") === t,
      );
      if (el) el.click();
      return !!el;
    }, "Time & Fila");
    if (!clicou) fail('não achei a aba "Time & Fila"');
    await new Promise((r) => setTimeout(r, 3000));

    // rola até a lista de demandas reais (card com "na agência")
    const rolou = await page.evaluate(() => {
      const alvo = [...document.querySelectorAll("span")]
        .find((x) => /na agência$/.test(x.textContent.trim()));
      const card = alvo?.closest(".card") || alvo?.parentElement;
      if (!card) return false;
      card.scrollIntoView({ block: "start" });
      return true;
    });
    await new Promise((r) => setTimeout(r, 1200));

    await page.screenshot({ path: SAIDA });
    const corpo = await page.evaluate(() => document.body.innerText || "");
    const tem28 = /botão de WhatsApp nos cards/i.test(corpo);
    const tem29 = /fonte única de demandas/i.test(corpo);
    console.log(`ok · print em ${SAIDA}`);
    console.log(`ok · rolou até a fila: ${rolou} · demanda real 28/09 na tela: ${tem28} · 29/09: ${tem29}`);
  } finally {
    await browser.close();
  }
  process.exit(0);
}

main().catch((e) => fail(e?.message || "erro inesperado"));
