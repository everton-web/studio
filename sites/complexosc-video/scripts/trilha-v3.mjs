// Trilha v3 do Complexo SC, sintetizada integralmente em Node, sem samples externos.
// Grade do video: 100 BPM, 30 fps, 18 quadros por tempo, duracao de 30 segundos.
// Impactos principais: lema 1,20 s, equipe 5,40 s, cirurgia 15,60 s e site 26,40 s.
// Saida: WAV estereo, 48 kHz, 16 bits em design/clientes/stetic-class/video/trilha-v3.wav.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SR = 48000;
const BPM = 100;
const BEAT = 60 / BPM;
const DUR = 30;
const N = SR * DUR;
const TAU = Math.PI * 2;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(ROOT, 'design', 'clientes', 'stetic-class', 'video', 'trilha-v3.wav');
const tb = beats => beats * BEAT;
const mtof = midi => 440 * 2 ** ((midi - 69) / 12);

let seed = 20261003;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const noise = () => rnd() * 2 - 1;
const bus = () => [new Float64Array(N), new Float64Array(N)];
const padBus = bus();
const tonalBus = bus();
const impactBus = bus();
const fxBus = bus();
const roomBus = bus();
const sidechainEvents = [];
const put = (target, index, left, right) => {
  if (index >= 0 && index < N) {
    target[0][index] += left;
    target[1][index] += right;
  }
};

