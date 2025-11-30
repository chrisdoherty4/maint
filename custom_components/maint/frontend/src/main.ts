import { html, LitElement, nothing, type PropertyValueMap } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import {
  type HassConnection,
  type MaintEntry,
  type MaintTask,
  type Recurrence,
  type RecurrenceType
} from "./api.js";
import {
  createMaintTask,
  deleteMaintTask,
  loadEntries,
  loadTasks,
  updateMaintTask
} from "./data-service.js";
import { validateTaskFields } from "./forms.js";
import {
  formatDate,
  formatDateInput,
  formatRecurrence,
  nextScheduled,
  parseIsoDate
} from "./formatting.js";
import {
  renderEditRecurrenceFields,
  renderRecurrenceFields,
  type RecurrenceFormState
} from "./recurrence-fields.js";
import { styles } from "./styles.js";

type EditFormState = {
  description: string;
  last_completed: string;
} & RecurrenceFormState;

@customElement("maint-panel")
export class MaintPanel extends LitElement {
  @property({ attribute: false }) public hass?: HassConnection;

  @state() private entries: MaintEntry[] = [];
  @state() private tasks: MaintTask[] = [];
  @state() private selectedEntryId: string | null = null;
  @state() private busy = false;
  @state() private error: string | null = null;
  @state() private editingTaskId: string | null = null;
  @state() private confirmTaskId: string | null = null;
  @state() private formExpanded = true;
  @state() private createRecurrenceType: RecurrenceType = "interval";
  @state() private editForm: EditFormState | null = null;
  @state() private editError: string | null = null;

  private initialized = false;

  protected updated(changedProps: PropertyValueMap<this>): void {
    if (changedProps.has("hass") && this.hass && !this.initialized) {
      this.initialized = true;
      void this.loadEntries();
    }
  }

  protected render() {
    const hasEntries = this.entries.length > 0;
    const formDisabled = !this.selectedEntryId;

    return html`
      <div class="container">
        <h1>Maintenance</h1>
        <p class="subtext">Manage recurring tasks and keep your home on track.</p>
        ${hasEntries
        ? nothing
        : html`<p class="info">Add a Maint integration entry to start tracking tasks.</p>`}
        ${this.renderCreateForm(formDisabled, hasEntries)}
        ${this.renderTasksSection(formDisabled)}
        ${this.renderDeleteModal()}
        ${this.renderEditModal()}
      </div>
    `;
  }

  private renderCreateForm(formDisabled: boolean, hasEntries: boolean) {
    const toggleIcon = this.formExpanded ? "mdi:chevron-down" : "mdi:chevron-right";
    const toggleLabel = this.formExpanded ? "Collapse form" : "Expand form";

    return html`
      <section>
        <div
          class="form-header"
          tabindex="0"
          role="button"
          aria-expanded=${this.formExpanded}
          @click=${this.toggleForm}
          @keydown=${this.handleFormHeaderKeydown}
        >
          <div class="form-header-text">
            <h2>Create task</h2>
          </div>
          <button
            type="button"
            id="form-toggle"
            class="icon-button form-toggle"
            aria-label=${toggleLabel}
            title=${toggleLabel}
          >
            <ha-icon icon=${toggleIcon} aria-hidden="true"></ha-icon>
          </button>
        </div>
        ${this.error ? html`<div class="error">${this.error}</div>` : nothing}
        ${hasEntries
        ? nothing
        : html`<p class="info">Add a Maint integration entry to enable task tracking.</p>`}
        ${this.formExpanded
        ? html`
              <form id="task-form" @submit=${this.handleCreateTask}>
                <div class="form-fields">
                  <label>
                    <span class="label-text">Description</span>
                    <input
                      type="text"
                      name="description"
                      required
                      placeholder="Smoke detector battery"
                      ?disabled=${formDisabled}
                    />
                  </label>
                  <div class="inline-fields">
                    <label>
                      <span class="label-text">Schedule type</span>
                      <select
                        name="recurrence_type"
                        @change=${this.handleRecurrenceTypeChange}
                        ?disabled=${formDisabled}
                      >
                        ${this.recurrenceTypeOptions(this.createRecurrenceType)}
                      </select>
                    </label>
                    <label>
                      <span class="label-text">Starting from</span>
                      <input
                        type="date"
                        name="last_completed"
                        @focus=${this.openDatePicker}
                        @pointerdown=${this.openDatePicker}
                        ?disabled=${formDisabled}
                      />
                    </label>
                  </div>
                  <div class="recurrence-fields">
                    ${this.renderRecurrenceFields(this.createRecurrenceType)}
                  </div>
                </div>
                <div class="form-actions">
                  <button type="submit" ?disabled=${this.busy || formDisabled}>
                    ${this.busy ? "Saving…" : "Create task"}
                  </button>
                </div>
              </form>
            `
        : nothing}
      </section>
    `;
  }

