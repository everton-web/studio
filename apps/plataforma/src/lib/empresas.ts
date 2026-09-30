import { getDb } from "./db";

export const ESTAGIOS_CRM = ["lead", "oportunidade", "cliente"] as const;
export type EstagioCrm = (typeof ESTAGIOS_CRM)[number];

export interface NovaEmpresa {
  id: string;
  nome: string;
  segmento?: string | null;
  cidade?: string | null;
  site?: string | null;
  nota_google?: number | null;
  avaliacoes?: number | null;
  categoria?: string | null;
  estagio_crm: string;
  estagio_funil?: number | null;
  status?: string | null;
  origem?: string | null;
  valor_projeto?: number | null;
  recorrencia?: number | null;
  fechado_em?: string | null;
}

export interface Empresa {
  id: string;
  nome: string;
  segmento: string | null;
  cidade: string | null;
  site: string | null;
  nota_google: number | null;
  avaliacoes: number | null;
  categoria: string | null;
  estagio_crm: EstagioCrm;
  estagio_funil: number | null;
  status: string | null;
  origem: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
  valor_projeto: number | null;
  recorrencia: number | null;
  fechado_em: string | null;
}

// Aceita só os estágios previstos no CHECK do schema.
function validarEstagio(estagio: string): asserts estagio is EstagioCrm {
  if (!(ESTAGIOS_CRM as readonly string[]).includes(estagio)) {
    throw new Error(`estagio_crm inválido: ${estagio}`);
  }
}

// Converte uma linha do SQLite para o tipo Empresa.
function mapear(linha: Record<string, unknown>): Empresa {
  return {
    id: String(linha.id),
    nome: String(linha.nome),
    segmento: linha.segmento == null ? null : String(linha.segmento),
    cidade: linha.cidade == null ? null : String(linha.cidade),
    site: linha.site == null ? null : String(linha.site),
    nota_google: linha.nota_google == null ? null : Number(linha.nota_google),
    avaliacoes: linha.avaliacoes == null ? null : Number(linha.avaliacoes),
    categoria: linha.categoria == null ? null : String(linha.categoria),
    estagio_crm: String(linha.estagio_crm) as EstagioCrm,
    estagio_funil: linha.estagio_funil == null ? null : Number(linha.estagio_funil),
    status: linha.status == null ? null : String(linha.status),
    origem: linha.origem == null ? null : String(linha.origem),
    criado_em: linha.criado_em == null ? null : String(linha.criado_em),
    atualizado_em: linha.atualizado_em == null ? null : String(linha.atualizado_em),
    valor_projeto: linha.valor_projeto == null ? null : Number(linha.valor_projeto),
    recorrencia: linha.recorrencia == null ? null : Number(linha.recorrencia),
    fechado_em: linha.fechado_em == null ? null : String(linha.fechado_em),
  };
}

const COLUNAS =
  "id, nome, segmento, cidade, site, nota_google, avaliacoes, categoria, estagio_crm, estagio_funil, status, origem, criado_em, atualizado_em, valor_projeto, recorrencia, fechado_em";

