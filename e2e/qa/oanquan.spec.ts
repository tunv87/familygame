/** Ô ăn quan, hub groups and the help "story" tab through the real UI (qa/test-cases.md). */
import { expect, test } from '@playwright/test';
import { PHONES, createRoomAs, evidence, joinAs, openApp, pickField } from './fixtures';

const played = (page: import('@playwright/test').Page) =>
  page.evaluate(() => [...((window as unknown as { __fgSounds?: string[] }).__fgSounds ?? [])]);

test('[UX-20][AU-09] pick a field, then a direction; stones are sown and captured', async ({
  browser,
}) => {
  const { page, errors } = await openApp(browser, { sound: true });
  await page.goto('/#/oanquan/play?mode=local');
  await page.getByTestId('oaq-board').waitFor();
  await page.mouse.click(5, 5); // unlock audio
  await expect(page.getByTestId('dir-right'), '[UX-20] direction offered too early').toBeDisabled();
  await page.getByTestId('cell-8').dispatchEvent('pointerdown'); // player 2's field: refused
  await expect(page.getByTestId('cell-8')).not.toHaveClass(/selected/);
  await page.getByTestId('cell-1').dispatchEvent('pointerdown');
  await expect(page.getByTestId('cell-1'), '[UX-20] field not selected').toHaveClass(/selected/);
  await expect(page.getByTestId('status')).toContainText('Chọn hướng');
  await evidence(page, 'oanquan', 'D2', 'UX-20-select');
  // 5 stones from field 1 to the right: 2..6, pick up 7 → 8..11, 0; 1 empty → capture field 2 (6)
  await page.getByTestId('dir-right').click();
  // the move is replayed stone by stone: the hand shows how many stones are left to sow
  await expect(page.getByTestId('oaq-hand'), '[UX-20] no hand while sowing').toBeVisible();
  await expect(page.getByTestId('status')).toContainText('Đang rải');
  await evidence(page, 'oanquan', 'D2', 'UX-20-sowing');
  await page.getByTestId('cell-8').dispatchEvent('pointerdown'); // tap the board: skip
  await expect(page.getByTestId('oaq-hand'), '[UX-20] skip did not end the replay').toHaveCount(0);
  await expect(page.getByTestId('me-score'), '[UX-20] capture not scored').toHaveText('6');
  await expect(page.getByTestId('count-2')).toHaveText('0');
  await expect(page.getByTestId('count-6'), '[UX-20] quan cell value').toHaveText('11');
  await expect(page.getByTestId('oaq-message')).toContainText('Ăn được 6');
  await expect(page.getByTestId('status'), '[UX-20] turn did not pass').toContainText('Người 2');
  await evidence(page, 'oanquan', 'D2', 'UX-20-sown');
  expect(await played(page), '[AU-09] capture sound').toContain('ganh');
  expect(errors).toEqual([]);
});

test('[UX-21] vs computer: it answers, undo goes back to my turn, leaving asks first', async ({
  browser,
}) => {
  const { page, errors } = await openApp(browser);
  await page.goto('/#/oanquan');
  await page.getByTestId('mode-solo').click();
  await page.getByTestId('level-hard').click();
  await pickField(page, 3);
  await page.getByTestId('dir-left').click();
  await expect(page.getByTestId('status'), '[UX-21] computer did not answer').toContainText(
    'Đến lượt bạn',
    { timeout: 30_000 },
  );
  await page.getByRole('button', { name: /Đi lại/ }).click();
  await expect(page.getByTestId('count-3'), '[UX-21] undo did not restore my field').toHaveText(
    '5',
  );
  await pickField(page, 3);
  await page.getByTestId('dir-left').click();
  await page.getByRole('button', { name: 'Quay lại' }).click();
  await expect(page.getByTestId('keep-playing'), '[UX-21] no exit confirmation').toBeVisible();
  expect(errors).toEqual([]);
});

test('[CR-14] bad Ô ăn quan links do not crash', async ({ browser }) => {
  const { page, errors } = await openApp(browser);
  for (const r of ['/#/oanquan/play?mode=zzz&level=x', '/#/oanquan/play', '/#/oanquan']) {
    await page.goto(r);
    await page.reload();
    await expect(page.locator('main'), `[CR-14] ${r}`).toBeVisible();
  }
  expect(errors, '[CR-14] errors').toEqual([]);
});

