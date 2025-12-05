import { html, type TemplateResult } from "lit";

import type { HassConnection, MaintTask } from "../index.js";
import { updateTask } from "../index.js";
import "./view.js";

type PanelTextFunc = (key: string, ...args: Array<string | number>) => string;
type LocalizeFunc = (key: string, ...args: Array<string | number>) => string;

interface RenderContext {
  tasks: MaintTask[];
  hass?: HassConnection;
  entryId: string | null;
  busy: boolean;
  editing: boolean;
  panelText: PanelTextFunc;
  localizeText: LocalizeFunc;
}

export class TaskListFeature extends EventTarget {
  private tasks: MaintTask[] = [];
  private hass?: HassConnection;
  private entryId: string | null = null;
  private busy = false;
  private editing = false;
  private panelText: PanelTextFunc | null = null;
  private localizeText: LocalizeFunc | null = null;

  public render(ctx: RenderContext): TemplateResult | null {
    this.tasks = ctx.tasks;
    this.hass = ctx.hass;
    this.entryId = ctx.entryId;
    this.busy = ctx.busy;
    this.editing = ctx.editing;
    this.panelText = ctx.panelText;
    this.localizeText = ctx.localizeText;

    return html`
      <maint-task-list
        .tasks=${ctx.tasks}
        .hass=${ctx.hass}
        .busy=${ctx.busy}
        .editing=${ctx.editing}
        .panelText=${ctx.panelText}
        .localizeText=${ctx.localizeText}
        @complete-task=${this.handleComplete}
        @edit-task=${this.handleEdit}
        @delete-task=${this.handleDelete}
      ></maint-task-list>
    `;
  }

  private handleEdit = (event: CustomEvent<{ taskId: string }>): void => {
    const taskId = event.detail?.taskId;
    if (!taskId) {
      return;
    }
    this.dispatchEvent(new CustomEvent("task-edit", { detail: { taskId } }));
  };

  private handleDelete = (event: CustomEvent<{ taskId: string }>): void => {
    const taskId = event.detail?.taskId;
    if (!taskId) {
      return;
    }
    this.dispatchEvent(new CustomEvent("task-delete", { detail: { taskId } }));
  };

  private handleComplete = (event: CustomEvent<{ taskId: string }>): void => {
    const taskId = event.detail?.taskId;
    if (!taskId || !this.entryId || !this.hass) {
      return;
    }

    const task = this.tasks.find((item) => item.task_id === taskId);
    if (!task) {
      return;
    }

    const today = new Date();
    const lastCompleted = `${today.getFullYear().toString().padStart(4, "0")}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    this.dispatchEvent(new CustomEvent("task-list-busy-start"));
    (async () => {
      try {
        const updated = await updateTask(this.hass!, this.entryId!, taskId, {
          description: task.description,
          last_completed: lastCompleted,
          recurrence: task.recurrence
        });
        this.dispatchEvent(new CustomEvent("task-completed", { detail: { taskId, task: updated } }));
      } catch (error) {
        console.error("Failed to mark maint task complete", error);
        this.dispatchEvent(new CustomEvent("task-error", { detail: "errors.mark_complete" }));
      } finally {
        this.dispatchEvent(new CustomEvent("task-list-busy-end"));
      }
    })();
  };
}
