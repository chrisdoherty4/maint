import { html, nothing, type TemplateResult } from "lit";
import type { Recurrence, RecurrenceType } from "./api.js";

const WEEKDAY_SHORT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface RecurrenceFormState {
  recurrence_type: RecurrenceType;
  interval_every: string;
  interval_unit: "days" | "weeks" | "months";
  weekly_every: string;
  weekly_days: string[];
}

const weekdayCheckboxes = (
  selectedDays: Array<number | string>,
  disabled = false
): TemplateResult[] => {
  const selectedSet = new Set(selectedDays.map((day) => day.toString()));
  return WEEKDAY_SHORT_LABELS.map((label, index) => {
    const value = index.toString();
    const checked = selectedSet.has(value);
    return html`
      <label class="weekday-chip">
        <input
          type="checkbox"
          name="weekly_days"
          value=${value}
          ?checked=${checked}
          ?disabled=${disabled}
        />
        <span>${label}</span>
      </label>
    `;
  });
};

export const renderRecurrenceFields = (
  type: RecurrenceType,
  recurrence?: Recurrence,
  taskId?: string
) => {
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
    const every =
      recurrence?.type === "weekly"
        ? recurrence.every ?? 1
        : 1;
    const selectedDays =
      recurrence?.type === "weekly" ? recurrence.days : [0];
    return html`
      <div class="inline-fields">
        <label class="week-interval">
          <span class="label-text">Every</span>
          <div class="week-interval-input">
            <input
              class="week-interval-input-field"
              type="number"
              name="weekly_every"
              min="1"
              step="1"
              required
              .value=${every}
            />
            <span class="week-interval-suffix">week(s)</span>
          </div>
        </label>
        <div class="weekday-field">
          <span class="label-text">On</span>
          <div class="weekday-grid" data-task=${taskId ?? ""}>
            ${weekdayCheckboxes(selectedDays)}
          </div>
        </div>
      </div>
    `;
  }

  return nothing;
};

export const renderEditRecurrenceFields = (
  form: RecurrenceFormState,
  busy: boolean,
  onFieldInput: (event: Event) => void,
  onWeekdayChange: (event: Event) => void
) => {
  if (form.recurrence_type === "interval") {
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
            .value=${form.interval_every}
            ?disabled=${busy}
            @input=${onFieldInput}
          />
        </label>
        <label>
          <span class="label-text">Unit</span>
          <select
            name="interval_unit"
            .value=${form.interval_unit}
            ?disabled=${busy}
            @change=${onFieldInput}
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
          </select>
        </label>
      </div>
    `;
  }

  if (form.recurrence_type === "weekly") {
    return html`
      <div class="inline-fields">
        <label class="week-interval">
          <span class="label-text">Every</span>
          <div class="week-interval-input">
            <input
              class="week-interval-input-field"
              type="number"
              name="weekly_every"
              min="1"
              step="1"
              required
              .value=${form.weekly_every}
              ?disabled=${busy}
              @input=${onFieldInput}
            />
            <span class="week-interval-suffix">week(s)</span>
          </div>
        </label>
        <div class="weekday-field">
          <span class="label-text">On</span>
          <div class="weekday-grid" @change=${onWeekdayChange}>
            ${weekdayCheckboxes(form.weekly_days, busy)}
          </div>
        </div>
      </div>
    `;
  }

  return nothing;
};
