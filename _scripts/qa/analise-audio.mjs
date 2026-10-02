import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AUDIO_DIR = path.join(ROOT, 'design', 'referencias', 'audio');
const FRAME_DIR = path.join(AUDIO_DIR, 'quadros');
const FFMPEG_DIR = path.join(
  ROOT,
  'sites',
  'mellomidias-releitura',
  'node_modules',
  '@remotion',
  'compositor-win32-x64-msvc',
);
const FFMPEG = path.join(FFMPEG_DIR, 'ffmpeg.exe');
const FFPROBE = path.join(FFMPEG_DIR, 'ffprobe.exe');
const REPORT_PATH = path.join(AUDIO_DIR, 'analise.md');
const TARGET_SR = 22050;
const DB_FLOOR = -96;

const REELS = [
  {
    id: 'Dd1p_PWx0nR',
    title: 'Reel 1, motion design com IA',
    video: path.join(AUDIO_DIR, 'Dd1p_PWx0nR.mp4'),
    caption: path.join(AUDIO_DIR, 'Dd1p_PWx0nR.txt'),
    visualNotes: 'A câmera permanece fixa em um estúdio de luz quente e enquadra o monitor como palco. Dentro da tela, a direção de arte usa preto, branco e amarelo, tipografia grotesca grande, cartões de interface, partículas, objeto 3D e símbolo dourado. A montagem alterna telas tipográficas, grafismo abstrato, produto e assinatura. O ritmo acelera em uma sequência concentrada de cortes entre 9,33 e 10,13 s, enquanto a moldura física e a legenda branca permanecem estáveis.',
  },
  {
    id: 'DdpnXQpMcGv',
    title: 'Reel 2, comercial de motion com realismo',
    video: path.join(AUDIO_DIR, 'DdpnXQpMcGv.mp4'),
    caption: path.join(AUDIO_DIR, 'DdpnXQpMcGv.txt'),
    visualNotes: 'A câmera também usa o monitor como palco, com moldura física estável e legenda social sobreposta. O comercial dentro da tela segue uma identidade financeira em amarelo, preto e branco. Ele progride de formulário e cartões 3D para slogan, celular, personagem em ambiente de aeroporto, pagamento por aproximação, notificações e logo final. A edição alterna UI limpa, produto e cenas realistas, com maior concentração de cortes entre 19,67 e 33,20 s e desaceleração para a assinatura.',
  },
];

const TRACK = {
  id: 'trilha-v2',
  title: 'Nossa trilha-v2',
  wav: path.join(ROOT, 'design', 'clientes', 'stetic-class', 'video', 'trilha-v2.wav'),
};

function run(binary, args, { allowFailure = false, captureStderr = false } = {}) {
  const result = spawnSync(binary, args, {
    cwd: ROOT,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    throw new Error(
      `${path.basename(binary)} falhou (${result.status})\n${result.stderr || result.stdout}`,
    );
  }
  return captureStderr ? (result.stderr || '') : (result.stdout || '');
}

function assertInputs() {
  for (const required of [FFMPEG, FFPROBE, TRACK.wav, ...REELS.flatMap((r) => [r.video, r.caption])]) {
    if (!fs.existsSync(required)) throw new Error(`Arquivo obrigatório ausente: ${required}`);
  }
  fs.mkdirSync(FRAME_DIR, { recursive: true });
}

function probe(file) {
  return JSON.parse(
    run(FFPROBE, [
      '-v', 'error',
      '-show_entries', 'format=duration:stream=codec_type,sample_rate,channels,width,height,avg_frame_rate',
      '-of', 'json',
      file,
    ]),
  );
}

function extractAudio(reel) {
  const output = path.join(AUDIO_DIR, `${reel.id}-mono-22k.wav`);
  run(FFMPEG, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', reel.video,
    '-vn', '-ac', '1', '-ar', String(TARGET_SR), '-c:a', 'pcm_s16le',
    output,
  ]);
  return output;
}

function extractFrames(reel, duration) {
  const times = Array.from({ length: 8 }, (_, i) => duration * ((i + 0.5) / 8));
  return times.map((time, index) => {
    const output = path.join(FRAME_DIR, `${reel.id}-${String(index + 1).padStart(2, '0')}.jpg`);
    // Um processo por quadro. O padrão de sequência %02d não é usado neste ambiente.
    run(FFMPEG, [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-ss', time.toFixed(3), '-i', reel.video,
      '-frames:v', '1', '-q:v', '2',
      output,
    ]);
    return { time, file: output };
  });
}

