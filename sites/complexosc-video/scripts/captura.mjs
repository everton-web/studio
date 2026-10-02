// Captura o protótipo no ar (celular e desktop) em página inteira, com as animações de entrada já disparadas.
import puppeteer from 'puppeteer-core';
import path from 'node:path';
const URL = 'https://proposta-csc-7k2q.vercel.app';
const chrome = path.resolve('node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe');
const browser = await puppeteer.launch({executablePath: chrome, headless: 'shell', args: ['--hide-scrollbars']});
const alvos = [
  {nome: 'celular', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true},
  {nome: 'desktop', width: 1440, height: 900, deviceScaleFactor: 2},
];
for (const a of alvos) {
  const page = await browser.newPage();
  await page.setViewport(a);
  await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'no-preference'}]);
  await page.goto(URL, {waitUntil: 'networkidle2', timeout: 90000});
  await new Promise(r => setTimeout(r, 2500));
  // primeira dobra, exatamente como abre
  await page.screenshot({path: `public/site/${a.nome}-dobra.png`});
  // percorre a página para disparar reveals e lazy load
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += Math.round(a.height * 0.6)) {
    await page.evaluate(v => window.scrollTo(0, v), y);
    await new Promise(r => setTimeout(r, 450));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1500));
  // limita a altura para não estourar a textura (primeiras ~5 telas)
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const alt = Math.min(total, a.height * 6);
  await page.screenshot({path: `public/site/${a.nome}-longa.png`, clip: {x: 0, y: 0, width: a.width, height: alt}, captureBeyondViewport: true});
  console.log(a.nome, 'altura total', total, 'capturado', alt);
  await page.close();
}
await browser.close();
