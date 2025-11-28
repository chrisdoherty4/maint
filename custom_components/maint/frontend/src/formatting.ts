import type { FrequencyUnit, MaintTask } from "./types.js";

export const normalizeFrequencyUnit = (value: string): FrequencyUnit => {
  const normalized = (value ?? "").toString().trim();
  if (normalized === "weeks" || normalized === "months") {
    return normalized;
  }
  return "days";
};

export const parseFrequencyUnit = (value: string): FrequencyUnit | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return normalizeFrequencyUnit(value);
};

export const parseFrequency = (value: string): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const rawValue = value.toString().trim();
  if (!rawValue) {
    return null;
  }

  const parsed = Number(rawValue);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
};

export const parseDate = (value: string): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.toString().trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return trimmed;
};

export const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return "—";
  }

  const [year, month, day] = value.toString().split("T")[0].split("-").map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return "—";
  }

  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString();
};

export const formatDateInput = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.toString().split("T")[0].split("-").map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return "";
  }

  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
};

const frequencyUnitMultiplier = (unit: FrequencyUnit): number => {
  switch (normalizeFrequencyUnit(unit)) {
    case "weeks":
      return 7;
    case "months":
      return 30;
    default:
      return 1;
  }
};

export const formatFrequencyValue = (
  frequencyDays: number | string,
  frequencyUnit: FrequencyUnit = "days"
): string => {
  if (!frequencyDays || Number.isNaN(Number(frequencyDays))) {
    return "";
  }

  const unit = normalizeFrequencyUnit(frequencyUnit);
  const multiplier = frequencyUnitMultiplier(unit);
  const normalized = Number(frequencyDays) / multiplier;

  if (!Number.isFinite(normalized)) {
    return "";
  }

  return Number.isInteger(normalized) ? normalized.toString() : normalized.toFixed(2);
};

export const formatFrequency = (
  frequencyDays: number | string,
  frequencyUnit: FrequencyUnit = "days"
): string => {
  if (!frequencyDays || Number.isNaN(Number(frequencyDays))) {
    return "—";
  }

  const unit = normalizeFrequencyUnit(frequencyUnit);
  const value = Number(formatFrequencyValue(frequencyDays, unit));

  if (!value || Number.isNaN(value)) {
    return "—";
  }

  const unitLabel =
    unit === "days"
      ? value === 1
        ? "day"
        : "days"
      : unit === "weeks"
        ? value === 1
          ? "week"
          : "weeks"
        : value === 1
          ? "month"
          : "months";

  if (unit === "days" && value === 1) {
    return "Every day";
  }

  if (value === 1) {
    return `Every ${unitLabel}`;
  }

  return `Every ${value} ${unitLabel}`;
};

export const nextScheduled = (task: MaintTask | null | undefined): string | null => {
  if (!task) {
    return null;
  }

  if (task.next_scheduled) {
    return task.next_scheduled;
  }

  if (!task.last_completed || !task.frequency) {
    return null;
  }

  const [year, month, day] = task.last_completed
    .toString()
    .split("T")[0]
    .split("-")
    .map(Number);

  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return null;
  }

  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + Number(task.frequency));

  return `${next.getFullYear().toString().padStart(4, "0")}-${(next.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${next.getDate().toString().padStart(2, "0")}`;
};

export const normalizeTask = (task: MaintTask): MaintTask => ({
  ...task,
  frequency_unit: normalizeFrequencyUnit(task.frequency_unit)
});