// Cria uma empresa. Valida o estágio antes de gravar.
export function criarEmpresa(dados: NovaEmpresa): { id: string } {
  validarEstagio(dados.estagio_crm);
  const db = getDb();
  const agora = new Date().toISOString();
  db.prepare(
    `INSERT INTO empresa
       (id, nome, segmento, cidade, site, nota_google, avaliacoes, categoria, estagio_crm, estagio_funil, status, origem, criado_em, atualizado_em, valor_projeto, recorrencia, fechado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    dados.id,
    dados.nome,
    dados.segmento ?? null,
    dados.cidade ?? null,
    dados.site ?? null,
    dados.nota_google ?? null,
    dados.avaliacoes ?? null,
    dados.categoria ?? null,
    dados.estagio_crm,
    dados.estagio_funil ?? null,
    dados.status ?? null,
    dados.origem ?? null,
    agora,
    agora,
    dados.valor_projeto ?? null,
    dados.recorrencia ?? null,
    dados.fechado_em ?? (dados.estagio_crm === "cliente" ? agora.slice(0, 10) : null),
  );
  return { id: dados.id };
}

// Lê uma empresa pelo id. Devolve null quando não existe.
export function lerEmpresa(id: string): Empresa | null {
  const db = getDb();
  const linha = db.prepare(`SELECT ${COLUNAS} FROM empresa WHERE id = ?`).get(id);
  return linha ? mapear(linha) : null;
}

// Lista todas as empresas em ordem alfabética.
export function listarEmpresas(): Empresa[] {
  const db = getDb();
  const linhas = db.prepare(`SELECT ${COLUNAS} FROM empresa ORDER BY nome`).all();
  return linhas.map(mapear);
}

// Muda o estágio da empresa e atualiza o carimbo de tempo.
// Ao virar cliente, grava a data de fechamento (uma vez só).
export function mudarEstagio(id: string, estagio_crm: string): { id: string; estagio_crm: EstagioCrm } {
  validarEstagio(estagio_crm);
  const db = getDb();
  const agora = new Date().toISOString();
  db.prepare(
    "UPDATE empresa SET estagio_crm = ?, atualizado_em = ?, fechado_em = CASE WHEN ? = 'cliente' AND fechado_em IS NULL THEN ? ELSE fechado_em END WHERE id = ?",
  ).run(estagio_crm, agora, estagio_crm, agora.slice(0, 10), id);
  return { id, estagio_crm };
}

// Lista as empresas de um ou mais estágios, em ordem alfabética.
export function listarPorEstagio(estagios: EstagioCrm[]): Empresa[] {
  const db = getDb();
  const marcas = estagios.map(() => "?").join(",");
  const linhas = db
    .prepare(`SELECT ${COLUNAS} FROM empresa WHERE estagio_crm IN (${marcas}) ORDER BY nome`)
    .all(...estagios);
  return linhas.map(mapear);
}

// Estágio do funil (0 a 5) para estágio do CRM: 0 lead, 1 a 4 oportunidade, 5 cliente.
export function estagioCrmDoFunil(funil: number): EstagioCrm {
  if (funil >= 5) return "cliente";
  if (funil >= 1) return "oportunidade";
  return "lead";
}

export interface CamposEmpresa {
  nome?: string;
  segmento?: string | null;
  cidade?: string | null;
  site?: string | null;
  status?: string | null;
  valor_projeto?: number | null;
  recorrencia?: number | null;
  fechado_em?: string | null;
  estagio_funil?: number | null;
}

// Atualiza só os campos informados. Nunca mexe no estágio do CRM (use mudarEstagio).
export function atualizarEmpresa(id: string, campos: CamposEmpresa): boolean {
  const permitidos: (keyof CamposEmpresa)[] = [
    "nome", "segmento", "cidade", "site", "status",
    "valor_projeto", "recorrencia", "fechado_em", "estagio_funil",
  ];
  const sets: string[] = [];
  const valores: (string | number | null)[] = [];
  for (const k of permitidos) {
    if (campos[k] === undefined) continue;
    sets.push(`${k} = ?`);
    valores.push(campos[k] as string | number | null);
  }
  if (sets.length === 0) return false;
  sets.push("atualizado_em = ?");
  valores.push(new Date().toISOString());
  const r = getDb()
    .prepare(`UPDATE empresa SET ${sets.join(", ")} WHERE id = ?`)
    .run(...valores, id);
  return Number(r.changes) > 0;
}

// Remove a empresa e, por cascata, contatos, credenciais, contratos e briefings dela.
export function excluirEmpresa(id: string): boolean {
  const r = getDb().prepare("DELETE FROM empresa WHERE id = ?").run(id);
  return Number(r.changes) > 0;
}
