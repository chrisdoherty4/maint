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
  @state() private editingRecurrenceTypes: Record<string, RecurrenceType> = {};

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
    const isEditing = this.editingTaskId === task.task_id;
    const saveLabel = isEditing ? (this.busy ? "Saving…" : "Save") : "Edit";
    const saveIcon = isEditing ? "mdi:check" : "mdi:pencil";

    return html`
      <tr data-task-row=${task.task_id}>
        <td>
          ${isEditing
        ? html`
                <input type="text" name="description" .value=${task.description} />
              `
        : html`<div class="task-description">${task.description}</div>`}
        </td>
        <td>
          ${isEditing
        ? html`
                <div class="frequency-editor">
                  <label class="stacked">
                    <span class="label-text">Type</span>
                    <select
                      name="recurrence_type"
                      .value=${this.resolveRecurrenceType(task)}
                      @change=${(event: Event) =>
        this.handleEditRecurrenceTypeChange(task.task_id, event)}
                    >
                      ${this.recurrenceTypeOptions(this.resolveRecurrenceType(task))}
                    </select>
                  </label>
                  <div class="recurrence-fields">
                    ${this.renderRecurrenceFields(
        this.resolveRecurrenceType(task),
        task.recurrence,
        task.task_id
      )}
                  </div>
                </div>
              `
        : formatRecurrence(task.recurrence)}
        </td>
        <td>
          ${isEditing
        ? html`
                <input
                  type="date"
                  name="last_completed"
                  .value=${formatDateInput(task.last_completed)}
                  @focus=${this.openDatePicker}
                  @pointerdown=${this.openDatePicker}
                />
              `
        : formatDate(task.last_completed)}
        </td>
        <td>${formatDate(nextScheduled(task))}</td>
        <td class="actions">
          <button
            type="button"
            class="icon-button edit-task"
            data-task=${task.task_id}
            ?disabled=${isEditing && this.busy}
            aria-label=${saveLabel}
            title=${saveLabel}
            @click=${this.handleEditTask}
          >
            <ha-icon icon=${saveIcon} aria-hidden="true"></ha-icon>
          </button>
          <button
            type="button"
            class="icon-button delete-task"
            data-task=${task.task_id}
            aria-label="Delete"
            title="Delete"
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
      return;
    }

    try {
      this.busy = true;
      const tasks = await fetchTasks(this.hass, this.selectedEntryId);

      this.tasks = tasks.map((task) => normalizeTask(task));
      this.editingTaskId = null;
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

    if (this.editingTaskId !== taskId) {
      this.error = null;
      this.editingTaskId = taskId;
      return;
    }

    this.error = null;
    void this.saveTaskEdits(taskId);
  }

  private async saveTaskEdits(taskId: string): Promise<void> {
    if (!this.selectedEntryId || !this.hass) {
      return;
    }

    const row = this.renderRoot.querySelector<HTMLTableRowElement>(
      `[data-task-row="${taskId}"]`
    );

    if (!row) {
      return;
    }

    const descriptionInput =
      row.querySelector<HTMLInputElement>('input[name="description"]');
    const dateInput = row.querySelector<HTMLInputElement>('input[name="last_completed"]');
    const recurrenceTypeSelect =
      row.querySelector<HTMLSelectElement>('select[name="recurrence_type"]');
    const weeklyDayInputs = row.querySelectorAll<HTMLInputElement>('input[name="weekly_days"]:checked');
    const intervalEveryInput =
      row.querySelector<HTMLInputElement>('input[name="interval_every"]');
    const intervalUnitSelect = row.querySelector<HTMLSelectElement>('select[name="interval_unit"]');

    const result = validateTaskFields({
      description: descriptionInput?.value,
      last_completed: dateInput?.value,
      recurrence_type: recurrenceTypeSelect?.value,
      interval_every: intervalEveryInput?.value,
      interval_unit: intervalUnitSelect?.value,
      weekly_days: Array.from(weeklyDayInputs).map((input) => input.value)
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
      const updated = await updateTask(
        this.hass,
        this.selectedEntryId,
        taskId,
        result.values
      );

      this.tasks = this.tasks.map((task) =>
        task.task_id === taskId ? normalizeTask(updated) : task
      );
      const updatedTypes = { ...this.editingRecurrenceTypes };
      delete updatedTypes[taskId];
      this.editingRecurrenceTypes = updatedTypes;
      this.editingTaskId = null;
    } catch (error) {
      console.error("Maint panel failed to update task", error);
      this.error = "Could not update the task.";
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

  private handleEditRecurrenceTypeChange(taskId: string, event: Event): void {
    const select = event.currentTarget as HTMLSelectElement | null;
    if (!select) {
      return;
    }
    this.editingRecurrenceTypes = {
      ...this.editingRecurrenceTypes,
      [taskId]: select.value as RecurrenceType
    };
  }

  private resolveRecurrenceType(task: MaintTask): RecurrenceType {
    return this.editingRecurrenceTypes[task.task_id] ?? task.recurrence.type;
  }

  static styles = styles;
}

declare global {
  interface HTMLElementTagNameMap {
    "maint-panel": MaintPanel;
  }
}
