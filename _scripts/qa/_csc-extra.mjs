// Capturas temporais do protótipo CSC (intro do hero, sequência da equipe, troca de passo da mama, hero inteiro)
import puppeteer from "puppeteer-core"; import { homedir } from "node:os";
const [U, OUT] = process.argv.slice(2);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: homedir()+"/AppData/Local/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--hide-scrollbars"] });
async function pagina(w, h) { const p = await b.newPage(); await p.setViewport({ width: w, height: h }); return p; }
async function rolarAte(p, sel, frac, w, h) {
  const alvo = await p.evaluate((s, f) => { const el = document.querySelector(s); return Math.max(0, el.getBoundingClientRect().top + scrollY - f * innerHeight); }, sel, frac);
  await p.mouse.move(w/2, h/2); let y = 0;
  while (y < alvo - 5) { const d = Math.min(400, alvo - y); await p.mouse.wheel({ deltaY: d }); y += d; await esperar(50); }
}
for (const [w, h, t] of [[1440, 900, "d"], [390, 844, "m"]]) {
  // 1. intro do hero (cache aquecido primeiro)
  let p = await pagina(w, h);
  await p.goto(U, { waitUntil: "networkidle2" }); await esperar(500);
  await p.goto(U, { waitUntil: "domcontentloaded" });
  const t0 = Date.now(); let i = 0;
  for (const ms of [250, 750, 1300, 3200]) { await esperar(Math.max(0, ms - (Date.now() - t0))); await p.screenshot({ path: `${OUT}/${t}-intro-${i++}.png` }); }
  // 2. equipe em sequência
  await esperar(800);
  await rolarAte(p, ".equipe__grade", 0.95, w, h); await esperar(900);
  await p.mouse.wheel({ deltaY: t === "d" ? 260 : 240 });
  const t1 = Date.now(); i = 0;
  for (const ms of [350, 800, 1300, 2800]) { await esperar(Math.max(0, ms - (Date.now() - t1))); await p.screenshot({ path: `${OUT}/${t}-seq-${i++}.png` }); }
  await p.close();
  if (t === "d") {
    // 3. mama: primeiro passo nítido e troca de passo no meio
    p = await pagina(w, h);
    await p.goto(U, { waitUntil: "networkidle2" }); await esperar(1500);
    await rolarAte(p, "#mama", 0, w, h); await esperar(3500);
    await p.screenshot({ path: `${OUT}/d-mama1.png` });
    await p.mouse.wheel({ deltaY: 380 }); await esperar(420);
    await p.screenshot({ path: `${OUT}/d-mamatroca.png` });
    await p.close();
    // 4. hero inteiro, sem cortes
    p = await pagina(1440, 1455);
    await p.goto(U, { waitUntil: "networkidle2" }); await esperar(4500);
    await p.screenshot({ path: `${OUT}/d-hero-inteiro.png` });
    await p.close();
  }
}
await b.close(); console.log("ok");
