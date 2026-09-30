#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  E2E CLIENTES + CRM (v3-04) — prova de ponta a ponta.
//
//  Fluxo:
//    1. cria uma empresa de teste no Comercial (mesma rota que a tela usa)
//    2. confere que ela está em /api/comercial e NÃO em /api/clientes
//    3. move para o estágio 1 (oportunidade) e depois 5 (cliente), pelo mesmo
//       caminho da aplicação; confere que o empresa.id não muda, que nenhuma
//       empresa nova nasce e que ela sai do Comercial e entra em Clientes
//    4. prepara saúde do site, cobrança paga (divergente) e valor do projeto
//    5. abre a tela (puppeteer), vai em Clientes, abre o card e confere os blocos
//    6. grava uma credencial de teste pela tela, confere que fica cifrada no
//       arquivo do banco, só aparece ao clicar em "mostrar", e remove no fim
//    7. briefing por link (cria, responde pelo link público) e contrato rápido
//    8. limpa TUDO que criou (vault, banco e arquivos de teste)
//
//  Uso: PORT=3104 node _scripts/qa/e2e-clientes.mjs   (app de teste no ar)
//  Só roda contra o banco desta cópia (recusa qualquer outro). Nunca imprime
//  credenciais nem a senha de teste. Sai com código 1 em qualquer falha.
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from "puppeteer-core";
import { readFile, writeFile, mkdir, unlink, access } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { DatabaseSync } from "node:sqlite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = process.env.PORT ? "http://localhost:" + process.env.PORT : "http://localhost:3104";
const ENV_FILE = join(ROOT, "apps", "plataforma", ".env.local");
const CHROME = join(homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe");

function fail(msg) {
  throw new Error(msg);
}
function ok(msg) {
  console.log("ok · " + msg);
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
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(user, pass) {
  let ultimo = "";
  for (let n = 0; n < 3; n++) {
    try {
      const r = await fetch(`${BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass, lembrar: true }),
      });
      const m = (r.headers.get("set-cookie") || "").match(/agencia_token=([^;]+)/);
      if (r.ok && m) return m[1];
      ultimo = `HTTP ${r.status}`;
    } catch (e) {
      ultimo = e?.message || "fetch falhou";
    }
    await esperar(2000);
  }
  throw new Error(`login falhou (${ultimo})`);
}

async function main() {
  const env = parseEnv(await readFile(ENV_FILE, "utf8").catch(() => fail("não li apps/plataforma/.env.local")));
  if (!env.AGENCIA_USER || !env.AGENCIA_PASS) fail("AGENCIA_USER/AGENCIA_PASS ausentes no .env.local");
  if (!env.AGENCIA_COFRE_KEY) fail("AGENCIA_COFRE_KEY (de teste) ausente no .env.local desta cópia");
  const VAULT = process.env.VAULT || env.VAULT;
  const DB = resolve(process.env.AGENCIA_DB || env.AGENCIA_DB || join(ROOT, "apps", "plataforma", "data", "plataforma.sqlite"));
  if (!DB.replace(/\\/g, "/").toLowerCase().startsWith(ROOT.replace(/\\/g, "/").toLowerCase())) {
    fail("recuso rodar: o banco não é o desta cópia de teste");
  }

  const nome = "E2E Cliente Teste " + Date.now();
  const id = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const SENHA_TESTE = "Sn-" + Math.random().toString(36).slice(2, 12) + "-teste";
  const arquivos = []; // arquivos de teste no vault para apagar no fim
  let token = null;
  let contratoId = null;
  const cab = () => ({ "Content-Type": "application/json", Cookie: `agencia_token=${token}` });
  const post = async (url, body) => {
    const r = await fetch(BASE + url, { method: "POST", headers: cab(), body: JSON.stringify(body) });
    return { status: r.status, j: await r.json().catch(() => ({})) };
  };
  const get = async (url) => {
    const r = await fetch(BASE + url, { headers: { Cookie: `agencia_token=${token}` } });
    return { status: r.status, j: await r.json().catch(() => ({})) };
  };

  const db = new DatabaseSync(DB);
  const totalEmpresas = () => Number(db.prepare("SELECT COUNT(*) n FROM empresa").get().n);

  try {
    token = await login(env.AGENCIA_USER, env.AGENCIA_PASS);
    ok("login na API");

    // sem sessão, nada vaza
    for (const u of ["/api/clientes", "/api/comercial", `/api/clientes?id=${id}`]) {
      const r = await fetch(BASE + u);
      if (r.status !== 401) fail(`${u} respondeu ${r.status} sem sessão (esperado 401)`);
    }
    const semSessao = await fetch(BASE + "/api/clientes", { method: "POST", body: JSON.stringify({ action: "revelar", id, credencial: "x" }) });
    if (semSessao.status !== 401) fail("revelar senha sem sessão não deu 401");
    ok("API exige sessão (lista, detalhe, comercial e revelar)");

    // (a) empresa de teste nasce como lead pelo caminho do Comercial
    const antes = totalEmpresas();
    const add = await post("/api/pipeline", { action: "add", nome, segmento: "Teste", cidade: "Salvador", site: "evertonbrito.com" });
    if (add.status !== 200 || add.j.id !== id) fail(`pipeline add falhou (${add.status})`);
    arquivos.push(join(VAULT, "40 Comercial", "Leads", `${id}.md`));
    if (totalEmpresas() !== antes + 1) fail("a empresa de teste não entrou no banco");
    let com = await get("/api/comercial");
    let cli = await get("/api/clientes");
    const noCom = (c) => (c.j.leads || []).some((l) => l.id === id);
    const noCli = (c) => (c.j.clientes || []).some((l) => l.id === id);
    if (!noCom(com) || noCli(cli)) fail("lead deveria estar só no Comercial");
    ok("lead aparece em /api/comercial e não em /api/clientes");

    // (b) estágio 1 = oportunidade, estágio 5 = cliente; mesmo empresa.id
    await post("/api/pipeline", { action: "move", id, estagio: 1 });
    let linha = db.prepare("SELECT estagio_crm FROM empresa WHERE id = ?").get(id);
    if (linha?.estagio_crm !== "oportunidade") fail("estágio 1 não gravou 'oportunidade'");
    com = await get("/api/comercial");
    if (!noCom(com)) fail("oportunidade deveria seguir no Comercial");
    ok("estágio 1 grava oportunidade");

    const apos = totalEmpresas();
    await post("/api/pipeline", { action: "move", id, estagio: 5 });
    linha = db.prepare("SELECT id, estagio_crm FROM empresa WHERE id = ?").get(id);
    if (!linha || linha.estagio_crm !== "cliente") fail("estágio 5 não gravou 'cliente'");
    if (totalEmpresas() !== apos) fail("virar cliente criou registro novo de empresa");
    if (Number(db.prepare("SELECT COUNT(*) n FROM empresa WHERE id = ?").get(id).n) !== 1) fail("empresa duplicada");
    ok("estágio 5 grava cliente com o mesmo empresa.id, sem registro novo");

    // (c) sem duplicação entre Comercial e Clientes
    com = await get("/api/comercial");
    cli = await get("/api/clientes");
    if (noCom(com)) fail("cliente continuou no Comercial");
    if (!noCli(cli)) fail("cliente não apareceu em /api/clientes");
    ok("cliente sai do Comercial e aparece só em Clientes");

    // estado vazio honesto: nada de dado fabricado
    let det = (await get(`/api/clientes?id=${id}`)).j.cliente;
    if (!det) fail("detalhe do cliente não abriu");
    if (det.saude !== null) fail("saúde deveria estar vazia antes da verificação");
    if (det.credenciais.length !== 0 || det.briefing !== null || det.contratos.length !== 0) fail("blocos deveriam começar vazios");
    if (det.financeiro.cobrancas.length !== 0) fail("cobranças deveriam começar vazias");
    if (det.valorProjeto !== null || det.recorrencia !== null) fail("valor e recorrência não podem ser inventados");
    ok("detalhe começa com estados vazios honestos (sem zero fabricado)");

    // (d) prepara dados de teste: valor, saúde (com alerta) e cobrança paga divergente
    await post("/api/clientes", { action: "editar", id, valor_projeto: "1997" });
    const saudeArq = join(VAULT, "SaaS", "Saude", `${id}.json`);
    await mkdir(dirname(saudeArq), { recursive: true });
    await writeFile(saudeArq, JSON.stringify({ slug: id, cliente: nome, no_ar: true, certificado_dias: 9, formulario: "ok", velocidade_ms: 1400, verificado_em: new Date().toISOString() }));
    arquivos.push(saudeArq);
    const finArq = join(VAULT, "SaaS", "Financeiro", `e2e-${id}.json`);
    await mkdir(dirname(finArq), { recursive: true });
    await writeFile(finArq, JSON.stringify({ id: `e2e-${id}`, data: "29/09/2026, 10:00:00", descricao: "Entrada do projeto", valor: 1000, quantidade: 1, url: null, handle: "e2e", ok: true, order_nsu: `e2e-${id}`, paid: true, paidAt: "29/09/2026, 11:00:00", cliente: id }));
    arquivos.push(finArq);
    det = (await get(`/api/clientes?id=${id}`)).j.cliente;
    if (!det.financeiro.divergencia || det.financeiro.divergencia.pago !== 1000 || det.financeiro.divergencia.esperado !== 1997) fail("divergência 1.997 x 1.000 não foi sinalizada");
    if (!det.saude || det.saude.alertas.length !== 1 || det.saude.alertas[0].tipo !== "certificado") fail("alerta de certificado a vencer não veio");
    if (!det.pixel || det.pixel.n < 1) fail("pixel do site não veio");
    ok("API: divergência, alerta de certificado e pixel");

    // (e) tela
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.setCookie({ name: "agencia_token", value: token, domain: "localhost", path: "/" });
      await page.goto(BASE + "/", { waitUntil: "networkidle2" });
      await esperar(1200);
      const clicarTexto = async (sel, texto) => {
        const okc = await page.evaluate((s, t) => {
          const el = [...document.querySelectorAll(s)].find((e) => (e.textContent || "").trim().toLowerCase().includes(t.toLowerCase()) && e.offsetParent !== null);
          if (!el) return false;
          el.click();
          return true;
        }, sel, texto);
        if (!okc) fail(`não achei "${texto}" na tela`);
      };

      // Comercial mostra empresas reais (a de teste já saiu do funil)
      await clicarTexto("button", "Comercial");
      await esperar(1200);
      const corpoCom = await page.evaluate(() => document.body.innerText);
      if (corpoCom.includes(nome)) fail("cliente continua aparecendo no quadro do Comercial");
      ok("tela Comercial não repete quem virou cliente");

      await clicarTexto("button", "Clientes");
      await page.waitForSelector(`[data-card-cliente="${id}"]`, { timeout: 8000 }).catch(() => fail("card do cliente de teste não apareceu em Clientes"));
      ok("empresa aparece como card em Clientes");

      await page.click(`[data-card-cliente="${id}"]`);
      await page.waitForSelector("[data-gaveta]", { timeout: 8000 });
      await esperar(1200);
      const gaveta = () => page.evaluate(() => document.querySelector("[data-gaveta]").innerText);
      let t = await gaveta();
      for (const rot of ["Saúde do site", "Métricas do site", "Financeiro", "Briefing", "Cofre de senhas", "Contrato rápido"]) {
        if (!t.toLowerCase().includes(rot.toLowerCase())) fail(`bloco "${rot}" ausente na gaveta`);
      }
      if (!t.includes("vence em 9 dias")) fail("alerta de certificado não apareceu na tela");
      if (!t.includes("1,4 s")) fail("velocidade não apareceu");
      if (!t.includes("pageviews pelo pixel")) fail("pageviews do pixel não apareceram");
      if (!/Abrir o Clarity/i.test(t) || !t.includes("pendente de API")) fail("Clarity por link ou rótulo honesto ausente");
      if (await page.$("iframe")) fail("há iframe na página (Clarity não pode ser embutido)");
      if (!t.includes("R$ 1.997") || !t.includes("sem recorrência ainda")) fail("valor do projeto ou 'sem recorrência ainda' ausentes");
      if (!t.includes("cobranças pagas somam R$ 1.000")) fail("divergência não apareceu na tela");
      if (!t.includes("Nenhum briefing ainda.") || !t.includes("Sem credenciais cadastradas") || !t.includes("Nenhum contrato ainda.")) fail("estados vazios honestos ausentes");
      if (/aguardando_everton|\d{4}-\d{2}-\d{2}T/.test(t)) fail("dado técnico na gaveta (código de status ou ISO)");
      ok("gaveta: saúde com alerta, pixel, Clarity por link, financeiro com divergência e estados vazios");

      // cofre: grava pela tela
      await clicarTexto("button", "+ guardar acesso");
      await page.type('[aria-label="Nome do acesso"]', "WordPress Admin");
      await page.type('[aria-label="Usuário"]', "admin-teste");
      await page.type('[aria-label="Senha"]', SENHA_TESTE);
      await clicarTexto("button", "guardar no cofre");
      await page.waitForSelector("[data-credencial]", { timeout: 6000 });
      t = await gaveta();
      if (!t.includes("WordPress Admin")) fail("credencial não listou pelo rótulo");
      if (t.includes(SENHA_TESTE) || (await page.$("[data-senha]"))) fail("a senha apareceu na tela sem clicar em mostrar");
      ok("credencial listada pelo rótulo, senha oculta");

      // cifrada no banco e no arquivo
      const cred = db.prepare("SELECT senha_cifrada, iv, tag FROM credencial WHERE empresa_id = ?").get(id);
      if (!cred || !cred.senha_cifrada || cred.senha_cifrada.includes(SENHA_TESTE)) fail("senha não está cifrada na tabela");
      const bytes = readFileSync(DB);
      if (bytes.includes(Buffer.from(SENHA_TESTE))) fail("a senha em claro está no arquivo do banco");
      const api = JSON.stringify((await get(`/api/clientes?id=${id}`)).j);
      if (api.includes(SENHA_TESTE)) fail("o detalhe da API devolveu a senha");
      ok("senha cifrada no banco e ausente do detalhe da API");

      // mostrar só por clique
      await clicarTexto("button", "mostrar");
      await page.waitForSelector("[data-senha]", { timeout: 6000 });
      const vista = await page.$eval("[data-senha]", (e) => e.textContent);
      if (vista !== SENHA_TESTE) fail("mostrar não revelou a senha correta");
      ok("senha só aparece depois do clique em mostrar");
      await clicarTexto("button", "esconder");
      if (await page.$("[data-senha]")) fail("esconder não ocultou a senha");

      // remove a credencial de teste pela tela
      await clicarTexto("button", "remover");
      await page.waitForFunction(() => !document.querySelector("[data-credencial]"), { timeout: 6000 }).catch(() => fail("credencial não foi removida"));
      if (Number(db.prepare("SELECT COUNT(*) n FROM credencial WHERE empresa_id = ?").get(id).n) !== 0) fail("credencial ficou no banco");
      ok("credencial de teste removida");
    } finally {
      await browser.close();
    }

    // (f) briefing por link e contrato rápido (API, com verificação do resultado)
    const bri = await post("/api/clientes", { action: "briefing", id });
    const tk = bri.j.briefing?.token;
    if (!tk || bri.j.briefing.status !== "aguardando") fail("briefing não foi criado");
    const pag = await fetch(`${BASE}/b/${tk}`);
    if (pag.status !== 200 || !(await pag.text()).includes("Enviar respostas")) fail("página pública do briefing não abriu");
    const resp = await fetch(`${BASE}/api/b/${tk}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ respostas: { negocio: "Clínica de teste", objetivo: "Mais contatos" } }) });
    if (resp.status !== 200) fail(`resposta pública do briefing deu ${resp.status}`);
    det = (await get(`/api/clientes?id=${id}`)).j.cliente;
    if (det.briefing?.status !== "respondido" || det.briefing.respostas.length !== 2) fail("briefing não ficou respondido");
    ok("briefing por link criado, respondido pela página pública e visto como respondido");

    const con = await post("/api/clientes", { action: "contrato", id, tipo_pagamento: "pix" });
    contratoId = con.j.contrato?.id;
    if (con.status !== 201 || !contratoId) fail("contrato não foi gerado");
    const ct = await get(`/api/clientes?id=${id}&contrato=${contratoId}`);
    if (!String(ct.j.texto).includes(nome) || !ct.j.texto.includes("R$ 1.997")) fail("texto do contrato sem os dados do cliente");
    if (/[—–]/.test(ct.j.texto)) fail("contrato tem travessão");
    ok("contrato gerado com os dados do cliente");
    await post("/api/clientes", { action: "remover-contrato", id, contrato: contratoId });
    contratoId = null;
  } finally {
    // (g) limpeza: tudo que este teste criou
    try { await post("/api/clientes", { action: "remover-contrato", id, contrato: contratoId || "x" }); } catch { /* nada */ }
    try { if (token) await post("/api/pipeline", { action: "delete", id }); } catch { /* nada */ }
    for (const a of arquivos) await unlink(a).catch(() => {});
    try {
      db.prepare("DELETE FROM credencial WHERE empresa_id = ?").run(id);
      db.prepare("DELETE FROM briefing WHERE empresa_id = ?").run(id);
      db.prepare("DELETE FROM empresa WHERE id = ?").run(id);
    } catch { /* nada */ }
    const sobrou = Number(db.prepare("SELECT COUNT(*) n FROM empresa WHERE id = ?").get(id).n);
    const md = await access(join(VAULT, "40 Comercial", "Leads", `${id}.md`)).then(() => true, () => false);
    db.close();
    if (sobrou || md) console.error("AVISO: sobrou dado de teste (empresa ou ficha)");
    else console.log("ok · limpeza: nada de teste ficou no banco nem no vault");
  }
}

main()
  .then(() => {
    console.log("PASSOU · e2e clientes + CRM");
    process.exit(0);
  })
  .catch((e) => {
    console.error("FALHOU: " + (e?.message || e));
    process.exit(1);
  });
