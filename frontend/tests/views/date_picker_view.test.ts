import { describe, expect, it } from "vitest";

import "../../src/date-picker/view.js";
import { fixture, html } from "../helpers/dom.js";

describe("maint-date-picker", () => {
  it("renders days for the visible month and emits selection", async () => {
    const picker = await fixture<HTMLElement>(html`
      <maint-date-picker
        .open=${true}
        .value=${"2024-02-15"}
        .locale=${"en"}
        .weekStart=${1}
      ></maint-date-picker>
    `);

    const buttons = Array.from(picker.querySelectorAll("button.date-picker-day"));
    expect(buttons.length).toBe(42);

    const inMonth = buttons.find((btn) => !btn.classList.contains("muted") && btn.textContent?.trim() === "15");
    if (!inMonth) {
      throw new Error("Expected to find a day button for the selected date");
    }

    const selection = new Promise<CustomEvent>((resolve) => {
      picker.addEventListener("date-selected", (event) => resolve(event as CustomEvent));
    });

    (inMonth as HTMLButtonElement).click();
    const event = await selection;
    expect(event.detail).toEqual({ value: "2024-02-15" });
  });
});
