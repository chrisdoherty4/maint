import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeleteTaskController } from "../../src/task/delete/controller.js";
import type { HassConnection } from "../../src/task/index.js";

const { mockDeleteTask } = vi.hoisted(() => ({
  mockDeleteTask: vi.fn()
}));

vi.mock("../../src/task/index.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/task/index.js")>("../../src/task/index.js");
  return {
    ...actual,
    deleteTask: mockDeleteTask
  };
});

const hass: HassConnection = {
  callWS: vi.fn()
};

beforeEach(() => {
  mockDeleteTask.mockReset();
});

describe("DeleteTaskController", () => {
  it("prompts and cancels task ids", () => {
    const controller = new DeleteTaskController();
    expect(controller.state.taskId).toBeNull();
    controller.prompt("abc");
    expect(controller.state.taskId).toBe("abc");
    controller.cancel();
    expect(controller.state.taskId).toBeNull();
  });

  it("clears state on successful confirm", async () => {
    mockDeleteTask.mockResolvedValue(undefined);
    const controller = new DeleteTaskController();
    controller.prompt("abc");
    const result = await controller.confirm(hass, "entry", "abc");
    expect(result.ok).toBe(true);
    expect(controller.state.taskId).toBeNull();
  });

  it("returns error on failure without clearing selection", async () => {
    mockDeleteTask.mockRejectedValue(new Error("boom"));
    const controller = new DeleteTaskController();
    controller.prompt("abc");
    const result = await controller.confirm(hass, "entry", "abc");
    expect(result.ok).toBe(false);
    expect(controller.state.taskId).toBe("abc");
  });
});
