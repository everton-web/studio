// Print de uma aba da plataforma já logada (cookie em COOKIE="nome=valor"). Uso: node app-tela.mjs <aba-texto> <saida.png> [largura] [altura]
import puppeteer from "puppeteer-core"; import { join } from "node:path"; import { homedir } from "node:os";
const [, , aba, saida, w = "1440", h = "900"] = process.argv;
const [nome, ...resto] = (process.env.COOKIE || "").split("=");
const b = await puppeteer.launch({ executablePath: join(homedir(), "AppData/Local/Google/Chrome/Application/chrome.exe"), headless: "new" });
const p = await b.newPage(); await p.setViewport({ width: Number(w), height: Number(h), isMobile: Number(w) < 700, hasTouch: Number(w) < 700, deviceScaleFactor: Number(w) < 700 ? 2 : 1 });
await p.setCookie({ name: nome, value: resto.join("="), domain: "localhost", path: "/" });
await p.goto("http://localhost:3100/", { waitUntil: "networkidle2" }); await new Promise(r => setTimeout(r, 1500));
if (aba) await p.evaluate(t => { const el = [...document.querySelectorAll("button,a")].find(x => x.textContent.trim() === t || x.getAttribute("aria-label") === t); el && el.click(); }, aba);
await new Promise(r => setTimeout(r, 2500));
await p.screenshot({ path: saida }); await b.close(); console.log("ok", saida);
