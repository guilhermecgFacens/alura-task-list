// Stop hook: pede ao Claude para conferir se AGENTS.md (referenciado por CLAUDE.md)
// ficou desatualizado em relação às mudanças do repositório.
// Só dispara quando o diff mudou desde a última checagem (evita repetir a cada resposta).
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const stateFile = join(root, ".claude", ".agents-sync-state");
const ignored = [":(exclude)AGENTS.md", ":(exclude)CLAUDE.md"];

const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {}

// Já estamos continuando por causa deste hook: não bloquear de novo.
if (input.stop_hook_active) process.exit(0);

let snapshot;
try {
  snapshot = git("status", "--porcelain", "--", ".", ...ignored) + git("diff", "HEAD", "--", ".", ...ignored);
} catch {
  process.exit(0); // fora de repo git ou git indisponível
}
if (!snapshot.trim()) process.exit(0);

const hash = createHash("sha256").update(snapshot).digest("hex");
if (existsSync(stateFile) && readFileSync(stateFile, "utf8").trim() === hash) process.exit(0);
writeFileSync(stateFile, hash);

const reason = [
  "Antes de encerrar: confira se AGENTS.md (referenciado por CLAUDE.md) ficou desatualizado pelas mudanças desta interação.",
  "1. Rode `git diff HEAD` e `git status --porcelain` (ignore AGENTS.md/CLAUDE.md).",
  "2. Leia AGENTS.md e compare: stack, estrutura de pastas, aliases, comandos, convenções, armadilhas, referências a arquivos.",
  "3. Só edite AGENTS.md se alguma afirmação dele ficou desatualizada, incorreta ou incompleta (novo comando, pasta/alias, mudança de stack, convenção nova, algo documentado que foi removido). Mudança de implementação que não afeta o que está documentado NÃO justifica edição.",
  "4. Se editar: menor mudança possível, mesmo estilo e idioma (português). Nunca edite CLAUDE.md — ele só aponta para AGENTS.md.",
  "5. Se nada estiver desatualizado, não altere nada e responda apenas 'AGENTS.md em dia'.",
].join("\n");

process.stdout.write(JSON.stringify({ decision: "block", reason }));
