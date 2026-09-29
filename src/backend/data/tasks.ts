import { TaskStatus } from "@prisma/client";
import { prisma } from "@backend/lib/db";

export function findTasksByUser(userId: string, status?: TaskStatus) {
  return prisma.task.findMany({
    where: {
      userId,
      ...(status !== undefined ? { status } : {}),
    },
  });
}

export function createTask(
  userId: string,
  title: string,
  description: string | null,
) {
  return prisma.task.create({
    data: { title, description, userId },
  });
}

export async function deleteTaskByIdAndUser(userId: string, taskId: string) {
  const result = await prisma.task.deleteMany({
    where: { id: taskId, userId },
  });

  return result.count > 0;
}

export async function updateTaskStatusByIdAndUser(
  userId: string,
  taskId: string,
  status: TaskStatus,
) {
  const result = await prisma.task.updateMany({
    where: { id: taskId, userId },
    data: { status },
  });

  if (result.count === 0) return null;

  return prisma.task.findUnique({ where: { id: taskId } });
}
