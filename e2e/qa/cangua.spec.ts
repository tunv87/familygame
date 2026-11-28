/** Cờ cá ngựa online for three players through the real UI (qa/test-cases.md). */
import { expect, test, type Page } from '@playwright/test';
import { createRoomAs, evidence, joinAs, openApp } from './fixtures';

const positions = (p: Page) =>
  p
    .locator('[data-testid^="horse-"]')
    .evaluateAll((els) =>
      els.map((e) => `${e.getAttribute('data-testid')}=${e.getAttribute('data-pos')}`).join(' '),
    );

test('[UX-28] three players: the host starts, everyone rolls and moves, boards agree', async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser, { name: 'Bình' });
  const c = await openApp(browser, { name: 'Chi' });
  await a.page.goto('/#/cangua');
  await a.page.getByTestId('mode-online').click();
  await expect(a.page.getByTestId('cn-intro')).toBeVisible();
  const code = await createRoomAs(a.page, 'An');
  await expect(a.page.getByTestId('start-game'), '[UX-28] start with one player').toBeDisabled();
  await joinAs(b.page, code, 'Bình');
  await joinAs(c.page, code, 'Chi');
  await expect(a.page.getByTestId('start-game')).toContainText('3', { timeout: 15_000 });
  await expect(b.page.getByTestId('start-game'), '[UX-28] only the host starts').toHaveCount(0);
  await evidence(a.page, 'cangua', 'D2', 'UX-28-lobby');
  await a.page.getByTestId('start-game').click();
  for (const p of [a, b, c]) await p.page.getByTestId('cn-board').waitFor({ timeout: 15_000 });
  // three colours: red, blue, green → 12 horses on the board
  await expect(a.page.locator('[data-testid^="horse-"]')).toHaveCount(12);

  // play 30 actions: whoever may roll rolls, whoever has glowing horses moves the first one
  const pages = [a.page, b.page, c.page];
  let moved = 0;
  for (let i = 0; i < 30; i++) {
    let acted = false;
    for (const p of pages) {
      const roll = p.getByTestId('cn-roll');
      if (await roll.isEnabled()) {
        await roll.click();
        acted = true;
        break;
      }
      const can = p.locator('.cn-horse.can');
      if ((await can.count()) > 0) {
        await can.first().dispatchEvent('pointerdown');
        moved++;
        acted = true;
        break;
      }
    }
    if (!acted)
      await a.page.waitForTimeout(300); // a roll is animating or syncing
    else await a.page.waitForTimeout(150);
  }
  await expect(a.page.getByTestId('cn-dice')).not.toHaveAttribute('data-value', '');
  // everyone sees the same horses in the same places
  await expect(async () => {
    const pa = await positions(a.page);
    expect(await positions(b.page)).toBe(pa);
    expect(await positions(c.page)).toBe(pa);
  }).toPass({ timeout: 10_000 });
  await evidence(a.page, 'cangua', 'D2', 'UX-28-playing');
  test.info().annotations.push({ type: 'moves', description: String(moved) });

  // Chi leaves: the other two play on, Chi's horses disappear
  await c.page.getByTestId('exit').click();
  await c.page
    .getByTestId('confirm-exit')
    .click()
    .catch(() => {});
  await expect(a.page.locator('[data-testid^="horse-"]'), '[UX-28] leaver not dropped').toHaveCount(
    8,
    { timeout: 15_000 },
  );
  expect([...a.errors, ...b.errors, ...c.errors], '[UX-28] errors').toEqual([]);
  for (const p of [a, b, c]) await p.ctx.close();
});

test('[UX-32] against the computer: choose 3 computers, roll, the computers play by themselves', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { page, errors, ctx } = await openApp(browser, { name: 'An' });
  await page.goto('/#/cangua');
  await page.getByTestId('mode-solo').click();
  await page.getByTestId('bots-3').click();
  await page.getByTestId('cn-board').waitFor();
  await expect(page.locator('[data-testid^="horse-"]'), '[UX-32] four colours').toHaveCount(16);
  // play until the turn has come back to me a few times (the computers roll and move alone)
  let myTurns = 0;
  for (let i = 0; i < 200 && myTurns < 4; i++) {
    const roll = page.getByTestId('cn-roll');
    if (await roll.isEnabled()) {
      await roll.click();
      myTurns++;
      await page.waitForTimeout(600);
      continue;
    }
    const can = page.locator('.cn-horse.can');
    if (await can.count()) {
      await can.first().dispatchEvent('pointerdown');
      await page.waitForTimeout(200);
      continue;
    }
    await page.waitForTimeout(300);
  }
  expect(myTurns, '[UX-32] the turn never came back to me').toBeGreaterThanOrEqual(4);
  await expect(page.getByTestId('cn-dice')).not.toHaveAttribute('data-value', '');
  await evidence(page, 'cangua', 'D2', 'UX-32-vs-computer');
  // leaving mid-game asks first
  await page
    .getByRole('button', { name: /quay lại|back/i })
    .first()
    .click();
  await expect(page.getByTestId('confirm-exit')).toBeVisible();
  expect(errors, '[UX-32] errors').toEqual([]);
  await ctx.close();
});

