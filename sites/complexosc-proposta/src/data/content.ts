import { publicPath } from "@/lib/public-path";

// Fonte única dos dados do protótipo. Tudo que não foi confirmado com a clínica fica marcado como pendente
// e aparece na página com o estilo .pend (nada inventado).

export const site = {
  title: "Complexo SC · Cirurgia plástica e estética em Fortaleza",
  description:
    "Há 17 anos cuidando das pessoas em Fortaleza: cirurgia plástica, estética e o Método RPP, com centro cirúrgico próprio. Protótipo de proposta.",
  cta: "Agendar avaliação",
  ctaHref: "#contato",
  instagram: "https://www.instagram.com/complexosc_/",
  endereco: "Rua Barão de Aracati, 1304, Aldeota, Fortaleza, CE",
};

export const selos = [
  { forte: "17 anos", leve: "cuidando das pessoas" },
  { forte: "+ de 20 mil", leve: "autoestimas renovadas" },
  { forte: "Centro cirúrgico", leve: "próprio, dentro do Complexo" },
  { forte: "Dr. Valderi Vieira", leve: "CRM 8688 · RQE 4045" },
];

export type Passo = {
  n: string;
  titulo: string;
  texto: string;
  midia: { img: string; video?: string; alt: string; legenda: string; pendente?: string };
};

// Fluxo descrito pelo próprio Dr. Valderi na legenda do caso de mastopexia com prótese (Instagram, set/2026).
export const passosMama: Passo[] = [
  {
    n: "01",
    titulo: "Consulta e expectativa alinhada",
    texto:
      "Cada dúvida respondida com calma. A conversa mostra com honestidade o que a cirurgia pode entregar, como é a recuperação e o que esperar em cada fase.",
    midia: { img: publicPath("/img/consulta.webp"), video: publicPath("/media/loop-consulta.mp4"), alt: "Consulta no Complexo SC, com a profissional e a paciente à mesa", legenda: "Consulta no Complexo SC" },
  },
  {
    n: "02",
    titulo: "Planejamento da proporção",
    texto:
      "A indicação nasce da sua anatomia e do que você deseja: prótese, mastopexia ou as duas juntas, sempre em proporção ao corpo.",
    midia: { img: publicPath("/img/congresso.webp"), alt: "Dr. Valderi Vieira com cirurgiões no Congresso Mundial de Implantes Ergonômicos", legenda: "Congresso Mundial de Implantes Ergonômicos, Istambul" },
  },
  {
    n: "03",
    titulo: "Centro cirúrgico próprio",
    texto:
      "A cirurgia acontece dentro do Complexo, com equipe anestésica e protocolos hospitalares. Depois, a recuperação segue em apartamento reservado.",
    midia: { img: publicPath("/img/apartamento.webp"), alt: "Apartamento de recuperação do Complexo SC", legenda: "Apartamento de recuperação", pendente: "Foto do centro cirúrgico a produzir" },
  },
  {
    n: "04",
    titulo: "Pós-operatório acompanhado",
    texto:
      "O cuidado não termina na cirurgia. Retornos, reencontros e flores: cada etapa do pós é acompanhada de perto pela equipe.",
    midia: { img: publicPath("/img/pos-flores.webp"), video: publicPath("/media/loop-flores.mp4"), alt: "Dr. Valderi Vieira entrega flores a uma paciente no pós-operatório", legenda: "Retorno no pós-operatório" },
  },
];

export const avisoEtico =
  "Imagens divulgadas com autorização expressa da paciente. Cada pessoa é única: o tratamento é individualizado e os resultados variam conforme anatomia, qualidade da pele e hábitos de vida. Conteúdo informativo, conforme a Resolução CFM nº 2.336/2023.";

export type Bastidor = { img: string; video?: string; alt: string; legenda: string; origem: string };

export const bastidores: Bastidor[] = [
  { img: publicPath("/media/loop-cafe.webp"), video: publicPath("/media/loop-cafe.mp4"), alt: "Café servido com flor durante o atendimento", legenda: "Café servido com flor", origem: "@complexosc_" },
  { img: publicPath("/img/pos-flores-2.webp"), alt: "Paciente recebe flores do Dr. Valderi no retorno", legenda: "Flores no retorno", origem: "@drvalderivieiraplastica" },
  { img: publicPath("/img/consulta-2.webp"), alt: "Consulta com a fisioterapeuta do Complexo SC", legenda: "Escuta antes do tratamento", origem: "@complexosc_" },
  { img: publicPath("/img/nova-era-1.webp"), alt: "Equipe com camisetas vinho no evento A Nova Era", legenda: "Evento A Nova Era", origem: "@complexosc_" },
  { img: publicPath("/img/cafe.webp"), alt: "Profissional recebe café no consultório", legenda: "Pausa no consultório", origem: "@complexosc_" },
  { img: publicPath("/img/nova-era-2.webp"), alt: "Equipe brinda no evento A Nova Era", legenda: "Juntos rumo ao extraordinário", origem: "@complexosc_" },
  { img: publicPath("/img/nova-era-3.webp"), alt: "Equipe recebe convidados no evento A Nova Era", legenda: "Missão, visão e valores", origem: "@complexosc_" },
];

export type Pessoa = { nome: string; pendNome?: string; cargo: string; pendCargo?: string; registro: string; pendRegistro?: string; foto?: string; bio: string };

export const equipe: Pessoa[] = [
  { nome: "Valderi Vieira", cargo: "Cirurgião plástico", registro: "CRM 8688 · RQE 4045", foto: publicPath("/img/retrato-valderi.webp"), bio: "Há 21 anos na cirurgia plástica, com foco em resultados naturais." },
  { nome: "Andreia Mendes", cargo: "Médica, pele e rejuvenescimento", registro: "CRM 9683 · RQE", pendRegistro: "a confirmar", foto: publicPath("/img/retrato-andreia.webp"), bio: "Tecnologias como Morpheus, laser CO2 e peelings." },
  { nome: "Olga Vieira", pendNome: "confirmar nome", cargo: "Fisioterapeuta, criadora do Método RPP", registro: "CREFITO 123.553", foto: publicPath("/img/retrato-olga.webp"), bio: "Pós-parto e pós-operatório, com foco na recuperação." },
  { nome: "Diana Saboya", cargo: "Fisioterapeuta", pendCargo: "confirmar área", registro: "CREFITO 115.958", bio: "Retrato individual a produzir na sessão de fotos." },
];
