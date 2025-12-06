import type { HassConnection } from "../index.js";
import { deleteTask } from "../index.js";

export interface DeleteControllerState {
  taskId: string | null;
}

export class DeleteTaskController {
  constructor(private readonly onChange?: (state: DeleteControllerState) => void) {}

  public state: DeleteControllerState = {
    taskId: null
  };

  private setState(next: Partial<DeleteControllerState>): DeleteControllerState {
    this.state = { ...this.state, ...next };
    this.onChange?.(this.state);
    return this.state;
  }

  public prompt(taskId: string): DeleteControllerState {
    return this.setState({ taskId });
  }

  public cancel(): DeleteControllerState {
    return this.setState({ taskId: null });
  }

  public async confirm(
    hass: HassConnection,
    entryId: string,
    taskId: string
  ): Promise<{ ok: boolean; error?: unknown }> {
    try {
      await deleteTask(hass, entryId, taskId);
      this.setState({ taskId: null });
      return { ok: true };
    } catch (error) {
      console.error("Maint delete task failed", error);
      return { ok: false, error };
    }
  }
}
