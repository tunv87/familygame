/**
 * Smoke checks that every browser must pass (qa/test-cases.md: BR-01 … BR-07).
 * Run in Chromium by `npm run qa`, and in Firefox, Edge and Safari (desktop and mobile) by
 * qa/playwright.browsers.config.ts in CI.
 */
import { expect, test } from '@playwright/test';
import { QA_PROJECT, createRoomAs, deviceById, evidence, joinAs, openApp } from './fixtures';

const MOBILE = QA_PROJECT.startsWith('mobile');
const DEVICE = deviceById(MOBILE ? 'D2' : 'D8');
const TAG = `${QA_PROJECT} ${DEVICE.id}`;

const ROUTES = [
  '/',
  '/#/settings',
  '/#/about',
  '/#/caro',
  '/#/caro/play?mode=local&size=3',
  '/#/caro/play?mode=local&size=15',
  '/#/coganh/play?mode=local',
  '/#/oanquan/play?mode=local',
  '/#/noitu/play?mode=local',
  '/#/cangua',
  '/#/numbers',
  '/#/numbers/play?mode=practice&level=easy',
  '/#/join',
];

test(`[BR-01] every screen opens without errors (${TAG})`, async ({ browser }) => {
  const { page, errors, ctx } = await openApp(browser, { device: DEVICE });
  for (const r of ROUTES) {
    await page.goto(r);
    await expect(page.locator('main'), `[BR-01] ${r} blank`).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect.soft(overflow, `[BR-01] ${r}: horizontal overflow`).toBeLessThanOrEqual(0);
  }
  await page.goto('/');
  await evidence(page, 'browsers', TAG.replace(' ', '-'), 'BR-01-hub');
  expect(errors, '[BR-01] errors').toEqual([]);
  await ctx.close();
});

test(`[BR-02] Vietnamese text uses the bundled font (${TAG})`, async ({ browser }) => {
  const { page, ctx } = await openApp(browser, { device: DEVICE });
  await page.goto('/');
  await page.getByTestId('game-oanquan').waitFor();
  const r = await page.evaluate(async () => {
    await document.fonts.ready;
    const el = document.querySelector('[data-testid="game-oanquan"]')!;
    // ask for the Vietnamese letters: the browser must find them in the bundled Nunito files
    const faces = await document.fonts.load('700 20px Nunito', 'Ô ăn quan Cờ gánh Nối từ ỗ ữ ặ');
    return {
      family: getComputedStyle(el).fontFamily,
      faces: faces.length,
      loaded: faces.every((f) => f.status === 'loaded'),
    };
  });
  expect(r.family, '[BR-02] not Nunito').toMatch(/Nunito/);
  expect(r.faces, '[BR-02] no Nunito font file covers Vietnamese').toBeGreaterThan(0);
  expect(r.loaded, '[BR-02] Vietnamese glyphs of Nunito not loaded').toBe(true);
  await ctx.close();
});

test(`[BR-03] one move in every game (${TAG})`, async ({ browser }) => {
  const { page, errors, ctx } = await openApp(browser, { device: DEVICE });
  // Cờ ca rô
  await page.goto('/#/caro/play?mode=local&size=3');
  await page.getByTestId('cell-4').click();
  await expect(page.locator('.caro-cell.x, .caro-cell.o'), '[BR-03] caro').toHaveCount(1);
  // Cờ gánh: Black (0,2) → (1,2)
  await page.goto('/#/coganh/play?mode=local');
  await page.getByTestId('pt-10').click();
  await page.getByTestId('pt-11').click();
  await expect(page.getByTestId('pt-11'), '[BR-03] cờ gánh').toHaveClass(/black/);
  // Ô ăn quan: sow, skip the replay
  await page.goto('/#/oanquan/play?mode=local');
  await page.getByTestId('cell-1').dispatchEvent('pointerdown');
  await page.getByTestId('dir-right').click();
  await page.getByTestId('cell-8').dispatchEvent('pointerdown');
  await expect(page.getByTestId('me-score'), '[BR-03] ô ăn quan').toHaveText('6');
  // Tìm số: practice, find 1
  await page.goto('/#/numbers/play?mode=practice&level=easy');
  await page.getByTestId('num-1').waitFor();
  await page.waitForTimeout(3600); // 3-2-1 countdown
  await page.getByTestId('num-1').click();
  await expect(page.getByTestId('num-1'), '[BR-03] tìm số').toHaveClass(/claimed/);
  expect(errors, '[BR-03] errors').toEqual([]);
  await ctx.close();
});

