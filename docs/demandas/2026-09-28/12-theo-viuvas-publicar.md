# Theo — (1) sem viúvas nos textos · (2) botão "publicar relatórios" no app

## 1. Viúvas (palavra sozinha na última linha) — regra do Everton
- `apps/site`: no CSS global (`src/app/globals.css`), `h1..h6, .headline, [class*="title"] { text-wrap: balance; }` e `p, li, blockquote, figcaption { text-wrap: pretty; }`. Também no CSS do relatório (`src/app/relatorio/[slug]/relatorio.css` e `components/relatorio/*.module.css`).
- `apps/plataforma`: o mesmo no `src/app/globals.css` (títulos balance, textos pretty).
- Para títulos curtos críticos renderizados via JS (hero do site, títulos do relatório), crie um helper `semViuva(texto)` que troca o ÚLTIMO espaço por `\u00A0` e aplique nos títulos principais (hero, títulos de seção, nome da empresa no relatório).
- Verifique em 375px e 1440px que títulos e parágrafos principais não terminam com palavra isolada.

## 2. "Gerar relatório" = gerar E publicar, automático (decisão do Everton)
Hoje o botão gera o JSON mas o link dá 404 até alguém publicar. Com UM clique em **"gerar relatório"** deve acontecer tudo:
1. exporta o JSON (como hoje, `POST /api/relatorio`);
2. **publica na sequência, dentro da mesma ação**, SOMENTE `apps/site/src/data/relatorios/<slug>.json`:
   - `git -C D:/studio add apps/site/src/data/relatorios/<slug>.json` → commit "relatorio: <empresa>" → push (env `AIOX_ACTIVE_AGENT=devops`);
   - espelho no repo que a Hostinger publica: `git --git-dir=D:/studio/archive/git-historico/site.git --work-tree=D:/studio/apps/site add src/data/relatorios/<slug>.json` → commit → `push origin main`;
   - se o JSON não mudou (nada a commitar), segue sem erro;
   - PROTEÇÃO: nunca `git add .`; adicione só o arquivo do slug; se o commit acabar incluindo qualquer outro arquivo, aborte com erro legível;
   - use `child_process.execFile` (sem shell), timeout 60s por comando; serialize publicações (fila em memória) para dois cliques seguidos não brigarem no git.
3. A rota responde logo com `{ slug, url, publicado: true }` (ou erro do git legível).
4. Na ficha do lead: ao clicar, o botão mostra "gerando e publicando…"; depois exibe o link + "copiar" e o status "⏳ entrando no ar (~2 min)", consultando a URL a cada 15s até responder 200 (máx. 5 min) → "✅ no ar". Se passar de 5 min, "ainda publicando, tente o link em instantes".
5. Remova o aviso antigo "o link só funciona depois que o Orion publicar".

## Verificação
`npx tsc --noEmit` e `npm run build` na plataforma; `npm run build` no site. NÃO clique/rode a publicação de verdade (o Orion testa com um lead real). Não commite.

## 3. Menu lateral recolhido está quebrado (plataforma, `src/components/dashboard.tsx` ~linhas 348–420)
Medido pelo Orion com o menu recolhido (`navMenor`, 68px): no rodapé do `<aside>` o `<Placar>` quebra "R$ 1.997" em 2 linhas e "Estruturação da agência"/"2%" vazam para fora; "sair da sessão" fica em 4 linhas; "⟨⟨ expandir" em 3 linhas.
Corrija para o modo recolhido ficar limpo, só com ícones centralizados:
- Placar recolhido: um indicador compacto (ex.: anel/barra de progresso de 2% com tooltip "R$ 1.997 de R$ 100 mil") ou nada, sem texto que quebre.
- "sair da sessão" → botão só com ícone (lucide `LogOut`), `aria-label`/`title` "sair da sessão", 40×40.
- "expandir" → botão só com ícone (lucide `ChevronsRight`), `aria-label`/`title` "expandir menu", 40×40; e no modo aberto o "recolher" vira ícone `ChevronsLeft` + texto.
- Transição de largura suave (`transition-[width] duration-200`) sem texto "pulando" durante a animação (esconda os textos com `overflow-hidden whitespace-nowrap`).
- Lembrar a escolha (recolhido/aberto) em `localStorage` (com try/catch).
- Conferir em 1024px, 1280px e 1440px: nenhum texto vazando ou quebrando no modo recolhido.
