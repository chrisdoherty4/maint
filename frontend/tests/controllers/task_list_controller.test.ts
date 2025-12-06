import { afterEach, describe, expect, it } from "vitest";

import { TaskListController } from "../../src/task/list/controller.js";
import type { MaintTask } from "../../src/task/index.js";
import { setSystemDate } from "../helpers/time.js";

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
});
