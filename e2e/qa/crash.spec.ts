/** CR – crash resistance (qa/test-cases.md: CR-01 … CR-11). */
import { expect, test } from '@playwright/test';
import { createRoomAs, evidence, joinAs, openApp, settle, waitCountdown } from './fixtures';

const ROUTES = [
  '/',
  '/#/settings',
  '/#/about',
  '/#/debug',
  '/#/caro',
  '/#/caro/play?mode=solo&size=3&level=easy',
  '/#/caro/play?mode=solo&size=15&level=hard',
  '/#/caro/play?mode=local&size=3',
  '/#/numbers',
  '/#/coganh',
  '/#/coganh/play?mode=solo&level=hard',
  '/#/coganh/play?mode=local',
  '/#/oanquan',
  '/#/oanquan/play?mode=solo&level=hard',
  '/#/oanquan/play?mode=local',
  '/#/noitu',
  '/#/noitu/play?mode=solo&level=hard',
  '/#/noitu/play?mode=local',
  '/#/numbers/play?mode=bot&level=medium',
  '/#/numbers/play?mode=practice&level=hard',
  '/#/join',
  '/#/join/0000',
];

/**
 * True once the app has drawn something. Polls for up to 10 s: after a full reload
 * (e.g. going back past the first page and forward again) the app module loads
 * asynchronously, which can take a while when many tests run in parallel.
 */
async function rendered(page: import('@playwright/test').Page) {
  const has = () =>
    page.evaluate(() => (document.getElementById('root')?.innerText ?? '').trim().length > 0);
  for (let i = 0; i < 40; i++) {
    if (await has()) return true;
    await page.waitForTimeout(250);
  }
  return false;
}

test('[CR-01] no JS errors on any route', async ({ browser }) => {
  const { page, errors } = await openApp(browser, { name: 'Bé Na' });
  for (const r of ROUTES) {
    await page.goto(r);
    await page.reload();
    await settle(page, 600);
    expect.soft(await rendered(page), `[CR-01] ${r}: blank screen`).toBe(true);
  }
  expect(errors, '[CR-01] errors').toEqual([]);
});

test('[CR-02] unknown route goes home', async ({ browser }) => {
  const { page } = await openApp(browser);
  await page.goto('/#/this/does/not/exist');
  await expect(page.getByTestId('game-caro'), '[CR-02] not redirected home').toBeVisible();
});

test('[CR-03] bad URL parameters do not crash', async ({ browser }) => {
  const { page, errors } = await openApp(browser);
  const bad = [
    '/#/caro/play?mode=xyz&size=999&level=abc',
    '/#/caro/play?size=-1',
    '/#/caro/play',
    '/#/numbers/play?mode=bot&level=impossible',
    '/#/numbers/play?mode=zzz',
    '/#/numbers/play',
    '/#/join/abcd',
    '/#/join/123456789',
    '/#/room/xxxx',
  ];
  for (const r of bad) {
    await page.goto(r);
    await page.reload();
    await settle(page, 1500);
    expect.soft(await rendered(page), `[CR-03] ${r}: blank screen`).toBe(true);
  }
  expect(errors, '[CR-03] errors').toEqual([]);
});

