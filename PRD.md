# PRD + Decisões Técnicas — Gerenciador de Tasks

Documento híbrido de **requisitos de produto (PRD)** e **decisões técnicas (TDD)**. É a fonte de verdade sobre *o que* o projeto é, *por que* foi construído assim e *quais regras não podem ser quebradas* sem antes conversar com o time.

Quem usa: pessoas desenvolvedoras e agentes de IA (Claude Code, Cursor, Copilot…). Para agentes, o objetivo explícito é **evitar alucinações**. Nada de inventar padrões, dependências, endpoints ou funcionalidades que não estejam descritos aqui ou no código.

Documentos relacionados (operacionais, o "como"):

- [AGENTS.md](AGENTS.md): comandos, estrutura, armadilhas.
- [src/backend/AGENTS.md](src/backend/AGENTS.md): convenções detalhadas do backend.
- [src/frontend/AGENTS.md](src/frontend/AGENTS.md): convenções detalhadas do frontend.
- [.claude/skills/feature-flow/SKILL.md](.claude/skills/feature-flow/SKILL.md): fluxo para implementar features.

Cada decisão tem um ID (`P-xx` para produto, `T-xx` para técnica) para ser citada em planos, PRs e revisões.

---

## 1. Contexto e princípio norteador

Este é um projeto **didático**, feito em um curso de desenvolvimento full stack com Next.js. O objetivo é ensinar, de forma clara e progressiva, separação front/back, REST, ORM, validação, autenticação e autorização por dono do recurso.

> **Princípio P-00:** simplicidade e clareza pedagógica pesam mais do que robustez de produção. Quando "o mais correto para escala" e "o mais explícito e didático" divergirem, escolha o segundo. Não introduza camadas, abstrações ou bibliotecas que não sirvam ao objetivo de ensinar.

---

## 2. Produto (PRD)

### 2.1 Visão

Gerenciador de tarefas pessoal. Cada pessoa faz login e organiza as **próprias** tasks em quatro estados.

### 2.2 Entidades de domínio

| Entidade | Campos | Observações |
|---|---|---|
| `User` | `id` (cuid), `email` (único), `createdAt` | Criado automaticamente no primeiro login |
| `Task` | `id` (cuid), `title`, `description` (opcional), `status`, `createdAt`, `updatedAt`, `userId` | Sempre pertence a exatamente um usuário |
| `TaskStatus` | `TODO` \| `IN_PROGRESS` \| `DONE` \| `CANCELLED` | Rótulos na UI: "A fazer", "Em andamento", "Concluída", "Cancelada" |

### 2.3 Decisões de produto

| ID | Decisão |
|---|---|
| P-01 | Login **somente por email**, sem senha. Email inexistente → usuário criado na hora (upsert). Não existe tela de cadastro separada, e não deve existir. |
| P-02 | Cada usuário vê e altera **somente as próprias tasks**. Não há colaboração/compartilhamento. |
| P-03 | Uma task tem **título**, **descrição opcional** e **status**. Título obrigatório, sem espaços nas pontas (trim), máximo de **200** caracteres (`MAX_TITLE_LENGTH`). Descrição opcional, com trim, máximo de **500** caracteres (`MAX_DESCRIPTION_LENGTH`); vazia ou só espaços vira `null`. |
| P-04 | Toda task nova nasce com status `TODO`. |
| P-05 | Remoção de task pede **confirmação** (modal) e é definitiva (sem lixeira/undo). |
| P-06 | Toda ação assíncrona na UI (criar, atualizar, remover, carregar) mostra feedback de loading e mensagem de erro em pt-BR. |
| P-07 | Textos de UI e mensagens de erro em **português (pt-BR)**. |

### 2.4 Rotas de página

| Rota | Container | Descrição |
|---|---|---|
| `/` | `LandingHero` (component) | Landing com CTA "Entrar" |
| `/login` | `LoginForm` | Formulário de email → salva sessão → redireciona para `/dashboard` |
| `/dashboard` | `DashboardView` | Lista tasks, cria, muda status, remove, logout. Sem sessão → redireciona para `/login` |

### 2.5 Funcionalidades: estado atual

| Funcionalidade | Backend | Frontend |
|---|---|---|
| Login / logout | ✅ | ✅ |
| Listar tasks (com filtro opcional `?status=`) | ✅ | ✅ (sem UI de filtro) |
| Criar task (título + descrição opcional) | ✅ | ✅ (`AddTaskModal`) |
| Alterar status | ✅ | ✅ (`TaskStatusSelect`) |
| Remover task | ✅ | ✅ (`DeleteTaskModal`) |
| Editar título | ❌ não implementado | ❌ |
| UI de filtro por status | n/a | ❌ não implementado |

