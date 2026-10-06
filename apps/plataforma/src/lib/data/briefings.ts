// Briefing por link (tabela briefings). A busca pública usa só o hash do token;
// o token em si fica na coluna token (migration 0002) para o sócio autenticado
// poder copiar o link de novo.
import { createHash, randomBytes } from "node:crypto";
import { LIMITE_RESPOSTA, PERGUNTAS } from "../briefing-perguntas";
import { agoraIso, dados, objeto, supabase, textoOuNull, type Linha } from "./client";

export type BriefingInfo = {
  id: string;
  token: string;
  status: "aguardando" | "respondido";
  criadoEm: string | null;
  respondidoEm: string | null;
  respostas: { pergunta: string; resposta: string }[];
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function mapear(l: Linha): BriefingInfo {
  const obj = objeto(l.answers);
  return {
    id: String(l.id),
    token: String(l.token || ""),
    status: l.submitted_at ? "respondido" : "aguardando",
    criadoEm: textoOuNull(l.created_at),
    respondidoEm: textoOuNull(l.submitted_at),
    respostas: PERGUNTAS.filter((p) => obj[p.id]).map((p) => ({ pergunta: p.rotulo, resposta: String(obj[p.id]) })),
  };
}

export async function briefingDaEmpresa(empresaId: string): Promise<BriefingInfo | null> {
  const r = await supabase()
    .from("briefings")
    .select("*")
    .eq("company_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const l = dados<Linha | null>(r, "ler briefing");
  return l ? mapear(l) : null;
}

// Cria o link único. Se já existe um briefing aguardando resposta, reaproveita.
export async function criarBriefing(empresaId: string): Promise<BriefingInfo> {
  const atual = await briefingDaEmpresa(empresaId);
  if (atual && atual.status === "aguardando" && atual.token) return atual;
  const token = randomBytes(18).toString("base64url");
  const r = await supabase()
    .from("briefings")
    .insert({ company_id: empresaId, token, token_hash: hashToken(token), page_type: "site", created_at: agoraIso() })
    .select()
    .single();
  return mapear(dados<Linha>(r, "criar briefing"));
}

async function linhaPorToken(token: string): Promise<Linha | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const r = await supabase().from("briefings").select("id, company_id, submitted_at").eq("token_hash", hashToken(token)).maybeSingle();
  return dados<Linha | null>(r, "ler briefing por token");
}

// Dados que a página pública mostra: nome da empresa e se já foi respondido.
export async function briefingPorToken(token: string): Promise<{ empresa: string; respondido: boolean } | null> {
  const l = await linhaPorToken(token);
  if (!l) return null;
  let empresa = "";
  if (l.company_id) {
    const e = await supabase().from("companies").select("name").eq("id", String(l.company_id)).maybeSingle();
    empresa = String(dados<Linha | null>(e, "ler empresa do briefing")?.name ?? "");
  }
  return { empresa, respondido: Boolean(l.submitted_at) };
}

// Grava a resposta. Só aceita as perguntas conhecidas e limita o tamanho.
export async function responderBriefing(
  token: string,
  respostas: Record<string, unknown>,
): Promise<"ok" | "inexistente" | "ja-respondido" | "vazio"> {
  const l = await linhaPorToken(token);
  if (!l) return "inexistente";
  if (l.submitted_at) return "ja-respondido";
  const limpo: Record<string, string> = {};
  for (const p of PERGUNTAS) {
    const v = respostas[p.id];
    if (typeof v === "string" && v.trim()) limpo[p.id] = v.trim().slice(0, LIMITE_RESPOSTA);
  }
  if (Object.keys(limpo).length === 0) return "vazio";
  const r = await supabase()
    .from("briefings")
    .update({ answers: limpo, submitted_at: agoraIso() })
    .eq("id", String(l.id))
    .is("submitted_at", null)
    .select("id");
  return (dados<Linha[]>(r, "responder briefing") ?? []).length > 0 ? "ok" : "ja-respondido";
}
