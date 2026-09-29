// _mia-check.mjs — conferência visual programática dos módulos do Behance
// Uso: node _scripts/qa/_mia-check.mjs design/behance/01-capa.html 1400 1400
import puppeteer from "puppeteer-core";
import { pathToFileURL } from "node:url";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const CHROME = process.env.CHROME || join(homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe");
const alvos = [
  ["design/behance/01-capa.html", 1400],
  ["design/behance/02-contexto.html", 1330],
  ["design/behance/03-marca.html", 1200],
  ["design/behance/04-cor.html", 1200],
  ["design/behance/05-tipografia.html", 1200],
  ["design/behance/06-componentes.html", 1400],
  ["design/behance/07-movimento.html", 1200],
  ["design/behance/08-paginas.html", 1500],
  ["design/behance/09-mobile.html", 1300],
  ["design/behance/10-fechamento.html", 1000],
].map(([f, h]) => ({ f: resolve(f), h }));

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--allow-file-access-from-files"] });
for (const { f, h } of alvos) {
  const p = await b.newPage();
  await p.setViewport({ width: 1400, height: h, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(f).href, { waitUntil: "networkidle0" });
  await p.evaluate(() => document.fonts.ready);
  const r = await p.evaluate((altura) => {
    const out = { altura, scrollH: document.documentElement.scrollHeight, scrollW: document.documentElement.scrollWidth,
      inter: document.fonts.check("16px Inter"), imgs: [], fora: [], sobreposicao: [], viuvas: [], laranjaTitulo: [] };

    // imagens
    for (const img of document.images) out.imgs.push({ src: img.getAttribute("src"), nw: img.naturalWidth, w: Math.round(img.getBoundingClientRect().width) });

    // palavras por elemento de texto (para viúva e limites)
    const folhas = [...document.querySelectorAll("h1,h2,h3,h4,p,li,span,b,small,div")].filter((el) => {
      const t = (el.textContent || "").trim();
      if (!t || t.length < 3) return false;
      // só folhas de texto: nenhum filho elemento com texto próprio relevante
      return ![...el.children].some((c) => (c.textContent || "").trim().length > 2);
    });
    const rects = [];
    for (const el of folhas) {
      const r0 = el.getBoundingClientRect();
      if (r0.width === 0 || r0.height === 0) continue;
      rects.push({ el, r: r0 });
      if (r0.left < -1 || r0.right > 1401 || r0.top < -1 || r0.bottom > altura + 1)
        out.fora.push({ tag: el.tagName, cls: el.className.toString().slice(0, 40), txt: el.textContent.trim().slice(0, 40), rect: [Math.round(r0.left), Math.round(r0.top), Math.round(r0.right), Math.round(r0.bottom)] });
      // viúva: palavras por linha
      const palavras = [];
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (tw.nextNode()) {
        const node = tw.currentNode;
        const txt = node.nodeValue || "";
        let m; const re = /\S+/g;
        while ((m = re.exec(txt))) {
          const rg = document.createRange();
          rg.setStart(node, m.index); rg.setEnd(node, m.index + m[0].length);
          const rr = rg.getBoundingClientRect();
          if (rr.width || rr.height) palavras.push({ w: m[0], top: Math.round(rr.top), left: rr.left });
        }
      }
      if (palavras.length >= 3) {
        const linhas = {};
        for (const q of palavras) { const k = Math.round(q.top / 4); (linhas[k] ||= []).push(q); }
        const tops = Object.keys(linhas).map(Number).sort((a, c) => a - c);
        if (tops.length > 1) {
          const ultima = linhas[tops[tops.length - 1]];
          if (ultima.length === 1) out.viuvas.push({ txt: el.textContent.trim().slice(0, 60), palavra: ultima[0].w, linhas: tops.length });
        }
      }
    }
    // sobreposição entre blocos de texto
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], c = rects[j];
      if (a.el.contains(c.el) || c.el.contains(a.el)) continue;
      const ix = Math.min(a.r.right, c.r.right) - Math.max(a.r.left, c.r.left);
      const iy = Math.min(a.r.bottom, c.r.bottom) - Math.max(a.r.top, c.r.top);
      if (ix > 2 && iy > 2) {
        const area = ix * iy, menor = Math.min(a.r.width * a.r.height, c.r.width * c.r.height);
        if (area / menor > 0.2) out.sobreposicao.push({ a: a.el.textContent.trim().slice(0, 30), b: c.el.textContent.trim().slice(0, 30), area: Math.round(area) });
      }
    }
    // uma palavra laranja por título (h4 de seção pode ficar neutro)
    for (const t of document.querySelectorAll("h1,h2,h3,h4")) {
      if (t.tagName === "H4") continue;
      const n = t.querySelectorAll(".acc").length;
      if (t.textContent.trim().length > 3 && n !== 1) out.laranjaTitulo.push({ titulo: t.textContent.trim().slice(0, 50), laranja: n });
    }
    return out;
  }, h);
  const nome = f.split(/[\\/]/).pop();
  console.log(`\n=== ${nome} (altura ${h}) ===`);
  console.log(`scroll ${r.scrollW}x${r.scrollH} · Inter: ${r.inter ? "ok" : "FALTA"} · imagens: ${r.imgs.map((i) => `${i.src}(${i.nw})`).join(", ") || "nenhuma"}`);
  console.log(`fora da moldura: ${r.fora.length ? JSON.stringify(r.fora) : "nada"}`);
  console.log(`sobreposição de texto: ${r.sobreposicao.length ? JSON.stringify(r.sobreposicao.slice(0, 6)) : "nada"}`);
  console.log(`viúvas: ${r.viuvas.length ? JSON.stringify(r.viuvas.slice(0, 6)) : "nada"}`);
  console.log(`títulos fora da regra de 1 laranja: ${r.laranjaTitulo.length ? JSON.stringify(r.laranjaTitulo) : "nada"}`);
  await p.close();
}
await b.close();
