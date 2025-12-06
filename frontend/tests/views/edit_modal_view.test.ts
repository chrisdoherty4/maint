import { describe, expect, it } from "vitest";

import "../../src/task/update/view.js";
import type { EditFormState } from "../../src/task/update/view.js";
import { fixture, html } from "../helpers/dom.js";

const formState = (): EditFormState => ({
  description: "Task",
  last_completed: "2024-01-01",
  recurrence_type: "interval",
  interval_every: "1",
  interval_unit: "weeks",
  weekly_every: "1",
  weekly_days: []
});

describe("MaintEditModal", () => {
  it("emits submit and cancel events", async () => {
    const el = await fixture<HTMLElement>(html`
      <maint-edit-modal
        .open=${true}
        .busy=${false}
        .error=${null}
        .form=${formState()}
        .datePlaceholder=${"01/01/2024"}
        .locale=${"en"}
        .datePickerOpen=${false}
        .dateValue=${"2024-01-01"}
        .weekStart=${1}
        .panelText=${(key: string) => key}
        .localize=${(key: string) => key}
      ></maint-edit-modal>
    `);

    const submitPromise = new Promise<CustomEvent>((resolve) =>
      el.addEventListener("edit-submit", (event) => resolve(event as CustomEvent))
    );
    const cancelPromise = new Promise<CustomEvent>((resolve) =>
      el.addEventListener("edit-cancel", (event) => resolve(event as CustomEvent))
    );

    const form = el.querySelector("form") as HTMLFormElement;
    (form.querySelector('input[name="description"]') as HTMLInputElement).value = "Updated";
    (form.querySelector('input[name="last_completed"]') as HTMLInputElement).value = "2024-01-02";
    (form.querySelector('input[name="interval_every"]') as HTMLInputElement).value = "2";

    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    (el.querySelector("#cancel-edit") as HTMLButtonElement).click();

    const submitEvent = await submitPromise;
    const cancelEvent = await cancelPromise;

    expect(submitEvent.detail?.formData).toBeInstanceOf(FormData);
    expect(cancelEvent.detail).toBeNull();
  });
});
