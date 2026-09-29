#!/usr/bin/env node
// Migração idempotente das fichas do vault para o banco da plataforma.
// SÓ lê o vault; SÓ grava no banco. Nunca altera nem apaga arquivo do vault.
import { DatabaseSync } from "node:sqlite";
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { resolve, dirname, join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCHEMA = join(ROOT, "apps", "plataforma", "src", "lib", "schema.sql");
const ENV_FILE = join(ROOT, "apps", "plataforma", ".env.local");
const VAULT_PADRAO = "D:/Obsidian - Claude/🏢 Agência";
const RELATORIO = join(ROOT, "_scripts", "dados", "relatorio-migracao.json");

// Lê KEY=VALUE linha por linha, tirando aspas. Igual ao e2e-demanda.mjs.
function parseEnv(txt) {
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

const envDoArquivo = existsSync(ENV_FILE)
  ? parseEnv(readFileSync(ENV_FILE, "utf8"))
  : {};

// process.env tem prioridade sobre o .env.local, depois o padrão.
const VAULT = process.env.VAULT || envDoArquivo.VAULT || VAULT_PADRAO;
const AGENCIA_DB =
  process.env.AGENCIA_DB ||
  envDoArquivo.AGENCIA_DB ||
  join(ROOT, "apps", "plataforma", "data", "plataforma.sqlite");

// ---------- helpers de frontmatter (espelho de lib/vault.ts) ----------
function frontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

function slug(s) {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "lead"
  );
}

// "4,7" -> 4.7 · "1.234" -> 1234 (como lib/vault.ts leadBase).
function num(s) {
  const n = Number(String(s || "").replace(/\.(?=\d{3})/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function carimboData(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// Hash sha256 de cada arquivo, com chave relativa ao vault.
export function sha256Arquivos(caminhos, base = VAULT) {
  const mapa = {};
  for (const caminho of caminhos) {
    const hash = createHash("sha256").update(readFileSync(caminho)).digest("hex");
    const chave = relative(base, caminho).split(sep).join("/");
    mapa[chave] = hash;
  }
  return mapa;
}

function listarMd(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
      .map((e) => join(dir, e.name))
      .sort();
  } catch {
    return [];
  }
}

// Coleta os caminhos lidos do vault e as subpastas de projetos.
export async function coletarArquivos(vault) {
  const leadsDir = join(vault, "40 Comercial", "Leads");
  let vaultVisivel = false;
  try {
    readdirSync(leadsDir);
    vaultVisivel = true;
  } catch {
    vaultVisivel = false;
  }

  const projetosDir = join(vault, "30 Projetos");
  let projetosPastas = [];
  try {
    projetosPastas = readdirSync(projetosDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    projetosPastas = [];
  }

  const projetos = [];
  const caminhar = (dir) => {
    let entradas = [];
    try {
      entradas = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entradas) {
      const p = join(dir, e.name);
      if (e.isDirectory()) caminhar(p);
      else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) projetos.push(p);
    }
  };
  caminhar(projetosDir);
  projetos.sort();

  return {
    leads: listarMd(leadsDir),
    clientes: listarMd(join(vault, "40 Comercial", "Clientes")),
    propostas: listarMd(join(vault, "40 Comercial", "Propostas")),
    projetos,
    projetosPastas,
    vaultVisivel,
  };
}

// Migra as fichas do vault para o banco. Retorna o relatório.
export async function migrarVault({ dbPath, vault }) {
  const agora = new Date();
  const geradoEm = agora.toISOString();
  const hoje = geradoEm.slice(0, 10);

  // a) garante a pasta do banco e a cópia antes de migrar (AC-19).
  mkdirSync(dirname(dbPath), { recursive: true });
  let copiaPrevia = null;
  if (existsSync(dbPath)) {
    const backupsDir = join(dirname(dbPath), "backups");
    mkdirSync(backupsDir, { recursive: true });
    copiaPrevia = join(backupsDir, `plataforma.pre-migracao-${carimboData()}.sqlite`);
    copyFileSync(dbPath, copiaPrevia);
  }

  // b) abre o banco e aplica o schema (idempotente).
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  try {
    db.exec(readFileSync(SCHEMA, "utf8"));
  } catch (e) {
    // as tabelas já existem: schema já aplicado, nada a recriar.
    if (!/already exists/i.test(String(e?.message))) throw e;
  }

  // c) hash de TODOS os arquivos coletados, antes de gravar qualquer coisa.
  const coletado = await coletarArquivos(vault);
  const todos = [
    ...coletado.leads,
    ...coletado.clientes,
    ...coletado.propostas,
    ...coletado.projetos,
  ];
  const hashAntes = sha256Arquivos(todos, vault);

  const upEmpresa = db.prepare(
    `INSERT INTO empresa
       (id, nome, segmento, cidade, site, nota_google, avaliacoes, categoria,
        estagio_crm, estagio_funil, status, origem, criado_em, atualizado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       nome=excluded.nome, segmento=excluded.segmento, cidade=excluded.cidade,
       site=excluded.site, nota_google=excluded.nota_google,
       avaliacoes=excluded.avaliacoes, categoria=excluded.categoria,
       estagio_crm=excluded.estagio_crm, estagio_funil=excluded.estagio_funil,
       status=excluded.status, origem=excluded.origem,
       criado_em=excluded.criado_em, atualizado_em=excluded.atualizado_em`,
  );
  const upContato = db.prepare(
    `INSERT INTO contato (id, empresa_id, nome, whatsapp, email, criado_em)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       empresa_id=excluded.empresa_id, nome=excluded.nome,
       whatsapp=excluded.whatsapp, email=excluded.email,
       criado_em=excluded.criado_em`,
  );
  const upProjeto = db.prepare(
    `INSERT INTO projeto (id, empresa_id, nome, interno, criado_em)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       empresa_id=excluded.empresa_id, nome=excluded.nome, interno=excluded.interno`,
  );

  // d) empresas de origem lead.
  for (const arquivo of coletado.leads) {
    const raw = readFileSync(arquivo, "utf8");
    const fm = frontmatter(raw);
    const id = slug(arquivo.split(/[\\/]/).pop().replace(/\.md$/i, ""));
    const nome = fm.lead || id;
    const estagioFunil = Math.min(5, Math.max(0, Number(fm.estagio) || 0));
    upEmpresa.run(
      id,
      nome,
      fm.segmento || null,
      fm.cidade || null,
      fm["site-atual"] || null,
      fm["nota-google"] ? num(fm["nota-google"]) : null,
      fm.avaliacoes ? num(fm.avaliacoes) : null,
      fm.categoria || fm.fonte || "maps",
      "lead",
      estagioFunil,
      fm.status || "ativo",
      "lead",
      fm.criado || hoje,
      agora.toISOString(),
    );
    if (fm.whatsapp || fm.contato || fm.email) {
      upContato.run(
        id,
        id,
        "",
        fm.whatsapp || fm.contato || null,
        fm.email || null,
        agora.toISOString(),
      );
    }
  }

  // e) empresas de Clientes: análise (sem status) e cliente real.
  for (const arquivo of coletado.clientes) {
    const raw = readFileSync(arquivo, "utf8");
    const fm = frontmatter(raw);
    const id = slug(arquivo.split(/[\\/]/).pop().replace(/\.md$/i, ""));
    if (fm.titulo && !fm.status) {
      // ficha de análise: origem analise, sem valor fabricado.
      const nome = fm.titulo.split(/\s+[—–-]\s+/)[0].trim() || id;
      const site = fm.cliente && fm.cliente.includes(".") && !fm.cliente.includes(" ")
        ? fm.cliente
        : null;
      upEmpresa.run(
        id,
        nome,
        null,
        null,
        site,
        null,
        null,
        null,
        "oportunidade",
        null,
        null,
        "analise",
        agora.toISOString(),
        agora.toISOString(),
      );
    } else {
      // cliente real.
      upEmpresa.run(
        id,
        fm.cliente || id,
        fm.segmento || null,
        fm.localizacao || null,
        null,
        null,
        null,
        null,
        "cliente",
        null,
        fm.status || null,
        "cliente",
        agora.toISOString(),
        agora.toISOString(),
      );
      if (fm.contato || fm.telefone) {
        upContato.run(
          id,
          id,
          fm.contato || "",
          fm.telefone || null,
          "",
          agora.toISOString(),
        );
      }
    }
  }

  // g) projetos a partir das subpastas de 30 Projetos.
  for (const nomePasta of coletado.projetosPastas) {
    const id = slug(nomePasta);
    const existe = db.prepare("SELECT 1 AS ok FROM empresa WHERE id = ?").get(id);
    const empresaId = existe ? id : null;
    upProjeto.run(
      id,
      empresaId,
      nomePasta,
      empresaId ? 0 : 1,
      agora.toISOString(),
    );
  }

  // h) hash depois e comparação com o antes (AC-06).
  const hashDepois = sha256Arquivos(todos, vault);
  const chavesAntes = Object.keys(hashAntes).sort();
  const chavesDepois = Object.keys(hashDepois).sort();
  let hashIguais =
    chavesAntes.length === chavesDepois.length &&
    chavesAntes.every((k, i) => k === chavesDepois[i] && hashAntes[k] === hashDepois[k]);

  // i) contagens.
  const tabelas = [
    "empresa",
    "contato",
    "oportunidade",
    "projeto",
    "contrato",
    "credencial",
    "briefing",
    "relatorio",
  ];
  const porTabela = {};
  for (const t of tabelas) {
    porTabela[t] = Number(db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n);
  }
  const porOrigem = {};
  for (const linha of db.prepare("SELECT origem, COUNT(*) AS n FROM empresa GROUP BY origem").all()) {
    porOrigem[linha.origem == null ? "null" : String(linha.origem)] = Number(linha.n);
  }

  db.close();

  return {
    geradoEm,
    banco: dbPath,
    vault,
    vaultVisivel: coletado.vaultVisivel,
    copiaPrevia,
    arquivosFonte: {
      leads: coletado.leads.length,
      clientes: coletado.clientes.length,
      propostas: coletado.propostas.length,
      projetos: coletado.projetos.length,
    },
    porTabela,
    porOrigem,
    hashIguais,
  };
}

// ---------- CLI ----------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  migrarVault({ dbPath: AGENCIA_DB, vault: VAULT })
    .then((rel) => {
      console.log("Migração do vault concluída.");
      console.log(`Banco: ${rel.banco}`);
      console.log(`Vault: ${rel.vault}`);
      console.log(`Vault visível: ${rel.vaultVisivel ? "sim" : "não"}`);
      console.log(`Cópia antes de migrar: ${rel.copiaPrevia || "não havia banco ainda"}`);
      const af = rel.arquivosFonte;
      console.log(
        `Arquivos fonte · leads ${af.leads} · clientes ${af.clientes} · propostas ${af.propostas} · projetos ${af.projetos}`,
      );
      const po = rel.porOrigem;
      console.log(
        `Empresas por origem · lead ${po.lead || 0} · cliente ${po.cliente || 0} · analise ${po.analise || 0}`,
      );
      const pt = rel.porTabela;
      console.log(
        `Tabelas · empresa ${pt.empresa} · contato ${pt.contato} · oportunidade ${pt.oportunidade} · projeto ${pt.projeto} · contrato ${pt.contrato} · credencial ${pt.credencial} · briefing ${pt.briefing} · relatorio ${pt.relatorio}`,
      );
      console.log(`Hash do vault igual antes e depois: ${rel.hashIguais ? "sim" : "não"}`);
      mkdirSync(dirname(RELATORIO), { recursive: true });
      writeFileSync(RELATORIO, JSON.stringify(rel, null, 2) + "\n", "utf8");
      console.log(`Relatório salvo em: ${RELATORIO}`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(`FAIL: ${e?.message || "erro inesperado"}`);
      process.exit(1);
    });
}
