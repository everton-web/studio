// render.mjs <arquivo.html> <saida.png> <largura> <altura> : renderiza peça estática em 2x
import puppeteer from "puppeteer-core";
import { pathToFileURL } from "node:url";
const [,, html, out, w, h] = process.argv;
const b = await puppeteer.launch({ executablePath: process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--allow-file-access-from-files"] });
const p = await b.newPage();
await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 2 });
await p.goto(pathToFileURL(html).href, { waitUntil: "networkidle0" });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: out });
await b.close();
