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
  };
}

const COLUNAS =
  "id, nome, segmento, cidade, site, nota_google, avaliacoes, categoria, estagio_crm, estagio_funil, status, origem, criado_em, atualizado_em";

// Cria uma empresa. Valida o estágio antes de gravar.
export function criarEmpresa(dados: NovaEmpresa): { id: string } {
  validarEstagio(dados.estagio_crm);
  const db = getDb();
  const agora = new Date().toISOString();
  db.prepare(
    `INSERT INTO empresa
       (id, nome, segmento, cidade, site, nota_google, avaliacoes, categoria, estagio_crm, estagio_funil, status, origem, criado_em, atualizado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
export function mudarEstagio(id: string, estagio_crm: string): { id: string; estagio_crm: EstagioCrm } {
  validarEstagio(estagio_crm);
  const db = getDb();
  db.prepare("UPDATE empresa SET estagio_crm = ?, atualizado_em = ? WHERE id = ?").run(
    estagio_crm,
    new Date().toISOString(),
    id,
  );
  return { id, estagio_crm };
}
