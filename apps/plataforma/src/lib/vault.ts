import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  garantirEmpresaDoLead,
  mapaEstagioCrm,
  registrarEdicao,
  registrarMovimento,
  registrarStatus,
  removerLead,
} from "./funil-db";

const VAULT = process.env.VAULT || "D:/Obsidian - Claude/🏢 Agência";

// ---------- markdown mínimo ----------
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(s: string) {
  return s
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, a, b) => `<span class="lnk">${(b || a).replace(/.*\//, "").replace(/\.md$/i, "")}</span>`);
}
function mdToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  let list: { type: string; items: string[] } | null = null;
  const flush = () => {
    if (list) {
      out.push(`<${list.type}>${list.items.map((x) => `<li>${x}</li>`).join("")}</${list.type}>`);
      list = null;
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (t.startsWith("|") && t.endsWith("|")) {
      flush();
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().slice(1, -1).split("|").map((c) => c.trim());
        if (!/^:?-{2,}:?$/.test(cells.join(""))) rows.push(cells);
        i++;
      }
      const thead = rows.length ? rows[0] : [];
      const tbody = rows.slice(1).filter((r) => r.some((c) => c));
      let html = "<table>";
      if (thead.some((c) => c)) html += `<thead><tr>${thead.map((c) => `<th>${inline(esc(c))}</th>`).join("")}</tr></thead>`;
      if (tbody.length) html += `<tbody>${tbody.map((r) => `<tr>${r.map((c) => `<td>${inline(esc(c))}</td>`).join("")}</tr>`).join("")}</tbody>`;
      html += "</table>";
      out.push(html);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) { if (!list || list.type !== "ul") { flush(); list = { type: "ul", items: [] }; } list.items.push(inline(esc(line.replace(/^\s*[-*]\s+/, "")))); i++; continue; }
    if (/^\s*\d+\.\s+/.test(line)) { if (!list || list.type !== "ol") { flush(); list = { type: "ol", items: [] }; } list.items.push(inline(esc(line.replace(/^\s*\d+\.\s+/, "")))); i++; continue; }
    if (t.startsWith(">")) { flush(); const q: string[] = []; while (i < lines.length && lines[i].trim().startsWith(">")) { q.push(lines[i].trim().replace(/^>\s?/, "")); i++; } out.push(`<blockquote>${inline(esc(q.join(" ")))}</blockquote>`); continue; }
    if (/^#{4,}\s/.test(line)) { flush(); out.push(`<h4>${inline(esc(line.replace(/^#{4,}\s/, "")))}</h4>`); i++; continue; }
    if (/^#{3}\s/.test(line)) { flush(); out.push(`<h5>${inline(esc(line.replace(/^#{3}\s/, "")))}</h5>`); i++; continue; }
    if (/^#\s/.test(line)) { flush(); i++; continue; }
    if (/^##\s/.test(line)) { flush(); out.push(`<h3>${inline(esc(line.replace(/^##\s/, "")))}</h3>`); i++; continue; }
    if (t === "") { flush(); i++; continue; }
    flush(); out.push(`<p>${inline(esc(t))}</p>`); i++;
  }
  flush();
  return out.join("\n");
}
function splitSections(md: string) {
  const body = md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  return body.split(/^##\s/m).filter((p) => p.trim()).map((part) => {
    const nl = part.indexOf("\n");
    return { h: nl === -1 ? part.trim() : part.slice(0, nl).trim(), html: mdToHtml(nl === -1 ? "" : part.slice(nl + 1).trim()) };
  });
}
function frontmatter(md: string) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {} as Record<string, string>;
  const fm: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) { const kv = line.match(/^([\w-]+):\s*(.*)$/); if (kv) fm[kv[1]] = kv[2].trim(); }
  return fm;
}

// ---------- leitura ----------
async function read(rel: string) {
  try { return await readFile(join(VAULT, rel), "utf8"); } catch { return ""; }
}

const KANBAN_COLS = ["Backlog", "Esta semana", "Fazendo (máx. 2)", "Aguardando cliente", "Feito"];
const COMANDOS: Record<string, string> = { Caio: "/caio", Davi: "/davi", Theo: "/theo", Mia: "/mia" };

