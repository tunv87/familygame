/** Play counter on the hub and on each game page (qa/test-cases.md: UX-29). */
import { expect, test, type Page } from '@playwright/test';
import { openApp } from './fixtures';

const countOn = async (page: Page) =>
  Number(await page.getByTestId('play-count').getAttribute('data-count'));
/** the numbers are read when a page opens: open it again to see new plays */
const freshCount = async (page: Page, path: string) => {
  await page.goto('about:blank');
  await page.goto(path);
  await page.getByTestId('play-count').waitFor({ timeout: 10_000 });
  return countOn(page);
};

test('[UX-29] starting a game adds one play; the hub shows all games together', async ({
  browser,
}) => {
  const { page, errors } = await openApp(browser);
  await page.goto('/#/caro');
  await expect(page.getByTestId('play-count'), '[UX-29] no counter on the game page').toBeVisible({
    timeout: 15_000,
  });
  const caro = await countOn(page);
  await page.goto('/');
  await expect(page.getByTestId('play-count')).toBeVisible({ timeout: 15_000 });
  const total = await countOn(page);
  expect(total).toBeGreaterThanOrEqual(caro);

  // one game on this device, then a new round: two plays
  await page.goto('/#/caro/play?mode=local&size=3');
  for (const i of [0, 3, 1, 4, 2]) await page.getByTestId(`cell-${i}`).click();
  await page.getByTestId('play-again').click();
  // a play is sent a moment after the round starts (a real round lasts much longer)
  await page.waitForTimeout(1500);
  await expect
    .poll(() => freshCount(page, '/#/caro'), {
      message: '[UX-29] caro plays not counted',
      timeout: 20_000,
    })
    .toBeGreaterThanOrEqual(caro + 2); // other tests running at the same time add plays too
  await expect(page.getByTestId('play-count')).toContainText('lượt chơi');
  await expect
    .poll(() => freshCount(page, '/'), { timeout: 20_000 })
    .toBeGreaterThanOrEqual(total + 2);
  expect(errors, '[UX-29] errors').toEqual([]);
});

test('[UX-29] offline: no counter and no errors from it', async ({ browser }) => {
  const { page, errors, ctx } = await openApp(browser);
  await page.goto('/');
  await page.getByTestId('play-count').waitFor({ timeout: 15_000 });
  await ctx.setOffline(true);
  // a game started offline is simply not counted
  await page.getByTestId('game-caro').click();
  await page.getByTestId('mode-local').click();
  await page.getByTestId('size-3').click();
  await page.getByTestId('cell-4').click();
  await page.waitForTimeout(1000);
  expect(
    errors.filter((e) => /stats\/plays|\[plays\]/.test(e)),
    '[UX-29] counter errors offline',
  ).toEqual([]);
  await ctx.setOffline(false);
});
