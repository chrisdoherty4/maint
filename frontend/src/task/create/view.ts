import { LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { DEFAULT_ICON, type RecurrenceType } from "../index.js";
import { renderTaskForm } from "../form/view.js";

@customElement("maint-create-modal")
export class MaintCreateModal extends LitElement {
  @property({ type: Boolean }) public open = false;
  @property({ type: Boolean }) public busy = false;
  @property({ type: Boolean }) public disabled = false;
  @property({ type: String }) public error: string | null = null;
  @property({ type: String }) public lastCompleted = "";
  @property({ type: String }) public datePlaceholder = "";
  @property({ type: String }) public locale: string | undefined = undefined;
  @property({ type: Boolean }) public datePickerOpen = false;
  @property({ type: String }) public dateValue: string | null = null;
  @property({ type: Number }) public weekStart = 1;
  @property({ type: String }) public recurrenceType: RecurrenceType = "interval";
  @property({ attribute: false }) public panelText?: (key: string, ...args: Array<string | number>) => string;
  @property({ attribute: false }) public localize?: (key: string, ...args: Array<string | number>) => string;

  protected createRenderRoot() {
    // Render in light DOM so shared styles apply.
    return this;
  }

  protected render() {
    if (!this.open || !this.panelText || !this.localize) {
      return nothing;
    }

    return renderTaskForm({
      open: this.open,
      busy: this.busy,
      disabled: this.disabled,
      error: this.error,
      title: this.panelText("modals.create_title"),
      subtitle: this.panelText("modals.create_prompt"),
      submitLabel: this.busy ? this.panelText("buttons.saving") : this.panelText("buttons.create"),
      dateLabel: this.panelText("fields.starting_from"),
      description: "",
      icon: DEFAULT_ICON,
      defaultIcon: DEFAULT_ICON,
      lastCompleted: this.lastCompleted,
      recurrenceType: this.recurrenceType,
      datePlaceholder: this.datePlaceholder,
      cancelButtonId: "cancel-create",
      locale: this.locale,
      datePickerOpen: this.datePickerOpen,
      dateValue: this.dateValue,
      weekStart: this.weekStart,
      requireLastCompleted: false,
      panelText: this.panelText,
      localize: this.localize,
      onSubmit: this.handleSubmit,
      onCancel: this.handleCancel,
      onRecurrenceTypeChange: this.handleRecurrenceTypeChange,
      onLastCompletedInput: this.handleLastCompletedInput,
      onToggleDatePicker: this.toggleDatePicker,
      onOpenDatePicker: this.openDatePicker,
      onDateSelected: this.handleDateSelected,
      onFieldInput: undefined,
      onWeeklyDayChange: undefined,
      recurrenceForm: undefined
    });
  }

  private handleSubmit(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("create-submit", {
        detail: { formData: new FormData(form) },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleCancel(): void {
    this.dispatchEvent(
      new CustomEvent("create-cancel", {
        bubbles: true,
        composed: true
      })
    );
  }

  private handleRecurrenceTypeChange(event: Event): void {
    const select = event.currentTarget as HTMLSelectElement | null;
    if (!select) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("recurrence-type-change", {
        detail: { type: select.value as RecurrenceType },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleLastCompletedInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement | null;
    if (!input) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("last-completed-input", {
        detail: { value: input.value },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleDateSelected(event: CustomEvent<{ value: string }>): void {
    this.dispatchEvent(new CustomEvent("date-selected", { detail: event.detail, bubbles: true, composed: true }));
  }

  private toggleDatePicker(): void {
    this.dispatchEvent(
      new CustomEvent("toggle-date-picker", { bubbles: true, composed: true })
    );
  }

  private openDatePicker(): void {
    this.dispatchEvent(
      new CustomEvent("open-date-picker", { bubbles: true, composed: true })
    );
  }
}
