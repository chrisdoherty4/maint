import { describe, expect, it } from "vitest";

import { DatePickerController } from "../../src/date-picker/controller.js";

describe("DatePickerController", () => {
  it("opens and closes for specific targets", () => {
    const controller = new DatePickerController();
    expect(controller.state.target).toBeNull();

    controller.open("create");
    expect(controller.state.target).toBe("create");

    controller.close();
    expect(controller.state.target).toBeNull();
  });

  it("toggles the active target", () => {
    const controller = new DatePickerController();

    controller.toggle("edit");
    expect(controller.state.target).toBe("edit");

    controller.toggle("edit");
    expect(controller.state.target).toBeNull();
  });
});
