// Copy: ref/conteudo.txt. Partner names: ref/desktop-03.png.
export const site = {
  name: "Mello Mídias",
  title: "Mello Mídias | Plano Estratégico para clínicas odontológicas",
  description: "Tráfego estratégico, processo comercial e inteligência de dados para estruturar o crescimento da sua clínica odontológica.",
  cta: "Quero meu plano estratégico",
  ctaHref: "#formulario",
  copyright: "© 2026 Mello Mídias Assessoria. Todos os direitos reservados.",
} as const;

export const navigation = [
  { label: "Método", href: "#metodo" },
  { label: "Resultados", href: "#resultados" },
  { label: "Quem somos", href: "#quem-somos" },
  { label: "Dúvidas", href: "#faq" },
] as const;

export const hero = {
  badge: "Exclusivo para clínicas odontológicas",
  title: "Receba um Plano Estratégico para escalar sua clínica e atrair novos pacientes toda semana",
  description: "A Mello Mídias estrutura o crescimento de clínicas odontológicas integrando tráfego estratégico, processo comercial e inteligência de dados.",
} as const;

export const stats = [
  { id: "midia", value: 10, prefix: "+R$", suffix: "M", display: "+R$10M", label: "em mídia gerenciada" },
  { id: "clinicas", value: 40, prefix: "+", suffix: "", display: "+40", label: "clínicas atendidas" },
  { id: "experiencia", value: 4, prefix: "+", suffix: " anos", display: "+4 anos", label: "de mercado odontológico" },
] as const;

export const brand = {
  logo: { src: "/brand/logo-mello-midias.webp", width: 788, height: 172, alt: "Mello Mídias Assessoria" },
  symbol: { src: "/brand/simbolo-m.webp", width: 256, height: 202 },
} as const;

// Logos reais (ref/assets 01 a 07). A Essenza foi invertida no arquivo para aparecer no fundo escuro.
export const partners = [
  { id: "simone-h", name: "Dra. Simone H., cirurgiã dentista", width: 376, height: 140 },
  { id: "odonto-company", name: "OdontoCompany", width: 435, height: 140 },
  { id: "bem-viver", name: "Bem Viver Implantes", width: 170, height: 140 },
  { id: "essenza", name: "Essenza Oral Care", width: 440, height: 70 },
  { id: "oral-sin", name: "Oral Sin Implantes", width: 440, height: 113 },
  { id: "aline-schwanck", name: "Dra. Aline Schwanck, cirurgiã dentista", width: 275, height: 140 },
] as const;

export const manifesto = "Sem diagnóstico, qualquer ação é achismo.";

export const method = [
  { id: "diagnostico", number: "01", title: "Diagnóstico", description: "Mapeamos seu processo atual, o perfil do paciente ideal e onde estão os gargalos reais. Sem diagnóstico, qualquer ação é achismo." },
  { id: "trafego", number: "02", title: "Tráfego Estratégico", description: "Campanhas para o paciente certo, com criativos que atraem quem quer resolver, não só quem clicou por curiosidade." },
  { id: "comercial", number: "03", title: "Processo Comercial", description: "Acompanhamos o funil do lead ao fechamento: script de atendimento, tempo de resposta, taxa de agendamento e comparecimento." },
  { id: "dados", number: "04", title: "Inteligência de Dados", description: "Dashboard e relatórios semanais com os números que importam. Você sabe onde ajustar, onde investir mais e o que está funcionando, toda semana." },
] as const;

export const results = {
  eyebrow: "Resultados comprovados",
  title: "Números reais. Clínicas reais.",
  description: "Esses resultados não são sorte. São método: tráfego, comercial e dados trabalhando juntos.",
  chatTitle: "Comercial da clínica",
  chatSubtitle: "grupo de acompanhamento",
  caption: "Mensagens recriadas a partir dos prints reais de clientes da Mello Mídias.",
  galleryEyebrow: "Resultados reais",
  galleryTitle: "Os prints, do jeito que chegaram",
  galleryHint: "Arraste para o lado. Toque em um print para ampliar.",
} as const;

