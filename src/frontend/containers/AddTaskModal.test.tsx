import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddTaskModal } from "@frontend/containers/AddTaskModal";
import * as tasksService from "@frontend/services/tasks.service";

vi.mock("@frontend/services/tasks.service", () => ({
  createTask: vi.fn(),
}));

function setup() {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  render(<AddTaskModal token="tok" onClose={onClose} onCreated={onCreated} />);
  return { onClose, onCreated };
}

function fillTitle(value: string) {
  fireEvent.change(screen.getByPlaceholderText("Título da task"), {
    target: { value },
  });
}

function fillDescription(value: string) {
  fireEvent.change(screen.getByPlaceholderText("Descrição (opcional)"), {
    target: { value },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
}

describe("AddTaskModal", () => {
  beforeEach(() => {
    vi.mocked(tasksService.createTask).mockReset();
  });

  it("sends title and description to the service and notifies the parent", async () => {
    vi.mocked(tasksService.createTask).mockResolvedValue({
      id: "1",
      title: "Comprar leite",
      description: "Integral",
      status: "TODO",
    });
    const { onCreated } = setup();

    fillTitle("Comprar leite");
    fillDescription("Integral");
    submit();

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(tasksService.createTask).toHaveBeenCalledWith(
      "tok",
      "Comprar leite",
      "Integral",
    );
  });

  it("allows creating a task without description", async () => {
    vi.mocked(tasksService.createTask).mockResolvedValue({
      id: "1",
      title: "Comprar leite",
      description: null,
      status: "TODO",
    });
    const { onCreated } = setup();

    fillTitle("Comprar leite");
    submit();

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(tasksService.createTask).toHaveBeenCalledWith(
      "tok",
      "Comprar leite",
      "",
    );
  });

  it("shows the API error message and does not notify the parent", async () => {
    vi.mocked(tasksService.createTask).mockRejectedValue(
      new Error("Descrição muito longa"),
    );
    const { onCreated } = setup();

    fillTitle("Comprar leite");
    submit();

    expect(await screen.findByText("Descrição muito longa")).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("disables the submit button and shows loading text while saving", async () => {
    vi.mocked(tasksService.createTask).mockReturnValue(new Promise(() => {}));
    setup();

    fillTitle("Comprar leite");
    submit();

    expect(
      await screen.findByRole("button", { name: "Concluindo..." }),
    ).toBeDisabled();
  });

  it("limits the description field to 500 characters", () => {
    setup();

    expect(screen.getByPlaceholderText("Descrição (opcional)")).toHaveAttribute(
      "maxlength",
      "500",
    );
  });
});
