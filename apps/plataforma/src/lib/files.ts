import { readdir, writeFile, unlink, stat, mkdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

export const DIR = process.env.ARQUIVOS_DIR || "D:/Obsidian - Claude/🏢 Agência/_Arquivos";

export async function ensureDir() {
  await mkdir(DIR, { recursive: true });
}

export async function listFiles() {
  await ensureDir();
  const entries = await readdir(DIR, { withFileTypes: true });
  const out: { name: string; size: number; modified: string; ext: string }[] = [];
  for (const e of entries) {
    if (!e.isFile() || e.name.startsWith(".")) continue;
    const st = await stat(join(DIR, e.name));
    out.push({
      name: e.name,
      size: st.size,
      modified: st.mtime.toISOString(),
      ext: extname(e.name).slice(1).toLowerCase(),
    });
  }
  return out.sort((a, b) => b.modified.localeCompare(a.modified));
}

async function uniqueName(name: string) {
  const existing = new Set(await readdir(DIR));
  const base = (name || "arquivo").replace(/[^\w.\- ]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "arquivo";
  if (!existing.has(base)) return base;
  const idx = base.lastIndexOf(".");
  const stem = idx > 0 ? base.slice(0, idx) : base;
  const ext = idx > 0 ? base.slice(idx) : "";
  let i = 1;
  while (existing.has(`${stem}-${i}${ext}`)) i++;
  return `${stem}-${i}${ext}`;
}

export async function saveFile(file: File) {
  await ensureDir();
  const name = await uniqueName(file.name);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(join(DIR, name), buf);
  return { name, size: buf.length };
}

// impede path traversal: mantém apenas o nome-base do arquivo dentro de DIR
export function safeName(name: string): string {
  const base = String(name || "").replace(/\\/g, "/").split("/").pop() || "";
  return base.replace(/[^\w.\- ]/g, "").replace(/^\.+/, "").trim();
}

export async function deleteFile(name: string) {
  const safe = safeName(name);
  if (!safe) throw new Error("nome inválido");
  await unlink(join(DIR, safe));
  return true;
}

export async function readFileAsBuffer(name: string) {
  const safe = safeName(name);
  if (!safe) throw new Error("nome inválido");
  return readFile(join(DIR, safe));
}

const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
  pdf: "application/pdf", csv: "text/csv", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword", txt: "text/plain", md: "text/markdown", json: "application/json", zip: "application/zip",
  mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", wav: "audio/wav",
};

export function mimeFor(name: string) {
  return MIME[extname(name).slice(1).toLowerCase()] || "application/octet-stream";
}