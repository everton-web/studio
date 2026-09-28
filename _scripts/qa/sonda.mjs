// Sonda: rola até cada título grande e mede se ficou visível (opacidade/transform) após esperar.
import puppeteer from "puppeteer-core";
import { join } from "node:path"; import { homedir } from "node:os";
const [, , url] = process.argv;
const b = await puppeteer.launch({ executablePath: join(homedir(), "AppData/Local/Google/Chrome/Application/chrome.exe"), headless: "new" });
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
await p.goto(url, { waitUntil: "networkidle2" }); await new Promise(r => setTimeout(r, 2000));
const alvos = await p.evaluate(() => [...document.querySelectorAll("h1,h2,h3,[class*=display],[class*=Display]")].filter(e => e.textContent.trim().length > 6).map((e, i) => { e.setAttribute("data-sonda", i); return { i, tag: e.tagName, txt: e.textContent.trim().slice(0, 40) }; }));
for (const a of alvos) {
  await p.evaluate(i => document.querySelector(`[data-sonda="${i}"]`).scrollIntoView({ block: "center" }), a.i);
  await new Promise(r => setTimeout(r, 1800));
  a.estado = await p.evaluate(i => { const e = document.querySelector(`[data-sonda="${i}"]`); const folhas = [...e.querySelectorAll("*")].filter(x => x.children.length === 0 && x.textContent.trim()); const vis = folhas.filter(x => { const s = getComputedStyle(x); let o = 1, n = x; while (n) { o *= Number(getComputedStyle(n).opacity); n = n.parentElement; } return o > 0.5 && !/matrix\(1, 0, 0, 1, 0, [1-9]\d/.test(s.transform); }).length; const r = e.getBoundingClientRect(); return { folhas: folhas.length, visiveis: vis, cor: getComputedStyle(e).color, altura: Math.round(r.height) }; }, a.i);
}
console.table(alvos.map(a => ({ tag: a.tag, texto: a.txt, ...a.estado })));
await b.close();
