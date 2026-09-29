import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { listarClientes } from "@/lib/clientes";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  return NextResponse.json({ clientes: await listarClientes() });
}
