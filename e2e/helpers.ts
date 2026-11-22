import { expect, type Browser, type Page } from '@playwright/test';
import { devices } from '@playwright/test';

export async function newPlayer(browser: Browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], locale: 'vi-VN' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  return page;
}

export async function fillProfile(page: Page, name: string) {
  await page.getByTestId('name-input').fill(name);
  await page.getByTestId('save-profile').click();
}

/** Host creates a room from the game's setup screen; returns the room code. */
export async function createRoom(page: Page, name: string): Promise<string> {
  await page.getByTestId('create-room').click();
  await fillProfile(page, name);
  const code = page.getByTestId('room-code');
  await expect(code).toHaveText(/^\d{4}$/, { timeout: 15_000 });
  return (await code.textContent())!.trim();
}

export async function joinByLink(page: Page, code: string, name: string) {
  await page.goto(`/#/join/${code}`);
  await fillProfile(page, name);
}
