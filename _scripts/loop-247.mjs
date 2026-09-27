#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  LOOP 24/7 — um turno da agência rodando sozinho.
//
//  Uso:
//    node _scripts/loop-247.mjs <rotina>
//    rotinas: prospeccao · respostas · followup · relatorio · health
//
//  Por que este script existe em vez de chamar `claude -p` direto do .cmd:
//
//  O loop anterior (prospeccao-diaria.cmd) morreu em silêncio. Rodou dia
//  25/09 às 9:42 e devolveu "Failed to authenticate: OAuth session expired",
//  exit=1. Ninguém soube: a falha só existia numa linha de .log que nunca
//  é lida. Um loop que falha calado é pior que loop nenhum, porque você
//  acha que está prospectando.
//
//  Então todo turno aqui:
//    1. CHECA a credencial antes de trabalhar.
//    2. Se a credencial morreu, grava ALERTA no vault (onde você olha todo
//       dia) em vez de tentar trabalhar e falhar.
//    3. Só então executa.
//    4. Registra o resultado no vault — sucesso OU fracasso, sempre.
// ─────────────────────────────────────────────────────────────────────────────
import { spawn } from "node:child_process";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

process.noDeprecation = true;

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const DIARIO = join(VAULT, "70 Diário de Bordo");
const LOG = join(HERE, "loop-247.log");

const FALHA_AUTH = /failed to authenticate|oauth session expired|not logged in|invalid api key|credit balance|please run .?login/i;

const hoje = () => new Date().toISOString().slice(0, 10);
const agora = () => new Date().toLocaleString("pt-BR");

async function log(linha) {
  try { await appendFile(LOG, `[${agora()}] ${linha}\n`, "utf8"); } catch { /* log não bloqueia */ }
}