  private renderTasksSection(formDisabled: boolean) {
    const hasTasks = this.tasks.length > 0;

    return html`
      <section class="tasks-section">
        <h2>Tasks</h2>
        ${formDisabled
        ? html`<p class="info">Add the Maint integration to start tracking tasks.</p>`
        : !hasTasks
          ? html`<p class="info">No tasks yet. Use the form above to create one.</p>`
          : html`
                <div class="task-list" role="list">
                  ${this.tasks.map((task) => this.renderTaskRow(task))}
                </div>
              `}
      </section>
    `;
  }

  private renderTaskRow(task: MaintTask) {
    const editLabel = "Edit";
    const editIcon = "mdi:pencil";
    const completeLabel = "Mark complete";
    const actionsDisabled = this.busy || Boolean(this.editingTaskId);
    const isDue = this.isTaskDue(task);
    const rowClass = isDue ? "task-row due" : "task-row";

    return html`
      <div class=${rowClass} data-task-row=${task.task_id} role="listitem">
        <div class="task-details">
          <div class="task-description-line">
            <div class="task-description">${task.description}</div>
            ${isDue ? html`<span class="pill pill-due">Due</span>` : nothing}
          </div>
          <div class="task-meta">
            <div class="task-meta-column">
              <div class="task-meta-title">Next scheduled</div>
              <div class="task-meta-value">${formatDate(nextScheduled(task))}</div>
            </div>
            <div class="task-meta-column">
              <div class="task-meta-title">Schedule</div>
              <div class="task-meta-value">${formatRecurrence(task.recurrence)}</div>
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
              @click=${this.markTaskComplete}
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
              @click=${this.handleEditTask}
            >
              <ha-icon icon=${editIcon} aria-hidden="true"></ha-icon>
            </button>
            <button
              type="button"
              class="icon-button delete-task tooltipped"
              data-task=${task.task_id}
              aria-label="Delete"
              title="Delete"
              data-label="Delete"
              ?disabled=${actionsDisabled}
              @click=${this.promptDelete}
            >
              <ha-icon icon="mdi:delete-outline" aria-hidden="true"></ha-icon>
            </button>
          </div>
        </div>
      </div>
    `;
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

  private sortTasks(tasks: MaintTask[]): MaintTask[] {
    const nextTimestamp = (task: MaintTask): number | null => {
      const next = nextScheduled(task);
      if (!next) {
        return null;
      }

      const parsed = parseIsoDate(next);
      return parsed ? parsed.getTime() : null;
    };

    return [...tasks].sort((a, b) => {
      const aDue = this.isTaskDue(a);
      const bDue = this.isTaskDue(b);
      if (aDue !== bDue) {
        return aDue ? -1 : 1;
      }

      const aNext = nextTimestamp(a);
      const bNext = nextTimestamp(b);
      if (aNext !== null && bNext !== null && aNext !== bNext) {
        return aNext - bNext;
      }

      if (aNext === null && bNext !== null) {
        return 1;
      }

      if (aNext !== null && bNext === null) {
        return -1;
      }

      return a.description.toLowerCase().localeCompare(b.description.toLowerCase());
    });
  }

  private renderDeleteModal() {
    if (!this.confirmTaskId) {
      return nothing;
    }

    const task = this.tasks.find((item) => item.task_id === this.confirmTaskId);
    if (!task) {
      return nothing;
    }

    return html`
      <div class="modal-backdrop">
        <div class="modal">
          <h3>Delete task?</h3>
          <p>Are you sure you want to delete "${task.description}"?</p>
          <div class="modal-actions">
            <button
              type="button"
              class="button-secondary"
              id="cancel-delete"
              ?disabled=${this.busy}
              @click=${this.cancelDelete}
            >
              Cancel
            </button>
            <button
              type="button"
              class="button-danger"
              id="confirm-delete"
              ?disabled=${this.busy}
              @click=${this.handleDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderEditModal() {
    if (!this.editingTaskId || !this.editForm) {
      return nothing;
    }

    return html`
      <div class="modal-backdrop">
        <div class="modal edit-modal">
          <h3>Edit task</h3>
          <p>Update the task details below.</p>
          ${this.editError ? html`<div class="error">${this.editError}</div>` : nothing}
          <form id="edit-task-form" @submit=${this.handleEditSubmit}>
            <label>
              <span class="label-text">Description</span>
              <input
                type="text"
                name="description"
                required
                .value=${this.editForm.description}
                ?disabled=${this.busy}
                @input=${this.handleEditFieldInput}
              />
            </label>
            <div class="inline-fields">
              <label>
                <span class="label-text">Schedule type</span>
                <select
                  name="recurrence_type"
                  .value=${this.editForm.recurrence_type}
                  ?disabled=${this.busy}
                  @change=${this.handleEditRecurrenceTypeChange}
                >
                  ${this.recurrenceTypeOptions(this.editForm.recurrence_type)}
                </select>
              </label>
              <label>
                <span class="label-text">Last completed</span>
                <input
                  type="date"
                  name="last_completed"
                  required
                  .value=${this.editForm.last_completed}
                  ?disabled=${this.busy}
                  @focus=${this.openDatePicker}
                  @pointerdown=${this.openDatePicker}
                  @input=${this.handleEditFieldInput}
                />
              </label>
            </div>
            <div class="recurrence-fields">
              ${this.renderEditRecurrenceFields()}
            </div>
            <div class="modal-actions">
              <button
                type="button"
                class="button-secondary"
                id="cancel-edit"
                ?disabled=${this.busy}
                @click=${this.cancelEdit}
              >
                Cancel
              </button>
              <button type="submit" ?disabled=${this.busy}>
                ${this.busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private async loadEntries(): Promise<void> {
    if (!this.hass) {
      return;
    }

    try {
      const entries = await loadEntries(this.hass);
      this.entries = entries.map((entry) => ({
        entry_id: entry.entry_id,
        title: entry.title
      }));

      if (this.entries.length && !this.selectedEntryId) {
        this.selectedEntryId = this.entries[0].entry_id;
      }

      if (this.selectedEntryId) {
        await this.loadTasks();
      }
    } catch (error) {
      console.error("Maint panel failed to load entries", error);
      this.error = "Unable to load maint entries.";
    }
  }

  private async loadTasks(): Promise<void> {
    if (!this.selectedEntryId || !this.hass) {
      this.tasks = [];
      this.editingTaskId = null;
      this.editForm = null;
      this.editError = null;
      this.confirmTaskId = null;
      return;
    }

    try {
      this.busy = true;
      const tasks = await loadTasks(this.hass, this.selectedEntryId);

      this.tasks = this.sortTasks(tasks);
      this.editingTaskId = null;
      this.editForm = null;
      this.editError = null;
      this.confirmTaskId = null;
      this.formExpanded = this.tasks.length === 0;
    } catch (error) {
      console.error("Maint panel failed to load tasks", error);
      this.error = "Unable to load tasks.";
    } finally {
      this.busy = false;
    }
  }

  private async markTaskComplete(event: Event): Promise<void> {
    const target = event.currentTarget as HTMLElement | null;
    const taskId = target?.getAttribute("data-task");

    if (!taskId || !this.selectedEntryId || !this.hass) {
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

    try {
      this.busy = true;
      await updateMaintTask(this.hass, this.selectedEntryId, taskId, {
        description: task.description,
        last_completed: lastCompleted,
        recurrence: task.recurrence
      });
      await this.loadTasks();
    } catch (error) {
      console.error("Failed to mark maint task complete", error);
      this.error = "Unable to mark task complete.";
    } finally {
      this.busy = false;
    }
  }

  private async handleCreateTask(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.selectedEntryId || !this.hass) {
      return;
    }

    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) {
      return;
    }

    const formData = new FormData(form);
    const result = validateTaskFields({
      description: formData.get("description"),
      last_completed: formData.get("last_completed"),
      recurrence_type: formData.get("recurrence_type"),
      interval_every: formData.get("interval_every"),
      interval_unit: formData.get("interval_unit"),
      weekly_every: formData.get("weekly_every"),
      weekly_days: formData.getAll("weekly_days"),
    });

    if (result.error) {
      this.error = result.error;
      return;
    }

    if (!result.values) {
      return;
    }

    try {
      this.busy = true;
      const created = await createMaintTask(this.hass, this.selectedEntryId, result.values);

      this.tasks = this.sortTasks([...this.tasks, created]);
      form.reset();
      this.error = null;
    } catch (error) {
      console.error("Maint panel failed to create task", error);
      this.error = "Could not create task. Check the logs for details.";
    } finally {
      this.busy = false;
    }
  }

  private handleEditTask(event: Event): void {
    if (!this.selectedEntryId) {
      return;
    }

    const taskId = (event.currentTarget as HTMLElement | null)?.dataset.task;
    if (!taskId) {
      return;
    }

    const task = this.tasks.find((item) => item.task_id === taskId);
    if (!task) {
      return;
    }

    this.error = null;
    this.openEditModal(task);
  }

  private openEditModal(task: MaintTask): void {
    const baseForm: EditFormState = {
      description: task.description ?? "",
      last_completed: formatDateInput(task.last_completed),
      recurrence_type: task.recurrence.type,
      interval_every: "",
      interval_unit: "days",
      weekly_every: "1",
      weekly_days: []
    };

    if (task.recurrence.type === "interval") {
      baseForm.interval_every = task.recurrence.every.toString();
      baseForm.interval_unit = task.recurrence.unit;
    } else if (task.recurrence.type === "weekly") {
      baseForm.weekly_every = (task.recurrence.every ?? 1).toString();
      baseForm.weekly_days = task.recurrence.days.map((day) => day.toString());
    }

    this.editingTaskId = task.task_id;
    this.editForm = baseForm;
    this.editError = null;
  }

  private cancelEdit(): void {
    this.editingTaskId = null;
    this.editForm = null;
    this.editError = null;
  }

  private handleEditFieldInput(event: Event): void {
    const target = event.currentTarget as HTMLInputElement | HTMLSelectElement | null;
    if (!target || !target.name) {
      return;
    }

    if (!this.editForm) {
      return;
    }

    const nextForm: EditFormState = { ...this.editForm };
    switch (target.name) {
      case "description":
        nextForm.description = target.value;
        break;
      case "last_completed":
        nextForm.last_completed = target.value;
        break;
      case "interval_every":
        nextForm.interval_every = target.value;
        break;
      case "interval_unit":
        nextForm.interval_unit = target.value as EditFormState["interval_unit"];
        break;
      case "weekly_every":
        nextForm.weekly_every = target.value;
        break;
      default:
        break;
    }

    this.editError = null;
    this.editForm = nextForm;
  }

  private handleEditWeeklyDayChange(event: Event): void {
    if (!this.editForm) {
      return;
    }

    const target = event.target as HTMLInputElement | null;
    if (!target || target.name !== "weekly_days") {
      return;
    }

    const value = target.value;
    const nextDays = new Set(this.editForm.weekly_days);
    if (target.checked) {
      nextDays.add(value);
    } else {
      nextDays.delete(value);
    }

    const sortedDays = Array.from(nextDays).sort((a, b) => Number(a) - Number(b));
    this.editError = null;
    this.editForm = {
      ...this.editForm,
      weekly_days: sortedDays
    };
  }

  private handleEditSubmit(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (this.editingTaskId && form) {
      void this.saveTaskEdits(this.editingTaskId, form);
    }
  }

  private async saveTaskEdits(taskId: string, form: HTMLFormElement): Promise<void> {
    if (!this.selectedEntryId || !this.hass) {
      return;
    }

    const formData = new FormData(form);
    const result = validateTaskFields({
      description: formData.get("description"),
      last_completed: formData.get("last_completed"),
      recurrence_type: formData.get("recurrence_type"),
      interval_every: formData.get("interval_every"),
      interval_unit: formData.get("interval_unit"),
      weekly_every: formData.get("weekly_every"),
      weekly_days: formData.getAll("weekly_days")
    });

    if (result.error) {
      this.editError = result.error;
      return;
    }

    if (!result.values) {
      return;
    }

    try {
      this.busy = true;
      this.editError = null;
      const updated = await updateMaintTask(
        this.hass,
        this.selectedEntryId,
        taskId,
        result.values
      );

      this.tasks = this.sortTasks(
        this.tasks.map((task) => (task.task_id === taskId ? updated : task))
      );
      this.editingTaskId = null;
      this.editForm = null;
      this.editError = null;
    } catch (error) {
      console.error("Maint panel failed to update task", error);
      this.editError = "Could not update the task.";
    } finally {
      this.busy = false;
    }
  }

  private promptDelete(event: Event): void {
    if (!this.selectedEntryId) {
      return;
    }

    const taskId = (event.currentTarget as HTMLElement | null)?.dataset.task;
    if (!taskId) {
      return;
    }

    this.confirmTaskId = taskId;
  }

  private async handleDelete(): Promise<void> {
    if (!this.selectedEntryId || !this.confirmTaskId || !this.hass) {
      return;
    }

    const taskId = this.confirmTaskId;

    try {
      this.busy = true;
      await deleteMaintTask(this.hass, this.selectedEntryId, taskId);

      this.tasks = this.sortTasks(
        this.tasks.filter((task) => task.task_id !== taskId)
      );
      if (this.editingTaskId === taskId) {
        this.editingTaskId = null;
        this.editForm = null;
        this.editError = null;
      }

      if (this.tasks.length === 0) {
        this.formExpanded = true;
      }
    } catch (error) {
      console.error("Maint panel failed to delete task", error);
      this.error = "Could not delete the task.";
    } finally {
      this.busy = false;
      this.confirmTaskId = null;
    }
  }

  private cancelDelete(): void {
    this.confirmTaskId = null;
  }

  private toggleForm(): void {
    this.formExpanded = !this.formExpanded;
  }

  private handleFormHeaderKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.toggleForm();
    }
  }