function kanbanColumns(md: string) {
  const body = md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  return KANBAN_COLS.map((name) => {
    const re = new RegExp(`^##\\s${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m");
    const m = body.match(re);
    if (!m) return { nome: name, itens: [] as { done: boolean; text: string }[] };
    const start = (m.index ?? 0) + m[0].length;
    const rest = body.slice(start);
    const next = rest.search(/^##\s/m);
    const section = next === -1 ? rest : rest.slice(0, next);
    const itens = section.split(/\r?\n/).map((l) => l.trim())
      .filter((l) => /^-\s*\[( |x)\]\s/.test(l))
      .map((l) => ({ done: /^-\s*\[x\]/.test(l), text: l.replace(/^-\s*\[[ x]\]\s*/, "") }));
    return { nome: name, itens };
  });
}

// ---------- pipeline (prospecção / 6 estágios) ----------
export const ESTAGIOS = ["Prospecção", "Aprovação", "Contato", "Negociação", "Desenvolvimento", "Entrega"];

function slug(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "lead";
}

function fmBlock(fm: Record<string, string>) {
  return "---\n" + Object.entries(fm).map(([k, v]) => `${k}: ${(v || "").replace(/\r?\n/g, " ")}`).join("\n") + "\n---";
}

async function listLeads() {
  const dir = join(VAULT, "40 Comercial", "Leads");
  let files: string[] = [];
  try { files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith(".md")); } catch { /* vazio */ }
  const leads = [];
  for (const f of files.sort()) {
    const raw = await read(`40 Comercial/Leads/${f}`);
    const fm = frontmatter(raw);
    if (!fm.lead) continue;
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    const movs = (body.match(/^## Movimentações\r?\n([\s\S]*?)(?=^## |(?![\s\S]))/m)?.[1] || "")
      .split(/\r?\n/).map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
    const nota = Number(String(fm["nota-google"] || "").replace(",", "."));
    const avaliacoes = Number(String(fm.avaliacoes || "").replace(/\./g, ""));
    leads.push({
      id: f.replace(/\.md$/i, ""),
      nome: fm.lead,
      segmento: fm.segmento || "",
      cidade: fm.cidade || "",
      nota: Number.isFinite(nota) ? nota : 0,
      avaliacoes: Number.isFinite(avaliacoes) ? avaliacoes : 0,
      site: fm["site-atual"] || "",
      contato: fm.contato || "",
      whatsapp: fm.whatsapp || "",
      email: fm.email || "",
      categoria: fm.categoria || fm.fonte || "maps",
      frente: fm.frente || "",
      estagio: Math.min(5, Math.max(0, Number(fm.estagio) || 0)),
      status: fm.status || "ativo",
      solucao: fm.solucao || "",
      motivo: fm["motivo-arquivo"] || "",
      porque: (fm.porque || "").replace(/\r?\n/g, " ").trim(),
      mensagem: fm.mensagem || "",
      movs,
      criado: fm.criado || "",
      presenca: fm.presenca ? Number(fm.presenca) : null,
      analiseEm: fm["analise-em"] || "",
      relatorio: fm.relatorio || "",
      contatadoEm: fm["contatado-em"] || "",
      respondeuEm: fm["respondeu-em"] || "",
      desfecho: fm.desfecho || "",
      desfechoEm: fm["desfecho-em"] || "",
    });
  }
  leads.sort((a, b) => (a.estagio - b.estagio) || a.criado.localeCompare(b.criado));
  // Mesmo registro de empresa do banco: quem já virou cliente sai do funil.
  let crm = new Map<string, string>();
  try {
    for (const l of leads) {
      garantirEmpresaDoLead({
        id: l.id, nome: l.nome, segmento: l.segmento, cidade: l.cidade, site: l.site,
        nota: l.nota, avaliacoes: l.avaliacoes, categoria: l.categoria, estagio: l.estagio, status: l.status,
      });
    }
    crm = mapaEstagioCrm();
  } catch { /* banco indisponível: o funil segue com as fichas do vault */ }
  return leads.map((l) => ({ ...l, cliente: crm.get(l.id) === "cliente" }));
}

function appendMov(raw: string, mov: string) {
  const marker = "## Movimentações";
  if (raw.includes(marker)) return raw.replace(marker, marker + `\n- ${mov}`);
  return raw.replace(/\s*$/, "") + `\n\n## Movimentações\n- ${mov}\n`;
}

export async function pipelineOp(op: {
  action: string; id?: string; nome?: string; segmento?: string; cidade?: string;
  nota?: string; avaliacoes?: string; site?: string; contato?: string; whatsapp?: string;
  email?: string; categoria?: string; porque?: string; solucao?: string; mensagem?: string;
  estagio?: number; motivo?: string; desfecho?: string; frente?: string;
}) {
  const dir = join(VAULT, "40 Comercial", "Leads");
  if (op.action === "add") {
    const id = slug(op.nome || "lead");
    const now = new Date().toISOString().slice(0, 10);
    const fm = {
      lead: op.nome || "", segmento: op.segmento || "", cidade: op.cidade || "",
      "nota-google": op.nota || "", avaliacoes: op.avaliacoes || "",
      "site-atual": op.site || "", contato: op.contato || "", whatsapp: op.whatsapp || "",
      email: op.email || "", categoria: op.categoria || "maps", frente: op.frente || "",
      estagio: "0", status: "ativo", solucao: "", "motivo-arquivo": "",
      porque: (op.porque || "").replace(/\r?\n/g, " "), criado: now,
      "contatado-em": "", "respondeu-em": "", desfecho: "", "desfecho-em": "",
    };
    const body = `\n# ${op.nome}\n\n## Por que é um bom lead\n${op.porque || "_a preencher_"}\n`;
    await writeFile(join(dir, `${id}.md`), fmBlock(fm) + body, "utf8");
    try {
    garantirEmpresaDoLead({
      id, nome: op.nome || id, segmento: op.segmento, cidade: op.cidade, site: op.site,
      nota: Number(String(op.nota || "").replace(",", ".")) || 0,
      avaliacoes: Number(String(op.avaliacoes || "").replace(/\./g, "")) || 0,
      categoria: op.categoria || "maps", estagio: 0, status: "ativo",
    });
    } catch { /* banco indisponível: a ficha do vault já foi gravada */ }
    return { id, criado: now };
  }
  if (!op.id) throw new Error("lead ausente");
  const p = join(dir, `${op.id}.md`);
  const raw = await read(`40 Comercial/Leads/${op.id}.md`);
  if (!raw) throw new Error("lead não encontrado");
  const fm = frontmatter(raw);
  const oggi = new Date().toISOString().slice(0, 10);

  if (op.action === "move") {
    const from = Math.min(5, Math.max(0, Number(fm.estagio) || 0));
    const to = Math.min(5, Math.max(0, Number(op.estagio) || 0));
    fm.estagio = String(to);
    if (to === 2 && !fm["contatado-em"]) fm["contatado-em"] = oggi;
    if (from === 2 && to === 3 && !fm["respondeu-em"]) fm["respondeu-em"] = oggi;
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    const mov = to === 5 ? `${oggi} · entregue · pedir indicação` : `${oggi} · avançou para ${ESTAGIOS[to]}`;
    await writeFile(p, fmBlock(fm) + "\n" + appendMov(body, mov), "utf8");
    // estágio 1 grava oportunidade e estágio 5 grava cliente, na mesma empresa
    registrarMovimento(op.id, to, {
      id: op.id, nome: fm.lead || op.id, segmento: fm.segmento, cidade: fm.cidade, site: fm["site-atual"],
      categoria: fm.categoria, status: fm.status || "ativo",
    });
    return { ok: true };
  }
  if (op.action === "update") {
    if (op.nome) fm.lead = op.nome;
    if (op.segmento !== undefined) fm.segmento = op.segmento;
    if (op.cidade !== undefined) fm.cidade = op.cidade;
    if (op.nota !== undefined) fm["nota-google"] = op.nota;
    if (op.avaliacoes !== undefined) fm.avaliacoes = op.avaliacoes;
    if (op.site !== undefined) fm["site-atual"] = op.site;
    if (op.contato !== undefined) fm.contato = op.contato;
    if (op.whatsapp !== undefined) fm.whatsapp = op.whatsapp;
    if (op.email !== undefined) fm.email = op.email;
    if (op.categoria !== undefined) fm.categoria = op.categoria;
    if (op.porque !== undefined) fm.porque = op.porque.replace(/\r?\n/g, " ");
    if (op.solucao !== undefined) fm.solucao = op.solucao;
    if (op.mensagem !== undefined) fm.mensagem = op.mensagem;
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    await writeFile(p, fmBlock(fm) + "\n" + body, "utf8");
    try { registrarEdicao(op.id, { nome: fm.lead, segmento: fm.segmento, cidade: fm.cidade, site: fm["site-atual"] }); } catch { /* banco indisponível */ }
    return { ok: true };
  }
  if (op.action === "archive") {
    fm.status = "arquivado";
    fm["motivo-arquivo"] = (op.motivo || "").replace(/\r?\n/g, " ");
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    await writeFile(p, fmBlock(fm) + "\n" + appendMov(body, `${oggi} · arquivado · ${op.motivo || "sem motivo"}`), "utf8");
    try { registrarStatus(op.id, "arquivado"); } catch { /* banco indisponível */ }
    return { ok: true };
  }
  if (op.action === "reactivate") {
    fm.status = "ativo";
    fm["motivo-arquivo"] = "";
    fm.desfecho = "";
    fm["desfecho-em"] = "";
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    await writeFile(p, fmBlock(fm) + "\n" + appendMov(body, `${oggi} · reativado`), "utf8");
    try { registrarStatus(op.id, "ativo"); } catch { /* banco indisponível */ }
    return { ok: true };
  }
  if (op.action === "delete") {
    const { unlink } = await import("node:fs/promises");
    try { await unlink(p); } catch { /* já não existe */ }
    try { removerLead(op.id); } catch { /* banco indisponível */ }
    return { ok: true };
  }
  if (op.action === "desfecho") {
    const tipo = op.desfecho === "sem-interesse" ? "sem-interesse" : "sem-resposta";
    fm.desfecho = tipo;
    fm["desfecho-em"] = oggi;
    fm.status = "arquivado";
    fm["motivo-arquivo"] = tipo === "sem-interesse" ? "Sem interesse (recusou)" : "Sem continuidade (não respondeu)";
    if (!fm["contatado-em"]) fm["contatado-em"] = oggi;
    const mov = tipo === "sem-interesse" ? "sem interesse (recusou)" : "sem continuidade (não respondeu)";
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    await writeFile(p, fmBlock(fm) + "\n" + appendMov(body, `${oggi} · ${mov}`), "utf8");
    try { registrarStatus(op.id, "arquivado"); } catch { /* banco indisponível */ }
    return { ok: true };
  }
  if (op.action === "contatar") {
    if (!fm["contatado-em"]) fm["contatado-em"] = oggi;
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    await writeFile(p, fmBlock(fm) + "\n" + body, "utf8");
    return { ok: true };
  }
  if (op.action === "responder") {
    if (!fm["respondeu-em"]) fm["respondeu-em"] = oggi;
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    await writeFile(p, fmBlock(fm) + "\n" + appendMov(body, `${oggi} · respondeu`), "utf8");
    return { ok: true };
  }
  throw new Error("ação desconhecida");
}

export async function rastreamentoData() {
  try {
    const raw = await readFile(join(VAULT, "SaaS", "Rastreamento", "hits.json"), "utf8");
    const t = JSON.parse(raw);
    const total = Object.values(t).reduce((a: number, b: any) => a + (b?.n || 0), 0);
    return { sites: t, total };
  } catch { /* sem hits ainda */ }
  return { sites: {}, total: 0 };
}

export async function buildData() {
  const comandoMd = await read("00 COMANDO.md");
  const inboxMd = await read("10 INBOX.md");
  const backlogMd = await read("20 BACKLOG.md");
  const kanbanMd = await read("01 Kanban.md");
  const placarMd = await read("60 Financeiro/Placar.md");

  const pm = placarMd.match(/(\d+)%\s*\(R\$ ([\d.]+)\s*\/\s*R\$ ([\d.]+)\)/i);
  const fase = (comandoMd.match(/\| Fase \| ([^|]+) \|/) || [])[1]?.trim() || "";

  const agentDir = join(VAULT, "10 Agentes");
  let agentFiles: string[] = [];
  try { agentFiles = (await readdir(agentDir)).filter((f) => f.endsWith(".md")); } catch { /* vazio */ }
  const agentes = [];
  for (const f of agentFiles) {
    const raw = await read(`10 Agentes/${f}`);
    const fm = frontmatter(raw);
    if (!fm.agente) continue;
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    agentes.push({ nome: fm.agente, departamento: fm.departamento || "", comando: COMANDOS[fm.agente] || "", html: mdToHtml(body) });
  }
  agentes.sort((a, b) => a.nome.localeCompare(b.nome));

  return {
    placar: {
      progresso: pm ? Number(pm[1]) : 0,
      acumulado: pm ? Number(pm[2].replace(/\./g, "")) : 0,
      meta: pm ? Number(pm[3].replace(/\./g, "")) : 100000,
      fase,
    },
    comando: splitSections(comandoMd),
    inbox: splitSections(inboxMd),
    backlog: splitSections(backlogMd),
    kanban: kanbanColumns(kanbanMd),
    agentes,
    pipeline: await listLeads(),
    rastreamento: await rastreamentoData(),
  };
}

// ---------- escrita ----------
function sectionRange(lines: string[], heading: string) {
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) { if (/^##\s/.test(lines[i])) { end = i; break; } }
  return { start, end };
}
function addListItem(lines: string[], range: { start: number; end: number }, line: string) {
  let last = -1;
  for (let i = range.start + 1; i < range.end; i++) {
    if (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i])) last = i;
  }
  lines.splice(last >= 0 ? last + 1 : range.start + 1, 0, line);
}
function findCheckbox(lines: string[], range: { start: number; end: number }, text: string) {
  for (let i = range.start + 1; i < range.end; i++) {
    const m = lines[i].match(/^(\s*-\s*\[)( |x)(\]\s*)(.*)$/);
    if (m && m[4].trim() === text) return { index: i, match: m };
  }
  return null;
}

export async function inboxAdd(text: string) {
  const p = join(VAULT, "10 INBOX.md");
  const lines = (await readFile(p, "utf8")).split(/\r?\n/);
  const r = sectionRange(lines, "Abertas");
  if (!r) throw new Error("seção 'Abertas' não encontrada no INBOX");
  addListItem(lines, r, `- ${text}`);
  await writeFile(p, lines.join("\n"), "utf8");
}

export async function kanbanOp(op: { action: string; column?: string; text?: string; from?: string; to?: string }) {
  const p = join(VAULT, "01 Kanban.md");
  const lines = (await readFile(p, "utf8")).split(/\r?\n/);
  if (op.action === "add") {
    const r = sectionRange(lines, op.column!);
    if (!r) throw new Error(`coluna '${op.column}' não encontrada`);
    addListItem(lines, r, `- [ ] ${op.text}`);
  } else if (op.action === "toggle") {
    const r = sectionRange(lines, op.column!);
    const c = r && findCheckbox(lines, r, op.text!);
    if (!c) throw new Error("cartão não encontrado");
    lines[c.index] = c.match[1] + (c.match[2] === "x" ? " " : "x") + c.match[3] + c.match[4];
  } else if (op.action === "move") {
    const fr = sectionRange(lines, op.from!);
    const c = fr && findCheckbox(lines, fr, op.text!);
    if (!c) throw new Error("cartão não encontrado na origem");
    const done = op.to === "Feito" ? "x" : c.match[2];
    lines.splice(c.index, 1);
    const tr = sectionRange(lines, op.to!);
    if (!tr) throw new Error(`coluna destino '${op.to}' não encontrada`);
    addListItem(lines, tr, `- [${done}] ${op.text}`);
  } else if (op.action === "delete") {
    const r = sectionRange(lines, op.column!);
    const c = r && findCheckbox(lines, r, op.text!);
    if (!c) throw new Error("cartão não encontrado");
    lines.splice(c.index, 1);
  } else {
    throw new Error("ação desconhecida");
  }
  await writeFile(p, lines.join("\n"), "utf8");
}

// ---------- análise de presença na ficha do lead ----------
export async function leadBase(id: string) {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  const raw = await read(`40 Comercial/Leads/${id}.md`);
  if (!raw) return null;
  const fm = frontmatter(raw);
  const num = (v: string) => { const n = Number(String(v || "").replace(/\.(?=\d{3})/g, "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };
  return {
    id, nome: fm.lead || id, cidade: fm.cidade || "", site: fm["site-atual"] || "",
    segmento: fm.segmento || "",
    nota: num(fm["nota-google"]), avaliacoes: num(fm.avaliacoes),
    whatsapp: fm.whatsapp || "", contato: fm.contato || "", email: fm.email || "",
  };
}

function formatarWhatsapp(digitos: string): string {
  let n = digitos;
  if ((n.length === 12 || n.length === 13) && n.startsWith("55")) n = n.slice(2);
  if (n.length < 10 || n.length > 11) return digitos;
  const dd = n.slice(0, 2);
  const num = n.slice(2);
  const tel = num.length === 9 ? `${num.slice(0, 5)}-${num.slice(5)}` : num.length === 8 ? `${num.slice(0, 4)}-${num.slice(4)}` : num;
  return `+55 ${dd} ${tel}`;
}

function celularDeTelefones(telefones?: string[]): string {
  if (!telefones?.length) return "";
  for (const t of telefones) {
    const d = (t || "").replace(/\D/g, "");
    if (!d) continue;
    const sem55 = d.startsWith("55") ? d.slice(2) : d;
    if (sem55.length === 11 && sem55.slice(2).length === 9) return d;
  }
  return "";
}

function analiseParaTelefone(analise?: { links?: { whatsapp?: string }; contatos?: { telefones?: string[] } }): string {
  if (!analise) return "";
  const deLink = (analise.links?.whatsapp || "").replace(/\D/g, "");
  const deContatos = celularDeTelefones(analise.contatos?.telefones);
  if (deLink) return formatarWhatsapp(deLink);
  if (deContatos) return formatarWhatsapp(deContatos);
  return "";
}

export async function gravarAnaliseNaFicha(id: string, resumoMd: string, pontuacao: number, analise?: { links?: { whatsapp?: string }; contatos?: { telefones?: string[]; emails?: string[] } }) {
  const p = join(VAULT, "40 Comercial", "Leads", `${id}.md`);
  const raw = await read(`40 Comercial/Leads/${id}.md`);
  if (!raw) throw new Error("lead não encontrado");
  const fm = frontmatter(raw);
  fm.presenca = String(pontuacao);
  fm["analise-em"] = new Date().toISOString().slice(0, 10);
  if (analise) {
    if (!fm.whatsapp) { const w = analiseParaTelefone(analise); if (w) fm.whatsapp = w; }
    if (!fm.contato) { const w = analiseParaTelefone(analise); if (w) fm.contato = w; }
    if (!fm.email && analise.contatos?.emails?.[0]) fm.email = analise.contatos.emails[0];
  }
  let body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  // tira a análise anterior: da seção até o próximo título "## " (subtítulos "###" ficam dentro dela)
  body = body.replace(/^## Análise de presença[\s\S]*?(?=^## (?!#)|(?![\s\S]))/m, "");
  const bloco = resumoMd.trim() + "\n\n";
  body = body.includes("## Movimentações")
    ? body.replace("## Movimentações", bloco + "## Movimentações")
    : body.replace(/\s*$/, "") + "\n\n" + bloco;
  await writeFile(p, fmBlock(fm) + "\n" + body, "utf8");
}

export async function gravarRelatorio(id: string, url: string) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error("lead inválido");
  const p = join(VAULT, "40 Comercial", "Leads", `${id}.md`);
  const raw = await read(`40 Comercial/Leads/${id}.md`);
  if (!raw) throw new Error("lead não encontrado");
  const fm = frontmatter(raw);
  fm.relatorio = url;
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  await writeFile(p, fmBlock(fm) + "\n" + body, "utf8");
}
