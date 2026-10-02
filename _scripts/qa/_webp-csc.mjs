// Converte PNG em WebP pelo Chrome (canvas). Uso: node _webp-csc.mjs jobs.json
// jobs: [{ src, out, w?, crop?: [x,y,w,h], q? }]
import puppeteer from "puppeteer-core"; import fs from "node:fs"; import { homedir } from "node:os";
const jobs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const b = await puppeteer.launch({ executablePath: homedir()+"/AppData/Local/Google/Chrome/Application/chrome.exe", headless: "new" });
const p = await b.newPage(); await p.goto("about:blank");
for (const j of jobs) {
  const dataIn = "data:image/png;base64," + fs.readFileSync(j.src).toString("base64");
  const url = await p.evaluate(async (src, j) => {
    const img = new Image(); img.src = src; await img.decode();
    const [cx, cy, cw, ch] = j.crop || [0, 0, img.width, img.height];
    const w = j.w || cw, h = Math.round(ch * w / cw);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(img, cx, cy, cw, ch, 0, 0, w, h);
    return c.toDataURL("image/webp", j.q || 0.8);
  }, dataIn, j);
  fs.writeFileSync(j.out, Buffer.from(url.split(",")[1], "base64"));
  console.log(j.out.split("/").pop(), Math.round(fs.statSync(j.out).size / 1024) + " KB");
}
await b.close();
