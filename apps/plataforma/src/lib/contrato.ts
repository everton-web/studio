// Contrato rápido (v3-04): gera o texto a partir dos dados do cliente, guarda o
// arquivo no vault (documento) e a linha na tabela contrato do banco.
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { lerEmpresa } from "./empresas";
import { brl, dataLonga } from "./formato";

const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const PASTA = "40 Comercial/Contratos";

export type ContratoInfo = {
  id: string;
  valor: number | null;
  tipoPagamento: string | null;
  parcelas: number | null;
  inicio: string | null;
  duracaoMeses: number | null;
  criadoEm: string | null;
};

export type DadosContrato = {
  valor?: number | null;
  tipo_pagamento?: string;
  parcelas?: number | null;
  inicio?: string;
  duracao_meses?: number | null;
};

const TIPOS: Record<string, string> = {
  pix: "à vista por Pix",
  cartao: "no cartão de crédito",
  parcelado: "parcelado",
};

export function contratosDaEmpresa(empresaId: string): ContratoInfo[] {
  return getDb()
    .prepare(
      "SELECT id, valor, tipo_pagamento, parcelas, inicio, duracao_meses, criado_em FROM contrato WHERE empresa_id = ? ORDER BY criado_em DESC",
    )
    .all(empresaId)
    .map((l) => ({
      id: String(l.id),
      valor: l.valor == null ? null : Number(l.valor),
      tipoPagamento: l.tipo_pagamento == null ? null : String(l.tipo_pagamento),
      parcelas: l.parcelas == null ? null : Number(l.parcelas),
      inicio: l.inicio == null ? null : String(l.inicio),
      duracaoMeses: l.duracao_meses == null ? null : Number(l.duracao_meses),
      criadoEm: l.criado_em == null ? null : String(l.criado_em),
    }));
}

function montarTexto(
  nome: string,
  cidade: string | null,
  contato: string,
  valor: number | null,
  tipo: string,
  d: DadosContrato,
): string {
  const cond =
    tipo === "parcelado" && d.parcelas && d.parcelas > 1 ? `parcelado em ${d.parcelas} vezes` : TIPOS[tipo] || TIPOS.pix;
  const inicio = d.inicio ? dataLonga(d.inicio) : "a combinar";
  const prazo = d.duracao_meses
    ? `${d.duracao_meses} ${d.duracao_meses === 1 ? "mês" : "meses"}`
    : "Prazo de entrega combinado por escrito";
  return [
    "# Contrato de prestação de serviços",
    "",
    "> Rascunho gerado pela plataforma. Revise os dados entre colchetes antes de enviar.",
    "",
    `**Contratante:** ${nome}${contato ? `, representada por ${contato}` : ""}${cidade ? `, ${cidade}` : ""}.`,
    "**Contratada:** Marca Digital, de Everton Brito [CPF ou CNPJ e endereço].",
    "",
    "## 1. Objeto",
    "Criação, publicação e manutenção básica do site da Contratante, conforme o briefing respondido por ela.",
    "",
    "## 2. Valor e pagamento",
    `O valor do projeto é ${valor ? brl(valor) : "[valor a definir]"}, pago ${cond}. O início do projeto é ${inicio}.`,
    "",
    "## 3. Prazo",
    `${prazo}, contados do pagamento da primeira parcela e do envio dos materiais pela Contratante.`,
    "",
    "## 4. Responsabilidades",
    "A Contratada entrega o site publicado, responsivo e com formulário de contato funcionando. A Contratante fornece textos, imagens e acessos necessários e responde às solicitações em até 3 dias úteis.",
    "",
    "## 5. Propriedade e acessos",
    "Após a quitação, o site e o domínio ficam em nome da Contratante. Os acessos ficam guardados de forma protegida e só são usados para manutenção do projeto.",
    "",
    "## 6. Alterações e cancelamento",
    "Ajustes pequenos estão incluídos até a aprovação final. Mudanças de escopo são combinadas por escrito e podem alterar valor e prazo. O cancelamento após o início do trabalho preserva o valor da parte já executada.",
    "",
    "## 7. Foro",
    "Fica eleito o foro de Salvador, Bahia, para resolver qualquer questão deste contrato.",
    "",
    `${cidade || "[cidade]"}, ${dataLonga(new Date().toISOString().slice(0, 10))}.`,
    "",
    "________________________________",
    "Contratante",
    "",
    "________________________________",
    "Contratada",
    "",
  ].join("\n");
}

export async function gerarContrato(empresaId: string, dados: DadosContrato): Promise<ContratoInfo> {
  const e = lerEmpresa(empresaId);
  if (!e) throw new Error("cliente não encontrado");
  const c = getDb().prepare("SELECT nome FROM contato WHERE empresa_id = ? AND nome <> '' LIMIT 1").get(empresaId);
  const tipo = dados.tipo_pagamento && TIPOS[dados.tipo_pagamento] ? dados.tipo_pagamento : "pix";
  const valor = dados.valor ?? e.valor_projeto ?? null;
  const md = montarTexto(e.nome, e.cidade, c ? String(c.nome) : "", valor, tipo, dados);

  const id = randomUUID();
  const arquivo = `${PASTA}/${empresaId}-${id.slice(0, 8)}.md`;
  await mkdir(join(VAULT, PASTA), { recursive: true });
  await writeFile(join(VAULT, arquivo), md, "utf8");
  getDb()
    .prepare(
      `INSERT INTO contrato (id, empresa_id, valor, tipo_pagamento, parcelas, inicio, duracao_meses, arquivo, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, empresaId, valor, tipo, dados.parcelas ?? null, dados.inicio || null, dados.duracao_meses ?? null, arquivo, new Date().toISOString());
  return contratosDaEmpresa(empresaId).find((x) => x.id === id)!;
}

// Lê o texto do contrato. O caminho vem do banco, nunca do pedido.
export async function textoDoContrato(empresaId: string, contratoId: string): Promise<string | null> {
  const l = getDb().prepare("SELECT arquivo FROM contrato WHERE id = ? AND empresa_id = ?").get(contratoId, empresaId);
  if (!l || !l.arquivo) return null;
  const rel = String(l.arquivo);
  if (!rel.startsWith(PASTA + "/") || rel.includes("..")) return null;
  try {
    return await readFile(join(VAULT, rel), "utf8");
  } catch {
    return null;
  }
}

// Remove o contrato (linha e arquivo).
export async function removerContrato(empresaId: string, contratoId: string): Promise<boolean> {
  const l = getDb().prepare("SELECT arquivo FROM contrato WHERE id = ? AND empresa_id = ?").get(contratoId, empresaId);
  if (!l) return false;
  const rel = String(l.arquivo || "");
  if (rel.startsWith(PASTA + "/") && !rel.includes("..")) {
    try {
      await unlink(join(VAULT, rel));
    } catch {
      /* arquivo já removido */
    }
  }
  getDb().prepare("DELETE FROM contrato WHERE id = ?").run(contratoId);
  return true;
}
