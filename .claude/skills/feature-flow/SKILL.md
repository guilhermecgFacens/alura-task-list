---
name: feature-flow
description: Fluxo padrão para desenvolver uma nova funcionalidade neste projeto — discovery/exploração, plano em markdown com confirmação do usuário, implementação, e verificação (lint/build/testes/self-review). Use sempre que o usuário trouxer uma tarefa, card, ou descrição de funcionalidade nova para implementar, ou pedir explicitamente para seguir o fluxo de feature.
---

# Feature Flow

Receita de 4 fases para implementar uma funcionalidade nova. O input desta skill é o texto/contexto que o usuário colar logo em seguida (descrição da tarefa, card do Jira, ideia solta, etc.) — pode estar incompleto ou ambíguo, isso é esperado e faz parte da fase 1.

Nunca pule fases. Nunca avance de fase sem o checkpoint indicado.

## Fase 1 — Discovery / Exploração

Objetivo: entender o problema antes de propor solução.

- Leia o contexto que o usuário trouxe (descrição, card do Jira ou de outro gestor de tarefas, texto solto).
- Explore a codebase atual para entender o estado presente relacionado à tarefa (arquivos, padrões, convenções do [AGENTS.md](../../../AGENTS.md)).
- Debata com o usuário: levante ambiguidades do card, hipóteses de abordagem, casos de borda, exceções e situações adjacentes que a feature pode tocar.
- Não escreva código nesta fase. O objetivo é convergir em conjunto com o usuário sobre o que precisa ser feito e como.
- Continue a discussão até sentir que o escopo e a abordagem estão claros o suficiente para virar um plano.

## Fase 2 — Plano

Objetivo: gerar um plano executável e revisável.

- Escreva um plano em markdown (use o mecanismo de plan mode, `ExitPlanMode`, quando disponível) descrevendo passos concretos de implementação, arquivos afetados, e decisões tomadas na fase 1.
- **Checkpoint obrigatório**: apresente o plano ao usuário e peça confirmação explícita antes de implementar. Se o usuário sugerir mudanças, ajuste o plano e peça confirmação de novo.
- Não comece a implementação sem essa confirmação.

## Fase 3 — Implementação

Objetivo: executar o plano confirmado.

Se a funcionalidade (ou parte dela) tocar código em `src/backend/`, siga TDD: escreva os testes antes de implementar.

- **Testes primeiro (somente para `src/backend/`)**: antes de escrever a implementação, escreva os testes (`*.test.ts`, Vitest, ambiente `node`) cobrindo o comportamento esperado descrito no plano. Happy path sozinho não é suficiente — todo use-case precisa também de testes para os edge cases (ver [AGENTS.md do backend](../../../src/backend/AGENTS.md), seção "Testes: happy path não basta"):
  - Cada erro de domínio que o use-case pode lançar (um teste por erro/condição, não só um genérico "lança erro").
  - Limites de validação: vazio, só espaços/whitespace, exatamente no limite, um a mais que o limite.
  - Resultado vazio como caso válido (lista vazia, nada encontrado) — sem lançar erro.
  - Confirmação de que a camada de dados (mock) não foi chamada quando a validação falha antes de chegar lá.
  - Rode os testes e confirme que falham pelo motivo certo (função/módulo ainda não existe ou não implementado), não por erro de sintaxe no próprio teste.
  - Para interações com sistemas externos e banco de dados (Prisma, APIs externas, etc.), mocke essas dependências — não bata em banco real nem em serviços externos nos testes.
  - Se o plano da fase 2 não detalhou os casos de teste, é aceitável refiná-los aqui, mas sem mudar o escopo combinado; se perceber que faltou um caso relevante no plano, avise o usuário.
- **Implementação**: implemente exatamente o que foi combinado no plano, usando também o contexto da fase 1 como referência, até os testes escritos passarem (para o backend) ou seguindo o plano normalmente (para o restante do código, onde ainda não há TDD).
- Siga as convenções do [AGENTS.md](../../../AGENTS.md) (sem lógica de negócio em `src/app/`, TypeScript strict, etc.).
- Se durante a implementação surgir a necessidade de desviar do plano, avise o usuário antes de seguir.

## Fase 4 — Verificação

Objetivo: garantir que a implementação está correta antes de liberar para PR.

- Rode `npm run lint`.
- Rode `npm run build`.
- Rode `npm run test:backend` se algum arquivo em `src/backend/` foi tocado, e `npm run test:frontend` se algum arquivo em `src/frontend/` foi tocado. Todos os testes precisam passar, incluindo os escritos na fase 3.
- Acione o subagent `code-reviewer` (via `Agent`, `subagent_type: "code-reviewer"`) passando o contexto do que foi implementado (arquivos alterados, `git diff`, e o plano da fase 2) para uma revisão independente focada nas convenções do AGENTS.md, correção, segurança e simplicidade.
- Faça também sua própria auto-revisão comparando a implementação com o plano da fase 2: confira se algum item do plano ficou pela metade, se algum edge case levantado na fase 1 foi esquecido.
- Se o `code-reviewer` ou a auto-revisão encontrarem problemas, ou se lint, build ou algum teste falhar, volte para a fase 3 (ou até a fase 2, se o plano estava errado) e corrija — não finalize com pendências conhecidas.
- Após cada correção, repita **todas** as verificações desta fase (lint, build, testes, revisão) até ficarem limpas.

### Encerramento

- Só quando lint, build e self-review estiverem OK: avise o usuário que a funcionalidade está pronta, resumindo o que foi feito.
- **Não crie o pull request.** O usuário revisa e abre o PR manualmente — isso é intencional, apenas informe que está pronto para revisão.
