# AGENTS.md

Guia rápido para agentes de IA (Claude Code, Cursor, Copilot, etc.) trabalhando neste repositório.

⚠️ **Fonte de verdade:** [PRD.md](PRD.md) — decisões técnicas (T-xx, P-xx), padrões e regras que **não podem ser quebradas**. Este arquivo é um resumo operacional. Leia o PRD antes de qualquer mudança arquitetural.

## O que é o projeto

Gerenciador de tasks simples: login por email, dashboard com tasks e status (`TODO` / `IN_PROGRESS` / `DONE`).

Stack: **Next.js (App Router)** + **TypeScript** + **Prisma (SQLite)** + **JWT** + **Zod** (validação).

**Princípio:** simplicidade didática > robustez de produção (PRD P-00).

## Estrutura de pastas

```
src/
├── app/        # router do Next.js (páginas + api routes) — só "casca": conecta tudo, sem lógica de negócio
├── frontend/   # componentes React (alias de import: @frontend/*)
└── backend/    # regras de negócio, Prisma, autenticação (alias de import: @backend/*)
```

Regra principal (T-01): **rotas em `src/app/` não devem conter lógica de negócio.** Elas chamam funções de `src/backend/` e renderizam componentes de `src/frontend/`.

### Documentação detalhada

- **[PRD.md](PRD.md)** — Decisões técnicas com ID (T-30..T-36 para backend, T-40..T-45 para REST, T-10..T-19 para frontend). Refira-se pelas IDs em PRs e comentários.
- **[src/backend/AGENTS.md](src/backend/AGENTS.md)** — Padrões detalhados: uso-casos, Zod, DTOs, data layer, testes (TDD), erros de domínio.
- **[src/frontend/AGENTS.md](src/frontend/AGENTS.md)** — Containers vs. components, services, composição.

### Aliases

Configurados em [tsconfig.json](tsconfig.json): `@/*`, `@frontend/*`, `@backend/*`. Sempre importe o caminho completo do arquivo (sem `index.ts` barrel).

## Comandos

