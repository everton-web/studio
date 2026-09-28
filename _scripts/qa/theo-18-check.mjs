import puppeteer from "puppeteer-core";
import { join } from "node:path";
import { homedir } from "node:os";

const b = await puppeteer.launch({
  executablePath: join(homedir(), "AppData/Local/Google/Chrome/Application/chrome.exe"),
  headless: "new",
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3010/", { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 2500));

// 1) Hero cabe em 900px
const hero = await p.evaluate(() => {
  const h1 = document.querySelector("#hero h1");
  const heroSec = document.querySelector("#hero");
  const btn = document.querySelector("#hero a[href='#contact'], #hero button, #hero .rounded-full");
  const r = h1.getBoundingClientRect();
  return {
    h1bottom: Math.round(r.bottom),
    h1height: Math.round(r.height),
    heroBottom: Math.round(heroSec.getBoundingClientRect().bottom),
    btnBottom: btn ? Math.round(btn.getBoundingClientRect().bottom) : null,
    scrollHintBottom: Math.round(document.querySelector("#hero > div:last-child")?.getBoundingClientRect().bottom ?? 0),
  };
});
console.log("HERO:", JSON.stringify(hero));

// 2) torch inicial apagada
const torchInitial = await p.evaluate(() => {
  const grids = [...document.querySelectorAll("div")].filter((d) =>
    (d.getAttribute("style") || "").includes("radial-gradient(circle 220px"),
  );
  return grids.map((g) => getComputedStyle(g).opacity);
});
console.log("TORCH inicial opacity:", JSON.stringify(torchInitial));

// 3) About: opacidade das palavras com a seção centrada vs. recém-entrada
const aboutWords = await p.evaluate(async () => {
  const sec = document.querySelector("#about");
  const words = () =>
    [...sec.querySelectorAll("span.inline-block, span.serif")].filter(
      (x) => x.textContent.trim() && !x.querySelector("span"),
    );
  // centralizar
  sec.scrollIntoView({ block: "center" });
  await new Promise((r) => setTimeout(r, 1500));
  const centered = words().slice(0, 4).map((x) => Number(getComputedStyle(x).opacity).toFixed(2));
  // recém-entrada (topo da seção na base da tela)
  window.scrollTo(0, sec.offsetTop - window.innerHeight + 200);
  await new Promise((r) => setTimeout(r, 800));
  const entering = words().slice(0, 4).map((x) => Number(getComputedStyle(x).opacity).toFixed(2));
  return { centered, entering };
});
console.log("ABOUT palavras (centered):", JSON.stringify(aboutWords.centered));
console.log("ABOUT palavras (entering):", JSON.stringify(aboutWords.entering));

await b.close();
