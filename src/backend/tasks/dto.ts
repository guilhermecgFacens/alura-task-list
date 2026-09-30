import { TaskStatus } from "@prisma/client";

export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toTaskDTO(task: {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
