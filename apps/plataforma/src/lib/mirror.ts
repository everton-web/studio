import { stat, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export type MirrorEvent =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "tool"; text: string }
  | { kind: "result"; text: string }
  | { kind: "note"; text: string };

// a sessão do pi mais recente da pasta P R O J E T O   D I G I T A L
export async function findSessionFile(): Promise<string | null> {
  const dir = join(homedir(), ".pi", "agent", "sessions");
  let best: string | null = null;
  let bestMt = 0;
  const folders = await readdir(dir).catch(() => []);
  for (const f of folders) {
    if (!f.includes("PROJETO DIGITAL")) continue;
    const files = await readdir(join(dir, f)).catch(() => []);
    for (const ff of files.filter((x) => x.endsWith(".jsonl"))) {
      const st = await stat(join(dir, f, ff)).catch(() => null);
      if (st && st.mtimeMs > bestMt) {
        bestMt = st.mtimeMs;
        best = join(dir, f, ff);
      }
    }
  }
  return best;
}

export function parseLine(line: string): MirrorEvent[] | MirrorEvent | null {
  try {
    const j: any = JSON.parse(line);
    if (j.type !== "message") return null;
    const m: any = j.message || {};
    const role: string = m.role || j.role || "";
    const parts: any[] = Array.isArray(m.content) ? (m.content as any[]) : m.content ? [m.content] : [];

    if (role === "user") {
      const text = parts.filter((c: any) => c.type === "text").map((c: any) => c.text || "").join(" ").trim();
      return text ? { kind: "user", text } : null;
    }
    if (role === "assistant") {
      const out: MirrorEvent[] = [];
      const text = parts.filter((c: any) => c.type === "text").map((c: any) => c.text || "").join("");
      const tools = parts.filter((c: any) => c.type === "toolCall").map((c: any) => c.name || "tool");
      if (text) out.push({ kind: "assistant", text });
      for (const t of tools) out.push({ kind: "tool", text: t });
      return out.length ? out : null;
    }
    if (role === "toolResult") {
      const text = (parts.filter((c: any) => c.type === "text").map((c: any) => c.text || "").join("") || "").split("\n")[0].trim();
      return text ? { kind: "result", text: text.slice(0, 160) } : null;
    }
    return null;
  } catch {
    return null;
  }
}

// lê um trecho do fim do arquivo e devolve { events, nextOffset }
export async function readTail(file: string, bytes = 200_000) {
  const st = await stat(file);
  const start = Math.max(0, st.size - bytes);
  const fd = await import("node:fs/promises").then((m) => m.open(file, "r"));
  const buf = Buffer.alloc(st.size - start);
  await fd.read(buf, 0, buf.length, start);
  await fd.close();
  const events: MirrorEvent[] = [];
  for (const line of buf.toString("utf8").split("\n")) {
    const evs = parseLine(line);
    if (evs) events.push(...(Array.isArray(evs) ? evs : [evs]));
  }
  return { events: events.slice(-40), nextOffset: st.size };
}