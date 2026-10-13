import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { prospectar, prospectorStatus } from "@/lib/prospeccao";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  return NextResponse.json(prospectorStatus());
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* vazio */ }
  try {
    const resumo = await prospectar({
      nicho: typeof body.nicho === "string" ? body.nicho : undefined,
      regiao: typeof body.regiao === "string" ? body.regiao : undefined,
      limite: typeof body.limite === "number" ? body.limite : Number(body.limite) || undefined,
    });
    return NextResponse.json({ ok: true, resumo });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "erro ao prospectar" }, { status: 500 });
  }
}
