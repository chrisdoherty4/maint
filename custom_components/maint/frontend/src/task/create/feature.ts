import { html, type TemplateResult } from "lit";

import type { HassConnection, RecurrenceType } from "../index.js";
import { formatDateInput, formatDatePlaceholder, getLocaleCode, parseDate } from "../../formatting.js";
import { DatePickerController } from "../../date-picker/controller.js";
import { currentDateInputValue } from "../date.js";
import { CreateTaskController, type CreateControllerState } from "./controller.js";

type PanelTextFunc = (key: string, ...args: Array<string | number>) => string;
type LocalizeFunc = (key: string, ...args: Array<string | number>) => string;

interface RenderContext {
  hass?: HassConnection;
  entryId: string | null;
  panelText: PanelTextFunc;
  localize: LocalizeFunc;
  formDisabled: boolean;
  locale?: string;
  weekStart: number;
}

interface PickerContext {
  locale?: string;
  weekStart: number;
}

export class CreateTaskFeature extends EventTarget {
  private hass?: HassConnection;
  private entryId: string | null = null;
  private panelText: PanelTextFunc | null = null;
  private localize: LocalizeFunc | null = null;
  private pickerContext: PickerContext = { locale: undefined, weekStart: 1 };
  private placeholder = "";

  public state: CreateControllerState;
  private readonly controller: CreateTaskController;
  private readonly picker = new DatePickerController();

  constructor(private readonly onStateChange?: (state: CreateControllerState) => void) {
    super();
    this.controller = new CreateTaskController((next) => this.handleStateChange(next));
    this.state = this.controller.state;
  }

  public render(ctx: RenderContext): TemplateResult | null {
    this.applyContext(ctx);

    if (!this.panelText || !this.localize) {
      return null;
    }

    return html`
      <maint-create-modal
        .open=${this.state.open}
        .busy=${this.state.busy}
        .disabled=${ctx.formDisabled}
        .error=${this.state.error}
        .lastCompleted=${this.state.lastCompleted}
        .datePlaceholder=${this.placeholder}
        .locale=${this.pickerContext.locale ?? getLocaleCode(ctx.hass)}
        .datePickerOpen=${this.state.datePickerOpen}
        .dateValue=${this.pickerIsoValue(this.state.lastCompleted)}
        .weekStart=${this.pickerContext.weekStart}
        .recurrenceType=${this.state.recurrenceType}
        .panelText=${this.panelText}
        .localize=${this.localize}
        @create-submit=${this.handleSubmit}
        @create-cancel=${this.handleCancel}
        @recurrence-type-change=${this.handleRecurrenceTypeChange}
        @last-completed-input=${this.handleLastCompletedInput}
        @toggle-date-picker=${this.toggleDatePicker}
        @open-date-picker=${this.openDatePicker}
        @date-selected=${(event: CustomEvent<{ value: string }>) => this.handleDateSelected(event.detail.value)}
      ></maint-create-modal>
    `;
  }

  public open(initialLastCompleted: string, ctx: RenderContext): void {
    this.applyContext(ctx);
    if (!this.entryId) {
      return;
    }
    this.controller.open(initialLastCompleted);
  }

  public close(): void {
    this.controller.close();
  }

  private handleStateChange(next: CreateControllerState): void {
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

  private applyContext(ctx: RenderContext): void {
    this.hass = ctx.hass;
    this.entryId = ctx.entryId;
    this.panelText = ctx.panelText;
    this.localize = ctx.localize;
    this.placeholder = formatDatePlaceholder(ctx.hass) || ctx.panelText("placeholders.date");
    this.pickerContext = { locale: ctx.locale ?? getLocaleCode(ctx.hass), weekStart: ctx.weekStart };
  }

  private pickerIsoValue(value: string | null | undefined): string | null {
    return parseDate(value, this.hass);
  }

  private openDatePicker = (): void => {
    this.controller.openDatePicker();
    this.picker.open("create");
  };

  private toggleDatePicker = (): void => {
    this.controller.toggleDatePicker();
    this.picker.toggle("create");
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

  private handleRecurrenceTypeChange = (event: CustomEvent<{ type: RecurrenceType }>): void => {
    const type = event.detail?.type;
    if (!type) {
      return;
    }
    this.controller.setRecurrenceType(type);
  };

  private handleLastCompletedInput = (event: CustomEvent<{ value: string }>): void => {
    const value = event.detail?.value;
    if (value === undefined) {
      return;
    }
    this.controller.updateLastCompleted(value);
  };

  private handleCancel = (): void => {
    this.controller.close();
    this.closeDatePicker();
  };

  private readonly handleSubmit = async (event: CustomEvent<{ formData: FormData }>): Promise<void> => {
    event.preventDefault();
    this.closeDatePicker();

    if (!this.entryId || !this.hass || !this.localize || !this.panelText) {
      return;
    }

    const formData = event.detail?.formData;
    if (!formData) {
      return;
    }

    this.dispatchEvent(new CustomEvent("create-busy-start"));
    try {
      const result = await this.controller.submit(
        formData,
        this.hass,
        this.entryId,
        this.localize,
        this.panelText("errors.create")
      );

      if (result.task) {
        this.dispatchEvent(new CustomEvent("create-task-created", { detail: { task: result.task } }));
        this.controller.close();
        this.controller.resetLastCompleted(this.defaultDateValue());
      } else if (result.error) {
        this.controller.setError(result.error);
      }
    } finally {
      this.dispatchEvent(new CustomEvent("create-busy-end"));
    }
  };

  public defaultDateValue(): string {
    return currentDateInputValue(this.hass);
  }

  public resetLastCompletedIfClosed(value: string): void {
    if (!this.state.open) {
      this.controller.resetLastCompleted(value);
    }
  }
}
