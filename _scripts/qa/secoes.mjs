// QA visual do Orion: abre uma página no Chrome instalado, rola seção por seção e fotografa
// cada tela (desktop e celular com emulação real de dispositivo), esperando as animações de entrada.
//
// Uso: node _scripts/qa/secoes.mjs <url> <pasta-saida> [desktop|celular|ambos]
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const [, , url, saida, modo = "ambos"] = process.argv;
if (!url || !saida) { console.log("uso: node secoes.mjs <url> <pasta> [desktop|celular|ambos]"); process.exit(1); }
const CHROME = process.env.CHROME || join(homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe");
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const PERFIS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  celular: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

await mkdir(saida, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
try {
  for (const nome of modo === "ambos" ? ["desktop", "celular"] : [modo]) {
    const page = await browser.newPage();
    // DATA=2026-10-01 simula outra data (ex.: prints sem a faixa de promoção)
    if (process.env.DATA) await page.evaluateOnNewDocument((d) => { const R = Date, fixo = new R(d).getTime(), ini = R.now(); globalThis.Date = class extends R { constructor(...a) { super(...(a.length ? a : [fixo + (R.now() - ini)])); } static now() { return fixo + (R.now() - ini); } }; }, process.env.DATA);
    await page.setViewport(PERFIS[nome]);
    if (nome === "celular") await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
    const erros = [];
    page.on("pageerror", (e) => erros.push(e.message));
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await esperar(2500);
    const altura = await page.evaluate(() => document.documentElement.scrollHeight);
    const passo = PERFIS[nome].height;
    let i = 0;
    for (let y = 0; y < altura && i < 14; y += passo, i++) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await esperar(1600); // tempo para os reveals dispararem e terminarem
      await page.screenshot({ path: join(saida, `${nome}-${String(i + 1).padStart(2, "0")}.png`) });
    }
    const estouro = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    console.log(`${nome}: ${i} telas · altura ${altura}px · estouro lateral: ${estouro ? "SIM" : "não"}${erros.length ? " · erros JS: " + erros.slice(0, 3).join(" | ") : ""}`);
    await page.close();
  }
} finally {
  await browser.close();
}
