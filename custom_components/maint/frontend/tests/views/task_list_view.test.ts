import { afterEach, describe, expect, it } from "vitest";

import "../../src/task/list/view.js";
import type { MaintTask } from "../../src/task/index.js";
import { fixture, html } from "../helpers/dom.js";
import { setSystemDate } from "../helpers/time.js";

const panelText = (key: string) => key;
const localizeText = (key: string) => key;

const task = (overrides: Partial<MaintTask>): MaintTask => ({
  task_id: "task",
  description: "Task",
  last_completed: null,
  recurrence: { type: "interval", every: 1, unit: "days" },
  next_scheduled: "2024-05-15",
  ...overrides
});

let restoreTime: (() => void) | null = null;

afterEach(() => {
  restoreTime?.();
  restoreTime = null;
});

describe("maint-task-list", () => {
  it("shows empty state when no tasks", async () => {
    const el = await fixture<HTMLElement>(html`
      <maint-task-list
        .tasks=${[]}
        .panelText=${panelText}
        .localizeText=${localizeText}
      ></maint-task-list>
    `);
    expect(el.textContent).toContain("info_no_tasks");
  });

  it("renders tasks, marks due items, and bubbles events", async () => {
    restoreTime = setSystemDate("2024-05-10");
    const el = await fixture<HTMLElement>(html`
      <maint-task-list
        .tasks=${[
          task({ task_id: "due", description: "Due", next_scheduled: "2024-05-01" }),
          task({ task_id: "future", description: "Future", next_scheduled: "2024-05-20" })
        ]}
        .panelText=${panelText}
        .localizeText=${localizeText}
      ></maint-task-list>
    `);

    const duePill = el.querySelector(".pill-due");
    expect(duePill?.textContent).toContain("labels.due");

    const complete = new Promise<CustomEvent>((resolve) =>
      el.addEventListener("complete-task", (event) => resolve(event as CustomEvent))
    );
    const edit = new Promise<CustomEvent>((resolve) =>
      el.addEventListener("edit-task", (event) => resolve(event as CustomEvent))
    );
    const del = new Promise<CustomEvent>((resolve) =>
      el.addEventListener("delete-task", (event) => resolve(event as CustomEvent))
    );

    (el.querySelector('[data-task="due"].complete-button') as HTMLButtonElement).click();
    (el.querySelector('[data-task="future"].edit-task') as HTMLButtonElement).click();
    (el.querySelector('[data-task="future"].delete-task') as HTMLButtonElement).click();

    const completeEvent = await complete;
    const editEvent = await edit;
    const deleteEvent = await del;

    expect(completeEvent.detail).toEqual({ taskId: "due" });
    expect(editEvent.detail).toEqual({ taskId: "future" });
    expect(deleteEvent.detail).toEqual({ taskId: "future" });
  });
});