  private openDatePicker(event: Event): void {
    const input = event.currentTarget as HTMLInputElement | null;
    if (!input || input.type !== "date") {
      return;
    }

    if (event.type === "pointerdown") {
      event.preventDefault();
      input.focus();
    }

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
        // Some browsers may block programmatic picker opens; ignore.
      }
    }
  }

  private recurrenceTypeOptions(selected: RecurrenceType) {
    const options: { value: RecurrenceType; label: string }[] = [
      { value: "interval", label: "Every N" },
      { value: "weekly", label: "Days of the week" }
    ];
    return options.map(
      (option) =>
        html`<option value=${option.value} ?selected=${option.value === selected}>
          ${option.label}
        </option>`
    );
  }

  private renderRecurrenceFields(
    type: RecurrenceType,
    recurrence?: Recurrence,
    taskId?: string
  ) {
    return renderRecurrenceFields(type, recurrence, taskId);
  }

  private handleRecurrenceTypeChange(event: Event): void {
    const select = event.currentTarget as HTMLSelectElement | null;
    if (!select) {
      return;
    }
    this.createRecurrenceType = select.value as RecurrenceType;
  }

  private renderEditRecurrenceFields() {
    if (!this.editForm) {
      return nothing;
    }

    return renderEditRecurrenceFields(
      this.editForm,
      this.busy,
      this.handleEditFieldInput.bind(this),
      this.handleEditWeeklyDayChange.bind(this)
    );
  }

  private handleEditRecurrenceTypeChange(event: Event): void {
    const select = event.currentTarget as HTMLSelectElement | null;
    if (!select || !this.editForm) {
      return;
    }

    const nextType = select.value as RecurrenceType;
    const nextForm: EditFormState = {
      ...this.editForm,
      recurrence_type: nextType
    };

    if (nextType === "weekly" && nextForm.weekly_days.length === 0) {
      nextForm.weekly_days = ["0"];
      nextForm.weekly_every = "1";
    }

    this.editError = null;
    this.editForm = nextForm;
  }

  static styles = styles;
}

declare global {
  interface HTMLElementTagNameMap {
    "maint-panel": MaintPanel;
  }
}
