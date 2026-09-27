import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getOrCreateSession, killSession } from "@/lib/console";

// anexar (não cria novo — retorna o agente vivo compartilhado)
export async function POST() {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = getOrCreateSession();
  return NextResponse.json({ id: s.id });
}

// reiniciar o agente vivo
export async function DELETE(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json();
  killSession(id);
  return NextResponse.json({ ok: true });
}