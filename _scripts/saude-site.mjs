#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  SAÚDE DO SITE — verifica os sites dos clientes e grava o resultado real.
//
//  Para cada cliente em vault/40 Comercial/Clientes/*.md:
//    - extrai o site do frontmatter "site" ou do corpo "**Site:** URL"
//    - no_ar: fetch (status 200-399 = true, senão false, timeout 10s)
//    - certificado_dias: https.get + socket.getPeerCertificate().valid_to
//    - formulario: fetch da home, contém "<form" (case-insensitive)
//  e grava vault/SaaS/Saude/<slug>.json.
//
//  VAULT vem de process.env.VAULT ou de apps/plataforma/.env.local.
//  Uso: node _scripts/saude-site.mjs
//  Só usa built-ins do Node + fetch global. Nunca imprime credenciais.
// ─────────────────────────────────────────────────────────────────────────────
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = join(ROOT, "apps", "plataforma", ".env.local");
const VAULT_PADRAO = "D:/Obsidian - Claude/🏢 Agência";

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

async function acharVault() {
  if (process.env.VAULT) return process.env.VAULT;
  try {
    const txt = await readFile(ENV_FILE, "utf8");
    const env = parseEnv(txt);
    if (env.VAULT) return env.VAULT;
  } catch {
    /* sem .env.local */
  }
  return VAULT_PADRAO;
}

function frontmatter(md) {
  const m = String(md).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

function slugify(s) {
  return (
    String(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "site"
  );
}

function extrairSite(raw) {
  const fm = frontmatter(raw);
  if (fm.site && /^https?:\/\//i.test(fm.site)) return fm.site;
  const m = String(raw).match(/\*\*Site:\*\*\s*(https?:\/\/[^\s)]+)/);
  return m ? m[1] : "";
}

// baixa a home uma vez: devolve status e html (html null se não baixou)
async function baixar(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(url, { redirect: "follow", signal: ctrl.signal });
    const html = await r.text();
    return { status: r.status, html };
  } catch {
    return { status: 0, html: null };
  } finally {
    clearTimeout(t);
  }
}

// dias até o vencimento do certificado (null se não for https ou falhar)
function certificadoDias(url) {
  return new Promise((resolveDias) => {
    let done = false;
    const fim = (v) => {
      if (!done) {
        done = true;
        resolveDias(v);
      }
    };
    if (!/^https:/i.test(url)) return fim(null);
    let req;
    try {
      req = https.get(url, { timeout: 10000 }, (res) => {
        const socket = res.socket;
        const cert = socket ? socket.getPeerCertificate() : null;
        const validTo = cert && cert.valid_to ? new Date(cert.valid_to) : null;
        res.resume();
        if (validTo && !Number.isNaN(validTo.getTime())) {
          fim(Math.max(0, Math.floor((validTo.getTime() - Date.now()) / 86400000)));
        } else {
          fim(null);
        }
      });
    } catch {
      return fim(null);
    }
    req.on("error", () => fim(null));
    req.on("timeout", () => {
      try {
        req.destroy();
      } catch {
        /* ignore */
      }
      fim(null);
    });
  });
}

async function main() {
  const VAULT = await acharVault();
  const DIR_CLIENTES = join(VAULT, "40 Comercial", "Clientes");
  const DIR_SAUDE = join(VAULT, "SaaS", "Saude");

  let files = [];
  try {
    files = (await readdir(DIR_CLIENTES)).filter((f) => f.toLowerCase().endsWith(".md"));
  } catch {
    console.log("Sem clientes para verificar.");
    process.exit(0);
  }

  let verificados = 0;
  let pulados = 0;
  const linhas = [];

  for (const f of files.sort()) {
    const raw = await readFile(join(DIR_CLIENTES, f), "utf8").catch(() => "");
    if (!raw) {
      pulados++;
      continue;
    }
    const fm = frontmatter(raw);
    const cliente = fm.cliente || f.replace(/\.md$/i, "");
    const site = extrairSite(raw);
    if (!site) {
      pulados++;
      continue;
    }

    const slug = slugify(cliente);
    const { status, html } = await baixar(site);
    const no_ar = html !== null ? status >= 200 && status < 400 : false;
    const certificado_dias = await certificadoDias(site);
    const formulario = html === null ? null : /<form/i.test(html) ? "ok" : "falha";
    const verificado_em = new Date().toISOString();

    const dados = { slug, cliente, site, no_ar, certificado_dias, formulario, verificado_em };
    try {
      await mkdir(DIR_SAUDE, { recursive: true });
      await writeFile(join(DIR_SAUDE, `${slug}.json`), JSON.stringify(dados, null, 2) + "\n", "utf8");
      verificados++;
      linhas.push(
        `${slug} · no_ar=${no_ar} · cert=${certificado_dias === null ? "?" : certificado_dias + "d"} · form=${formulario || "?"}`,
      );
    } catch {
      pulados++;
    }
  }

  console.log(`Saúde do site: ${verificados} verificados, ${pulados} sem site ou falha.`);
  for (const l of linhas) console.log(`  ${l}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(`FAIL: ${e && e.message ? e.message : "erro inesperado"}`);
  process.exit(0);
});
