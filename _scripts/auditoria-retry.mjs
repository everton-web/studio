#!/usr/bin/env node
// auditoria-retry.mjs — Watcher da auditoria Opus 4.8 via subscription OAuth.
// Tenta de tempos em tempos; quando a janela de quota liberar, grava o relatório.
// GDPR da operação: sem segredos no log (só status/HTTP).
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "_scripts", "auditoria-opus.md");
const LOG = join(ROOT, "_scripts", "auditoria-retry.log");
const MAX_TRIES = 16;
const INTERVALO = 7 * 60 * 1000; // 7 min entre tentativas (~112 min de cobertura)

function log(m) {
  const line = `[${new Date().toLocaleString("pt-BR")}] ${m}\n`;
  appendFile(LOG, line).catch(() => {});
  console.log(line.trim());
}

async function token() {
  try {
    const a = JSON.parse(await readFile(join(homedir(), ".pi", "agent", "auth.json"), "utf8"));
    return a.anthropic?.access || null;
  } catch { return null; }
}

const PROMPT = `Audite a estrutura do SaaS em D:/studio/apps/plataforma (Next 16 + Tailwind v4 + shadcn). Contexto: vault Obsidian 'D:/Obsidian - Claude/🏢 Agência' é a fonte da verdade (markdown/JSON); o app espelha e opera: pipeline de prospecção, prospector automático com audit de sites + cache, InfinitePay webhook que atualiza o Placar, rastreamento pixel + Clarity, analytics de tráfego pago, finanças com links de pagamento. Entregue: 1) Mapa da arquitetura com forças e fraquezas; 2) Riscos com severidade (segurança, robustez, concorrência de leitura/escrita no vault, dependência do PC/túnel); 3) 5 melhorias priorizadas por impacto/esforço com o que fazer; 4) Análise do ROI de evoluir para banco (SQLite/Supabase) vs ficar no vault. Técnico, direto, PT-BR, máx. 250 linhas.`;

async function tentar() {
  const tok = await token();
  if (!tok) return { ok: false, tipo: "sem-token" };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}`, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-opus-4-8", max_tokens: 9000, messages: [{ role: "user", content: PROMPT }] }),
    signal: AbortSignal.timeout(240000),
  });
  if (!r.ok) {
    const code = r.status;
    const body = (await r.text()).slice(0, 160);
    return { ok: false, tipo: code === 429 ? "quota" : `http-${code}`, detail: body };
  }
  const j = await r.json();
  const txt = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
  return { ok: true, txt };
}

(async () => {
  log(`watcher iniciado (${MAX_TRIES} tentativas × ${INTERVALO / 60000} min)`);
  for (let i = 1; i <= MAX_TRIES; i++) {
    log(`tentativa ${i}/${MAX_TRIES}…`);
    try {
      const res = await tentar();
      if (res.ok) {
        await writeFile(OUT, res.txt, "utf8");
        log(`SUCESSO — auditoria salva em _scripts/auditoria-opus.md (${res.txt.length} chars)`);
        process.exit(0);
      }
      log(`  ${res.tipo}${res.detail ? " — " + res.detail : ""}`);
      if (res.tipo === "sem-token") { log("sem token do pi — encerrando"); process.exit(2); }
    } catch (e) {
      log(`  erro: ${e?.message?.slice(0, 120) || e}`);
    }
    await new Promise((r) => setTimeout(r, INTERVALO));
  }
  log("encerrado sem sucesso — rode /claude mais tarde ou aguarde a janela zerar.");
})();