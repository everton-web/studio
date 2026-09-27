#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  DISPACHA — o coração do fluxograma de agentes.
//  Uma demanda chega no ORQUESTRA (terminal principal) e este decide QUEM ajuda:
//
//     DEMANDA → ORQUESTRA → DISPACHA → [caio|davi|theo|mia] → executa → devolve
//
//  Uso:
//    node _scripts/dispacha.mjs "texto da demanda" [--ia barata|claude] [--no-fila]
//    node _scripts/dispacha.mjs --tabela        (mostra as regras de escolha)
//
//  O que ele faz: (1) classifica a demanda por keywords, (2) grava um recado no
//  PAINEL DOS AGENTES (vault/SaaS/Agentes/painel.md), (3) cria tarefa na fila do
//  orquestrador (orquestra.mjs nova) para o terminal da persona pegar/executar.
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const PAINEL = join(VAULT, "SaaS", "Agentes", "painel.md");

const ROTAS = [
  { nome: "orion", regra: "coordenação → orquestrar, coordenar, rotear, governar, priorizar, dividir squad, aiox, delegar",
    kw: ["orquestr", "coorden", "rotea", "governa", "prioriz", "squad", "aiox", "dividir", "delegar", "organizar agentes", "planejar"] },
  { nome: "caio", regra: "comercial → proposta, diagnóstico, lead, venda, follow-up, contato, prospecção, preço, CRM",
    kw: ["propost", "diagnóstico", "lead", "venda", "follow", "contato", "prospec", "preço", "precificação", "comercial", "cliente", "negoci", "mensagem"] },
  { nome: "davi", regra: "design → UI, identidade, layout, cores, tipografia, wireframe, mockup, auditar visual",
    kw: ["design", "ui", "layout", "identidade", "visual", "cor", "fonte", "wireframe", "mockup", "estética", "impeccable", "hero", "landing visual"] },
  { nome: "theo", regra: "dev → código, build, deploy, hostinger, api, banco, segurança, performance, wordpress, migração",
    kw: ["código", "codigo", "dev", "build", "deploy", "hostinger", "api", "banco", "dados", "segurança", "seguranca", "performance", "otimizaç", "wordpress", "migraç", "vanilla", "bug", "erro"] },
  { nome: "ops", regra: "infra → instalar, instalação, manutenção, script, npm, watchdog, agendado, conserto, limpar, servidor",
    kw: ["instal", "manuten", "script", "npm", "watchdog", "agend", "consert", "limpar", "servidor", "infra", "playwright", "aiox"] },
  { nome: "mia", regra: "conteúdo → case, texto, copy, portfólio, behance, post, legenda, redação, voz",
    kw: ["case", "conteúdo", "conteudo", "texto", "copy", "portfólio", "portfolio", "behance", "post", "legenda", "redaç", "voz", "história", "depoimento"] },
];

function escolher(texto) {
  const t = (texto || "").toLowerCase();
  let best = null, max = 0;
  for (const r of ROTAS) {
    const n = r.kw.filter((k) => t.includes(k)).length;
    if (n > max) { max = n; best = r.nome; }
  }
  return max > 0 ? best : null;
}

const args = process.argv.slice(2);
if (args.includes("--tabela")) {
  console.log("REGRAS DE ESCOLHA (fluxograma):\n");
  for (const r of ROTAS) console.log(`  ${r.nome.padEnd(6)} ← ${r.regra}`);
  console.log(`\n  (orion) ← se nada bater ou ambiguidade: o Coordenador decide, avisa ou pergunta.`);
  process.exit(0);
}

let ia = "barata", noFila = false, idx = 0;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--ia") { ia = args[i + 1]; i++; continue; }
  if (args[i] === "--no-fila") { noFila = true; continue; }
  idx = i; break;
}
const demanda = args.slice(idx).join(" ").trim();
if (!demanda) { console.log("Uso: node _scripts/dispacha.mjs \"demanda\" [--ia barata|claude]\n      node _scripts/dispacha.mjs --tabela"); process.exit(1); }

(async () => {
  const alvo = escolher(demanda);
  const quem = alvo || "orion (orquestrador decide/avisa)";
  const recado = `- [orquestra] ${new Date().toLocaleString("pt-BR")} · DEMANDA: ${demanda.slice(0, 110)} → escolhido: **${quem}**${alvo ? ` (IA: ${ia})` : " — ambiguidade: orquestra decide ou pergunta"}`;

  mkdirSync(dirname(PAINEL), { recursive: true });
  appendFileSync(PAINEL, "\n" + recado + "\n", "utf8");

  if (alvo && !noFila) {
    const fila = join(ROOT, "_scripts", "orquestra", "fila.json");
    const id = `dem-${Date.now().toString(36)}`;
    try {
      execFileSync(process.execPath, [join(HERE, "orquestra.mjs"), "nova", "--fila", fila, "--id", id, "--engine", alvo === "theo" ? "shell" : "claude", "--model", "claude-opus-4-8", demanda], { encoding: "utf8" });
      console.log(`✓ tarefa '${id}' na fila (engine ${alvo === "theo" ? "shell→executor" : "claude→20%"}) — roda com: node _scripts/orquestra.mjs run --somente ${id}`);
    } catch (e) { console.log("(fila não atualizada:", String(e.message).slice(0, 80), ")"); }
  }

  console.log(`\nFLUXOGRAMA`);
  console.log(`  demanda ────────────────────────────► ${quem}`);
  if (alvo) console.log(`  (executa com IA: ${ia} · resultado volta ao orquestra via painel/vault)`);
  console.log(`  recado gravado em SaaS/Agentes/painel.md ✓`);
})();