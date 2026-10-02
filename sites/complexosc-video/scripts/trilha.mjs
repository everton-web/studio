// Trilha original, composta por síntese em código (sem amostras, sem música de terceiros).
// 84 BPM, 42 tempos = 30,0 s exatos. As mudanças de acorde caem nos cortes das cenas (ver src/tempo.ts).
// Saída: public/trilha.wav, estéreo, 48 kHz, 16 bits com dither.
import fs from 'node:fs';

const SR = 48000;
const BPM = 84;
const BEAT = 60 / BPM; // 0,714 s
const DUR = 30;
const N = SR * DUR;
const L = new Float32Array(N);
const R = new Float32Array(N);
// barramentos separados para o eco e o reverb
const sendRevL = new Float32Array(N), sendRevR = new Float32Array(N);
const sendEcoL = new Float32Array(N), sendEcoR = new Float32Array(N);

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const TAU = Math.PI * 2;

// Cortes em tempos (mesma tabela do vídeo)
const CORTES = [0, 4, 7, 12, 17, 22, 28, 34, 38, 42];
const C = {pad: [52, 55, 59, 64], baixo: 36, arp: [64, 67, 71, 72, 76]};       // Cmaj7
const Am = {pad: [55, 59, 60, 64], baixo: 45, arp: [69, 71, 72, 76, 79]};      // Am9
const F = {pad: [53, 57, 60, 64], baixo: 41, arp: [65, 69, 72, 76, 77]};       // Fmaj7
const G = {pad: [55, 59, 62, 64], baixo: 43, arp: [67, 71, 74, 76, 79]};       // G6
const ACORDES = [C, Am, F, G, C, Am, F, G, C];

// ---------- vozes ----------
function pad(t0, t1, notas, ganho) {
  const atk = 1.1, rel = 1.8;
  const i0 = Math.max(0, Math.floor(t0 * SR)), i1 = Math.min(N, Math.floor((t1 + rel) * SR));
  const vozes = [];
  for (const n of notas) for (const [cent, pan] of [[-5, 0.25], [5, 0.75]]) {
    vozes.push({f: mtof(n) * Math.pow(2, cent / 1200), pan, fase: Math.random() * TAU});
  }
  const harm = [1, 0.32, 0.14, 0.06, 0.025];
  for (let i = i0; i < i1; i++) {
    const t = i / SR, lt = t - t0;
    let env = Math.min(1, lt / atk);
    env = env * env * (3 - 2 * env);
    if (t > t1) env *= Math.max(0, 1 - (t - t1) / rel);
    if (env <= 0) continue;
    const trem = 1 + 0.06 * Math.sin(TAU * 0.23 * t);
    let sl = 0, sr = 0;
    for (const v of vozes) {
      let s = 0;
      for (let h = 0; h < harm.length; h++) s += harm[h] * Math.sin(v.fase + TAU * v.f * (h + 1) * lt);
      sl += s * (1 - v.pan); sr += s * v.pan;
    }
    const g = ganho * env * trem / vozes.length;
    L[i] += sl * g; R[i] += sr * g;
    sendRevL[i] += sl * g * 0.5; sendRevR[i] += sr * g * 0.5;
  }
}

function piano(t0, nota, vel, pan = 0.5, eco = 0.35) {
  const f = mtof(nota);
  const dur = 3.2;
  const i0 = Math.floor(t0 * SR), i1 = Math.min(N, i0 + Math.floor(dur * SR));
  const B = 0.0004; // leve inarmonicidade
  const parc = [1, 2, 3, 4, 5, 6].map(k => ({k, fk: f * k * Math.sqrt(1 + B * k * k), a: [1, 0.45, 0.22, 0.12, 0.06, 0.03][k - 1], d: 1.6 / (1 + 0.9 * (k - 1))}));
  for (let i = i0; i < i1; i++) {
    const lt = (i - i0) / SR;
    const atk = Math.min(1, lt / 0.006);
    let s = 0;
    for (const p of parc) s += p.a * Math.exp(-lt / p.d) * Math.sin(TAU * p.fk * lt);
    s *= atk * vel * 0.22;
    // martelo: um toque de ruído filtrado bem curto
    if (lt < 0.012) s += (Math.random() * 2 - 1) * 0.015 * vel * (1 - lt / 0.012);
    const sl = s * (1 - pan) * 1.4, sr = s * pan * 1.4;
    L[i] += sl; R[i] += sr;
    sendRevL[i] += sl * 0.7; sendRevR[i] += sr * 0.7;
    sendEcoL[i] += sl * eco; sendEcoR[i] += sr * eco;
  }
}

