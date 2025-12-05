import { elementUpdated, fixture, html } from "@open-wc/testing";

export { elementUpdated, fixture, html };

export const waitForUpdate = async <T extends Element>(el: T): Promise<T> => {
  await elementUpdated(el);
  return el;
};
