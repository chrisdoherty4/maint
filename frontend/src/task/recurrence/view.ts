import { html } from "lit";

import type { Recurrence, RecurrenceType } from "../index.js";
import "./styles.css";

export interface RecurrenceFormState {
  recurrence_type: RecurrenceType;
  interval_every: string;
  interval_unit: "days" | "weeks" | "months";
  weekly_every: string;
  weekly_days: string[];
}

type LocalizeFunc = (key: string, ...args: Array<string | number>) => string;

const t = (localize: LocalizeFunc | undefined, key: string, fallback: string): string => {
  if (!localize) {
    return fallback;
  }
  const value = localize(key);
  return value && value !== key ? value : fallback;
};

export const renderRecurrenceFields = (
  type: RecurrenceType,
  recurrence?: Recurrence,
  form?: Partial<RecurrenceFormState>,
  localize?: LocalizeFunc,
  disabled?: boolean,
  onChange?: (event: Event) => void
) => {
  const recurrenceType = type;
  const currentUnit =
    form?.interval_unit ?? (recurrence?.type === "interval" ? recurrence.unit : "days");
  const intervalEvery =
    form?.interval_every ?? (recurrence?.type === "interval" ? recurrence.every.toString() : "");
  const weeklyEvery =
    form?.weekly_every ?? (recurrence?.type === "weekly" ? (recurrence.every ?? 1).toString() : "1");
  const weeklyDays =
    form?.weekly_days ?? (recurrence?.type === "weekly" ? recurrence.days.map((day) => day.toString()) : []);

  if (recurrenceType === "interval") {
    return html`
      <div class="form-row grid-two-up" data-recurrence-type="interval" @change=${onChange}>
        <label>
          <span class="label-text">${t(localize, "component.maint.panel.fields.interval_every", "Every")}</span>
          <input
            type="number"
            name="interval_every"
            min="1"
            required
            .value=${intervalEvery}
            ?disabled=${disabled}
          />
        </label>
        <label>
          <span class="label-text">${t(localize, "component.maint.panel.fields.interval_unit", "Unit")}</span>
          <select name="interval_unit" .value=${currentUnit} ?disabled=${disabled}>
            <option value="days">${t(localize, "component.maint.panel.interval_unit.days", "Days")}</option>
            <option value="weeks">${t(localize, "component.maint.panel.interval_unit.weeks", "Weeks")}</option>
            <option value="months">${t(localize, "component.maint.panel.interval_unit.months", "Months")}</option>
          </select>
        </label>
      </div>
    `;
  }

  if (recurrenceType === "weekly") {
    const weekdayGroup: Array<{ value: string; label: string }> = [
      { value: "0", label: localize?.("component.maint.recurrence.weekday_short.0") ?? "Mon" },
      { value: "1", label: localize?.("component.maint.recurrence.weekday_short.1") ?? "Tue" },
      { value: "2", label: localize?.("component.maint.recurrence.weekday_short.2") ?? "Wed" },
      { value: "3", label: localize?.("component.maint.recurrence.weekday_short.3") ?? "Thu" },
      { value: "4", label: localize?.("component.maint.recurrence.weekday_short.4") ?? "Fri" }
    ];
    const weekendGroup: Array<{ value: string; label: string }> = [
      { value: "5", label: localize?.("component.maint.recurrence.weekday_short.5") ?? "Sat" },
      { value: "6", label: localize?.("component.maint.recurrence.weekday_short.6") ?? "Sun" }
    ];
    return html`
      <div class="weekly-inline form-row grid-two-up" data-recurrence-type="weekly" @change=${onChange}>
        <label class="weekly-every">
          <span class="label-text">${t(localize, "component.maint.panel.fields.weekly_every", "Every N weeks")}</span>
          <input
            type="number"
            name="weekly_every"
            min="1"
            required
            .value=${weeklyEvery}
            ?disabled=${disabled}
          />
        </label>
        <div class="weekday-selection">
          <span class="label-text weekday-row-label">
            ${t(localize, "component.maint.panel.fields.weekly_on", "On")}
          </span>
          <div class="weekday-row">
            ${weekdayGroup.concat(weekendGroup).map(
      (day) => html`<label class="weekday-chip">
                <input
                  type="checkbox"
                  name="weekly_days"
                  value=${day.value}
                  ?checked=${weeklyDays.includes(day.value)}
                  ?disabled=${disabled}
                />
                <span>${day.label}</span>
              </label>`
    )}
          </div>
        </div>
      </div>
    `;
  }

  return null;
};

export const renderEditRecurrenceFields = (
  type: RecurrenceType,
  recurrence?: Recurrence,
  form?: Partial<RecurrenceFormState>,
  localize?: LocalizeFunc,
  disabled?: boolean
) => renderRecurrenceFields(type, recurrence, form, localize, disabled);
