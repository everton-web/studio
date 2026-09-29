# Reunião geral do Studio · 29/09/2026 · convocada pelo Everton

## Por que estamos aqui
O Everton disse: "as demandas não estão subindo pro app… era pra a plataforma estar pronta… com auditorias isso não ter funcionado ainda."

## Diagnóstico do Orion (causa raiz, confirmada no código)
- O app (apps/plataforma) só lê demandas de `_scripts/orquestra/fila.json` (lib/orquestra.ts), a fila do loop-daemon legado, DESLIGADO em 28/09.
- O fluxo atual (Orion → pi → opencode via `_scripts/persona.mjs`) grava em outros lugares: briefings em `docs/demandas/AAAA-MM-DD/*.md`, logs em `docs/demandas/*/logs/`, registro ao vivo em `vault/SaaS/Agentes/ao-vivo/*.json`, cartões no `vault/01 Kanban.md`.
- Nada disso aparece na aba "Time & Fila". Dois sistemas paralelos que nunca foram ligados; as auditorias olharam partes, não o caminho de ponta a ponta.

## O que o Everton pediu (fonte da verdade desta reunião)
1. Aba **Demandas** com **calendário**: tarefas do dia, possíveis reuniões, entre outros.
2. Estrutura de **CRM** construída de verdade.
3. Aba **Clientes**: cards dos clientes, acompanhar os sites de cada cliente, métricas de cliques e acessos, visualizar/incorporar o **Microsoft Clarity**.
4. Incluir o **Studio Web Pro** (repo everton-web/studiowebpro, cópia de leitura em `archive/referencias/studiowebpro`, ver `PLATFORM.md`) como **módulo da plataforma**, porque tem funcionalidades fundamentais para acompanhar o cliente.

## Contexto que todos precisam saber
- Plataforma: Next.js 16, porta 3100, app.evertonbrito.com (túnel Cloudflare), dados no vault (markdown/JSON), sem banco. Estrutura atual de abas: Início, Time & Fila, Projetos (kanban), Comercial (pipeline de leads), Resultados, Conteúdo.
- Rastreamento existente: hits em `vault/SaaS/Rastreamento/`; Clarity `ynkvl1zisv` instalado no evertonbrito.com.
- Migração para VPS Hostinger amanhã (30/09).
- Aprovado antes: reestruturação da plataforma em 3 etapas pelo print "JR Agency" (story em `docs/stories/plataforma-etapa1-navegacao-dashboard.story.md`).
- Cota do OpenCode está no fim do mês (86%): planos enxutos, sem retrabalho.
- Regras de escrita: sem travessão (— –), sem viúvas.

## Regra da reunião
Cada um escreve SÓ o seu arquivo `docs/reuniao/2026-09-29/<persona>.md`. Ninguém edita código, commita ou faz push. Nada inventado: cite arquivo/linha quando afirmar algo sobre o sistema. Máximo ~120 linhas por arquivo. Termine com "Riscos" e "O que preciso de outra persona".
