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
  days: Weekday[];
};

export type Recurrence =
  | IntervalRecurrence
  | WeeklyRecurrence;

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
  callWS<T>(params: Record<string, unknown>): Promise<T>;
}

const DOMAIN = "maint";

export const fetchEntries = (hass: HassConnection): Promise<MaintEntry[]> =>
  hass.callWS<MaintEntry[]>({
    type: "config_entries/get",
    domain: DOMAIN
  });

export const fetchTasks = (hass: HassConnection, entryId: string): Promise<MaintTask[]> =>
  hass.callWS<MaintTask[]>({
    type: "maint/task/list",
    entry_id: entryId
  });

export const createTask = (
  hass: HassConnection,
  entryId: string,
  payload: TaskPayload
): Promise<MaintTask> =>
  hass.callWS<MaintTask>({
    type: "maint/task/create",
    entry_id: entryId,
    ...payload
  });

export const updateTask = (
  hass: HassConnection,
  entryId: string,
  taskId: string,
  payload: TaskPayload
): Promise<MaintTask> =>
  hass.callWS<MaintTask>({
    type: "maint/task/update",
    entry_id: entryId,
    task_id: taskId,
    ...payload
  });

export const deleteTask = (hass: HassConnection, entryId: string, taskId: string): Promise<void> =>
  hass.callWS<void>({
    type: "maint/task/delete",
    entry_id: entryId,
    task_id: taskId
  });
