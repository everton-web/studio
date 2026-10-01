// Estado compartilhado do scroll: o ScrollSetup escreve a velocidade do Lenis aqui
// e as faixas (parceiros, tipografia cinética) leem no ticker do GSAP.
export const scrollMotion = {
  /** Velocidade do Lenis em px por frame, com decaimento suave quando o scroll para. */
  velocity: 0,
};

/** Limita um número a um intervalo. */
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
