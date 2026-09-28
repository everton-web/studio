# Theo — prospecção: botão que prospecta de verdade + escopo BRASIL + qualificação que não descarta tudo

Diagnóstico do Orion (teste real via POST /api/prospector, nicho odontologia, limite 3): rodou em 25s, fonte kimi-discovery, 3 auditados, **0 adicionados** ("site ok (0/1 problema)"). O Everton acha que "não prospecta".
Causas: (a) o botão "prospecção" do topo (dashboard.tsx ~linha 495) só faz `go("pipeline")`; (b) cidade fixa "Salvador/BA" e o prompt do Kimi tem "(BA)" fixo (prospector.ts ~151/252); (c) Kimi devolve empresas grandes com site bom; (d) corte `aud.problemas.length < 2` descarta quase todos.

## 1. Botões
- O botão "prospecção" do topo passa a PROSPECTAR: vai para Comercial e já dispara a prospecção automática com a última região/nicho usados (lembrar em localStorage), mostrando o progresso ("buscando empresas… auditando 3 de 9…") e o resultado.
- O "▶ prospecção automática" continua.

## 2. Região: Brasil (pedido do Everton: "não mais Salvador")
- Seletor de região ao lado do nicho: **"Brasil (rodízio)"** (padrão), um **estado** (UF) ou uma **cidade** digitada.
- "Brasil (rodízio)": a cada execução escolhe 2 cidades de uma lista de capitais e grandes cidades de todo o país (rodando para não repetir), e distribui o limite entre elas.
- Remova o "(BA)" fixo: o prompt usa a cidade/UF certa. O fallback OSM (células de Salvador) só vale quando a região for Salvador; nas outras, pule o OSM.
- A ficha do lead grava a cidade/UF real.

## 3. Descoberta de candidatos melhores
- Prompt do Kimi: pedir negócios LOCAIS de pequeno e médio porte (consultórios, clínicas de bairro, escritórios, lojas, restaurantes, pousadas…) com site próprio, **excluindo redes, franquias, grandes marcas e portais**; pedir `limite × 3` candidatos para compensar descartes; nada que já esteja nas fichas (dedup por domínio).
- Mais nichos no seletor: odontologia, clínicas médicas, estética, advocacia, contabilidade, imobiliárias, restaurantes, hotéis e pousadas, academias, pet shops, construção e reformas, escolas e cursos.

## 4. Qualificação (não descartar tudo)
- Use a análise de presença (`analisarLead` em lib/analise.ts) como critério principal: **entra como lead se a nota de presença for ≤ 75** OU a auditoria antiga achar ≥ 2 problemas. A análise já fica salva na ficha (reaproveite o que o prospector já faz após criar a ficha).
- Descartados mostram o motivo com a nota ("presença 86/100: site forte").

## 5. Resultado sempre visível
Painel de resultado com: região e cidades usadas, candidatos, auditados, adicionados (nomes, clicáveis), descartados (motivo), erros. Se 0 adicionados, dizer por quê e sugerir outro nicho/região.

Regras: sem travessão, sem viúvas. `npx tsc --noEmit` + `npm run build`. Teste real com 1 execução pequena (limite 3, região Brasil) e informe o resultado no relatório. Não commite, não reinicie o app.
