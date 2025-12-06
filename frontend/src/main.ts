import { html, LitElement, nothing, type PropertyValueMap } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { type HassConnection, type MaintTask } from "./task/index.js";
import { currentDateInputValue, localeCode } from "./task/date.js";
import { formatDateInput, parseDate } from "./formatting.js";
import "./date-picker/view.js";
import "./task/recurrence/view.js";
import "./task/list/view.js";
import { TaskListFeature } from "./task/list/feature.js";
import "./task/create/view.js";
import "./task/delete/view.js";
import { CreateTaskFeature } from "./task/create/feature.js";
import type { CreateControllerState } from "./task/create/controller.js";
import { DeleteTaskFeature, type DeleteFeatureState } from "./task/delete/feature.js";
import { TaskListController, type TaskListState } from "./task/list/controller.js";
import { UpdateTaskFeature } from "./task/update/feature.js";
import type { EditControllerState } from "./task/update/controller.js";
import { styles } from "./styles.js";
import { getUiTranslations } from "./translations.js";
import "./task/update/view.js";

@customElement("maint-panel")
export class MaintPanel extends LitElement {
  private readonly dataController = new TaskListController();
  private readonly createFeature = new CreateTaskFeature((state) => {
    this.createState = { ...state };
  });
  private readonly editFeature = new UpdateTaskFeature((state) => {
    this.editState = { ...state };
  });
  private readonly deleteFeature = new DeleteTaskFeature((state) => {
    this.deleteState = { ...state };
  });
  private readonly taskListFeature = new TaskListFeature();

  @property({ attribute: false }) public hass?: HassConnection;

  @state() private dataState: TaskListState = this.dataController.state;
  @state() private busy = false;
  @state() private error: string | null = null;
  @state() private translations: Record<string, string> = {};
  @state() private translationsLanguage: string | null = null;
  @state() private createState: CreateControllerState = this.createFeature.state;
  @state() private editState: EditControllerState = this.editFeature.state;
  @state() private deleteState: DeleteFeatureState = this.deleteFeature.state;

  private initialized = false;
  private lastDateLocaleKey: string | null = null;
  private busyCounter = 0;

  constructor() {
    super();
    this.createFeature.addEventListener("create-task-created", (event) => {
      const task = (event as CustomEvent<{ task: MaintTask }>).detail?.task;
      if (task) {
        const tasks = this.dataController.sortTasks([...this.dataState.tasks, task]);
        this.dataState = { ...this.dataState, tasks };
        this.error = null;
      }
    });
    this.createFeature.addEventListener("create-busy-start", () => this.startBusy());
    this.createFeature.addEventListener("create-busy-end", () => this.stopBusy());
    this.editFeature.addEventListener("task-updated", (event) => {
      const detail = (event as CustomEvent<{ taskId: string; task: MaintTask }>).detail;
      if (detail?.taskId && detail.task) {
        const tasks = this.dataController.sortTasks(
          this.dataState.tasks.map((task) => (task.task_id === detail.taskId ? detail.task : task))
        );
        this.dataState = { ...this.dataState, tasks };
      }
    });
    this.editFeature.addEventListener("edit-busy-start", () => this.startBusy());
    this.editFeature.addEventListener("edit-busy-end", () => this.stopBusy());
    this.deleteFeature.addEventListener("task-deleted", async (event) => {
      const taskId = (event as CustomEvent<{ taskId: string }>).detail?.taskId;
      if (!taskId) {
        return;
      }
      const tasks = this.dataController.sortTasks(
        this.dataState.tasks.filter((task) => task.task_id !== taskId)
      );
      this.dataState = { ...this.dataState, tasks };
      this.editFeature.resetAfterDelete(taskId);
      await this.loadTasks();
    });
    this.deleteFeature.addEventListener("delete-busy-start", () => this.startBusy());
    this.deleteFeature.addEventListener("delete-busy-end", () => this.stopBusy());
    this.deleteFeature.addEventListener("delete-error", (event) => {
      const message = (event as CustomEvent<string>).detail;
      this.error = message;
    });
    this.taskListFeature.addEventListener("task-completed", (event) => {
      const detail = (event as CustomEvent<{ taskId: string; task?: MaintTask }>).detail;
      if (!detail?.taskId || !detail.task) {
        return;
      }
      const tasks = this.dataController.sortTasks(
        this.dataState.tasks.map((item) => (item.task_id === detail.taskId ? detail.task! : item))
      );
      this.dataState = { ...this.dataState, tasks };
    });
    this.taskListFeature.addEventListener("task-edit", (event) => {
      const taskId = (event as CustomEvent<{ taskId: string }>).detail?.taskId;
      if (!taskId) {
        return;
      }
      const task = this.dataState.tasks.find((item) => item.task_id === taskId);
      if (!task) {
        return;
      }
      this.error = null;
      this.editFeature.start(task, {
        hass: this.hass,
        entryId: this.dataState.selectedEntryId ?? null,
        panelText: this.panelText.bind(this),
        localize: this.localizeText.bind(this),
        locale: localeCode(this.hass),
        weekStart: this.firstWeekday()
      });
    });
    this.taskListFeature.addEventListener("task-delete", (event) => {
      const taskId = (event as CustomEvent<{ taskId: string }>).detail?.taskId;
      if (taskId) {
        this.deleteFeature.prompt(taskId);
      }
    });
    this.taskListFeature.addEventListener("task-error", (event) => {
      const key = (event as CustomEvent<string>).detail;
      this.error = this.panelText(key);
    });
    this.taskListFeature.addEventListener("task-list-busy-start", () => this.startBusy());
    this.taskListFeature.addEventListener("task-list-busy-end", () => this.stopBusy());
  }

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

