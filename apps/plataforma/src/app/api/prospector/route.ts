import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { prospectar, prospectorStatus, progressoAtual } from "@/lib/prospector";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  return NextResponse.json({ ...(await prospectorStatus()), progresso: progressoAtual });
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { /* vazio */ }
  try {
    const res = await prospectar({ nicho: body.nicho, cidade: body.cidade, regiao: body.regiao, limite: body.limite });
    return NextResponse.json({ ok: true, resumo: res });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "erro ao prospectar" }, { status: 500 });
  }
}