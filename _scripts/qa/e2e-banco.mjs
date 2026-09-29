#!/usr/bin/env node
// E2E BANCO — prova de ponta a ponta do banco da plataforma (story v3-03).
// Usa banco TEMPORÁRIO (AGENCIA_DB em pasta de temporários), nunca o real.
// Nunca imprime credenciais nem a chave. Sai com 1 em falha, 0 no fim.
import { DatabaseSync } from "node:sqlite";
import { readFile, rm, mkdtemp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ENV_FILE = join(ROOT, "apps", "plataforma", ".env.local");

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

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

async function main() {
  const txt = await readFile(ENV_FILE, "utf8").catch(() => fail("não li apps/plataforma/.env.local"));
  const env = parseEnv(txt);
  const VAULT = env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
  // chave do cofre: usa a do .env.local; sem ela, gera uma só para este teste (não toca no .env).
  const COFRE_KEY = env.AGENCIA_COFRE_KEY || randomBytes(32).toString("hex");
  process.env.AGENCIA_COFRE_KEY = COFRE_KEY;

  // banco temporário (nunca o real).
  const tmpDir = await mkdtemp(join(tmpdir(), "e2e-banco-"));
  const dbPath = join(tmpDir, "plataforma.sqlite");
  const backupsDir = join(tmpDir, "backups");

  const { migrarVault, coletarArquivos } = await import("../db/migrar-vault.mjs");
  const { backup } = await import("../db/backup.mjs");
  const { cifrar, decifrar } = await import("../db/cofre.mjs");

  // 1. migração das fichas reais do vault (AC-08 batendo com a fonte real).
  const coletado = await coletarArquivos(VAULT);
  const rel = await migrarVault({ dbPath, vault: VAULT });
  if (rel.porOrigem.lead !== coletado.leads.length) {
    fail(`origem lead ${rel.porOrigem.lead} != ${coletado.leads.length} arquivos de Leads`);
  }
  const clientesTotal = (rel.porOrigem.cliente || 0) + (rel.porOrigem.analise || 0);
  if (clientesTotal !== coletado.clientes.length) {
    fail(`origem cliente+analise ${clientesTotal} != ${coletado.clientes.length} arquivos de Clientes`);
  }
  if (rel.porTabela.projeto !== coletado.projetosPastas.length) {
    fail(`projeto ${rel.porTabela.projeto} != ${coletado.projetosPastas.length} subpastas`);
  }
  if (!rel.hashIguais) fail("hash do vault mudou após a migração");
  console.log(`ok · migração (lead ${rel.porOrigem.lead} · cliente ${rel.porOrigem.cliente || 0} · analise ${rel.porOrigem.analise || 0} · projeto ${rel.porTabela.projeto})`);

  // 2. idempotência (AC-05): segunda execução não muda as contagens.
  const rel2 = await migrarVault({ dbPath, vault: VAULT });
  if (JSON.stringify(rel.porTabela) !== JSON.stringify(rel2.porTabela)) {
    fail("contagens mudaram na segunda execução (idempotência)");
  }
  console.log("ok · idempotência (segunda execução com as mesmas contagens)");

  const db = new DatabaseSync(dbPath);
  // casos especiais do risco da story: Dra Aline = analise/oportunidade; Concept = cliente.
  const dra = db.prepare("SELECT estagio_crm, origem FROM empresa WHERE id = ?").get("dra-aline-schwanck");
  if (!dra || dra.estagio_crm !== "oportunidade" || dra.origem !== "analise") {
    fail("Dra Aline Schwanck deveria entrar como analise/oportunidade");
  }
  const concept = db.prepare("SELECT estagio_crm, origem FROM empresa WHERE id = ?").get("concept-implantes-dentarios");
  if (!concept || concept.estagio_crm !== "cliente" || concept.origem !== "cliente") {
    fail("Concept deveria entrar como cliente");
  }
  console.log("ok · mapeamento Dra Aline (analise) e Concept (cliente)");

  // 3. CRUD de estágio + CHECK do estagio_crm (AC-03).
  const testId = "e2e-empresa-teste";
  const agoraIso = () => new Date().toISOString();
  db.prepare(`INSERT INTO empresa (id, nome, estagio_crm, origem, criado_em, atualizado_em)
              VALUES (?, 'Empresa teste e2e', 'lead', 'lead', ?, ?)`).run(testId, agoraIso(), agoraIso());
  let est = db.prepare("SELECT estagio_crm FROM empresa WHERE id = ?").get(testId);
  if (est.estagio_crm !== "lead") fail("empresa de teste não nasceu lead");
  for (const alvo of ["oportunidade", "cliente"]) {
    db.prepare("UPDATE empresa SET estagio_crm = ?, atualizado_em = ? WHERE id = ?").run(alvo, agoraIso(), testId);
    est = db.prepare("SELECT estagio_crm FROM empresa WHERE id = ?").get(testId);
    if (est.estagio_crm !== alvo) fail(`estagio não virou ${alvo}`);
  }
  let checkRejeitou = false;
  try {
    db.prepare("UPDATE empresa SET estagio_crm = 'invalido' WHERE id = ?").run(testId);
  } catch {
    checkRejeitou = true;
  }
  if (!checkRejeitou) fail("CHECK do estagio_crm aceitou valor inválido");
  console.log("ok · estagio lead → oportunidade → cliente + CHECK rejeita inválido");

  // 4. cofre: grava credencial; senha não pode aparecer em texto puro no binário (AC-09).
  const senha = "s3gr3do-teste-" + randomBytes(6).toString("hex");
  const { cifrado, iv, tag } = cifrar(senha);
  db.prepare(`INSERT INTO credencial (id, empresa_id, label, url, usuario, senha_cifrada, iv, tag, notas, criado_em, atualizado_em)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    "e2e-credencial", testId, "Teste e2e", "https://exemplo.com", "usuario-teste",
    cifrado, iv, tag, null, agoraIso(), agoraIso());
  db.close(); // fecha para o arquivo ficar completo no disco
  const bin = await readFile(dbPath);
  if (bin.includes(Buffer.from(senha, "utf8"))) fail("senha apareceu em texto puro no arquivo do banco");
  if (bin.includes(Buffer.from(COFRE_KEY, "utf8"))) fail("chave do cofre apareceu no arquivo do banco");
  console.log("ok · senha cifrada não aparece no binário (nem a chave)");

  // 5. leitura da credencial devolve a senha correta (AC-10).
  const senhaLida = decifrar(cifrado, iv, tag);
  if (senhaLida !== senha) fail("leitura da credencial devolveu senha errada");
  console.log("ok · leitura da credencial devolve a senha correta");

  // 6. estado vazio honesto (AC-16) e UNIQUE(empresa_id, mes) do relatorio (AC-13).
  const db2 = new DatabaseSync(dbPath);
  const vazias = Number(db2.prepare("SELECT COUNT(*) AS n FROM credencial WHERE empresa_id = ?").get("nao-existe").n);
  if (vazias !== 0) fail("cofre de empresa sem registro não devolveu 0");
  db2.prepare(`INSERT INTO relatorio (id, empresa_id, mes, conteudo, gerado_em)
               VALUES ('e2e-rel-1', ?, '2026-10', '{"a":1}', ?)
               ON CONFLICT(empresa_id, mes) DO UPDATE SET conteudo=excluded.conteudo`).run(testId, agoraIso());
  db2.prepare(`INSERT INTO relatorio (id, empresa_id, mes, conteudo, gerado_em)
               VALUES ('e2e-rel-2', ?, '2026-10', '{"a":2}', ?)
               ON CONFLICT(empresa_id, mes) DO UPDATE SET conteudo=excluded.conteudo`).run(testId, agoraIso());
  const nRel = Number(db2.prepare("SELECT COUNT(*) AS n FROM relatorio WHERE empresa_id = ? AND mes = '2026-10'").get(testId).n);
  if (nRel !== 1) fail(`relatorio duplicou (${nRel} linhas para o mesmo mês)`);
  db2.close();
  console.log("ok · cofre vazio devolve 0 e relatorio não duplica por (empresa, mês)");

  // 7. backup (AC-12): cria com data no nome e a segunda execução do dia não perde a primeira.
  const r1 = backup({ dbPath, backupsDir, keep: 5 });
  if (!existsSync(r1.arquivo)) fail("arquivo de backup não foi criado");
  const bd = new DatabaseSync(r1.arquivo);
  const nEmpBackup = Number(bd.prepare("SELECT COUNT(*) AS n FROM empresa").get().n);
  if (nEmpBackup <= 0) fail("backup não abriu como banco válido");
  bd.close();
  const r2 = backup({ dbPath, backupsDir, keep: 5 });
  if (!existsSync(r2.arquivo) || r2.arquivo === r1.arquivo) fail("segunda execução do backup sobrescreveu a cópia do dia");
  console.log("ok · backup com data no nome, duas cópias no mesmo dia, abre como banco válido");

  // 8. limpeza do banco temporário e dos arquivos de teste.
  await rm(tmpDir, { recursive: true, force: true });
  console.log(`PASS: banco temporário migrado, testado e removido (${tmpDir})`);
  process.exit(0);
}

main().catch((e) => fail(e?.message || "erro inesperado"));
