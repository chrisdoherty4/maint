import { describe, expect, it } from "vitest";

import "../../src/task/delete/view.js";
import { fixture, html } from "../helpers/dom.js";

describe("MaintDeleteModal", () => {
  it("renders prompt and bubbles events", async () => {
    const el = await fixture<HTMLDivElement>(html`
      <maint-delete-modal
        .open=${true}
        .busy=${false}
        .taskTitle=${"Filter change"}
        .panelText=${(key: string) => key}
      ></maint-delete-modal>
    `);

    const modal = el as unknown as HTMLElement;
    const confirmSpy = new Promise<CustomEvent>((resolve) =>
      modal.addEventListener("confirm-delete", (event) => resolve(event as CustomEvent))
    );
    const cancelSpy = new Promise<CustomEvent>((resolve) =>
      modal.addEventListener("cancel-delete", (event) => resolve(event as CustomEvent))
    );

    (modal.querySelector("#confirm-delete") as HTMLButtonElement).click();
    (modal.querySelector("#cancel-delete") as HTMLButtonElement).click();

    const confirmEvent = await confirmSpy;
    const cancelEvent = await cancelSpy;

    expect(confirmEvent.detail).toBeNull();
    expect(cancelEvent.detail).toBeNull();
  });
});
