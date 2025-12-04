import type { FrequencyUnit, HassConnection, MaintTask, Recurrence, Weekday } from "./api.js";

export type LocalizeFunc = (key: string, ...args: Array<string | number>) => string;

const FALLBACK_WEEKDAY_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];
const FALLBACK_WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const translateWithFallback = (
  localize: LocalizeFunc,
  key: string,
  fallback: string,
  ...args: Array<string | number>
): string => {
  const value = localize(key, ...args);
  return value === key ? fallback : value;
};

export const getWeekdayLabels = (localize: LocalizeFunc): string[] =>
  FALLBACK_WEEKDAY_FULL.map((fallback, index) =>
    translateWithFallback(
      localize,
      `component.maint.recurrence.weekday_full.${index}`,
      fallback
    )
  );

export const getWeekdayShortLabels = (localize: LocalizeFunc): string[] =>
  FALLBACK_WEEKDAY_SHORT.map((fallback, index) =>
    translateWithFallback(
      localize,
      `component.maint.recurrence.weekday_short.${index}`,
      fallback
    )
  );

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

export const formatIsoDate = (value: Date): string =>
  `${value.getFullYear().toString().padStart(4, "0")}-${(value.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${value.getDate().toString().padStart(2, "0")}`;

export const getLocaleCode = (hass?: HassConnection): string | undefined =>
  hass?.locale?.language ?? hass?.language;

const formatNumber = (value: number, minimumIntegerDigits: number, locale?: string): string => {
  try {
    return new Intl.NumberFormat(locale, {
      minimumIntegerDigits,
      useGrouping: false
    }).format(value);
  } catch {
    return value.toString().padStart(minimumIntegerDigits, "0");
  }
};

const formatOrderedDate = (
  value: Date,
  locale: string | undefined,
  order: Array<"day" | "month" | "year">,
  separator: string
): string => {
  const parts: Record<"day" | "month" | "year", string> = {
    day: formatNumber(value.getDate(), 2, locale),
    month: formatNumber(value.getMonth() + 1, 2, locale),
    year: formatNumber(value.getFullYear(), 4, locale)
  };

  return order.map((part) => parts[part]).join(separator);
};

const formatWithUserDateFormat = (value: Date, hass?: HassConnection): string => {
  const locale = getLocaleCode(hass);
  const format = hass?.locale?.date_format?.toLowerCase();

  switch (format) {
    case "dmy":
      return formatOrderedDate(value, locale, ["day", "month", "year"], "/");
    case "mdy":
      return formatOrderedDate(value, locale, ["month", "day", "year"], "/");
    case "ymd":
    case "iso":
      return formatOrderedDate(value, locale, ["year", "month", "day"], "-");
    default:
      try {
        return new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "numeric",
          day: "numeric"
        }).format(value);
      } catch {
        return value.toLocaleDateString();
      }
  }
};

export const formatDatePlaceholder = (hass?: HassConnection): string => {
  const sample = new Date(2024, 0, 31);
  return formatWithUserDateFormat(sample, hass);
};

export type DateFormatOrder = Array<"day" | "month" | "year">;

const toOrder = (format?: string | null): DateFormatOrder | null => {
  switch (format?.toLowerCase()) {
    case "dmy":
      return ["day", "month", "year"];
    case "mdy":
      return ["month", "day", "year"];
    case "ymd":
    case "iso":
      return ["year", "month", "day"];
    default:
      return null;
  }
};

const parseUserDate = (value: string, hass?: HassConnection): string | null => {
  const order = toOrder(hass?.locale?.date_format);
  if (!order) {
    return null;
  }

  const parts = value.split(/[^0-9]/).filter(Boolean);
  if (parts.length !== 3) {
    return null;
  }

  const [first, second, third] = parts.map(Number);
  if ([first, second, third].some((part) => Number.isNaN(part))) {
    return null;
  }

  const mapping: Record<DateFormatOrder[number], number> = {
    [order[0]]: first,
    [order[1]]: second,
    [order[2]]: third
  } as Record<DateFormatOrder[number], number>;

  const year = mapping.year;
  const month = mapping.month;
  const day = mapping.day;
  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return formatIsoDate(parsed);
};

