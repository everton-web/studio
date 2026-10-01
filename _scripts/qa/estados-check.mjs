// QA de motion: rola com a roda do mouse (passa pelo Lenis) e fotografa estados intermediários.
// Adaptado de metodo-check.mjs para qualquer seção e qualquer tamanho de tela.
// Uso: node estados-check.mjs <url> <prefixo-saida> <seletor> <LxA> [passos=6] [delta=300] [inicio=-1]
//   inicio: posição inicial em telas relativas ao topo da seção (-1 = seção entrando por baixo).
import puppeteer from "puppeteer-core";
import { homedir } from "node:os";
const CHROME = process.env.CHROME || homedir() + "/AppData/Local/Google/Chrome/Application/chrome.exe";
const [url, out, seletor, tamanho = "1440x900", passos = "6", delta = "300", inicio = "-1"] = process.argv.slice(2);
const [width, height] = tamanho.split("x").map(Number);
const celular = width < 768;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width, height, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
const erros = [];
p.on("pageerror", (e) => erros.push(e.message));
await p.goto(url, { waitUntil: "networkidle2" });
await esperar(1500);
const alvo = await p.evaluate((s, ini) => {
  const el = document.querySelector(s);
  return Math.max(0, el.getBoundingClientRect().top + scrollY + ini * innerHeight);
}, seletor, Number(inicio));
await p.mouse.move(width / 2, height / 2);
let y = 0;
while (y < alvo - 10) { const d = Math.min(400, alvo - y); await p.mouse.wheel({ deltaY: d }); y += d; await esperar(50); }
for (let i = 0; i < Number(passos); i++) {
  await esperar(1300);
  await p.screenshot({ path: `${out}-${String(i).padStart(2, "0")}.png` });
  for (let k = 0; k < 2; k++) { await p.mouse.wheel({ deltaY: Number(delta) / 2 }); await esperar(60); }
}
// Medidas da seção Quem somos: a cabeça (topo da foto + 5%) precisa estar dentro da área visível do retrato.
const medidas = await p.evaluate(() => {
  const img = document.querySelector(".about-photo img");
  const fig = document.querySelector(".about-founder");
  if (!img || !fig) return null;
  const r = img.getBoundingClientRect(), f = fig.getBoundingClientRect();
  const clipTop = getComputedStyle(fig).overflow === "hidden" ? f.top : -Infinity;
  const cabeca = r.top + r.height * 0.05;
  return { imgTop: Math.round(r.top), imgH: Math.round(r.height), figTop: Math.round(f.top), cabecaVisivel: cabeca >= clipTop, lateral: document.documentElement.scrollWidth > innerWidth + 1 };
});
console.log(`${tamanho}${celular ? " (estreito)" : ""}: ok`, JSON.stringify(medidas), erros.length ? "erros: " + erros.join(" | ") : "");
await b.close();
