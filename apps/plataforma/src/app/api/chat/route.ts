import { isAuthed } from "@/lib/auth";
import { buildData } from "@/lib/data";
import { AGENTS, stateSummary } from "@/lib/agents";
import {
  geminiModels,
  geminiPayload,
  openAiModel,
  openAiPayload,
  safeMessages,
  textFromGeminiChunk,
  textFromOpenAiChunk,
} from "@/lib/ai-chat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  if (!(await isAuthed())) return new Response("unauthorized", { status: 401 });

  const { agent, messages } = await req.json();
  const persona = AGENTS[agent] || AGENTS.caio;
  const data = await buildData();
  const system = `${persona.prompt}\n\n${stateSummary(data)}`;
  const history = safeMessages(messages);

  const upstream = OPENAI_API_KEY
    ? await openAiStream(system, history)
    : await geminiStream(system, history);

  if (!upstream.res || !upstream.res.body) {
    return new Response(upstream.error, { status: 502 });
  }

  return sseTextResponse(upstream.res.body, upstream.kind);
}

async function openAiStream(system: string, messages: ReturnType<typeof safeMessages>) {
  const model = openAiModel();
  if (!OPENAI_API_KEY) return { kind: "openai" as const, res: null, error: "OPENAI_API_KEY não configurada" };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(openAiPayload(system, messages)),
  });

  if (res.ok && res.body) return { kind: "openai" as const, res, error: "" };
  return {
    kind: "openai" as const,
    res: null,
    error: `OpenAI indisponível: modelo ${model} → ${res.status} ${(await res.text().catch(() => "")).slice(0, 180)}`,
  };
}

async function geminiStream(system: string, messages: ReturnType<typeof safeMessages>) {
  if (!GEMINI_API_KEY) {
    return { kind: "gemini" as const, res: null, error: "OPENAI_API_KEY não configurada. Configure a chave da OpenAI para usar ChatGPT no app." };
  }

  let lastErr = "";
  for (const model of geminiModels()) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify(geminiPayload(system, messages)),
      }
    );
    if (res.ok && res.body) return { kind: "gemini" as const, res, error: "" };
    lastErr = `modelo ${model} → ${res.status} ${(await res.text().catch(() => "")).slice(0, 120)}`;
  }
  return { kind: "gemini" as const, res: null, error: `Gemini indisponível: ${lastErr}` };
}

function sseTextResponse(body: ReadableStream<Uint8Array>, kind: "openai" | "gemini") {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const payload = t.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const text = kind === "openai" ? textFromOpenAiChunk(payload) : textFromGeminiChunk(payload);
              if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify(text)}\n\n`));
            } catch { /* linha parcial */ }
          }
        }
      } catch (e) {
        try { controller.error(e); } catch { /* já fechado */ }
      } finally {
        try { controller.close(); } catch { /* ok */ }
      }
    },
    cancel() {
      try { reader.cancel(); } catch { /* ok */ }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
