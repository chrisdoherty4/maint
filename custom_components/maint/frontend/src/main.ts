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
  formatDatePlaceholder,
  formatDateInput,
  getLocaleCode,
  formatRecurrence,
  nextScheduled,
  parseDate,
  parseIsoDate,
  formatIsoDate
} from "./formatting.js";
import {
  renderEditRecurrenceFields,
  renderRecurrenceFields,
  type RecurrenceFormState
} from "./recurrence-fields.js";
import { styles } from "./styles.js";
import { getUiTranslations } from "./translations.js";

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
  @state() private createModalOpen = false;
  @state() private createError: string | null = null;
  @state() private createLastCompleted: string = this.currentDateInputValue();
  @state() private createRecurrenceType: RecurrenceType = "interval";
  @state() private editForm: EditFormState | null = null;
  @state() private editError: string | null = null;
  @state() private translations: Record<string, string> = {};
  @state() private translationsLanguage: string | null = null;
  @state() private datePickerTarget: "create" | "edit" | null = null;
  @state() private datePickerMonth: Date = new Date();

  private initialized = false;
  private lastDateLocaleKey: string | null = null;
  private readonly handleDatePickerOutside = (event: Event): void => {
    const path = event.composedPath();
    const insidePicker = path.some(
      (node) => node instanceof HTMLElement && node.classList.contains("date-picker-surface")
    );
    if (!insidePicker) {
      this.closeDatePicker();
    }
  };

  private readonly handleDatePickerKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      this.closeDatePicker();
    }
  };

  private hasDateLocaleChanged(previous: HassConnection | undefined, current: HassConnection | undefined): boolean {
    const previousKey = this.localeKey(previous);
    const currentKey = this.localeKey(current);
    const changed = previousKey !== null && currentKey !== null && previousKey !== currentKey;
    this.lastDateLocaleKey = currentKey;
    return changed;
  }

  private localeKey(hass: HassConnection | undefined): string | null {
    if (!hass) {
      return this.lastDateLocaleKey;
    }
    const lang = hass.language ?? hass.locale?.language ?? "";
    const format = hass.locale?.date_format ?? "";
    return `${lang}|${format}`;
  }

  protected updated(changedProps: PropertyValueMap<this>): void {
    const hassChanged = changedProps.has("hass");
    const languageChanged =
      hassChanged &&
      this.hass?.language &&
      this.hass.language !== this.translationsLanguage;
    const localeChanged = this.hasDateLocaleChanged(changedProps.get("hass"), this.hass);

    if (hassChanged && this.hass) {
      void this.loadTranslations();
      if (!this.initialized) {
        this.initialized = true;
        void this.loadEntries();
      }
    } else if (languageChanged && this.hass) {
      void this.loadTranslations();
    }

    if (changedProps.has("datePickerTarget")) {
      if (this.datePickerTarget) {
        document.addEventListener("pointerdown", this.handleDatePickerOutside);
        document.addEventListener("keydown", this.handleDatePickerKeydown);
      } else {
        document.removeEventListener("pointerdown", this.handleDatePickerOutside);
        document.removeEventListener("keydown", this.handleDatePickerKeydown);
      }
    }

    if (localeChanged) {
      this.reformatDateInputs(changedProps.get("hass") as HassConnection | undefined);
    }
  }

  disconnectedCallback(): void {
    document.removeEventListener("pointerdown", this.handleDatePickerOutside);
    document.removeEventListener("keydown", this.handleDatePickerKeydown);
    super.disconnectedCallback();
  }

  protected render() {
    const hasEntries = this.entries.length > 0;
    const formDisabled = !this.selectedEntryId;
    const createDisabled = formDisabled || this.busy;

    return html`
      <div class="container">
        <div class="page-header">
          <div class="title-block">
            <h1>${this.panelText("title")}</h1>
            <p class="subtext">${this.panelText("subtitle")}</p>
          </div>
          <button
            type="button"
            class="button-primary"
            ?disabled=${createDisabled}
            @click=${this.openCreateModal}
          >
            ${this.panelText("buttons.create")}
          </button>
        </div>
        ${this.error ? html`<div class="error global-error">${this.error}</div>` : nothing}
        ${hasEntries
        ? nothing
        : html`<p class="info">${this.panelText("info_add_entry")}</p>`}
        ${this.renderTasksSection(formDisabled)}
        ${this.renderCreateModal(formDisabled)}
        ${this.renderDeleteModal()}
        ${this.renderEditModal()}
      </div>
    `;
  }

  private renderTasksSection(formDisabled: boolean) {
    const hasTasks = this.tasks.length > 0;

    return html`
      <section class="tasks-section">
        <h2>${this.panelText("section_tasks")}</h2>
        ${formDisabled
        ? html`<p class="info">${this.panelText("info_enable_tracking")}</p>`
        : !hasTasks
          ? html`<p class="info">${this.panelText("info_no_tasks")}</p>`
          : html`
                <div class="task-list" role="list">
                  ${this.tasks.map((task) => this.renderTaskRow(task))}
                </div>
              `}
      </section>
    `;
  }

  private renderTaskRow(task: MaintTask) {
    const editLabel = this.panelText("buttons.edit");
    const editIcon = "mdi:pencil";
    const completeLabel = this.panelText("buttons.mark_complete");
    const deleteLabel = this.panelText("buttons.delete");
    const actionsDisabled = this.busy || Boolean(this.editingTaskId);
    const isDue = this.isTaskDue(task);
    const rowClass = isDue ? "task-row due" : "task-row";

    return html`
      <div class=${rowClass} data-task-row=${task.task_id} role="listitem">
        <div class="task-details">
          <div class="task-description-line">
            <div class="task-description">${task.description}</div>
            ${isDue ? html`<span class="pill pill-due">${this.panelText("labels.due")}</span>` : nothing}
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
              aria-label=${deleteLabel}
              title=${deleteLabel}
              data-label=${deleteLabel}
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
          <h3>${this.panelText("modals.delete_title")}</h3>
          <p>
            ${this.panelText("modals.delete_prompt", "task", task.description)}
          </p>
          <div class="modal-actions">
            <button
              type="button"
              class="button-secondary"
              id="cancel-delete"
              ?disabled=${this.busy}
              @click=${this.cancelDelete}
            >
              ${this.panelText("buttons.cancel")}
            </button>
            <button
              type="button"
              class="button-danger"
              id="confirm-delete"
              ?disabled=${this.busy}
              @click=${this.handleDelete}
            >
              ${this.panelText("buttons.delete")}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderCreateModal(formDisabled: boolean) {
    if (!this.createModalOpen) {
      return nothing;
    }

    return html`
      <div class="modal-backdrop">
        <div class="modal edit-modal">
          <h3>${this.panelText("modals.create_title")}</h3>
          <p>${this.panelText("modals.create_prompt")}</p>
          ${this.createError ? html`<div class="error">${this.createError}</div>` : nothing}
          <form id="create-task-form" @submit=${this.handleCreateTask}>
            <label>
              <span class="label-text">${this.panelText("fields.description")}</span>
              <input
                type="text"
                name="description"
                required
                placeholder=${this.panelText("placeholders.description_example")}
                ?disabled=${this.busy || formDisabled}
              />
            </label>
            <div class="inline-fields">
              <label>
                <span class="label-text">${this.panelText("fields.schedule_type")}</span>
                <select
                  name="recurrence_type"
                  @change=${this.handleRecurrenceTypeChange}
                  ?disabled=${this.busy || formDisabled}
                >
                  ${this.recurrenceTypeOptions(this.createRecurrenceType)}
                </select>
              </label>
              <label>
                <span class="label-text">${this.panelText("fields.starting_from")}</span>
                <div class="date-input-wrapper date-picker-surface">
                  <input
                    type="text"
                    inputmode="numeric"
                    lang=${this.localeCode() ?? ""}
                    name="last_completed"
                    autocomplete="off"
                    placeholder=${this.datePlaceholder()}
                    .value=${this.createLastCompleted}
                    @input=${this.handleCreateLastCompletedInput}
                    @focus=${() => this.openDatePicker("create")}
                    @click=${() => this.openDatePicker("create")}
                    ?disabled=${this.busy || formDisabled}
                  />
                  <button
                    type="button"
                    class="icon-button date-picker-toggle date-picker-surface"
                    aria-label=${this.panelText("placeholders.date")}
                    title=${this.panelText("placeholders.date")}
                    ?disabled=${this.busy || formDisabled}
                    @click=${() => this.toggleDatePicker("create")}
                  >
                    <ha-icon icon="mdi:calendar-blank" aria-hidden="true"></ha-icon>
                  </button>
                  ${this.renderDatePicker("create", this.createLastCompleted)}
                </div>
              </label>
            </div>
            <div class="recurrence-fields">
              ${this.renderRecurrenceFields(
        this.createRecurrenceType,
        undefined,
        undefined,
        this.busy || formDisabled
      )}
            </div>
            <div class="modal-actions">
              <button
                type="button"
                class="button-secondary"
                id="cancel-create"
                ?disabled=${this.busy}
                @click=${this.closeCreateModal}
              >
                ${this.panelText("buttons.cancel")}
              </button>
              <button type="submit" ?disabled=${this.busy || formDisabled}>
                ${this.busy
        ? this.panelText("buttons.saving")
        : this.panelText("buttons.create")}
              </button>
            </div>
          </form>
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
          <h3>${this.panelText("modals.edit_title")}</h3>
          <p>${this.panelText("modals.edit_prompt")}</p>
          ${this.editError ? html`<div class="error">${this.editError}</div>` : nothing}
          <form id="edit-task-form" @submit=${this.handleEditSubmit}>
            <label>
              <span class="label-text">${this.panelText("fields.description")}</span>
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
                <span class="label-text">${this.panelText("fields.schedule_type")}</span>
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
                <span class="label-text">${this.panelText("fields.last_completed")}</span>
                <div class="date-input-wrapper date-picker-surface">
                  <input
                    type="text"
                    inputmode="numeric"
                    lang=${this.localeCode() ?? ""}
                    name="last_completed"
                    required
                    autocomplete="off"
                    placeholder=${this.datePlaceholder()}
                    .value=${this.editForm.last_completed}
                    ?disabled=${this.busy}
                    @input=${this.handleEditFieldInput}
                    @focus=${() => this.openDatePicker("edit")}
                    @click=${() => this.openDatePicker("edit")}
                  />
                  <button
                    type="button"
                    class="icon-button date-picker-toggle date-picker-surface"
                    aria-label=${this.panelText("placeholders.date")}
                    title=${this.panelText("placeholders.date")}
                    ?disabled=${this.busy}
                    @click=${() => this.toggleDatePicker("edit")}
                  >
                    <ha-icon icon="mdi:calendar-blank" aria-hidden="true"></ha-icon>
                  </button>
                  ${this.renderDatePicker("edit", this.editForm.last_completed)}
                </div>
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
                ${this.panelText("buttons.cancel")}
              </button>
              <button type="submit" ?disabled=${this.busy}>
                ${this.busy
        ? this.panelText("buttons.saving")
        : this.panelText("buttons.save_changes")}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private renderDatePicker(target: "create" | "edit", value: string | null | undefined) {
    if (this.datePickerTarget !== target) {
      return nothing;
    }

    const locale = this.localeCode();
    const today = this.todayDate();
    const selected = this.parseInputToDate(value) ?? today;
    const visibleMonth = this.startOfMonth(this.datePickerMonth);
    const monthLabel = this.formatMonthLabel(visibleMonth, locale);
    const weekStart = this.firstWeekday();
    const weekdayLabels = this.weekdayLabels(locale, weekStart);
    const startOffset = (visibleMonth.getDay() - weekStart + 7) % 7;
    const start = new Date(visibleMonth);
    start.setDate(1 - startOffset);

    const days = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        date,
        inMonth: date.getMonth() === visibleMonth.getMonth(),
        isToday: this.isSameDay(date, today),
        isSelected: this.isSameDay(date, selected)
      };
    });

    return html`
      <div class="date-picker-popup date-picker-surface">
        <div class="date-picker-header">
          <button
            type="button"
            class="icon-button"
            aria-label="Previous month"
            @click=${() => this.changeDatePickerMonth(-1)}
          >
            <ha-icon icon="mdi:chevron-left" aria-hidden="true"></ha-icon>
          </button>
          <div class="date-picker-month">${monthLabel}</div>
          <button
            type="button"
            class="icon-button"
            aria-label="Next month"
            @click=${() => this.changeDatePickerMonth(1)}
          >
            <ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>
          </button>
        </div>
        <div class="date-picker-weekdays">
          ${weekdayLabels.map((label) => html`<span>${label}</span>`)}
        </div>
        <div class="date-picker-grid">
          ${days.map(
            (day) => html`
              <button
                type="button"
                class=${this.datePickerDayClass(day)}
                aria-label=${this.formatDayAria(day.date, locale)}
                @click=${() => this.selectDateFromPicker(target, day.date)}
              >
                ${day.date.getDate()}
              </button>
            `
          )}
        </div>
      </div>
    `;
  }

  private async loadEntries(): Promise<void> {
    if (!this.hass) {
      return;
    }

    try {
      this.error = null;
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
      this.error = this.panelText("errors.load_entries");
    }
  }

  private async loadTasks(): Promise<void> {
    if (!this.selectedEntryId || !this.hass) {
      this.tasks = [];
      this.editingTaskId = null;
      this.editForm = null;
      this.editError = null;
      this.confirmTaskId = null;
      this.createModalOpen = false;
      this.createError = null;
      return;
    }

    try {
      this.error = null;
      this.busy = true;
      const tasks = await loadTasks(this.hass, this.selectedEntryId);

      this.tasks = this.sortTasks(tasks);
      this.editingTaskId = null;
      this.editForm = null;
      this.editError = null;
      this.confirmTaskId = null;
    } catch (error) {
      console.error("Maint panel failed to load tasks", error);
      this.error = this.panelText("errors.load_tasks");
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
      this.error = null;
      this.busy = true;
      await updateMaintTask(this.hass, this.selectedEntryId, taskId, {
        description: task.description,
        last_completed: lastCompleted,
        recurrence: task.recurrence
      });
      await this.loadTasks();
    } catch (error) {
      console.error("Failed to mark maint task complete", error);
      this.error = this.panelText("errors.mark_complete");
    } finally {
      this.busy = false;
    }
  }

  private async handleCreateTask(event: Event): Promise<void> {
    event.preventDefault();
    this.closeDatePicker();

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
      weekly_days: formData.getAll("weekly_days")
    }, this.localizeText.bind(this), this.hass);

    if (result.error) {
      this.createError = result.error;
      return;
    }

    if (!result.values) {
      return;
    }

    let createdTask = false;
    try {
      this.busy = true;
      this.createError = null;
      const created = await createMaintTask(this.hass, this.selectedEntryId, result.values);

      this.tasks = this.sortTasks([...this.tasks, created]);
      this.error = null;
      form.reset();
      createdTask = true;
    } catch (error) {
      console.error("Maint panel failed to create task", error);
      this.createError = this.panelText("errors.create");
    } finally {
      this.busy = false;
      this.createLastCompleted = this.currentDateIso();
      if (createdTask) {
        this.closeCreateModal();
      }
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
      last_completed: formatDateInput(task.last_completed, this.hass),
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
    this.closeDatePicker();
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
    this.closeDatePicker();
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
    }, this.localizeText.bind(this), this.hass);

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
      this.editError = this.panelText("errors.update");
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
      this.error = null;
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
    } catch (error) {
      console.error("Maint panel failed to delete task", error);
      this.error = this.panelText("errors.delete");
    } finally {
      this.busy = false;
      this.confirmTaskId = null;
    }
  }

  private cancelDelete(): void {
    this.confirmTaskId = null;
  }

  private openCreateModal(): void {
    if (!this.selectedEntryId || this.busy) {
      return;
    }

    this.createModalOpen = true;
    this.createError = null;
    this.createRecurrenceType = "interval";
    this.createLastCompleted = this.currentDateInputValue();
  }

  private localeCode(): string | undefined {
    return getLocaleCode(this.hass);
  }

  private datePlaceholder(): string {
    const formatted = formatDatePlaceholder(this.hass);
    return formatted || this.panelText("placeholders.date");
  }

  private closeCreateModal(): void {
    if (this.busy) {
      return;
    }
    this.createModalOpen = false;
    this.createError = null;
    this.closeDatePicker();
  }

  private recurrenceTypeOptions(selected: RecurrenceType) {
    const options: { value: RecurrenceType; label: string }[] = [
      { value: "interval", label: this.panelText("recurrence_options.interval") },
      { value: "weekly", label: this.panelText("recurrence_options.weekly") }
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
    taskId?: string,
    disabled = false
  ) {
    return renderRecurrenceFields(
      type,
      recurrence,
      taskId,
      this.localizeText.bind(this),
      disabled
    );
  }

  private handleRecurrenceTypeChange(event: Event): void {
    const select = event.currentTarget as HTMLSelectElement | null;
    if (!select) {
      return;
    }
    this.createRecurrenceType = select.value as RecurrenceType;
    this.createError = null;
  }

  private renderEditRecurrenceFields() {
    if (!this.editForm) {
      return nothing;
    }

    return renderEditRecurrenceFields(
      this.editForm,
      this.busy,
      this.handleEditFieldInput.bind(this),
      this.handleEditWeeklyDayChange.bind(this),
      this.localizeText.bind(this)
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

  private toggleDatePicker(target: "create" | "edit"): void {
    if (this.datePickerTarget === target) {
      this.closeDatePicker();
    } else {
      this.openDatePicker(target);
    }
  }

  private openDatePicker(target: "create" | "edit"): void {
    if (target === "edit" && !this.editForm) {
      return;
    }
    const value = target === "create" ? this.createLastCompleted : this.editForm?.last_completed;
    const base = this.parseInputToDate(value) ?? this.todayDate();
    this.datePickerMonth = this.startOfMonth(base);
    this.datePickerTarget = target;
  }

  private closeDatePicker(): void {
    this.datePickerTarget = null;
  }

  private changeDatePickerMonth(delta: number): void {
    const next = new Date(this.datePickerMonth);
    next.setMonth(next.getMonth() + delta);
    this.datePickerMonth = this.startOfMonth(next);
  }

  private selectDateFromPicker(target: "create" | "edit", date: Date): void {
    const formatted = formatDateInput(formatIsoDate(date), this.hass);
    if (target === "create") {
      this.createLastCompleted = formatted;
      this.createError = null;
    } else if (this.editForm) {
      this.editForm = {
        ...this.editForm,
        last_completed: formatted
      };
      this.editError = null;
    }
    this.closeDatePicker();
  }

  private parseInputToDate(value: string | null | undefined): Date | null {
    const iso = parseDate(value, this.hass);
    if (!iso) {
      return null;
    }
    return parseIsoDate(iso);
  }

  private todayDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private startOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1);
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private formatMonthLabel(value: Date, locale?: string): string {
    try {
      return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(value);
    } catch {
      return `${value.toLocaleString(undefined, { month: "long" })} ${value.getFullYear()}`;
    }
  }

  private firstWeekday(): number {
    const locale = this.localeCode();
    const intlLocale = (Intl as unknown as { Locale?: typeof Intl.Locale }).Locale;
    if (intlLocale) {
      try {
        const info = new intlLocale(locale ?? "en");
        const first = (info as unknown as { weekInfo?: { firstDay?: number } }).weekInfo?.firstDay;
        if (typeof first === "number") {
          return first;
        }
      } catch {
        // Ignore and fall through to heuristic.
      }
    }

    const code = (locale ?? "").toLowerCase();
    if (code.startsWith("en-us")) {
      return 0;
    }
    return 1;
  }

  private reformatDateInputs(previousHass?: HassConnection): void {
    const reformatValue = (value: string | null | undefined): string | null => {
      const iso =
        parseDate(value, previousHass ?? this.hass) ??
        parseDate(value, this.hass) ??
        null;
      if (!iso) {
        return null;
      }
      return formatDateInput(iso, this.hass);
    };

    const updatedCreate = reformatValue(this.createLastCompleted);
    if (updatedCreate !== null && !this.createModalOpen) {
      this.createLastCompleted = updatedCreate;
    }

    if (this.editForm) {
      const updatedEdit = reformatValue(this.editForm.last_completed);
      if (updatedEdit !== null) {
        this.editForm = { ...this.editForm, last_completed: updatedEdit };
      }
    }

    this.datePickerMonth = this.startOfMonth(this.todayDate());
  }

  private weekdayLabels(locale: string | undefined, weekStart: number): string[] {
    const base = new Date(2024, 0, 1);
    const labels = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(base);
      day.setDate(base.getDate() + index);
      try {
        return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day);
      } catch {
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index];
      }
    });

    const rotated = labels.slice(weekStart).concat(labels.slice(0, weekStart));
    return rotated;
  }

  private datePickerDayClass(day: {
    inMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
  }): string {
    let className = "date-picker-day";
    if (!day.inMonth) {
      className += " muted";
    }
    if (day.isToday) {
      className += " today";
    }
    if (day.isSelected) {
      className += " selected";
    }
    return className;
  }

  private formatDayAria(date: Date, locale?: string): string {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
    } catch {
      return formatIsoDate(date);
    }
  }

  private handleCreateLastCompletedInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement | null;
    if (!input) {
      return;
    }
    this.createLastCompleted = input.value;
    this.createError = null;
  }

  private currentDateIso(): string {
    const today = new Date();
    const year = today.getFullYear().toString().padStart(4, "0");
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const day = today.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private currentDateInputValue(): string {
    return formatDateInput(this.currentDateIso(), this.hass);
  }

  private localizeText(key: string, ...args: Array<string | number>): string {
    const template = this.translations[key];
    if (template) {
      return this.formatFromTemplate(template, args);
    }

    const translated = this.hass?.localize?.(key, ...args);
    if (translated && translated !== key) {
      return translated;
    }

    return translated ?? key;
  }

  private panelText(key: string, ...args: Array<string | number>): string {
    return this.localizeText(`component.maint.panel.${key}`, ...args);
  }

  private formatFromTemplate(template: string, args: Array<string | number>): string {
    if (!args.length) {
      return template;
    }
    const replacements: Record<string, string> = {};
    for (let i = 0; i < args.length; i += 2) {
      const name = String(args[i]);
      const value = i + 1 < args.length ? String(args[i + 1]) : "";
      replacements[name] = value;
    }
    return template.replace(/{([^}]+)}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : match
    );
  }

  private async loadTranslations(): Promise<void> {
    const language = this.hass?.language;
    this.translations = getUiTranslations(language);
    this.translationsLanguage = language ?? "en";
  }

  static styles = styles;
}

declare global {
  interface HTMLElementTagNameMap {
    "maint-panel": MaintPanel;
  }
}
