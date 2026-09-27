import { isAuthed } from "@/lib/auth";
import { getSession, addListener, replayBuffer } from "@/lib/console";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAuthed())) return new Response("unauthorized", { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("missing id", { status: 400 });
  const s = getSession(id);
  if (!s) return new Response("session not found", { status: 404 });

  const encoder = new TextEncoder();
  let hb: ReturnType<typeof setInterval> | null = null;
  let removeListener: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const push = (chunk: string) => {
        try { controller.enqueue(encoder.encode(chunk)); } catch { /* fechado */ }
      };
      // 1) replay da tela atual (anexa onde está)
      try { push(`data: ${JSON.stringify(replayBuffer(id))}\n\n`); } catch { /* ok */ }
      // 2) ao vivo
      removeListener = addListener(id, (d) => push(`data: ${JSON.stringify(d)}\n\n`));
      hb = setInterval(() => push(": hb\n\n"), 15000);
    },
    cancel() {
      if (removeListener) removeListener();
      if (hb) clearInterval(hb);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}