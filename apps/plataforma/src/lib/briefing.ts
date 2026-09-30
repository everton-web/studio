// Briefing por link (v3-04): o cliente responde por um link único, sem login.
// Tabela briefing do banco: token único, respostas em JSON, enviado_em ao responder.
import { randomBytes, randomUUID } from "node:crypto";
import { getDb } from "./db";
import { LIMITE_RESPOSTA, PERGUNTAS } from "./briefing-perguntas";

export type BriefingInfo = {
  id: string;
  token: string;
  status: "aguardando" | "respondido";
  criadoEm: string | null;
  respondidoEm: string | null;
  respostas: { pergunta: string; resposta: string }[];
};

function mapear(l: Record<string, unknown>): BriefingInfo {
  let respostas: { pergunta: string; resposta: string }[] = [];
  if (l.respostas) {
    try {
      const obj = JSON.parse(String(l.respostas)) as Record<string, string>;
      respostas = PERGUNTAS.filter((p) => obj[p.id]).map((p) => ({ pergunta: p.rotulo, resposta: String(obj[p.id]) }));
    } catch {
      /* resposta ilegível: mostra como sem respostas */
    }
  }
  return {
    id: String(l.id),
    token: String(l.token),
    status: l.enviado_em ? "respondido" : "aguardando",
    criadoEm: l.criado_em == null ? null : String(l.criado_em),
    respondidoEm: l.enviado_em == null ? null : String(l.enviado_em),
    respostas,
  };
}

// Último briefing da empresa, ou null.
export function briefingDaEmpresa(empresaId: string): BriefingInfo | null {
  const l = getDb()
    .prepare("SELECT id, token, respostas, enviado_em, criado_em FROM briefing WHERE empresa_id = ? ORDER BY criado_em DESC LIMIT 1")
    .get(empresaId);
  return l ? mapear(l) : null;
}

// Cria o link único. Se já existe um briefing aguardando resposta, reaproveita.
export function criarBriefing(empresaId: string): BriefingInfo {
  const atual = briefingDaEmpresa(empresaId);
  if (atual && atual.status === "aguardando") return atual;
  const id = randomUUID();
  const token = randomBytes(18).toString("base64url");
  getDb()
    .prepare("INSERT INTO briefing (id, empresa_id, token, tipo_pagina, criado_em) VALUES (?, ?, ?, ?, ?)")
    .run(id, empresaId, token, "site", new Date().toISOString());
  return briefingDaEmpresa(empresaId)!;
}

// Dados que a página pública mostra: nome da empresa e se já foi respondido.
export function briefingPorToken(token: string): { empresa: string; respondido: boolean } | null {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const l = getDb()
    .prepare(
      `SELECT b.enviado_em AS enviado_em, e.nome AS nome
       FROM briefing b LEFT JOIN empresa e ON e.id = b.empresa_id WHERE b.token = ?`,
    )
    .get(token);
  if (!l) return null;
  return { empresa: l.nome == null ? "" : String(l.nome), respondido: Boolean(l.enviado_em) };
}

// Grava a resposta do cliente. Só aceita as perguntas conhecidas e limita o tamanho.
export function responderBriefing(
  token: string,
  respostas: Record<string, unknown>,
): "ok" | "inexistente" | "ja-respondido" | "vazio" {
  const info = briefingPorToken(token);
  if (!info) return "inexistente";
  if (info.respondido) return "ja-respondido";
  const limpo: Record<string, string> = {};
  for (const p of PERGUNTAS) {
    const v = respostas[p.id];
    if (typeof v === "string" && v.trim()) limpo[p.id] = v.trim().slice(0, LIMITE_RESPOSTA);
  }
  if (Object.keys(limpo).length === 0) return "vazio";
  getDb()
    .prepare("UPDATE briefing SET respostas = ?, enviado_em = ? WHERE token = ? AND enviado_em IS NULL")
    .run(JSON.stringify(limpo), new Date().toISOString(), token);
  return "ok";
}
