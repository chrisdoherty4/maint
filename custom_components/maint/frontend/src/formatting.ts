import type { MaintTask, Recurrence, Weekday } from "./api.js";

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const toMondayIndex = (sundayIndex: number): Weekday =>
  (((sundayIndex + 6) % 7) as Weekday);

export const parseIsoDate = (value: string): Date | null => {
  const [year, month, day] = value.toString().split("T")[0].split("-").map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return null;
  }
  // Use local time to avoid UTC offsets shifting the displayed day.
  return new Date(year, month - 1, day);
};

const formatIsoDate = (value: Date): string =>
  `${value.getFullYear().toString().padStart(4, "0")}-${(value.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${value.getDate().toString().padStart(2, "0")}`;

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
      const every = Math.max(1, recurrence.every ?? 1);
      const labels = normalizeWeekdays(recurrence.days).map((day) => WEEKDAY_LABELS[day]);
      const prefix = every === 1 ? "Weekly" : `Every ${every} weeks`;
      return `${prefix} on ${labels.join(", ")}`;
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
      next.setDate(next.getDate() + days);
      return next;
    }
    case "weekly": {
      const days = normalizeWeekdays(recurrence.days);
      if (days.length === 0) {
        return null;
      }
      const everyWeeks = Math.max(1, recurrence.every ?? 1);
      const weekStart = new Date(
        lastCompleted.getFullYear(),
        lastCompleted.getMonth(),
        lastCompleted.getDate()
      );
      weekStart.setDate(weekStart.getDate() - toMondayIndex(lastCompleted.getDay()));

      const findInWeek = (start: Date): Date | null => {
        for (const day of days) {
          const candidate = new Date(start.getTime());
          candidate.setDate(start.getDate() + day);
          if (candidate > lastCompleted) {
            return candidate;
          }
        }
        return null;
      };

      const firstCandidate = findInWeek(weekStart);
      if (firstCandidate) {
        return firstCandidate;
      }

      let weeksAhead = everyWeeks;
      while (true) {
        const start = new Date(weekStart.getTime());
        start.setDate(start.getDate() + weeksAhead * 7);
        const candidate = findInWeek(start);
        if (candidate) {
          return candidate;
        }
        weeksAhead += everyWeeks;
      }
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
      ? {
          ...task.recurrence,
          every: task.recurrence.every ?? 1,
          days: normalizeWeekdays(task.recurrence.days)
        }
      : task.recurrence
});