test('[UX-22] online Ô ăn quan: each player sees their own fields at the bottom; moves sync', async ({
  browser,
}) => {
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser, { name: 'Bình' });
  await a.page.goto('/#/oanquan');
  await a.page.getByTestId('mode-online').click();
  const code = await createRoomAs(a.page, 'An');
  await joinAs(b.page, code, 'Bình');
  await expect(a.page.getByTestId('status'), '[UX-22] host does not move first').toContainText(
    'Đến lượt bạn',
    { timeout: 15_000 },
  );
  await expect(b.page.getByTestId('cell-7'), '[UX-22] guest fields not at the bottom').toHaveClass(
    /mine/,
  );
  await pickField(a.page, 1);
  await a.page.getByTestId('dir-right').click();
  await expect(
    b.page.getByTestId('oaq-hand'),
    '[UX-22] move not replayed for the guest',
  ).toBeVisible();
  await expect(b.page.getByTestId('count-2'), '[UX-22] move not synced').toHaveText('0', {
    timeout: 15_000,
  });
  await expect(b.page.getByTestId('status'), '[UX-22] guest not on turn').toContainText(
    'Đến lượt bạn',
    { timeout: 15_000 },
  );
  await pickField(b.page, 9);
  await b.page.getByTestId('dir-left').click();
  await expect(a.page.getByTestId('status'), '[UX-22] host not back on turn').toContainText(
    'Đến lượt bạn',
    { timeout: 15_000 },
  );
  await evidence(b.page, 'oanquan', 'D2', 'UX-22-online');
  expect([...a.errors, ...b.errors], '[UX-22] errors').toEqual([]);
});

test('[UX-23] hub groups games; every game has rules and a story', async ({ browser }) => {
  const { page, errors } = await openApp(browser);
  await page.goto('/');
  const folk = page.getByTestId('group-folk');
  const mind = page.getByTestId('group-mind');
  await expect(
    folk.getByTestId('game-oanquan'),
    '[UX-23] Ô ăn quan not in folk games',
  ).toBeVisible();
  await expect(folk.getByTestId('game-coganh')).toBeVisible();
  await expect(mind.getByTestId('game-caro'), '[UX-23] Ca rô not in brain games').toBeVisible();
  await expect(mind.getByTestId('game-numbers')).toBeVisible();
  await expect(mind.getByTestId('game-noitu')).toBeVisible();
  await evidence(page, 'oanquan', 'D2', 'UX-23-hub');
  for (const g of ['oanquan', 'coganh', 'caro', 'numbers', 'noitu']) {
    await page.goto(`/#/${g}`);
    await page.getByTestId('help').click();
    await expect(page.getByTestId('help-rules'), `[UX-23] ${g} rules`).toBeVisible();
    await page.getByTestId('help-tab-story').click();
    const story = page.getByTestId('help-story');
    await expect(story, `[UX-23] ${g} story`).toBeVisible();
    expect((await story.innerText()).length, `[UX-23] ${g} story too short`).toBeGreaterThan(200);
    if (g === 'oanquan') await evidence(page, 'oanquan', 'D2', 'UX-23-story');
    await page.getByRole('button', { name: 'OK' }).click();
  }
  expect(errors).toEqual([]);
});

for (const d of PHONES) {
  test(`[UI-10] Ô ăn quan board fits and fields are big enough on ${d.id} ${d.name}`, async ({
    browser,
  }) => {
    for (const theme of ['classic', 'cute'] as const) {
      const { page, ctx } = await openApp(browser, { device: d, theme });
      await page.goto('/#/oanquan/play?mode=local');
      await pickField(page, 3);
      const r = await page.evaluate(() => {
        const box = (sel: string) => document.querySelector(sel)!.getBoundingClientRect();
        const b = box('[data-testid="oaq-board"]');
        const dirs = box('[data-testid="dir-right"]');
        const fields = [...document.querySelectorAll('.oaq-cell.field')].map((p) =>
          p.getBoundingClientRect(),
        );
        return {
          inside:
            b.left >= -1 &&
            b.top >= -1 &&
            b.right <= innerWidth + 1 &&
            dirs.bottom <= innerHeight + 1,
          minField: Math.min(...fields.map((p) => Math.min(p.width, p.height))),
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect.soft(r.inside, `[UI-10] ${d.id} ${theme} board or buttons not visible`).toBe(true);
      expect
        .soft(r.minField, `[UI-10] ${d.id} ${theme} fields ${Math.round(r.minField)}px`)
        .toBeGreaterThanOrEqual(43.5);
      expect
        .soft(r.overflow, `[UI-10] ${d.id} ${theme} horizontal overflow`)
        .toBeLessThanOrEqual(0);
      await evidence(page, theme, d.id, '17-oanquan');
      await ctx.close();
    }
  });
}