function svf() {
  let ic1 = 0;
  let ic2 = 0;
  return (input, frequency, q = 0.8) => {
    const cutoff = Math.max(20, Math.min(frequency, SR * 0.44));
    const g = Math.tan(Math.PI * cutoff / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = input - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    return {lp: v2, bp: v1, hp: input - k * v1 - v2};
  };
}

function pad(t0, t1, notes, gain, {attack = 0.45, release = 0.5, air = 0.05} = {}) {
  const start = Math.round(t0 * SR);
  const end = Math.min(N, Math.round((t1 + release) * SR));
  const voices = [];
  for (const note of notes) {
    for (const [cents, pan] of [[-7, 0.18], [7, 0.82]]) {
      voices.push({frequency: mtof(note) * 2 ** (cents / 1200), phase: rnd() * TAU, pan});
    }
  }
  for (let i = start; i < end; i++) {
    const local = i / SR - t0;
    let envelope = Math.min(1, local / attack);
    if (i / SR > t1) envelope *= Math.max(0, 1 - (i / SR - t1) / release);
    let left = 0;
    let right = 0;
    for (const voice of voices) {
      const phase = voice.phase + TAU * voice.frequency * local;
      const sample = Math.sin(phase) + 0.26 * Math.sin(phase * 2) + air * Math.sin(phase * 4);
      left += sample * (1 - voice.pan);
      right += sample * voice.pan;
    }
    const amount = gain * envelope / voices.length * 2.1;
    put(padBus, i, left * amount, right * amount);
  }
}

function bassPulse(t, midi, gain = 1, duration = 0.34) {
  const start = Math.round(t * SR);
  const length = Math.round((duration + 0.08) * SR);
  const frequency = mtof(midi);
  for (let j = 0; j < length; j++) {
    const local = j / SR;
    let envelope = Math.min(1, local / 0.004) * Math.exp(-local / duration);
    if (local > duration) envelope *= Math.max(0, 1 - (local - duration) / 0.08);
    const phase = TAU * frequency * local;
    const body = Math.sin(phase) * 0.66 + Math.sin(phase * 2) * 0.5 + Math.sin(phase * 3) * 0.2;
    const sample = Math.tanh(body * 1.15) * envelope * gain * 0.3;
    put(tonalBus, start + j, sample, sample);
  }
}

function brandTone(t, midi, gain = 1, pan = 0.5, lengthSeconds = 1.0) {
  const start = Math.round(t * SR);
  const length = Math.round(lengthSeconds * SR);
  const frequency = mtof(midi);
  for (let j = 0; j < length; j++) {
    const local = j / SR;
    const envelope = Math.min(1, local / 0.003) * Math.exp(-local / (lengthSeconds * 0.28));
    let sample = 0;
    for (const [harmonic, level] of [[1, 1], [2, 0.42], [3, 0.26], [5, 0.12], [7, 0.06]]) {
      sample += Math.sin(TAU * frequency * harmonic * local) * level * Math.exp(-local * harmonic * 1.2);
    }
    sample *= envelope * gain * 0.19;
    put(tonalBus, start + j, sample * (1.25 - pan), sample * (0.25 + pan));
    put(roomBus, start + j, sample * 0.18, sample * 0.18);
  }
}

function motif(t, gain = 1, final = false) {
  const notes = final ? [72, 76, 79] : [69, 72, 76];
  const spacing = final ? 0.6 : 0.3;
  notes.forEach((note, index) => brandTone(t + index * spacing, note, gain * (1 - index * 0.08), [0.27, 0.72, 0.5][index], final ? 1.65 : 0.9));
}

function uiTick(t, gain = 1, pan = 0.5, pitch = 1) {
  const start = Math.round(t * SR);
  const length = Math.round(0.115 * SR);
  const filter = svf();
  for (let j = 0; j < length; j++) {
    const local = j / SR;
    const envelope = Math.exp(-local / 0.018) * Math.min(1, local / 0.00035);
    const tone = Math.sin(TAU * 2850 * pitch * local) * Math.exp(-local / 0.028);
    const texture = filter(noise(), 3900 * pitch, 1.8).bp;
    const sample = (tone * 0.72 + texture * 0.48) * envelope * gain * 0.18;
    put(fxBus, start + j, sample * (1.3 - pan), sample * (0.3 + pan));
  }
}

function midClick(t, gain = 1, pan = 0.5, pitch = 1) {
  const start = Math.round(t * SR);
  const length = Math.round(0.045 * SR);
  for (let j = 0; j < length; j++) {
    const local = j / SR;
    const envelope = Math.exp(-local / 0.007) * Math.min(1, local / 0.00025);
    const sample = (Math.sin(TAU * 920 * pitch * local) + 0.45 * Math.sin(TAU * 1380 * pitch * local)) * envelope * gain * 0.48;
    put(fxBus, start + j, sample * (1.25 - pan), sample * (0.25 + pan));
  }
}

function softPulse(t, gain = 1) {
  const start = Math.round(t * SR);
  const length = Math.round(0.32 * SR);
  for (let j = 0; j < length; j++) {
    const local = j / SR;
    const frequency = 105 + 35 * Math.exp(-local / 0.025);
    const sample = Math.sin(TAU * frequency * local) * Math.exp(-local / 0.09) * gain * 0.3;
    put(impactBus, start + j, sample, sample);
  }
  sidechainEvents.push({t, depth: 0.35, release: 0.13});
}

function impact(t, strength = 1) {
  const start = Math.round(t * SR);
  const length = Math.round(0.72 * SR);
  const bodyL = svf();
  const bodyR = svf();
  const clickL = svf();
  const clickR = svf();
  let subPhase = 0;
  for (let j = 0; j < length; j++) {
    const local = j / SR;
    const subFrequency = 47 + 22 * Math.exp(-local / 0.035);
    subPhase += TAU * subFrequency / SR;
    const sub = Math.sin(subPhase) * Math.exp(-local / 0.16) * Math.min(1, local / 0.0012) * 0.62;
    const bodyEnvelope = Math.exp(-local / 0.13) * Math.min(1, local / 0.0008);
    const bodyLeft = bodyL(noise(), 165, 1.05).bp * bodyEnvelope * 1.75 + Math.sin(TAU * 128 * local) * Math.exp(-local / 0.11) * 0.52;
    const bodyRight = bodyR(noise(), 178, 1.05).bp * bodyEnvelope * 1.75 + Math.sin(TAU * 136 * local) * Math.exp(-local / 0.11) * 0.52;
    const clickEnvelope = Math.exp(-local / 0.014);
    const clickLeft = clickL(noise(), 3200, 2).bp * clickEnvelope;
    const clickRight = clickR(noise(), 3550, 2).bp * clickEnvelope;
    const airEnvelope = Math.exp(-local / 0.075) * Math.min(1, local / 0.0005);
    const airLeft = local < 0.23 ? clickL(noise(), 9000, 0.65).hp * airEnvelope : 0;
    const airRight = local < 0.23 ? clickR(noise(), 8500, 0.65).hp * airEnvelope : 0;
    const left = (sub + bodyLeft * 0.68 + clickLeft * 0.16 + airLeft * 0.025) * strength;
    const right = (sub + bodyRight * 0.68 + clickRight * 0.16 + airRight * 0.025) * strength;
    put(impactBus, start + j, left, right);
    put(roomBus, start + j, bodyLeft * strength * 0.06, bodyRight * strength * 0.06);
  }
  sidechainEvents.push({t, depth: Math.min(0.68, 0.5 * strength), release: 0.15});
}

function whoosh(t, gain = 1, lead = 0.42, tail = 0.18) {
  const start = Math.round((t - lead) * SR);
  const length = Math.round((lead + tail) * SR);
  const center = Math.round(lead * SR);
  const leftFilter = svf();
  const rightFilter = svf();
  for (let j = 0; j < length; j++) {
    const before = j < center;
    const progress = before ? j / center : (j - center) / Math.max(1, length - center);
    const envelope = before ? progress ** 2.3 : Math.exp(-progress * 5.5);
    const frequency = before ? 320 * (5200 / 320) ** progress : 5200 * (1200 / 5200) ** progress;
    const left = leftFilter(noise(), frequency, 1.5).bp * envelope * gain * 0.3 * (1.15 - j / length);
    const right = rightFilter(noise(), frequency * 1.06, 1.5).bp * envelope * gain * 0.3 * (0.35 + j / length);
    put(fxBus, start + j, left, right);
    put(roomBus, start + j, left * 0.15, right * 0.15);
  }
}

function airBed(t0, t1, gain = 1) {
  const start = Math.round(t0 * SR);
  const end = Math.round(t1 * SR);
  const leftFilter = svf();
  const rightFilter = svf();
  for (let i = start; i < end; i++) {
    const progress = (i - start) / Math.max(1, end - start);
    const envelope = Math.sin(Math.PI * progress) ** 0.6;
    const left = leftFilter(noise(), 2600 + 900 * progress, 0.7).bp * envelope * gain * 0.028;
    const right = rightFilter(noise(), 2900 + 700 * progress, 0.7).bp * envelope * gain * 0.028;
    put(fxBus, i, left, right);
  }
}

function riser(t0, t1, gain = 1) {
  const start = Math.round(t0 * SR);
  const end = Math.round(t1 * SR);
  const leftFilter = svf();
  const rightFilter = svf();
  for (let i = start; i < end; i++) {
    const progress = (i - start) / Math.max(1, end - start);
    const cutoff = 240 * (6100 / 240) ** progress;
    const envelope = progress ** 2 * Math.min(1, (end - i) / (0.006 * SR));
    const left = leftFilter(noise(), cutoff, 2).bp * envelope * gain * 0.36;
    const right = rightFilter(noise(), cutoff * 1.05, 2).bp * envelope * gain * 0.36;
    put(fxBus, i, left, right);
  }
}

// Abertura em suspensao e lema.
airBed(0, 1.2, 0.9);
pad(0, 3.45, [57, 64, 71], 0.12, {attack: 1.0, release: 0.18, air: 0.03});
brandTone(0.18, 69, 0.34, 0.36, 1.3);
whoosh(1.2, 0.95, 0.55, 0.2);
impact(1.2, 0.9);
motif(1.55, 0.7);

// Menos duvida e transicao para a equipe.
whoosh(3.6, 0.55, 0.28, 0.14);
softPulse(3.6, 0.7);
uiTick(3.77, 0.75, 0.72, 1.05);
pad(3.6, 5.15, [53, 60, 64], 0.13, {attack: 0.08, release: 0.12});
for (const t of [4.2, 4.8]) bassPulse(t, 53, 0.64, 0.3);
whoosh(5.4, 1.0, 0.5, 0.2);
impact(5.4, 1.0);

// Corpo A, equipe, pos-operatorio e contadores.
pad(5.4, 11.76, [53, 57, 60, 64], 0.13, {attack: 0.08, release: 0.16});
for (let t = 6; t < 11.7; t += BEAT) {
  softPulse(t, t % 1.2 < 0.01 ? 0.58 : 0.43);
  bassPulse(t + 0.3, t < 9 ? 53 : 48, 0.54, 0.24);
}
for (const [t, pan, pitch] of [[5.67, 0.24, 1], [5.83, 0.76, 1.08], [6.6, 0.3, 0.93], [7.2, 0.7, 1.12], [7.8, 0.35, 1.02], [8.4, 0.67, 1.17], [9.0, 0.25, 0.95], [9.37, 0.75, 1.06], [10.2, 0.35, 1.15], [10.8, 0.67, 1.0], [11.4, 0.3, 1.1]]) uiTick(t, 0.55, pan, pitch);
whoosh(9.0, 0.63, 0.34, 0.14);
softPulse(9.0, 0.78);
whoosh(12.0, 0.65, 0.3, 0.12);
softPulse(12.0, 0.78);
pad(12.0, 15.42, [55, 60, 64, 67], 0.145, {attack: 0.1, release: 0.12});
for (const [t, note] of [[12.13, 60], [12.6, 64], [13.2, 67], [13.53, 72], [14.1, 67], [14.7, 72]]) {
  brandTone(t, note, 0.43, (Math.round(t * 10) % 2) ? 0.28 : 0.72, 0.55);
  uiTick(t, 0.43, (Math.round(t * 10) % 2) ? 0.72 : 0.28, 1.03);
}

// Cirurgia em quatro passos, com impacto e tres acentos sem sub adicional.
whoosh(15.6, 0.95, 0.48, 0.18);
impact(15.6, 1.08);
pad(15.6, 19.6, [53, 57, 60, 65], 0.14, {attack: 0.08, release: 0.16});
for (const [index, t] of [15.6, 16.5, 17.4, 18.3].entries()) {
  brandTone(t + 0.04, [69, 72, 76, 77][index], 0.66, 0.27 + index * 0.16, 0.8);
  uiTick(t, 0.74, index % 2 ? 0.72 : 0.28, 0.95 + index * 0.06);
  if (index > 0) softPulse(t, 0.46);
}
for (const t of [16.2, 17.1, 18.0, 18.9]) bassPulse(t, 53, 0.48, 0.26);

// Manifesto: queda de energia, notas isoladas e centro livre.
whoosh(19.8, 0.5, 0.35, 0.25);
pad(19.8, 23.82, [53, 60, 64], 0.072, {attack: 0.7, release: 0.15, air: 0.02});
for (const [t, note, pan] of [[20.1, 72, 0.35], [20.9, 69, 0.65], [21.7, 76, 0.42], [22.45, 72, 0.58], [23.15, 69, 0.5]]) brandTone(t, note, 0.32, pan, 1.15);

// Faixa, build em duas etapas e vacuo de 150 ms antes do site.
whoosh(24.0, 0.75, 0.38, 0.16);
softPulse(24.0, 0.7);
pad(24.0, 26.18, [55, 59, 62, 67], 0.12, {attack: 0.12, release: 0.04});
riser(24.0, 26.25, 0.85);
for (const t of [24.0, 24.6, 25.2, 25.5, 25.8, 26.1]) uiTick(t, 0.52 + (t - 24) * 0.12, t % 1.2 < 0.1 ? 0.28 : 0.72, 0.95 + (t - 24) * 0.1);
for (const t of [24.0, 24.6, 25.2]) softPulse(t, 0.58 + (t - 24) * 0.08);
whoosh(26.4, 1.08, 0.58, 0.24);
impact(26.4, 1.28);

// Site e assinatura final, com retorno expandido do motivo de tres notas.
pad(26.4, 29.35, [48, 55, 60, 64, 67], 0.15, {attack: 0.06, release: 0.45, air: 0.045});
motif(27.0, 0.78, true);
uiTick(27.13, 0.62, 0.3, 1.06);
uiTick(27.73, 0.5, 0.72, 1.12);
uiTick(28.33, 0.45, 0.34, 1.18);
brandTone(28.87, 84, 0.48, 0.5, 1.2);

// Microeventos de interface entre os marcos, sem camada de sub.
for (const [index, time] of [6.3, 6.9, 7.5, 8.1, 8.7, 9.6, 10.5, 11.1, 12.9, 13.8, 14.4, 15.0, 16.05, 16.95, 17.85, 18.75, 20.5, 21.3, 22.1, 22.9, 24.3, 24.9, 25.35, 25.65, 25.95, 27.43, 28.03, 28.63].entries()) {
  midClick(time, 0.7, index % 2 ? 0.7 : 0.3, 0.92 + (index % 4) * 0.05);
}

// Reverb curta baseada em combs, usada apenas acima do sub.
function reverb(input, offset) {
  const output = new Float64Array(N);
  const lengths = [1188, 1277, 1356, 1491].map(value => Math.floor((value + offset) * SR / 44100));
  for (const length of lengths) {
    const buffer = new Float64Array(length);
    let cursor = 0;
    let damped = 0;
    for (let i = 0; i < N; i++) {
      const delayed = buffer[cursor];
      damped = delayed * 0.72 + damped * 0.28;
      buffer[cursor] = input[i] * 0.028 + damped * 0.78;
      output[i] += delayed;
      cursor = (cursor + 1) % length;
    }
  }
  return output;
}

const sidechain = new Float64Array(N).fill(1);
for (const event of sidechainEvents) {
  const start = Math.round(event.t * SR);
  const length = Math.round((event.release + 0.025) * SR);
  for (let j = 0; j < length && start + j < N; j++) {
    const local = j / SR;
    const duck = 1 - event.depth * Math.min(1, local / 0.004) * Math.exp(-local / event.release);
    sidechain[start + j] = Math.min(sidechain[start + j], duck);
  }
}

const roomLeft = reverb(roomBus[0], 0);
const roomRight = reverb(roomBus[1], 29);
let left = new Float64Array(N);
let right = new Float64Array(N);
for (let i = 0; i < N; i++) {
  left[i] = padBus[0][i] * sidechain[i] + tonalBus[0][i] + impactBus[0][i] + fxBus[0][i] + roomLeft[i] * 0.28;
  right[i] = padBus[1][i] * sidechain[i] + tonalBus[1][i] + impactBus[1][i] + fxBus[1][i] + roomRight[i] * 0.28;
}

// Vacuos de edicao e fade final. O ultimo vacuo tem 150 ms completos.
const vacuums = [[1.04, 1.2], [5.18, 5.4], [11.78, 12.0], [19.64, 19.8], [26.25, 26.4]];
for (const [start, end] of vacuums) {
  for (let i = Math.round(start * SR); i < Math.round(end * SR); i++) {
    const progress = (i / SR - start) / (end - start);
    const gain = progress < 0.42 ? Math.cos(progress / 0.42 * Math.PI / 2) ** 2 : 0;
    left[i] *= gain;
    right[i] *= gain;
  }
}
for (let i = 0; i < N; i++) {
  const time = i / SR;
  let gain = Math.min(1, time / 0.025);
  if (time > 28.9) gain *= Math.cos(Math.min(1, (time - 28.9) / 1.1) * Math.PI / 2) ** 1.35;
  left[i] *= gain;
  right[i] *= gain;
}

function highPass(channel, cutoff) {
  const a = 1 / (1 + TAU * cutoff / SR);
  let previousInput = 0;
  let previousOutput = 0;
  for (let i = 0; i < channel.length; i++) {
    const output = a * (previousOutput + channel[i] - previousInput);
    previousInput = channel[i];
    previousOutput = output;
    channel[i] = output;
  }
}

function compressStereo(leftChannel, rightChannel, thresholdDb = -17, ratio = 3.2) {
  const threshold = 10 ** (thresholdDb / 20);
  const attack = Math.exp(-1 / (0.006 * SR));
  const release = Math.exp(-1 / (0.12 * SR));
  let envelope = 0;
  for (let i = 0; i < N; i++) {
    const peak = Math.max(Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
    envelope = peak > envelope ? attack * envelope + (1 - attack) * peak : release * envelope + (1 - release) * peak;
    const gain = envelope > threshold ? (envelope / threshold) ** (1 / ratio - 1) : 1;
    leftChannel[i] *= gain;
    rightChannel[i] *= gain;
  }
}

highPass(left, 29);
highPass(right, 29);
compressStereo(left, right);

// FFT utilitaria. Tambem e usada pela medicao identica ao analisador do projeto.
function fft(real, imag, inverse = false) {
  const size = real.length;
  for (let i = 1, j = 0; i < size; i++) {
    let bit = size >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  for (let length = 2; length <= size; length <<= 1) {
    const angle = (inverse ? 2 : -2) * Math.PI / length;
    const wLengthCos = Math.cos(angle);
    const wLengthSin = Math.sin(angle);
    for (let i = 0; i < size; i += length) {
      let wCos = 1;
      let wSin = 0;
      for (let j = 0; j < length / 2; j++) {
        const even = i + j;
        const odd = even + length / 2;
        const oddReal = real[odd] * wCos - imag[odd] * wSin;
        const oddImag = real[odd] * wSin + imag[odd] * wCos;
        real[odd] = real[even] - oddReal;
        imag[odd] = imag[even] - oddImag;
        real[even] += oddReal;
        imag[even] += oddImag;
        const nextCos = wCos * wLengthCos - wSin * wLengthSin;
        wSin = wCos * wLengthSin + wSin * wLengthCos;
        wCos = nextCos;
      }
    }
  }
  if (inverse) for (let i = 0; i < size; i++) { real[i] /= size; imag[i] /= size; }
}

function spectralShape(channel, gains) {
  const size = 4096;
  const hop = size / 4;
  const output = new Float64Array(channel.length + size);
  const weight = new Float64Array(channel.length + size);
  for (let start = -size + hop; start < channel.length; start += hop) {
    const real = new Float64Array(size);
    const imag = new Float64Array(size);
    for (let i = 0; i < size; i++) {
      const source = start + i;
      const window = 0.5 - 0.5 * Math.cos(TAU * i / (size - 1));
      if (source >= 0 && source < channel.length) real[i] = channel[source] * window;
    }
    fft(real, imag);
    for (let bin = 0; bin < size; bin++) {
      const mirrored = bin <= size / 2 ? bin : size - bin;
      const frequency = mirrored * SR / size;
      const gain = frequency < 80 ? gains.sub : frequency < 250 ? gains.grave : frequency < 2000 ? gains.medio : frequency < 6000 ? gains.presenca : gains.brilho;
      real[bin] *= gain;
      imag[bin] *= gain;
    }
    fft(real, imag, true);
    for (let i = 0; i < size; i++) {
      const target = start + i;
      if (target < 0 || target >= channel.length) continue;
      const window = 0.5 - 0.5 * Math.cos(TAU * i / (size - 1));
      output[target] += real[i] * window;
      weight[target] += window * window;
    }
  }
  for (let i = 0; i < channel.length; i++) output[i] = weight[i] > 1e-8 ? output[i] / weight[i] : 0;
  return output.subarray(0, channel.length);
}

// Curva calibrada para a janela FFT do QA: menos sub continuo e mais corpo e medio.
left = spectralShape(left, {sub: 3.62, grave: 1.19, medio: 0.8, presenca: 1.5, brilho: 1.29});
right = spectralShape(right, {sub: 3.62, grave: 1.19, medio: 0.8, presenca: 1.5, brilho: 1.29});
compressStereo(left, right, -15.5, 2.2);

function masterToRms(leftChannel, rightChannel, targetDb = -15, ceilingDb = -1.25) {
  const ceiling = 10 ** (ceilingDb / 20);
  for (let pass = 0; pass < 4; pass++) {
    let energy = 0;
    for (let i = 0; i < N; i++) {
      const mono = (leftChannel[i] + rightChannel[i]) * 0.5;
      energy += mono * mono;
    }
    const rms = Math.sqrt(energy / N);
    const gain = 10 ** (targetDb / 20) / Math.max(rms, 1e-12);
    for (let i = 0; i < N; i++) {
      leftChannel[i] *= gain;
      rightChannel[i] *= gain;
    }
    let limited = false;
    for (let i = 0; i < N; i++) {
      const peak = Math.max(Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
      if (peak > ceiling) {
        const drive = peak / ceiling;
        leftChannel[i] = Math.tanh(leftChannel[i] * drive / ceiling) / Math.tanh(drive) * ceiling;
        rightChannel[i] = Math.tanh(rightChannel[i] * drive / ceiling) / Math.tanh(drive) * ceiling;
        limited = true;
      }
    }
    if (!limited) break;
  }
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
  if (peak > ceiling) {
    const gain = ceiling / peak;
    for (let i = 0; i < N; i++) { leftChannel[i] *= gain; rightChannel[i] *= gain; }
  }
}

masterToRms(left, right);

function writeWav(leftChannel, rightChannel, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  const buffer = Buffer.alloc(44 + N * 4);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + N * 4, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) {
    const dither = () => (rnd() - rnd()) / 32768;
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((leftChannel[i] + dither()) * 32767))), 44 + i * 4);
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((rightChannel[i] + dither()) * 32767))), 46 + i * 4);
  }
  fs.writeFileSync(outputPath, buffer);
}

