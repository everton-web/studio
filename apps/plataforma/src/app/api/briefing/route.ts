import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { isAuthed } from "@/lib/auth";

// Abre o material de uma demanda (briefing, posts para aprovar) direto do app.
// Só lê .md dentro de docs/ do projeto, e só com sessão.
const RAIZ = resolve(process.env.AGENCIA_CWD || resolve(process.cwd(), "..", ".."));
const DOCS = resolve(RAIZ, "docs");

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const caminho = new URL(req.url).searchParams.get("path") || "";
  const alvo = resolve(RAIZ, caminho);
  if (!caminho.endsWith(".md") || !alvo.startsWith(DOCS + sep)) {
    return NextResponse.json({ ok: false, error: "caminho não permitido" }, { status: 400 });
  }
  try {
    const texto = await readFile(alvo, "utf8");
    return new NextResponse(texto, { headers: { "content-type": "text/plain; charset=utf-8" } });
  } catch {
    return NextResponse.json({ ok: false, error: "arquivo não encontrado" }, { status: 404 });
  }
}
