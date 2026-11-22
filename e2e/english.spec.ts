import { devices, expect, test, type Page } from '@playwright/test';
import { SKIP_WELCOME } from './helpers';

const VIETNAMESE = /[ạ-ỹđĐăâêôơưàáảãèéẻẽìíỉĩòóỏõùúủũỳýỷỹ]/;

async function noVietnamese(page: Page, screen: string) {
  // The language picker intentionally shows "Tiếng Việt"; ignore that button only.
  const text = await page.evaluate(() =>
    document.body.innerText.replace('Tiếng Việt', '').replace(/\s+/g, ' '),
  );
  expect(
    text.match(VIETNAMESE)?.[0],
    `${screen}: Vietnamese left in English UI → "${text.slice(0, 200)}"`,
  ).toBeUndefined();
}

test.use({ ...devices['iPhone 14'], locale: 'en-US' });

test('an English device gets a fully English app', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('game-caro')).toContainText('Gomoku');
  await expect(page).toHaveTitle('Family Games');
  await noVietnamese(page, 'hub');

  await page.getByRole('button', { name: 'Settings' }).click();
  await noVietnamese(page, 'settings');

  await page.goto('/#/caro');
  await noVietnamese(page, 'caro-mode');
  await page.getByRole('button', { name: 'How to play' }).click();
  await noVietnamese(page, 'caro-help');
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByTestId('mode-solo').click();
  await noVietnamese(page, 'caro-size');
  await page.getByTestId('size-3').click();
  await noVietnamese(page, 'caro-level');
  await page.getByTestId('level-easy').click();
  await page.getByTestId('cell-4').click();
  await noVietnamese(page, 'caro-solo');

  await page.goto('/#/numbers');
  await noVietnamese(page, 'numbers-mode');
  await page.getByRole('button', { name: 'How to play' }).click();
  await noVietnamese(page, 'numbers-help');
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByTestId('mode-practice').click();
  await noVietnamese(page, 'numbers-level');
  await page.getByTestId('level-easy').click();
  await expect(page.getByTestId('countdown')).toBeHidden({ timeout: 10_000 });
  for (let n = 1; n <= 30; n++) await page.getByTestId(`num-${n}`).click();
  await expect(page.getByTestId('result-title')).toHaveText('New record! 🏆');
  await noVietnamese(page, 'numbers-practice-result');

  await page.goto('/#/numbers');
  await page.getByTestId('mode-online').click();
  await page.getByTestId('level-easy').click();
  await noVietnamese(page, 'numbers-lobby');
  await page.getByTestId('create-room').click();
  await noVietnamese(page, 'profile');

  await page.goto('/#/join');
  await noVietnamese(page, 'join');
});

test('a Vietnamese device gets Vietnamese, and the choice can be changed', async ({ browser }) => {
  const page = await (
    await browser.newContext({
      ...devices['iPhone 14'],
      locale: 'vi-VN',
      storageState: SKIP_WELCOME,
    })
  ).newPage();
  await page.goto('/');
  await expect(page.getByTestId('game-caro')).toContainText('Cờ ca rô');
  await page.getByRole('button', { name: 'Cài đặt' }).click();
  await page.getByRole('button', { name: 'English' }).click();
  await page.goto('/');
  await expect(page.getByTestId('game-caro')).toContainText('Gomoku');
});