Próximo passo natural do produto: **editar título** (ver §5.4). Implemente só quando for pedido, seguindo os padrões deste documento.

### 2.6 Fora de escopo (decisão explícita)

Não implemente nada disto "de brinde". Se parecer necessário, **pergunte antes**:

- Senha/hash, OAuth/login social, MFA, verificação de email, refresh token/rotação de sessão.
- Qualquer mudança no fluxo de autenticação atual (P-01, T-20..T-23).
- Compartilhamento/colaboração entre usuários.
- Categorias, tags, prazos, lembretes, anexos, prioridades, subtarefas.
- Paginação, busca textual, ordenação customizável, filtro por múltiplos status.
- Qualquer banco além do SQLite.

---

## 3. Stack

| Camada | Escolha | Observação |
|---|---|---|
| Framework | Next.js 16 (App Router) | Só "cola" de roteamento (T-01) |
| Dev server | Webpack (`next dev --webpack`) | Turbopack crasha no Windows. **Sempre** `npm run dev` |
| UI | React 19, só Client Components | T-10 |
| Estilo | Tailwind CSS v4 | Classes utilitárias direto no JSX |
| Validação | Zod 4 | T-32 |
| ORM | Prisma 6 | Schema em `src/backend/prisma/schema.prisma` |
| Banco | SQLite (`src/backend/prisma/dev.db`) | Arquivo local, não versionado |
| Auth | JWT (`jsonwebtoken`), 7 dias | T-20 |
| Linguagem | TypeScript `strict` | Sem `any`, sem desligar checks |
| Testes | Vitest 4 (backend: `node`; frontend: `jsdom` + Testing Library) | T-50 |
| Node | ≥ 20 | |

> **T-00:** não adicione dependências (state managers, UI kits, data-fetching libs, ORMs, bancos, libs de form) sem aprovação. Stack enxuta é intencional.

---

## 4. Arquitetura geral

```
src/
├── app/        # Next.js: só roteamento. Conecta, nunca decide
├── frontend/   # React: o que renderiza (alias @frontend/*)
└── backend/    # regras de negócio, validação, dados, auth (alias @backend/*)
```

| ID | Decisão |
|---|---|
| T-01 | **`src/app/` não contém lógica.** É a única pasta acoplada ao Next.js. |
| T-02 | `src/app/**/page.tsx` apenas importa **um** container (ou component) de `@frontend/*` e o retorna. Sem hooks, fetch, condicionais ou JSX adicional. |
| T-03 | `src/app/api/**/route.ts` apenas: (1) autentica via `getAuthPayload`, (2) extrai params/body/query, (3) chama **um** use-case de `@backend/*`, (4) traduz retorno/erro em `NextResponse`. Sem validação, sem Prisma, sem regra de negócio. |
| T-04 | `frontend/` nunca importa de `backend/` e vice-versa. A comunicação é **somente HTTP** via API REST. |
| T-05 | Aliases (`tsconfig.json`): `@/*`, `@frontend/*`, `@backend/*`. Sem `index.ts` barrel. Importe o caminho completo do arquivo. |

Se uma tarefa parece exigir lógica em `src/app/`, a lógica pertence a outro lugar: mova-a para `frontend/` ou `backend/`.

---

## 5. Backend

### 5.1 Estrutura

```
src/backend/
├── auth.ts               # login + getAuthPayload (débito: ver §9)
├── lib/db.ts             # singleton do PrismaClient
├── data/                 # camada de dados: ÚNICO lugar que importa Prisma
│   └── tasks.ts
├── tasks/                # família de use-cases da entidade Task
│   ├── use-cases.ts      # uma função por caso de uso + classes de erro
│   ├── schema.ts         # schemas Zod + constantes (MAX_TITLE_LENGTH)
│   ├── dto.ts            # TaskDTO + toTaskDTO
│   └── tasks.test.ts     # testes dos use-cases
└── prisma/               # schema, migrations, dev.db
```

### 5.2 Decisões

