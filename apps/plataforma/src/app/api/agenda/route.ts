import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { listarReunioes, criarReuniao } from "@/lib/reunioes";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  return NextResponse.json({ reunioes: await listarReunioes() });
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const titulo = String(body?.titulo || "").trim();
  const quando = String(body?.quando || "").trim();
  if (!titulo) return NextResponse.json({ ok: false, error: "título ausente" }, { status: 400 });
  if (!quando) return NextResponse.json({ ok: false, error: "quando ausente" }, { status: 400 });

  const duracao = Number(body?.duracao);
  const reuniao = await criarReuniao({
    titulo,
    quando,
    duracao: Number.isFinite(duracao) ? duracao : undefined,
    participante: body?.participante ? String(body.participante) : undefined,
  });
  return NextResponse.json({ ok: true, reuniao }, { status: 201 });
}
