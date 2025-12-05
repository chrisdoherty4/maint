import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("maint-delete-modal")
export class MaintDeleteModal extends LitElement {
  @property({ type: Boolean }) public open = false;
  @property({ type: Boolean }) public busy = false;
  @property({ type: String }) public taskTitle: string | null = null;
  @property({ attribute: false }) public panelText?: (key: string, ...args: Array<string | number>) => string;

  protected createRenderRoot() {
    // Render in light DOM so shared styles apply.
    return this;
  }

  protected render() {
    if (!this.open || !this.panelText || !this.taskTitle) {
      return nothing;
    }

    return html`
      <div class="modal-backdrop">
        <div class="modal">
          <h3>${this.panelText("modals.delete_title")}</h3>
          <p>
            ${this.panelText("modals.delete_prompt", "task", this.taskTitle)}
          </p>
          <div class="modal-actions">
            <button
              type="button"
              class="button-secondary"
              id="cancel-delete"
              ?disabled=${this.busy}
              @click=${this.handleCancel}
            >
              ${this.panelText("buttons.cancel")}
            </button>
            <button
              type="button"
              class="button-danger"
              id="confirm-delete"
              ?disabled=${this.busy}
              @click=${this.handleConfirm}
            >
              ${this.panelText("buttons.delete")}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private handleConfirm(): void {
    this.dispatchEvent(
      new CustomEvent("confirm-delete", { bubbles: true, composed: true })
    );
  }

  private handleCancel(): void {
    this.dispatchEvent(
      new CustomEvent("cancel-delete", { bubbles: true, composed: true })
    );
  }
}
