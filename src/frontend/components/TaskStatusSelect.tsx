"use client";

import type { TaskStatus } from "@frontend/services/tasks.service";

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
  CANCELLED: "Cancelada",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as TaskStatus[];

const STATUS_STYLE: Record<TaskStatus, string> = {
  TODO: "border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400",
  IN_PROGRESS:
    "border-blue-200 text-blue-600 dark:border-blue-900 dark:text-blue-400",
  DONE: "border-green-200 text-green-600 dark:border-green-900 dark:text-green-400",
  CANCELLED: "border-red-200 text-red-600 dark:border-red-900 dark:text-red-400",
};

type TaskStatusSelectProps = {
  status: TaskStatus;
  taskTitle: string;
  isUpdating: boolean;
  onChange: (status: TaskStatus) => void;
};

export function TaskStatusSelect({
  status,
  taskTitle,
  isUpdating,
  onChange,
}: TaskStatusSelectProps) {
  return (
    <div className="flex items-center gap-2">
      {isUpdating && (
        <span
          aria-hidden="true"
          className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-zinc-300 border-t-foreground dark:border-zinc-700"
        />
      )}
      <div className="relative">
        <select
          value={status}
          disabled={isUpdating}
          onChange={(e) => onChange(e.target.value as TaskStatus)}
          aria-label={`Status da task ${taskTitle}`}
          aria-busy={isUpdating}
          style={{ colorScheme: "light" }}
          className={`appearance-none rounded-full border bg-transparent py-1 pl-3 pr-7 text-xs font-medium outline-none transition-colors hover:opacity-80 focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60 ${STATUS_STYLE[status]}`}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option} className="bg-white text-zinc-900">
              {STATUS_LABEL[option]}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 fill-current"
        >
          <path
            d="M5.5 7.5l4.5 4.5 4.5-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
