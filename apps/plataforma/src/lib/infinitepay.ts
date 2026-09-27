// InfinitePay — núcleo compartilhado: criação de link, webhook e placar automático.
// Docs: https://www.infinitepay.io/checkout-documentacao

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
export const DIR = join(VAULT, "SaaS", "Financeiro");
export const HANDLE = process.env.INFINITEPAY_HANDLE || "";
export const REDIRECT = process.env.INFINITEPAY_REDIRECT_URL || "";
export const WEBHOOK_URL = process.env.INFINITEPAY_WEBHOOK_URL || "https://app.evertonbrito.com/api/infinitepay/webhook";
const API_LINKS = "https://api.checkout.infinitepay.io/links";
const API_CHECK = "https://api.checkout.infinitepay.io/payment_check";

export type Registro = {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  quantidade: number;
  url: string | null;
  handle: string;
  ok: boolean;
  erro?: string;
  order_nsu?: string;
  slug?: string;
  paid?: boolean;
  paidAt?: string;
  capture_method?: string;
};

export function gerarOrderNsu() {
  return `ag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function lerHistorico(): Promise<Registro[]> {
  try {
    const files = (await readdir(DIR)).filter((f) => f.endsWith(".json") && !f.startsWith("."));
    const out: Registro[] = [];
    for (const f of files.sort().reverse().slice(0, 30)) {
      try {
        const r = JSON.parse(await readFile(join(DIR, f), "utf8"));
        if (r.order_nsu) out.push(r);
      } catch { /* pula */ }
    }
    return out;
  } catch { return []; }
}

export async function criarLink(op: {
  descricao: string; valor: number; quantidade?: number;
  order_nsu?: string; customer?: { nome?: string; email?: string; telefone?: string };
}): Promise<Registro> {
  const payload: Record<string, unknown> = {
    handle: HANDLE,
    items: [{ quantity: Math.max(1, Math.min(999, op.quantidade || 1)), price: Math.round(op.valor * 100), description: op.descricao }],
    order_nsu: op.order_nsu || gerarOrderNsu(),
    webhook_url: WEBHOOK_URL,
  };
  if (REDIRECT) payload.redirect_url = REDIRECT;
  if (op.customer && (op.customer.nome || op.customer.email || op.customer.telefone)) {
    payload.customer = {
      name: op.customer.nome || "",
      email: op.customer.email || "",
      phone_number: op.customer.telefone || "",
    };
  }

  const registro: Registro = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    data: new Date().toLocaleString("pt-BR"),
    descricao: op.descricao,
    valor: Math.round(op.valor * 100) / 100,
    quantidade: Math.max(1, Math.min(999, op.quantidade || 1)),
    url: null,
    handle: HANDLE,
    ok: false,
    order_nsu: payload.order_nsu as string,
  };

  try {
    const res = await fetch(API_LINKS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const txt = await res.text();
    const json = txt ? JSON.parse(txt) : {};
    const url = json?.link_url || json?.url || json?.checkout_url || json?.payment_url || json?.data?.url || null;
    registro.ok = res.ok || !!url;
    registro.url = typeof url === "string" ? url : null;
    registro.slug = typeof json?.slug === "string" ? json.slug : undefined;
    registro.erro = !registro.ok ? (json?.message || json?.error || `HTTP ${res.status}: ${txt.slice(0, 200)}`) : undefined;
    await salvar(registro);
    return registro;
  } catch (e: any) {
    registro.erro = `Falha ao falar com a InfinitePay: ${e?.message || e}`;
    await salvar(registro);
    return registro;
  }
}

export async function consultarStatus(r: Registro) {
  const body = { handle: r.handle, order_nsu: r.order_nsu, transaction_nsu: "", slug: r.slug || "" };
  const res = await fetch(API_CHECK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  return res.json();
}

export async function salvar(r: Registro) {
  try { await mkdir(DIR, { recursive: true }); await writeFile(join(DIR, `${r.id}.json`), JSON.stringify(r, null, 2), "utf8"); } catch { /* sem vault */ }
}

export async function acharRegistro(chave: string): Promise<{ file: string; r: Registro } | null> {
  try {
    const files = (await readdir(DIR)).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      try {
        const r = JSON.parse(await readFile(join(DIR, f), "utf8"));
        if (r.order_nsu === chave || r.slug === chave) return { file: join(DIR, f), r };
      } catch { /* pula */ }
    }
  } catch { /* sem histórico */ }
  return null;
}

// webhook recebido da InfinitePay (pagamento aprovado) → grava + marca pago + Placar automático
export async function processarWebhook(body: any): Promise<{ novidade: boolean; registro?: Registro }> {
  const orderNsu = String(body?.order_nsu || "");
  const tx = String(body?.transaction_nsu || "");
  // idempotência: usa transaction_nsu; se ausente, cai para o order_nsu
  const chave = (tx || (orderNsu ? `order-${orderNsu}` : "")).replace(/[^\w.\-]/g, "");
  const dirWh = join(DIR, "webhooks");
  try {
    await mkdir(dirWh, { recursive: true });
    const ja = chave ? (await readdir(dirWh)).find((f) => f.includes(chave)) : null;
    if (ja) return { novidade: false };
    await writeFile(join(dirWh, `${Date.now()}-${chave || "semid"}.json`), JSON.stringify(body, null, 2), "utf8");
  } catch { /* sem vault */ }

  if (!orderNsu) return { novidade: false };
  const achado = await acharRegistro(orderNsu);
  if (!achado) return { novidade: false }; // webhook de pedido que não criamos — ignora

  const { file, r } = achado;
  const amount = Number(body?.paid_amount || body?.amount) / 100;
  const jaPago = !!r.paid;
  r.paid = true;
  r.paidAt = new Date().toLocaleString("pt-BR");
  r.capture_method = String(body?.capture_method || "");
  r.slug = r.slug || String(body?.invoice_slug || "");
  await salvar(r).catch(() => writeFile(file, JSON.stringify(r, null, 2), "utf8"));

  if (!jaPago && amount > 0) await atualizarPlacar(amount, r.descricao, r.capture_method);
  return { novidade: !jaPago, registro: r };
}

// Placar.md: soma ao acumulado do mês + linha de progresso
async function atualizarPlacar(valor: number, descricao: string, metodo: string) {
  const p = join(VAULT, "60 Financeiro", "Placar.md");
  try {
    let md = await readFile(p, "utf8");
    const metaM = md.match(/R\$\s*([\d.]+)\s*\/\s*R\$\s*([\d.]+)\)/);
    const meta = metaM ? Number(metaM[2].replace(/\./g, "")) : 100000;
    const atualM = md.match(/Progresso:\*\*\s*[\d.,]+%\s*\(R\$\s*([\d.]+)/i);
    const atual = atualM ? Number(atualM[1].replace(/\./g, "")) : 0;
    const novo = atual + Math.round(valor);
    const pct = Math.min(100, Math.round((novo / meta) * 1000) / 10);

    md = md.replace(
      /(Progresso:\*\*\s*)[\d.,]+%\s*\(R\$\s*[\d.]+(\s*\/\s*R\$\s*[\d.]+)\)/i,
      `$1${String(pct).replace(".", ",")}% (R$ ${novo.toLocaleString("pt-BR")}$2)` as string,
    );
    // linha do mês atual no Resumo (set/2026): atualiza Total e Acumulado
    const mes = new Date().toLocaleDateString("pt-BR", { month: "short" }) + "/" + new Date().getFullYear();
    const mesKey = mes.replace(".", "").toLowerCase();
    const rowRe = new RegExp(`(\\|\\s*${mesKey.replace("/", "/")}\\s*\\|\\s*R\\$ [\\d.]+\\s*\\|\\s*R\\$ [\\d.]+\\s*\\|\\s*)R\\$ [\\d.]+(\\s*\\|\\s*)R\\$ [\\d.]+(\\s*\\|)`);
    if (rowRe.test(md)) {
      md = md.replace(rowRe, `$1R$ ${novo.toLocaleString("pt-BR")}$2R$ ${novo.toLocaleString("pt-BR")}$3`);
    }
    await writeFile(p, md, "utf8");
  } catch { /* placar não encontrado — segue */ }
}