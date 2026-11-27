/** Games and modes turned off or hidden by the owner (qa/test-cases.md: UX-30). */
import { expect, test } from '@playwright/test';
import { evidence, openApp } from './fixtures';

const CONFIG = {
  caro: { status: 'off' },
  noitu: { status: 'hidden' },
  coganh: { status: 'on', modes: { online: 'hidden' } },
  oanquan: { modes: { solo: 'off' } },
};

test('[UX-30] the owner can turn games and modes off or hide them', async ({ browser }) => {
  const { page, errors } = await openApp(browser);
  // what the owner set in the Firebase console, for this page only
  await page.route('**/config/games.json**', (r) =>
    r.fulfill({ contentType: 'application/json', body: JSON.stringify(CONFIG) }),
  );
  await page.goto('/');
  await expect(page.getByTestId('game-caro-off'), '[UX-30] caro not shown as off').toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId('game-noitu'), '[UX-30] hidden game still on the hub').toHaveCount(
    0,
  );
  await expect(page.getByTestId('game-caro')).toBeDisabled();
  await expect(page.getByTestId('game-coganh')).toBeEnabled();
  await evidence(page, 'config', 'D2', 'UX-30-hub');

  // a hidden or closed game opened by link
  for (const r of ['/#/noitu', '/#/caro', '/#/caro/play?mode=local&size=3']) {
    await page.goto(r);
    await expect(page.getByTestId('unavailable'), `[UX-30] ${r} still opens`).toBeVisible();
  }
  // modes
  await page.goto('/#/coganh');
  await expect(page.getByTestId('mode-solo')).toBeEnabled();
  await expect(page.getByTestId('mode-online'), '[UX-30] hidden mode shown').toHaveCount(0);
  await page.goto('/#/oanquan');
  await expect(page.getByTestId('mode-solo-off'), '[UX-30] off mode not marked').toBeVisible();
  await expect(page.getByTestId('mode-solo')).toBeDisabled();
  await expect(page.getByTestId('mode-local')).toBeEnabled();
  await page.goto('/#/oanquan/play?mode=solo&level=easy');
  await expect(page.getByTestId('unavailable'), '[UX-30] off mode opens by link').toBeVisible();
  await page.goto('/#/oanquan/play?mode=local');
  await expect(page.getByTestId('cell-1')).toBeVisible();
  expect(errors, '[UX-30] errors').toEqual([]);
});

test('[UX-30] offline, the last config is kept', async ({ browser }) => {
  const { page, ctx, errors } = await openApp(browser);
  await page.route('**/config/games.json**', (r) =>
    r.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ caro: { status: 'hidden' } }),
    }),
  );
  await page.goto('/');
  await page.getByTestId('game-oanquan').waitFor();
  await expect(page.getByTestId('game-caro')).toHaveCount(0, { timeout: 10_000 });
  await ctx.setOffline(true);
  await page.reload().catch(() => {}); // the dev server is offline too: the page may not reload
  await ctx.setOffline(false);
  await page.unroute('**/config/games.json**');
  await page.route('**/config/games.json**', (r) => r.abort());
  await page.goto('/');
  await page.getByTestId('game-oanquan').waitFor();
  await expect(page.getByTestId('game-caro'), '[UX-30] saved config forgotten').toHaveCount(0);
  expect(errors.filter((e) => !/ERR_INTERNET_DISCONNECTED|ERR_FAILED/.test(e))).toEqual([]);
});
