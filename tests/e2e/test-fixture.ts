import { test as base, expect } from '@playwright/test';
export const test = base.extend({
  context: async ({ context }, provideContext) => {
    await context.addInitScript(() => {
      try {
        localStorage.setItem('lumen.welcome.v1', 'seen');
      } catch {}
    });
    await provideContext(context);
  },
});
export { expect };

export type { Locator, Page } from '@playwright/test';
