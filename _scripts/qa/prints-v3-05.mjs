#!/usr/bin/env node
// Prints da v3-05: relatório público e bloco do Hoje, em 1280 e 375.
// Cria um cliente de teste (e a saúde/pixel dele), captura e limpa tudo.
// Uso: PORT=3105 node _scripts/qa/prints-v3-05.mjs
import puppeteer from "puppeteer-core";
import { readFile, writeFile, unlink, mkdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { DatabaseSync } from "node:sqlite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = process.env.PORT ? "http://localhost:" + process.env.PORT : "http://localhost:3105";
const CHROME = join(homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe");
const SAIDA = join(ROOT, "_scripts", "qa", "prints-v3-05");

function parseEnv(txt) {
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

const env = parseEnv(await readFile(join(ROOT, "apps", "plataforma", ".env.local"), "utf8"));
const id = `prints-rel-${Date.now()}`;
const nome = "Clínica Sorriso Salvador";
const db = new DatabaseSync(join(ROOT, "apps", "plataforma", "data", "plataforma.sqlite"));
db.exec("PRAGMA foreign_keys = ON;");
const arqSaude = join(env.VAULT, "SaaS", "Saude", `${id}.json`);
const arqHits = join(env.VAULT, "SaaS", "Rastreamento", "hits.json");

try {
  await mkdir(SAIDA, { recursive: true });
  const agora = new Date().toISOString();
  db.prepare("INSERT INTO empresa (id,nome,cidade,site,estagio_crm,origem,criado_em,atualizado_em) VALUES (?,?,?,?,?,?,?,?)").run(
    id, nome, "Salvador", `https://${id}.example.com`, "cliente", "prints", agora, agora,
  );
  db.prepare("INSERT INTO contato (id,empresa_id,nome,whatsapp,criado_em) VALUES (?,?,?,?,?)").run(`${id}-c`, id, "", "71 98888-1234", agora);
  await mkdir(dirname(arqSaude), { recursive: true });
  await writeFile(arqSaude, JSON.stringify({ slug: id, cliente: nome, no_ar: true, certificado_dias: 9, formulario: "ok", verificado_em: agora }), "utf8");
  await fetch(`${BASE}/api/t?site=${id}`);

  const rl = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: env.AGENCIA_USER, pass: env.AGENCIA_PASS }),
  });
  const token = (rl.headers.get("set-cookie") || "").match(/agencia_token=([^;]+)/)?.[1];
  if (!token) throw new Error("login falhou");
  await fetch(`${BASE}/api/relatorio-mensal`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `agencia_token=${token}` },
    body: JSON.stringify({ action: "gerar", empresaId: id }),
  });
  const link = db.prepare("SELECT link_token FROM relatorio WHERE empresa_id = ?").get(id).link_token;

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
  try {
    for (const [w, h] of [[1280, 900], [375, 812]]) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      await page.goto(`${BASE}/r/${link}`, { waitUntil: "networkidle2" });
      await pausa(600);
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      console.log(`relatorio ${w}: scroll horizontal ${sobra}px`);
      await page.screenshot({ path: join(SAIDA, `relatorio-${w}.png`), fullPage: true });
      await page.close();

      const p2 = await browser.newPage();
      await p2.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      await p2.setCookie({ name: "agencia_token", value: token, domain: "localhost", path: "/" });
      await p2.goto(`${BASE}/`, { waitUntil: "networkidle2" });
      await pausa(1500);
      await p2.evaluate(() => {
        const el = [...document.querySelectorAll("button,a")].find((x) => x.textContent.trim() === "Hoje" || x.getAttribute("aria-label") === "Hoje");
        if (el) el.click();
      });
      await pausa(2500);
      const sobra2 = await p2.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      console.log(`hoje ${w}: scroll horizontal ${sobra2}px`);
      await p2.evaluate(() => {
        const t = [...document.querySelectorAll("h2")].find((e) => /relatórios dos clientes/i.test(e.textContent));
        t?.scrollIntoView({ block: "start" });
      });
      await pausa(400);
      await p2.screenshot({ path: join(SAIDA, `hoje-relatorios-${w}.png`) });
      await p2.close();
    }
  } finally {
    await browser.close();
  }
  console.log("prints salvos em _scripts/qa/prints-v3-05/");
} finally {
  db.prepare("DELETE FROM empresa WHERE id = ?").run(id);
  db.prepare("DELETE FROM relatorio WHERE gerado_em >= ? AND empresa_id <> ?").run(new Date(Date.now() - 120000).toISOString(), id);
  db.close();
  await unlink(arqSaude).catch(() => {});
  try {
    const h = JSON.parse(await readFile(arqHits, "utf8"));
    if (h[id]) {
      delete h[id];
      await writeFile(arqHits, JSON.stringify(h, null, 2), "utf8");
    }
  } catch {}
}