| ID | Decisão |
|---|---|
| T-30 | **Um caso de uso = uma função exportada** em `<entidade>/use-cases.ts` (`listTasks`, `createTask`, `updateTaskStatus`, `deleteTask`). Nada de classe "Service" com vários métodos. |
| T-31 | Use-cases não conhecem HTTP (`NextRequest`/`NextResponse`). Recebem primitivos (`userId`, `taskId`, valores crus) e retornam DTOs ou lançam erros de domínio. |
| T-32 | **Validação com Zod** no início de todo use-case que recebe input externo, antes de tocar a camada de dados. Schemas em `<entidade>/schema.ts`. Nada de `if`s manuais de validação. `ZodError` nunca vaza. É convertido em erro de domínio. |
| T-33 | **Erros de domínio** são classes que estendem `Error`, declaradas em `use-cases.ts` (`InvalidTitleError`, `InvalidDescriptionError`, `InvalidStatusError`, `TaskNotFoundError`), com mensagem em pt-BR. |
| T-34 | **Camada de dados** (`src/backend/data/`) é o único lugar que importa `@prisma/client`/`@backend/lib/db` para queries. Funções finas, sem regra de negócio, recebem dados já validados. (Use-cases podem importar **tipos/enums** do Prisma, como `TaskStatus`, em schema/dto.) |
| T-35 | **DTO obrigatório no retorno.** Use-cases nunca retornam o objeto do Prisma. `TaskDTO` = `{ id, title, description, status, createdAt, updatedAt }`. `userId` **não** é exposto. |
| T-36 | **Autorização por dono na própria query:** toda leitura/escrita filtra por `userId` **do token**. Escritas usam `updateMany`/`deleteMany` com `where: { id, userId }` e checam `count`. `count === 0` → `TaskNotFoundError` (404). Nunca revele se a task existe mas é de outro usuário. |
| T-37 | Nova entidade → nova pasta `<entidade>/` com `use-cases.ts`, `schema.ts`, `dto.ts`, `<entidade>.test.ts`, e `data/<entidade>.ts`. |
| T-38 | Mudança em `schema.prisma` exige `npm run prisma:migrate` e commit da migration em `src/backend/prisma/migrations/`. |

### 5.3 Contrato REST

Todos os endpoints de tasks exigem `Authorization: Bearer <token>`. Corpo e respostas em JSON. Erros sempre no formato `{ "error": "<mensagem pt-BR>" }`.

| Método | URI | Body / Query | Sucesso | Erros |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | `{ email }` | `200` `{ token, user: { id, email } }` | `400` email inválido |
| `POST` | `/api/auth/logout` | — | `200` `{ ok: true }` (stateless; o cliente apaga a sessão) | — |
| `GET` | `/api/tasks` | `?status=TODO\|IN_PROGRESS\|DONE\|CANCELLED` (opcional) | `200` `{ tasks: TaskDTO[], count }` | `400` status inválido, `401` |
| `POST` | `/api/tasks` | `{ title, description? }` | `201` `TaskDTO` | `400` título ou descrição inválidos, `401` |
| `PATCH` | `/api/tasks/:id` | `{ status }` | `200` `TaskDTO` | `400` status inválido, `401`, `404` |
| `DELETE` | `/api/tasks/:id` | — | `204` sem corpo | `401`, `404` |

| ID | Decisão |
|---|---|
| T-40 | Recursos no plural, substantivos (`/api/tasks`, `/api/tasks/:id`). Verbo HTTP expressa a ação. Nada de `/api/createTask` ou `/api/tasks/:id/delete`. |
| T-41 | Mapeamento fixo erro → status: validação → `400`; sem token/token inválido → `401`; recurso inexistente ou de outro usuário → `404`. Erro não mapeado é relançado (vira `500`). Cada nova classe de erro recebe **um** status fixo. |
| T-42 | `userId` **nunca** vem de body, query ou params. Sempre `auth.sub` do JWT. |
| T-43 | Criação responde `201` com o recurso. Remoção responde `204` sem corpo. Atualização responde `200` com o recurso atualizado. |
| T-44 | Atualizações parciais usam `PATCH`. O `PATCH /api/tasks/:id` hoje aceita só `status`. |
| T-45 | Datas trafegam como string ISO 8601 (serialização padrão de `Date` no JSON). |

### 5.4 Como estender (exemplo: editar título)

Siga o padrão existente, sem inventar um novo:

