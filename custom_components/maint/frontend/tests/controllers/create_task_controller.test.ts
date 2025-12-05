import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateTaskController } from "../../src/task/create/controller.js";
import type { HassConnection, Recurrence } from "../../src/task/index.js";

const { mockValidate, mockCreateTask } = vi.hoisted(() => ({
  mockValidate: vi.fn(),
  mockCreateTask: vi.fn()
}));

vi.mock("../../src/task/index.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/task/index.js")>("../../src/task/index.js");
  return {
    ...actual,
    validateTaskFields: mockValidate,
    createTask: mockCreateTask
  };
});

const hass: HassConnection = {
  callWS: vi.fn()
};

const interval: Recurrence = { type: "interval", every: 1, unit: "days" };

beforeEach(() => {
  mockValidate.mockReset();
  mockCreateTask.mockReset();
});

describe("CreateTaskController", () => {
  it("opens with defaults and resets error", () => {
    const controller = new CreateTaskController();
    controller.state.error = "err";
    const next = controller.open("2024-01-02");
    expect(next.open).toBe(true);
    expect(next.error).toBeNull();
    expect(next.lastCompleted).toBe("2024-01-02");
    expect(next.recurrenceType).toBe("interval");
  });

  it("returns validation errors from submit", async () => {
    mockValidate.mockReturnValue({ error: "bad" });
    const controller = new CreateTaskController();
    const result = await controller.submit(new FormData(), hass, "entry", (key) => key, "create failed");
    expect(result.error).toBe("bad");
    expect(controller.state.error).toBe("bad");
    expect(controller.state.busy).toBe(false);
  });

  it("submits and returns created task", async () => {
    const payload = { description: "A", last_completed: "2024-01-01", recurrence: interval };
    mockValidate.mockReturnValue({ values: payload });
    mockCreateTask.mockResolvedValue({ task_id: "1", ...payload });

    const controller = new CreateTaskController();
    const result = await controller.submit(new FormData(), hass, "entry", (key) => key, "create failed");

    expect(result.task?.task_id).toBe("1");
    expect(controller.state.busy).toBe(false);
    expect(controller.state.error).toBeNull();
  });
});
