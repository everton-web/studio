import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { readFileAsBuffer, deleteFile, mimeFor } from "@/lib/files";

export const dynamic = "force-dynamic";

// GET → baixar/abrir um arquivo
export async function GET(_req: Request, { params }: { params: Promise<{ name: string[] }> }) {
  if (!(await isAuthed())) return new Response("unauthorized", { status: 401 });
  const name = (await params).name[0];
  try {
    const buf = await readFileAsBuffer(name);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": mimeFor(name),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}

// DELETE → remover
export async function DELETE(_req: Request, { params }: { params: Promise<{ name: string[] }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const name = (await params).name[0];
  try {
    await deleteFile(name);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "não encontrado" }, { status: 404 });
  }
}