1. `schema.ts`: schema Zod reaproveitando as regras de título (P-03).
2. `data/tasks.ts`: `updateTaskTitleByIdAndUser(userId, taskId, title)` com `updateMany` + `count` (T-36).
3. `use-cases.ts`: `updateTaskTitle(userId, taskId, title)` → valida → `InvalidTitleError` / `TaskNotFoundError` → `toTaskDTO`.
4. Testes antes da implementação (T-51).
5. Route: decidir **com o time** se o `PATCH /api/tasks/:id` passa a aceitar `{ title }` e/ou `{ status }` (recomendado, por ser REST) ou se entra outro desenho. Não decida sozinho.

---

## 6. Autenticação e autorização

> Pronto e **congelado**. Não altere sem pedido explícito.

| ID | Decisão |
|---|---|
| T-20 | `login(email)` valida o formato, faz `upsert` do usuário e assina um JWT `{ sub: userId, email }` com `JWT_SECRET`, expirando em `7d`. |
| T-21 | O token é retornado no corpo, guardado em `localStorage` (`src/frontend/lib/session.ts`, chave `session`) e enviado como `Authorization: Bearer <token>` pelo `http.ts`. |
| T-22 | `getAuthPayload(request)` é a única forma de autenticar uma requisição no backend. Retorna `null` se o token estiver ausente/inválido, e a route responde `401`. |
| T-23 | Proteção de páginas é **só client-side** (o container verifica a sessão e redireciona). Não existe middleware server-side. As APIs se protegem sozinhas via T-22. |
| T-24 | A ausência de senha é **intencional** (P-01). Não é bug nem vulnerabilidade a "corrigir". |

---

## 7. Frontend

### 7.1 Estrutura

```
src/frontend/
├── containers/   # "smart": estado, efeitos, chamadas a services, orquestração
├── components/   # "dumb": só props → render
├── services/     # acesso HTTP ao backend (http.ts + <dominio>.service.ts)
└── lib/          # utilitários puros (session.ts)
```

### 7.2 Decisões

| ID | Decisão |
|---|---|
| T-10 | **Somente Client Components.** Containers e components com hooks declaram `"use client"`. Proibido: Server Components com lógica, Server Actions, `fetch` em componente de servidor, `getServerSideProps`, streaming/SSR de dados. As páginas em `src/app/` são só a casca que monta o container (T-02). |
| T-11 | **Container-Presenter, organizado por página.** Cada rota tem um container de página (`LoginForm`, `DashboardView`) que concentra estado, chamadas de API, sessão e redirecionamentos daquela rota. O estado de uma página não vaza para outras (sem estado global, sem Context compartilhado entre páginas). |
| T-12 | **Components são dumb:** recebem dados + callbacks via props. Não importam `services/` nem `lib/session`, não fazem fetch nem tomam decisão de negócio. Estado interno só para UI (ex.: aberto/fechado). |
| T-13 | Subcontainers são permitidos quando encapsulam uma ação completa com o próprio ciclo de loading/erro (`AddTaskModal`, `DeleteTaskModal`). Eles recebem `token` e notificam o container de página por callback (`onCreated`, `onDeleted`). Quem decide recarregar a lista é o container de página. |
| T-14 | **Composição acima de prop drilling.** Prefira `children`/slots (ex.: `Modal` recebe `children`). Uma prop atravessando 3+ níveis só para chegar a uma folha é sinal para recompor. |
| T-15 | **Todo fetch passa por `services/`.** Uma função por operação de API (`listTasks`, `createTask`, `updateTaskStatus`, `deleteTask`, `login`, `logout`), usando o cliente `http.ts`, que monta headers, trata `204` e lança `ApiError` com a mensagem da API. |
| T-16 | Tipos de domínio do front (`Task`, `TaskStatus`) são definidos **uma vez**, no service correspondente, e importados de lá. O front não importa tipos do backend (T-04). |
| T-17 | Modais reutilizam `components/Modal.tsx` (overlay, Esc, clique fora). |
| T-18 | `<select>` nativo: `style={{ colorScheme: "light" }}` + cores explícitas nas `<option>` (o dark mode do popup nativo não é confiável). |
| T-19 | Validação no front (`required`, `type="email"`, `maxLength`) é só UX. **O backend é a autoridade** e sempre revalida. |

---

## 8. Convenções transversais

