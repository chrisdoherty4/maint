import { describe, expect, it, vi } from "vitest";

import type { HassConnection, MaintTask } from "../../src/task/index.js";
import { TaskListFeature } from "../../src/task/list/feature.js";

vi.mock("../../src/task/index.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/task/index.js")>("../../src/task/index.js");
  return {
    ...actual,
    updateTask: vi.fn(async (_hass: HassConnection, _entryId: string, taskId: string, payload) => ({
      task_id: taskId,
      description: payload.description,
      recurrence: payload.recurrence,
      last_completed: payload.last_completed,
      next_scheduled: "2024-05-12"
    }))
  };
});

describe("TaskListFeature", () => {
  it("completes a task and emits updates with busy events", async () => {
    const feature = new TaskListFeature();
    const hass = { callWS: vi.fn() } as HassConnection;
    const task: MaintTask = {
      task_id: "1",
      description: "Test",
      last_completed: null,
      recurrence: { type: "interval", every: 1, unit: "days" }
    };

    const events: string[] = [];
    feature.addEventListener("task-list-busy-start", () => events.push("busy-start"));
    feature.addEventListener("task-completed", (event) => {
      const detail = (event as CustomEvent<{ taskId: string }>).detail;
      events.push(`completed:${detail?.taskId}`);
    });
    feature.addEventListener("task-list-busy-end", () => events.push("busy-end"));

    feature.render({
      tasks: [task],
      hass,
      entryId: "entry",
      busy: false,
      editing: false,
      panelText: (key) => key,
      localizeText: (key) => key
    });

    await feature["handleComplete"](
      new CustomEvent("complete-task", { detail: { taskId: "1" } })
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(events).toEqual(["busy-start", "completed:1", "busy-end"]);
  });
});
