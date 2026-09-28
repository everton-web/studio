// Fonte única da lógica de data/preço da promoção "Mês do Zeca".
// Usado tanto no servidor quanto no cliente.

export const PROMO_FIM = new Date("2026-09-30T23:59:59-03:00");

export function promoAtiva(now: Date = new Date()): boolean {
  return now.getTime() < PROMO_FIM.getTime();
}

export function precoComDesconto(preco: number): number {
  return Math.floor(preco * 0.8); // 20% OFF, mantém final 7
}

export function formatBRL(valor: number): string {
  return "R$ " + valor.toLocaleString("pt-BR");
}
