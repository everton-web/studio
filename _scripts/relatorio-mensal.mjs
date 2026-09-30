#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  RELATÓRIO MENSAL · agendador do dia 1
//
//  Gera o relatório do mês de todos os clientes ativos chamando a MESMA rota
//  que o botão do Hoje usa (POST /api/relatorio-mensal). Assim existe uma única
//  função de geração. Idempotente: rodar de novo no mesmo mês atualiza a linha
//  (empresa, mês) e mantém o link; nunca duplica. Não envia nada ao cliente e
//  não chama git. O envio é o toque do Everton no WhatsApp, pelo Hoje.
//
//  Uso:
//    node _scripts/relatorio-mensal.mjs               (mês atual)
//    node _scripts/relatorio-mensal.mjs --mes 2026-10
//
//  Variáveis (ou apps/plataforma/.env.local): AGENCIA_USER, AGENCIA_PASS.
//  PLATAFORMA_URL aponta para a plataforma (padrão http://localhost:3100).
//  Nunca imprime senha nem token de link.
//
//  ── AGENDAMENTO NA VPS ────────────────────────────────────────────────────
//  Opção A · cron (todo dia 1, 08:00, horário de Salvador):
//    0 8 1 * *  cd /srv/studio && /usr/bin/node _scripts/relatorio-mensal.mjs >> /var/log/studio-relatorio.log 2>&1
//
//  Opção B · systemd timer (mesmo padrão do backup):
//    /etc/systemd/system/studio-relatorio.service
//      [Unit]
//      Description=Gera relatorios mensais dos clientes
//      [Service]
//      Type=oneshot
//      WorkingDirectory=/srv/studio
//      EnvironmentFile=/srv/studio/apps/plataforma/.env.local
//      Environment=PLATAFORMA_URL=http://localhost:3100
//      ExecStart=/usr/bin/node _scripts/relatorio-mensal.mjs
//
//    /etc/systemd/system/studio-relatorio.timer
//      [Unit]
//      Description=Relatorios mensais no dia 1
//      [Timer]
//      OnCalendar=*-*-01 08:00:00
//      Persistent=true
//      [Install]
//      WantedBy=timers.target
//
//    sudo systemctl daemon-reload && sudo systemctl enable --now studio-relatorio.timer
//  Persistent=true roda a geração atrasada se a VPS estava desligada no dia 1.
// ─────────────────────────────────────────────────────────────────────────────
import { readFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = join(ROOT, "apps", "plataforma", ".env.local");

function parseEnv(txt) {
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[m[1]] = v;
  }
  return env;
}

async function main() {
  const arquivo = await readFile(ENV_FILE, "utf8").catch(() => "");
  const env = { ...parseEnv(arquivo), ...Object.fromEntries(Object.entries(process.env).filter(([, v]) => v)) };
  const user = env.AGENCIA_USER;
  const pass = env.AGENCIA_PASS;
  if (!user || !pass) throw new Error("AGENCIA_USER/AGENCIA_PASS ausentes");
  const base = (env.PLATAFORMA_URL || "http://localhost:3100").replace(/\/+$/, "");

  const i = process.argv.indexOf("--mes");
  const mes = i > -1 ? process.argv[i + 1] : undefined;

  const rl = await fetch(`${base}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, pass }),
  });
  const token = (rl.headers.get("set-cookie") || "").match(/agencia_token=([^;]+)/)?.[1];
  if (!rl.ok || !token) throw new Error(`login falhou (HTTP ${rl.status})`);

  const r = await fetch(`${base}/api/relatorio-mensal`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `agencia_token=${token}` },
    body: JSON.stringify({ action: "gerar", ...(mes ? { mes } : {}) }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(`geração falhou (HTTP ${r.status}) ${j.error || ""}`.trim());

  const novos = j.geradas.filter((g) => g.criado).length;
  console.log(`relatórios de ${j.mes}: ${novos} novo(s), ${j.geradas.length - novos} atualizado(s), ${j.falhas.length} falha(s)`);
  for (const f of j.falhas) console.error(`falha em ${f.empresaId}: ${f.erro}`);
  process.exit(j.falhas.length ? 1 : 0);
}

main().catch((e) => {
  console.error(`FAIL: ${e?.message || "erro inesperado"}`);
  process.exit(1);
});
