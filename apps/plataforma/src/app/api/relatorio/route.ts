import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { exportarRelatorio } from "@/lib/relatorio";

// POST { id, slug? } → exporta o JSON público enxuto e grava `relatorio: <url>` na ficha
export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  let body: { id?: string; slug?: string } = {};
  try { body = await req.json(); } catch { /* vazio */ }
  try {
    const r = await exportarRelatorio(String(body.id || ""), body.slug);
    return NextResponse.json({ ok: true, ...r });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "erro ao exportar relatório" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "método não permitido" }, { status: 405 });
}
