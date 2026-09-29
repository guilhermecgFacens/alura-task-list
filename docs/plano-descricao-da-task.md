# Plano: descrição opcional na task + ajustes de texto da tela de tasks

## Contexto

Fluxo desejado: login → tela de lista de tasks → botão que abre modal com nome e breve descrição → concluir salva no banco. Quase tudo já existe (login redireciona para `/dashboard`, `DashboardView`, `TaskList`, `AddTaskModal`, `POST /api/tasks`). Falta a **descrição**, que hoje não existe em nenhuma camada (PRD P-03: só título e status). O usuário aprovou alterar o PRD.

## Decisões aprovadas

1. Descrição **opcional**.
2. Máximo **500** caracteres, com `trim`. Vazia (ou só espaços) vira "sem descrição" (`null`).
3. Exibida como texto secundário abaixo do título na lista (sem modal de detalhe).
4. PRD atualizado junto (P-03, §2.2, §5.3, §2.5) e o D-2 desatualizado corrigido.
5. Textos da UI: botão "Criar task"; botão do modal "Concluir" (loading "Concluindo..."); lista vazia "Nenhuma task criada ainda.".

Fora de escopo: editar descrição depois de criada (`PATCH` continua só com `status`), filtro, paginação.

## Ordem (feature-flow: backend com TDD, depois front)

Passo 0: copiar este plano para `docs/plano-descricao-da-task.md` (padrão dos outros planos).

### 1. Banco
- `src/backend/prisma/schema.prisma`: `description String?` no model `Task`.
- `npm run prisma:migrate` (nome sugerido: `add_task_description`). Commitar a migration em `src/backend/prisma/migrations/` (T-38). Coluna nullable: tasks existentes continuam válidas.

### 2. Backend (TDD: testes primeiro em `src/backend/tasks/tasks.test.ts`)
- `schema.ts`: `MAX_DESCRIPTION_LENGTH = 500`. `createTaskSchema` ganha `description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).optional()`.
- `use-cases.ts`:
  - `createTask(userId, title: unknown, description?: unknown)`.
  - Nova classe `InvalidDescriptionError` (T-33), mensagem "Descrição muito longa" (500+1) ou "Descrição inválida" (não-string). Decidir o erro pelo path do issue do Zod (`title` vs `description`).
  - Descrição vazia após `trim` → `null` para a camada de dados.
- `dto.ts`: `TaskDTO` e `toTaskDTO` incluem `description: string | null`.
- `data/tasks.ts`: `createTask(userId, title, description: string | null)` grava `description`.
- `src/app/api/tasks/route.ts` (`POST`): passa `body.description`; mapeia `InvalidDescriptionError` → `400` (T-41). Sem lógica nova na rota (T-03).
- Casos de teste novos: descrição ausente → `null`; com espaços nas pontas → trim; vazia/só espaços → `null`; exatamente 500 ok; 501 → `InvalidDescriptionError`; número/objeto/array → `InvalidDescriptionError`; título inválido continua com prioridade e `InvalidTitleError`; data layer não é chamado quando falha; DTO inclui `description` e continua sem `userId`; `listTasks` devolve `description` (ajustar `rawTask`).

### 3. Frontend
- `services/tasks.service.ts`: tipo `Task` ganha `description: string | null`; `createTask(token, title, description?)` envia `{ title, description }`.
- `containers/AddTaskModal.tsx`: estado `description`; `<textarea maxLength={500}>` com placeholder "Descrição (opcional)"; botões "Cancelar" e "Concluir" ("Concluindo..." em loading); erros da API continuam em pt-BR (P-06).
- `components/TaskList.tsx`: renderiza `task.description` em texto secundário abaixo do título quando existir; vazia → "Nenhuma task criada ainda.".
- `containers/DashboardView.tsx`: botão "Nova task" → "Criar task".
- Testes de front (Vitest + Testing Library, `*.test.tsx`): `TaskList` (lista vazia mostra a mensagem; mostra descrição só quando existe); `AddTaskModal` (envia título e descrição ao service, mostra erro, desabilita durante loading). Mockar `@frontend/services/tasks.service`.

### 4. Documentação
- `PRD.md`: P-03 (título + descrição opcional ≤ 500, trim), §2.2 (campo `description`), §2.5, §5.3 (`POST` body `{ title, description? }`, `400` título/descrição inválidos), remover D-2 (rota já tem `.catch`), tirar "descrição" implícita de §2.6 se aplicável.
- `AGENTS.md`/`src/backend/AGENTS.md`: só se mencionarem "só título e status".

## Verificação
- `npm run test:backend` e `npm run test:frontend`: novos testes vermelhos antes, verdes depois.
- `npm run lint` e `npm run build`.
- Manual (`npm run dev`): login → `/dashboard` → "Criar task" → título + descrição → "Concluir" → aparece na lista com a descrição; sem descrição → aparece só o título; 501 caracteres → erro visível; lista vazia mostra "Nenhuma task criada ainda.".
- Conferir no banco via MCP `sqlite` (skill `sqlite-mcp`) que `description` foi gravada (se o servidor estiver registrado no `.mcp.json`).
- Rodar o agent `code-reviewer` ao final. Não abrir PR (o usuário faz).

## Riscos / pontos de atenção
- Migration altera `dev.db` local (não versionado); rodar `npm run prisma:generate` após migrar.
- `.mcp.json` local está sem servidores (alteração do usuário, não mexer).
