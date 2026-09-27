// Captura headless v2 — UMA sessão autenticada, troca de viewport por view.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "shots");
mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:3100";
const envLocal = join(HERE, "..", "..", "agencia-app", ".env.local");
const env = readFileSync(envLocal, "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.+)$`, "m")) || [])[1]?.trim() || "";
const USER = get("AGENCIA_USER") || "everton";
const PASS = get("AGENCIA_PASS");

const VIEWS = [
  ["comando", "Início"], ["kanban", "Projetos"], ["pipeline", "Prospecção"],
  ["demandas", "Demandas"], ["agentes", "Time"], ["inbox", "Caixa"],
  ["backlog", "Fila"], ["chat", "Assistente"], ["arquivos", "Arquivos"],
  ["rastreamento", "Rastreamento"], ["analytics", "Analytics"], ["financas", "Finanças"],
];
const SIZES = [["m360", 360, 640], ["t768", 768, 1024], ["d1440", 1440, 900]];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();

  // login (uma vez)
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input:not([type="password"])', USER);
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  await page.waitForTimeout(1200);
  console.log("login ok (cookie na sessão)");

  for (const [id, label] of VIEWS) {
    for (const [tag, w, h] of SIZES) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(BASE, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      // clica no nav pela label (evita cabeçalho h1 — pega a última ocorrência de <button>)
      const principais = ["Início", "Projetos", "Prospecção", "Assistente"];
      if (w <= 768 && !principais.includes(label)) {
        // mobile: abrir o sheet "Mais" antes de clicar na view
        try { await page.locator(`button:has-text("Mais")`).first().click({ timeout: 3000 }); await page.waitForTimeout(500); } catch {}
      }
      try {
        const navBtn = page.locator(`nav button:has-text("${label}"), aside button:has-text("${label}")`).last();
        await navBtn.click({ timeout: 5000 });
        await page.waitForTimeout(1100);
      } catch {
        try {
          await page.locator(`button:has-text("${label}")`).last().click({ timeout: 4000 });
          await page.waitForTimeout(900);
        } catch { console.log(`  (nav falhou: ${label} ${tag})`); }
      }
      await page.screenshot({ path: join(OUT, `${id}-${tag}.png`), fullPage: false });
    }
    console.log(`${id} ✓`);
  }
  await browser.close();
  console.log("capturas em", OUT);
}
main().catch((e) => { console.error(e); process.exit(1); });