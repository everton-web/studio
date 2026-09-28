// Junta várias capturas numa folha de contato (grade) para revisão rápida.
// Uso: node folha.mjs <pasta> <prefixo> <colunas> <largura-cada> <saida.png>
import { createRequire } from "node:module";
const sharp = createRequire(import.meta.url)("D:/studio/apps/site/node_modules/sharp");
import { readdir } from "node:fs/promises";
import { join } from "node:path";
const [, , pasta, prefixo, colunas = "3", largura = "440", saida] = process.argv;
const arquivos = (await readdir(pasta)).filter((f) => f.startsWith(prefixo) && f.endsWith(".png")).sort();
const L = Number(largura), C = Number(colunas), gap = 12;
const imgs = await Promise.all(arquivos.map((f) => sharp(join(pasta, f)).resize(L).png().toBuffer({ resolveWithObject: true })));
const H = Math.max(...imgs.map((i) => i.info.height));
const linhas = Math.ceil(imgs.length / C);
const comp = imgs.map((img, k) => ({ input: img.data, left: (k % C) * (L + gap) + gap, top: Math.floor(k / C) * (H + gap) + gap }));
await sharp({ create: { width: C * (L + gap) + gap, height: linhas * (H + gap) + gap, channels: 3, background: "#6b6b6b" } }).composite(comp).png().toFile(saida);
console.log("folha:", saida, imgs.length, "telas");
