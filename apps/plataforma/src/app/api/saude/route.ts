import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { lerSaude } from "@/lib/saude";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  return NextResponse.json({ alertas: await lerSaude() });
}
