import type { HassConnection } from "./index.js";
import { formatDateInput, formatDatePlaceholder, getLocaleCode, parseDate } from "../formatting.js";

export const currentDateIso = (): string => {
  const today = new Date();
  const year = today.getFullYear().toString().padStart(4, "0");
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const currentDateInputValue = (hass?: HassConnection): string =>
  formatDateInput(currentDateIso(), hass);

export const datePlaceholder = (hass?: HassConnection, fallback?: string): string =>
  formatDatePlaceholder(hass) || fallback || "";

export const parseInputDate = (value: string | null | undefined, hass?: HassConnection): string | null =>
  parseDate(value, hass);

export const localeCode = (hass?: HassConnection): string | undefined => getLocaleCode(hass);
