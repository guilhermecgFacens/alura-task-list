import * as tasksData from "@backend/data/tasks";
import {
  listTasksSchema,
  createTaskSchema,
  updateTaskStatusSchema,
} from "./schema";
import { toTaskDTO } from "./dto";

export class InvalidStatusError extends Error {}
export class InvalidTitleError extends Error {}
export class InvalidDescriptionError extends Error {}
export class TaskNotFoundError extends Error {}

export async function listTasks(userId: string, status?: string) {
  const parsed = listTasksSchema.safeParse({ status });

  if (!parsed.success) {
    throw new InvalidStatusError("Status inválido");
  }

  const tasks = await tasksData.findTasksByUser(userId, parsed.data.status);
  const dtos = tasks.map(toTaskDTO);

  return { tasks: dtos, count: dtos.length };
}

export async function createTask(
  userId: string,
  title: unknown,
  description?: unknown,
) {
  const parsed = createTaskSchema.safeParse({
    title,
    description: description ?? undefined,
  });

  if (!parsed.success) {
    const titleIssue = parsed.error.issues.find(
      (issue) => issue.path[0] === "title",
    );

    if (titleIssue) {
      throw new InvalidTitleError(
        titleIssue.code === "too_big"
          ? "Título muito longo"
          : "Título é obrigatório",
      );
    }

    throw new InvalidDescriptionError(
      parsed.error.issues[0]?.code === "too_big"
        ? "Descrição muito longa"
        : "Descrição inválida",
    );
  }

  const task = await tasksData.createTask(
    userId,
    parsed.data.title,
    parsed.data.description || null,
  );
  return toTaskDTO(task);
}

export async function deleteTask(userId: string, taskId: string) {
  const deleted = await tasksData.deleteTaskByIdAndUser(userId, taskId);

  if (!deleted) {
    throw new TaskNotFoundError("Task não encontrada");
  }
}

export async function updateTaskStatus(
  userId: string,
  taskId: string,
  status: string,
) {
  const parsed = updateTaskStatusSchema.safeParse({ status });

  if (!parsed.success) {
    throw new InvalidStatusError("Status inválido");
  }

  const task = await tasksData.updateTaskStatusByIdAndUser(
    userId,
    taskId,
    parsed.data.status,
  );

  if (!task) {
    throw new TaskNotFoundError("Task não encontrada");
  }

  return toTaskDTO(task);
}