    if (localeChanged) {
      this.reformatDateInputs(changedProps.get("hass") as HassConnection | undefined);
    }
  }

  disconnectedCallback(): void {
    this.createFeature.dispose();
    this.editFeature.dispose();
    super.disconnectedCallback();
  }

  private startBusy(): void {
    this.busyCounter += 1;
    this.busy = true;
  }

  private stopBusy(): void {
    this.busyCounter = Math.max(0, this.busyCounter - 1);
    this.busy = this.busyCounter > 0;
  }

  protected render() {
    const hasEntries = this.dataState.entries.length > 0;
    const formDisabled = !this.dataState.selectedEntryId;
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
    if (formDisabled) {
      return html`<section class="tasks-section">
        <h2>${this.panelText("section_tasks")}</h2>
        <p class="info">${this.panelText("info_enable_tracking")}</p>
      </section>`;
    }

    return this.taskListFeature.render({
      tasks: this.dataState.tasks,
      hass: this.hass,
      entryId: this.dataState.selectedEntryId ?? null,
      busy: this.busy,
      editing: Boolean(this.editState.taskId),
      panelText: this.panelText.bind(this),
      localizeText: this.localizeText.bind(this)
    });
  }

  private renderCreateModal(formDisabled: boolean) {
    return this.createFeature.render({
      hass: this.hass,
      entryId: this.dataState.selectedEntryId ?? null,
      panelText: this.panelText.bind(this),
      localize: this.localizeText.bind(this),
      formDisabled,
      locale: localeCode(this.hass),
      weekStart: this.firstWeekday()
    });
  }

  private renderEditModal() {
    return this.editFeature.render({
      hass: this.hass,
      entryId: this.dataState.selectedEntryId ?? null,
      panelText: this.panelText.bind(this),
      localize: this.localizeText.bind(this),
      locale: localeCode(this.hass),
      weekStart: this.firstWeekday()
    });
  }

  private renderDeleteModal() {
    return this.deleteFeature.render({
      hass: this.hass,
      entryId: this.dataState.selectedEntryId ?? null,
      panelText: this.panelText.bind(this),
      taskTitle: this.deleteTaskTitle()
    });
  }

  private async loadEntries(): Promise<void> {
    if (!this.hass) {
      return;
    }

    this.startBusy();
    this.error = null;
    const state = await this.dataController.fetchEntries(this.hass);
    this.dataState = { ...state };
    if (state.error) {
      this.error = this.panelText(state.error);
    }
    this.stopBusy();
  }

  private async loadTasks(): Promise<void> {
    if (!this.dataState.selectedEntryId || !this.hass) {
      this.dataState = { ...this.dataState, tasks: [] };
      this.editFeature.cancel();
      this.deleteFeature.cancel();
      this.createFeature.close();
      return;
    }

    this.startBusy();
    this.error = null;
    const state = await this.dataController.fetchTasks(this.hass, this.dataState.selectedEntryId);
    this.dataState = { ...state };
    if (state.error) {
      this.error = this.panelText(state.error);
    } else {
      this.editFeature.cancel();
      this.deleteFeature.cancel();
    }
    this.stopBusy();
  }

  private openCreateModal(): void {
    if (!this.dataState.selectedEntryId || this.busy) {
      return;
    }

    this.createFeature.open(currentDateInputValue(this.hass), {
      hass: this.hass,
      entryId: this.dataState.selectedEntryId ?? null,
      panelText: this.panelText.bind(this),
      localize: this.localizeText.bind(this),
      formDisabled: false,
      locale: localeCode(this.hass),
      weekStart: this.firstWeekday()
    });
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

    const updatedCreate = reformatValue(this.createState.lastCompleted);
    if (updatedCreate !== null) {
      this.createFeature.resetLastCompletedIfClosed(updatedCreate);
    }

    if (this.editState.form) {
      const updatedEdit = reformatValue(this.editState.form.last_completed);
      if (updatedEdit !== null) {
        this.editFeature.reformatDateIfOpen(updatedEdit);
      }
    }
  }

  private firstWeekday(): number {
    const locale = localeCode(this.hass);
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

  private deleteTaskTitle(): string | null {
    if (!this.deleteState.taskId) {
      return null;
    }
    return this.dataState.tasks.find((task) => task.task_id === this.deleteState.taskId)?.description ?? null;
  }

  static styles = styles;
}

declare global {
  interface HTMLElementTagNameMap {
    "maint-panel": MaintPanel;
  }
}
