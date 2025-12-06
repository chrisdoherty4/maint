import { parseDate, type LocalizeFunc } from "../formatting.js";

const DOMAIN = "maint";

export type FrequencyUnit = "days" | "weeks" | "months";
export type RecurrenceType = "interval" | "weekly";
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type IntervalRecurrence = {
  type: "interval";
  every: number;
  unit: FrequencyUnit;
};

export type WeeklyRecurrence = {
  type: "weekly";
  every: number;
  days: Weekday[];
};

export type Recurrence = IntervalRecurrence | WeeklyRecurrence;

type WsValue =
  | string
  | number
  | boolean
  | null
  | Recurrence
  | RecurrenceType
  | FrequencyUnit
  | string[];
type WsRequest = { type: string } & Record<string, WsValue>;

export interface MaintEntry {
  entry_id: string;
  title: string;
}

export interface MaintTask {
  task_id: string;
  description: string;
  last_completed: string | null;
  recurrence: Recurrence;
  next_scheduled?: string | null;
}

export interface TaskPayload {
  description: string;
  last_completed: string;
  recurrence: Recurrence;
}

export interface HassConnection {
  callWS<T>(params: WsRequest): Promise<T>;
  localize?(key: string, ...args: Array<string | number>): string;
  language?: string;
  locale?: { language?: string; date_format?: string };
}

export interface ValidationResult {
  values?: TaskPayload;
  error?: string;
}

type ScalarField = string | number | boolean | FormDataEntryValue | null | undefined;
type RecurrenceTypeField = ScalarField | RecurrenceType;
type FrequencyUnitField = ScalarField | "days" | "weeks" | "months";
type WeeklyDaysField = ScalarField | ScalarField[] | Weekday[];
type WeeklyEveryField = ScalarField;

export interface TaskFields {
  description?: ScalarField;
  last_completed?: ScalarField;
  recurrence_type?: RecurrenceTypeField;
  interval_every?: ScalarField;
  interval_unit?: FrequencyUnitField;
  weekly_days?: WeeklyDaysField;
  weekly_every?: WeeklyEveryField;
}

const normalizeWeekdays = (days: Weekday[] = []): Weekday[] => {
  const unique = Array.from(new Set(days));
  const sorted = unique.sort((a, b) => a - b) as Weekday[];
  return sorted;
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

const toRecurrenceType = (value: RecurrenceTypeField): RecurrenceType => {
  const normalized = (value ?? "interval").toString();
  if (normalized === "interval" || normalized === "weekly") {
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
  fields: TaskFields,
  localize: LocalizeFunc
): { ok: true; value: Recurrence } | { ok: false; error?: string } => {
  const type = toRecurrenceType(fields.recurrence_type);

  if (type === "interval") {
    const every = parsePositiveInt(fields.interval_every);
    const unit = (fields.interval_unit ?? "").toString();
    if (!every) {
      return {
        ok: false,
        error: localize("component.maint.panel.validation.interval_every_required")
      };
    }
    if (unit !== "days" && unit !== "weeks" && unit !== "months") {
      return {
        ok: false,
        error: localize("component.maint.panel.validation.interval_unit_required")
      };
    }
    return { ok: true, value: { type: "interval", every, unit } };
  }

  if (type === "weekly") {
    const everyWeeks = parsePositiveInt(fields.weekly_every ?? "1");
    if (!everyWeeks) {
      return {
        ok: false,
        error: localize("component.maint.panel.validation.weekly_every_required")
      };
    }
    const days = parseWeekdays(fields.weekly_days);
    if (!days) {
      return {
        ok: false,
        error: localize("component.maint.panel.validation.weekly_days_required")
      };
    }
    if (everyWeeks === 1 && days.length === 7) {
      return { ok: true, value: { type: "interval", every: 1, unit: "days" } };
    }
    return { ok: true, value: { type: "weekly", every: everyWeeks, days } };
  }

  return { ok: false, error: localize("component.maint.panel.validation.schedule_required") };
};

export const validateTaskFields = (
  fields: TaskFields,
  localize: LocalizeFunc,
  hass?: HassConnection
): ValidationResult => {
  const description = (fields.description ?? "").toString().trim();
  if (!description) {
    return { error: localize("component.maint.panel.validation.description_required") };
  }

  const lastCompleted = parseDate(fields.last_completed, hass);
  if (lastCompleted === null) {
    return { error: localize("component.maint.panel.validation.last_completed_invalid") };
  }

  const recurrence = parseRecurrence(fields, localize);
  if (!recurrence.ok) {
    return { error: recurrence.error ?? localize("component.maint.panel.validation.schedule_required") };
  }

  return {
    values: {
      description,
      last_completed: lastCompleted,
      recurrence: recurrence.value
    }
  };
};

export const listEntries = (hass: HassConnection): Promise<MaintEntry[]> =>
  hass.callWS<MaintEntry[]>({
    type: "config_entries/get",
    domain: DOMAIN
  });

export const listTasks = async (hass: HassConnection, entryId: string): Promise<MaintTask[]> => {
  const tasks = await hass.callWS<MaintTask[]>({
    type: "maint/task/list",
    entry_id: entryId
  });
  return tasks.map((task) => normalizeTask(task));
};

export const createTask = async (
  hass: HassConnection,
  entryId: string,
  payload: TaskPayload
): Promise<MaintTask> =>
  normalizeTask(
    await hass.callWS<MaintTask>({
      type: "maint/task/create",
      entry_id: entryId,
      ...payload
    })
  );

export const updateTask = async (
  hass: HassConnection,
  entryId: string,
  taskId: string,
  payload: TaskPayload
): Promise<MaintTask> =>
  normalizeTask(
    await hass.callWS<MaintTask>({
      type: "maint/task/update",
      entry_id: entryId,
      task_id: taskId,
      ...payload
    })
  );

export const deleteTask = (hass: HassConnection, entryId: string, taskId: string): Promise<void> =>
  hass.callWS<void>({
    type: "maint/task/delete",
    entry_id: entryId,
    task_id: taskId
  });
