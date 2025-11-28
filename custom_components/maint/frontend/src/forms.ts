import { parseDate, parseFrequency, parseFrequencyUnit } from "./formatting.js";
import type { FrequencyUnit, TaskPayload } from "./api.js";

export interface ValidationResult {
  values?: TaskPayload;
  error?: string;
}

export interface TaskFields {
  description?: unknown;
  frequency?: unknown;
  frequency_unit?: unknown;
  last_completed?: unknown;
}

export const validateTaskFields = (fields: TaskFields): ValidationResult => {
  const description = (fields.description ?? "").toString().trim();
  if (!description) {
    return { error: "Enter a description." };
  }

  const frequency = parseFrequency(fields.frequency);
  if (frequency === null) {
    return { error: "Enter how often the task repeats." };
  }

  const frequencyUnit = parseFrequencyUnit(fields.frequency_unit);
  if (!frequencyUnit) {
    return { error: "Choose a frequency unit." };
  }

  const lastCompleted = parseDate(fields.last_completed);
  if (lastCompleted === null) {
    return { error: "Enter a valid date for last completed." };
  }

  return {
    values: {
      description,
      frequency,
      frequency_unit: frequencyUnit as FrequencyUnit,
      last_completed: lastCompleted
    }
  };
};
