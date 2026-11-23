/** SEC – security checks that need the running app (qa/test-cases.md: SEC-02). */
import { expect, test } from '@playwright/test';
import { createRoomAs, joinAs, openApp, waitCountdown } from './fixtures';

// Names are limited to 20 characters, so use short markup that would render if injected.
const NAME = '<b>Bi</b><svg/onload=';

test('[SEC-02] HTML in a player name is shown as text and never runs', async ({ browser }) => {
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser);
  await a.page.goto('/#/numbers');
  await a.page.getByTestId('mode-online').click();
  await a.page.getByTestId('level-easy').click();
  const code = await createRoomAs(a.page, 'An');
  await joinAs(b.page, code, NAME.slice(0, 20));
  await waitCountdown(a.page);
  await expect(
    a.page.getByTestId('opp-score').locator('..'),
    '[SEC-02] name not shown as text',
  ).toContainText('<b>Bi</b>');
  const ran = await a.page.evaluate(() => (window as unknown as { __xss?: number }).__xss);
  expect(ran, '[SEC-02] script from a name ran').toBeUndefined();
  expect(
    await a.page.locator('.mini-player b, .mini-player svg').count(),
    '[SEC-02] HTML element injected',
  ).toBe(0);
});
