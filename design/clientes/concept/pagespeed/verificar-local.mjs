import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';

const require = createRequire('D:/studio/_scripts/qa/package.json');
const out = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const base = process.env.CONCEPT_QA_URL || 'http://127.0.0.1:3215';
const stage = process.env.CONCEPT_QA_STAGE || 'depois';
if (!['antes', 'depois'].includes(stage)) throw new Error(`Etapa invalida: ${stage}`);
const stageDir = path.join(out, stage);
const prints = path.join(stageDir, 'prints');
await fs.mkdir(prints, { recursive: true });
const save = (file, data) => fs.writeFile(path.join(stageDir, file), JSON.stringify(data, null, 2));

const response = await fetch(base);
const html = await response.text();
const scriptTags = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/g)];
const scripts = [...new Set(scriptTags.filter(m => !/nomodule/i.test(m[0])).map(m => m[1]))];
const fontLinks = [...html.matchAll(/href="([^" ]+\.woff2(?:\?[^" ]*)?)"/g)].map(m => m[1]);
const css = [...new Set([...html.matchAll(/href="([^" ]+\.css)"/g)].map(m => m[1]))];
for (const url of css) {
  const text = await (await fetch(new URL(url, base))).text();
  for (const m of text.matchAll(/url\(([^)]+\.woff2)\)/g)) fontLinks.push(new URL(m[1].replaceAll('"', ''), new URL(url, base)).pathname);
}
const fonts = [...new Set(fontLinks)];
const image = '/_next/image?url=%2Fhero%2Fsorrisos%2Ffacetas-lateral.webp&w=640&q=75';
const assets = [];
for (const url of [...scripts, ...fonts, ...css, '/marca/logo-concept.png', '/videos/depoimento-nadia-poster.webp', ...(image ? [image] : [])]) {
  const r = await fetch(new URL(url, base), { headers: { Accept: 'image/avif,image/webp,*/*' } });
  const bytes = Buffer.from(await r.arrayBuffer());
  assets.push({ url, status: r.status, bytes: bytes.length, gzipBytes: gzipSync(bytes).length, cacheControl: r.headers.get('cache-control'), contentType: r.headers.get('content-type') });
}
const checks = {
  status: response.status,
  htmlBytes: Buffer.byteLength(html),
  htmlGzipBytes: gzipSync(html).length,
  htmlCacheControl: response.headers.get('cache-control'),
  imageElements: [...html.matchAll(/<img\s/g)].length,
  initialScripts: scripts.length,
  ignoredNoModuleScripts: scriptTags.filter(m => /nomodule/i.test(m[0])).map(m => m[1]),
  initialJsBytes: assets.filter(a => scripts.includes(a.url)).reduce((n, a) => n + a.bytes, 0),
  initialJsGzipBytes: assets.filter(a => scripts.includes(a.url)).reduce((n, a) => n + a.gzipBytes, 0),
  instagram: html.includes('@concept.implantesdentarios') && html.includes('https://www.instagram.com/concept.implantesdentarios/'),
  gtm: html.includes('GTM-M9GM99DS'),
  pixel: html.includes('https://app.evertonbrito.com/api/t?site=conceptimplantesdentarios.com.br'),
  methodListDirectLi: /<ol class="space-y-4"><li/.test(html),
  allImagesHaveSizes: [...html.matchAll(/<img\s[^>]*>/g)].every(m => /sizes=/.test(m[0])),
  heroHighPriorityImage: /<img\s[^>]*fetchpriority="high"/i.test(html),
  optimizedHeroBackgrounds: [...new Set(
    [...html.matchAll(/background-image:url\(&quot;([^&]+(?:&amp;[^&]+)*)&quot;\)/g)].map(m => m[1])
  )].length,
  requiredSections: ['sobre', 'especialidades', 'sorrisos', 'agendar', 'localizacao', 'faq'].every(id => html.includes(`id="${id}"`)),
  footer: html.includes('<footer'),
  assets,
};
await save('http-build-local.json', { generatedAt: new Date().toISOString(), url: base, kind: 'HTTP checks, not Lighthouse scores', ...checks });
console.log(JSON.stringify(checks, null, 2));

let browser;
let connectedBrowser = false;
const visual = { url: base, generatedAt: new Date().toISOString(), viewports: [], errors: [] };
try {
  const puppeteer = require('puppeteer-core');
  if (process.env.CONCEPT_CDP_URL) {
    browser = await puppeteer.connect({ browserURL: process.env.CONCEPT_CDP_URL });
    connectedBrowser = true;
  } else {
    browser = await puppeteer.launch({ executablePath: 'C:/Users/evert/AppData/Local/Google/Chrome/Application/chrome.exe', headless: true, timeout: 15000, userDataDir: path.join(out, '.chrome-qa'), args: ['--hide-scrollbars', '--no-first-run'] });
  }
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewport({ width, height, isMobile: width < 700, hasTouch: width < 700, deviceScaleFactor: 1 });
    await page.goto(base, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(prints, `${name}-${width}-hero.png`) });
    for (const [label, selector] of [['sobre', '#sobre'], ['especialidades', '#especialidades'], ['resultados', '#sorrisos'], ['rodape', 'footer']]) {
      await page.$eval(selector, el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
      await page.waitForFunction(selector => { const e = document.querySelector(selector); return e && e.getBoundingClientRect().top < innerHeight; }, {}, selector);
      await page.screenshot({ path: path.join(prints, `${name}-${width}-${label}.png`) });
    }
    const metrics = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, instagram: document.querySelector('footer a[href*="instagram"]')?.textContent.trim(), imagesBroken: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.src) }));
    await page.$eval('main button', el => el.click());
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    await page.screenshot({ path: path.join(prints, `${name}-${width}-formulario.png`) });
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"]', { hidden: true });
    visual.viewports.push({ name, width, height, ...metrics, errors, modalOpenClose: true });
    await page.close();
  }
} catch (e) {
  visual.errors.push({ name: e.name, message: e.message, code: e.code });
  console.error('QA visual indisponível:', e.message);
} finally {
  if (browser) {
    if (connectedBrowser) await browser.disconnect();
    else await browser.close();
  }
  await save('qa-visual.json', visual);
}
