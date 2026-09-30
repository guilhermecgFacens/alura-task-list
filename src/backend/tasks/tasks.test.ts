import { TaskStatus } from "@prisma/client";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  listTasks,
  createTask,
  deleteTask,
  updateTaskStatus,
  InvalidStatusError,
  InvalidTitleError,
  TaskNotFoundError,
} from "@backend/tasks/use-cases";
import { MAX_TITLE_LENGTH } from "@backend/tasks/schema";
import * as tasksData from "@backend/data/tasks";

vi.mock("@backend/data/tasks", () => ({
  findTasksByUser: vi.fn(),
  createTask: vi.fn(),
  deleteTaskByIdAndUser: vi.fn(),
  updateTaskStatusByIdAndUser: vi.fn(),
}));

const now = new Date();
const rawTask = {
  id: "task-1",
  title: "Comprar leite",
  status: TaskStatus.TODO,
  createdAt: now,
  updatedAt: now,
  userId: "user-1",
};
// DTO esperado no retorno dos use-cases: sem o campo interno userId.
const { userId: _userId, ...taskDto } = rawTask;

describe("listTasks", () => {
  beforeEach(() => {
    vi.mocked(tasksData.findTasksByUser).mockReset();
  });

  it("returns tasks mapped to DTOs when no status filter is given", async () => {
    vi.mocked(tasksData.findTasksByUser).mockResolvedValue([rawTask]);

    const result = await listTasks("user-1");

    expect(result).toEqual({ tasks: [taskDto], count: 1 });
    expect(tasksData.findTasksByUser).toHaveBeenCalledWith("user-1", undefined);
  });

  it("passes a valid status filter through to the data layer", async () => {
    vi.mocked(tasksData.findTasksByUser).mockResolvedValue([]);

    await listTasks("user-1", TaskStatus.DONE);

    expect(tasksData.findTasksByUser).toHaveBeenCalledWith(
      "user-1",
      TaskStatus.DONE,
    );
  });

  it("returns an empty list without error when the user has no tasks", async () => {
    vi.mocked(tasksData.findTasksByUser).mockResolvedValue([]);

    const result = await listTasks("user-1");

    expect(result).toEqual({ tasks: [], count: 0 });
  });

  it("throws InvalidStatusError for a status outside the enum", async () => {
    await expect(listTasks("user-1", "NOT_A_STATUS")).rejects.toThrow(
      InvalidStatusError,
    );
    expect(tasksData.findTasksByUser).not.toHaveBeenCalled();
  });
});

describe("createTask", () => {
  beforeEach(() => {
    vi.mocked(tasksData.createTask).mockReset();
  });

  it("creates a task and returns it as a DTO", async () => {
    vi.mocked(tasksData.createTask).mockResolvedValue(rawTask);

    const result = await createTask("user-1", "Comprar leite");

    expect(result).toEqual(taskDto);
    expect(tasksData.createTask).toHaveBeenCalledWith("user-1", "Comprar leite");
  });

  it("trims whitespace from the title before creating", async () => {
    vi.mocked(tasksData.createTask).mockResolvedValue(rawTask);

    await createTask("user-1", "  Comprar leite  ");

    expect(tasksData.createTask).toHaveBeenCalledWith("user-1", "Comprar leite");
  });

  it("throws InvalidTitleError for an empty title", async () => {
    await expect(createTask("user-1", "")).rejects.toThrow(InvalidTitleError);
    expect(tasksData.createTask).not.toHaveBeenCalled();
  });

  it("throws InvalidTitleError for a title that is only whitespace", async () => {
    await expect(createTask("user-1", "   ")).rejects.toThrow(
      InvalidTitleError,
    );
    expect(tasksData.createTask).not.toHaveBeenCalled();
  });

  it("throws InvalidTitleError for a title longer than the max length", async () => {
    const tooLong = "a".repeat(MAX_TITLE_LENGTH + 1);

    await expect(createTask("user-1", tooLong)).rejects.toThrow(
      InvalidTitleError,
    );
    expect(tasksData.createTask).not.toHaveBeenCalled();
  });

  it("accepts a title exactly at the max length", async () => {
    const exact = "a".repeat(MAX_TITLE_LENGTH);
    vi.mocked(tasksData.createTask).mockResolvedValue({
      ...rawTask,
      title: exact,
    });

    await createTask("user-1", exact);

    expect(tasksData.createTask).toHaveBeenCalledWith("user-1", exact);
  });

  it.each([
    ["a number", 123],
    ["null", null],
    ["undefined", undefined],
    ["an object", {}],
    ["an array", ["a"]],
    ["a boolean", true],
  ])(
    "throws InvalidTitleError (not TypeError) when the title is %s",
    async (_label, title) => {
      await expect(createTask("user-1", title)).rejects.toThrow(
        InvalidTitleError,
      );
      expect(tasksData.createTask).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["empty", ""],
    ["whitespace-only", "   "],
    ["a number", 123],
    ["null", null],
    ["undefined", undefined],
  ])("uses the 'required' message when the title is %s", async (_label, title) => {
    await expect(createTask("user-1", title)).rejects.toThrow(
      "Título é obrigatório",
    );
  });

  it("uses the 'too long' message for a title over the max length", async () => {
    const tooLong = "a".repeat(MAX_TITLE_LENGTH + 1);

    await expect(createTask("user-1", tooLong)).rejects.toThrow(
      "Título muito longo",
    );
  });

  it("accepts a title with emoji and line breaks", async () => {
    const title = "Comprar 🥛\nleite";
    vi.mocked(tasksData.createTask).mockResolvedValue({ ...rawTask, title });

    await createTask("user-1", title);

    expect(tasksData.createTask).toHaveBeenCalledWith("user-1", title);
  });

  it("passes only userId and title to the data layer (never a status)", async () => {
    vi.mocked(tasksData.createTask).mockResolvedValue(rawTask);

    await createTask("user-1", "Comprar leite");

    expect(vi.mocked(tasksData.createTask).mock.calls[0]).toEqual([
      "user-1",
      "Comprar leite",
    ]);
  });
});

