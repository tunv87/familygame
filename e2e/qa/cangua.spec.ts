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
  await expect(a.page.getByTestId('cn-die')).not.toHaveAttribute('data-value', '');
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
  await expect(page.getByTestId('cn-die')).not.toHaveAttribute('data-value', '');
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