function baixo(t0, t1, nota, ganho) {
  const f = mtof(nota);
  const i0 = Math.floor(t0 * SR), i1 = Math.min(N, Math.floor((t1 + 0.9) * SR));
  for (let i = i0; i < i1; i++) {
    const t = i / SR, lt = t - t0;
    let env = Math.min(1, lt / 0.25);
    if (t > t1) env *= Math.max(0, 1 - (t - t1) / 0.9);
    const s = Math.sin(TAU * f * lt) + 0.35 * Math.sin(TAU * 2 * f * lt) + 0.12 * Math.sin(TAU * 3 * f * lt);
    L[i] += s * env * ganho; R[i] += s * env * ganho;
  }
}

function pulso(t0, vel) {
  // batida suave: senoide com queda de afinação, sem clique
  const i0 = Math.floor(t0 * SR), i1 = Math.min(N, i0 + Math.floor(0.45 * SR));
  let fase = 0;
  for (let i = i0; i < i1; i++) {
    const lt = (i - i0) / SR;
    const f = 48 + 60 * Math.exp(-lt / 0.03);
    fase += TAU * f / SR;
    const env = Math.min(1, lt / 0.004) * Math.exp(-lt / 0.13);
    const s = Math.sin(fase) * env * vel;
    L[i] += s; R[i] += s;
  }
}

function brilho(t0, vel) {
  // contratempo: ruído bem filtrado, quase um sopro (shaker discreto)
  const i0 = Math.floor(t0 * SR), i1 = Math.min(N, i0 + Math.floor(0.09 * SR));
  let lp = 0, hp = 0, prev = 0;
  for (let i = i0; i < i1; i++) {
    const lt = (i - i0) / SR;
    const n = Math.random() * 2 - 1;
    lp += 0.35 * (n - lp);
    hp = lp - prev; prev = lp;
    const env = Math.min(1, lt / 0.01) * Math.exp(-lt / 0.03);
    const s = hp * env * vel;
    L[i] += s * 0.8; R[i] += s * 1.2;
    sendRevL[i] += s * 0.3; sendRevR[i] += s * 0.3;
  }
}

// ---------- composição ----------
const tb = b => b * BEAT;
// semente fixa para que a trilha seja sempre a mesma
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
Math.random = rnd;

for (let c = 0; c < ACORDES.length; c++) {
  const a = ACORDES[c], b0 = CORTES[c], b1 = CORTES[c + 1];
  const ult = c === ACORDES.length - 1;
  pad(tb(b0), ult ? DUR - 1.2 : tb(b1), a.pad, ult ? 0.2 : 0.17);
  if (c > 0) baixo(tb(b0), ult ? DUR - 1.4 : tb(b1), a.baixo, 0.11);

  // acento no corte: nota mais alta do acorde dobrada em oitava
  const topo = a.arp[a.arp.length - 1];
  piano(tb(b0), topo, c === 0 ? 0.55 : 0.7, 0.5, 0.45);
  piano(tb(b0) + 0.012, topo - 12, 0.4, 0.45, 0.3);

  // arpejo em colcheias, esparso, com variação por cena
  const padrao = [[1, 0.28], [3, 0.24], [4, 0.3], [6, 0.22], [7, 0.18]];
  for (let beat = b0; beat < b1; beat += 2) {
    for (const [col, v] of padrao) {
      const pos = beat + col * 0.5;
      if (pos >= b1 || (ult && pos > 41)) continue;
      if (c === 0 && pos < 1.5) continue; // abertura respira
      const nota = a.arp[Math.floor(rnd() * a.arp.length)];
      piano(tb(pos), nota, v * (0.85 + rnd() * 0.3), 0.25 + rnd() * 0.5);
    }
  }
}

// pulso discreto entre o segundo corte e o último bloco
for (let b = 4; b < 38; b++) {
  const forte = (b - 4) % 2 === 0;
  pulso(tb(b), forte ? 0.16 : 0.09);
  if (b >= 12) brilho(tb(b + 0.5), 0.06);
}
// no bloco dos 4 passos (tempos 22 a 28) cada passo ganha uma nota: 22; 23,5; 25; 26,5
for (const [k, pos] of [22, 23.5, 25, 26.5].entries()) piano(tb(pos), [76, 79, 81, 84][k], 0.42, 0.35 + k * 0.1, 0.5);
// final: acorde de piano aberto que fica soando
for (const [k, n] of [48, 55, 64, 71, 76].entries()) piano(tb(38) + k * 0.05, n, 0.45, 0.3 + k * 0.1, 0.4);

