import { html, nothing, type TemplateResult } from "lit";
import type { Recurrence, RecurrenceType } from "./api.js";
import { getWeekdayShortLabels, type LocalizeFunc } from "./formatting.js";

export interface RecurrenceFormState {
  recurrence_type: RecurrenceType;
  interval_every: string;
  interval_unit: "days" | "weeks" | "months";
  weekly_every: string;
  weekly_days: string[];
}

const weekdayCheckboxes = (
  selectedDays: Array<number | string>,
  labels: string[],
  disabled = false
): TemplateResult[] => {
  const selectedSet = new Set(selectedDays.map((day) => day.toString()));
  return labels.map((label, index) => {
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
  recurrence: Recurrence | undefined,
  taskId: string | undefined,
  localize: LocalizeFunc
) => {
  const weekdayLabels = getWeekdayShortLabels(localize);
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
          <span class="label-text">${localize("component.maint.ui.panel.fields.every")}</span>
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
          <span class="label-text">${localize("component.maint.ui.panel.fields.unit")}</span>
          <select name="interval_unit">
            <option value="days" ?selected=${unit === "days"}>
              ${localize("component.maint.ui.panel.recurrence_options.units.days")}
            </option>
            <option value="weeks" ?selected=${unit === "weeks"}>
              ${localize("component.maint.ui.panel.recurrence_options.units.weeks")}
            </option>
            <option value="months" ?selected=${unit === "months"}>
              ${localize("component.maint.ui.panel.recurrence_options.units.months")}
            </option>
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
          <span class="label-text">${localize("component.maint.ui.panel.fields.every")}</span>
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
            <span class="week-interval-suffix">
              ${localize("component.maint.ui.panel.fields.weeks_suffix")}
            </span>
          </div>
        </label>
        <div class="weekday-field">
          <span class="label-text">${localize("component.maint.ui.panel.fields.on")}</span>
          <div class="weekday-grid" data-task=${taskId ?? ""}>
            ${weekdayCheckboxes(selectedDays, weekdayLabels)}
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
  onWeekdayChange: (event: Event) => void,
  localize: LocalizeFunc
) => {
  const weekdayLabels = getWeekdayShortLabels(localize);
  if (form.recurrence_type === "interval") {
    return html`
      <div class="inline-fields">
        <label>
          <span class="label-text">${localize("component.maint.ui.panel.fields.every")}</span>
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
          <span class="label-text">${localize("component.maint.ui.panel.fields.unit")}</span>
          <select
            name="interval_unit"
            .value=${form.interval_unit}
            ?disabled=${busy}
            @change=${onFieldInput}
          >
            <option value="days">${localize("component.maint.ui.panel.recurrence_options.units.days")}</option>
            <option value="weeks">${localize("component.maint.ui.panel.recurrence_options.units.weeks")}</option>
            <option value="months">${localize("component.maint.ui.panel.recurrence_options.units.months")}</option>
          </select>
        </label>
      </div>
    `;
  }

  if (form.recurrence_type === "weekly") {
    return html`
      <div class="inline-fields">
        <label class="week-interval">
          <span class="label-text">${localize("component.maint.ui.panel.fields.every")}</span>
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
            <span class="week-interval-suffix">
              ${localize("component.maint.ui.panel.fields.weeks_suffix")}
            </span>
          </div>
        </label>
        <div class="weekday-field">
          <span class="label-text">${localize("component.maint.ui.panel.fields.on")}</span>
          <div class="weekday-grid" @change=${onWeekdayChange}>
            ${weekdayCheckboxes(form.weekly_days, weekdayLabels, busy)}
          </div>
        </div>
      </div>
    `;
  }

  return nothing;
};
