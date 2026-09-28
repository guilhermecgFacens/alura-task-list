# Plano — Endpoint para Listar Tasks do Usuário

## 1. Objetivo

Implementar (ou revisar) um endpoint `GET /api/tasks` que retorna as tarefas que pertencem ao usuário autenticado, com suporte a filtro opcional por status.

---

## 2. Estado atual

⚠️ **Este endpoint já foi implementado.** Ver:
- Route: [src/app/api/tasks/route.ts](../src/app/api/tasks/route.ts) (função `GET`)
- Use-case: [src/backend/tasks/use-cases.ts](../src/backend/tasks/use-cases.ts) (`listTasks`)
- Data layer: [src/backend/data/tasks.ts](../src/backend/data/tasks.ts) (`findTasksByUser`)
- Frontend: [src/frontend/services/tasks.service.ts](../src/frontend/services/tasks.service.ts) (`listTasks`)

Se você quer **entender como funciona**, siga a seção 3. Se quer **implementar do zero como exercício**, ignore a nota acima e prossiga normalmente.

---

## 3. Contrato da API

**Endpoint:** `GET /api/tasks`

### Requisição

- **Autenticação**: obrigatória. `userId` vem do JWT via `getAuthPayload(request)`, nunca de query, body ou parâmetro.
- **Query param opcional**: `status`
  - Valores aceitos: `TODO`, `IN_PROGRESS`, `DONE`
  - Se omitido: retorna tarefas de todos os status
  - Se inválido: responde com `400`

**Exemplo de requisições:**
```bash
# Todas as tarefas
GET /api/tasks
Authorization: Bearer <token>

# Só tarefas concluídas
GET /api/tasks?status=DONE
Authorization: Bearer <token>

# Status inválido
GET /api/tasks?status=INVALIDO
Authorization: Bearer <token>
# → 400 { "error": "Status inválido" }
```

### Resposta de sucesso (`200`)

