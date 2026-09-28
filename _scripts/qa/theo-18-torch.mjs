import puppeteer from "puppeteer-core";
import { join } from "node:path";
import { homedir } from "node:os";
const b = await puppeteer.launch({ executablePath: join(homedir(), "AppData/Local/Google/Chrome/Application/chrome.exe"), headless: "new" });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3010/", { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 1500));
const torch = () => p.evaluate(() => {
  const d = [...document.querySelectorAll("div")].find((x) => (x.getAttribute("style") || "").includes("radial-gradient(circle 220px"));
  return d ? getComputedStyle(d).opacity : null;
});
console.log("antes:", await torch());
await p.mouse.move(700, 450);
await new Promise((r) => setTimeout(r, 500));
console.log("apos pointermove:", await torch());
await b.close();
