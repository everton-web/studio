// Ponte entre o funil do Comercial (fichas em 40 Comercial/Leads/) e o banco.
// O vault segue sendo a ficha de trabalho do lead; o registro de empresa no
// banco é a chave única que Comercial e Clientes compartilham (v3-04).
import { getDb } from "./db";
import {
  atualizarEmpresa,
  criarEmpresa,
  estagioCrmDoFunil,
  excluirEmpresa,
  lerEmpresa,
  mudarEstagio,
} from "./empresas";

type FichaLead = {
  id: string;
  nome: string;
  segmento?: string;
  cidade?: string;
  site?: string;
  nota?: number;
  avaliacoes?: number;
  categoria?: string;
  estagio?: number;
  status?: string;
};

function numOuNull(n: number | undefined): number | null {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

// Garante que o lead tem empresa no banco. Não rebaixa cliente.
export function garantirEmpresaDoLead(f: FichaLead): void {
  const funil = Math.min(5, Math.max(0, f.estagio ?? 0));
  const existente = lerEmpresa(f.id);
  if (!existente) {
    criarEmpresa({
      id: f.id,
      nome: f.nome,
      segmento: f.segmento || null,
      cidade: f.cidade || null,
      site: f.site || null,
      nota_google: numOuNull(f.nota),
      avaliacoes: numOuNull(f.avaliacoes),
      categoria: f.categoria || "maps",
      estagio_crm: estagioCrmDoFunil(Math.min(funil, 4)),
      estagio_funil: funil,
      status: f.status || "ativo",
      origem: "lead",
    });
    return;
  }
  if (existente.estagio_crm === "cliente") return;
  // lead e oportunidade seguem o funil; cliente só nasce por mover ao estágio 5.
  const crm = estagioCrmDoFunil(Math.min(funil, 4));
  if (existente.estagio_crm !== crm) mudarEstagio(f.id, crm);
  if (existente.estagio_funil !== funil || (f.status && existente.status !== f.status)) {
    atualizarEmpresa(f.id, { estagio_funil: funil, status: f.status ?? existente.status });
  }
}

// Mover no funil: estágio 1 vira oportunidade, estágio 5 vira cliente.
export function registrarMovimento(id: string, funil: number, ficha: FichaLead): void {
  garantirEmpresaDoLead({ ...ficha, id, estagio: Math.min(funil, 4) });
  const crm = estagioCrmDoFunil(funil);
  mudarEstagio(id, crm);
  atualizarEmpresa(id, { estagio_funil: funil });
}

export function registrarEdicao(id: string, campos: { nome?: string; segmento?: string; cidade?: string; site?: string }): void {
  const c: Record<string, string> = {};
  if (campos.nome) c.nome = campos.nome;
  if (campos.segmento !== undefined) c.segmento = campos.segmento;
  if (campos.cidade !== undefined) c.cidade = campos.cidade;
  if (campos.site !== undefined) c.site = campos.site;
  atualizarEmpresa(id, c);
}

export function registrarStatus(id: string, status: string): void {
  atualizarEmpresa(id, { status });
}

// Apagar a ficha do funil remove a empresa, exceto se ela já é cliente.
export function removerLead(id: string): void {
  const e = lerEmpresa(id);
  if (e && e.estagio_crm !== "cliente") excluirEmpresa(id);
}

// Mapa id -> estágio do CRM, para o funil esconder quem já virou cliente.
export function mapaEstagioCrm(): Map<string, string> {
  const m = new Map<string, string>();
  for (const l of getDb().prepare("SELECT id, estagio_crm FROM empresa").all()) {
    m.set(String(l.id), String(l.estagio_crm));
  }
  return m;
}