// Prints reais (ref/assets feed-1 a feed-7). Números copiados do que está escrito em cada print.
export const proofs = [
  { id: "feed-1", highlight: "ROAS 9,7x", detail: "Relatório de abril: R$ 6.298 em mídia, R$ 61.150 convertidos", width: 900, height: 959 },
  { id: "feed-2", highlight: "ROAS 9,8x", detail: "R$ 12.411 investidos, R$ 122.652 de retorno", width: 900, height: 1045 },
  { id: "feed-7", highlight: "R$ 350.950 em fevereiro", detail: "555 leads e 28 fechamentos no mês", width: 900, height: 647 },
  { id: "feed-5", highlight: "13 dias, R$ 97 mil", detail: "R$ 97.765,00 em orçamentos aprovados", width: 900, height: 1227 },
  { id: "feed-6", highlight: "R$ 38 mil convertidos", detail: "R$ 3.000 em tráfego e 13 fechamentos em abril", width: 900, height: 1054 },
  { id: "feed-4", highlight: "Orçamento de R$ 25.550", detail: "E a meta de vendas do mês batida", width: 900, height: 891 },
  { id: "feed-3", highlight: "3 procedimentos em um dia", detail: "Clínica com 2 meses de Mello Mídias", width: 900, height: 1184 },
] as const;

// Textos dos prints de WhatsApp da referência (desktop-04.png), sem números novos.
export const chat = [
  { id: "fechamento", side: "in", text: "Fechamento agora no horário de almoço, paciente que veio pelo Instagram.", value: "R$ 25.550,00", time: "13:58" },
  { id: "parabens", side: "out", text: "Muito bom, parabéns, pessoal!", time: "13:59" },
  { id: "meta", side: "in", text: "Batemos a meta esse mês.", time: "13:59" },
  { id: "google", side: "in", text: "Boa tarde, hoje tivemos 2 fechamentos por leads do Google: 1 urgência de R$ 350,00 e 1 tratamento de R$ 1.170,00.", time: "15:16" },
] as const;

export const cases = [
  { id: "orcamentos", highlight: "25k", text: "Clínica odontológica fechando orçamentos de 25k e ainda batendo a meta de vendas do mês." },
  { id: "procedimentos", highlight: "3 procedimentos", text: "Clínica que começou há 2 meses conosco fechando 3 procedimentos em um único dia." },
] as const;

export const about = {
  eyebrow: "Quem somos",
  title: "Uma assessoria que pensa no crescimento da sua clínica. Não só nas campanhas.",
  description: "A Mello Mídias foi fundada por Gabriel Mello, especialista em estratégia de tráfego e crescimento comercial, com mais de R$ 10 milhões gerenciados em mídia paga e dezenas de clínicas atendidas em todo o Brasil nos últimos 4 anos.",
  approach: "Nossa diferença está no diagnóstico: antes de rodar qualquer anúncio, entendemos o seu negócio. Tráfego, comercial e dados integrados em um sistema que funciona junto, não em peças separadas.",
  founder: { name: "Gabriel Mello", role: "Fundador · Mello Mídias", photo: "/brand/gabriel-mello.webp", photoSmall: "/brand/gabriel-mello-480.webp", alt: "Gabriel Mello, fundador da Mello Mídias, de braços cruzados em fundo vermelho" },
  differentiators: [
    { id: "assessoria", title: "Assessoria, não agência", text: "Não somos uma agência de tráfego. Somos uma assessoria de performance comercial." },
    { id: "parceria", title: "Resultado como parceiro", text: "Responsabilidade direta pelos resultados. Assumimos o crescimento como parceiros." },
    { id: "odontologia", title: "Especialistas em odontologia", text: "Entendemos o funil de pacientes e os procedimentos do setor." },
  ],
} as const;

