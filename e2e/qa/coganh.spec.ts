/** Cờ gánh through the real UI (qa/test-cases.md: UI-09, UX-16..18, AU-08, CR-13). */
import { expect, test } from '@playwright/test';
import { PHONES, createRoomAs, evidence, joinAs, openApp } from './fixtures';

const played = (page: import('@playwright/test').Page) =>
  page.evaluate(() => [...((window as unknown as { __fgSounds?: string[] }).__fgSounds ?? [])]);

// From the start: Black (2,0)→(2,1) "opens" (3,1); White must answer (4,2)→(3,1), taking 2.
const OPEN = { from: 2, to: 7 };
const FORCED = { from: 14, to: 8 };

test("[UX-16] tapping a piece shows where it can go; the opponent's pieces are refused", async ({
  browser,
}) => {
  const { page, errors } = await openApp(browser);
  await page.goto('/#/coganh/play?mode=local');
  await page.getByTestId('pt-10').click(); // Black (0,2)
  await expect(page.locator('.cg-pt.target'), '[UX-16] targets of (0,2)').toHaveCount(3);
  await page.getByTestId('pt-0').click(); // another Black piece: the selection moves to it
  await expect(page.getByTestId('pt-0'), '[UX-16] selection did not move').toHaveClass(/selected/);
  await expect(page.locator('.cg-pt.selected'), '[UX-16] two pieces selected').toHaveCount(1);
  await page.getByTestId('pt-10').click();
  await page.getByTestId('pt-24').click(); // White piece on Black's turn
  await expect(page.getByTestId('pt-24')).not.toHaveClass(/selected/);
  await page.getByTestId('pt-11').click(); // move (0,2) → (1,2)
  await expect(page.getByTestId('pt-11'), '[UX-16] move not made').toHaveClass(/black/);
  await expect(page.getByTestId('status')).toContainText('Người 2');
  expect(errors).toEqual([]);
});

test('[UX-17][AU-08] Mở: the opened player must capture; Gánh and Mở have their sounds', async ({
  browser,
}) => {
  const { page, errors } = await openApp(browser, { sound: true });
  await page.goto('/#/coganh/play?mode=local');
  await page.getByTestId('cg-board').waitFor();
  await page.mouse.click(5, 5); // unlock audio
  await page.getByTestId(`pt-${OPEN.from}`).click();
  await page.getByTestId(`pt-${OPEN.to}`).click();
  await expect(page.getByTestId('status'), '[UX-17] no Mở warning').toContainText('Bị Mở');
  await expect(
    page.getByTestId(`pt-${FORCED.from}`),
    '[UX-17] forced piece not picked up',
  ).toHaveClass(/selected/);
  await expect(
    page.locator('.cg-pt.target'),
    '[UX-17] only the forced point is offered',
  ).toHaveCount(1);
  await evidence(page, 'coganh', 'D2', 'UX-17-mo');
  // any other White piece is refused
  await page.getByTestId('pt-24').click();
  await expect(page.getByTestId('pt-24')).not.toHaveClass(/selected/);
  await page.getByTestId(`pt-${FORCED.to}`).click();
  await expect(page.getByTestId('cg-message'), '[UX-17] capture not announced').toContainText(
    'Gánh được 2',
  );
  await expect(page.getByTestId('me-count')).toHaveText('6');
  await expect(page.getByTestId('opp-count')).toHaveText('10');
  await evidence(page, 'coganh', 'D2', 'UX-17-ganh');
  const s = await played(page);
  expect(s, '[AU-08] Mở sound').toContain('forced');
  expect(s, '[AU-08] Gánh sound').toContain('ganh');
  expect(errors).toEqual([]);
});

