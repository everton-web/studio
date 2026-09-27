import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const DIR = join(VAULT, "SaaS", "Tráfego");
const FILE = join(DIR, "campanhas.json");

export type Campanha = {
  id: string;
  nome: string;
  canal: string; // meta | google | tiktok | outro
  investimento: number;
  cliques: number;
  conversoes: number;
  status: string; // ativa | pausada
  criada: string;
};

async function ler(): Promise<Campanha[]> {
  try { return JSON.parse(await readFile(FILE, "utf8")); } catch { return []; }
}
async function salvar(lista: Campanha[]) {
  try { await mkdir(DIR, { recursive: true }); await writeFile(FILE, JSON.stringify(lista, null, 2), "utf8"); } catch { /* sem vault */ }
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  return NextResponse.json({ campanhas: await ler() });
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ ok: false, error: "ação ausente" }, { status: 400 });

  const lista = await ler();
  if (body.action === "add") {
    const c: Campanha = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: String(body.nome || "").trim(),
      canal: String(body.canal || "meta"),
      investimento: Number(body.investimento) || 0,
      cliques: Number(body.cliques) || 0,
      conversoes: Number(body.conversoes) || 0,
      status: body.status === "pausada" ? "pausada" : "ativa",
      criada: new Date().toLocaleDateString("pt-BR"),
    };
    if (!c.nome) return NextResponse.json({ ok: false, error: "nome ausente" }, { status: 400 });
    lista.unshift(c);
    await salvar(lista);
    return NextResponse.json({ ok: true, campanha: c }, { status: 201 });
  }
  if (body.action === "update" || body.action === "update-status") {
    const c = lista.find((x) => x.id === body.id);
    if (!c) return NextResponse.json({ ok: false, error: "campanha não encontrada" }, { status: 404 });
    if (body.action === "update-status") {
      c.status = body.status === "pausada" ? "pausada" : "ativa";
    } else {
      if (body.nome !== undefined) c.nome = String(body.nome).trim();
      if (body.canal !== undefined) c.canal = String(body.canal);
      if (body.investimento !== undefined) c.investimento = Number(body.investimento) || 0;
      if (body.cliques !== undefined) c.cliques = Number(body.cliques) || 0;
      if (body.conversoes !== undefined) c.conversoes = Number(body.conversoes) || 0;
      if (body.status !== undefined) c.status = body.status === "pausada" ? "pausada" : "ativa";
    }
    await salvar(lista);
    return NextResponse.json({ ok: true, campanha: c });
  }
  if (body.action === "delete") {
    await salvar(lista.filter((x) => x.id !== body.id));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "ação desconhecida" }, { status: 400 });
}