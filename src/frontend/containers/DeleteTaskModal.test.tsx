import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteTaskModal } from "@frontend/containers/DeleteTaskModal";
import * as tasksService from "@frontend/services/tasks.service";

vi.mock("@frontend/services/tasks.service", () => ({
  deleteTask: vi.fn(),
}));

function setup() {
  const onClose = vi.fn();
  const onDeleted = vi.fn();
  const task = { id: "task-1", title: "Comprar leite" };
  render(
    <DeleteTaskModal
      token="tok"
      task={task}
      onClose={onClose}
      onDeleted={onDeleted}
    />,
  );
  return { onClose, onDeleted, task };
}

function confirm() {
  fireEvent.click(screen.getByRole("button", { name: "Remover" }));
}

function cancel() {
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
}

describe("DeleteTaskModal", () => {
  beforeEach(() => {
    vi.mocked(tasksService.deleteTask).mockReset();
  });

  it("shows the task title and confirmation message", () => {
    setup();

    expect(screen.getByText("Remover task")).toBeInTheDocument();
    expect(
      screen.getByText(/Tem certeza que deseja remover "Comprar leite"/),
    ).toBeInTheDocument();
  });

  it("calls onClose and does not call deleteTask when cancel is clicked", async () => {
    const { onClose, onDeleted } = setup();

    cancel();

    expect(onClose).toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(tasksService.deleteTask).not.toHaveBeenCalled();
  });

  it("calls deleteTask and then onDeleted when confirm is clicked", async () => {
    vi.mocked(tasksService.deleteTask).mockResolvedValue(undefined);
    const { onDeleted } = setup();

    confirm();

    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(tasksService.deleteTask).toHaveBeenCalledWith("tok", "task-1");
  });

  it("shows the API error message and does not call onDeleted", async () => {
    vi.mocked(tasksService.deleteTask).mockRejectedValue(
      new Error("Task não encontrada"),
    );
    const { onDeleted } = setup();

    confirm();

    expect(
      await screen.findByText("Task não encontrada"),
    ).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("disables the delete button and shows loading text while deleting", async () => {
    vi.mocked(tasksService.deleteTask).mockReturnValue(new Promise(() => {}));
    setup();

    confirm();

    expect(
      await screen.findByRole("button", { name: "Removendo..." }),
    ).toBeDisabled();
  });

  it("allows clicking cancel while loading (does not prevent default behavior)", async () => {
    vi.mocked(tasksService.deleteTask).mockReturnValue(new Promise(() => {}));
    const { onClose } = setup();

    confirm();
    await screen.findByRole("button", { name: "Removendo..." });

    cancel();

    expect(onClose).toHaveBeenCalled();
  });
});
