#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  E2E DEMANDA — prova de ponta a ponta da fonte única de demandas.
//
//  Fluxo:
//    1. lê apps/plataforma/.env.local (VAULT, AGENCIA_USER, AGENCIA_PASS)
//    2. assere a regra pura statusDoRelatorio (PENDENTE → aguardando_everton)
//    3. cria uma demanda de teste pela MESMA lib que o persona.mjs usa
//    4. faz login na API local e confere a demanda em /api/orquestra
//    5. confere NA TELA (puppeteer, aba "Operação")
//    6. marca como aguardando_everton e confere arquivo + API + tela (aba "Hoje",
//       bloco "Aprovações pendentes")
//    7. aprova pela API (POST /api/orquestra { action: "aprovar" }) e confere
//       que virou concluida (arquivo + API)
//
//  Uso: node _scripts/qa/e2e-demanda.mjs   (o app precisa estar no ar)
//  Nunca imprime credenciais/token. Sai com código 1 em qualquer falha.
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from "puppeteer-core";
import { readFile, unlink } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { statusDoRelatorio } from "../lib/demanda.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = process.env.PORT ? "http://localhost:" + process.env.PORT : "http://localhost:3100";
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

async function apiAprovar(token, id) {
  const r = await fetch(`${BASE}/api/orquestra`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `agencia_token=${token}` },
    body: JSON.stringify({ action: "aprovar", id }),
  });
  if (!r.ok) throw new Error(`POST /api/orquestra (aprovar) → HTTP ${r.status}`);
  return r.json();
}

async function main() {
  // regra pura: PENDENTE com aprovação/decisão do Everton → aguardando_everton
  const aguarda = statusDoRelatorio("PENDENTE: aguarda aprovação do Everton sobre os posts");
  if (aguarda !== "aguardando_everton") {
    fail(`statusDoRelatorio deveria ser "aguardando_everton" (com aprovação), veio "${aguarda}"`);
  }
  const semPendencia = statusDoRelatorio("PENDENTE: nada");
  if (semPendencia !== "concluida") {
    fail(`statusDoRelatorio deveria ser "concluida" (sem aprovação), veio "${semPendencia}"`);
  }
  console.log("ok · statusDoRelatorio decide aguardando_everton (aprovação) e concluida (sem pendência)");

  const txt = await readFile(ENV_FILE, "utf8").catch(() => fail("não li apps/plataforma/.env.local"));
  const env = parseEnv(txt);
  if (!env.AGENCIA_USER || !env.AGENCIA_PASS) fail("AGENCIA_USER/AGENCIA_PASS ausentes no .env.local");
  if (!process.env.VAULT && env.VAULT) process.env.VAULT = env.VAULT; // alinha com o vault do app

  const { criarDemanda, atualizarDemanda, lerDemanda, DIR } = await import("../lib/demanda.mjs");

  let id = null;
  const titulo = "E2E demanda de teste " + Date.now();
  const criada = await criarDemanda({ titulo, persona: "theo", origem: "e2e", status: "fila" });
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

      // aba Operação (a navegação v3 tem Hoje/Agenda/Operação/...)
      if (!(await clicarAba("Operação"))) fail('não achei a aba "Operação"');
      await new Promise((r) => setTimeout(r, 2500));
      const corpoOperacao = await page.evaluate(() => document.body.innerText || "");
      if (!corpoOperacao.toLowerCase().includes(titulo.toLowerCase())) fail('título de teste não apareceu na aba "Operação"');
      console.log("ok · tela mostra a demanda (aba Operação)");

      // fluxo novo: aguardando_everton aparece em "Aprovações pendentes" na aba Hoje
      await atualizarDemanda(id, { status: "aguardando_everton" });
      const filaAguarda = await apiFila(token);
      const naApiAguarda = filaAguarda.find((d) => d.id === id);
      if (!naApiAguarda || naApiAguarda.status !== "aguardando_everton") {
        fail("API não refletiu o status aguardando_everton");
      }
      console.log("ok · demanda aguardando_everton na API");

      if (!(await clicarAba("Hoje"))) fail('não achei a aba "Hoje"');
      await new Promise((r) => setTimeout(r, 2500));
      const corpoHoje = await page.evaluate(() => document.body.innerText || "");
      if (!corpoHoje.toLowerCase().includes("aprovações pendentes")) fail('bloco "Aprovações pendentes" não apareceu na aba "Hoje"');
      if (!corpoHoje.toLowerCase().includes(titulo.toLowerCase())) fail('título de teste não apareceu em "Aprovações pendentes"');
      console.log('ok · aba Hoje mostra a demanda em "Aprovações pendentes"');
    } finally {
      await browser.close();
    }

    // aprova pela API e confere que virou concluida (arquivo + API)
    await apiAprovar(token, id);
    const lido = await lerDemanda(id);
    if (lido?.fm?.status !== "concluida") fail("arquivo da demanda não ficou concluida após aprovar");

    const fila3 = await apiFila(token);
    const naApi = fila3.find((d) => d.id === id);
    if (!naApi || naApi.status !== "concluida") fail("API não refletiu o status concluida após aprovar");
    console.log("ok · aprovar moveu a demanda para concluida (arquivo + API)");

    console.log(`PASS: demanda ${id} criada, visível em Operação, aguardando_everton em Hoje, aprovada e removida`);
  } finally {
    // limpa: a demanda de teste não fica poluindo a lista do Everton (mesmo em falha)
    if (id) await unlink(join(DIR, id + ".md")).catch(() => {});
  }

  process.exit(0);
}

main().catch((e) => fail(e?.message || "erro inesperado"));
