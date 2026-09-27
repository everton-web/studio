// tail.mjs — janela de terminal de uma demanda: imprime o log ao vivo e fica aberta.
import { readFileSync } from "node:fs";
const f = process.argv[2];
let last = 0;
const print = () => {
  try { const s = readFileSync(f, "utf8"); process.stdout.write(s.slice(last)); last = s.length; } catch { /* ainda não existe */ }
};
print();
setInterval(print, 1000);