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

### Backend: TDD (Test-Driven Development)

Se toca `src/backend/`, **obrigatório TDD**: escreva testes antes de implementar. Ciclo: teste falha → implementa → teste passa → refatora.

#### Passo 1: Escrever os testes

Antes qualquer implementação, escreva testes em `src/backend/**/*.test.ts` (Vitest, ambiente `node`). Cobrindo:

**Casos de teste obrigatórios:**
- Happy path (sucesso normal).
- Cada erro de domínio que use-case lança (um teste por erro, não genérico "lança erro").
- Limites de validação: vazio, só espaços/whitespace, exatamente no limite, um acima do limite.
- Resultado vazio válido (lista vazia, nada encontrado) sem erro.
- Mock de data layer não chamado quando validação falha antes de chegar nele.

**Mocks obrigatórios:**
- Banco de dados (Prisma): mocke sempre. Nunca bata em `dev.db` nos testes.
- APIs externas: mocke sempre. Nunca bata em servidor real.
- Dependências externas: trate como mock — o teste valida lógica, não integração.

**Antes de implementar:**
- Rode testes (`npm run test:backend`). Devem falhar pelo motivo certo (função/módulo não existe, não implementado), não erro de sintaxe no teste.
- Se plano fase 2 não detalhou casos, refine aqui sem mudar escopo; avise usuário se faltar caso relevante.

#### Passo 2: Implementar até testes passarem

Implemente exatamente conforme plano fase 2. Use contexto fase 1. Roda testes — passam quando implementação complete.

#### Passo 3: Refatora (opcional)

Se testes passam, refatore para melhor código sem quebrar testes. Roda testes novamente.

### Frontend: sem TDD por enquanto

Implemente conforme plano fase 2 normalmente.

### Geral

- Siga convenções [AGENTS.md](../../../AGENTS.md) (sem lógica em `src/app/`, TypeScript strict, etc.).
- Se precisar desviar do plano, avise usuário antes.

## Fase 4 — Verificação

Objetivo: garantir que a implementação está correta antes de liberar para PR.

1. **Execução (lint, build, testes)**
   - Rode `npm run lint`. Sem erros.
   - Rode `npm run build`. Compila sem erros (TypeScript `strict`).
   - Rode `npm run test:backend` se alterou `src/backend/`. Rode `npm run test:frontend` se alterou `src/frontend/`. Todos os testes passam.

2. **Revisão independente (code-reviewer subagent)**
   - Chame o subagent `code-reviewer` (via `Agent`, `subagent_type: "code-reviewer"`, ou direto via `/code-reviewer` se disponível).
   - Passe contexto claro: `git diff HEAD` (diferenças), nomes dos arquivos alterados, descrição breve da feature da fase 2.
   - Aguarde o relatório do subagent — ele valida AGENTS.md, correção, segurança e simplicidade.

3. **Auto-revisão (você)**
   - Compare a implementação com o plano da fase 2: algum item ficou pela metade? Algum edge case levantado na fase 1 foi esquecido?
   - Confira especialmente: lógica em `src/app/`? `any` ou `@ts-ignore`? `userId` vindo de body em vez de JWT? Queries sem filtro por usuário?

4. **Correção de problemas**
   - Se lint, build, testes, code-reviewer ou auto-revisão encontrarem problemas: volte para fase 3 (ou até fase 2 se o plano estava errado) e corrija.
   - **Após cada correção, repita todas as verificações desta seção** (lint, build, testes, code-reviewer, auto-revisão) até ficar limpo.
   - Não finalize com pendências conhecidas.

### Encerramento

- Só quando lint, build, testes e revisão estiverem OK: avise o usuário que está **Pronto para revisão/PR**.
- Resuma o que foi feito (arquivos, changes principais, decisões da fase 2 que foram implementadas).
- **Não abra PR.** O usuário faz isso manualmente — é intencional, só informe que está pronto.
