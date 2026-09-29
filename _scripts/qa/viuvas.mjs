// viuvas.mjs <url> [larguras] : lista textos cuja última linha tem uma palavra só (viúva).
// Mede a posição de cada palavra renderizada; roda em várias larguras de tela.
import puppeteer from "puppeteer-core";
const url = process.argv[2] || "https://evertonbrito.com";
const larguras = (process.argv[3] || "1920,1440,1024,768,390").split(",").map(Number);
const b = await puppeteer.launch({ executablePath: process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe", headless: "new" });
const p = await b.newPage();
const achados = new Map();
for (const w of larguras) {
  await p.setViewport({ width: w, height: 900, isMobile: w < 500, hasTouch: w < 500 });
  await p.goto(url + (url.includes("?") ? "&" : "?") + "v=" + Date.now(), { waitUntil: "networkidle0" });
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); });
  await new Promise(r => setTimeout(r, 2500));
  const lista = await p.evaluate(() => {
    const out = [];
    const els = document.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,figcaption,label,span.block");
    for (const el of els) {
      if (el.closest("[aria-hidden=true]") || !el.offsetParent) continue;
      const txt = el.innerText.trim();
      if (txt.split(/\s+/).length < 2) continue;
      // coleta a linha (top) de cada palavra
      const tops = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n; while ((n = walker.nextNode())) {
        const re = /\S+/g; let m;
        while ((m = re.exec(n.data))) {
          const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
          const rect = r.getClientRects()[0]; if (rect && rect.width) tops.push({ t: Math.round(rect.top), w: m[0] });
        }
      }
      if (tops.length < 2) continue;
      const linhas = []; for (const x of tops) { const l = linhas.find(l => Math.abs(l.t - x.t) < 6); l ? l.ws.push(x.w) : linhas.push({ t: x.t, ws: [x.w] }); }
      linhas.sort((a, b) => a.t - b.t);
      if (linhas.length >= 2 && linhas[linhas.length - 1].ws.length === 1) out.push({ tag: el.tagName, txt: txt.replace(/\s+/g, " ").slice(0, 110), ult: linhas[linhas.length - 1].ws[0] });
    }
    return out;
  });
  for (const f of lista) { const k = f.tag + "|" + f.txt; const e = achados.get(k) || { ...f, telas: [] }; e.telas.push(w); achados.set(k, e); }
}
await b.close();
if (!achados.size) console.log("Nenhuma viúva encontrada."); 
for (const f of achados.values()) console.log(`[${f.tag}] "${f.txt}" → sobra "${f.ult}" em ${f.telas.join(", ")}px`);
