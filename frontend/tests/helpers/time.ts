import { vi } from "vitest";

export const setSystemDate = (isoDate: string): (() => void) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(isoDate));
  return () => {
    vi.useRealTimers();
  };
};