test(`[BR-04] typing Vietnamese with tone marks in Nối từ (${TAG})`, async ({ browser }) => {
  const { page, errors, ctx } = await openApp(browser, { device: DEVICE });
  await page.goto('/#/noitu/play?mode=local');
  await page.getByTestId('nt-input').waitFor({ timeout: 15_000 });
  await page.getByTestId('nt-hint').click();
  const word = await page.getByTestId('nt-input').inputValue();
  await page.getByTestId('nt-input').fill('');
  // type it key by key (composed characters), as a keyboard would
  await page.getByTestId('nt-input').pressSequentially(word);
  await page.getByTestId('nt-go').click();
  await expect(page.getByTestId('nt-word-1'), '[BR-04] typed word not accepted').toBeVisible();
  await expect(page.getByTestId('nt-word-1')).toContainText(word);
  await evidence(page, 'browsers', TAG.replace(' ', '-'), 'BR-04-noitu');
  expect(errors, '[BR-04] errors').toEqual([]);
  await ctx.close();
});

test(`[BR-05] sounds play after the first tap (${TAG})`, async ({ browser }) => {
  const { page, ctx } = await openApp(browser, { device: DEVICE, sound: true });
  await page.goto('/#/numbers/play?mode=practice&level=easy');
  await page.getByTestId('num-1').waitFor();
  await page.mouse.click(5, 5); // first tap unlocks audio
  await page.waitForTimeout(4000);
  const played = await page.evaluate(
    () => (window as unknown as { __fgSounds?: string[] }).__fgSounds ?? [],
  );
  expect(played, '[BR-05] countdown sound not played').toContain('go');
  await ctx.close();
});

test(`[BR-06] boards are big enough (${TAG})`, async ({ browser }) => {
  const { page, ctx } = await openApp(browser, { device: DEVICE });
  for (const [route, id] of [
    ['/#/coganh/play?mode=local', 'cg-board'],
    ['/#/caro/play?mode=local&size=3', 'caro-board'],
  ]) {
    await page.goto(route);
    const r = await page.getByTestId(id).evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { h: b.height / innerHeight, w: b.width / innerWidth };
    });
    // computers: tall boards; phones: boards as wide as the screen allows
    if (MOBILE)
      expect.soft(r.w, `[BR-06] ${id} width ${Math.round(r.w * 100)}%`).toBeGreaterThan(0.85);
    else expect.soft(r.h, `[BR-06] ${id} height ${Math.round(r.h * 100)}%`).toBeGreaterThan(0.75);
  }
  await ctx.close();
});

test(`[BR-07] online room between two players (${TAG})`, async ({ browser }) => {
  const a = await openApp(browser, { device: DEVICE, name: 'An' });
  const b = await openApp(browser, { device: DEVICE, name: 'Bình' });
  await a.page.goto('/#/caro');
  await a.page.getByTestId('mode-online').click();
  await a.page.getByTestId('size-3').click();
  const code = await createRoomAs(a.page, 'An');
  await joinAs(b.page, code, 'Bình');
  await expect(a.page.getByTestId('status'), '[BR-07] game did not start').toContainText(
    'Đến lượt bạn',
    { timeout: 20_000 },
  );
  await a.page.getByTestId('cell-4').click();
  await expect(b.page.locator('.caro-cell.x, .caro-cell.o'), '[BR-07] move not synced').toHaveCount(
    1,
    { timeout: 15_000 },
  );
  expect([...a.errors, ...b.errors], '[BR-07] errors').toEqual([]);
  await a.ctx.close();
  await b.ctx.close();
});
