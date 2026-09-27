import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { saveFile } from "@/lib/files";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "arquivo ausente" }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ ok: false, error: "máx. 25MB" }, { status: 400 });
  const info = await saveFile(file);
  return NextResponse.json({ ok: true, ...info });
}