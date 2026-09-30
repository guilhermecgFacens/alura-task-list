"use client";

import { useState } from "react";
import { createTask } from "@frontend/services/tasks.service";
import { Modal } from "@frontend/components/Modal";

type AddTaskModalProps = {
  token: string;
  onClose: () => void;
  onCreated: () => void;
};

export function AddTaskModal({ token, onClose, onCreated }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      await createTask(token, title, description);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a task.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-background p-6 dark:border-zinc-800"
      >
        <h2 className="text-lg font-semibold tracking-tight">Nova task</h2>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            required
            autoFocus
            maxLength={200}
            placeholder="Título da task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground dark:border-zinc-800"
          />
          <textarea
            maxLength={500}
            rows={3}
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none rounded-lg border border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground dark:border-zinc-800"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {loading ? "Concluindo..." : "Concluir"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
