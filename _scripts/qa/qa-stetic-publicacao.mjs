import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const base = process.env.BASE_URL ?? "http://localhost:3317";
const outDir = "D:/studio/design/clientes/stetic-class/publicacao";
const paths = [
  "/relatorio/stetic-class",
  "/relatorio/stetic-class/detalhado",
  "/relatorio/stetic-class/design-system",
  "/relatorio/stetic-class/prototipo",
];

await mkdir(outDir, { recursive: true });

const results = [];
for (const path of paths) {
  const res = await fetch(`${base}${path}`);
  results.push({ path, status: res.status, robots: res.headers.get("x-robots-tag") });
}

const browser = await puppeteer.launch({
  executablePath: join(homedir(), "AppData/Local/Google/Chrome/Application/chrome.exe"),
  headless: "new",
});

const errors = [];
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });
page.on("response", (res) => {
  const url = res.url();
  const status = res.status();
  if (url.startsWith(`${base}/relatorio/stetic-class/prototipo`) && status >= 400) {
    errors.push({ status, url });
  }
});
page.on("requestfailed", (req) => {
  const url = req.url();
  if (url.startsWith(`${base}/relatorio/stetic-class/prototipo`)) {
    errors.push({ status: "failed", url, reason: req.failure()?.errorText ?? "request failed" });
  }
});

await page.goto(`${base}/relatorio/stetic-class/prototipo`, { waitUntil: "networkidle2", timeout: 60000 });
await page.waitForSelector("#hero .hero__midia img", { timeout: 15000 });
await page.waitForSelector("#cuidado .cuidado__trilho .bastidor", { timeout: 15000 });
const visible = await page.evaluate(() => {
  const hero = document.querySelector("#hero .hero__midia img");
  const cuidado = document.querySelector("#cuidado .cuidado__trilho");
  const heroBox = hero?.getBoundingClientRect();
  const cuidadoBox = cuidado?.getBoundingClientRect();
  return {
    hero: Boolean(heroBox && heroBox.width > 300 && heroBox.height > 150),
    cuidado: Boolean(cuidadoBox && cuidadoBox.width > 300 && cuidadoBox.height > 150),
    title: document.title,
  };
});
await page.screenshot({ path: `${outDir}/prototipo-desktop.png`, fullPage: true });

const ds = await browser.newPage();
await ds.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });
await ds.goto(`${base}/relatorio/stetic-class/design-system`, { waitUntil: "domcontentloaded", timeout: 60000 });
await ds.waitForSelector("h1", { timeout: 15000 });
await new Promise((resolve) => setTimeout(resolve, 1500));
await ds.screenshot({ path: `${outDir}/design-system.png`, fullPage: true });

await browser.close();

const failedStatuses = results.filter((r) => r.status !== 200);
const missingRobots = results.filter((r) => /design-system|prototipo/.test(r.path) && !String(r.robots ?? "").includes("noindex"));
const ok = failedStatuses.length === 0 && errors.length === 0 && visible.hero && visible.cuidado && missingRobots.length === 0;

console.log(JSON.stringify({ ok, results, visible, errors, screenshots: [`${outDir}/prototipo-desktop.png`, `${outDir}/design-system.png`] }, null, 2));
if (!ok) process.exit(1);
