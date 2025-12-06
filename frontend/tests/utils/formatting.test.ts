import { describe, expect, it } from "vitest";

import { formatDateInput, parseDate } from "../../src/formatting.js";
import type { HassConnection } from "../../src/task/index.js";

const hass: HassConnection = {
  callWS: async () => {
    return {} as never;
  },
  locale: { language: "en", date_format: "dmy" }
};

describe("formatting utils", () => {
  it("parses user-formatted dates into ISO", () => {
    expect(parseDate("31/01/2024", hass)).toBe("2024-01-31");
  });

  it("formats ISO dates using user date order", () => {
    expect(formatDateInput("2024-02-05", hass)).toBe("05/02/2024");
  });
});
