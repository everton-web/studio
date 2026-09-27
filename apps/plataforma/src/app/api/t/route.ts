import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

// pixel 1x1 transparente — rastreia instalação do trecho nos sites do ecossistema.
// Cada hit incrementa o contador do site (arquivo JSON no vault, fonte da verdade).
const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const FILE = join(VAULT, "SaaS", "Rastreamento", "hits.json");

const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

// throttle anti-abuso: 1 contagem por IP+site a cada 5s (recarregar não infla)
const JANELA_MS = 5000;
const vistos = new Map<string, number>();

async function hit(site: string) {
  let data: Record<string, { n: number; primeiro: string; ultimo: string }> = {};
  try { data = JSON.parse(await readFile(FILE, "utf8")); } catch { /* primeiro hit */ }
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const cur = data[site] || { n: 0, primeiro: now, ultimo: now };
  cur.n += 1;
  cur.ultimo = now;
  data[site] = cur;
  try {
    await mkdir(join(VAULT, "SaaS", "Rastreamento"), { recursive: true });
    await writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
  } catch { /* sem vault, sem contador — não quebra o pixel */ }
  return cur;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const site = (url.searchParams.get("site") || "desconhecido").slice(0, 80).replace(/[^a-z0-9._-]/gi, "");
  if (site) {
    const fwd = req.headers.get("x-forwarded-for");
    const ip = (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip") || "local").trim();
    const chave = `${ip}|${site}`;
    const agora = Date.now();
    if (vistos.size > 5000) vistos.clear();
    if ((vistos.get(chave) || 0) + JANELA_MS <= agora) {
      vistos.set(chave, agora);
      await hit(site);
    }
  }
  return new NextResponse(GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, max-age=0",
      "Access-Control-Allow-Origin": "*",
    },
  });
}