// Medicao igual a _scripts/qa/analise-audio.mjs, aplicada somente a v3.
function resampleLinear(samples, fromRate, toRate) {
  const length = Math.floor(samples.length * toRate / fromRate);
  const output = new Float64Array(length);
  const ratio = fromRate / toRate;
  for (let i = 0; i < length; i++) {
    const source = i * ratio;
    const a = Math.floor(source);
    const b = Math.min(a + 1, samples.length - 1);
    output[i] = samples[a] * (1 - (source - a)) + samples[b] * (source - a);
  }
  return output;
}

const db = value => Math.max(-96, 20 * Math.log10(Math.max(value, 1e-12)));
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return lower === upper ? sorted[lower] : sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
}
function rmsRange(samples, start, end) {
  let energy = 0;
  let peak = 0;
  for (let i = start; i < end && i < samples.length; i++) {
    energy += samples[i] ** 2;
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  return {rms: Math.sqrt(energy / Math.max(1, end - start)), peak};
}
function onsets(samples, sampleRate) {
  const frameSize = Math.round(0.02 * sampleRate);
  const hop = Math.round(0.01 * sampleRate);
  const envelope = [];
  for (let start = 0; start + frameSize <= samples.length; start += hop) envelope.push(db(rmsRange(samples, start, start + frameSize).rms));
  const novelty = envelope.map((level, index) => {
    const previous = envelope.slice(Math.max(0, index - 10), index);
    const baseline = previous.length ? mean(previous) : level;
    return Math.max(0, level - baseline) + Math.max(0, level - (envelope[index - 1] ?? level)) * 0.6;
  });
  const median = percentile(novelty, 0.5);
  const mad = percentile(novelty.map(value => Math.abs(value - median)), 0.5);
  const threshold = Math.max(4.5, median + 4.5 * Math.max(mad, 0.2));
  const candidates = [];
  const floor = percentile(envelope, 0.35);
  for (let i = 4; i < novelty.length - 4; i++) {
    if (novelty[i] === Math.max(...novelty.slice(i - 4, i + 5)) && novelty[i] >= threshold && envelope[i] >= floor) candidates.push({time: (i * hop + frameSize / 2) / sampleRate, strength: novelty[i]});
  }
  const result = [];
  for (const candidate of candidates) {
    if (!result.length || candidate.time - result.at(-1).time >= 0.18) result.push(candidate);
    else if (candidate.strength > result.at(-1).strength) result[result.length - 1] = candidate;
  }
  return result;
}
function estimateBpm(events, duration) {
  const scores = new Map();
  for (let i = 0; i < events.length; i++) for (let step = 1; step <= 4 && i + step < events.length; step++) {
    const interval = events[i + step].time - events[i].time;
    if (interval < 0.22 || interval > 4) continue;
    let bpm = 60 * step / interval;
    while (bpm < 60) bpm *= 2;
    while (bpm > 180) bpm /= 2;
    const bucket = Math.round(bpm * 2) / 2;
    const weight = Math.sqrt(events[i].strength * events[i + step].strength) / step;
    for (let delta = -1; delta <= 1; delta++) scores.set(bucket + delta * 0.5, (scores.get(bucket + delta * 0.5) || 0) + weight * (delta === 0 ? 1 : 0.45));
  }
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return {bpm: null, confidence: 0};
  const density = Math.min(1, events.length / Math.max(6, duration * 0.45));
  const separation = ranked[1] ? (ranked[0][1] - ranked[1][1]) / ranked[0][1] : 1;
  return {bpm: ranked[0][0], confidence: Math.max(0.05, Math.min(0.95, 0.25 + 0.45 * density + 0.3 * separation))};
}
function frequencyProfile(samples, sampleRate) {
  const size = 2048;
  const hop = 1024;
  const bands = {sub: 0, grave: 0, medio: 0, presenca: 0, brilho: 0};
  let total = 0;
  let centroid = 0;
  for (let start = 0; start + size <= samples.length; start += hop) {
    const real = new Float64Array(size);
    const imag = new Float64Array(size);
    for (let i = 0; i < size; i++) real[i] = samples[start + i] * (0.5 - 0.5 * Math.cos(TAU * i / (size - 1)));
    fft(real, imag);
    for (let bin = 1; bin <= size / 2; bin++) {
      const frequency = bin * sampleRate / size;
      const power = real[bin] ** 2 + imag[bin] ** 2;
      const band = frequency < 80 ? 'sub' : frequency < 250 ? 'grave' : frequency < 2000 ? 'medio' : frequency < 6000 ? 'presenca' : 'brilho';
      bands[band] += power;
      total += power;
      centroid += power * frequency;
    }
  }
  for (const band of Object.keys(bands)) bands[band] = bands[band] / total * 100;
  return {bands, centroidHz: centroid / total};
}
function measure(leftChannel, rightChannel) {
  const mono48 = Float64Array.from(leftChannel, (value, index) => (value + rightChannel[index]) * 0.5);
  const samples = resampleLinear(mono48, SR, 22050);
  const windows = [];
  const windowSize = Math.round(0.25 * 22050);
  for (let start = 0; start < samples.length; start += windowSize) windows.push(db(rmsRange(samples, start, Math.min(start + windowSize, samples.length)).rms));
  const events = onsets(samples, 22050);
  const levels = rmsRange(samples, 0, samples.length);
  const frequency = frequencyProfile(samples, 22050);
  return {
    duration: samples.length / 22050,
    rmsDb: db(levels.rms),
    peakDb: db(levels.peak),
    dynamicSpreadDb: percentile(windows, 0.9) - percentile(windows, 0.1),
    onsets: events.length,
    bpm: estimateBpm(events, samples.length / 22050),
    ...frequency,
  };
}

writeWav(left, right, OUT);
function readWavStereo16(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') throw new Error(`WAV invalido: ${file}`);
  let offset = 12;
  let dataStart = -1;
  let dataSize = 0;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === 'data') {
      dataStart = offset + 8;
      dataSize = size;
      break;
    }
    offset += 8 + size + (size % 2);
  }
  if (dataStart < 0) throw new Error(`Chunk data ausente: ${file}`);
  const frames = Math.floor(dataSize / 4);
  const decodedLeft = new Float64Array(frames);
  const decodedRight = new Float64Array(frames);
  for (let i = 0; i < frames; i++) {
    decodedLeft[i] = buffer.readInt16LE(dataStart + i * 4) / 32768;
    decodedRight[i] = buffer.readInt16LE(dataStart + i * 4 + 2) / 32768;
  }
  return [decodedLeft, decodedRight];
}
const [measuredLeft, measuredRight] = readWavStereo16(OUT);
const measured = measure(measuredLeft, measuredRight);
console.log(JSON.stringify({file: OUT, sampleRate: SR, channels: 2, bits: 16, declaredBpm: BPM, ...measured}, null, 2));
