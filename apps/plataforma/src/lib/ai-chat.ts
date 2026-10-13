export type ChatMessage = { role: "user" | "assistant"; content: string };

export const OPENAI_DEFAULT_MODEL = "gpt-5-mini";
export const GEMINI_FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
];

export function safeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((m) => {
      if (!m || typeof m !== "object") return null;
      const row = m as { role?: unknown; content?: unknown };
      const role = row.role === "assistant" ? "assistant" : "user";
      const content = typeof row.content === "string" ? row.content.slice(0, 8000) : "";
      return content.trim() ? { role, content } : null;
    })
    .filter(Boolean) as ChatMessage[];
}

export function openAiModel() {
  return process.env.OPENAI_MODEL || OPENAI_DEFAULT_MODEL;
}

export function geminiModels() {
  return [process.env.GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS].filter(Boolean) as string[];
}

export function openAiPayload(system: string, messages: ChatMessage[]) {
  return {
    model: openAiModel(),
    stream: true,
    messages: [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };
}

export function geminiPayload(system: string, messages: ChatMessage[]) {
  return {
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: { temperature: 0.7 },
  };
}

export function textFromOpenAiChunk(payload: string) {
  if (!payload || payload === "[DONE]") return "";
  const j = JSON.parse(payload);
  return j.choices?.[0]?.delta?.content ?? "";
}

export function textFromGeminiChunk(payload: string) {
  if (!payload || payload === "[DONE]") return "";
  const j = JSON.parse(payload);
  return j.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
