import { devices, expect, test } from '@playwright/test';
import { SKIP_WELCOME } from './helpers';
// Many random boards: the page must never become wider than the screen.
test('no overflow across 25 random boards per level', async ({ browser }) => {
  const page = await (
    await browser.newContext({
      ...devices['iPhone 14'],
      locale: 'vi-VN',
      storageState: SKIP_WELCOME,
    })
  ).newPage();
  for (const level of ['easy', 'medium', 'hard']) {
    for (let i = 0; i < 25; i++) {
      await page.goto(`/#/numbers/play?mode=practice&level=${level}&i=${i}`);
      await page.reload();
      await page.getByTestId('numbers-board').waitFor();
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(over, `${level} #${i}`).toBeLessThanOrEqual(0);
    }
  }
});