export const steps = [
  { number: "01", title: "Conte sobre sua clínica", description: "Você preenche o formulário, leva menos de 2 minutos." },
  { number: "02", title: "Converse com um especialista", description: "Um especialista entra em contato em até 24h para entender seu contexto." },
  { number: "03", title: "Receba seu diagnóstico", description: "Você recebe um diagnóstico real. Sem compromisso, sem promessas vazias." },
] as const;

export const revenueOptions = [
  { value: "ate-20k", label: "Até R$ 20 mil" },
  { value: "20k-50k", label: "R$ 20 mil a R$ 50 mil" },
  { value: "50k-100k", label: "R$ 50 mil a R$ 100 mil" },
  { value: "100k-200k", label: "R$ 100 mil a R$ 200 mil" },
  { value: "acima-200k", label: "Acima de R$ 200 mil" },
] as const;

export const trafficOptions = [
  { value: "satisfeito", label: "Sim, e estou satisfeito" },
  { value: "sem-resultado", label: "Sim, mas não vejo resultado" },
  { value: "parei", label: "Já investi, parei" },
  { value: "nao-invisto", label: "Ainda não invisto" },
] as const;

export const leadSection = {
  eyebrow: "Plano Estratégico",
  title: "Não saia sem receber seu Plano Estratégico",
  description: "Em até 24h um especialista da Mello Mídias entra em contato com uma análise real do seu negócio: tráfego, comercial e dados.",
} as const;

export const form = {
  title: "Receba seu plano estratégico",
  description: "Uma análise real do seu negócio: tráfego, comercial e dados.",
  labels: { name: "Seu nome", phone: "WhatsApp", instagram: "Instagram da clínica", revenue: "Faturamento mensal", traffic: "Já investe em tráfego pago?" },
  stepLabels: ["Seus dados", "Sua clínica"],
  safety: "Seus dados estão seguros. Sem spam.",
  demoNotice: "Demonstração da releitura: nenhum dado foi enviado.",
  successTitle: "Pedido recebido",
  successDescription: "Em até 24h um especialista da Mello Mídias chama você no WhatsApp para entender o contexto da sua clínica.",
} as const;

export const faq = [
  { id: "diferenca", question: "Já tentei agência e não funcionou. Por que seria diferente?", answer: "Porque agência entrega campanha. A Mello Mídias estrutura o processo inteiro: do anúncio ao fechamento do paciente. O diagnóstico nos mostra exatamente onde está o gargalo da sua clínica. A gente descobre antes de cobrar qualquer coisa." },
  { id: "prazo", question: "Em quanto tempo aparecem os primeiros resultados?", answer: "Depende do estágio atual do seu negócio, estrutura interna e investimento. Mas, na maioria dos casos, nossos clientes pagam o valor do investimento e começam a ter lucro entre 30 e 60 dias de projeto." },
  { id: "especialidades", question: "Vocês atendem qualquer especialidade odontológica?", answer: "Sim. Atendemos clínicas gerais, implantodontia, ortodontia, próteses, estética dental e cirurgia." },
  { id: "investimento", question: "Quanto preciso investir em anúncios?", answer: "Trabalhamos com clínicas que estão prontas para investir a partir de R$ 2.000 por mês em mídia paga." },
  { id: "plano", question: "Como funciona o plano estratégico?", answer: "Você preenche o formulário. Um especialista entra em contato em até 24h. Análise real de tráfego, comercial e dados. Sem compromisso." },
  { id: "escopo", question: "Vocês trabalham só com tráfego?", answer: "Não. Acompanhamos processo comercial, entregamos relatórios semanais, fazemos reuniões de alinhamento e auxiliamos na produção de criativos." },
] as const;

export const finalCta = {
  title: "Pronto para escalar sua clínica odontológica?",
  description: "Preencha o formulário. Um especialista entra em contato em até 24h com um diagnóstico real do seu negócio.",
} as const;

// Handle não confirmado na referência: validar com o Gabriel antes de qualquer uso real.
export const social = { instagram: "https://www.instagram.com/mellomidias/" } as const;
