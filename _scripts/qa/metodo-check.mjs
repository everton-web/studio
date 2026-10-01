// QA pontual: rola com a roda do mouse pela seção de método e fotografa a cada passo.
import puppeteer from "puppeteer-core";
import { homedir } from "node:os";
const CHROME = process.env.CHROME || homedir() + "/AppData/Local/Google/Chrome/Application/chrome.exe";
const [url, out, texto = "Como estruturamos"] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
await p.goto(url, { waitUntil: "networkidle2" }); await new Promise(r => setTimeout(r, 1500));
const top = await p.evaluate((t) => { const s = [...document.querySelectorAll("section")].find(x => x.textContent.includes(t)); return s.getBoundingClientRect().top + scrollY; }, texto);
await p.mouse.move(700, 450);
let y = 0; while (y < top - 100) { await p.mouse.wheel({ deltaY: 300 }); y += 300; await new Promise(r => setTimeout(r, 60)); }
for (let i = 0; i < 6; i++) { await new Promise(r => setTimeout(r, 1500)); await p.screenshot({ path: `${out}-${i}.png` }); for (let k = 0; k < 3; k++) { await p.mouse.wheel({ deltaY: 300 }); await new Promise(r => setTimeout(r, 80)); } }
await b.close(); console.log("ok");
