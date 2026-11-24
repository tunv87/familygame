/** Cờ cá ngựa online for three players through the real UI (qa/test-cases.md). */
import { expect, test, type Page } from '@playwright/test';
import { createRoomAs, evidence, joinAs, openApp } from './fixtures';

const positions = (p: Page) =>
  p.locator('[data-testid^="horse-"]').evaluateAll((els) =>
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
    if (!acted) await a.page.waitForTimeout(300); // a roll is animating or syncing
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
  await c.page.getByTestId('confirm-exit').click().catch(() => {});
  await expect(a.page.locator('[data-testid^="horse-"]'), '[UX-28] leaver not dropped').toHaveCount(
    8,
    { timeout: 15_000 },
  );
  expect([...a.errors, ...b.errors, ...c.errors], '[UX-28] errors').toEqual([]);
  for (const p of [a, b, c]) await p.ctx.close();
});
