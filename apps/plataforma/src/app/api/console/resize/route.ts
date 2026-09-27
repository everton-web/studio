import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { resizeSession } from "@/lib/console";

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, cols, rows } = await req.json();
  resizeSession(id, Math.max(20, cols), Math.max(5, rows));
  return NextResponse.json({ ok: true });
}