describe("deleteTask", () => {
  beforeEach(() => {
    vi.mocked(tasksData.deleteTaskByIdAndUser).mockReset();
  });

  it("resolves without error when the task belongs to the user", async () => {
    vi.mocked(tasksData.deleteTaskByIdAndUser).mockResolvedValue(true);

    await expect(deleteTask("user-1", "task-1")).resolves.toBeUndefined();
    expect(tasksData.deleteTaskByIdAndUser).toHaveBeenCalledWith(
      "user-1",
      "task-1",
    );
  });

  it("throws TaskNotFoundError when the task does not exist or belongs to another user", async () => {
    vi.mocked(tasksData.deleteTaskByIdAndUser).mockResolvedValue(false);

    await expect(deleteTask("user-1", "task-1")).rejects.toThrow(
      TaskNotFoundError,
    );
  });
});

describe("updateTaskStatus", () => {
  beforeEach(() => {
    vi.mocked(tasksData.updateTaskStatusByIdAndUser).mockReset();
  });

  it("updates the status and returns the task as a DTO", async () => {
    const updated = { ...rawTask, status: TaskStatus.IN_PROGRESS };
    vi.mocked(tasksData.updateTaskStatusByIdAndUser).mockResolvedValue(updated);

    const result = await updateTaskStatus(
      "user-1",
      "task-1",
      TaskStatus.IN_PROGRESS,
    );

    expect(result).toEqual({ ...taskDto, status: TaskStatus.IN_PROGRESS });
    expect(tasksData.updateTaskStatusByIdAndUser).toHaveBeenCalledWith(
      "user-1",
      "task-1",
      TaskStatus.IN_PROGRESS,
    );
  });

  it("throws InvalidStatusError for a status outside the enum", async () => {
    await expect(
      updateTaskStatus("user-1", "task-1", "NOT_A_STATUS"),
    ).rejects.toThrow(InvalidStatusError);
    expect(tasksData.updateTaskStatusByIdAndUser).not.toHaveBeenCalled();
  });

  it("throws InvalidStatusError for an empty status", async () => {
    await expect(updateTaskStatus("user-1", "task-1", "")).rejects.toThrow(
      InvalidStatusError,
    );
    expect(tasksData.updateTaskStatusByIdAndUser).not.toHaveBeenCalled();
  });

  it("throws TaskNotFoundError when the task does not exist or belongs to another user", async () => {
    vi.mocked(tasksData.updateTaskStatusByIdAndUser).mockResolvedValue(null);

    await expect(
      updateTaskStatus("user-1", "task-1", TaskStatus.DONE),
    ).rejects.toThrow(TaskNotFoundError);
  });
});
