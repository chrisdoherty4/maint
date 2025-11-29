import type { MaintTask, Recurrence, Weekday } from "./api.js";

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const toMondayIndex = (sundayIndex: number): Weekday =>
  (((sundayIndex + 6) % 7) as Weekday);

const parseIsoDate = (value: string): Date | null => {
  const [year, month, day] = value.toString().split("T")[0].split("-").map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day));
};

const formatIsoDate = (value: Date): string =>
  `${value.getUTCFullYear().toString().padStart(4, "0")}-${(value.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0")}-${value.getUTCDate().toString().padStart(2, "0")}`;

export const parseDate = (value: string | FormDataEntryValue | null | undefined): string | null => {
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

  const parsed = parseIsoDate(value);
  if (!parsed) {
    return "—";
  }

  return parsed.toLocaleDateString();
};

export const formatDateInput = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }

  const parsed = parseIsoDate(value);
  if (!parsed) {
    return "";
  }

  return formatIsoDate(parsed);
};

const normalizeWeekdays = (days: Weekday[]): Weekday[] =>
  Array.from(new Set(days)).sort((a, b) => a - b) as Weekday[];

export const formatRecurrence = (recurrence: Recurrence): string => {
  switch (recurrence.type) {
    case "interval": {
      const unitLabel =
        recurrence.unit === "days"
          ? recurrence.every === 1
            ? "day"
            : "days"
          : recurrence.unit === "weeks"
            ? recurrence.every === 1
              ? "week"
              : "weeks"
            : recurrence.every === 1
              ? "month"
              : "months";
      if (recurrence.unit === "days" && recurrence.every === 1) {
        return "Every day";
      }
      return `Every ${recurrence.every} ${unitLabel}`;
    }
    case "weekly": {
      const labels = normalizeWeekdays(recurrence.days).map((day) => WEEKDAY_LABELS[day]);
      return `Weekly on ${labels.join(", ")}`;
    }
    default:
      return "—";
  }
};

const computeNextSchedule = (lastCompleted: Date, recurrence: Recurrence): Date | null => {
  switch (recurrence.type) {
    case "interval": {
      const days = recurrence.unit === "weeks" ? recurrence.every * 7 : recurrence.every;
      const next = new Date(lastCompleted.getTime());
      next.setUTCDate(next.getUTCDate() + days);
      return next;
    }
    case "weekly": {
      const current = toMondayIndex(lastCompleted.getUTCDay());
      for (let offset = 1; offset <= 7; offset += 1) {
        const candidateWeekday = (current + offset) % 7;
        if (recurrence.days.includes(candidateWeekday as Weekday)) {
          const next = new Date(lastCompleted.getTime());
          next.setUTCDate(next.getUTCDate() + offset);
          return next;
        }
      }
      return null;
    }
    default:
      return null;
  }
};

export const nextScheduled = (task: MaintTask | null | undefined): string | null => {
  if (!task) {
    return null;
  }

  if (task.next_scheduled) {
    return task.next_scheduled;
  }

  if (!task.last_completed || !task.recurrence) {
    return null;
  }

  const parsed = parseIsoDate(task.last_completed);
  if (!parsed) {
    return null;
  }

  const next = computeNextSchedule(parsed, task.recurrence);
  return next ? formatIsoDate(next) : null;
};

export const normalizeTask = (task: MaintTask): MaintTask => ({
  ...task,
  recurrence:
    task.recurrence?.type === "weekly"
      ? { ...task.recurrence, days: normalizeWeekdays(task.recurrence.days) }
      : task.recurrence
});
