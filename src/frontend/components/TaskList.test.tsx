import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskList } from "@frontend/components/TaskList";
import type { Task } from "@frontend/services/tasks.service";

const baseProps = {
  updatingTaskId: null,
  onStatusChange: vi.fn(),
  onDeleteRequest: vi.fn(),
};

describe("TaskList", () => {
  it("shows the empty message when there are no tasks", () => {
    render(<TaskList {...baseProps} tasks={[]} />);

    expect(screen.getByText("Nenhuma task criada ainda.")).toBeInTheDocument();
  });

  it("renders the title of every task", () => {
    const tasks: Task[] = [
      { id: "1", title: "Comprar leite", description: null, status: "TODO" },
      { id: "2", title: "Estudar", description: null, status: "DONE" },
    ];

    render(<TaskList {...baseProps} tasks={tasks} />);

    expect(screen.getByText("Comprar leite")).toBeInTheDocument();
    expect(screen.getByText("Estudar")).toBeInTheDocument();
  });

  it("shows the description below the title when it exists", () => {
    const tasks: Task[] = [
      { id: "1", title: "Comprar leite", description: "Integral", status: "TODO" },
    ];

    render(<TaskList {...baseProps} tasks={tasks} />);

    expect(screen.getByText("Integral")).toBeInTheDocument();
  });

  it("does not render a description element when it is null", () => {
    const tasks: Task[] = [
      { id: "1", title: "Comprar leite", description: null, status: "TODO" },
    ];

    render(<TaskList {...baseProps} tasks={tasks} />);

    expect(screen.queryByTestId("task-description")).not.toBeInTheDocument();
  });
});
