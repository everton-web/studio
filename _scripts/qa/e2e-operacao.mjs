#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  E2E OPERAÇÃO — prova de ponta a ponta das visões Hoje/Agenda/Operação.
//
//  Fluxo:
//    1. lê apps/plataforma/.env.local (VAULT, AGENCIA_USER, AGENCIA_PASS)
//    2. cria uma demanda de teste pela MESMA lib que os scripts usam (prazo hoje)
//    3. faz login na API local e confere a demanda em GET /api/orquestra
//    4. confere NA TELA (puppeteer): aba "Operação" (quadro) e aba "Hoje"
//       (agenda do dia), porque a demanda de hoje aparece nas duas
//    5. muda o status para em_andamento e confere a mudança (arquivo + API)
//    6. limpa a demanda de teste com unlink
//
//  Uso: node _scripts/qa/e2e-operacao.mjs   (o app de teste precisa estar no ar)
//  Nunca imprime credenciais/token. Sai com código 1 em qualquer falha.
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from "puppeteer-core";
import { readFile, unlink } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = process.env.PORT ? "http://localhost:" + process.env.PORT : "http://localhost:3102";
const ENV_FILE = join(ROOT, "apps", "plataforma", ".env.local");
const CHROME = join(homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe");

function fail(msg) {
  throw new Error(msg);
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

function hojeISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

async function main() {
  const txt = await readFile(ENV_FILE, "utf8").catch(() => fail("não li apps/plataforma/.env.local"));
  const env = parseEnv(txt);
  if (!env.AGENCIA_USER || !env.AGENCIA_PASS) fail("AGENCIA_USER/AGENCIA_PASS ausentes no .env.local");
  if (!process.env.VAULT && env.VAULT) process.env.VAULT = env.VAULT; // alinha com o vault do app

  const { criarDemanda, atualizarDemanda, lerDemanda, DIR } = await import("../lib/demanda.mjs");

  let id = null;
  const titulo = "E2E operação de teste " + Date.now();
  const criada = await criarDemanda({
    titulo,
    persona: "theo",
    origem: "e2e",
    status: "fila",
    prazo: hojeISO(),
  });
  if (!criada?.id) fail("não foi possível criar a demanda de teste");
  id = criada.id;
  console.log(`ok · demanda criada (${id})`);

  try {
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
      await new Promise((r) => setTimeout(r, 1500));

      const clicarAba = (t) =>
        page.evaluate((alvo) => {
          const el = [...document.querySelectorAll("button,a")].find(
            (x) => x.textContent.trim() === alvo || x.getAttribute("aria-label") === alvo,
          );
          if (el) el.click();
          return !!el;
        }, t);

      // aba Operação (quadro: a demanda aparece na coluna "na fila")
      if (!(await clicarAba("Operação"))) fail('não achei a aba "Operação"');
      await new Promise((r) => setTimeout(r, 2500));
      const corpoOperacao = await page.evaluate(() => document.body.innerText || "");
      if (!corpoOperacao.includes(titulo)) fail('título de teste não apareceu na aba "Operação"');
      if (!corpoOperacao.includes("Operação")) fail('palavra "Operação" não apareceu na tela');
      console.log("ok · aba Operação mostra a demanda");

      // aba Hoje (agenda do dia contém a demanda com prazo de hoje)
      if (!(await clicarAba("Hoje"))) fail('não achei a aba "Hoje"');
      await new Promise((r) => setTimeout(r, 2500));
      const corpoHoje = await page.evaluate(() => document.body.innerText || "");
      if (!corpoHoje.includes(titulo)) fail('título de teste não apareceu na aba "Hoje" (agenda do dia)');
      console.log("ok · aba Hoje (agenda do dia) mostra a demanda");
    } finally {
      await browser.close();
    }

    await atualizarDemanda(id, { status: "em_andamento" });
    const lido = await lerDemanda(id);
    if (lido?.fm?.status !== "em_andamento") fail("arquivo da demanda não ficou em_andamento");

    const fila2 = await apiFila(token);
    const naApi = fila2.find((d) => d.id === id);
    if (!naApi || naApi.status !== "em_andamento") fail("API não refletiu o status em_andamento");
    console.log("ok · demanda em_andamento (arquivo + API)");

    console.log(`PASS: demanda ${id} criada, visível em Operação e Hoje, movida para em_andamento e removida`);
  } finally {
    // limpa: a demanda de teste não fica poluindo a lista do Everton (mesmo em falha)
    if (id) await unlink(join(DIR, id + ".md")).catch(() => {});
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(`FAIL: ${e?.message || "erro inesperado"}`);
  process.exit(1);
});
