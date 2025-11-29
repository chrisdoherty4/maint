import type { Recurrence, RecurrenceType, TaskPayload, Weekday } from "./api.js";
import { parseDate } from "./formatting.js";

export interface ValidationResult {
  values?: TaskPayload;
  error?: string;
}

type ScalarField = string | number | boolean | FormDataEntryValue | null | undefined;
type RecurrenceTypeField = ScalarField | RecurrenceType;
type FrequencyUnitField = ScalarField | "days" | "weeks" | "months";
type WeeklyDaysField = ScalarField | ScalarField[] | Weekday[];

export interface TaskFields {
  description?: ScalarField;
  last_completed?: ScalarField;
  recurrence_type?: RecurrenceTypeField;
  interval_every?: ScalarField;
  interval_unit?: FrequencyUnitField;
  weekly_days?: WeeklyDaysField;
}

export const validateTaskFields = (fields: TaskFields): ValidationResult => {
  const description = (fields.description ?? "").toString().trim();
  if (!description) {
    return { error: "Enter a description." };
  }

  const lastCompleted = parseDate(fields.last_completed);
  if (lastCompleted === null) {
    return { error: "Enter a valid date for last completed." };
  }

  const recurrence = parseRecurrence(fields);
  if (!recurrence.ok) {
    return { error: recurrence.error ?? "Choose a schedule." };
  }

  return {
    values: {
      description,
      last_completed: lastCompleted,
      recurrence: recurrence.value
    }
  };
};

const toRecurrenceType = (value: RecurrenceTypeField): RecurrenceType => {
  const normalized = (value ?? "interval").toString();
  if (
    normalized === "interval" ||
    normalized === "weekly"
  ) {
    return normalized;
  }
  return "interval";
};

const parsePositiveInt = (value: ScalarField): number | null => {
  const parsed = Number((value ?? "").toString());
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
};

const parseWeekdays = (value: WeeklyDaysField): Weekday[] | null => {
  const entries = Array.isArray(value) ? value : value === undefined ? [] : [value];
  const parsed = entries
    .map((entry) => Number(entry))
    .filter((num): num is Weekday => Number.isInteger(num) && num >= 0 && num <= 6);
  const unique = Array.from(new Set(parsed)).sort((a, b) => a - b) as Weekday[];
  return unique.length ? unique : null;
};

const parseRecurrence = (
  fields: TaskFields
): { ok: true; value: Recurrence } | { ok: false; error?: string } => {
  const type = toRecurrenceType(fields.recurrence_type);

  if (type === "interval") {
    const every = parsePositiveInt(fields.interval_every);
    const unit = (fields.interval_unit ?? "").toString();
    if (!every) {
      return { ok: false, error: "Enter how often the task repeats." };
    }
    if (unit !== "days" && unit !== "weeks" && unit !== "months") {
      return { ok: false, error: "Choose a frequency unit." };
    }
    return { ok: true, value: { type: "interval", every, unit } };
  }

  if (type === "weekly") {
    const days = parseWeekdays(fields.weekly_days);
    if (!days) {
      return { ok: false, error: "Select at least one day of the week." };
    }
    return { ok: true, value: { type: "weekly", days } };
  }

  return { ok: false, error: "Choose a schedule." };
};
