import { devices, expect, test } from '@playwright/test';

test('first launch shows the welcome, applies theme live, and never shows again', async ({
  browser,
}) => {
  // Fresh device: no storage state at all.
  const page = await (
    await browser.newContext({
      ...devices['iPhone 14'],
      locale: 'vi-VN',
      storageState: { cookies: [], origins: [] },
    })
  ).newPage();
  await page.goto('/');
  await expect(page.getByTestId('welcome')).toHaveText('Chào mừng! 👋');
  await page.getByTestId('welcome-theme-cute').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'cute');
  await page.getByTestId('welcome-name').fill('Bé Na');
  await page.screenshot({ path: 'test-results/screens/welcome.png' });
  await page.getByTestId('welcome-start').click();
  await expect(page.getByTestId('welcome')).toBeHidden();
  await page.reload();
  await expect(page.getByTestId('game-caro')).toBeVisible();
  await expect(page.getByTestId('welcome')).toHaveCount(0);
  // the name is remembered for online play
  await page.goto('/#/settings');
  await expect(page.getByText('Bé Na')).toBeVisible();
});

test('about screen shows the privacy policy in the app language', async ({ page }) => {
  await page.goto('/#/settings');
  await page.getByTestId('about').click();
  await expect(page.getByTestId('privacy')).toContainText('Chính sách quyền riêng tư');
  await expect(page.getByTestId('privacy')).toContainText('không theo dõi');
});

test('the public privacy page is served for the store listings', async ({ request }) => {
  const res = await request.get('/privacy.html');
  expect(res.ok()).toBe(true);
  const html = await res.text();
  expect(html).toContain('Chính sách quyền riêng tư');
  expect(html).toContain('Privacy Policy');
});
