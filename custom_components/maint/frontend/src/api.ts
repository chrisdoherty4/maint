import type { HassConnection, MaintEntry, MaintTask, TaskPayload } from "./types.js";

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