// ---------- eco ping-pong (3/4 de tempo) ----------
{
  const d = Math.floor(tb(0.75) * SR), fb = 0.38;
  const bl = new Float32Array(N), br = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const inL = sendEcoL[i], inR = sendEcoR[i];
    const dl = i >= d ? br[i - d] : 0, dr = i >= d ? bl[i - d] : 0;
    bl[i] = inR + dl * fb; // cruzado: pinga de um lado para o outro
    br[i] = inL + dr * fb;
    L[i] += (i >= d ? bl[i - d] : 0) * 0.5;
    R[i] += (i >= d ? br[i - d] : 0) * 0.5;
    sendRevL[i] += (i >= d ? bl[i - d] : 0) * 0.3;
    sendRevR[i] += (i >= d ? br[i - d] : 0) * 0.3;
  }
}

// ---------- reverb (combs com amortecimento + allpass, estilo Freeverb) ----------
function reverb(inp, desloc) {
  const out = new Float32Array(N);
  const combs = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116].map(x => Math.floor((x + desloc) * SR / 44100));
  const aps = [556, 441, 341, 225].map(x => Math.floor((x + desloc) * SR / 44100));
  const fb = 0.86, damp = 0.32;
  for (const len of combs) {
    const buf = new Float32Array(len);
    let idx = 0, filt = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[idx];
      filt = y * (1 - damp) + filt * damp;
      buf[idx] = inp[i] * 0.015 + filt * fb;
      out[i] += y;
      idx = (idx + 1) % len;
    }
  }
  for (const len of aps) {
    const buf = new Float32Array(len);
    let idx = 0;
    for (let i = 0; i < N; i++) {
      const b = buf[idx];
      const x = out[i];
      out[i] = -x + b;
      buf[idx] = x + b * 0.5;
      idx = (idx + 1) % len;
    }
  }
  return out;
}
const revL = reverb(sendRevL, 0), revR = reverb(sendRevR, 23);
for (let i = 0; i < N; i++) { L[i] += revL[i] * 0.9; R[i] += revR[i] * 0.9; }

// ---------- passa-altas suave (corta subgrave inútil) e fades ----------
for (const ch of [L, R]) {
  let px = 0, py = 0;
  const a = 1 / (1 + TAU * 28 / SR);
  for (let i = 0; i < N; i++) { const y = a * (py + ch[i] - px); px = ch[i]; py = y; ch[i] = y; }
}
const fadeIn = 0.5 * SR, fadeOut = 2.6 * SR;
for (let i = 0; i < N; i++) {
  let g = 1;
  if (i < fadeIn) g *= Math.sin((i / fadeIn) * Math.PI / 2);
  if (i > N - fadeOut) g *= Math.cos(((i - (N - fadeOut)) / fadeOut) * Math.PI / 2);
  L[i] *= g; R[i] *= g;
}

// ---------- normalização a -1 dBFS com saturação muito leve ----------
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
const alvo = Math.pow(10, -1 / 20);
const k = alvo / pico;
let rms = 0, picoFinal = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * k * 1.05) / Math.tanh(1.05);
  R[i] = Math.tanh(R[i] * k * 1.05) / Math.tanh(1.05);
  L[i] *= alvo; R[i] *= alvo;
  rms += L[i] * L[i] + R[i] * R[i];
  picoFinal = Math.max(picoFinal, Math.abs(L[i]), Math.abs(R[i]));
}
rms = Math.sqrt(rms / (2 * N));

// ---------- WAV 16 bits ----------
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const d = () => (rnd() - rnd()) / 32768; // dither TPDF
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((L[i] + d()) * 32767))), 44 + i * 4);
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((R[i] + d()) * 32767))), 46 + i * 4);
}
fs.writeFileSync(new URL('../public/trilha.wav', import.meta.url), buf);
console.log(`trilha.wav ok: ${DUR}s, pico ${(20 * Math.log10(picoFinal)).toFixed(2)} dBFS, RMS ${(20 * Math.log10(rms)).toFixed(1)} dBFS`);
