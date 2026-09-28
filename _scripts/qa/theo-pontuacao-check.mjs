// Verificação pontual (Theo): nenhuma linha do parágrafo Sobre (WordReveal) começa com pontuação.
// Uso: node theo-pontuacao-check.mjs <url>
import puppeteer from "puppeteer-core";
import { homedir } from "node:os";
import { join } from "node:path";

const [, , url] = process.argv;
const CHROME = process.env.CHROME || join(homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe");
const PONT = /^[.,;:!?…]/;

const perfis = [
  { nome: "desktop", width: 1440, height: 900, ua: null },
  { nome: "celular", width: 390, height: 844, ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
try {
  for (const p of perfis) {
    const page = await browser.newPage();
    await page.setViewport({ width: p.width, height: p.height });
    if (p.ua) await page.setUserAgent(p.ua);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    // rola até o Sobre para disparar a animação (texto já está no DOM de qualquer forma)
    await page.evaluate(() => {
      const el = document.getElementById("about");
      if (el) el.scrollIntoView({ block: "center" });
    });
    await new Promise((r) => setTimeout(r, 2200));

    const r = await page.evaluate(() => {
      const spans = [...document.querySelectorAll("#about span.inline-block")];
      const linhas = [];
      let prevTop = null;
      const comPonto = [];
      for (const s of spans) {
        const rect = s.getBoundingClientRect();
        if (prevTop === null || Math.abs(rect.top - prevTop) > 2) {
          const txt = (s.textContent || "").trim();
          linhas.push(txt);
          if (/^[.,;:!?…]/.test(txt)) comPonto.push(txt);
        }
        prevTop = rect.top;
      }
      // texto completo do statement (concatena tokens na ordem do DOM)
      const full = spans.map((s) => (s.textContent || "").trim()).join(" ");
      return { linhas, comPonto, full };
    });

    console.log(`\n=== ${p.nome} (${p.width}px) ===`);
    console.log("Texto completo:", r.full);
    console.log("Início de cada linha visual:", JSON.stringify(r.linhas, null, 0));
    console.log(r.comPonto.length === 0
      ? "OK: nenhuma linha começa com pontuação."
      : `PROBLEMA: linhas começando com pontuação -> ${JSON.stringify(r.comPonto)}`);
    await page.close();
  }
} finally {
  await browser.close();
}
