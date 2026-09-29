#!/usr/bin/env node
// Backup diário do banco da plataforma, com rotação. Nunca sobrescreve a cópia do dia.
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  unlinkSync,
} from "node:fs";
import { resolve, dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ENV_FILE = join(ROOT, "apps", "plataforma", ".env.local");

// Lê KEY=VALUE linha por linha, tirando aspas (igual ao e2e-demanda.mjs).
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

const envDoArquivo = existsSync(ENV_FILE) ? parseEnv(readFileSync(ENV_FILE, "utf8")) : {};
const VAULT = process.env.VAULT || envDoArquivo.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const AGENCIA_DB =
  process.env.AGENCIA_DB ||
  envDoArquivo.AGENCIA_DB ||
  join(ROOT, "apps", "plataforma", "data", "plataforma.sqlite");
const BACKUPS_DIR = join(dirname(AGENCIA_DB), "backups");
const KEEP_PADRAO = Number(process.env.AGENCIA_BACKUP_KEEP) || 30;

// Copia o banco para backupsDir com data no nome e aplica a rotação.
export function backup({ dbPath, backupsDir, keep = KEEP_PADRAO }) {
  if (!existsSync(dbPath)) {
    throw new Error(`banco não encontrado: ${dbPath}`);
  }
  mkdirSync(backupsDir, { recursive: true });

  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const ymd = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const hms = `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;

  let arquivo = join(backupsDir, `plataforma-${ymd}.sqlite`);
  if (existsSync(arquivo)) {
    // a cópia do dia já existe: usa sufixo de horário, sem sobrescrever (AC-12).
    arquivo = join(backupsDir, `plataforma-${ymd}-${hms}.sqlite`);
  }
  copyFileSync(dbPath, arquivo);

  // rotação: mantém os últimos `keep` arquivos, apagando os mais antigos por nome.
  const todos = readdirSync(backupsDir)
    .filter((f) => /^plataforma-.*\.sqlite$/.test(f))
    .sort();
  let removidos = 0;
  while (todos.length > keep) {
    unlinkSync(join(backupsDir, todos.shift()));
    removidos++;
  }

  return { arquivo, mantidos: todos.length, removidos };
}

// ---------- CLI ----------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const r = backup({ dbPath: AGENCIA_DB, backupsDir: BACKUPS_DIR, keep: KEEP_PADRAO });
    console.log(`Backup criado: ${r.arquivo}`);
    console.log(`Mantidos: ${r.mantidos} · removidos: ${r.removidos}`);
    process.exit(0);
  } catch (e) {
    console.error(`FAIL: ${e?.message || "erro inesperado"}`);
    process.exit(1);
  }
}

// ---------- agendamento (não executado) ----------
// Cron diário às 3h da manhã:
//   0 3 * * * node <ROOT>/_scripts/db/backup.mjs >> <ROOT>/_scripts/dados/backup.log 2>&1
//
// systemd timer (VPS), arquivo plataforma-backup.service:
//   [Unit]
//   Description=Backup diário do banco da plataforma
//
//   [Service]
//   Type=oneshot
//   ExecStart=/usr/bin/node <ROOT>/_scripts/db/backup.mjs
//
// systemd timer, arquivo plataforma-backup.timer:
//   [Unit]
//   Description=Dispara o backup do banco da plataforma todo dia às 3h
//
//   [Timer]
//   OnCalendar=*-*-* 03:00:00
//   Persistent=true
//
//   [Install]
//   WantedBy=timers.target
