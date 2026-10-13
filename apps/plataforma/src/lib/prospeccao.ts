import "server-only";

import { listarLeads, pipelineOp } from "@/lib/data";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const UA = "Mozilla/5.0 (compatible; AsymmetricsProspector/1.0; +https://app.evertonbrito.com)";

export type ProspectarOp = { nicho?: string; regiao?: string; limite?: number };
export type CandidatoProspeccao = {
  nome: string;
  segmento: string;
  cidade: string;
  site: string;
  contato?: string;
  whatsapp?: string;
  email?: string;
  porque?: string;
};
export type ResultadoProspeccao = {
  fonte: string;
  candidatos: number;
  auditados: number;
  adicionados: string[];
  descartados: { nome: string; motivo: string }[];
  erros: { nome: string; motivo: string }[];
  aviso: string;
  tempo: number;
  regiao: string;
  cidades: string[];
  porFrente: Record<string, number>;
};

type Auditoria = { frente: "sem-gmn" | "site-quebrado" | "site-ruim"; problemas: string[]; contato: { whatsapp?: string; telefone?: string; email?: string } };

export function normalizarUrl(site: string): string {
  const s = String(site || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

export function hostDe(site: string): string {
  try { return new URL(normalizarUrl(site)).hostname.replace(/^www\./, "").toLowerCase(); }
  catch { return ""; }
}

export function extrairCandidatos(texto: string): CandidatoProspeccao[] {
  const limpo = texto.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const iniObj = limpo.indexOf("{");
  const fimObj = limpo.lastIndexOf("}");
  if (iniObj >= 0 && fimObj > iniObj) {
    try {
      const obj = JSON.parse(limpo.slice(iniObj, fimObj + 1));
      const arr = Array.isArray(obj.empresas) ? obj.empresas : Array.isArray(obj.candidatos) ? obj.candidatos : [];
      return limparCandidatos(arr);
    } catch { /* tenta array abaixo */ }
  }
  const ini = limpo.indexOf("[");
  const fim = limpo.lastIndexOf("]");
  if (ini >= 0 && fim > ini) {
    try { return limparCandidatos(JSON.parse(limpo.slice(ini, fim + 1))); } catch { return []; }
  }
  return [];
}

function limparCandidatos(arr: unknown): CandidatoProspeccao[] {
  if (!Array.isArray(arr)) return [];
  const out: CandidatoProspeccao[] = [];
  const vistos = new Set<string>();
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const x = item as Record<string, unknown>;
    const nome = String(x.nome || x.name || "").trim();
    const site = normalizarUrl(String(x.site || x.website || "").trim());
    if (!nome || !site) continue;
    const chave = `${nome}|${hostDe(site)}`.toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    out.push({
      nome,
      site,
      segmento: String(x.segmento || x.nicho || "").trim(),
      cidade: String(x.cidade || x.regiao || "").trim(),
      contato: String(x.contato || x.telefone || "").trim(),
      whatsapp: String(x.whatsapp || "").trim(),
      email: String(x.email || "").trim(),
      porque: String(x.porque || x.motivo || "").trim(),
    });
  }
  return out.slice(0, 30);
}

async function chamarOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: "Você é um assistente de prospecção B2B. Responda somente JSON válido, sem markdown." },
        { role: "user", content: prompt },
      ],
    }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 180)}`);
  const j = JSON.parse(txt);
  return j.choices?.[0]?.message?.content || "";
}

async function buscarCandidatos(nicho: string, regiao: string, limite: number): Promise<CandidatoProspeccao[]> {
  const alvo = Math.min(24, Math.max(limite * 3, limite));
  const prompt = `Liste ${alvo} empresas reais, locais, pequenas ou médias, do nicho "${nicho}" na região "${regiao}". Priorize empresas com site próprio que pareça fraco, antigo, pouco otimizado ou com presença digital incompleta. Exclua redes nacionais, franquias grandes, marketplaces, portais, agregadores, redes sociais e diretórios. Responda somente JSON no formato {"empresas":[{"nome":"Nome","segmento":"${nicho}","cidade":"Cidade/UF","site":"https://dominio.com.br","porque":"sinal comercial observado"}]}.`;
  return extrairCandidatos(await chamarOpenAI(prompt)).slice(0, alvo);
}

function extrairContato(html: string) {
  const whatsapp = html.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\/?\?phone=)(\+?\d{10,15})/i)?.[1] || "";
  const telefone = html.match(/href=["']tel:([+\d\s().-]{8,20})["']/i)?.[1] || "";
  const email = html.match(/href=["']mailto:([^"'?\s]+@[^"'?\s]+)/i)?.[1] || "";
  return { whatsapp, telefone, email };
}

async function auditarSite(site: string): Promise<Auditoria> {
  const url = normalizarUrl(site);
  const problemas: string[] = [];
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9" }, signal: AbortSignal.timeout(10000) });
    if (res.status >= 400) return { frente: "site-quebrado", problemas: [`site com erro HTTP ${res.status}`], contato: {} };
    const html = (await res.text()).slice(0, 1_500_000);
    const low = html.toLowerCase();
    const contato = extrairContato(html);
    if (!/<meta[^>]+name=["']viewport["']/i.test(html)) problemas.push("sem meta viewport");
    if (!/<title[^>]*>[^<]{8,}/i.test(html)) problemas.push("título fraco ou ausente");
    if (!/<meta[^>]+name=["']description["']/i.test(html)) problemas.push("sem meta descrição");
    if (!/whatsapp|wa\.me|api\.whatsapp\.com/i.test(low)) problemas.push("sem WhatsApp visível");
    if (!/tel:/i.test(low) && !contato.telefone) problemas.push("sem telefone clicável");
    if (!/google-analytics|googletagmanager|gtag\(|GTM-|G-[A-Z0-9]{6,}|clarity\.ms|fbq\(/i.test(html)) problemas.push("sem rastreamento aparente");
    if (/wixsite|webnode|blogspot|google\.com\/sites|under construction|em constru[cç][aã]o|coming soon/i.test(low)) problemas.push("plataforma fraca ou site incompleto");
    return { frente: problemas.length >= 2 ? "site-ruim" : "site-ruim", problemas: problemas.length ? problemas : ["oportunidade de melhorar presença digital"], contato };
  } catch (e: any) {
    return { frente: "site-quebrado", problemas: [`site indisponível: ${String(e?.message || "erro").slice(0, 80)}`], contato: {} };
  }
}

export async function prospectar(op: ProspectarOp = {}): Promise<ResultadoProspeccao> {
  const t0 = Date.now();
  const nicho = String(op.nicho || "odontologia").trim().toLowerCase();
  const regiao = String(op.regiao || "Brasil").trim();
  const limite = Math.min(20, Math.max(1, Number(op.limite) || 6));
  const res: ResultadoProspeccao = { fonte: "chatgpt-openai", candidatos: 0, auditados: 0, adicionados: [], descartados: [], erros: [], aviso: "", tempo: 0, regiao, cidades: [regiao], porFrente: { "sem-gmn": 0, "site-quebrado": 0, "site-ruim": 0 } };

  const existentes = await listarLeads();
  const nomes = new Set(existentes.map((l) => l.nome.toLowerCase()));
  const hosts = new Set(existentes.map((l) => hostDe(l.site)).filter(Boolean));

  let candidatos: CandidatoProspeccao[] = [];
  try { candidatos = await buscarCandidatos(nicho, regiao, limite); }
  catch (e: any) {
    res.erros.push({ nome: "chatgpt", motivo: e?.message || "falha no ChatGPT" });
  }
  res.candidatos = candidatos.length;
  if (!candidatos.length) {
    res.aviso = OPENAI_API_KEY ? "ChatGPT não retornou candidatos válidos. Tente outro nicho ou região." : "Configure OPENAI_API_KEY para usar a prospecção automática.";
    res.tempo = Math.round((Date.now() - t0) / 1000);
    return res;
  }

  for (const c of candidatos) {
    if (res.adicionados.length >= limite) break;
    try {
      const h = hostDe(c.site);
      if (nomes.has(c.nome.toLowerCase())) { res.descartados.push({ nome: c.nome, motivo: "já existe no funil" }); continue; }
      if (h && hosts.has(h)) { res.descartados.push({ nome: c.nome, motivo: "domínio já existe no funil" }); continue; }
      const aud = await auditarSite(c.site);
      res.auditados++;
      res.porFrente[aud.frente] = (res.porFrente[aud.frente] || 0) + 1;
      const contato = c.contato || aud.contato.telefone || "";
      const whatsapp = c.whatsapp || aud.contato.whatsapp || "";
      const email = c.email || aud.contato.email || "";
      const porque = `Prospecção automática com ChatGPT. Frente: ${aud.frente}. Auditoria: ${aud.problemas.join("; ")}. ${c.porque || "Lead sugerido para avaliação comercial."}`;
      await pipelineOp({ action: "add", nome: c.nome, segmento: c.segmento || nicho, cidade: c.cidade || regiao, site: c.site, contato, whatsapp, email, categoria: "ia", frente: aud.frente, porque });
      res.adicionados.push(c.nome);
      nomes.add(c.nome.toLowerCase());
      if (h) hosts.add(h);
    } catch (e: any) {
      res.erros.push({ nome: c.nome, motivo: e?.message || "erro ao adicionar" });
    }
  }

  if (!res.adicionados.length && !res.aviso) res.aviso = "Nenhum candidato novo entrou. Veja descartados e erros para ajustar nicho ou região.";
  res.tempo = Math.round((Date.now() - t0) / 1000);
  return res;
}

export function prospectorStatus() {
  return {
    google_places: false,
    fonte_ativa: OPENAI_API_KEY ? "chatgpt-openai" : "openai-ausente",
    ia_router: !!OPENAI_API_KEY,
    obs: OPENAI_API_KEY ? `Prospecção automática via ChatGPT direto (${OPENAI_MODEL})` : "configure OPENAI_API_KEY para habilitar prospecção automática",
  };
}