function detectSceneCuts(video, duration, metadata) {
  // Este build reduzido do ffmpeg não inclui os filtros select, scene e showinfo.
  // Decodificamos quadros em cinza 64x114 e medimos a diferença média entre quadros.
  const width = 64;
  const height = 114;
  const frameBytes = width * height;
  const result = spawnSync(FFMPEG, [
    '-hide_banner', '-loglevel', 'error',
    '-i', video,
    '-vf', `scale=${width}:${height},format=gray`,
    '-an', '-c:v', 'rawvideo', '-pix_fmt', 'gray',
    '-f', 'image2pipe', 'pipe:1',
  ], {
    cwd: ROOT,
    encoding: null,
    windowsHide: true,
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Falha ao decodificar quadros: ${result.stderr?.toString()}`);
  const frames = Math.floor(result.stdout.length / frameBytes);
  const rateText = metadata.streams.find((stream) => stream.codec_type === 'video')?.avg_frame_rate || '30/1';
  const [rateNumerator, rateDenominator] = rateText.split('/').map(Number);
  const fps = rateDenominator ? rateNumerator / rateDenominator : frames / duration;
  const differences = [];
  for (let frame = 1; frame < frames; frame++) {
    const current = frame * frameBytes;
    const previous = current - frameBytes;
    let sum = 0;
    for (let pixel = 0; pixel < frameBytes; pixel++) {
      sum += Math.abs(result.stdout[current + pixel] - result.stdout[previous + pixel]);
    }
    differences.push({ frame, time: frame / fps, score: sum / frameBytes });
  }
  const values = differences.map((item) => item.score);
  const median = percentile(values, 0.5);
  const mad = percentile(values.map((value) => Math.abs(value - median)), 0.5);
  const threshold = Math.max(8, percentile(values, 0.98), median + 7 * Math.max(mad, 0.25));
  const candidates = [];
  const radius = 4;
  for (let i = radius; i < differences.length - radius; i++) {
    const item = differences[i];
    const local = differences.slice(i - radius, i + radius + 1);
    if (item.score >= threshold && item.score === Math.max(...local.map((entry) => entry.score))) {
      candidates.push(item.time);
    }
  }
  return {
    cuts: uniqueTimes(candidates, 0.12),
    threshold,
    method: 'diferença média de quadros 64x114 em tons de cinza',
  };
}

function uniqueTimes(times, tolerance) {
  const result = [];
  for (const time of times.sort((a, b) => a - b)) {
    if (!result.length || time - result.at(-1) > tolerance) result.push(time);
  }
  return result;
}

function readWav(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`WAV inválido: ${file}`);
  }
  let offset = 12;
  let format;
  let data;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === 'fmt ') {
      format = {
        audioFormat: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        bitsPerSample: buffer.readUInt16LE(start + 14),
      };
    } else if (id === 'data') {
      data = buffer.subarray(start, Math.min(start + size, buffer.length));
    }
    offset = start + size + (size % 2);
  }
  if (!format || !data) throw new Error(`Chunks fmt/data não encontrados: ${file}`);
  const bytes = format.bitsPerSample / 8;
  const frames = Math.floor(data.length / (bytes * format.channels));
  const samples = new Float64Array(frames);
  for (let frame = 0; frame < frames; frame++) {
    let sum = 0;
    for (let channel = 0; channel < format.channels; channel++) {
      const pos = (frame * format.channels + channel) * bytes;
      let value;
      if (format.audioFormat === 3 && format.bitsPerSample === 32) value = data.readFloatLE(pos);
      else if (format.audioFormat === 1 && format.bitsPerSample === 16) value = data.readInt16LE(pos) / 32768;
      else if (format.audioFormat === 1 && format.bitsPerSample === 24) value = data.readIntLE(pos, 3) / 8388608;
      else if (format.audioFormat === 1 && format.bitsPerSample === 32) value = data.readInt32LE(pos) / 2147483648;
      else throw new Error(`WAV não suportado: formato ${format.audioFormat}, ${format.bitsPerSample} bits`);
      sum += value;
    }
    samples[frame] = sum / format.channels;
  }
  return { samples, sampleRate: format.sampleRate, channels: format.channels, bits: format.bitsPerSample };
}

function resampleLinear(samples, fromRate, toRate) {
  if (fromRate === toRate) return samples;
  const length = Math.floor(samples.length * toRate / fromRate);
  const out = new Float64Array(length);
  const ratio = fromRate / toRate;
  for (let i = 0; i < length; i++) {
    const source = i * ratio;
    const a = Math.floor(source);
    const b = Math.min(a + 1, samples.length - 1);
    const fraction = source - a;
    out[i] = samples[a] * (1 - fraction) + samples[b] * fraction;
  }
  return out;
}

function db(value) {
  return Math.max(DB_FLOOR, 20 * Math.log10(Math.max(value, 1e-12)));
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
}

function rmsRange(samples, start, end) {
  let energy = 0;
  let peak = 0;
  for (let i = start; i < end && i < samples.length; i++) {
    const absolute = Math.abs(samples[i]);
    energy += samples[i] * samples[i];
    if (absolute > peak) peak = absolute;
  }
  return { rms: Math.sqrt(energy / Math.max(1, end - start)), peak };
}

function loudnessWindows(samples, sr, seconds = 0.25) {
  const size = Math.round(seconds * sr);
  const windows = [];
  for (let start = 0; start < samples.length; start += size) {
    const end = Math.min(start + size, samples.length);
    const measured = rmsRange(samples, start, end);
    windows.push({
      start: start / sr,
      end: end / sr,
      db: db(measured.rms),
      peakDb: db(measured.peak),
    });
  }
  return windows;
}

function analyzeOnsets(samples, sr) {
  const frameSize = Math.round(0.02 * sr);
  const hop = Math.round(0.01 * sr);
  const envelope = [];
  for (let start = 0; start + frameSize <= samples.length; start += hop) {
    envelope.push(db(rmsRange(samples, start, start + frameSize).rms));
  }
  const novelty = envelope.map((level, i) => {
    const previous = envelope.slice(Math.max(0, i - 10), i);
    const baseline = previous.length ? mean(previous) : level;
    return Math.max(0, level - baseline) + Math.max(0, level - (envelope[i - 1] ?? level)) * 0.6;
  });
  const med = percentile(novelty, 0.5);
  const mad = percentile(novelty.map((value) => Math.abs(value - med)), 0.5);
  const threshold = Math.max(4.5, med + 4.5 * Math.max(mad, 0.2));
  const candidates = [];
  const levelFloor = percentile(envelope, 0.35);
  for (let i = 4; i < novelty.length - 4; i++) {
    const isLocalMax = novelty[i] === Math.max(...novelty.slice(i - 4, i + 5));
    if (isLocalMax && novelty[i] >= threshold && envelope[i] >= levelFloor) {
      candidates.push({ time: (i * hop + frameSize / 2) / sr, strength: novelty[i], levelDb: envelope[i] });
    }
  }
  const onsets = [];
  for (const candidate of candidates) {
    const previous = onsets.at(-1);
    if (!previous || candidate.time - previous.time >= 0.18) onsets.push(candidate);
    else if (candidate.strength > previous.strength) onsets[onsets.length - 1] = candidate;
  }
  return { onsets, threshold, envelope, envelopeHopSeconds: hop / sr };
}

function estimateBpm(onsets, duration) {
  if (onsets.length < 3) return { bpm: null, confidence: 0, runnerUp: null };
  const scores = new Map();
  for (let i = 0; i < onsets.length; i++) {
    for (let step = 1; step <= 4 && i + step < onsets.length; step++) {
      const interval = onsets[i + step].time - onsets[i].time;
      if (interval < 0.22 || interval > 4) continue;
      let bpm = 60 * step / interval;
      while (bpm < 60) bpm *= 2;
      while (bpm > 180) bpm /= 2;
      const bucket = Math.round(bpm * 2) / 2;
      const weight = Math.sqrt(onsets[i].strength * onsets[i + step].strength) / step;
      for (let delta = -1; delta <= 1; delta++) {
        const nearby = bucket + delta * 0.5;
        scores.set(nearby, (scores.get(nearby) || 0) + weight * (delta === 0 ? 1 : 0.45));
      }
    }
  }
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return { bpm: null, confidence: 0, runnerUp: null };
  const densityFactor = Math.min(1, onsets.length / Math.max(6, duration * 0.45));
  const separation = ranked[1] ? (ranked[0][1] - ranked[1][1]) / ranked[0][1] : 1;
  return {
    bpm: ranked[0][0],
    confidence: Math.max(0.05, Math.min(0.95, 0.25 + 0.45 * densityFactor + 0.3 * separation)),
    runnerUp: ranked[1]?.[0] ?? null,
  };
}

function fft(real, imag) {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  for (let length = 2; length <= n; length <<= 1) {
    const angle = -2 * Math.PI / length;
    const wLengthCos = Math.cos(angle);
    const wLengthSin = Math.sin(angle);
    for (let i = 0; i < n; i += length) {
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
}

function frequencyProfile(samples, sr) {
  const size = 2048;
  const hop = 1024;
  const bands = {
    sub: 0,
    grave: 0,
    medio: 0,
    presenca: 0,
    brilho: 0,
  };
  let total = 0;
  let centroidWeighted = 0;
  for (let start = 0; start + size <= samples.length; start += hop) {
    const real = new Float64Array(size);
    const imag = new Float64Array(size);
    for (let i = 0; i < size; i++) {
      const hann = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (size - 1));
      real[i] = samples[start + i] * hann;
    }
    fft(real, imag);
    for (let bin = 1; bin <= size / 2; bin++) {
      const frequency = bin * sr / size;
      const power = real[bin] ** 2 + imag[bin] ** 2;
      if (frequency < 80) bands.sub += power;
      else if (frequency < 250) bands.grave += power;
      else if (frequency < 2000) bands.medio += power;
      else if (frequency < 6000) bands.presenca += power;
      else bands.brilho += power;
      total += power;
      centroidWeighted += power * frequency;
    }
  }
  const percentages = Object.fromEntries(
    Object.entries(bands).map(([key, value]) => [key, total ? value / total * 100 : 0]),
  );
  return { bands: percentages, centroidHz: total ? centroidWeighted / total : 0 };
}

function voiceEvidence(samples, sr, frequency, onsets) {
  const speechBand = frequency.bands.medio + frequency.bands.presenca;
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if ((samples[i - 1] < 0 && samples[i] >= 0) || (samples[i - 1] >= 0 && samples[i] < 0)) crossings++;
  }
  const zcr = crossings / samples.length;
  const duration = samples.length / sr;
  const onsetRate = onsets.length / Math.max(duration, 1);
  const speechBandScore = Math.max(0, Math.min(1, (speechBand - 38) / 35));
  const zcrScore = Math.max(0, 1 - Math.abs(zcr - 0.09) / 0.09);
  const rhythmScore = Math.max(0, 1 - Math.abs(onsetRate - 2.8) / 2.8);
  const score = 0.6 * speechBandScore + 0.2 * zcrScore + 0.2 * rhythmScore;
  let label = 'predomínio musical, sem evidência espectral forte de fala';
  if (score >= 0.62) label = 'forte indício de voz falada misturada à música';
  else if (score >= 0.42) label = 'indício moderado de voz falada ou elementos melódicos na faixa vocal';
  return { score, label, speechBand, zcr, onsetRate };
}

function perSecondTimeline(windows, duration) {
  const seconds = [];
  for (let second = 0; second < Math.ceil(duration); second++) {
    const values = windows
      .filter((window) => window.start < second + 1 && window.end > second)
      .map((window) => window.db);
    seconds.push({ second, db: values.length ? mean(values) : DB_FLOOR });
  }
  const levels = seconds.map((item) => item.db);
  const low = percentile(levels, 0.25);
  const high = percentile(levels, 0.75);
  return seconds.map((item, index) => {
    const previous = seconds[index - 1]?.db ?? item.db;
    const delta = item.db - previous;
    let state = 'corpo';
    if (item.db <= low) state = 'respiro';
    else if (item.db >= high) state = 'alta';
    if (delta >= 4) state = 'sobe';
    if (delta <= -4) state = 'cai';
    return { ...item, state };
  });
}

function compareCuts(cuts, onsets, tolerance = 0.08) {
  const pairs = cuts.map((cut) => {
    let best = null;
    for (const onset of onsets) {
      const distance = Math.abs(onset.time - cut);
      if (!best || distance < best.distance) best = { cut, onset: onset.time, distance };
    }
    return best && best.distance <= tolerance ? best : { cut, onset: null, distance: best?.distance ?? null };
  });
  const matched = pairs.filter((pair) => pair.onset !== null);
  return { tolerance, pairs, matched: matched.length, ratio: cuts.length ? matched.length / cuts.length : 0 };
}

function analyzeWav(file, id) {
  const wav = readWav(file);
  const samples = resampleLinear(wav.samples, wav.sampleRate, TARGET_SR);
  const sr = TARGET_SR;
  const duration = samples.length / sr;
  const windows = loudnessWindows(samples, sr);
  const onsetData = analyzeOnsets(samples, sr);
  const bpm = estimateBpm(onsetData.onsets, duration);
  const frequency = frequencyProfile(samples, sr);
  const voice = voiceEvidence(samples, sr, frequency, onsetData.onsets);
  const allMeasured = rmsRange(samples, 0, samples.length);
  const levels = windows.map((window) => window.db);
  return {
    id,
    duration,
    sourceSampleRate: wav.sampleRate,
    sourceChannels: wav.channels,
    rmsDb: db(allMeasured.rms),
    peakDb: db(allMeasured.peak),
    p10Db: percentile(levels, 0.1),
    p90Db: percentile(levels, 0.9),
    dynamicSpreadDb: percentile(levels, 0.9) - percentile(levels, 0.1),
    windows,
    timeline: perSecondTimeline(windows, duration),
    onsets: onsetData.onsets,
    onsetThreshold: onsetData.threshold,
    bpm,
    frequency,
    voice,
  };
}

function fmt(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits).replace('.', ',') : 'n/d';
}

function secondsList(values) {
  return values.length ? values.map((value) => `${fmt(value, 2)} s`).join(', ') : 'nenhum';
}

function formatTimeline(timeline) {
  const rows = [];
  for (let index = 0; index < timeline.length; index += 10) {
    const chunk = timeline.slice(index, index + 10);
    rows.push(chunk.map((item) => `${item.second}s ${fmt(item.db)} dB ${item.state}`).join(' | '));
  }
  return rows.map((row) => `- ${row}`).join('\n');
}

function formatImpactTable(onsets) {
  if (!onsets.length) return '_Nenhum onset forte passou o limiar adaptativo._';
  return [
    '| Tempo | Força de ataque | Nível local |',
    '|---:|---:|---:|',
    ...onsets.map((onset) => `| ${fmt(onset.time, 2)} s | ${fmt(onset.strength)} dB | ${fmt(onset.levelDb)} dBFS |`),
  ].join('\n');
}

function formatFrequencyTable(analyses) {
  const header = '| Material | Sub <80 Hz | Grave 80-250 Hz | Médio 250 Hz-2 kHz | Presença 2-6 kHz | Brilho >6 kHz | Centroide |';
  const divider = '|---|---:|---:|---:|---:|---:|---:|';
  const rows = analyses.map(({ title, analysis }) => {
    const b = analysis.frequency.bands;
    return `| ${title} | ${fmt(b.sub)}% | ${fmt(b.grave)}% | ${fmt(b.medio)}% | ${fmt(b.presenca)}% | ${fmt(b.brilho)}% | ${fmt(analysis.frequency.centroidHz, 0)} Hz |`;
  });
  return [header, divider, ...rows].join('\n');
}

function describeStructure(analysis) {
  const chunkSeconds = Math.max(2, Math.round(analysis.duration / 6));
  const chunks = [];
  for (let start = 0; start < analysis.duration; start += chunkSeconds) {
    const end = Math.min(analysis.duration, start + chunkSeconds);
    const values = analysis.timeline.filter((item) => item.second >= start && item.second < end).map((item) => item.db);
    chunks.push({ start, end, level: mean(values) });
  }
  const levels = chunks.map((chunk) => chunk.level);
  const low = percentile(levels, 0.3);
  const high = percentile(levels, 0.7);
  return chunks.map((chunk, index) => {
    let role;
    if (index === 0) role = chunk.level >= high ? 'intro direta e cheia' : 'intro contida';
    else if (index === chunks.length - 1) role = chunk.level >= high ? 'final sustentado em alta' : 'final com retirada de energia';
    else if (chunk.level <= low) role = 'respiro ou redução';
    else if (chunk.level >= high) role = 'drop ou bloco de maior energia';
    else role = chunk.level > chunks[index - 1].level + 2 ? 'build' : 'desenvolvimento';
    return `${fmt(chunk.start, 0)} a ${fmt(chunk.end, 0)} s: ${role}, média ${fmt(chunk.level)} dBFS`;
  }).join('; ');
}

function visualRhythm(cuts, duration) {
  const rate = cuts.length / Math.max(duration, 1);
  if (rate >= 1) return 'montagem muito rápida, com ao menos um corte detectado por segundo em média';
  if (rate >= 0.45) return 'montagem rápida, com mudanças visuais frequentes';
  if (rate >= 0.2) return 'montagem moderada, alternando planos e blocos de motion';
  return 'montagem relativamente contínua, com transições graduais ou movimento dentro do plano';
}

function referenceSection(item) {
  const a = item.analysis;
  const cuts = item.scene.cuts;
  const comparison = item.cutComparison;
  const bpmText = a.bpm.bpm
    ? `${fmt(a.bpm.bpm)} BPM, confiança ${fmt(a.bpm.confidence * 100, 0)}%, alternativa ${fmt(a.bpm.runnerUp)} BPM`
    : 'indeterminado por falta de onsets suficientes';
  const frameLinks = item.frames.map((frame) => `quadros/${path.basename(frame.file)} (${fmt(frame.time, 2)} s)`).join(', ');
  return `## ${item.title}

### Números principais

| Métrica | Resultado |
|---|---:|
| Duração | ${fmt(a.duration, 3)} s |
| RMS global | ${fmt(a.rmsDb)} dBFS |
| Pico | ${fmt(a.peakDb)} dBFS |
| Faixa dinâmica P90-P10 em janelas de 250 ms | ${fmt(a.dynamicSpreadDb)} dB |
| Onsets fortes | ${a.onsets.length} |
| BPM estimado | ${bpmText} |
| Cortes detectados | ${cuts.length}, limiar de cena ${fmt(item.scene.threshold, 2)} |
| Cortes em impacto, tolerância 80 ms | ${comparison.matched}/${cuts.length} (${fmt(comparison.ratio * 100, 0)}%) |
| Voz versus música | ${a.voice.label}, escore ${fmt(a.voice.score * 100, 0)}% |

### Linha do tempo de energia por segundo

Cada valor é a média das janelas RMS de 250 ms que cruzam aquele segundo.

${formatTimeline(a.timeline)}

### Impactos e BPM

${formatImpactTable(a.onsets)}

Estimativa de pulso: ${bpmText}. O estimador normaliza intervalos entre onsets para 60 a 180 BPM. Em conteúdo com fala, efeitos e edição livre, o valor deve ser lido como pulso provável, não como grade confirmada.

### Cortes x impactos

- Cortes: ${secondsList(cuts)}.
- Cortes casados com onset em até 80 ms: ${comparison.pairs.filter((pair) => pair.onset !== null).map((pair) => `${fmt(pair.cut, 2)} s com ${fmt(pair.onset, 2)} s`).join(', ') || 'nenhum'}.
- Cortes sem casamento: ${secondsList(comparison.pairs.filter((pair) => pair.onset === null).map((pair) => pair.cut))}.

### Estrutura do áudio

${describeStructure(a)}. A leitura combina energia, onsets e cortes. A legenda do post indica conteúdo autoral sobre ${item.id === 'Dd1p_PWx0nR' ? 'motion design feito com IA' : 'um comercial de motion com realismo'}, mas não fornece transcrição temporizada do áudio.

### Quadros e linguagem visual

Foram extraídos oito quadros em posições centrais de oito intervalos iguais: ${frameLinks}. A cadência calculada indica ${visualRhythm(cuts, a.duration)}. ${item.visualNotes}
`;
}

function targetBandRecipe(reels, track) {
  const averages = {};
  for (const band of Object.keys(track.frequency.bands)) {
    averages[band] = mean(reels.map((reel) => reel.analysis.frequency.bands[band]));
  }
  const ranges = Object.fromEntries(Object.entries(averages).map(([band, value]) => [band, [Math.max(0, value * 0.82), Math.min(100, value * 1.18)]]));
  return { averages, ranges };
}

function deltaSentence(reference, track) {
  const deltas = Object.keys(reference.frequency.bands).map((band) => ({
    band,
    delta: reference.frequency.bands[band] - track.frequency.bands[band],
  })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const names = { sub: 'sub', grave: 'grave', medio: 'médio', presenca: 'presença', brilho: 'brilho' };
  return deltas.slice(0, 3).map((item) => `${names[item.band]} ${item.delta >= 0 ? '+' : ''}${fmt(item.delta)} pp`).join(', ');
}

function generateReport(results, track) {
  const all = [...results.map((item) => ({ title: item.title, analysis: item.analysis })), { title: track.title, analysis: track.analysis }];
  const target = targetBandRecipe(results, track.analysis);
  const referenceBpms = results.map((item) => item.analysis.bpm.bpm).filter(Number.isFinite);
  const medianBpm = referenceBpms.length ? percentile(referenceBpms, 0.5) : 104;
  const suggestedBpm = Math.round(Math.max(96, Math.min(116, medianBpm)) / 2) * 2;
  const report = `# Análise de áudio e vídeo dos reels de referência

Gerado localmente por \`_scripts/qa/analise-audio.mjs\`. Nenhum serviço de rede foi usado. Áudios dos reels foram convertidos para WAV mono a 22,05 kHz. Loudness aqui significa RMS em dBFS por janela de 250 ms, não LUFS integrado.

## Resumo comparativo

| Material | Duração | RMS | Pico | Dinâmica P90-P10 | Onsets fortes | BPM estimado | Indício de voz |
|---|---:|---:|---:|---:|---:|---:|---:|
${all.map(({ title, analysis }) => `| ${title} | ${fmt(analysis.duration, 2)} s | ${fmt(analysis.rmsDb)} dBFS | ${fmt(analysis.peakDb)} dBFS | ${fmt(analysis.dynamicSpreadDb)} dB | ${analysis.onsets.length} | ${analysis.bpm.bpm ? fmt(analysis.bpm.bpm) : 'n/d'} | ${fmt(analysis.voice.score * 100, 0)}% |`).join('\n')}

### Equilíbrio de frequências

Percentuais de energia espectral calculados por FFT de 2.048 pontos, janela Hann e salto de 1.024 amostras. Os valores são relativos e somam aproximadamente 100% em cada linha.

${formatFrequencyTable(all)}

${results.map(referenceSection).join('\n')}

## Nossa trilha-v2

### Medições

| Métrica | Resultado |
|---|---:|
| Duração | ${fmt(track.analysis.duration, 3)} s |
| RMS global | ${fmt(track.analysis.rmsDb)} dBFS |
| Pico | ${fmt(track.analysis.peakDb)} dBFS |
| Faixa dinâmica P90-P10 | ${fmt(track.analysis.dynamicSpreadDb)} dB |
| Onsets fortes | ${track.analysis.onsets.length} |
| BPM medido | ${track.analysis.bpm.bpm ? `${fmt(track.analysis.bpm.bpm)} BPM, confiança ${fmt(track.analysis.bpm.confidence * 100, 0)}%` : 'n/d'} |
| Indício de voz | ${track.analysis.voice.label}, escore ${fmt(track.analysis.voice.score * 100, 0)}% |

### Linha do tempo

${formatTimeline(track.analysis.timeline)}

### Impactos

${formatImpactTable(track.analysis.onsets)}

### Leitura estrutural

${describeStructure(track.analysis)}. O gerador declara 100 BPM e organiza abertura, groove, queda para manifesto, build e impacto final. A medição de BPM pode cair em múltiplo ou subdivisão por causa da densidade de hats, arpejos e efeitos.

## Comparação direta com a trilha-v2

- Reel 1 versus trilha-v2 nas maiores diferenças espectrais: ${deltaSentence(results[0].analysis, track.analysis)}.
- Reel 2 versus trilha-v2 nas maiores diferenças espectrais: ${deltaSentence(results[1].analysis, track.analysis)}.
- As referências têm ${results.reduce((sum, item) => sum + item.analysis.onsets.length, 0)} onsets fortes em ${fmt(results.reduce((sum, item) => sum + item.analysis.duration, 0), 1)} s. A trilha-v2 tem ${track.analysis.onsets.length} em ${fmt(track.analysis.duration, 1)} s.
- A trilha-v2 apresenta ${fmt(track.analysis.dynamicSpreadDb)} dB de variação P90-P10. As referências apresentam ${results.map((item) => fmt(item.analysis.dynamicSpreadDb)).join(' e ')} dB. Uma diferença maior indica contraste mais marcado entre respiro e bloco cheio.
- Os escores de voz das referências são ${results.map((item) => `${fmt(item.analysis.voice.score * 100, 0)}%`).join(' e ')}, contra ${fmt(track.analysis.voice.score * 100, 0)}% na trilha-v2. Isto é classificação espectral e rítmica, não transcrição.
- A trilha-v2 já chega a RMS e pico comparáveis aos reels. O problema mensurável não é falta de volume. É o balanço: ${fmt(track.analysis.frequency.bands.sub)}% da energia está abaixo de 80 Hz, contra ${results.map((item) => `${fmt(item.analysis.frequency.bands.sub)}%`).join(' e ')} nas referências, enquanto médio e presença ficam menores.
- A densidade de onsets é ${fmt(results[0].analysis.onsets.length / results[0].analysis.duration, 2)} por segundo no Reel 1, ${fmt(results[1].analysis.onsets.length / results[1].analysis.duration, 2)} no Reel 2 e ${fmt(track.analysis.onsets.length / track.analysis.duration, 2)} na trilha-v2. As referências pontuam mais microeventos sem necessariamente colocar sub em cada um.
- Só ${fmt(results[0].cutComparison.ratio * 100, 0)}% e ${fmt(results[1].cutComparison.ratio * 100, 0)}% dos cortes detectados coincidem com onset forte na tolerância rígida de 80 ms. A lição é hierarquia, não sincronizar cada corte com uma batida grande.
- O ganho mais transferível não é copiar timbre ou melodia. É reduzir a simultaneidade de notas, reservar silêncio ou cauda curta antes dos marcos, concentrar sub e grave nos impactos e usar efeitos de interface, whooshes e transientes como pontuação do motion.

## Receita concreta para a trilha-v3 do Complexo SC

### Direção

- Pulso: ${suggestedBpm} BPM em 4/4. Use meio-tempo perceptivo nos trechos institucionais e subdivisão apenas nos builds.
- Duração: 30 s.
- Princípio: apresentação de nova marca, com poucos motivos, contraste alto, impacto grave controlado e espaço real para texto e locução eventual.
- Não reutilizar melodias, samples ou desenho sonoro identificável das referências. Transferir somente arquitetura de energia, densidade e função dos eventos.

### Estrutura por segundos

| Tempo | Função | Camadas e ação |
|---|---|---|
| 0,00 a 1,20 s | Suspensão | Ar filtrado, ruído de sala muito baixo e um tom de marca. Sem kick. Crescendo curto a partir de 0,65 s. |
| 1,20 s | Primeiro impacto | Sub curto, hit médio, clique de interface e cauda de 450 ms. Retirar o som nos 80 ms anteriores. |
| 1,20 a 5,40 s | Apresentação | Pad simples, baixo em notas longas e no máximo um motivo de 3 notas. Um pulso discreto a cada 2 tempos. |
| 5,40 a 5,90 s | Respiro | Cortar baixo e bateria. Manter apenas cauda e um detalhe estéreo. |
| 5,90 s | Segundo impacto | Whoosh de entrada, sub de 45 a 60 Hz, hit de corpo e tick agudo alinhado ao corte principal. |
| 5,90 a 12,00 s | Corpo A | Groove mínimo em meio-tempo, baixo sincopado leve, textura tecnológica e efeitos de UI nos pontos de motion. |
| 12,00 a 12,35 s | Respiro | Pausa de 200 a 350 ms, deixando somente pré-cauda reversa. |
| 12,35 a 19,20 s | Corpo B | Reintroduzir kick e uma camada harmônica adicional. Automatizar abertura de filtro, sem aumentar a quantidade de notas. |
| 19,20 a 21,00 s | Queda | Retirar kick, sub e hats. Piano ou timbre de assinatura com uma nota por mudança de frase. |
| 21,00 a 25,80 s | Build | Riser em duas etapas, pulsos de caixa espaçados que aceleram só depois de 24,00 s e automação de largura estéreo. |
| 25,80 a 26,00 s | Vácuo | Silêncio quase total de 120 a 180 ms antes do fecho. |
| 26,00 s | Impacto de marca | Maior impacto, com sub, corpo, presença e brilho em camadas separadas. Evitar cauda grave longa. |
| 26,00 a 30,00 s | Assinatura e saída | Acorde aberto, motivo de 3 notas em versão final, textura de brilho e fade limpo a partir de 28,20 s. |

### Impactos e respiros

- Impactos principais: 1,20 s, 5,90 s, 12,35 s e 26,00 s.
- Acentos secundários: 8,30 s, 10,70 s, 15,20 s, 18,00 s, 22,40 s e 24,60 s. Eles devem usar clique, hit curto ou whoosh, sem sub em todos.
- Respiros: 5,40 a 5,90 s, 12,00 a 12,35 s, 19,20 a 21,00 s e 25,80 a 26,00 s.
- Regra de edição: cada impacto principal deve ter ataque preciso. A cauda pode atravessar o corte, mas o sub deve decair antes do evento seguinte.

### Meta de energia por faixa

As metas partem da média medida nas duas referências, com faixa operacional de aproximadamente 18%, e devem ser conferidas por ouvido em caixas pequenas e fones.

| Faixa | Meta de participação | Função e controle |
|---|---:|---|
| Sub <80 Hz | ${fmt(target.ranges.sub[0])}% a ${fmt(target.ranges.sub[1])}% | Concentrar nos quatro impactos principais. Filtro passa-altas em 28 a 32 Hz. |
| Grave 80-250 Hz | ${fmt(target.ranges.grave[0])}% a ${fmt(target.ranges.grave[1])}% | Corpo do hit e baixo. Evitar sobreposição contínua entre kick e baixo. |
| Médio 250 Hz-2 kHz | ${fmt(target.ranges.medio[0])}% a ${fmt(target.ranges.medio[1])}% | Identidade harmônica. Abrir espaço entre 500 Hz e 1,5 kHz se houver locução. |
| Presença 2-6 kHz | ${fmt(target.ranges.presenca[0])}% a ${fmt(target.ranges.presenca[1])}% | Cliques, definição dos hits e legibilidade em celular. Controlar aspereza. |
| Brilho >6 kHz | ${fmt(target.ranges.brilho[0])}% a ${fmt(target.ranges.brilho[1])}% | Ar, hats e transições. Usar em rajadas, não como camada constante. |

### Níveis e master

- Master provisório: cerca de -14 LUFS integrados e pico verdadeiro abaixo de -1 dBTP.
- Impactos principais: pico de 4 a 7 dB acima do RMS do bloco imediatamente anterior.
- Respiros: queda de 6 a 12 dB no RMS por pelo menos 200 ms.
- Sub: mono abaixo de 100 Hz. Sidechain curto no pad e no baixo, com recuperação entre 100 e 180 ms.
- Efeitos de UI: 6 a 10 dB abaixo do impacto principal, com alternância estéreo acima de 250 Hz.
- Locução futura: reservar o centro, reduzir 2 a 4 dB em 700 Hz a 3 kHz por sidechain dinâmico quando houver voz.

## Método e limitações

- RMS em dBFS não é LUFS. A comparação é consistente entre os arquivos, mas não substitui medidor BS.1770.
- A FFT usa o áudio mono. Ela mede distribuição de energia, não separa voz, música e efeitos.
- Voz falada é um indício calculado por concentração espectral, taxa de cruzamento por zero e densidade de onsets. Música com synth ou guitarra na faixa vocal pode elevar o escore.
- BPM vem de histograma de intervalos entre onsets fortes. Fala, edição livre e efeitos podem produzir metade, dobro ou alternativa próxima do pulso real.
- Cortes são detectados por diferença média entre quadros em cinza 64x114, decodificados pelo ffmpeg e comparados em Node. Transições suaves, flashes, motion interno e cortes com enquadramento parecido podem gerar falsos negativos ou positivos.
- O casamento corte x impacto usa tolerância rígida de 80 ms e não considera antecipações criativas maiores.
- As legendas disponíveis descrevem os posts, mas não trazem timecodes. Por isso não foram usadas para afirmar palavras faladas em instantes específicos.
`;
  if (report.includes('—') || report.includes('–')) throw new Error('O relatório contém travessão ou meia-risca.');
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
}

function main() {
  assertInputs();
  const results = [];
  for (const reel of REELS) {
    console.log(`Analisando ${reel.id}...`);
    const metadata = probe(reel.video);
    const duration = Number(metadata.format.duration);
    const wav = extractAudio(reel);
    const frames = extractFrames(reel, duration);
    const scene = detectSceneCuts(reel.video, duration, metadata);
    const analysis = analyzeWav(wav, reel.id);
    const cutComparison = compareCuts(scene.cuts, analysis.onsets);
    results.push({ ...reel, metadata, wav, frames, scene, analysis, cutComparison });
  }
  console.log('Analisando trilha-v2...');
  const trackAnalysis = analyzeWav(TRACK.wav, TRACK.id);
  const track = { ...TRACK, analysis: trackAnalysis };
  generateReport(results, track);
  console.log(`Relatório gerado: ${REPORT_PATH}`);
  for (const result of results) {
    console.log(`${result.id}: ${result.analysis.onsets.length} onsets, ${result.scene.cuts.length} cortes, BPM ${result.analysis.bpm.bpm ?? 'n/d'}`);
  }
  console.log(`trilha-v2: ${track.analysis.onsets.length} onsets, BPM ${track.analysis.bpm.bpm ?? 'n/d'}`);
}

main();
