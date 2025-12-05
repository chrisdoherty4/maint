import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { HassConnection, MaintTask } from "../index.js";
import { formatDate, formatRecurrence, nextScheduled, parseIsoDate } from "../../formatting.js";

@customElement("maint-task-row")
export class MaintTaskRow extends LitElement {
  @property({ attribute: false }) public task?: MaintTask;
  @property({ attribute: false }) public hass?: HassConnection;
  @property({ type: Boolean }) public busy = false;
  @property({ type: Boolean }) public editing = false;
  @property({ type: Boolean }) public due = false;
  @property({ attribute: false }) public panelText?: (key: string, ...args: Array<string | number>) => string;
  @property({ attribute: false }) public localizeText?: (key: string, ...args: Array<string | number>) => string;

  protected createRenderRoot() {
    // Render in light DOM so existing styles apply.
    return this;
  }

  protected render() {
    if (!this.task || !this.panelText || !this.localizeText) {
      return nothing;
    }

    const task = this.task;
    const editLabel = this.panelText("buttons.edit");
    const completeLabel = this.panelText("buttons.mark_complete");
    const deleteLabel = this.panelText("buttons.delete");
    const actionsDisabled = this.busy || this.editing;
    const rowClass = this.due ? "task-row due" : "task-row";

    return html`
      <div class=${rowClass} data-task-row=${task.task_id} role="listitem">
        <div class="task-details">
          <div class="task-description-line">
            <div class="task-description">${task.description}</div>
            ${this.due ? html`<span class="pill pill-due">${this.panelText("labels.due")}</span>` : nothing}
          </div>
          <div class="task-meta">
            <div class="task-meta-column">
              <div class="task-meta-title">${this.panelText("labels.next_scheduled")}</div>
              <div class="task-meta-value">${formatDate(nextScheduled(task), this.hass)}</div>
            </div>
            <div class="task-meta-column">
              <div class="task-meta-title">${this.panelText("labels.schedule")}</div>
              <div class="task-meta-value">
                ${formatRecurrence(task.recurrence, this.localizeText.bind(this))}
              </div>
            </div>
          </div>
        </div>
        <div class="task-actions">
          <div class="action-buttons">
            <button
              type="button"
              class="icon-button complete-button tooltipped"
              data-task=${task.task_id}
              ?disabled=${actionsDisabled}
              aria-label=${completeLabel}
              title=${completeLabel}
              data-label=${completeLabel}
              @click=${this.handleComplete}
            >
              <ha-icon icon="mdi:check" aria-hidden="true"></ha-icon>
            </button>
            <button
              type="button"
              class="icon-button edit-task tooltipped"
              data-task=${task.task_id}
              ?disabled=${actionsDisabled}
              aria-label=${editLabel}
              title=${editLabel}
              data-label=${editLabel}
              @click=${this.handleEdit}
            >
              <ha-icon icon="mdi:pencil" aria-hidden="true"></ha-icon>
            </button>
            <button
              type="button"
              class="icon-button delete-task tooltipped"
              data-task=${task.task_id}
              aria-label=${deleteLabel}
              title=${deleteLabel}
              data-label=${deleteLabel}
              ?disabled=${actionsDisabled}
              @click=${this.handleDelete}
            >
              <ha-icon icon="mdi:delete-outline" aria-hidden="true"></ha-icon>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private handleComplete(): void {
    if (!this.task) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("complete-task", {
        detail: { taskId: this.task.task_id },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleEdit(): void {
    if (!this.task) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("edit-task", {
        detail: { taskId: this.task.task_id },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleDelete(): void {
    if (!this.task) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("delete-task", {
        detail: { taskId: this.task.task_id },
        bubbles: true,
        composed: true
      })
    );
  }
}

@customElement("maint-task-list")
export class MaintTaskList extends LitElement {
  @property({ attribute: false }) public hass?: HassConnection;
  @property({ attribute: false }) public tasks: MaintTask[] = [];
  @property({ type: Boolean }) public busy = false;
  @property({ type: Boolean }) public editing = false;
  @property({ attribute: false }) public panelText?: (key: string, ...args: Array<string | number>) => string;
  @property({ attribute: false }) public localizeText?: (key: string, ...args: Array<string | number>) => string;

  protected createRenderRoot() {
    return this;
  }

  protected render() {
    if (!this.panelText || !this.localizeText) {
      return nothing;
    }

    const hasTasks = this.tasks.length > 0;

    return html`
      <section class="tasks-section">
        <h2>${this.panelText("section_tasks")}</h2>
        ${!hasTasks
        ? html`<p class="info">${this.panelText("info_no_tasks")}</p>`
        : html`
              <div class="task-list" role="list">
                ${this.tasks.map(
        (task) => html`
                    <maint-task-row
                      .task=${task}
                      .hass=${this.hass}
                      .busy=${this.busy}
                      .editing=${this.editing}
                      .due=${this.isTaskDue(task)}
                      .panelText=${this.panelText}
                      .localizeText=${this.localizeText}
                      @complete-task=${(event: CustomEvent<{ taskId: string }>) =>
        this.forward("complete-task", event.detail)}
                      @edit-task=${(event: CustomEvent<{ taskId: string }>) =>
        this.forward("edit-task", event.detail)}
                      @delete-task=${(event: CustomEvent<{ taskId: string }>) =>
        this.forward("delete-task", event.detail)}
                    ></maint-task-row>
                  `
      )}
              </div>
            `}
      </section>
    `;
  }

  private forward(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private isTaskDue(task: MaintTask): boolean {
    const next = nextScheduled(task);
    if (!next) {
      return false;
    }

    const nextDate = parseIsoDate(next);
    if (!nextDate) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return nextDate <= today;
  }
}
