// QA: preenche o formulário da releitura Mello com ?demo=1 e fotografa o card da qualificação.
import puppeteer from "puppeteer-core";
import { homedir } from "node:os";
const CHROME = process.env.CHROME || homedir() + "/AppData/Local/Google/Chrome/Application/chrome.exe";
const [url, out] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
for (const [nome, vp] of [["desktop", { width: 1440, height: 900 }], ["celular", { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const p = await b.newPage(); await p.setViewport(vp);
  await p.goto(url, { waitUntil: "networkidle2" });
  await p.evaluate(() => document.querySelector("#formulario").scrollIntoView());
  await new Promise(r => setTimeout(r, 1500));
  await p.type('[name="name"]', "Ana Souza"); await p.type('[name="phone"]', "71999990000");
  await p.click(".lead-submit"); await new Promise(r => setTimeout(r, 900));
  await p.type('[name="instagram"]', "@odontosorriso");
  for (const sel of ['[name="revenue"]', '[name="traffic"]']) {
    const el = await p.$(sel);
    if (el && (await el.evaluate(e => e.tagName)) === "SELECT") await p.select(sel, await el.evaluate(e => e.options[e.options.length - 2].value));
    else { const opts = await p.$$(`input${sel}`); if (opts.length) await opts[Math.min(2, opts.length - 1)].evaluate(e => e.click()); }
  }
  await p.click(".lead-submit");
  await p.waitForSelector(".qual-card", { timeout: 20000 }); await new Promise(r => setTimeout(r, 2500));
  await p.evaluate(() => document.querySelector(".lead-card").scrollIntoView({ block: "center" })); await new Promise(r => setTimeout(r, 800));
  const card = await p.$(".lead-card"); await card.screenshot({ path: `${out}-${nome}.png` });
  await p.close();
}
await b.close(); console.log("ok");