function exec(cmd, args, cwd, timeoutSec, stdinText) {
  return new Promise((res) => {
    // shell:true só para os .cmd (claude, opencode) — sem ele o Windows não os
    // acha. Num .exe de caminho com espaço (C:\Program Files\nodejs\node.exe) o
    // shell parte o caminho no espaço e falha, então ali vai shell:false.
    const precisaShell = process.platform === "win32" && !/\.exe$/i.test(cmd);
    const c = spawn(cmd, args, { cwd, shell: precisaShell, stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "", done = false;
    const t = setTimeout(() => {
      if (!done) { done = true; try { c.kill("SIGKILL"); } catch { /* já morreu */ } res({ code: 124, out, err: err + "\ntimeout " + timeoutSec + "s" }); }
    }, timeoutSec * 1000);
    if (stdinText != null) { c.stdin.on("error", () => {}); c.stdin.write(stdinText); c.stdin.end(); } else c.stdin.end();
    c.stdout.on("data", (d) => (out += d));
    c.stderr.on("data", (d) => (err += d));
    c.on("error", (e) => { if (!done) { done = true; clearTimeout(t); res({ code: 127, out, err: e.message }); } });
    c.on("close", (code) => { if (!done) { done = true; clearTimeout(t); res({ code, out, err }); } });
  });
}

// ── as rotinas do relógio (espelham 20 Playbooks/crontab-24-7.txt) ───────────
//  escreve:true  → precisa gravar no vault, roda com acceptEdits
//  escreve:false → só lê e relata
const ROTINAS = {
  prospeccao: {
    quando: "segunda 8h",
    escreve: true,
    timeout: 900,
    prompt: `Rotina de prospecção da agência Marca Digital. Execute agora, sem fazer perguntas:

1. Rode: node _scripts/prospeccao-automatica.mjs
2. Leia o JSON de saída.
3. Registre o diário em "${DIARIO}/${hoje()} - Prospeccao automatica.md" com: data, quantos auditados, quais adicionados (nomes), quantos descartados e qualquer erro.
4. NUNCA envie mensagem para lead. Apenas abasteça o estágio 0 do pipeline para o Everton aprovar.
5. Se o app na porta 3100 não responder, registre isso no diário e encerre — não force.

Termine com um resumo de 3 linhas.`,
  },

  respostas: {
    quando: "diário 9h",
    escreve: true,
    timeout: 600,
    prompt: `Rotina de checagem de respostas da agência Marca Digital. Execute agora, sem fazer perguntas:

1. Verifique no Gmail se algum lead respondeu proposta enviada.
2. Para cada resposta, atualize a ficha do lead em "${VAULT}/40 Comercial/Leads/[nome].md" com a data e o teor da resposta.
3. Se alguém demonstrou interesse, marque a ficha como PRIORIDADE e registre no diário.
4. NUNCA responda o lead automaticamente. Só registre — a resposta é do Everton.
5. Registre o turno em "${DIARIO}/${hoje()} - Respostas.md".

Termine listando quem respondeu e quem precisa de atenção hoje.`,
  },

  followup: {
    quando: "seg/qua/sex 10h",
    escreve: true,
    timeout: 600,
    prompt: `Rotina de follow-up da agência Marca Digital. Execute agora, sem fazer perguntas:

1. Liste as propostas enviadas sem resposta e calcule os dias desde o envio.
2. Regra: 3 dias = 1º follow-up · 7 dias = 2º · 14 dias = último (depois arquivar).
3. Para cada um que está no prazo, escreva o RASCUNHO do follow-up na ficha do lead em "${VAULT}/40 Comercial/Leads/".
4. NUNCA envie. Deixe como rascunho marcado "aguardando aprovação do Everton".
5. Nunca repita follow-up já enviado — confira o histórico na ficha antes.
6. Registre o turno em "${DIARIO}/${hoje()} - Followup.md".

Termine com a lista de rascunhos prontos para aprovar.`,
  },

  relatorio: {
    quando: "sexta 17h",
    escreve: true,
    timeout: 900,
    prompt: `Relatório semanal da agência Marca Digital. Execute agora, sem fazer perguntas:

1. Leia o Kanban, o Placar e o pipeline de leads do vault.
2. Compile a semana: leads novos, propostas enviadas, respostas, fechamentos, receita.
3. Atualize "${VAULT}/60 Financeiro/Placar.md" se houver entrada nova.
4. Aponte o que está parado há mais de 7 dias.
5. Proponha os 3 cartões da semana seguinte.
6. Grave em "${DIARIO}/${hoje()} - Relatorio semanal.md".

Termine com o número do placar e os 3 cartões propostos.`,
  },

  health: {
    quando: "diário 7h50 (antes do primeiro turno)",
    escreve: false,
    timeout: 300,
    prompt: null, // roda o ia.mjs --check em vez de um prompt
  },
};

// ── alerta visível: o vault é onde o Everton olha, o .log não é ──────────────
async function alertar(rotina, motivo, detalhe) {
  const arquivo = join(DIARIO, `${hoje()} - ALERTA loop 24-7 parado.md`);
  const corpo = `---
titulo: ALERTA — loop 24/7 parado
data: ${hoje()}
tags:
  - alerta
  - loop
  - operacao
---

# ⛔ O loop 24/7 não rodou

- **Rotina:** \`${rotina}\` (${ROTINAS[rotina]?.quando || "?"})
- **Quando:** ${agora()}
- **Motivo:** ${motivo}

## O que fazer

${motivo.includes("AUTENTICAÇÃO")
  ? `A credencial do Claude expirou. O loop não trabalha sem ela.

1. Abra o terminal e rode \`claude\` (ou \`/login\` dentro dele).
2. Confirme com: \`node _scripts/ia.mjs --check\` — precisa dar 5/5 motores vivos.
3. A rotina volta sozinha no próximo horário. Para rodar agora: \`node _scripts/loop-247.mjs ${rotina}\`

**Isso vai acontecer de novo.** OAuth de assinatura expira. Enquanto o loop depender dele, ele vai parar de vez em quando — por isso este alerta existe: para você saber no mesmo dia, e não descobrir três semanas depois que não prospectou.`
  : `1. Veja o detalhe abaixo.
2. Rode \`node _scripts/ia.mjs --check\` para ver quais motores estão vivos.
3. Para repetir o turno: \`node _scripts/loop-247.mjs ${rotina}\``}

## Detalhe técnico

\`\`\`
${(detalhe || "(sem saída)").slice(0, 2000)}
\`\`\`
`;
  try {
    await mkdir(DIARIO, { recursive: true });
    await writeFile(arquivo, corpo, "utf8");
    await log(`ALERTA gravado: ${arquivo}`);
    console.error(`⛔ ${motivo} — alerta gravado em ${arquivo}`);
  } catch (e) {
    console.error(`⛔ ${motivo} — E NÃO CONSEGUI GRAVAR O ALERTA: ${e.message}`);
  }
}

// ── checagem de credencial antes de gastar um turno ──────────────────────────
async function credencialViva() {
  const r = await exec("claude", ["-p", "--output-format", "text"], process.env.TEMP || ROOT, 120, "Responda apenas: VIVO");
  const texto = r.out + r.err;
  if (FALHA_AUTH.test(texto)) return { ok: false, motivo: "AUTENTICAÇÃO — a sessão do Claude expirou", detalhe: texto };
  if (r.code !== 0) return { ok: false, motivo: `o Claude headless saiu com código ${r.code}`, detalhe: texto };
  if (!r.out.trim()) return { ok: false, motivo: "o Claude headless respondeu vazio", detalhe: texto };
  return { ok: true };
}

(async () => {
  const nome = (process.argv[2] || "").trim();
  const rotina = ROTINAS[nome];

  if (!rotina) {
    console.log("Uso: node _scripts/loop-247.mjs <rotina>\n");
    console.log("Rotinas:");
    for (const [k, v] of Object.entries(ROTINAS)) console.log(`  ${k.padEnd(11)} ${v.quando}`);
    process.exit(1);
  }

  await log(`── turno '${nome}' iniciado`);

  // health é só o check dos motores
  if (nome === "health") {
    const r = await exec(process.execPath, [join(HERE, "ia.mjs"), "--check"], ROOT, rotina.timeout);
    console.log(r.out || r.err);
    if (r.code !== 0) {
      const auth = FALHA_AUTH.test(r.out + r.err) || /AUTENTICAÇÃO/.test(r.out);
      await alertar("health", auth ? "AUTENTICAÇÃO — um motor perdeu a credencial" : "um ou mais motores estão fora", r.out + r.err);
      await log(`turno 'health' FALHOU (exit ${r.code})`);
      process.exit(r.code);
    }
    await log("turno 'health' ok — todos os motores vivos");
    process.exit(0);
  }

  // 1. credencial antes de trabalhar
  const cred = await credencialViva();
  if (!cred.ok) {
    await alertar(nome, cred.motivo, cred.detalhe);
    await log(`turno '${nome}' ABORTADO: ${cred.motivo}`);
    process.exit(2);
  }

  // 2. executar o turno
  const flags = [
    "-p", "--output-format", "text",
    "--add-dir", VAULT,
    "--allowedTools", "Read,Edit,Write,Bash,WebFetch,Glob,Grep",
    "--append-system-prompt",
    "Você está em modo headless, sem ninguém para responder. NUNCA faça perguntas, NUNCA peça confirmação, NUNCA apresente opções para escolha. Decida com o que tem e registre a decisão. Se faltar informação essencial, registre isso no vault como pendência e siga com o resto. Nunca envie mensagem a cliente ou lead — só rascunho.",
  ];
  // acceptEdits: o turno precisa gravar no vault e não há humano para aprovar
  if (rotina.escreve) flags.push("--permission-mode", "acceptEdits");

  const r = await exec("claude", flags, ROOT, rotina.timeout, rotina.prompt);
  const texto = r.out + r.err;

  if (FALHA_AUTH.test(texto)) {
    await alertar(nome, "AUTENTICAÇÃO — a sessão caiu durante o turno", texto);
    await log(`turno '${nome}' FALHOU na autenticação no meio do trabalho`);
    process.exit(2);
  }

  if (r.code !== 0) {
    await alertar(nome, `o turno terminou com erro (código ${r.code})`, texto);
    await log(`turno '${nome}' FALHOU (exit ${r.code})`);
    process.exit(3);
  }

  console.log(r.out.trim());
  await log(`turno '${nome}' concluído ok (${r.out.length} bytes)`);
  process.exit(0);
})();
