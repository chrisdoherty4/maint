import type { HassConnection } from "../../src/task/index.js";

type ResponseMap = Array<unknown> | Record<string, unknown>;

export interface MockHassResult {
  hass: HassConnection;
  calls: unknown[];
}

export const createMockHass = (responses: ResponseMap = []): MockHassResult => {
  const calls: unknown[] = [];
  const hass: HassConnection = {
    callWS: async (params: unknown) => {
      calls.push(params);
      if (Array.isArray(responses)) {
        return responses.shift() as never;
      }
      const key = (params as { type?: string })?.type ?? "";
      return (responses as Record<string, unknown>)[key] as never;
    }
  };
  return { hass, calls };
};
