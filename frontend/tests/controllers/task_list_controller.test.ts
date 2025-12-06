import { afterEach, describe, expect, it, vi } from "vitest";

import { TaskListController } from "../../src/task/list/controller.js";
import type { HassConnection, MaintTask, MaintEntry } from "../../src/task/index.js";
import { setSystemDate } from "../helpers/time.js";

const { mockListEntries, mockListTasks } = vi.hoisted(() => ({
  mockListEntries: vi.fn(),
  mockListTasks: vi.fn()
}));

vi.mock("../../src/task/index.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/task/index.js")>("../../src/task/index.js");
  return {
    ...actual,
    listEntries: mockListEntries,
    listTasks: mockListTasks
  };
});

const baseTask = (overrides: Partial<MaintTask>): MaintTask => ({
  task_id: "id",
  description: "Task",
  last_completed: null,
  recurrence: { type: "interval", every: 1, unit: "days" },
  ...overrides
});

let restoreTime: (() => void) | null = null;

afterEach(() => {
  restoreTime?.();
  restoreTime = null;
  mockListEntries.mockReset();
  mockListTasks.mockReset();
});

describe("TaskListController", () => {
  it("sorts due tasks before upcoming and keeps stable ordering", () => {
    restoreTime = setSystemDate("2024-05-10");
    const controller = new TaskListController();
    const tasks: MaintTask[] = [
      baseTask({ task_id: "b", description: "Later", next_scheduled: "2024-05-20" }),
      baseTask({ task_id: "a", description: "Overdue", next_scheduled: "2024-05-01" }),
      baseTask({ task_id: "c", description: "No schedule", next_scheduled: null })
    ];

    const sorted = controller.sortTasks(tasks);
    expect(sorted.map((t) => t.task_id)).toEqual(["a", "b", "c"]);
  });

  it("fetches entries, selects the first entry, and loads tasks", async () => {
    const hass = {} as HassConnection;
    const entries: MaintEntry[] = [
      { entry_id: "entry-1", title: "Entry 1" },
      { entry_id: "entry-2", title: "Entry 2" }
    ];
    mockListEntries.mockResolvedValue(entries);
    mockListTasks.mockResolvedValue([
      baseTask({ task_id: "b", description: "Beta", next_scheduled: "2024-04-02" }),
      baseTask({ task_id: "a", description: "Alpha", next_scheduled: "2024-04-01" })
    ]);

    const controller = new TaskListController();
    const state = await controller.fetchEntries(hass);

    expect(state.entries.map((entry) => entry.entry_id)).toEqual(["entry-1", "entry-2"]);
    expect(state.selectedEntryId).toBe("entry-1");
    expect(mockListTasks).toHaveBeenCalledWith(hass, "entry-1");
    expect(state.tasks.map((task) => task.description)).toEqual(["Alpha", "Beta"]);
    expect(state.error).toBeNull();
    expect(state.busy).toBe(false);
  });

  it("surfaces errors when task loading fails", async () => {
    const hass = {} as HassConnection;
    mockListEntries.mockResolvedValue([{ entry_id: "entry-1", title: "Entry" }]);
    mockListTasks.mockRejectedValue(new Error("boom"));

    const controller = new TaskListController();
    const state = await controller.fetchEntries(hass);

    expect(state.error).toBe("errors.load_tasks");
    expect(state.busy).toBe(false);
  });

  it("handles entry fetch failures gracefully", async () => {
    const hass = {} as HassConnection;
    mockListEntries.mockRejectedValue(new Error("fail"));

    const controller = new TaskListController();
    const state = await controller.fetchEntries(hass);

    expect(state.error).toBe("errors.load_entries");
    expect(state.entries).toEqual([]);
    expect(state.busy).toBe(false);
  });
});
