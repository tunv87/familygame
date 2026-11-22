import { expect, test } from '@playwright/test';

test('hub shows both games and settings', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('game-numbers')).toBeVisible();
  await expect(page.getByTestId('game-caro')).toBeVisible();
  await page.screenshot({ path: 'test-results/screens/hub.png' });
  await page.getByRole('button', { name: 'Cài đặt' }).click();
  await expect(page.getByText('Chữ to')).toBeVisible();
});

test('caro two players on one device: player 1 wins on 3×3', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('game-caro').click();
  await page.getByTestId('mode-local').click();
  await page.getByTestId('size-3').click();
  for (const i of [0, 3, 1, 4, 2]) await page.getByTestId(`cell-${i}`).click();
  await expect(page.getByTestId('result-title')).toHaveText('Người 1 thắng! 🎉');
  await page.screenshot({ path: 'test-results/screens/caro-local-win.png' });
  // next round: player 2 starts as X
  await page.getByTestId('play-again').click();
  await expect(page.getByTestId('status')).toHaveText('Lượt của Người 2');
});

test('caro vs computer finishes a game on 3×3 hard', async ({ page }) => {
  await page.goto('/#/caro/play?mode=solo&size=3&level=hard');
  const result = page.getByTestId('result-title');
  for (let turn = 0; turn < 9 && !(await result.isVisible()); turn++) {
    await expect(page.getByTestId('status')).toHaveText(/Đến lượt bạn|^$/, { timeout: 5000 });
    if (await result.isVisible()) break;
    const empty = page.locator('.caro-cell:not([disabled])').first();
    await empty.click();
    await page.waitForTimeout(700); // computer "thinks"
  }
  // Perfect 3×3 AI never loses.
  await expect(result).toHaveText(/Hoà|thua/);
});

test('caro 15×15 vs computer renders and responds', async ({ page }) => {
  await page.goto('/#/caro/play?mode=solo&size=15&level=medium');
  await page.getByTestId('cell-112').click();
  await expect(page.locator('.caro-cell.o')).toHaveCount(1, { timeout: 5000 });
  await page.screenshot({ path: 'test-results/screens/caro-big.png' });
});

test('leaving a local caro game mid-way asks first', async ({ page }) => {
  await page.goto('/#/caro/play?mode=local&size=3');
  await page.getByTestId('cell-4').click();
  await page.getByRole('button', { name: 'Quay lại' }).click();
  await page.getByTestId('keep-playing').click();
  await expect(page.getByTestId('caro-board')).toBeVisible();
  await page.getByRole('button', { name: 'Quay lại' }).click();
  await page.getByTestId('confirm-exit').click();
  await expect(page.getByTestId('mode-solo')).toBeVisible();
});