export const parseDate = (
  value: string | number | boolean | FormDataEntryValue | null | undefined,
  hass?: HassConnection
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.toString().trim();
  if (!trimmed) {
    return null;
  }

  const userFormatted = parseUserDate(trimmed, hass);
  if (userFormatted) {
    return userFormatted;
  }

  const isoParsed = parseIsoDate(trimmed);
  if (isoParsed) {
    return formatIsoDate(isoParsed);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return formatIsoDate(parsed);
};

export const formatDate = (value: string | null | undefined, hass?: HassConnection): string => {
  if (!value) {
    return "—";
  }

  const parsed = parseIsoDate(value);
  if (!parsed) {
    return "—";
  }

  return formatWithUserDateFormat(parsed, hass);
};

export const formatDateInput = (
  value: string | null | undefined,
  hass?: HassConnection
): string => {
  if (!value) {
    return "";
  }

  const parsed = parseIsoDate(value);
  if (!parsed) {
    return "";
  }

  const order = toOrder(hass?.locale?.date_format);
  if (!order) {
    return formatIsoDate(parsed);
  }

  const separator = order[0] === "year" ? "-" : "/";
  return formatOrderedDate(parsed, getLocaleCode(hass), order, separator);
};

const normalizeWeekdays = (days: Weekday[]): Weekday[] =>
  Array.from(new Set(days)).sort((a, b) => a - b) as Weekday[];

const getUnitLabel = (unit: FrequencyUnit, count: number, localize: LocalizeFunc): string => {
  const keyBase =
    unit === "days"
      ? count === 1
        ? "component.maint.recurrence.unit.day_one"
        : "component.maint.recurrence.unit.day_other"
      : unit === "weeks"
        ? count === 1
          ? "component.maint.recurrence.unit.week_one"
          : "component.maint.recurrence.unit.week_other"
        : count === 1
          ? "component.maint.recurrence.unit.month_one"
          : "component.maint.recurrence.unit.month_other";
  const fallback =
    unit === "days"
      ? count === 1
        ? "day"
        : "days"
      : unit === "weeks"
        ? count === 1
          ? "week"
          : "weeks"
        : count === 1
          ? "month"
          : "months";
  return translateWithFallback(localize, keyBase, fallback, "count", count);
};

const formatDayList = (days: Weekday[], localize: LocalizeFunc): string => {
  const labels = getWeekdayLabels(localize);
  return normalizeWeekdays(days)
    .map((day) => labels[day] ?? day.toString())
    .join(", ");
};

export const formatRecurrence = (recurrence: Recurrence, localize: LocalizeFunc): string => {
  switch (recurrence.type) {
    case "interval": {
      const count = recurrence.every ?? 0;
      const unitLabel = getUnitLabel(recurrence.unit, count, localize);
      if (recurrence.unit === "days" && count === 1) {
        return translateWithFallback(
          localize,
          "component.maint.recurrence.every_day",
          "Every day"
        );
      }
      return translateWithFallback(
        localize,
        "component.maint.recurrence.every_interval",
        `Every ${count} ${unitLabel}`,
        "count",
        count,
        "unit",
        unitLabel
      );
    }
    case "weekly": {
      const every = Math.max(1, recurrence.every ?? 1);
      const labels = formatDayList(recurrence.days, localize);
      if (every === 1) {
        return translateWithFallback(
          localize,
          "component.maint.recurrence.weekly_on",
          `Weekly on ${labels}`,
          "days",
          labels
        );
      }
      return translateWithFallback(
        localize,
        "component.maint.recurrence.weekly_every_on",
        `Every ${every} weeks on ${labels}`,
        "count",
        every,
        "days",
        labels
      );
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
