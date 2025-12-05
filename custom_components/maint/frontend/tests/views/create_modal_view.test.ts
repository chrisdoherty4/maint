import { describe, expect, it } from "vitest";

import "../../src/task/create/view.js";
import { fixture, html } from "../helpers/dom.js";

describe("MaintCreateModal", () => {
  it("emits submit and cancel events", async () => {
    const el = await fixture<HTMLElement>(html`
      <maint-create-modal
        .open=${true}
        .busy=${false}
        .disabled=${false}
        .error=${null}
        .lastCompleted=${"2024-01-01"}
        .datePlaceholder=${"01/01/2024"}
        .locale=${"en"}
        .datePickerOpen=${false}
        .dateValue=${"2024-01-01"}
        .weekStart=${1}
        .recurrenceType=${"interval"}
        .panelText=${(key: string) => key}
        .localize=${(key: string) => key}
      ></maint-create-modal>
    `);

    const submitPromise = new Promise<CustomEvent>((resolve) =>
      el.addEventListener("create-submit", (event) => resolve(event as CustomEvent))
    );
    const cancelPromise = new Promise<CustomEvent>((resolve) =>
      el.addEventListener("create-cancel", (event) => resolve(event as CustomEvent))
    );

    const form = el.querySelector("form") as HTMLFormElement;
    (form.querySelector('input[name="description"]') as HTMLInputElement).value = "Task";
    (form.querySelector('input[name="last_completed"]') as HTMLInputElement).value = "2024-01-01";
    (form.querySelector('input[name="interval_every"]') as HTMLInputElement).value = "1";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    (el.querySelector("#cancel-create") as HTMLButtonElement).click();

    const submitEvent = await submitPromise;
    const cancelEvent = await cancelPromise;

    expect(submitEvent.detail?.formData).toBeInstanceOf(FormData);
    expect(cancelEvent.detail).toBeNull();
  });
});
