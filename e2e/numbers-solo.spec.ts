import { expect, test } from '@playwright/test';

test('numbers vs computer: the computer takes numbers, and a game finishes', async ({ page }) => {
  // Speed the computer up so the test is quick: Math.random → 0 gives the minimum delay.
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/');
  await page.getByTestId('game-numbers').click();
  await page.getByTestId('mode-bot').click();
  await page.getByTestId('level-easy').click();
  await expect(page.getByTestId('countdown')).toBeHidden({ timeout: 10_000 });
  // Let the computer take number 1, then race it.
  await expect(page.getByTestId('opp-score')).toHaveText('1', { timeout: 6000 });
  for (let n = 2; n <= 30; n++) {
    const target = page.getByTestId('target');
    if (!(await target.textContent())?.includes(String(n))) continue; // computer got it
    await page.getByTestId(`num-${n}`).click();
  }
  await expect(page.getByTestId('result-title')).toBeVisible({ timeout: 20_000 });
  const me = Number(await page.getByTestId('final-me-score').textContent());
  const bot = Number(await page.getByTestId('final-opp-score').textContent());
  expect(me + bot).toBe(30);
  expect(bot).toBeGreaterThanOrEqual(1);
  await expect(page.getByTestId('result-title')).toHaveText(
    me > bot ? 'Bạn thắng! 🎉' : /thua|Hoà/,
  );
});

test('numbers practice: finish 1→30, time is shown and saved as a record', async ({ page }) => {
  await page.goto('/#/numbers');
  await page.getByTestId('mode-practice').click();
  await page.getByTestId('level-easy').click();
  await expect(page.getByTestId('countdown')).toBeHidden({ timeout: 10_000 });
  await page.getByTestId('num-2').click(); // wrong tap is ignored
  await expect(page.getByTestId('me-score')).toHaveText('0');
  for (let n = 1; n <= 30; n++) await page.getByTestId(`num-${n}`).click();
  await expect(page.getByTestId('result-title')).toHaveText('Kỷ lục mới! 🏆');
  await expect(page.getByTestId('practice-time')).toContainText('giây');
  await page.screenshot({ path: 'test-results/screens/numbers-practice-result.png' });
  // record appears on the level picker
  await page.goto('/#/numbers');
  await page.getByTestId('mode-practice').click();
  await expect(page.getByTestId('level-easy')).toContainText('🏆');
});

test('leaving a numbers game vs computer mid-way asks first', async ({ page }) => {
  await page.goto('/#/numbers/play?mode=bot&level=easy');
  await expect(page.getByTestId('countdown')).toBeHidden({ timeout: 10_000 });
  await page.getByTestId('num-1').click();
  await page.getByTestId('exit').click();
  await page.getByTestId('keep-playing').click();
  await page.getByTestId('exit').click();
  await page.getByTestId('confirm-exit').click();
  await expect(page.getByTestId('mode-bot')).toBeVisible();
});
