// 84 BPM a 30 fps: um tempo = 900 / 42 = 21,43 quadros. Os cortes caem em tempos inteiros,
// os mesmos usados na trilha (scripts/trilha.mjs), então acorde e corte chegam juntos.
export const FPS = 30;
export const TEMPO = 900 / 42;
const t = (b: number) => Math.round(b * TEMPO);
export const CORTES = [0, 4, 7, 12, 17, 22, 28, 34, 38, 42].map(t);
export const DURACAO = 900;
export const cena = (i: number) => ({from: CORTES[i], dur: CORTES[i + 1] - CORTES[i]});
