import { isAuthed } from "@/lib/auth";
import { findSessionFile, parseLine, readTail } from "@/lib/mirror";
import { open, stat } from "node:fs/promises";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!(await isAuthed())) return new Response("unauthorized", { status: 401 });
  const file = await findSessionFile();
  if (!file) return new Response("sessão não encontrada", { status: 404 });

  const encoder = new TextEncoder();
  const { events, nextOffset } = await readTail(file);
  let offset = nextOffset;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const push = (obj: unknown) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)); } catch { /* fechado */ }
      };
      // histórico recente primeiro
      for (const ev of events) push(ev);
      push({ kind: "hb" });

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let buf = "";
      while (!closed) {
        const st = await stat(file).catch(() => null);
        if (st && st.size > offset) {
          const fd = await open(file, "r");
          const chunk = Buffer.alloc(st.size - offset);
          await fd.read(chunk, 0, chunk.length, offset);
          await fd.close();
          offset = st.size;
          buf += chunk.toString("utf8");
          let nl;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            const evs = parseLine(line);
            if (evs) {
              const arr = Array.isArray(evs) ? evs : [evs];
              for (const ev of arr) push(ev);
            }
          }
        }
        await sleep(500);
      }
      try { controller.close(); } catch { /* ok */ }
    },
    cancel() {
      closed = true;
    },
  });

  req.signal.addEventListener("abort", () => { closed = true; });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}