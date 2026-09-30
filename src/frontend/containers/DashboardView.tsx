"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getSession } from "@frontend/lib/session";
import {
  listTasks,
  updateTaskStatus,
  type Task,
  type TaskStatus,
} from "@frontend/services/tasks.service";
import { logout } from "@frontend/services/auth.service";
import { TaskList } from "@frontend/components/TaskList";
import { AddTaskModal } from "@frontend/containers/AddTaskModal";
import { DeleteTaskModal } from "@frontend/containers/DeleteTaskModal";

export function DashboardView() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const loadTasks = useCallback(async (authToken: string) => {
    try {
      const data = await listTasks(authToken);
      setLoadError(null);
      setTasks(data.tasks);
    } catch {
      setLoadError("Não foi possível atualizar a lista de tasks.");
    }
  }, []);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    listTasks(session.token)
      .then((data) => {
        setEmail(session.user.email);
        setToken(session.token);
        setTasks(data.tasks);
      })
      .catch(() => {
        setEmail(session.user.email);
        setToken(session.token);
        setLoadError("Não foi possível atualizar a lista de tasks.");
      });
  }, [router]);

  function handleTaskCreated() {
    if (token) loadTasks(token);
    setIsModalOpen(false);
  }

  function handleTaskDeleted() {
    if (token) loadTasks(token);
    setTaskToDelete(null);
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    if (!token) return;

    setUpdatingTaskId(taskId);
    try {
      await updateTaskStatus(token, taskId, status);
      setLoadError(null);
      await loadTasks(token);
    } catch {
      setLoadError("Não foi possível atualizar o status da task.");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  function handleLogout() {
    clearSession();
    logout();
    router.push("/");
  }

  if (!email) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Suas tasks
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Criar task
          </button>
          <button
            onClick={handleLogout}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Sair
          </button>
        </div>
      </div>

      {loadError && <p className="text-sm text-red-500">{loadError}</p>}

      {tasks === null ? (
        <p className="py-8 text-sm text-zinc-400">Carregando...</p>
      ) : (
        <TaskList
          tasks={tasks}
          updatingTaskId={updatingTaskId}
          onStatusChange={handleStatusChange}
          onDeleteRequest={setTaskToDelete}
        />
      )}

      {isModalOpen && token && (
        <AddTaskModal
          token={token}
          onClose={() => setIsModalOpen(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {taskToDelete && token && (
        <DeleteTaskModal
          token={token}
          task={taskToDelete}
          onClose={() => setTaskToDelete(null)}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}
