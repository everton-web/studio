# Davi — mockup do painel "Ao vivo" do time (plataforma, aba Time & Fila)

O Everton quer ver, de forma bem VISUAL, as demandas rolando: as personas com seus bonequinhos, quem está trabalhando (spinner/animação), em quê, há quanto tempo, e o que cada uma entregou.
Siga a skill `~/.claude/skills/skill-mockup-jrmk/SKILL.md` (Padrão JRMK + Adaptação Studio).

## Dados reais disponíveis
- Pasta `vault/SaaS/Agentes/ao-vivo/*.json`, um arquivo por execução: `{ id, persona, tarefa, modelo, estado: "trabalhando" | "tentando de novo" | "pronto" | "falhou" | "janela", tentativa (1-3), inicio, fim, resumo, erro }`.
- Personas do time: Orion (orquestra, revisa, publica), Lia (PM), Caio (comercial), Davi (design), Theo (dev), Mia (conteúdo), Fábio (financeiro), Olga (operações).
- Bonequinhos em pixel já existem: `apps/plataforma/src/components/agent-avatar.tsx` (`<AgentAvatar nome cor size>`), cores em `src/components/demandas.tsx` (CORES). Use esse estilo (pixel art) no mockup; crie as variações que faltarem (Orion, Lia, Fábio, Olga) no mesmo estilo.
- Visual da plataforma: `apps/plataforma/src/app/globals.css` (IDV v2 "Comando", escuro, laranja #FF4000) e a IDV em `vault/20 Playbooks/IDV-proposta.md`.

## O que desenhar (`design/painel-ao-vivo/mockup.html`, desktop 1440 e mobile 390)
1. **Mesa do time**: um "escritório" com as 8 personas (bonequinho + nome + função). Quem está trabalhando fica aceso, com animação (spinner/pontos digitando/bonequinho "animado") e um balão curto com a tarefa ("Theo: menu lateral + viúvas · há 4 min · tentativa 1/3"). Quem está livre fica esmaecido, "livre".
2. **Fila / linha do tempo** das execuções do dia: persona, tarefa resumida, estado (chip colorido), duração, e o resumo do que foi feito quando "pronto". "falhou" em vermelho com o motivo curto.
3. Contadores no topo: trabalhando agora · prontas hoje · falhas hoje.
4. Mobile: a mesa vira uma fileira horizontal de avatares com scroll, a fila embaixo.
Regras: sem travessão (—) nos textos, sem viúvas (text-wrap), no máx. 2 famílias de fonte, animações leves e respeitando prefers-reduced-motion.

Entregue o HTML com dados de exemplo realistas (use as demandas de hoje: Caio travessões pronto, Theo menu lateral trabalhando, Davi painel trabalhando, Lia story pronta). Não mexa em apps/. Não commite.