test('[UX-33] same device: 4 players take turns rolling on one device', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page, errors, ctx } = await openApp(browser, { name: 'An' });
  await page.goto('/#/cangua');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('players-4').click();
  await page.getByTestId('cn-board').waitFor();
  await expect(page.locator('[data-testid^="horse-"]'), '[UX-33] four colours').toHaveCount(16);
  await expect(page.getByTestId('status')).toContainText(/Người 1/);
  // nobody plays by themselves: every roll and move is pressed on this device
  const seen = new Set<string>();
  for (let i = 0; i < 80 && seen.size < 4; i++) {
    const status = (await page.getByTestId('status').textContent()) ?? '';
    const who = status.match(/Người \d/)?.[0];
    const roll = page.getByTestId('cn-roll');
    if (who && (await roll.isEnabled())) {
      seen.add(who);
      await roll.click();
      await page.waitForTimeout(600);
      continue;
    }
    const can = page.locator('.cn-horse.can');
    if (await can.count()) await can.first().dispatchEvent('pointerdown');
    await page.waitForTimeout(250);
  }
  expect([...seen].sort(), '[UX-33] every player got a turn').toEqual([
    'Người 1',
    'Người 2',
    'Người 3',
    'Người 4',
  ]);
  await evidence(page, 'cangua', 'D2', 'UX-33-same-device');
  expect(errors, '[UX-33] errors').toEqual([]);
  await ctx.close();
});

test('[AU-11] Cờ cá ngựa: two dice rattle when rolled, hooves when a horse moves', async ({
  browser,
}) => {
  const { page, errors, ctx } = await openApp(browser, { name: 'An', sound: true });
  await page.goto('/#/cangua/play?mode=local&players=2');
  await page.getByTestId('cn-board').waitFor();
  await page.mouse.click(5, 5); // first tap unlocks audio
  const sounds = () =>
    page.evaluate(() => [...((window as unknown as { __fgSounds?: string[] }).__fgSounds ?? [])]);
  // roll until a horse can move, then move it
  for (let i = 0; i < 30 && !(await sounds()).includes('hooves'); i++) {
    if (await page.getByTestId('cn-roll').isEnabled()) {
      await page.getByTestId('cn-roll').click();
      await page.waitForTimeout(600);
    }
    const can = page.locator('.cn-horse.can');
    if (await can.count()) {
      await can.first().dispatchEvent('pointerdown');
      await page.waitForTimeout(200);
    }
  }
  const played = await sounds();
  expect(played, '[AU-11] no dice sound').toContain('dice');
  expect(played, '[AU-11] no hooves').toContain('hooves');
  // two dice are shown, each 1–6
  const value = await page.getByTestId('cn-dice').getAttribute('data-value');
  expect(value, '[AU-11] two dice').toMatch(/^[1-6][1-6]$/);
  expect(errors, '[AU-11] errors').toEqual([]);
  await ctx.close();
});

test('[UX-36] each die is a move of its own: pick a die, then a horse; one horse can use both', async ({
  browser,
}) => {
  const { page, errors, ctx } = await openApp(browser, { name: 'An' });
  // every roll comes out a 6 and a 3 (Math.random alternates 0.9, 0.4)
  await page.addInitScript(() => {
    let i = 0;
    Math.random = () => (i++ % 2 === 0 ? 0.9 : 0.4);
  });
  await page.goto('/#/cangua/play?mode=local&players=2');
  await page.getByTestId('cn-board').waitFor();
  const pos = (h: number) => page.getByTestId(`horse-${h}`).getAttribute('data-pos');
  await page.getByTestId('cn-roll').click();
  await expect(page.getByTestId('cn-dice')).toHaveAttribute('data-value', /^(63|36)$/);
  const dice = (await page.getByTestId('cn-dice').getAttribute('data-value'))!;
  const six = dice[0] === '6' ? 0 : 1;
  const three = 1 - six;
  // only the 6 can bring a horse out: it is chosen, the 3 cannot be picked yet
  await expect(page.locator(`button[data-testid="cn-die-${six}"]`)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.locator(`button[data-testid="cn-die-${three}"]`),
    '[UX-36] 3 usable',
  ).toHaveCount(0);
  await page.locator('.cn-horse.can').first().dispatchEvent('pointerdown');
  expect(await pos(0)).toBe('0');
  // the 6 is used (faded); the 3 is now chosen and the same player goes on
  await expect(page.getByTestId(`cn-die-${six}`)).toHaveClass(/used/);
  await expect(page.getByTestId(`cn-die-${three}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('status')).toContainText(/Người 1 còn xí ngầu 3/);
  await expect(page.getByTestId('cn-roll')).toBeDisabled();
  await page.getByTestId('horse-0').dispatchEvent('pointerdown');
  expect(await pos(0), '[UX-36] the same horse uses the second die').toBe('3');
  // both dice used: the next player rolls
  await expect(page.getByTestId('cn-roll')).toBeEnabled();
  await expect(page.getByTestId('status')).toContainText(/Người 2/);
  await evidence(page, 'cangua', 'D2', 'UX-36-two-dice');

  // second player: 6 then 3 again. Pick the 6 for the new horse, keep it; then roll on.
  await page.getByTestId('cn-roll').click();
  await page.locator('.cn-horse.can').first().dispatchEvent('pointerdown');
  await page.locator('.cn-horse.can').first().dispatchEvent('pointerdown');
  // player 1 again: horse 0 on 3, one horse still out of reach. Use the 3 first on horse 0,
  // then the 6 brings a second horse out: two horses moved in one turn.
  await page.getByTestId('cn-roll').click();
  await expect(page.getByTestId('cn-dice')).toHaveAttribute('data-value', /^(63|36)$/);
  const again = (await page.getByTestId('cn-dice').getAttribute('data-value'))!;
  await page.locator(`button[data-testid="cn-die-${again[0] === '3' ? 0 : 1}"]`).click();
  await page.getByTestId('horse-0').dispatchEvent('pointerdown');
  expect(await pos(0)).toBe('6');
  await expect(page.getByTestId('horse-1')).toHaveClass(/can/);
  await page.getByTestId('horse-1').dispatchEvent('pointerdown');
  expect(await pos(1), '[UX-36] a second horse used the other die').toBe('0');
  expect(errors, '[UX-36] errors').toEqual([]);
  await ctx.close();
});
