import { html, type TemplateResult } from "lit";

import type { HassConnection } from "../index.js";
import { DeleteTaskController, type DeleteControllerState } from "./controller.js";

type PanelTextFunc = (key: string, ...args: Array<string | number>) => string;

interface RenderContext {
  hass?: HassConnection;
  entryId: string | null;
  panelText: PanelTextFunc;
  taskTitle: string | null;
}

export interface DeleteFeatureState extends DeleteControllerState {
  busy: boolean;
}

export class DeleteTaskFeature extends EventTarget {
  private hass?: HassConnection;
  private entryId: string | null = null;
  private panelText: PanelTextFunc | null = null;
  private taskTitle: string | null = null;

  public state: DeleteFeatureState = { taskId: null, busy: false };
  private readonly controller: DeleteTaskController;

  constructor(private readonly onStateChange?: (state: DeleteFeatureState) => void) {
    super();
    this.controller = new DeleteTaskController((next) => this.setState(next));
  }

  private setState(next: Partial<DeleteFeatureState>): DeleteFeatureState {
    this.state = { ...this.state, ...next };
    this.onStateChange?.(this.state);
    return this.state;
  }

  private applyContext(ctx: RenderContext): void {
    this.hass = ctx.hass;
    this.entryId = ctx.entryId;
    this.panelText = ctx.panelText;
    this.taskTitle = ctx.taskTitle;
  }

  public render(ctx: RenderContext): TemplateResult | null {
    this.applyContext(ctx);
    if (!this.panelText) {
      return null;
    }

    return html`
      <maint-delete-modal
        .open=${Boolean(this.state.taskId)}
        .busy=${this.state.busy}
        .taskTitle=${this.taskTitle}
        .panelText=${this.panelText}
        @confirm-delete=${this.handleConfirm}
        @cancel-delete=${this.handleCancel}
      ></maint-delete-modal>
    `;
  }

  public prompt(taskId: string): void {
    this.setState(this.controller.prompt(taskId));
  }

  public cancel(): void {
    this.setState({ busy: false, ...this.controller.cancel() });
  }

  private handleCancel = (): void => {
    this.cancel();
  };

  private readonly handleConfirm = async (): Promise<void> => {
    const taskId = this.state.taskId;
    if (!this.entryId || !taskId || !this.hass || !this.panelText) {
      return;
    }

    this.setState({ busy: true });
    this.dispatchEvent(new CustomEvent("delete-busy-start"));
    try {
      const result = await this.controller.confirm(this.hass, this.entryId, taskId);
      if (!result.ok) {
        this.dispatchEvent(
          new CustomEvent("delete-error", { detail: this.panelText("errors.delete") })
        );
        return;
      }

      this.dispatchEvent(
        new CustomEvent("task-deleted", { detail: { taskId } })
      );
      this.cancel();
    } finally {
      this.setState({ busy: false });
      this.dispatchEvent(new CustomEvent("delete-busy-end"));
    }
  };
}
