/** Spectators in online rooms (qa/test-cases.md: UX-31). */
import { expect, test } from '@playwright/test';
import { createRoomAs, evidence, joinAs, openApp } from './fixtures';

test('[UX-31] a third person watches a Ca rô game: sees moves, cannot play, can leave', async ({
  browser,
}) => {
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser, { name: 'Bình' });
  const c = await openApp(browser, { name: 'Chi' });
  await a.page.goto('/#/caro');
  await a.page.getByTestId('mode-online').click();
  await a.page.getByTestId('size-3').click();
  const code = await createRoomAs(a.page, 'An');
  await joinAs(b.page, code, 'Bình');
  await expect(a.page.getByTestId('status')).toContainText('Đến lượt bạn', { timeout: 15_000 });
  await joinAs(c.page, code, 'Chi');
  await expect(c.page.getByTestId('spectating'), '[UX-31] not told they are watching').toBeVisible({
    timeout: 15_000,
  });
  // the players see that someone is watching
  await expect(a.page.getByTestId('watchers'), '[UX-31] players not told').toContainText('1');
  await expect(b.page.getByTestId('watchers')).toContainText('1');
  // moves reach the spectator, who sees whose turn it is
  await a.page.getByTestId('cell-4').click();
  await expect(c.page.getByTestId('cell-4'), '[UX-31] move not shown').toHaveClass(/\b(x|o)\b/, {
    timeout: 10_000,
  });
  await expect(c.page.getByTestId('status')).toContainText('Lượt của Bình');
  // tapping the board does nothing
  await c.page.getByTestId('cell-0').click({ force: true });
  await c.page.waitForTimeout(800);
  await expect(b.page.getByTestId('cell-0'), '[UX-31] spectator moved').not.toHaveClass(
    /\b(x|o)\b/,
  );
  await evidence(c.page, 'spectate', 'D2', 'UX-31-watching');
  // the game ends: the spectator sees who won, but no "play again"
  await b.page.getByTestId('cell-0').click();
  for (const [p, i] of [
    [a.page, 3],
    [b.page, 1],
    [a.page, 5],
  ] as const) {
    await expect(p.getByTestId('status')).toContainText('Đến lượt bạn', { timeout: 10_000 });
    await p.getByTestId(`cell-${i}`).click();
  }
  await expect(c.page.getByTestId('result-title'), '[UX-31] no result').toContainText('An thắng', {
    timeout: 10_000,
  });
  await expect(c.page.getByTestId('play-again')).toHaveCount(0);
  // leaving: straight out, no question
  await c.page.getByTestId('leave').click();
  await expect(c.page.getByTestId('game-caro')).toBeVisible();
  await expect(a.page.getByTestId('watchers'), '[UX-31] spectator still listed').toHaveCount(0, {
    timeout: 10_000,
  });
  expect([...a.errors, ...b.errors, ...c.errors], '[UX-31] errors').toEqual([]);
  for (const p of [a, b, c]) await p.ctx.close();
});

test('[UX-31] the room closes: spectators are told the game is over', async ({ browser }) => {
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser, { name: 'Bình' });
  const c = await openApp(browser, { name: 'Chi' });
  await a.page.goto('/#/caro');
  await a.page.getByTestId('mode-online').click();
  await a.page.getByTestId('size-3').click();
  const code = await createRoomAs(a.page, 'An');
  await joinAs(b.page, code, 'Bình');
  await joinAs(c.page, code, 'Chi');
  await c.page.getByTestId('spectating').waitFor({ timeout: 15_000 });
  for (const p of [a.page, b.page]) {
    await p.getByTestId('exit').click();
    await p
      .getByTestId('confirm-exit')
      .click({ timeout: 3000 })
      .catch(() => {});
  }
  await expect(c.page.getByTestId('room-ended'), '[UX-31] spectator left hanging').toBeVisible({
    timeout: 15_000,
  });
  expect([...a.errors, ...b.errors, ...c.errors], '[UX-31] errors').toEqual([]);
  for (const p of [a, b, c]) await p.ctx.close();
});

test('[UX-31] Cờ cá ngựa: someone who arrives after the start watches', async ({ browser }) => {
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser, { name: 'Bình' });
  const c = await openApp(browser, { name: 'Chi' });
  await a.page.goto('/#/cangua');
  await a.page.getByTestId('mode-online').click();
  const code = await createRoomAs(a.page, 'An');
  await joinAs(b.page, code, 'Bình');
  await a.page.getByTestId('start-game').click({ timeout: 15_000 });
  await a.page.getByTestId('cn-board').waitFor({ timeout: 15_000 });
  await joinAs(c.page, code, 'Chi');
  await expect(c.page.getByTestId('spectating')).toBeVisible({ timeout: 15_000 });
  await expect(c.page.getByTestId('cn-roll'), '[UX-31] spectator can roll').toBeDisabled();
  await expect(c.page.locator('[data-testid^="horse-"]')).toHaveCount(8);
  await expect(c.page.getByTestId('status')).toContainText('Lượt của');
  // An rolls: Chi sees the die
  await a.page.getByTestId('cn-roll').click();
  await expect(c.page.getByTestId('cn-die'), '[UX-31] roll not shown').not.toHaveAttribute(
    'data-value',
    '',
    { timeout: 10_000 },
  );
  expect([...a.errors, ...b.errors, ...c.errors], '[UX-31] errors').toEqual([]);
  for (const p of [a, b, c]) await p.ctx.close();
});
