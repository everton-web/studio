// Folha de contato via chrome-headless-shell do Remotion.
// uso: node folha.mjs saida.png colunas larguraCelula alturaCelula img1 img2 ...  (rótulo = nome do arquivo)
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const [out, cols, cw, ch, ...imgs] = process.argv.slice(2);
const C = +cols, W = +cw, H = +ch, gap = 12, lab = 22;
const rows = Math.ceil(imgs.length / C);
const tw = C * W + (C + 1) * gap, th = rows * (H + lab) + (rows + 1) * gap;
const cells = imgs.map(f => `<figure><img src="${pathToFileURL(path.resolve(f)).href}"><figcaption>${path.basename(f)}</figcaption></figure>`).join('');
const html = `<!doctype html><meta charset=utf-8><style>*{margin:0}body{background:#6b6b6b;width:${tw}px;height:${th}px;display:grid;grid-template-columns:repeat(${C},${W}px);gap:${gap}px;padding:${gap}px;box-sizing:border-box;font:13px system-ui;color:#fff}figure{width:${W}px}img{width:${W}px;height:${H}px;object-fit:contain;background:#222;display:block}figcaption{height:${lab}px;line-height:${lab}px;overflow:hidden}</style>${cells}`;
const tmp = path.join(path.dirname(path.resolve(out)), '_folha.html');
fs.writeFileSync(tmp, html);
const chrome = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), 'node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe');
execFileSync(chrome, ['--headless', '--disable-gpu', '--allow-file-access-from-files', `--screenshot=${path.resolve(out)}`, `--window-size=${tw},${th}`, '--hide-scrollbars', '--virtual-time-budget=4000', pathToFileURL(tmp).href], {stdio: 'ignore'});
fs.unlinkSync(tmp);
console.log('ok', out, tw + 'x' + th);
