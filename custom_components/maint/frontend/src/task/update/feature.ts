import { html, type TemplateResult } from "lit";

import type { HassConnection, MaintTask, RecurrenceType } from "../index.js";
import { formatDateInput, formatDatePlaceholder, getLocaleCode, parseDate } from "../../formatting.js";
import { DatePickerController } from "../../date-picker/controller.js";
import { UpdateTaskController, type EditControllerState } from "./controller.js";

type PanelTextFunc = (key: string, ...args: Array<string | number>) => string;
type LocalizeFunc = (key: string, ...args: Array<string | number>) => string;

interface RenderContext {
  hass?: HassConnection;
  entryId: string | null;
  panelText: PanelTextFunc;
  localize: LocalizeFunc;
  locale?: string;
  weekStart: number;
}

export class UpdateTaskFeature extends EventTarget {
  private hass?: HassConnection;
  private entryId: string | null = null;
  private panelText: PanelTextFunc | null = null;
  private localize: LocalizeFunc | null = null;
  private locale?: string;
  private weekStart = 1;
  private placeholder = "";

  public state: EditControllerState;
  private readonly controller: UpdateTaskController;
  private readonly picker = new DatePickerController();

  constructor(private readonly onStateChange?: (state: EditControllerState) => void) {
    super();
    this.controller = new UpdateTaskController((next) => this.handleStateChange(next));
    this.state = this.controller.state;
  }

  public render(ctx: RenderContext): TemplateResult | null {
    this.applyContext(ctx);
    if (!this.panelText || !this.localize) {
      return null;
    }

    return html`
      <maint-edit-modal
        .open=${Boolean(this.state.taskId && this.state.form)}
        .busy=${this.state.busy}
        .error=${this.state.error}
        .form=${this.state.form}
        .datePlaceholder=${this.placeholder}
        .locale=${this.locale}
        .datePickerOpen=${this.state.datePickerOpen}
        .dateValue=${this.pickerIsoValue(this.state.form?.last_completed)}
        .weekStart=${this.weekStart}
        .panelText=${this.panelText}
        .localize=${this.localize}
        @edit-submit=${this.handleSubmit}
        @edit-field-input=${this.handleFieldInput}
        @edit-weekly-day-change=${this.handleWeeklyDayChange}
        @edit-recurrence-type-change=${this.handleRecurrenceTypeChange}
        @edit-cancel=${this.handleCancel}
        @toggle-date-picker=${this.toggleDatePicker}
        @open-date-picker=${this.openDatePicker}
        @date-selected=${(event: CustomEvent<{ value: string }>) => this.handleDateSelected(event.detail.value)}
      ></maint-edit-modal>
    `;
  }

  public start(task: MaintTask, ctx: RenderContext): void {
    this.applyContext(ctx);
    this.controller.start(task, ctx.hass);
  }

  public cancel(): void {
    this.controller.cancel();
    this.closeDatePicker();
  }

  public resetAfterDelete(taskId: string): void {
    this.controller.resetAfterDelete(taskId);
  }

  private handleStateChange(next: EditControllerState): void {
    const previous = this.state;
    this.state = { ...next };
    if (previous.datePickerOpen !== next.datePickerOpen) {
      if (next.datePickerOpen) {
        this.attachPickerListeners();
      } else {
        this.detachPickerListeners();
      }
    }
    this.onStateChange?.(this.state);
  }

  private applyContext(ctx: RenderContext): void {
    this.hass = ctx.hass;
    this.entryId = ctx.entryId;
    this.panelText = ctx.panelText;
    this.localize = ctx.localize;
    this.locale = ctx.locale ?? getLocaleCode(ctx.hass);
    this.weekStart = ctx.weekStart;
    this.placeholder = formatDatePlaceholder(ctx.hass) || ctx.panelText("placeholders.date");
  }

  private attachPickerListeners(): void {
    document.addEventListener("pointerdown", this.handlePickerOutside);
    document.addEventListener("keydown", this.handlePickerKeydown);
  }

  private detachPickerListeners(): void {
    document.removeEventListener("pointerdown", this.handlePickerOutside);
    document.removeEventListener("keydown", this.handlePickerKeydown);
  }

  public dispose(): void {
    this.detachPickerListeners();
  }

  private readonly handlePickerOutside = (event: Event): void => {
    const path = event.composedPath();
    const insidePicker = path.some(
      (node) => node instanceof HTMLElement && node.classList.contains("date-picker-surface")
    );
    if (!insidePicker) {
      this.closeDatePicker();
    }
  };

  private readonly handlePickerKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      this.closeDatePicker();
    }
  };

  private pickerIsoValue(value: string | null | undefined): string | null {
    return parseDate(value, this.hass);
  }

  private openDatePicker = (): void => {
    if (!this.state.form) {
      return;
    }
    this.controller.openDatePicker();
    this.picker.open("edit");
  };

  private toggleDatePicker = (): void => {
    this.controller.toggleDatePicker();
    this.picker.toggle("edit");
  };

  private closeDatePicker(): void {
    this.controller.closeDatePicker();
    this.picker.close();
  }

  private handleDateSelected(isoValue: string): void {
    const formatted = formatDateInput(isoValue, this.hass);
    this.controller.setDate(formatted);
    this.closeDatePicker();
  }

  private handleFieldInput = (event: CustomEvent<{ name: string; value: string }>): void => {
    const { name, value } = event.detail ?? {};
    if (!name) {
      return;
    }
    this.controller.updateField(name, value);
  };

  private handleWeeklyDayChange = (event: CustomEvent<{ value: string; checked: boolean }>): void => {
    const { value, checked } = event.detail ?? {};
    if (value === undefined) {
      return;
    }
    this.controller.toggleWeeklyDay(value, checked);
  };

  private handleRecurrenceTypeChange = (event: CustomEvent<{ type: RecurrenceType }>): void => {
    const type = event.detail?.type;
    if (!type) {
      return;
    }
    this.controller.setRecurrenceType(type);
  };

  private handleCancel = (): void => {
    this.controller.cancel();
    this.closeDatePicker();
  };

  private readonly handleSubmit = async (event: CustomEvent<{ formData: FormData }>): Promise<void> => {
    event.preventDefault();
    this.closeDatePicker();
    if (!this.state.taskId || !this.entryId || !this.hass || !this.localize || !this.panelText) {
      return;
    }

    const formData = event.detail?.formData;
    if (!formData) {
      return;
    }

    this.dispatchEvent(new CustomEvent("edit-busy-start"));
    try {
      const result = await this.controller.submit(
        formData,
        this.hass,
        this.entryId,
        this.state.taskId,
        this.localize,
        this.panelText("errors.update")
      );

      if (result.task) {
        this.dispatchEvent(
          new CustomEvent("task-updated", {
            detail: { taskId: this.state.taskId, task: result.task }
          })
        );
        this.controller.cancel();
      } else if (result.error) {
        this.controller.setError(result.error);
      }
    } finally {
      this.dispatchEvent(new CustomEvent("edit-busy-end"));
    }
  };

  public reformatDateIfOpen(formatted: string): void {
    if (this.state.form) {
      this.controller.setDate(formatted);
    }
  }
}
