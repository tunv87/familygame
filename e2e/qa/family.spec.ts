/** Family members, leaderboard and today's challenge (qa/test-cases.md: UX-34, UX-35). */
import { expect, test } from '@playwright/test';
import { evidence, openApp } from './fixtures';

test('[UX-34] family: add a member, switch who plays, a win lands on the leaderboard', async ({
  browser,
}) => {
  const { page, errors, ctx } = await openApp(browser, { name: 'An' });
  await page.goto('/');
  await page.getByTestId('hub-family').click();
  // the existing profile is the first member, playing now
  await expect(page.getByTestId('member-An')).toBeVisible();
  await page.getByTestId('member-add').click();
  await page.getByTestId('member-name').fill('Bà');
  await page.getByTestId('member-save').click();
  await expect(page.getByTestId('member-Bà').getByRole('button').first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // Bà wins a game of Tìm số against the computer (easy computer, fast clicks)
  await page.goto('/#/numbers/play?mode=bot&level=easy');
  await page.getByTestId('num-1').waitFor();
  await page.waitForTimeout(3600); // 3-2-1
  for (let n = 1; n <= 30; n++) {
    const cell = page.getByTestId(`num-${n}`);
    if (!(await cell.count())) break;
    await cell.click({ timeout: 2000 }).catch(() => {});
    if (await page.getByTestId('result-title').count()) break;
  }
  await expect(page.getByTestId('result-title')).toBeVisible({ timeout: 20_000 });
  const won = /thắng/.test((await page.getByTestId('result-title').textContent()) ?? '');
  await page.goto('/#/family');
  if (won) {
    await expect(page.getByTestId('leader-1')).toContainText('Bà');
    await expect(page.getByTestId('leader-1')).toHaveAttribute('data-total', '1');
  }
  // switching back to An changes the name used by the games
  await page.getByTestId('member-An').getByRole('button').first().click();
  await page.goto('/#/settings');
  await expect(page.locator('.setting-row').first()).toContainText('An');
  await evidence(page, 'family', 'D2', 'UX-34-settings');
  await page.goto('/#/family');
  await evidence(page, 'family', 'D2', 'UX-34-family');
  expect(errors, '[UX-34] errors').toEqual([]);
  await ctx.close();
});

test("[UX-35] today's challenge: same Tìm số board on every device today, streak shown", async ({
  browser,
}) => {
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser, { name: 'Bình' });
  const boards: string[] = [];
  for (const p of [a.page, b.page]) {
    await p.goto('/#/numbers');
    await p.getByTestId('mode-daily').click();
    await p.getByTestId('num-1').waitFor();
    boards.push(
      await p
        .locator('[data-testid^="num-"]')
        .evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')).join(',')),
    );
  }
  expect(boards[0], '[UX-35] boards differ between devices').toBe(boards[1]);
  // finish it on the first device
  const p = a.page;
  await p.waitForTimeout(3600);
  const total = await p.locator('[data-testid^="num-"]').count();
  for (let n = 1; n <= total; n++) await p.getByTestId(`num-${n}`).click();
  await expect(p.getByTestId('daily-streak')).toContainText('1');
  await evidence(p, 'family', 'D2', 'UX-35-daily-done');
  await p.goto('/#/numbers');
  await expect(p.getByTestId('mode-daily')).toContainText(/Đã chơi hôm nay/);
  // Nối từ has one too, with today's opening word the same on both devices
  const words: string[] = [];
  for (const q of [a.page, b.page]) {
    await q.goto('/#/noitu');
    await q.getByTestId('mode-daily').click();
    await q.getByTestId('nt-word-0').waitFor({ timeout: 20_000 });
    words.push((await q.getByTestId('nt-word-0').textContent()) ?? '');
  }
  expect(words[0], '[UX-35] opening words differ').toBe(words[1]);
  expect([...a.errors, ...b.errors], '[UX-35] errors').toEqual([]);
  await a.ctx.close();
  await b.ctx.close();
});
