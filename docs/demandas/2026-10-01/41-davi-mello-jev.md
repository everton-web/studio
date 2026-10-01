# Davi · Mello Mídias: qualificação de lead com o JEV (TypeSafe)

Pedido do Everton (01/10): integrar a API do JEV (TypeSafe) à releitura da Mello Mídias.

## A ideia

Todo lead que preenche o formulário chega para o Gabriel **já qualificado**: quente, morno ou frio, com o potencial de faturamento e se tem dor com o marketing atual. O comercial dele liga primeiro para quem está pronto. É o argumento de venda da releitura para o parceiro.

O JEV não gera texto: recebe um estado (texto ou JSON) e perguntas tipadas (`choice`, `score`, `noul`) e devolve respostas com probabilidade e confiança. Documentação: https://docs.typesafe.ai/llms.txt (resumo abaixo, já testado pelo Orion).

## Contrato da API (testado em 01/10)

```
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <TYPESAFE_API_KEY>
Content-Type: application/json

{ "state": "<texto do lead>", "model": "jev-latest",
  "questions": {
    "temperatura":   { "type": "choice", "instructions": "...", "criteria": { "quente": "...", "morno": "...", "frio": "..." } },
    "potencial":     { "type": "score",  "instructions": "...", "criteria": ["Baixo", "Médio", "Alto"] },
    "dor_resultado": { "type": "noul",   "instructions": "O lead está insatisfeito com o resultado atual do marketing" } } }
```

Resposta real:
```
{"model":"jev-1.13.0","answers":{
  "temperatura":{"type":"choice","choice":"quente","confidence":1.0,"probabilities":{"morno":0.0,"frio":0.0,"quente":1.0}},
  "potencial":{"type":"score","score":1.7,"confidence":0.55,"legend":{"0":"Baixo","1":"Médio","2":"Alto"},"probabilities":{"0":0.0,"1":0.29,"2":0.71}},
  "dor_resultado":{"type":"noul","noul":0.95}},
 "usage":{"input_tokens":486,"output_tokens":79}}
```

## Onde e como (projeto `D:/studio/sites/mellomidias-releitura/`)

O site é estático (`output: "export"`). **A chave nunca vai para o navegador.** Padrão da agência para formulário em site estático: PHP no mesmo domínio.

1. **`public/api/qualificar.php`** (vai para `out/api/` no build):
   - Aceita só `POST` JSON com `nome`, `whatsapp`, `instagram`, `faturamento`, `investe`. Valida tamanho e formato; rejeita o resto com 400.
   - Lê a chave de `getenv('TYPESAFE_API_KEY')` ou, se vazio, do arquivo `__DIR__ . '/../../typesafe.key'` (fora do `public_html` na Hostinger). Nunca escreve a chave em log nem na resposta.
   - Limite simples por IP (ex.: 5 por 10 min, arquivo em `sys_get_temp_dir()`).
   - Monta o `state` em texto com os dados do lead e faz as perguntas: `temperatura` (choice quente/morno/frio), `potencial` (score Baixo/Médio/Alto), `dor_resultado` (noul), `urgencia` (noul: "O lead demonstra pressa ou momento de decisão"). Escreva bons `criteria`, específicos de clínica odontológica.
   - Timeout de 8 s com cURL. Se a API falhar, responde `{ "ok": true, "qualificado": false }`: o lead nunca se perde por causa da IA.
   - Grava o lead e a classificação em `__DIR__ . '/../../leads-mello.jsonl'` (fora do público), uma linha por lead.
   - Responde `{ ok, qualificado, temperatura, confianca, potencial (0 a 2), dor (0 a 1), urgencia (0 a 1), prioridade }`, onde `prioridade` (1 a 3) é calculada no PHP a partir das respostas (regra simples e comentada, confiança baixa abaixo de 0,5 rebaixa).
2. **Formulário** (`LeadFormSection.tsx`): no envio do passo 2, faz `fetch("/api/qualificar.php")`. Para o lead, a tela de sucesso continua neutra (ele nunca vê a classificação). Se a chamada falhar, mostra o sucesso do mesmo jeito.
3. **Painel de demonstração "O que o Gabriel recebe"**: logo abaixo da tela de sucesso, só quando a URL tiver `?demo=1`, um card discreto mostrando a classificação que o comercial receberia: selo quente/morno/frio, barra de potencial, dor e urgência em porcentagem, prioridade e a confiança. Com microinteração de entrada no mesmo padrão do site. Sem `?demo=1`, o card não existe.
4. Mantém tudo que já existe; não mexe nas outras seções.

## Teste

O sandbox não tem rede, então não chame a API real. Valide o PHP com `php -l public/api/qualificar.php` e, para o fluxo, rode `php -S localhost:3211 -t out` com uma variável `TYPESAFE_MOCK=1` que faz o PHP devolver uma resposta fixa no formato acima (só quando a variável existir). O Orion testa com a API real.

Depois: `npx tsc --noEmit` e `npm run build` sem erros.

## Proibido

Colocar a chave em qualquer arquivo do projeto, do git ou no front. `git push`, publicar, mexer em `.env*`, instalar pacotes, apagar arquivos.

## Entrega

Relatório padrão com os arquivos, o resultado do `php -l`, `tsc` e `build`, e como rodar o teste.
