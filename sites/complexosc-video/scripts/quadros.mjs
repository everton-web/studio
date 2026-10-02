// Renderiza quadros soltos das composições para revisão: node scripts/quadros.mjs Vertical 40,120,200
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const [id, lista, pasta = 'quadros'] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const comp = await selectComposition({serveUrl, id, inputProps: {}});
for (const fr of lista.split(',').map(Number)) {
  const out = path.resolve(pasta, `${id}-${String(fr).padStart(3, '0')}.png`);
  await renderStill({composition: comp, serveUrl, output: out, frame: fr, inputProps: {}});
  console.log(out);
}
