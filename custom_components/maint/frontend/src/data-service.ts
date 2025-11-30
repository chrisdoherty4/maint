import {
  createTask,
  deleteTask,
  fetchEntries,
  fetchTasks,
  updateTask,
  type HassConnection,
  type MaintEntry,
  type MaintTask,
  type TaskPayload
} from "./api.js";
import { normalizeTask } from "./formatting.js";

export const loadEntries = (hass: HassConnection): Promise<MaintEntry[]> =>
  fetchEntries(hass);

export const loadTasks = async (
  hass: HassConnection,
  entryId: string
): Promise<MaintTask[]> => {
  const tasks = await fetchTasks(hass, entryId);
  return tasks.map((task) => normalizeTask(task));
};

export const createMaintTask = async (
  hass: HassConnection,
  entryId: string,
  payload: TaskPayload
): Promise<MaintTask> => normalizeTask(await createTask(hass, entryId, payload));

export const updateMaintTask = async (
  hass: HassConnection,
  entryId: string,
  taskId: string,
  payload: TaskPayload
): Promise<MaintTask> => normalizeTask(await updateTask(hass, entryId, taskId, payload));

export const deleteMaintTask = (
  hass: HassConnection,
  entryId: string,
  taskId: string
): Promise<void> => deleteTask(hass, entryId, taskId);
