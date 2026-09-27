import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { listarFila, novaDemanda, atribuir, removerDemanda, mensagensSala, postarSala, estadoAgentes } from "@/lib/orquestra";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  return NextResponse.json({
    fila: await listarFila(),
    sala: await mensagensSala(),
    agentes: await estadoAgentes(),
  });
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ ok: false, error: "ação ausente" }, { status: 400 });

  if (body.action === "nova") {
    const texto = String(body.texto || "").trim();
    if (!texto) return NextResponse.json({ ok: false, error: "texto vazio" }, { status: 400 });
    const d = await novaDemanda({ texto, atribuido: body.atribuido, ia: body.ia });
    return NextResponse.json({ ok: true, demanda: d }, { status: 201 });
  }
  if (body.action === "atribuir") {
    const d = await atribuir({ id: String(body.id), agente: body.agente, status: body.status });
    if (!d) return NextResponse.json({ ok: false, error: "demanda não encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true, demanda: d });
  }
  if (body.action === "remover") {
    await removerDemanda(String(body.id));
    return NextResponse.json({ ok: true });
  }
  if (body.action === "sala") {
    const m = await postarSala({ de: String(body.de || "everton"), texto: String(body.texto || "").trim(), para: body.para });
    return NextResponse.json({ ok: true, mensagem: m });
  }
  return NextResponse.json({ ok: false, error: "ação desconhecida" }, { status: 400 });
}