test('[CR-04] corrupted saved data does not break the app', async ({ browser }) => {
  const cases: Record<string, string>[] = [
    {
      'fg:settings': 'not json{',
      'fg:profile': '###',
      'fg:onboarded': 'x',
      'fg:numbers-records': '[1,2',
    },
    { 'fg:settings': '{"theme":"neon","lang":"fr","sound":"yes","bigText":7}' },
    { 'fg:profile': '{"name":12345,"avatar":null}', 'fg:onboarded': '{"done":true}' },
    { 'fg:numbers-records': '{"easy":"fast","hard":-5}', 'fg:onboarded': '{"done":true}' },
    { 'fg:settings': 'null', 'fg:profile': '[]', 'fg:onboarded': 'null' },
  ];
  for (const [i, data] of cases.entries()) {
    const { page, errors, ctx } = await openApp(browser, {
      welcome: true,
      initScript: new Function(
        `if (sessionStorage.getItem('qa-bad')) return; sessionStorage.setItem('qa-bad','1');` +
          Object.entries(data)
            .map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`)
            .join(''),
      ) as () => void,
    });
    await page.goto('/');
    await settle(page, 800);
    expect.soft(await rendered(page), `[CR-04] case ${i + 1}: blank screen`).toBe(true);
    await page.goto('/#/numbers');
    await page
      .getByTestId('mode-practice')
      .click()
      .catch(() => {});
    await page.goto('/#/settings');
    await settle(page);
    expect.soft(await rendered(page), `[CR-04] case ${i + 1}: settings blank`).toBe(true);
    expect.soft(errors, `[CR-04] case ${i + 1} ${JSON.stringify(data)}: errors`).toEqual([]);
    await ctx.close();
  }
});

test('[CR-05] 300 random taps on the boards', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page, errors } = await openApp(browser);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  await page.goto('/#/numbers/play?mode=practice&level=hard');
  await waitCountdown(page);
  const box = (await page.getByTestId('numbers-board').boundingBox())!;
  for (let i = 0; i < 150; i++)
    await page.mouse.click(box.x + rnd() * box.width, box.y + rnd() * box.height);
  await page.goto('/#/caro/play?mode=solo&size=15&level=medium');
  await page.reload();
  const cb = (await page.getByTestId('caro-board').boundingBox())!;
  for (let i = 0; i < 150; i++) {
    await page.mouse.click(cb.x + rnd() * cb.width, cb.y + rnd() * cb.height, { delay: 0 });
    if (await page.getByTestId('result-title').isVisible())
      await page.getByTestId('play-again').click();
  }
  await settle(page, 800);
  const stones = await page.locator('.caro-cell.x, .caro-cell.o').count();
  const unique = await page.evaluate(() => document.querySelectorAll('.caro-cell').length);
  expect.soft(stones, '[CR-05] stone count exceeds board').toBeLessThanOrEqual(unique);
  expect(errors, '[CR-05] errors').toEqual([]);
});

test('[CR-06] rapid back/forward navigation', async ({ browser }) => {
  const { page, errors } = await openApp(browser);
  // Stay inside the app (a player cannot go back past its first screen), and press quickly:
  // don't wait for each page to finish loading.
  await page.goto(ROUTES[0]);
  for (const r of ROUTES.slice(0, 9)) await page.goto(r);
  const quick = { waitUntil: 'commit' } as const;
  for (let i = 0; i < 8; i++) {
    await page.goBack(quick);
    await page.goBack(quick);
    await page.goForward(quick);
  }
  expect(await page.evaluate(() => location.origin), '[CR-06] left the app').not.toBe('null');
  await settle(page, 800);
  expect(await rendered(page), '[CR-06] blank screen').toBe(true);
  expect(errors, '[CR-06] errors').toEqual([]);
});

test('[CR-07] losing the connection mid-game and getting it back', async ({ browser }) => {
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser, { name: 'Bình' });
  await a.page.goto('/#/caro');
  await a.page.getByTestId('mode-online').click();
  await a.page.getByTestId('size-3').click();
  const code = await createRoomAs(a.page, 'An');
  await joinAs(b.page, code, 'Bình');
  await expect(a.page.getByTestId('status')).toContainText('Đến lượt bạn', { timeout: 15_000 });
  await a.page.getByTestId('cell-0').click();
  await expect(b.page.getByTestId('status')).toContainText('Đến lượt bạn');
  await b.ctx.setOffline(true);
  await expect(
    b.page.getByTestId('offline'),
    '[CR-07] no offline notice for the player who lost the connection',
  ).toBeVisible({ timeout: 10_000 });
  await b.ctx.setOffline(false);
  await expect(
    b.page.getByTestId('offline'),
    '[CR-07] offline notice stays after reconnect',
  ).toBeHidden({ timeout: 15_000 });
  await b.page.getByTestId('cell-4').click();
  await expect(
    a.page.getByTestId('status'),
    '[CR-07] game did not continue after reconnect',
  ).toContainText('Đến lượt bạn', { timeout: 15_000 });
  const unexpected = [...a.errors, ...b.errors].filter((e) => !/ERR_INTERNET_DISCONNECTED/.test(e));
  expect(unexpected, '[CR-07] errors').toEqual([]);
});

test('[CR-08] reloading mid online game keeps the game', async ({ browser }) => {
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser, { name: 'Bình' });
  await a.page.goto('/#/caro');
  await a.page.getByTestId('mode-online').click();
  await a.page.getByTestId('size-3').click();
  const code = await createRoomAs(a.page, 'An');
  await joinAs(b.page, code, 'Bình');
  await expect(a.page.getByTestId('status')).toContainText('Đến lượt bạn', { timeout: 15_000 });
  await a.page.getByTestId('cell-0').click();
  await b.page.getByTestId('cell-4').click();
  await a.page.reload();
  await expect(
    a.page.locator('.caro-cell.x, .caro-cell.o'),
    '[CR-08] moves lost after reload',
  ).toHaveCount(2, { timeout: 15_000 });
  await expect(a.page.getByTestId('status'), '[CR-08] cannot continue').toContainText(
    'Đến lượt bạn',
  );
  expect([...a.errors, ...b.errors], '[CR-08] errors').toEqual([]);
});

test('[CR-09] 20 games in a row', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page, errors } = await openApp(browser);
  await page.goto('/#/caro/play?mode=local&size=3');
  const times: number[] = [];
  for (let g = 0; g < 20; g++) {
    const t0 = Date.now();
    for (const i of [0, 3, 1, 4, 2]) await page.getByTestId(`cell-${i}`).click();
    await page.getByTestId('play-again').click();
    times.push(Date.now() - t0);
  }
  const first = times.slice(0, 5).reduce((s, x) => s + x) / 5;
  const last = times.slice(-5).reduce((s, x) => s + x) / 5;
  expect
    .soft(last, `[CR-09] slowed down: first 5 avg ${first}ms, last 5 avg ${last}ms`)
    .toBeLessThan(first * 2 + 200);
  expect(errors, '[CR-09] errors').toEqual([]);
});

test('[CR-10] app works when the browser blocks storage', async ({ browser }) => {
  const { page, errors } = await openApp(browser, {
    initScript: () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('denied', 'SecurityError');
        },
      });
    },
  });
  await page.goto('/');
  await settle(page, 800);
  expect.soft(await rendered(page), '[CR-10] blank screen').toBe(true);
  await page.goto('/#/caro/play?mode=local&size=3');
  await page
    .getByTestId('cell-4')
    .click({ timeout: 5000 })
    .catch(() => {});
  await expect.soft(page.locator('.caro-cell.x'), '[CR-10] cannot play').toHaveCount(1);
  await evidence(page, 'crash', 'D2', 'CR-10-no-storage');
  expect(
    errors.filter((e) => !e.includes('fonts')),
    '[CR-10] errors',
  ).toEqual([]);
});

test('[CR-11] friend leaves mid-game', async ({ browser }) => {
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser, { name: 'Bình' });
  await a.page.goto('/#/numbers');
  await a.page.getByTestId('mode-online').click();
  await a.page.getByTestId('level-easy').click();
  const code = await createRoomAs(a.page, 'An');
  await joinAs(b.page, code, 'Bình');
  await waitCountdown(a.page);
  await a.page.getByTestId('num-1').click();
  await b.page.getByTestId('exit').click();
  await b.page.getByTestId('confirm-exit').click();
  await expect(a.page.getByText('Bình đã rời phòng'), '[CR-11] no notice').toBeVisible({
    timeout: 15_000,
  });
  await evidence(a.page, 'crash', 'D2', 'CR-11-friend-left');
  await a.page.getByTestId('exit').click();
  await expect(a.page.getByTestId('game-numbers'), '[CR-11] cannot leave').toBeVisible({
    timeout: 10_000,
  });
  expect([...a.errors, ...b.errors], '[CR-11] errors').toEqual([]);
});

test('[CR-12] joining by link with a saved name has no rejected writes', async ({ browser }) => {
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser, { name: 'Bình' }); // name already saved → joins straight away
  await a.page.goto('/#/caro');
  await a.page.getByTestId('mode-online').click();
  await a.page.getByTestId('size-3').click();
  const code = await createRoomAs(a.page, 'An');
  await b.page.goto(`/#/join/${code}`);
  await expect(b.page.getByTestId('caro-board'), '[CR-12] guest not in the game').toBeVisible({
    timeout: 15_000,
  });
  await b.page.waitForTimeout(1500);
  await expect(
    b.page.getByText('Không kết nối được'),
    '[CR-12] error shown to the guest',
  ).toHaveCount(0);
  expect([...a.errors, ...b.errors], '[CR-12] errors / rejected writes').toEqual([]);
});
