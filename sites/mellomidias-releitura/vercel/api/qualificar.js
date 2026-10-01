// Função da Vercel equivalente a public/api/qualificar.php (mesmo contrato).
// A chave fica só na variável TYPESAFE_API_KEY do projeto na Vercel.
// Sem disco persistente: o lead classificado vai para o log da função.
const TYPESAFE_URL = "https://api.typesafe.ai/v1/systemone";
const CAMPOS = ["nome", "whatsapp", "instagram", "faturamento", "investe"];
const janela = new Map(); // limite por IP (best effort, por instância)

const PERGUNTAS = {
  temperatura: {
    type: "choice",
    instructions: "Classifique a prontidao comercial do lead para uma solucao de trafego pago e posicionamento digital para clinica odontologica.",
    criteria: {
      quente: "Tem sinais de decisao proxima: ja investe ou quer investir, demonstra capacidade financeira, precisa aumentar agenda de tratamentos como implantes, ortodontia, estetica ou harmonizacao, e parece buscar previsibilidade de pacientes.",
      morno: "Tem interesse e alguma dor, mas os sinais de investimento, capacidade ou momento comercial ainda sao incompletos.",
      frio: "Baixa capacidade ou baixa intencao de investir, sem dor clara com captacao, sem urgencia e sem indicio de fit com midia paga.",
    },
  },
  potencial: {
    type: "score",
    instructions: "Pontue o potencial de retorno para uma clinica odontologica usando midia paga. Baixo: pouco faturamento ou pouco fit. Médio: fit parcial e alguma capacidade. Alto: boa capacidade, servicos de alto ticket e chance real de escalar captacao.",
    criteria: ["Baixo", "Médio", "Alto"],
  },
  dor_resultado: { type: "noul", instructions: "O lead demonstra dor com resultado atual do marketing, falta de previsibilidade de pacientes, dependencia de indicacao ou baixa conversao no Instagram." },
  urgencia: { type: "noul", instructions: "O lead demonstra pressa, momento de decisao, agenda ociosa, necessidade de vender tratamentos agora ou vontade de iniciar campanhas rapidamente." },
};

const limitar = (v, min, max) => (typeof v === "number" && isFinite(v) ? Math.max(min, Math.min(max, v)) : null);

function prioridade(t, p, d, u, c) {
  let s = t === "quente" ? 2 : t === "morno" ? 1 : 0;
  if (p != null) s += p >= 1.5 ? 2 : p >= 0.8 ? 1 : 0;
  if (d != null && d >= 0.7) s += 1;
  if (u != null && u >= 0.7) s += 1;
  let pr = s >= 5 ? 3 : s >= 3 ? 2 : 1;
  if (c < 0.5) pr = Math.max(1, pr - 1);
  return pr;
}

const SEM_IA = { ok: true, qualificado: false, temperatura: null, confianca: 0, potencial: null, dor: null, urgencia: null, prioridade: 1 };

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(400).json({ ok: false, error: "invalid_method" });
  const b = req.body && typeof req.body === "object" ? req.body : null;
  if (!b || Object.keys(b).some((k) => !CAMPOS.includes(k)) || CAMPOS.some((k) => typeof b[k] !== "string"))
    return res.status(400).json({ ok: false, error: "invalid_json" });
  const lead = {
    nome: b.nome.trim(), whatsapp: b.whatsapp.replace(/\D+/g, ""),
    instagram: b.instagram.trim(), faturamento: b.faturamento.trim(), investe: b.investe.trim(),
  };
  if (lead.nome.length < 2 || lead.nome.length > 80) return res.status(400).json({ ok: false, error: "invalid_nome" });
  if (lead.whatsapp.length < 10 || lead.whatsapp.length > 13) return res.status(400).json({ ok: false, error: "invalid_whatsapp" });
  if (!/^@?[A-Za-z0-9._]{2,30}$/.test(lead.instagram)) return res.status(400).json({ ok: false, error: "invalid_instagram" });
  if (!lead.instagram.startsWith("@")) lead.instagram = "@" + lead.instagram;
  if (!lead.faturamento || lead.faturamento.length > 80 || !lead.investe || lead.investe.length > 80) return res.status(400).json({ ok: false, error: "invalid_field" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0] || "0";
  const agora = Date.now(), recentes = (janela.get(ip) || []).filter((t) => t > agora - 600000);
  if (recentes.length >= 5) return res.status(429).json({ ok: false, error: "rate_limited" });
  janela.set(ip, [...recentes, agora]);

  const key = process.env.TYPESAFE_API_KEY;
  if (!key) { console.log("lead (sem chave)", JSON.stringify(lead)); return res.status(200).json(SEM_IA); }

  const state = [
    "Contexto: qualificacao comercial para a Mello Midias, focada em clinicas odontologicas que podem vender mais tratamentos com midia paga.",
    "Objetivo: indicar se o lead merece abordagem comercial rapida, considerando maturidade, capacidade de investimento, dor com marketing atual e urgencia.",
    "Lead:", `- Nome: ${lead.nome}`, `- Instagram: ${lead.instagram}`,
    `- Faturamento informado: ${lead.faturamento}`, `- Investe em marketing hoje: ${lead.investe}`,
    "Criterios gerais: clinicas com faturamento consistente, investimento ativo ou disposicao clara para investir, agenda dependente de indicacao, baixa previsibilidade de novos pacientes ou pressa por campanhas tendem a ser mais quentes.",
  ].join("\n");

  try {
    const r = await fetch(TYPESAFE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state, model: "jev-latest", questions: PERGUNTAS }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const a = (await r.json()).answers || {};
    const t = ["quente", "morno", "frio"].includes(a.temperatura?.choice) ? a.temperatura.choice : null;
    const p = limitar(a.potencial?.score, 0, 2), d = limitar(a.dor_resultado?.noul, 0, 1), u = limitar(a.urgencia?.noul, 0, 1);
    const cs = [a.temperatura, a.potencial, a.dor_resultado, a.urgencia].map((x) => limitar(x?.confidence, 0, 1)).filter((x) => x != null);
    const c = cs.length ? cs.reduce((s, x) => s + x, 0) / cs.length : 0;
    const out = {
      ok: true, qualificado: t !== null, temperatura: t, confianca: +c.toFixed(2),
      potencial: p == null ? null : +p.toFixed(2), dor: d == null ? null : +d.toFixed(2),
      urgencia: u == null ? null : +u.toFixed(2), prioridade: prioridade(t, p, d, u, c),
    };
    console.log("lead", JSON.stringify({ lead, classificacao: out }));
    return res.status(200).json(out);
  } catch (e) {
    console.log("lead (ia indisponivel)", e.message, JSON.stringify(lead));
    return res.status(200).json(SEM_IA);
  }
};
