import { LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { RecurrenceType } from "../index.js";
import { renderTaskForm } from "../form/view.js";
import type { RecurrenceFormState } from "../recurrence/view.js";

export interface EditFormState extends RecurrenceFormState {
  description: string;
  last_completed: string;
}

@customElement("maint-edit-modal")
export class MaintEditModal extends LitElement {
  @property({ type: Boolean }) public open = false;
  @property({ type: Boolean }) public busy = false;
  @property({ type: String }) public error: string | null = null;
  @property({ attribute: false }) public form: EditFormState | null = null;
  @property({ type: String }) public datePlaceholder = "";
  @property({ type: String }) public locale: string | undefined = undefined;
  @property({ type: Boolean }) public datePickerOpen = false;
  @property({ type: String }) public dateValue: string | null = null;
  @property({ type: Number }) public weekStart = 1;
  @property({ attribute: false }) public panelText?: (key: string, ...args: Array<string | number>) => string;
  @property({ attribute: false }) public localize?: (key: string, ...args: Array<string | number>) => string;

  protected createRenderRoot() {
    // Render in light DOM so shared styles apply.
    return this;
  }

  protected render() {
    if (!this.open || !this.form || !this.panelText || !this.localize) {
      return nothing;
    }

    return renderTaskForm({
      open: this.open,
      busy: this.busy,
      disabled: false,
      error: this.error,
      title: this.panelText("modals.edit_title"),
      subtitle: this.panelText("modals.edit_prompt"),
      submitLabel: this.busy ? this.panelText("buttons.saving") : this.panelText("buttons.save_changes"),
      dateLabel: this.panelText("fields.last_completed"),
      description: this.form.description,
      lastCompleted: this.form.last_completed,
      requireLastCompleted: true,
      recurrenceType: this.form.recurrence_type as RecurrenceType,
      recurrenceForm: this.form,
      datePlaceholder: this.datePlaceholder,
      cancelButtonId: "cancel-edit",
      locale: this.locale,
      datePickerOpen: this.datePickerOpen,
      dateValue: this.dateValue,
      weekStart: this.weekStart,
      panelText: this.panelText,
      localize: this.localize,
      onSubmit: this.handleSubmit,
      onCancel: this.handleCancel,
      onRecurrenceTypeChange: this.handleRecurrenceTypeChange,
      onFieldInput: this.handleFieldInput,
      onLastCompletedInput: this.handleFieldInput,
      onToggleDatePicker: this.toggleDatePicker,
      onOpenDatePicker: this.openDatePicker,
      onDateSelected: this.handleDateSelected,
      onWeeklyDayChange: this.handleWeeklyDayChange
    });
  }

  private handleSubmit(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("edit-submit", {
        detail: { formData: new FormData(form) },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleFieldInput(event: Event): void {
    const target = event.currentTarget as HTMLInputElement | HTMLSelectElement | null;
    if (!target || !target.name) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("edit-field-input", {
        detail: { name: target.name, value: target.value },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleWeeklyDayChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.name !== "weekly_days") {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("edit-weekly-day-change", {
        detail: { value: target.value, checked: target.checked },
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
      new CustomEvent("edit-recurrence-type-change", {
        detail: { type: select.value as RecurrenceType },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleDateSelected(event: CustomEvent<{ value: string }>): void {
    this.dispatchEvent(
      new CustomEvent("date-selected", {
        detail: event.detail,
        bubbles: true,
        composed: true
      })
    );
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

  private handleCancel(): void {
    this.dispatchEvent(
      new CustomEvent("edit-cancel", { bubbles: true, composed: true })
    );
  }
}
