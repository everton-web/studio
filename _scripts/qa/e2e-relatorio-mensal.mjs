#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  E2E RELATÓRIO MENSAL (v3-05)
//
//  1. lê apps/plataforma/.env.local (VAULT, AGENCIA_USER, AGENCIA_PASS)
//  2. cria um cliente de teste ativo no banco (com WhatsApp), um hit de pixel
//     pelo próprio endpoint /api/t e um arquivo de saúde de teste
//  3. login + POST /api/relatorio-mensal (mesma rota do agendador) e confere a
//     linha do mês, a idempotência e a geração em lote
//  4. abre GET /r/<token> SEM cookie: números vindos da fonte, noindex, sem
//     telefone; token errado/revogado/inexistente dão 404 com a mesma página;
//     rotacionar troca o link
//  5. puppeteer: o Hoje mostra o cliente com o botão de WhatsApp (wa.me com a
//     mensagem e o link certos); nada é enviado
//  6. limpa tudo o que criou
//
//  Uso: PORT=3105 node _scripts/qa/e2e-relatorio-mensal.mjs
//  Nunca imprime credenciais nem o token completo. Sai com código 1 em falha.
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from "puppeteer-core";
import { readFile, writeFile, unlink, mkdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = process.env.PORT ? "http://localhost:" + process.env.PORT : "http://localhost:3100";
const ENV_FILE = join(ROOT, "apps", "plataforma", ".env.local");
const CHROME = join(homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe");

function fail(msg) {
  throw new Error(msg);
}
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
async function login(user, pass) {
  let ultimo = "";
  for (let n = 0; n < 3; n++) {
    try {
      const r = await fetch(`${BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass }),
      });
      const m = (r.headers.get("set-cookie") || "").match(/agencia_token=([^;]+)/);
      if (r.ok && m) return m[1];
      ultimo = `HTTP ${r.status}`;
    } catch (e) {
      ultimo = e?.message || "fetch falhou";
    }
    if (n < 2) await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`login falhou (${ultimo})`);
}
const curto = (t) => (t ? t.slice(0, 4) + "…" : "(vazio)");
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const env = parseEnv(await readFile(ENV_FILE, "utf8").catch(() => fail("não li apps/plataforma/.env.local")));
  if (!env.AGENCIA_USER || !env.AGENCIA_PASS) fail("AGENCIA_USER/AGENCIA_PASS ausentes no .env.local");
  const VAULT = process.env.VAULT || env.VAULT;
  if (!VAULT) fail("VAULT ausente");
  const dbFile = env.AGENCIA_DB || join(ROOT, "apps", "plataforma", "data", "plataforma.sqlite");
  const hoje = new Date();
  const mes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const ts = Date.now();
  const id = `e2e-rel-${ts}`;
  const nome = `Clínica E2E ${ts}`;
  const zap = "71 99999-0000";
  const inicio = new Date().toISOString();
  const db = new DatabaseSync(dbFile);
  db.exec("PRAGMA foreign_keys = ON;");
  const arqSaude = join(VAULT, "SaaS", "Saude", `${id}.json`);
  const arqHits = join(VAULT, "SaaS", "Rastreamento", "hits.json");
  let rodou = false;

  try {
    // 2. dados de teste
    const agora = new Date().toISOString();
    db.prepare(
      "INSERT INTO empresa (id, nome, cidade, site, estagio_crm, origem, criado_em, atualizado_em) VALUES (?,?,?,?,?,?,?,?)",
    ).run(id, nome, "Salvador", `https://${id}.example.com`, "cliente", "e2e", agora, agora);
    db.prepare("INSERT INTO contato (id, empresa_id, nome, whatsapp, criado_em) VALUES (?,?,?,?,?)").run(`${id}-c`, id, "", zap, agora);
    console.log("ok · cliente de teste criado");

    await mkdir(dirname(arqSaude), { recursive: true });
    await writeFile(
      arqSaude,
      JSON.stringify({ slug: id, cliente: nome, no_ar: true, certificado_dias: 60, formulario: "ok", verificado_em: agora }),
      "utf8",
    );
    const rp = await fetch(`${BASE}/api/t?site=${id}`);
    if (!rp.ok) fail("pixel /api/t falhou");
    const hits = JSON.parse(await readFile(arqHits, "utf8"));
    if (hits[id]?.n !== 1) fail("hit de teste não entrou em hits.json");
    console.log("ok · pixel registrou 1 visita no hits.json");

    // 3. geração
    const token = await login(env.AGENCIA_USER, env.AGENCIA_PASS);
    console.log("ok · login na API");
    const auth = { "Content-Type": "application/json", Cookie: `agencia_token=${token}` };
    const semLogin = await fetch(`${BASE}/api/relatorio-mensal`, { method: "POST", body: "{}" });
    if (semLogin.status !== 401) fail("POST /api/relatorio-mensal sem login deveria dar 401");

    const g1 = await fetch(`${BASE}/api/relatorio-mensal`, { method: "POST", headers: auth, body: JSON.stringify({ action: "gerar", empresaId: id }) });
    const j1 = await g1.json();
    if (!g1.ok || !j1.ok || !j1.geradas?.[0]?.criado) fail("geração do cliente de teste falhou");
    const linha = () => db.prepare("SELECT link_token, conteudo FROM relatorio WHERE empresa_id = ? AND mes = ?").all(id, mes);
    let linhas = linha();
    if (linhas.length !== 1 || !linhas[0].link_token || linhas[0].link_token.length < 30) fail("linha do mês ou token ausente");
    const tok1 = linhas[0].link_token;
    console.log(`ok · relatório do mês gerado (token ${curto(tok1)})`);

    // lote (o que o agendador faz) duas vezes: sem duplicar, mesmo link
    for (let n = 0; n < 2; n++) {
      const gl = await fetch(`${BASE}/api/relatorio-mensal`, { method: "POST", headers: auth, body: JSON.stringify({ action: "gerar" }) });
      const jl = await gl.json();
      if (!gl.ok || !jl.ok || jl.falhas.length) fail("geração em lote falhou");
      rodou = true;
    }
    linhas = linha();
    if (linhas.length !== 1 || linhas[0].link_token !== tok1) fail("geração repetida duplicou ou trocou o link");
    console.log("ok · geração em lote repetida é idempotente");

    // 4. página pública sem cookie
    const pub = await fetch(`${BASE}/r/${tok1}`);
    const html = await pub.text();
    if (pub.status !== 200) fail(`GET /r/<token> deu HTTP ${pub.status}`);
    if (!/<meta name="robots" content="[^"]*noindex/.test(html)) fail("faltou noindex");
    const texto = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    if (!texto.includes(nome)) fail("nome do cliente não apareceu");
    if (!/>1<\/div>/.test(html)) fail("visitas do pixel (1) não bateram com o hits.json");
    if (!texto.includes("válido por mais 60 dias") || !texto.includes("funcionando")) fail("saúde do site não bateu com a fonte");
    if (!texto.includes("Nenhum lead do formulário ainda.")) fail("estado vazio de leads ausente");
    if (!texto.includes("pendente de API")) fail("rótulo do Clarity ausente");
    if (!texto.includes("Sem autorização registrada")) fail("estado do Search Console ausente");
    if (html.includes("99999") || html.includes(env.AGENCIA_USER + "@")) fail("dado interno vazou na página pública");
    if (/[—–]/.test(texto)) fail("travessão na página pública");
    console.log("ok · /r/<token> sem login: 200, noindex, números da fonte, sem telefone");

    // token inexistente, malformado, revogado e rotacionado: mesma página 404
    const corpo404 = async (t) => {
      const r = await fetch(`${BASE}/r/${t}`);
      return { status: r.status, body: (await r.text()).split(t).join("TOKEN") };
    };
    const falso = "A".repeat(32);
    const inex = await corpo404(falso);
    const curtoTok = await corpo404("abc");
    if (inex.status !== 404 || curtoTok.status !== 404) fail("token inválido deveria dar 404");
    if (inex.body.includes(nome)) fail("404 vazou o nome do cliente");

    const rot = await fetch(`${BASE}/api/relatorio-mensal`, { method: "POST", headers: auth, body: JSON.stringify({ action: "rotacionar", empresaId: id }) });
    if (!rot.ok) fail("rotacionar falhou");
    const tok2 = linha()[0].link_token;
    if (!tok2 || tok2 === tok1) fail("token não mudou na rotação");
    const velho = await corpo404(tok1);
    if (velho.status !== 404) fail("link antigo deveria dar 404 após rotação");
    if ((await fetch(`${BASE}/r/${tok2}`)).status !== 200) fail("link novo deveria funcionar");
    console.log("ok · rotação: antigo 404, novo 200");

    // Hoje (antes de revogar, para ver o botão)
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
    try {
      const page = await browser.newPage();
      const externas = [];
      page.on("request", (rq) => {
        if (/whatsapp|wa\.me/i.test(rq.url())) externas.push(rq.url());
      });
      await page.setCookie({ name: "agencia_token", value: token, domain: "localhost", path: "/" });
      await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
      await pausa(1500);
      await page.evaluate(() => {
        const el = [...document.querySelectorAll("button,a")].find((x) => x.textContent.trim() === "Hoje" || x.getAttribute("aria-label") === "Hoje");
        if (el) el.click();
      });
      await pausa(2500);
      const corpo = await page.evaluate(() => document.body.innerText || "");
      if (!corpo.includes(nome)) fail("cliente de teste não apareceu no Hoje");
      if (!corpo.toLowerCase().includes("relatórios dos clientes")) fail("bloco de relatórios ausente no Hoje");
      if (corpo.includes(tok2)) fail("token apareceu como texto na tela");
      const wa = await page.evaluate((n) => {
        const bloco = [...document.querySelectorAll("div")].filter((d) => d.textContent.includes(n) && d.querySelector('a[href^="https://wa.me/"]')).pop();
        return bloco?.querySelector('a[href^="https://wa.me/"]')?.getAttribute("href") || "";
      }, nome);
      if (!wa.startsWith("https://wa.me/5571999990000?text=")) fail("botão de WhatsApp sem o número certo");
      const msg = decodeURIComponent(wa.split("?text=")[1]);
      if (!msg.includes(nome) || !msg.includes(`/r/${tok2}`)) fail("mensagem do WhatsApp sem o cliente ou sem o link");
      if (/[—–]/.test(msg)) fail("travessão na mensagem");
      if (externas.length) fail("houve requisição para WhatsApp (nada deveria ser enviado)");
      console.log("ok · Hoje lista o cliente com botão wa.me (mensagem e link certos), nada enviado");
    } finally {
      await browser.close();
    }

    // marcar como enviado (o toque do botão faz isso)
    const en = await fetch(`${BASE}/api/relatorio-mensal`, { method: "POST", headers: auth, body: JSON.stringify({ action: "enviado", empresaId: id }) });
    if (!en.ok) fail("marcar como enviado falhou");
    const lista = await (await fetch(`${BASE}/api/relatorio-mensal`, { headers: auth })).json();
    if (!lista.itens.find((i) => i.empresaId === id)?.enviado) fail("lista não refletiu o envio");
    console.log("ok · envio marcado na lista");

    // revogar: 404 igual ao inexistente
    const rv = await fetch(`${BASE}/api/relatorio-mensal`, { method: "POST", headers: auth, body: JSON.stringify({ action: "revogar", empresaId: id }) });
    if (!rv.ok) fail("revogar falhou");
    const revogado = await corpo404(tok2);
    if (revogado.status !== 404) fail("link revogado deveria dar 404");
    if (revogado.body !== inex.body) fail("404 de token revogado difere do de token inexistente");
    console.log("ok · revogado e inexistente respondem a mesma página 404");

    // AC-14: o token não está no repositório
    let achou = "";
    try {
      achou = execFileSync("git", ["grep", "-l", "-e", tok1, "-e", tok2], { cwd: ROOT, encoding: "utf8" });
    } catch {
      achou = "";
    }
    if (achou.trim()) fail("token encontrado no repositório");
    console.log("ok · token não aparece no repositório");

    console.log("PASS: relatório mensal gerado, servido sem login, com 404 uniforme, botão de WhatsApp no Hoje e limpeza feita");
  } finally {
    try {
      db.prepare("DELETE FROM empresa WHERE id = ?").run(id); // cascata leva contato e relatorio
      if (rodou) db.prepare("DELETE FROM relatorio WHERE gerado_em >= ? AND empresa_id <> ?").run(inicio, id); // linhas de outros clientes criadas pelo lote de teste
      db.close();
    } catch {
      /* banco já fechado */
    }
    await unlink(arqSaude).catch(() => {});
    try {
      const h = JSON.parse(await readFile(arqHits, "utf8"));
      if (h[id]) {
        delete h[id];
        await writeFile(arqHits, JSON.stringify(h, null, 2), "utf8");
      }
    } catch {
      /* sem hits */
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(`FAIL: ${e?.message || "erro inesperado"}`);
  process.exit(1);
});
