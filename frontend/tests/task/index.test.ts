import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_ICON,
  createTask,
  listTasks,
  updateTask,
  validateTaskFields,
  type HassConnection,
  type MaintTask,
  type Recurrence
} from "../../src/task/index.js";

const localize = (key: string) => key;

const interval: Recurrence = { type: "interval", every: 3, unit: "weeks" };

describe("validateTaskFields", () => {
  it("returns normalized interval values with default icon", () => {
    const result = validateTaskFields(
      {
        description: "Change filters",
        last_completed: "2024-06-01",
        recurrence_type: "interval",
        interval_every: "3",
        interval_unit: "weeks"
      },
      localize
    );

    expect(result.values?.recurrence).toEqual(interval);
    expect(result.values?.icon).toBe(DEFAULT_ICON);
    expect(result.values?.labels).toEqual([]);
  });

  it("normalizes weekly recurrence and trims icon", () => {
    const result = validateTaskFields(
      {
        description: "Clean gutters",
        last_completed: "2024-05-10",
        recurrence_type: "weekly",
        weekly_every: "2",
        weekly_days: ["5", "1", "1"],
        icon: "  mdi:water  "
      },
      localize
    );

    expect(result.values?.recurrence).toEqual({ type: "weekly", every: 2, days: [1, 5] });
    expect(result.values?.icon).toBe("mdi:water");
    expect(result.values?.labels).toEqual([]);
  });

  it("parses comma-separated labels", () => {
    const result = validateTaskFields(
      {
        description: "Label test",
        last_completed: "2024-04-01",
        recurrence_type: "interval",
        interval_every: "1",
        interval_unit: "months",
        labels: "kitchen, hvac, kitchen"
      },
      localize
    );

    expect(result.values?.labels).toEqual(["kitchen", "hvac"]);
  });

  it("treats all-week selections as daily interval", () => {
    const result = validateTaskFields(
      {
        description: "Daily check",
        last_completed: "2024-05-10",
        recurrence_type: "weekly",
        weekly_every: "1",
        weekly_days: ["0", "1", "2", "3", "4", "5", "6"],
        icon: "   "
      },
      localize
    );

    expect(result.values?.recurrence).toEqual({ type: "interval", every: 1, unit: "days" });
    expect(result.values?.icon).toBeNull();
  });

  it("requires weekly day selections", () => {
    const result = validateTaskFields(
      {
        description: "Missing days",
        last_completed: "2024-05-10",
        recurrence_type: "weekly",
        weekly_every: "2"
      },
      localize
    );

    expect(result.error).toBe("component.maint.panel.validation.weekly_days_required");
  });
});

describe("task api helpers", () => {
  it("lists tasks and normalizes weekly recurrence", async () => {
    const hass: HassConnection = {
      callWS: vi.fn().mockResolvedValue([
        {
          task_id: "t1",
          description: "Task",
          last_completed: "2024-01-01",
          recurrence: { type: "weekly", every: undefined, days: [3, 1, 3] } as unknown as Recurrence,
          next_scheduled: "2024-02-01",
          icon: "mdi:leaf"
        } satisfies MaintTask
      ])
    };

    const tasks = await listTasks(hass, "entry-1");

    expect(hass.callWS).toHaveBeenCalledWith({
      type: "maint/task/list",
      entry_id: "entry-1"
    });
    expect(tasks[0].recurrence).toEqual({ type: "weekly", every: 1, days: [1, 3] });
    expect(tasks[0].icon).toBe("mdi:leaf");
  });

  it("creates tasks and passes optional icons", async () => {
    const hass: HassConnection = {
      callWS: vi.fn().mockResolvedValue({
        task_id: "t1",
        description: "Task",
        last_completed: "2024-01-01",
        recurrence: interval,
        icon: null
      })
    };

    const payload = {
      description: "Task",
      last_completed: "2024-01-01",
      recurrence: interval,
      icon: null,
      labels: ["kitchen"]
    };

    const task = await createTask(hass, "entry-1", payload);

    expect(hass.callWS).toHaveBeenCalledWith({
      type: "maint/task/create",
      entry_id: "entry-1",
      description: "Task",
      last_completed: "2024-01-01",
      recurrence: interval,
      icon: null,
      labels: ["kitchen"]
    });
    expect(task.icon).toBeNull();
  });

  it("updates tasks without sending undefined icons", async () => {
    const hass: HassConnection = {
      callWS: vi.fn().mockResolvedValue({
        task_id: "t1",
        description: "Updated",
        last_completed: "2024-02-01",
        recurrence: interval
      })
    };

    const payload = {
      description: "Updated",
      last_completed: "2024-02-01",
      recurrence: interval,
      labels: []
    };

    await updateTask(hass, "entry-1", "t1", payload);

    expect(hass.callWS).toHaveBeenCalledWith({
      type: "maint/task/update",
      entry_id: "entry-1",
      task_id: "t1",
      description: "Updated",
      last_completed: "2024-02-01",
      recurrence: interval,
      labels: []
    });
  });
});
