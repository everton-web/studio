#!/usr/bin/env node
// Preenche WhatsApp, telefone e e-mail das fichas de lead que entraram sem contato,
// lendo os canais publicados no próprio site do lead. Só preenche campo vazio; nunca apaga.
// Uso: node _scripts/contatos-leads.mjs [--dry]
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";
const DIR = join(VAULT, "40 Comercial", "Leads");
const DRY = process.argv.includes("--dry");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

// Telefone brasileiro válido: DDD + 8 dígitos (fixo, começa com 2 a 5) ou DDD + 9 + 8 (celular).
// Celular antigo sem o 9 ganha o 9. Qualquer outra coisa (número de tema, de outro país) é descartada.
function foneBR(v) {
  let d = String(v || "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (!/^[1-9][1-9]/.test(d)) return "";
  if (d.length === 10 && /[6-9]/.test(d[2])) d = d.slice(0, 2) + "9" + d.slice(2);
  if (d.length === 10 && /[2-5]/.test(d[2])) return "55" + d;
  if (d.length === 11 && d[2] === "9") return "55" + d;
  return "";
}
function extrair(html) {
  const wa = html.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\/?\?phone=)(\+?\d{10,13})/i)?.[1];
  const tel = html.match(/href=["']tel:([+\d\s().-]{8,20})["']/i)?.[1];
  const email = html.match(/href=["']mailto:([^"'?\s]+@[^"'?\s]+)/i)?.[1];
  return {
    whatsapp: wa ? foneBR(wa) : "",
    telefone: tel ? foneBR(tel) : "",
    email: email && !/example|seudominio|email@/i.test(email) ? email.toLowerCase() : "",
  };
}

const campo = (fm, k) => (fm.match(new RegExp(`^${k}:[ \\t]*(.*)$`, "m"))?.[1] || "").trim().replace(/^["']|["']$/g, "");
const setar = (fm, k, v) => new RegExp(`^${k}:[^\\n]*$`, "m").test(fm) ? fm.replace(new RegExp(`^${k}:[^\\n]*$`, "m"), `${k}: ${v}`) : fm + `\n${k}: ${v}`;

let preenchidos = 0, semContato = 0, olhados = 0;
for (const f of (await readdir(DIR)).filter((x) => x.endsWith(".md"))) {
  const raw = await readFile(join(DIR, f), "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) continue;
  let fm = m[1];
  if (campo(fm, "status") && campo(fm, "status") !== "ativo") continue;
  const site = campo(fm, "site-atual");
  if (!site || campo(fm, "whatsapp") || campo(fm, "contato")) continue;
  olhados++;
  let html = "";
  try {
    const r = await fetch(site.startsWith("http") ? site : `https://${site}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000) });
    html = await r.text();
  } catch { /* site fora do ar */ }
  const c = extrair(html);
  if (!c.whatsapp && !c.telefone && !c.email) { semContato++; console.log(`  sem contato no site · ${f}`); continue; }
  const fone = c.whatsapp || c.telefone;
  if (fone) { fm = setar(fm, "whatsapp", fone); fm = setar(fm, "contato", c.telefone || fone); }
  if (c.email && !campo(fm, "email")) fm = setar(fm, "email", c.email);
  preenchidos++;
  console.log(`  ${fone ? "WhatsApp " + fone : "e-mail " + c.email} · ${f}`);
  if (!DRY) await writeFile(join(DIR, f), raw.replace(m[1], fm), "utf8");
}
console.log(`\nLeads sem contato olhados: ${olhados} · preenchidos: ${preenchidos} · continuam sem contato: ${semContato}${DRY ? " (simulação)" : ""}`);
