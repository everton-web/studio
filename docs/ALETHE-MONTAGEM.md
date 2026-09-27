# Alethe — montagem dos terminais da agência (manual rápido)

> Alethe: "um terminal por agente, orquestrador na raiz". Cada **Terminal** tem o seu próprio
> **cwd** — é isso que define quem é o agente: a pasta com o CLAUDE.md da persona.

## Modelo do Alethe

```
Group: Agência
└── Project: PROJETO DIGITAL
    ├── Terminal 1 · cwd ../ (raiz)        → ORQUESTRA (pi)  [+ tabs: claude, opencode]
    ├── Terminal 2 · cwd ../personas/caio  → CAIO (tabs: claude | shell)
    ├── Terminal 3 · cwd ../personas/davi  → DAVI
    ├── Terminal 4 · cwd ../personas/theo  → THEO
    └── Terminal 5 · cwd ../personas/mia   → MIA
```
- **Pane** = a caixa visual · **Terminal** = unidade com cwd próprio · **Sub-tab** = um agente
  (claude/opencode/shell) dentro do mesmo terminal.

## Passo a passo (GUI)

1. Abrir o Alethe → criar/reabrir o **Project "Agência"** apontando para
   `C:\Users\evert\OneDrive\Área de Trabalho\PROJETO DIGITAL`.
2. No container do projeto, **dividir em painéis** (ícone de split / arrastar — grid automático).
3. Em cada painel abrir um **Terminal** e definir o **cwd**:
   - P1 → raiz (`PROJETO DIGITAL`) — o orquestrador:
     `pi` (TUI do pi) ou `node _scripts/orquestra.mjs status`
   - P2..P5 → `personas/<caio|davi|theo|mia>` — abrir `claude` aí: ele lê o CLAUDE.md
     da persona automaticamente e nasce "como" o agente.
4. **Sub-tabs** no Terminal 1: abrir `claude` e `opencode` numa aba extra do mesmo painel
   (cwd = raiz) — o caro e o barato lado a lado; o Coordenador decide qual usa por tarefa.
5. Reiniciar/suspender é seguro: fechar o container não mata o PTY (estado persiste).

## Comandos de cada pane

| Pane | Terminal (cwd) | Comando |
|---|---|---|
| Orquestra | raiz | `pi` (ou `node _scripts/orquestra.mjs status`) |
| Claude | raiz | `claude` |
| Opencode | raiz | `opencode` |
| Caio/Davi/Theo/Mia | `personas/<nome>` | `claude` (carrega a persona) ou `node _scripts/persona.mjs <nome> "tarefa" --ia barata|claude` |

## Orchestration Board (a função de orquestração)

- O Alethe tem um **board** onde um agente-líder delega unidades para **workers** (Claude/Codex)
  rodarem **em paralelo** — cada worker num **git worktree**, com cartão mostrando status, custo,
  tokens e diff, e pedindo aprovação antes de sair do sandbox. **Está desligado por padrão**:
  ative em *Preferences ↦ Orchestration* (deve estar no projeto/Preferences).
- Atenção (roadmap oficial): **Claude como worker** ainda está parcial (o *back-end* existe,
  mas o fluxo fim-a-fim com o binário real é recente); **Codex como worker** está mais maduro.
  → Teste o board com um worker primeiro; se travar, os panes (acima) são a via garantida.
- Complemento: o board já **avisa quota/uso** dos providers (chip no header) — ajuda o
  Coordenador a decidir quando puxar o barato ou o Claude (sem cota fixa).

## Armadilhas

- **Defender no Windows:** o executável pode ser sinalizado como falso positivo
  (`Trojan:Win32/Bearfoos.A!ml`). Restaurar via *Proteção contra vírus → Histórico →
  Restaurar* + exclusão em `%LOCALAPPDATA%\Alethe`. Baixe sempre da página oficial de Releases.
- **PATH:** Alethe precisa achar `pi`, `claude`, `opencode` — todos já estão no PATH desta máquina.
- **Vault no D::** os agentes leem o vault pelo caminho fixo + permissões do `settings.json`
  (já configurado em `PROJETO DIGITAL/.claude/settings.json`).