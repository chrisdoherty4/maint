import { beforeEach, describe, expect, it, vi } from "vitest";

import { UpdateTaskController } from "../../src/task/update/controller.js";
import type { HassConnection, MaintTask, Recurrence } from "../../src/task/index.js";

const { mockValidate, mockUpdateTask } = vi.hoisted(() => ({
  mockValidate: vi.fn(),
  mockUpdateTask: vi.fn()
}));

vi.mock("../../src/task/index.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/task/index.js")>("../../src/task/index.js");
  return {
    ...actual,
    validateTaskFields: mockValidate,
    updateTask: mockUpdateTask
  };
});

const hass: HassConnection = {
  callWS: vi.fn()
};

const weekly: Recurrence = { type: "weekly", every: 2, days: [0, 2, 4] };
const interval: Recurrence = { type: "interval", every: 1, unit: "weeks" };

const task = (overrides: Partial<MaintTask> = {}): MaintTask => ({
  task_id: "t1",
  description: "Task",
  last_completed: "2024-01-05",
  recurrence: weekly,
  labels: ["kitchen"],
  ...overrides
});

beforeEach(() => {
  mockValidate.mockReset();
  mockUpdateTask.mockReset();
});

describe("UpdateTaskController", () => {
  it("initializes form state from task", () => {
    const controller = new UpdateTaskController();
    const state = controller.start(task(), hass);

    expect(state.open).toBe(true);
    expect(state.form?.description).toBe("Task");
    expect(state.form?.recurrence_type).toBe("weekly");
    expect(state.form?.weekly_days).toEqual(["0", "2", "4"]);
    expect(state.form?.weekly_every).toBe("2");
    expect(state.form?.labels).toBe("kitchen");
  });

  it("defaults weekly day when switching recurrence type", () => {
    const controller = new UpdateTaskController();
    controller.start(task({ recurrence: interval }), hass);
    const next = controller.setRecurrenceType("weekly");
    expect(next.form?.weekly_days).toEqual(["0"]);
    expect(next.form?.weekly_every).toBe("1");
  });

  it("returns validation errors on submit", async () => {
    mockValidate.mockReturnValue({ error: "invalid" });
    const controller = new UpdateTaskController();
    controller.start(task(), hass);
    const result = await controller.submit(new FormData(), hass, "entry", "t1", (key) => key, "update failed");
    expect(result.error).toBe("invalid");
    expect(controller.state.error).toBe("invalid");
    expect(controller.state.busy).toBe(false);
  });

  it("submits updates and clears busy state", async () => {
    const payload = {
      description: "Task",
      last_completed: "2024-02-01",
      recurrence: interval,
      labels: ["kitchen"]
    };
    mockValidate.mockReturnValue({ values: payload });
    mockUpdateTask.mockResolvedValue({ task_id: "t1", ...payload });

    const controller = new UpdateTaskController();
    controller.start(task(), hass);
    const result = await controller.submit(new FormData(), hass, "entry", "t1", (key) => key, "update failed");

    expect(result.task?.last_completed).toBe("2024-02-01");
    expect(controller.state.busy).toBe(false);
    expect(controller.state.error).toBeNull();
  });

  it("updates fields and toggles date picker state", () => {
    const controller = new UpdateTaskController();
    controller.start(task(), hass);
    controller.state.error = "oops";

    const updated = controller.updateField("icon", "mdi:fan");
    expect(updated.form?.icon).toBe("mdi:fan");
    expect(updated.error).toBeNull();

    const withLabels = controller.updateField("labels", "kitchen,garage");
    expect(withLabels.form?.labels).toBe("kitchen,garage");

    const opened = controller.openDatePicker();
    expect(opened.datePickerOpen).toBe(true);
    const toggled = controller.toggleDatePicker();
    expect(toggled.datePickerOpen).toBe(false);

    const withDate = controller.setDate("2024-03-03");
    expect(withDate.form?.last_completed).toBe("2024-03-03");
    expect(withDate.datePickerOpen).toBe(false);
  });

  it("manages weekly day toggling and reset after delete", () => {
    const controller = new UpdateTaskController();
    controller.start(
      task({ recurrence: { type: "weekly", every: 1, days: [1, 3] }, task_id: "t1" }),
      hass
    );

    const added = controller.toggleWeeklyDay("5", true);
    expect(added.form?.weekly_days).toEqual(["1", "3", "5"]);

    const removed = controller.toggleWeeklyDay("3", false);
    expect(removed.form?.weekly_days).toEqual(["1", "5"]);

    const same = controller.resetAfterDelete("other");
    expect(same.open).toBe(true);

    const cleared = controller.resetAfterDelete("t1");
    expect(cleared.open).toBe(false);
    expect(cleared.form).toBeNull();
  });
});
