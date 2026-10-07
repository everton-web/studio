import { Easing } from "remotion";

export const cor = {
  bg: "#0a0a0b", // carvão, fundo de tudo
  bgSoft: "#0e0e10",
  card: "#151517",
  elevado: "#1d1d20",
  texto: "#edede8", // osso, branco quente
  texto2: "#98988f", // pedra, parágrafos
  mudo: "rgba(237,237,232,0.34)",
  linha: "rgba(255,255,255,0.055)",
  linhaEscura: "rgba(10,10,11,0.1)", // borda de cartão sobre fundo osso
  laranja: "#FF4000", // única cor de ação
  brilho: "rgba(255,64,0,0.15)",
  ponto: "rgba(255,255,255,0.05)",
  pontoEscuro: "rgba(10,10,11,0.07)",
};

export const ease = { out: [0.16, 1, 0.3, 1], inOut: [0.76, 0, 0.24, 1] } as const;
export const easeOut = Easing.bezier(...ease.out);
export const easeInOut = Easing.bezier(...ease.inOut);

export const fonte = "Inter, sans-serif";

// Números da cena de contadores. Troque aqui se quiser outros.
export const contadores = [
  { valor: "100%", legenda: "online" },
  { valor: "27", legenda: "estados ao alcance" },
];

// Duração de cada cena em frames (30 fps, total 900).
export const duracoes = {
  palavras: 36,
  simbolo: 84,
  tunel: 90,
  marquee: 84,
  cards: 96,
  contadores: 84,
  manifesto: 90,
  identidade: 90,
  logo: 150,
};
