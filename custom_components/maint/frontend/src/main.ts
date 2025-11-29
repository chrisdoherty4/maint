import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import {
  createTask,
  deleteTask,
  fetchEntries,
  fetchTasks,
  updateTask,
  type HassConnection,
  type MaintEntry,
  type MaintTask,
  type Recurrence,
  type RecurrenceType
} from "./api.js";
import { validateTaskFields } from "./forms.js";
import {
  formatDate,
  formatDateInput,
  formatRecurrence,
  nextScheduled,
  normalizeTask
} from "./formatting.js";
import { styles } from "./styles.js";

type EditFormState = {
  description: string;
  last_completed: string;
  recurrence_type: RecurrenceType;
  interval_every: string;
  interval_unit: "days" | "weeks" | "months";
  weekly_days: string[];
};

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

  protected updated(changedProps: Map<string, unknown>): void {
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
      <section>
        <h2>Tasks</h2>
        ${formDisabled
        ? html`<p class="info">Add the Maint integration to start tracking tasks.</p>`
        : !hasTasks
          ? html`<p class="info">No tasks yet. Use the form above to create one.</p>`
          : html`
                <div class="task-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Frequency</th>
                        <th>Last completed</th>
                        <th>Next scheduled</th>
                        <th class="actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.tasks.map((task) => this.renderTaskRow(task))}
                    </tbody>
                  </table>
                </div>
              `}
      </section>
    `;
  }

  private renderTaskRow(task: MaintTask) {
    const editLabel = "Edit";
    const editIcon = "mdi:pencil";

    return html`
      <tr data-task-row=${task.task_id}>
        <td>
          <div class="task-description">${task.description}</div>
        </td>
        <td>
          ${formatRecurrence(task.recurrence)}
        </td>
        <td>
          ${formatDate(task.last_completed)}
        </td>
        <td>${formatDate(nextScheduled(task))}</td>
        <td class="actions">
          <button
            type="button"
            class="icon-button edit-task"
            data-task=${task.task_id}
            ?disabled=${this.busy || Boolean(this.editingTaskId)}
            aria-label=${editLabel}
            title=${editLabel}
            @click=${this.handleEditTask}
          >
            <ha-icon icon=${editIcon} aria-hidden="true"></ha-icon>
          </button>
          <button
            type="button"
            class="icon-button delete-task"
            data-task=${task.task_id}
            aria-label="Delete"
            title="Delete"
            ?disabled=${this.busy || Boolean(this.editingTaskId)}
            @click=${this.promptDelete}
          >
            <ha-icon icon="mdi:delete-outline" aria-hidden="true"></ha-icon>
          </button>
        </td>
      </tr>
    `;
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
      const entries = await fetchEntries(this.hass);
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
      const tasks = await fetchTasks(this.hass, this.selectedEntryId);

      this.tasks = tasks.map((task) => normalizeTask(task));
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
      const created = await createTask(this.hass, this.selectedEntryId, result.values);

      this.tasks = [...this.tasks, normalizeTask(created)];
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
      weekly_days: []
    };

    if (task.recurrence.type === "interval") {
      baseForm.interval_every = task.recurrence.every.toString();
      baseForm.interval_unit = task.recurrence.unit;
    } else if (task.recurrence.type === "weekly") {
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
    if (!this.editForm) {
      return;
    }

    const target = event.currentTarget as HTMLInputElement | HTMLSelectElement | null;
    if (!target || !target.name) {
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
    if (this.editingTaskId) {
      void this.saveTaskEdits(this.editingTaskId);
    }
  }

  private async saveTaskEdits(taskId: string): Promise<void> {
    if (!this.selectedEntryId || !this.hass || !this.editForm) {
      return;
    }

    const result = validateTaskFields({
      description: this.editForm.description,
      last_completed: this.editForm.last_completed,
      recurrence_type: this.editForm.recurrence_type,
      interval_every: this.editForm.interval_every,
      interval_unit: this.editForm.interval_unit,
      weekly_days: this.editForm.weekly_days
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
      const updated = await updateTask(
        this.hass,
        this.selectedEntryId,
        taskId,
        result.values
      );

      this.tasks = this.tasks.map((task) =>
        task.task_id === taskId ? normalizeTask(updated) : task
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
      await deleteTask(this.hass, this.selectedEntryId, taskId);

      this.tasks = this.tasks.filter((task) => task.task_id !== taskId);
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
      { value: "interval", label: "Every N days/weeks/months" },
      { value: "weekly", label: "Weekly on selected days" }
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
    if (type === "interval") {
      const every =
        recurrence?.type === "interval"
          ? recurrence.every
          : "";
      const unit =
        recurrence?.type === "interval"
          ? recurrence.unit
          : "days";
      return html`
        <div class="inline-fields">
          <label>
            <span class="label-text">Every</span>
            <input
              type="number"
              name="interval_every"
              min="1"
              step="1"
              required
              .value=${every}
            />
          </label>
          <label>
            <span class="label-text">Unit</span>
            <select name="interval_unit">
              <option value="days" ?selected=${unit === "days"}>Days</option>
              <option value="weeks" ?selected=${unit === "weeks"}>Weeks</option>
              <option value="months" ?selected=${unit === "months"}>Months</option>
            </select>
          </label>
        </div>
      `;
    }

    if (type === "weekly") {
      const selectedDays =
        recurrence?.type === "weekly" ? recurrence.days : [0];
      return html`
        <div class="weekday-grid" data-task=${taskId ?? ""}>
          ${this.weekdayCheckboxes(selectedDays)}
        </div>
      `;
    }

    return nothing;
  }

  private weekdayOptions(selected: number) {
    const labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return labels.map((label, index) => {
      const value = index.toString();
      return html`<option value=${value} ?selected=${selected === index}>${label}</option>`;
    });
  }

  private weekdayCheckboxes(selectedDays: number[]) {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return labels.map((label, index) => {
      const checked = selectedDays.includes(index);
      return html`
        <label class="weekday-chip">
          <input type="checkbox" name="weekly_days" value=${index} ?checked=${checked} />
          <span>${label}</span>
        </label>
      `;
    });
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

    if (this.editForm.recurrence_type === "interval") {
      return html`
        <div class="inline-fields">
          <label>
            <span class="label-text">Every</span>
            <input
              type="number"
              name="interval_every"
              min="1"
              step="1"
              required
              .value=${this.editForm.interval_every}
              ?disabled=${this.busy}
              @input=${this.handleEditFieldInput}
            />
          </label>
          <label>
            <span class="label-text">Unit</span>
            <select
              name="interval_unit"
              .value=${this.editForm.interval_unit}
              ?disabled=${this.busy}
              @change=${this.handleEditFieldInput}
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </label>
        </div>
      `;
    }

    if (this.editForm.recurrence_type === "weekly") {
      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return html`
        <div class="weekday-grid" @change=${this.handleEditWeeklyDayChange}>
          ${labels.map((label, index) => {
        const value = index.toString();
        const checked = this.editForm?.weekly_days.includes(value);
        return html`
              <label class="weekday-chip">
                <input
                  type="checkbox"
                  name="weekly_days"
                  value=${value}
                  ?checked=${checked}
                  ?disabled=${this.busy}
                />
                <span>${label}</span>
              </label>
            `;
      })}
        </div>
      `;
    }

    return nothing;
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