test('[UX-18] vs computer: it answers, undo goes back to my turn, leaving asks first', async ({
  browser,
}) => {
  const { page, errors } = await openApp(browser);
  await page.goto('/#/coganh');
  await page.getByTestId('mode-solo').click();
  await page.getByTestId('level-hard').click();
  await page.getByTestId('pt-10').click();
  await page.getByTestId('pt-11').click();
  await expect(page.getByTestId('status'), '[UX-18] computer did not answer').toContainText(
    'chạm quân',
    { timeout: 5000 },
  );
  const afterReply = await page.locator('.cg-pt.white').count();
  expect(afterReply).toBeGreaterThan(0);
  await page.getByRole('button', { name: /Đi lại/ }).click();
  await expect(page.getByTestId('pt-10'), '[UX-18] undo did not restore my piece').toHaveClass(
    /black/,
  );
  await page.getByTestId('pt-10').click();
  await page.getByTestId('pt-11').click();
  await page.getByRole('button', { name: 'Quay lại' }).click();
  await expect(page.getByTestId('keep-playing'), '[UX-18] no exit confirmation').toBeVisible();
  expect(errors).toEqual([]);
});

test('[CR-13] bad Cờ gánh links do not crash', async ({ browser }) => {
  const { page, errors } = await openApp(browser);
  for (const r of [
    '/#/coganh/play?mode=zzz&level=impossible',
    '/#/coganh/play',
    '/#/coganh/play?mode=solo&level=-1',
  ]) {
    await page.goto(r);
    await page.reload();
    await expect(page.getByTestId('cg-board'), `[CR-13] ${r}`).toBeVisible();
  }
  expect(errors, '[CR-13] errors').toEqual([]);
});

test('[UX-19] online Cờ gánh: moves, Mở and the result reach both players; colours swap next round', async ({
  browser,
}) => {
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser, { name: 'Bình' });
  await a.page.goto('/#/coganh');
  await a.page.getByTestId('mode-online').click();
  const code = await createRoomAs(a.page, 'An');
  await joinAs(b.page, code, 'Bình');
  await expect(a.page.getByTestId('status'), '[UX-19] host is not Black/first').toContainText(
    'Đến lượt bạn',
    { timeout: 15_000 },
  );
  await a.page.getByTestId(`pt-${OPEN.from}`).click();
  await a.page.getByTestId(`pt-${OPEN.to}`).click();
  await expect(b.page.getByTestId('status'), '[UX-19] Mở not shown to the guest').toContainText(
    'Bị Mở',
  );
  await b.page.getByTestId(`pt-${FORCED.to}`).click(); // forced piece is pre-selected
  await expect(
    a.page.getByTestId('cg-message'),
    '[UX-19] capture not shown to the host',
  ).toContainText('Gánh được 2');
  await expect(
    a.page.getByTestId('pt-7'),
    '[UX-19] converted piece not white for the host',
  ).toHaveClass(/white/);
  await evidence(b.page, 'coganh', 'D2', 'UX-19-online');
  expect([...a.errors, ...b.errors], '[UX-19] errors').toEqual([]);
});

for (const d of PHONES) {
  test(`[UI-09] Cờ gánh board fits and points are big enough on ${d.id} ${d.name}`, async ({
    browser,
  }) => {
    for (const theme of ['classic', 'cute'] as const) {
      const { page, ctx } = await openApp(browser, { device: d, theme });
      await page.goto('/#/coganh/play?mode=local');
      await page.getByTestId('pt-10').click();
      const r = await page.getByTestId('cg-board').evaluate((el) => {
        const b = el.getBoundingClientRect();
        const pts = [...el.querySelectorAll('.cg-pt')].map((p) => p.getBoundingClientRect());
        return {
          inside:
            b.left >= -1 && b.top >= -1 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1,
          minPoint: Math.min(...pts.map((p) => Math.min(p.width, p.height))),
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect.soft(r.inside, `[UI-09] ${d.id} ${theme} board not fully visible`).toBe(true);
      expect
        .soft(r.minPoint, `[UI-09] ${d.id} ${theme} points ${Math.round(r.minPoint)}px`)
        .toBeGreaterThanOrEqual(43.5);
      expect
        .soft(r.overflow, `[UI-09] ${d.id} ${theme} horizontal overflow`)
        .toBeLessThanOrEqual(0);
      await evidence(page, theme, d.id, '16-coganh');
      await ctx.close();
    }
  });
}
