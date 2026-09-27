import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { writeSession } from "@/lib/console";

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, data } = await req.json();
  if (!id || typeof data !== "string") return NextResponse.json({ error: "id/data ausentes" }, { status: 400 });
  writeSession(id, data);
  return NextResponse.json({ ok: true });
}