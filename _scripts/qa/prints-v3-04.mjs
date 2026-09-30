#!/usr/bin/env node
// Prints da v3-04 (Comercial, Clientes, gaveta do cliente e briefing público)
// em 1280 e 375, salvos em _scripts/qa/prints-v3-04/. Cria um cliente de teste
// completo (saúde, cobranças, cofre, briefing) e apaga tudo no fim.
// Uso: PORT=3104 node _scripts/qa/prints-v3-04.mjs
import puppeteer from "puppeteer-core";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { DatabaseSync } from "node:sqlite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = "http://localhost:" + (process.env.PORT || "3104");
const OUT = join(ROOT, "_scripts", "qa", "prints-v3-04");
const CHROME = join(homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe");
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function parseEnv(txt) {
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = parseEnv(await readFile(join(ROOT, "apps", "plataforma", ".env.local"), "utf8"));
const VAULT = env.VAULT;
const DB = join(ROOT, "apps", "plataforma", "data", "plataforma.sqlite");
const r0 = await fetch(`${BASE}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: env.AGENCIA_USER, pass: env.AGENCIA_PASS, lembrar: true }) });
const token = (r0.headers.get("set-cookie") || "").match(/agencia_token=([^;]+)/)?.[1];
if (!token) throw new Error("login falhou");
const post = async (url, body) => (await fetch(BASE + url, { method: "POST", headers: { "Content-Type": "application/json", Cookie: `agencia_token=${token}` }, body: JSON.stringify(body) })).json();

await mkdir(OUT, { recursive: true });
const nome = "Clínica Sorriso Demo";
const id = "clinica-sorriso-demo";
const arquivos = [];
const db = new DatabaseSync(DB);
const problemas = [];

try {
  await post("/api/clientes", { action: "criar", nome, segmento: "Odontologia", site: "https://evertonbrito.com", valor_projeto: "1997", recorrencia: "150" });
  const saude = join(VAULT, "SaaS", "Saude", `${id}.json`);
  await mkdir(dirname(saude), { recursive: true });
  await writeFile(saude, JSON.stringify({ slug: id, cliente: nome, no_ar: true, certificado_dias: 9, formulario: "ok", velocidade_ms: null, verificado_em: new Date(Date.now() - 2 * 3600e3).toISOString() }));
  arquivos.push(saude);
  const fin = join(VAULT, "SaaS", "Financeiro");
  await mkdir(fin, { recursive: true });
  const dv = new Date(Date.now() + 9 * 86400e3).toISOString().slice(0, 10);
  const regs = [
    { id: "demo1", data: "20/09/2026, 10:00:00", descricao: "Entrada do site", valor: 1000, paid: true, paidAt: "21/09/2026, 09:10:00" },
    { id: "demo2", data: "25/09/2026, 10:00:00", descricao: "Segunda parcela", valor: 997, vencimento: dv },
  ];
  for (const r of regs) {
    const f = join(fin, `demo-${id}-${r.id}.json`);
    await writeFile(f, JSON.stringify({ ...r, quantidade: 1, url: null, handle: "demo", ok: true, order_nsu: `demo-${r.id}`, cliente: id }));
    arquivos.push(f);
  }
  await post("/api/clientes", { action: "credencial", id, label: "WordPress Admin", usuario: "admin", senha: "senha-de-demonstracao" });
  await post("/api/clientes", { action: "credencial", id, label: "cPanel", usuario: "cpanel", senha: "outra-senha-demo" });
  const b = await post("/api/clientes", { action: "briefing", id });
  const tokenBriefing = b.briefing.token;

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
  const clicar = (page, sel, txt) =>
    page.evaluate((s, t) => {
      const el = [...document.querySelectorAll(s)].find((e) => (e.textContent || "").trim().toLowerCase().includes(t.toLowerCase()) && e.offsetParent !== null);
      if (el) el.click();
      return !!el;
    }, sel, txt);

  for (const [w, h, sufixo] of [[1280, 800, "1280"], [375, 812, "375"]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.setCookie({ name: "agencia_token", value: token, domain: "localhost", path: "/" });
    const semRolagem = async (rot) => {
      const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      if (o.sw > o.iw + 1) problemas.push(`${rot} ${sufixo}: rolagem horizontal (${o.sw} > ${o.iw})`);
    };
    await page.goto(BASE + "/", { waitUntil: "networkidle2" });
    await esperar(1200);

    // Comercial
    if (w < 1024) { await clicar(page, "button", "Comercial"); } else { await clicar(page, "button", "Comercial"); }
    await esperar(1500);
    await page.screenshot({ path: join(OUT, `comercial-${sufixo}.png`) });
    await semRolagem("comercial");

    // Clientes
    if (w < 1024) { await clicar(page, "button", "Mais"); await esperar(500); }
    await clicar(page, "button", "Clientes");
    await page.waitForSelector("[data-grade]", { timeout: 8000 });
    await esperar(800);
    await page.screenshot({ path: join(OUT, `clientes-${sufixo}.png`) });
    await semRolagem("clientes");

    // Gaveta do cliente de teste (altura grande para caber tudo)
    await page.setViewport({ width: w, height: w < 1024 ? 3200 : 2100, deviceScaleFactor: 1 });
    await esperar(400);
    await page.click(`[data-card-cliente="${id}"]`);
    await page.waitForSelector("[data-gaveta]");
    await esperar(1200);
    await clicar(page, "button", "mostrar");
    await esperar(400);
    await page.screenshot({ path: join(OUT, `gaveta-${sufixo}.png`) });
    const g = await page.evaluate(() => {
      const el = document.querySelector("[data-gaveta]");
      return { sw: el.scrollWidth, cw: el.clientWidth };
    });
    if (g.sw > g.cw + 1) problemas.push(`gaveta ${sufixo}: conteúdo mais largo que a gaveta (${g.sw} > ${g.cw})`);
    const txt = await page.evaluate(() => document.body.innerText);
    if (/[—–]/.test(txt)) problemas.push(`travessão visível em ${sufixo}`);
    await page.close();
  }

  // briefing público
  for (const [w, h, sufixo] of [[1280, 900, "1280"], [375, 812, "375"]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });
    await page.goto(`${BASE}/b/${tokenBriefing}`, { waitUntil: "networkidle2" });
    await esperar(500);
    await page.screenshot({ path: join(OUT, `briefing-publico-${sufixo}.png`), fullPage: true });
    await page.close();
  }
  await browser.close();
} finally {
  await post("/api/clientes", { action: "remover-credencial", id, credencial: "x" }).catch(() => {});
  for (const a of arquivos) await unlink(a).catch(() => {});
  db.prepare("DELETE FROM credencial WHERE empresa_id = ?").run(id);
  db.prepare("DELETE FROM briefing WHERE empresa_id = ?").run(id);
  db.prepare("DELETE FROM empresa WHERE id = ?").run(id);
  db.close();
}
console.log(problemas.length ? "PROBLEMAS:\n" + problemas.join("\n") : "prints gerados, sem rolagem horizontal nem travessão");
process.exit(problemas.length ? 1 : 0);
