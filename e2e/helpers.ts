import { expect, type Browser, type Page } from '@playwright/test';
import { devices } from '@playwright/test';

export const BASE_URL = 'http://127.0.0.1:5174';

/** Storage state that marks the first-launch welcome as done, so tests start at the hub. */
export const SKIP_WELCOME = {
  cookies: [],
  origins: [{ origin: BASE_URL, localStorage: [{ name: 'fg:onboarded', value: '{"done":true}' }] }],
};

export async function newPlayer(browser: Browser) {
  const ctx = await browser.newContext({
    ...devices['iPhone 14'],
    locale: 'vi-VN',
    storageState: SKIP_WELCOME,
  });
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

/** Each player taps Ready in the waiting room (an online game starts once everyone has). */
export async function readyUp(...pages: Page[]) {
  for (const p of pages) {
    const btn = p.getByTestId('ready');
    await btn.click({ timeout: 15_000 });
    // pressed, or already gone because that was the last Ready and the game started
    await expect(async () => {
      // (a short timeout: the button can vanish between the two calls when the game starts)
      if (await btn.count())
        expect(await btn.getAttribute('aria-pressed', { timeout: 300 })).toBe('true');
    }).toPass({ timeout: 10_000 });
  }
}