```json
{
  "tasks": [
    {
      "id": "cuid-task-1",
      "title": "Comprar leite",
      "status": "TODO",
      "createdAt": "2025-09-28T10:30:00.000Z",
      "updatedAt": "2025-09-28T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

**Campos:**
- `tasks`: array de `TaskDTO` (sem o campo interno `userId`)
- `count`: número de tarefas retornadas

### Respostas de erro

| Status | Resposta | Motivo |
|---|---|---|
| `401` | `{ "error": "Não autenticado" }` | Token ausente ou inválido |
| `400` | `{ "error": "Status inválido" }` | Query param `status` com valor fora do enum |

---

## 4. Estrutura de implementação

### Onde cada parte mora

Seguindo a arquitetura do projeto ([PRD.md](../PRD.md), seção 4-5):

#### `src/backend/data/tasks.ts` (camada de dados)

```typescript
export function findTasksByUser(userId: string, status?: TaskStatus) {
  return prisma.task.findMany({
    where: {
      userId,
      ...(status !== undefined ? { status } : {}),
    },
  });
}
```

**Responsabilidades:**
- Query ao Prisma filtrando por `userId` (obrigatório) e `status` (opcional)
- Retorna array de tasks crus do banco
- Sem regra de negócio, sem tratamento de erro

#### `src/backend/tasks/use-cases.ts` (lógica de negócio)

```typescript
export async function listTasks(userId: string, status?: string) {
  // 1. Valida o status contra o enum, se informado
  const parsed = listTasksSchema.safeParse({ status });
  if (!parsed.success) {
    throw new InvalidStatusError("Status inválido");
  }

  // 2. Chama a camada de dados
  const tasks = await tasksData.findTasksByUser(userId, parsed.data.status);

  // 3. Converte para DTOs
  const dtos = tasks.map(toTaskDTO);

  // 4. Retorna com count
  return { tasks: dtos, count: dtos.length };
}
```

**Responsabilidades:**
- Validação com Zod (`listTasksSchema`)
- Lança `InvalidStatusError` se a validação falhar
- Chama a camada de dados
- Mapeia resultado para DTO (sem `userId`)
- Retorna `{ tasks, count }`

#### `src/backend/tasks/schema.ts` (validação)

```typescript
export const listTasksSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
});
```

**Responsabilidades:**
- Define o esquema de validação para o filtro de status
- Valida contra o enum `TaskStatus` do Prisma

#### `src/backend/tasks/dto.ts` (transferência de dados)

```typescript
export interface TaskDTO {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toTaskDTO(task: {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
```

**Responsabilidades:**
- Define a forma das tarefas que sai do backend (sem `userId`)
- Função `toTaskDTO` faz a conversão

#### `src/app/api/tasks/route.ts` (rota HTTP)

```typescript
export async function GET(request: NextRequest) {
  // 1. Autentica
  const auth = getAuthPayload(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // 2. Extrai query param
  const status = request.nextUrl.searchParams.get("status") ?? undefined;

  // 3. Chama o use-case
  try {
    const result = await listTasks(auth.sub, status);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InvalidStatusError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error; // Erro desconhecido vira 500
  }
}
```

**Responsabilidades:**
- Autentica e responde `401` se não houver token válido
- Extrai o query param `status`
- Chama o use-case
- Mapeia erros de domínio para status HTTP
- Nunca contém lógica de negócio ou Prisma direto

---

## 5. Testes

Testes do use-case em `src/backend/tasks/tasks.test.ts`, cobrindo:

- ✅ Retorna tarefas mapeadas para DTOs quando nenhum filtro é dado
- ✅ Passa um filtro `status` válido para a camada de dados
- ✅ Retorna lista vazia sem erro quando o usuário não tem tarefas
- ❌ Lança `InvalidStatusError` para um status fora do enum
- ✅ Confirma que a camada de dados NÃO é chamada quando a validação falha

---

## 6. Integração com o frontend

O frontend já implementa a chamada em `src/frontend/services/tasks.service.ts`:

```typescript
export function listTasks(token: string) {
  return http.get<{ tasks: Task[] }>("/api/tasks", { token });
}
```

E o container `DashboardView` chama:

```typescript
const data = await listTasks(authToken);
setTasks(data.tasks);
```

**Nenhuma mudança necessária no frontend.** O contrato já está alinhado.

---

## 7. Checklist de execução

Se for implementar do zero:

- [ ] **Backend:**
  - [ ] Criar `src/backend/data/tasks.ts` com `findTasksByUser(userId, status?)`
  - [ ] Criar/atualizar `src/backend/tasks/schema.ts` com `listTasksSchema`
  - [ ] Criar/atualizar `src/backend/tasks/dto.ts` com `TaskDTO` e `toTaskDTO`
  - [ ] Criar/atualizar `src/backend/tasks/use-cases.ts` com `listTasks` + `InvalidStatusError`
  - [ ] Escrever testes em `src/backend/tasks/tasks.test.ts` ANTES da implementação (TDD)
  
- [ ] **Route:**
  - [ ] Criar/editar `src/app/api/tasks/route.ts` com handler `GET`
  - [ ] Testar manualmente cada cenário (sem token, status válido, status inválido, lista vazia, múltiplas tarefas)
  
- [ ] **Verificação:**
  - [ ] `npm run lint` → sem erros
  - [ ] `npm run test:backend` → todos os testes passam
  - [ ] **`npm run build` → sucesso** (obrigatório ao finalizar — garante que o TypeScript compila e a build é válida)
  - [ ] Rodar agente `code-reviewer` para revisão independente

- [ ] **Finalização:**
  - [ ] Atualizar este documento com o status
  - [ ] Não criar PR (usuário faz isso)

---

## 7.1 Build obrigatório

**Ao finalizar qualquer mudança no código**, execute:

```bash
npm run build
```

Este comando:
- Valida todo o TypeScript em modo `strict`
- Compila o Next.js
- Detecta erros de tipo, imports não resolvidos, ou sintaxe inválida
- **Deve passar sem erros** antes de considerar a tarefa concluída

Se o build falhar, volte à implementação e corrija até passar.

---

## 9. Referências no projeto

- [PRD.md](../PRD.md) — Decisões técnicas (T-30..T-36 para backend, T-40..T-45 para REST)
- [AGENTS.md](../AGENTS.md) — Comandos e checklist
- [src/backend/AGENTS.md](../src/backend/AGENTS.md) — Convenções detalhadas
- [.claude/skills/feature-flow/SKILL.md](../.claude/skills/feature-flow/SKILL.md) — Fluxo de implementação de features

---

## 10. Fora de escopo (não implementar)

- Paginação ou limite de resultados
- Busca por texto no título
- Ordenação customizável (a ordem atual não é garantida; ver débito D-3 no PRD)
- Filtro por múltiplos status simultâneos (ex.: `status=TODO,DONE`)
- UI no dashboard para selecionar o filtro (a rota já suporta, mas a tela é futura)

---

## 11. Próximos passos

Após este endpoint estar pronto e testado:

1. **Criar task** (`POST /api/tasks`) — já implementado
2. **Atualizar status** (`PATCH /api/tasks/:id`) — já implementado
3. **Deletar task** (`DELETE /api/tasks/:id`) — já implementado
4. **Editar título** (`PATCH /api/tasks/:id` com `{ title }`) — próxima feature no roadmap
