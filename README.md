# Projeto do curso

Gerenciador de tasks simples: login por email, dashboard com suas tasks e status (`TODO` / `IN_PROGRESS` / `DONE` / `CANCELLED`).

Stack: **Next.js (App Router)** + **TypeScript** + **Prisma** (SQLite) + **JWT**.

O código é separado em duas pastas dentro de `src/`, para deixar claro o que é front e o que é back:

```
src/
├── app/        # router do Next.js (páginas + api routes) — é só a "casca": conecta tudo, mas não tem lógica
├── frontend/   # componentes React, o que aparece na tela (alias de import: @frontend/*)
└── backend/    # regras de negócio, Prisma, autenticação (alias de import: @backend/*)
```

---

## Pré-requisitos

Antes de começar, você precisa ter instalado:

- **[Node.js](https://nodejs.org/) versão 20 ou mais recente** — rode `node -v` no terminal pra conferir. Se aparecer um erro ou uma versão menor que 20, instale/atualize antes de continuar.
- **[Git](https://git-scm.com/)** — pra clonar o repositório.
- Um editor de código (recomendamos [VS Code](https://code.visualstudio.com/)).

Não precisa instalar banco de dados nenhum: usamos SQLite, que é só um arquivo local, criado automaticamente no setup.

---

## Passo a passo: rodando o projeto pela primeira vez

**1. Clone o repositório e entre na pasta:**

```bash
git clone <url-do-repositorio>
cd <pasta-do-projeto>
```

**2. Rode o setup:**

```bash
npm run setup
```

Esse comando faz três coisas automaticamente, na ordem:

1. `npm install` — baixa todas as bibliotecas que o projeto usa (Next.js, Prisma, etc).
2. Cria o arquivo `.env` (copiando de `.env.example`) — é nele que ficam as configurações sensíveis, como a string de conexão do banco e o segredo usado para gerar os tokens de login. Esse arquivo **não** vai para o git (cada pessoa tem o seu), por isso ele precisa ser criado localmente.
3. Roda as migrations do Prisma — cria o arquivo do banco de dados (`src/backend/prisma/dev.db`) já com as tabelas `User` e `Task`.

Se tudo correr bem, a última linha no terminal vai ser:

```
Setup concluído. Rode `npm run dev` para subir o servidor.
```

**3. Suba o servidor:**

```bash
npm run dev
```

O terminal vai mostrar um endereço, normalmente `http://localhost:3000` (se essa porta estiver ocupada por outro programa, o Next escolhe automaticamente 3001, 3002, etc. — é só usar o endereço que aparecer no terminal).

**4. Abra no navegador** e teste o fluxo:

- `/` — landing page, com um botão "Entrar".
- `/login` — digite qualquer email válido (não pede senha, é um login simplificado propositalmente). Ao entrar, você é redirecionado pro dashboard.
- `/dashboard` — lista suas tasks (vazia no começo — isso a gente vai construir juntos nas próximas aulas).

Pronto, ambiente rodando! 🎉

---

## Comandos do dia a dia

| Comando | Para que serve |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento (com hot-reload) |
| `npm run build` | Gera a versão de produção |
| `npm run lint` | Roda o linter (ESLint) |
| `npm run prisma:studio` | Abre uma interface visual no navegador pra ver/editar os dados do banco |
| `npm run prisma:migrate` | Aplica alterações no `schema.prisma` ao banco (roda de novo sempre que você mudar um modelo) |
| `npm run prisma:generate` | Regenera o Prisma Client (normalmente não precisa rodar manualmente — o `migrate` já faz isso) |

---

## Resolvendo problemas comuns

**"Porta 3000 já está em uso"**
Sem problema — o Next sobe automaticamente em outra porta (3001, 3002...) e avisa qual no terminal. Só usar o endereço que ele mostrar.

**Next.js avisa "inferred your workspace root" / detectou múltiplos lockfiles**
Isso acontece se o projeto estiver dentro de uma pasta que tem, em algum nível acima, outro `package-lock.json` (ex: clonar direto dentro de `C:\Users\seu-nome\`, ao lado de outros projetos Node soltos). Não quebra o projeto, mas o ideal é clonar o repositório numa pasta dedicada (ex: `Documentos/projetos/`) para evitar esse ruído.

**Erro relacionado a Turbopack no Windows**
Já resolvido: o script `dev` roda com a flag `--webpack`, que evita um crash conhecido do Turbopack em algumas máquinas Windows. Se você rodar `npx next dev` diretamente (sem passar pelo `npm run dev`), pode reencontrar esse erro — prefira sempre `npm run dev`.

**Mudei o `schema.prisma` e nada aconteceu**
Rode `npm run prisma:migrate` de novo — é o comando que aplica qualquer mudança de modelo ao banco.

**Apaguei sem querer o `dev.db` ou quero resetar os dados**
Sem problema, ele é só um arquivo local (não fica versionado no git). Rode `npm run prisma:migrate` novamente para recriá-lo do zero, com as tabelas vazias.

---

## Saiba mais

- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Prisma](https://www.prisma.io/docs)
