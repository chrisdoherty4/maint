import type { HassConnection, MaintEntry, MaintTask } from "../index.js";
import { nextScheduled, parseIsoDate } from "../../formatting.js";
import { listEntries, listTasks } from "../index.js";

export interface TaskListState {
  entries: MaintEntry[];
  selectedEntryId: string | null;
  tasks: MaintTask[];
  busy: boolean;
  error: string | null;
}

export class TaskListController {
  public state: TaskListState = {
    entries: [],
    selectedEntryId: null,
    tasks: [],
    busy: false,
    error: null
  };

  private setState(next: Partial<TaskListState>): TaskListState {
    this.state = { ...this.state, ...next };
    return this.state;
  }

  public setError(error: string | null): TaskListState {
    return this.setState({ error });
  }

  public setSelectedEntry(entryId: string | null): TaskListState {
    return this.setState({ selectedEntryId: entryId });
  }

  public setTasks(tasks: MaintTask[]): TaskListState {
    return this.setState({ tasks });
  }

  public sortTasks(tasks: MaintTask[]): MaintTask[] {
    const nextTimestamp = (task: MaintTask): number | null => {
      const next = nextScheduled(task);
      if (!next) {
        return null;
      }

      const parsed = parseIsoDate(next);
      return parsed ? parsed.getTime() : null;
    };

    return [...tasks].sort((a, b) => {
      const aDue = this.isTaskDue(a);
      const bDue = this.isTaskDue(b);
      if (aDue !== bDue) {
        return aDue ? -1 : 1;
      }

      const aNext = nextTimestamp(a);
      const bNext = nextTimestamp(b);
      if (aNext !== null && bNext !== null && aNext !== bNext) {
        return aNext - bNext;
      }

      if (aNext === null && bNext !== null) {
        return 1;
      }

      if (aNext !== null && bNext === null) {
        return -1;
      }

      return a.description.toLowerCase().localeCompare(b.description.toLowerCase());
    });
  }

  private isTaskDue(task: MaintTask): boolean {
    const next = nextScheduled(task);
    if (!next) {
      return false;
    }

    const nextDate = parseIsoDate(next);
    if (!nextDate) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return nextDate <= today;
  }

  public async fetchEntries(hass: HassConnection): Promise<TaskListState> {
    this.setState({ busy: true, error: null });
    try {
      const entries = await listEntries(hass);
      let selectedEntryId = this.state.selectedEntryId;
      if (entries.length && !selectedEntryId) {
        selectedEntryId = entries[0].entry_id;
      }
      this.setState({ entries, selectedEntryId });
      if (selectedEntryId) {
        await this.fetchTasks(hass, selectedEntryId);
      } else {
        this.setState({ tasks: [] });
      }
    } catch (error) {
      console.error("Maint task list controller failed to load entries", error);
      this.setState({ error: "errors.load_entries" });
    } finally {
      this.setState({ busy: false });
    }
    return this.state;
  }

  public async fetchTasks(hass: HassConnection, entryId: string): Promise<TaskListState> {
    this.setState({ busy: true, error: null });
    try {
      const tasks = await listTasks(hass, entryId);
      this.setState({ tasks: this.sortTasks(tasks) });
    } catch (error) {
      console.error("Maint task list controller failed to load tasks", error);
      this.setState({ error: "errors.load_tasks" });
    } finally {
      this.setState({ busy: false });
    }
    return this.state;
  }
}
