/** Nối từ (word chain) through the real UI (qa/test-cases.md: UX-24..27, UI-11, CR-15). */
import { expect, test, type Page } from '@playwright/test';
import { PHONES, createRoomAs, evidence, joinAs, openApp } from './fixtures';

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

/** Answers with the hint word, typed out again with its tone marks. */
async function answerWithHint(page: Page) {
  await page.getByTestId('nt-hint').click();
  const word = await page.getByTestId('nt-input').inputValue();
  await page.getByTestId('nt-input').fill(word);
  await page.getByTestId('nt-go').click();
}

test('[UX-24] same device: hint, tone marks required, refusals, giving up', async ({ browser }) => {
  const { page, errors } = await openApp(browser);
  await page.goto('/#/noitu/play?mode=local');
  await page.getByTestId('nt-input').waitFor({ timeout: 15_000 });
  await expect(page.getByTestId('nt-word-0'), '[UX-24] no opening word').toBeVisible();
  const prefix = await page.getByTestId('nt-prefix').innerText();
  expect(page.getByTestId('nt-word-0')).toContainText(prefix);
  // not a word
  await page.getByTestId('nt-input').fill('zzz');
  await page.getByTestId('nt-go').click();
  await expect(page.getByTestId('nt-error'), '[UX-24] unknown word not refused').toContainText(
    'chưa có trong từ điển',
  );
  // the hint word without its tone marks is refused, without giving the word away
  await page.getByTestId('nt-hint').click();
  const hinted = await page.getByTestId('nt-input').inputValue();
  if (plain(hinted) !== hinted) {
    await page.getByTestId('nt-input').fill(plain(hinted));
    await page.getByTestId('nt-go').click();
    await expect(page.getByTestId('nt-error'), '[UX-24] tone-less word accepted').toContainText(
      'Gõ có dấu',
    );
    await expect(page.getByTestId('nt-word-1')).toHaveCount(0);
  }
  await page.getByTestId('nt-input').fill(hinted);
  await page.getByTestId('nt-go').click();
  await expect(page.getByTestId('nt-word-1'), '[UX-24] word not added').toBeVisible();
  await expect(page.getByTestId('nt-hint')).toContainText('3'); // player 2 has all hints
  await expect(page.getByTestId('status')).toContainText('Người 2');
  await evidence(page, 'noitu', 'D2', 'UX-24-chain');
  // the same word again is refused
  const w1 = await page.getByTestId('nt-word-1').locator('b').innerText();
  const second = w1.split(' ')[1];
  const prefix2 = await page.getByTestId('nt-prefix').innerText();
  if (prefix2 === w1.split(' ')[0]) {
    await page.getByTestId('nt-input').fill(second);
    await page.getByTestId('nt-go').click();
    await expect(page.getByTestId('nt-error')).toContainText('đã dùng');
  }
  await page.getByTestId('nt-giveup').click();
  await expect(page.getByTestId('nt-reason'), '[UX-24] reason not shown').toContainText(
    'Người 2 chịu thua',
  );
  await expect(page.getByTestId('nt-could'), '[UX-24] no suggestion after losing').toBeVisible();
  await evidence(page, 'noitu', 'D2', 'UX-24-result');
  expect(errors).toEqual([]);
});

test('[UX-25] vs computer: it answers; running out of time loses', async ({ browser }) => {
  const { page, errors } = await openApp(browser);
  await page.clock.install();
  await page.goto('/#/noitu');
  await page.getByTestId('mode-solo').click();
  await page.getByTestId('level-medium').click();
  await page.getByTestId('nt-input').waitFor({ timeout: 15_000 });
  await answerWithHint(page);
  await page.clock.fastForward(3000);
  await expect(page.getByTestId('nt-word-2'), '[UX-25] computer did not answer').toBeVisible();
  await expect(page.getByTestId('status')).toContainText('Đến lượt bạn');
  await page.clock.fastForward(46_000); // medium: 45 s per turn
  await expect(page.getByTestId('nt-reason'), '[UX-25] no timeout').toContainText('hết giờ');
  await expect(page.getByTestId('final-score')).toContainText('0 – 1');
  expect(errors).toEqual([]);
});

test('[CR-15] bad Nối từ links do not crash', async ({ browser }) => {
  const { page, errors } = await openApp(browser);
  for (const r of ['/#/noitu/play?mode=zzz&level=x', '/#/noitu/play', '/#/noitu']) {
    await page.goto(r);
    await page.reload();
    await expect(page.locator('main'), `[CR-15] ${r}`).toBeVisible();
  }
  expect(errors, '[CR-15] errors').toEqual([]);
});

test('[UX-26] online Nối từ: words reach both players; giving up ends the round', async ({
  browser,
}) => {
  const a = await openApp(browser, { name: 'An' });
  const b = await openApp(browser, { name: 'Bình' });
  await a.page.goto('/#/noitu');
  await a.page.getByTestId('mode-online').click();
  const code = await createRoomAs(a.page, 'An');
  await joinAs(b.page, code, 'Bình');
  await expect(a.page.getByTestId('status'), '[UX-26] host does not answer first').toContainText(
    'Đến lượt bạn',
    { timeout: 20_000 },
  );
  await expect(b.page.getByTestId('nt-input')).toBeDisabled();
  await answerWithHint(a.page);
  await expect(b.page.getByTestId('nt-word-1'), '[UX-26] word not synced').toBeVisible();
  await expect(b.page.getByTestId('status')).toContainText('Đến lượt bạn');
  await expect(b.page.getByTestId('nt-word-1'), '[UX-26] host word on the wrong side').toHaveClass(
    /them/,
  );
  await evidence(b.page, 'noitu', 'D2', 'UX-26-online');
  await b.page.getByTestId('nt-giveup').click();
  await expect(a.page.getByTestId('nt-reason'), '[UX-26] result not shown').toContainText(
    'Bình chịu thua',
  );
  expect([...a.errors, ...b.errors], '[UX-26] errors').toEqual([]);
});

for (const d of PHONES) {
  test(`[UI-11] Nối từ fits on ${d.id} ${d.name}`, async ({ browser }) => {
    for (const theme of ['classic', 'cute'] as const) {
      const { page, ctx } = await openApp(browser, { device: d, theme });
      await page.goto('/#/noitu/play?mode=local');
      await page.getByTestId('nt-input').waitFor({ timeout: 15_000 });
      await answerWithHint(page);
      const r = await page.evaluate(() => {
        const box = (id: string) =>
          document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect();
        const ids = ['nt-input', 'nt-go', 'nt-hint', 'nt-giveup', 'nt-timer'];
        const boxes = ids.map(box);
        return {
          inside: boxes.every(
            (b) => b.left >= -1 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1,
          ),
          minTap: Math.min(...boxes.slice(0, 4).map((b) => b.height)),
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect.soft(r.inside, `[UI-11] ${d.id} ${theme} controls not visible`).toBe(true);
      expect
        .soft(r.minTap, `[UI-11] ${d.id} ${theme} tap ${Math.round(r.minTap)}px`)
        .toBeGreaterThanOrEqual(43.5);
      expect
        .soft(r.overflow, `[UI-11] ${d.id} ${theme} horizontal overflow`)
        .toBeLessThanOrEqual(0);
      await evidence(page, theme, d.id, '18-noitu');
      await ctx.close();
    }
  });
}
