// render-alto.mjs <arquivo.html> <saida.png> <largura> : página inteira em 2x, em fatias (contorna o limite de 16384 px do Chrome) e costura num PNG só
import puppeteer from "puppeteer-core";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
const [,, html, out, w] = process.argv;
const W = +w, SEG = 3000;
const b = await puppeteer.launch({ executablePath: process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--allow-file-access-from-files"] });
const p = await b.newPage();
await p.setViewport({ width: W, height: SEG, deviceScaleFactor: 2 });
await p.goto(pathToFileURL(html).href, { waitUntil: "networkidle0" });
await p.evaluate(() => document.fonts.ready);
const H = await p.evaluate(() => document.documentElement.scrollHeight);
const parts = [];
for (let y = 0; y < H; y += SEG) {
  const h = Math.min(SEG, H - y);
  const buf = await p.screenshot({ clip: { x: 0, y, width: W, height: h }, captureBeyondViewport: true, encoding: "base64" });
  parts.push({ y, h, d: buf });
}
const q = await b.newPage();
await q.setContent("<html></html>");
const png = await q.evaluate(async (parts, W, H) => {
  const c = document.createElement("canvas"); c.width = W * 2; c.height = H * 2; const x = c.getContext("2d");
  for (const pt of parts) { const i = new Image(); i.src = "data:image/png;base64," + pt.d; await i.decode(); x.drawImage(i, 0, pt.y * 2); }
  return c.toDataURL("image/png").split(",")[1];
}, parts, W, H);
fs.writeFileSync(out, Buffer.from(png, "base64"));
console.log("ok", W * 2, "x", H * 2, parts.length, "fatias");
await b.close();