| ID | Decisão |
|---|---|
| T-60 | Identificadores (variáveis, funções, tipos, arquivos) em **inglês**. Textos de UI, mensagens de erro e comentários em **pt-BR**. |
| T-61 | TypeScript `strict`: sem `any`, sem `@ts-ignore`, sem desligar regras de lint para contornar erros. |
| T-62 | Variáveis de ambiente: `DATABASE_URL` e `JWT_SECRET` em `.env` (não versionado; modelo em `.env.example`). |
| T-63 | Nomes de arquivos: containers/components em `PascalCase.tsx`; services em `<dominio>.service.ts`; backend em `kebab-case.ts`. |
| T-50 | **Testes:** backend com Vitest mockando `@backend/data/*` (nunca o banco real). Arquivos `*.test.ts` em `src/backend/`, `*.test.tsx` em `src/frontend/`. Comandos: `npm run test:backend` / `npm run test:frontend`. |
| T-51 | **TDD no backend:** testes antes da implementação, cobrindo o caminho feliz, **cada** erro de domínio, limites de validação (vazio, só espaços, no limite, limite+1), resultado vazio como caso válido e que a camada de dados **não** é chamada quando a validação falha. |
| T-52 | Antes de considerar a tarefa pronta: `npm run lint`, `npm run build` e os testes da área tocada, todos passando. |
| T-53 | Acesso direto ao banco fora da aplicação (debug, inspeção) via MCP `sqlite` (`.mcp.json`), conforme a skill `sqlite-mcp`. |

---

## 9. Débitos técnicos conhecidos

Estes pontos estão registrados e **não** devem ser "corrigidos de surpresa" durante uma tarefa não relacionada. Corrija quando a tarefa tocar a área, ou quando for pedido.

| # | Débito | Encaminhamento |
|---|---|---|
| D-1 | `auth.ts` importa o Prisma direto, valida com regex/`if` e retorna o `user` cru (sem DTO/Zod/data layer). | Ao mexer em auth, migrar para `src/backend/auth/` + `data/users.ts` (ver [src/backend/AGENTS.md](src/backend/AGENTS.md)), **mantendo** o comportamento (T-20..T-24). |
| D-3 | `findTasksByUser` não define ordenação. A ordem da lista não é garantida. | Se for exigido, definir ordem (ex.: `createdAt`) na camada de dados. É decisão de produto: confirmar antes. |
| D-4 | O tipo `Task` do front não inclui `createdAt`/`updatedAt`, que a API já retorna. | Adicionar só quando a UI precisar. |
| D-5 | `<html lang="en">` no layout, mas a UI é pt-BR. | Trocar para `pt-BR` quando for tocar o layout. |
| D-6 | O token no `localStorage` não é validado quanto à expiração no cliente. Um token vencido só é percebido quando a API retorna `401`. | Aceito no escopo didático. |

---

## 10. Regras para agentes de IA (anti-alucinação)

1. **Verifique antes de afirmar.** Se um arquivo, função, endpoint ou campo não aparece no código ou neste documento, ele **não existe**. Não o cite como existente.
2. **Não crie padrões paralelos.** Copie a forma dos exemplos existentes: `tasks/use-cases.ts` para o backend, `[id]/route.ts` para routes, `DashboardView`/`TaskList` para o frontend.
3. **Não adicione dependências, rotas, campos no schema ou features** que não foram pedidos (T-00, §2.6).
4. **Conflito com este documento?** Aponte o conflito e pergunte. Não escolha um lado em silêncio.
5. **Mudanças arquiteturais** (Server Components, estado global, mudar a auth, trocar o banco, mover lógica para `app/`) exigem aprovação explícita.
6. Para implementar features, siga a skill **feature-flow** (discovery → plano confirmado → TDD/implementação → verificação + `code-reviewer`). **Não abra PR**: o usuário faz isso.
7. **Mantenha este documento vivo.** Se uma decisão for conscientemente revista, ou uma funcionalidade da §2.5 for concluída, atualize o PRD no mesmo trabalho.

---

## 11. Checklist rápido de revisão

- [ ] Nenhuma lógica em `src/app/` (T-01..T-03)
- [ ] Use-case valida com Zod antes de chamar a camada de dados (T-32)
- [ ] Prisma só em `src/backend/data/` (T-34)
- [ ] Retorno via DTO, sem `userId` (T-35)
- [ ] `userId` vem do token e toda query filtra por ele (T-36, T-42)
- [ ] Erros de domínio → status HTTP corretos, formato `{ error }` (T-41)
- [ ] Components sem fetch/services. Estado e API no container (T-11, T-12, T-15)
- [ ] Sem Server Components/Actions (T-10)
- [ ] Loading + erro visíveis na UI (P-06)
- [ ] Testes cobrindo edge cases (T-51). Lint, build e testes OK (T-52)
