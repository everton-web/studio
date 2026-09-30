import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

// Caminho padrão do arquivo SQLite quando AGENCIA_DB não está definido.
const CAMINHO_PADRAO = join(process.cwd(), "data", "plataforma.sqlite");

// Conexão única reaproveitada por todo o processo.
let instancia: DatabaseSync | null = null;

// Caminho efetivo do banco: variável de ambiente ou o padrão local.
export function dbPath(): string {
  return process.env.AGENCIA_DB || CAMINHO_PADRAO;
}

// Localiza o schema.sql. Tenta primeiro o cwd (o app roda em apps/plataforma)
// e depois a pasta deste módulo. O primeiro caminho que existir vence.
function acharSchemaSql(): string {
  const tentativas = [
    join(process.cwd(), "src", "lib", "schema.sql"),
    join(dirname(fileURLToPath(import.meta.url)), "schema.sql"),
  ];
  for (const caminho of tentativas) {
    if (existsSync(caminho)) return caminho;
  }
  throw new Error("schema.sql não encontrado para inicializar o banco");
}

// Bancos criados antes da v3-04 não têm as colunas do card do cliente.
// Acrescenta só o que falta, sem tocar nos dados.
function garantirColunas(db: DatabaseSync): void {
  const existentes = new Set(
    db.prepare("PRAGMA table_info(empresa)").all().map((c) => String(c.name)),
  );
  const novas: [string, string][] = [
    ["valor_projeto", "REAL"],
    ["recorrencia", "REAL"],
    ["fechado_em", "TEXT"],
  ];
  for (const [nome, tipo] of novas) {
    if (!existentes.has(nome)) db.exec(`ALTER TABLE empresa ADD COLUMN ${nome} ${tipo}`);
  }
}

// Abre o banco uma única vez (lazy). Só toca no disco na primeira chamada,
// nunca no import, para não quebrar o build.
export function getDb(): DatabaseSync {
  if (instancia) return instancia;

  const caminho = dbPath();
  mkdirSync(dirname(caminho), { recursive: true });

  const db = new DatabaseSync(caminho);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(readFileSync(acharSchemaSql(), "utf8"));
  garantirColunas(db);

  instancia = db;
  return instancia;
}

// Fecha a conexão aberta. Útil para testes.
export function closeDb(): void {
  if (instancia) {
    instancia.close();
    instancia = null;
  }
}
