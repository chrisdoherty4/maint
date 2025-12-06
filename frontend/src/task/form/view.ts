import { html, nothing, type TemplateResult } from "lit";

import type { Recurrence, RecurrenceType } from "../index.js";
import { renderRecurrenceFields, type RecurrenceFormState } from "../recurrence/view.js";
import "../../date-picker/view.js";

type PanelTextFunc = (key: string, ...args: Array<string | number>) => string;
type LocalizeFunc = (key: string, ...args: Array<string | number>) => string;

export interface TaskFormRenderProps {
  open: boolean;
  busy: boolean;
  disabled?: boolean;
  error: string | null;
  title: string;
  subtitle: string;
  submitLabel: string;
  dateLabel: string;
  cancelButtonId?: string;
  description?: string;
  lastCompleted?: string;
  defaultIcon?: string;
  requireLastCompleted?: boolean;
  recurrenceType: RecurrenceType;
  recurrence?: Recurrence;
  recurrenceForm?: Partial<RecurrenceFormState>;
  icon?: string | null;
  datePlaceholder: string;
  locale?: string;
  datePickerOpen: boolean;
  dateValue: string | null;
  weekStart: number;
  panelText: PanelTextFunc;
  localize: LocalizeFunc;
  onSubmit: (event: Event) => void;
  onCancel: () => void;
  onRecurrenceTypeChange: (event: Event) => void;
  onFieldInput?: (event: Event) => void;
  onLastCompletedInput?: (event: Event) => void;
  onWeeklyDayChange?: (event: Event) => void;
  onToggleDatePicker: () => void;
  onOpenDatePicker: () => void;
  onDateSelected: (event: CustomEvent<{ value: string }>) => void;
}

const recurrenceTypeOptions = (
  selected: RecurrenceType,
  panelText: PanelTextFunc
): TemplateResult[] => {
  const options: Array<{ value: RecurrenceType; label: string }> = [
    { value: "interval", label: panelText("recurrence_options.interval") },
    { value: "weekly", label: panelText("recurrence_options.weekly") }
  ];
  return options.map(
    (option) =>
      html`<option value=${option.value} ?selected=${option.value === selected}>
        ${option.label}
      </option>`
  );
};

export const renderTaskForm = (props: TaskFormRenderProps): TemplateResult | typeof nothing => {
  const disabled = props.busy || props.disabled;
  if (!props.open) {
    return nothing;
  }

  return html`
    <div class="modal-backdrop">
      <div class="modal edit-modal">
        <h3>${props.title}</h3>
        <p>${props.subtitle}</p>
        ${props.error ? html`<div class="error">${props.error}</div>` : nothing}
        <form class="task-form" @submit=${props.onSubmit}>
          <label class="form-row">
            <span class="label-text">${props.panelText("fields.description")}</span>
            <input
              type="text"
              name="description"
              required
              placeholder=${props.panelText("placeholders.description_example")}
              .value=${props.description ?? ""}
              ?disabled=${disabled}
              @input=${props.onFieldInput}
            />
          </label>
          <div class="form-row grid-two-up">
          <label>
            <span class="label-text">${props.panelText("fields.schedule_type")}</span>
            <select
              name="recurrence_type"
              @change=${props.onRecurrenceTypeChange}
              .value=${props.recurrenceType}
              ?disabled=${disabled}
              >
                ${recurrenceTypeOptions(props.recurrenceType, props.panelText)}
              </select>
            </label>
            <label>
              <span class="label-text">${props.dateLabel}</span>
              <div class="date-input-wrapper date-picker-surface">
                <input
                  type="text"
                  inputmode="numeric"
                  lang=${props.locale ?? ""}
                  name="last_completed"
                  autocomplete="off"
                  placeholder=${props.datePlaceholder}
                  .value=${props.lastCompleted ?? ""}
                  ?required=${props.requireLastCompleted ?? false}
                  ?disabled=${disabled}
                  @input=${props.onLastCompletedInput ?? props.onFieldInput}
                  @focus=${props.onOpenDatePicker}
                  @click=${props.onOpenDatePicker}
                />
                <button
                  type="button"
                  class="icon-button date-picker-toggle date-picker-surface"
                  aria-label=${props.panelText("placeholders.date")}
                  title=${props.panelText("placeholders.date")}
                  ?disabled=${disabled}
              @click=${props.onToggleDatePicker}
                >
                  <ha-icon icon="mdi:calendar-blank" aria-hidden="true"></ha-icon>
                </button>
                <maint-date-picker
                  .open=${props.datePickerOpen}
                  .value=${props.dateValue}
                  .locale=${props.locale}
                  .weekStart=${props.weekStart}
                  @date-selected=${props.onDateSelected}
                ></maint-date-picker>
              </div>
            </label>
          </div>
          ${renderRecurrenceFields(
            props.recurrenceType,
            props.recurrence,
            props.recurrenceForm,
            props.localize,
            disabled,
            props.onWeeklyDayChange
          )}
          <details
            class="optional-config"
            ?open=${Boolean(props.icon && props.icon !== (props.defaultIcon ?? ""))}
          >
            <summary>${props.panelText("optional.heading")}</summary>
            <div class="optional-body">
              <label>
                <span class="label-text">${props.panelText("fields.icon")}</span>
                <input
                  type="text"
                  name="icon"
                  placeholder=${props.panelText("placeholders.icon_example")}
                  .value=${props.icon ?? ""}
                  ?disabled=${disabled}
                  @input=${props.onFieldInput}
                />
                <p class="help-text">${props.panelText("help.icon")}</p>
              </label>
            </div>
          </details>
          <div class="modal-actions" style="margin-top: 1rem;">
            <button
              type="button"
              class="button-secondary"
              id=${props.cancelButtonId ?? "cancel-task-form"}
              ?disabled=${props.busy}
              @click=${props.onCancel}
            >
              ${props.panelText("buttons.cancel")}
            </button>
            <button type="submit" ?disabled=${disabled}>
              ${props.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
};