| Comando | Para que serve |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento (sempre com `--webpack`, nunca Turbopack — ver Armadilhas) |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run prisma:migrate` | Aplica alterações do `schema.prisma` ao banco |
| `npm run prisma:generate` | Regenera o Prisma Client |
| `npm run prisma:studio` | UI visual do banco |
| `npm run setup` | Setup inicial ([scripts/setup.mjs](scripts/setup.mjs)): `.env` a partir do `.env.example` e banco local |
| `npm run test:backend` | Testes do backend (Vitest, ambiente `node`), arquivos `*.test.ts` em `src/backend/` |
| `npm run test:frontend` | Testes do frontend (Vitest, ambiente `jsdom` + Testing Library), arquivos `*.test.tsx`/`*.test.ts` em `src/frontend/` |

Configuração: [vitest.config.ts](vitest.config.ts) (dois projetos) e [vitest.setup.ts](vitest.setup.ts) (jest-dom).

## Convenções de código

### Transversais (T-60..T-63)

- **TypeScript `strict`** — sem `any`, sem `@ts-ignore`. Resolver tipos de verdade.
- **Nomes em inglês** (variáveis, funções, tipos). **UI/erros em português** (pt-BR).
- **Sem lógica de negócio em `src/app/`** — é só "casca" de roteamento (T-01..T-03).

### Backend (T-30..T-36)

- **Um caso de uso = uma função** (ex.: `listTasks`, `createTask`). Nada de classe Service genérica.
- **Validação com Zod** (não regex/if). Schemas em `<entidade>/schema.ts`. Erros de validação → **erros de domínio** (classes que estendem `Error`).
- **DTOs obrigatórios** no retorno — mapear Prisma cru com `toTaskDTO()`. Nunca expor campos internos (ex.: `userId`).
- **Camada de dados isolada** — `src/backend/data/<entidade>.ts` é o **único lugar** que importa Prisma. Use-cases importam de `data/*`, nunca do Prisma direto.
- **Autorização por dono na query** — `userId` sempre vem do JWT, nunca de body/query (T-36, T-42).
- **TDD:** testes antes da implementação, cobrindo edge cases, não só happy path (T-51).

Detalhes em [src/backend/AGENTS.md](src/backend/AGENTS.md).

### Frontend (T-10..T-19)

- **Só Client Components** — `"use client"` em containers e components. Nada de Server Components/Actions.
- **Containers smart** (estado, API, sessão). **Components dumb** (props → render).
- **Todo fetch via `services/`** — nunca diretamente em componente.

Detalhes em [src/frontend/AGENTS.md](src/frontend/AGENTS.md).

### Dados (T-20..T-24, T-38)

- **Autenticação:** JWT 7 dias. Sem senha (P-01 — intencional didático).
- **SQLite via Prisma** — schema em `src/backend/prisma/schema.prisma`. Mudança → `npm run prisma:migrate`.

## Armadilhas e regras anti-alucinação

### Técnicas

- **Nunca rode `next dev` diretamente sem `--webpack`** — Turbopack crasha no Windows. Sempre `npm run dev`.
- `src/backend/prisma/dev.db` é local e não versionado; não assuma que existe até rodar `npm run setup` ou `npm run prisma:migrate`.
- `.env` não é versionado (copiado de `.env.example` no setup).

### Para agentes de IA

- **Não crie padrões paralelos.** Copie a forma dos exemplos existentes (`tasks/use-cases.ts`, `[id]/route.ts`, `DashboardView`/`TaskList`).
- **Não adicione dependências** (state managers, UI kits, bancos alternativos) sem aprovação (T-00).
- **Não implemente features de §2.6 do PRD** (fora de escopo) sem perguntar.
- **Conflito com PRD.md?** Aponte e pergunte. Não escolha sozinho.
- **Mudanças arquiteturais** (Server Components, auth, banco, estado global) precisam de aprovação explícita.
- Siga a skill **feature-flow**: discovery → plano confirmado → TDD/implementação → verificação + code-reviewer. **Não abra PR** — o usuário faz.
- **Banco local: use o MCP `sqlite`, não gere queries na mão.** Qualquer leitura/escrita direta no `dev.db` (consultar dados, inspecionar schema, depurar, checar dados de teste) passa pelas tools `mcp__sqlite__*`, seguindo a skill **sqlite-mcp**. Nada de `sqlite3` no shell, script avulso ou apenas devolver SQL ao usuário. Exceções: código da app (Prisma Client) e mudanças de schema (migrations).

## Checklist antes de abrir um PR

Baseado em [PRD.md §11](PRD.md#11-checklist-rápido-de-revisão):

### Build & Lint

- [ ] `npm run lint` — sem erros
- [ ] `npm run build` — compila sem erros (TypeScript `strict`)
- [ ] `npm run test:backend` — se tocou `src/backend/`
- [ ] `npm run test:frontend` — se tocou `src/frontend/`

### Arquitetura

- [ ] Nenhuma lógica em `src/app/` (T-01..T-03)
- [ ] Use-case valida com Zod antes de chamar data layer (T-32)
- [ ] Prisma só em `src/backend/data/` (T-34)
- [ ] Retorno via DTO, sem `userId` (T-35)
- [ ] `userId` vem do token e toda query filtra por ele (T-36, T-42)

### Qualidade

- [ ] Erros de domínio → status HTTP corretos (T-41)
- [ ] Components sem fetch/services; Estado e API no container (T-11, T-12, T-15)
- [ ] Sem Server Components/Actions (T-10)
- [ ] Loading + erro visíveis na UI (P-06)
- [ ] Testes cobrindo edge cases, não só happy path (T-51)

### Schema

- [ ] Se alterou `schema.prisma`, migration foi criada e commitada em `src/backend/prisma/migrations/`

### MCP

- [.mcp.json](.mcp.json) é onde ficam os servidores MCP do projeto. A skill `sqlite-mcp` espera um servidor `sqlite` apontando para `src/backend/prisma/dev.db`; confira se ele está registrado antes de usá-lo (na versão commitada está, mas o arquivo local está sem servidores).

---

## Referências rápidas

| Documento | Uso |
|---|---|
| [PRD.md](PRD.md) | ⭐ **Leia primeiro.** Decisões T-xx, P-xx, D-xx. Fonte de verdade. |
| [src/backend/AGENTS.md](src/backend/AGENTS.md) | Padrões: Zod, DTO, data layer, erros, testes TDD |
| [src/frontend/AGENTS.md](src/frontend/AGENTS.md) | Containers/components, services, composição |
| [.claude/skills/feature-flow/SKILL.md](.claude/skills/feature-flow/SKILL.md) | Fluxo discovery → plano → TDD → verificação |
| [.claude/skills/sqlite-mcp/SKILL.md](.claude/skills/sqlite-mcp/SKILL.md) | Regra: acesso direto ao `dev.db` só via MCP `sqlite` |
| [README.md](README.md) | Setup e instruções para rodar o projeto |
| [docs/plano-*.md](docs/) | Planos de features (ex.: plano-endpoint-listar-tasks.md) |
