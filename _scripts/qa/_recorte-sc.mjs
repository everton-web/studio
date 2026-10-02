// recortes do site atual do Complexo SC para o relatório detalhado (webp <= ~120 KB)
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const REF = "D:/studio/design/clientes/stetic-class/ref/";
const OUT = "D:/studio/apps/site/public/relatorio-detalhado/stetic-class/";
const jobs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const b = await puppeteer.launch({ executablePath: process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe", headless: "new" });
const p = await b.newPage();
await p.setContent("<html><body></body></html>");
const files = [...new Set(jobs.flatMap((j) => j.parts.map((x) => x.f)))];
for (const f of files) {
  const d = "data:image/png;base64," + fs.readFileSync(REF + f).toString("base64");
  await p.evaluate(async (k, d) => { window.imgs = window.imgs || {}; const i = new Image(); i.src = d; await i.decode(); window.imgs[k] = i; }, f, d);
}
for (const j of jobs) {
  let q = 0.86, data;
  for (;;) {
    data = await p.evaluate((j, q) => {
      // layout: "row" (lado a lado) ou "col" (empilhado); cada parte com box [x,y,w,h] e escala
      const parts = j.parts.map((pt) => ({ ...pt, w: Math.round(pt.box[2] * (pt.s || 1)), h: Math.round(pt.box[3] * (pt.s || 1)) }));
      const gap = j.gap || 0, pad = j.pad || 0;
      let W, H;
      if (j.layout === "row") { W = parts.reduce((a, x) => a + x.w, 0) + gap * (parts.length - 1) + pad * 2; H = Math.max(...parts.map((x) => x.h)) + pad * 2; }
      else { W = Math.max(...parts.map((x) => x.w)) + pad * 2; H = parts.reduce((a, x) => a + x.h, 0) + gap * (parts.length - 1) + pad * 2; }
      const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
      x.fillStyle = j.bg || "#1a0609"; x.fillRect(0, 0, W, H); x.imageSmoothingQuality = "high";
      let o = pad;
      for (const pt of parts) {
        const i = window.imgs[pt.f]; const [X, Y, w, h] = pt.box;
        if (j.layout === "row") { x.drawImage(i, X, Y, w, h, o, pad + (H - pad * 2 - pt.h) / 2, pt.w, pt.h); o += pt.w + gap; }
        else { x.drawImage(i, X, Y, w, h, pad + (W - pad * 2 - pt.w) / 2, o, pt.w, pt.h); o += pt.h + gap; }
      }
      return [c.toDataURL("image/webp", q).split(",")[1], W, H];
    }, j, q);
    const buf = Buffer.from(data[0], "base64");
    if (buf.length <= 120 * 1024 || q <= 0.5) { fs.writeFileSync(OUT + j.name + ".webp", buf); console.log(j.name, data[1] + "x" + data[2], Math.round(buf.length / 1024) + "KB", "q" + q.toFixed(2)); break; }
    q -= 0.06;
  }
}
await b.close();
