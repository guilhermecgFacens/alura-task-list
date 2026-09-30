import { http } from "@frontend/services/http";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
};

export function listTasks(token: string) {
  return http.get<{ tasks: Task[] }>("/api/tasks", { token });
}

export function createTask(token: string, title: string, description?: string) {
  return http.post<Task>("/api/tasks", { title, description }, { token });
}

export function updateTaskStatus(token: string, id: string, status: TaskStatus) {
  return http.patch<Task>(`/api/tasks/${id}`, { status }, { token });
}

export function deleteTask(token: string, id: string) {
  return http.delete<void>(`/api/tasks/${id}`, { token });
}
