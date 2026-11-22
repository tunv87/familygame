/**
 * Walks every screen in both themes on an iPhone-sized viewport and checks that:
 *  - all text uses the bundled Nunito font and its Vietnamese subset is loaded
 *  - nothing overflows horizontally
 *  - on the numbers board every number has the same font size and disc size
 * Screenshots go to test-results/screens/<theme>-<screen>.png for a visual pass.
 */
import { expect, test, type Browser, type Page } from '@playwright/test';
import { SKIP_WELCOME, createRoom } from './helpers';
import { devices } from '@playwright/test';

const THEMES = ['classic', 'cute'] as const;
type Theme = (typeof THEMES)[number];

async function player(browser: Browser, theme: Theme, name?: string) {
  const ctx = await browser.newContext({
    ...devices['iPhone 14'],
    locale: 'vi-VN',
    storageState: SKIP_WELCOME,
  });
  await ctx.addInitScript(
    ([theme, name]) => {
      localStorage.setItem('fg:settings', JSON.stringify({ theme }));
      if (name) localStorage.setItem('fg:profile', JSON.stringify({ name, avatar: '🐰' }));
    },
    [theme, name ?? ''] as const,
  );
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  return page;
}

async function checkScreen(page: Page, theme: Theme, screen: string) {
  await page.waitForTimeout(350); // let pop/fade animations finish
  const report = await page.evaluate(async () => {
    await document.fonts.ready;
    const badFont: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent ?? '';
      if (!/\p{L}|\p{N}/u.test(text)) continue; // emoji / whitespace only
      const el = n.parentElement!;
      if (el.closest('.log-view')) continue; // intentionally monospace
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const first = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim();
      if (first !== 'Nunito')
        badFont.push(`${el.tagName}.${el.className}: "${text.trim().slice(0, 20)}" → ${first}`);
    }
    const faces = [...document.fonts].filter((f) => f.family.replace(/["']/g, '') === 'Nunito');
    const vietLoaded = faces.some(
      (f) => f.status === 'loaded' && f.unicodeRange.includes('U+1EA0'),
    );
    const hasVietText = /[ạ-ỹđăâêôơư]/i.test(document.body.innerText);
    // Short names (≤ 8 chars) must never be cut off with an ellipsis.
    const truncated = [...document.querySelectorAll<HTMLElement>('.name, .mini-name')]
      .filter((e) => (e.textContent ?? '').trim().length <= 8 && e.scrollWidth > e.clientWidth + 1)
      .map((e) => e.textContent);
    return {
      badFont,
      truncated,
      vietLoaded,
      hasVietText,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  await page.screenshot({ path: `test-results/screens/${theme}-${screen}.png` });
  expect(report.badFont, `${screen}: elements not using Nunito`).toEqual([]);
  if (report.hasVietText)
    expect(report.vietLoaded, `${screen}: Vietnamese font subset loaded`).toBe(true);
  expect(report.truncated, `${screen}: short names cut off`).toEqual([]);
  expect(report.overflow, `${screen}: horizontal overflow (px)`).toBeLessThanOrEqual(0);
}

async function expectUniformNumbers(page: Page) {
  const faces = await page.locator('.num-face').evaluateAll((els) =>
    els.map((e) => ({
      font: getComputedStyle(e).fontSize,
      w: Math.round(e.getBoundingClientRect().width),
    })),
  );
  expect(faces.length).toBeGreaterThan(0);
  expect(new Set(faces.map((f) => f.font)).size, 'number font sizes').toBe(1);
  // rotated boxes report slightly different widths; compare un-rotated layout width instead
  const widths = await page
    .locator('.num-face')
    .evaluateAll((els) => els.map((e) => (e as HTMLElement).offsetWidth));
  expect(new Set(widths).size, 'number disc sizes').toBe(1);
}

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    test('offline screens', async ({ browser }) => {
      const page = await player(browser, theme);
      await page.goto('/');
      await checkScreen(page, theme, 'hub');

      await page.getByRole('button', { name: /Cài đặt/ }).click();
      await checkScreen(page, theme, 'settings');
      await page.getByRole('button', { name: /Nhật ký lỗi/ }).click();
      await checkScreen(page, theme, 'debug');

      await page.goto('/#/caro');
      await checkScreen(page, theme, 'caro-mode');
      await page.getByRole('button', { name: 'Cách chơi' }).click();
      await checkScreen(page, theme, 'caro-help');
      await page.getByRole('button', { name: 'OK' }).click();
      await page.getByTestId('mode-solo').click();
      await checkScreen(page, theme, 'caro-size');
      await page.getByTestId('size-3').click();
      await checkScreen(page, theme, 'caro-level');
      await page.getByTestId('level-easy').click();
      await checkScreen(page, theme, 'caro-solo-3');

      await page.goto('/#/caro/play?mode=local&size=3');
      await page.getByTestId('cell-4').click();
      await page.getByRole('button', { name: 'Quay lại' }).click();
      await checkScreen(page, theme, 'exit-confirm');
      await page.getByTestId('keep-playing').click();
      for (const i of [3, 0, 5]) await page.getByTestId(`cell-${i}`).click();
      await page.waitForTimeout(1200); // confetti settles
      await checkScreen(page, theme, 'caro-local-result');

      await page.goto('/#/caro/play?mode=local&size=15');
      await page.getByTestId('cell-112').click();
      await checkScreen(page, theme, 'caro-local-15');

      await page.goto('/#/numbers');
      await checkScreen(page, theme, 'numbers-mode');
      await page.getByTestId('mode-practice').click();
      await checkScreen(page, theme, 'numbers-level');
      await page.getByTestId('level-easy').click();
      await expect(page.getByTestId('countdown')).toBeHidden({ timeout: 10_000 });
      await page.getByTestId('num-1').click();
      await expectUniformNumbers(page);
      await checkScreen(page, theme, 'numbers-practice');
      await page.goto('/#/numbers/play?mode=bot&level=hard');
      await expect(page.getByTestId('countdown')).toBeHidden({ timeout: 10_000 });
      await expectUniformNumbers(page);
      await checkScreen(page, theme, 'numbers-bot');
      await page.goto('/#/numbers');
      await page.getByTestId('mode-online').click();
      await page.getByTestId('level-hard').click();
      await checkScreen(page, theme, 'numbers-lobby');
      await page.getByTestId('create-room').click();
      await checkScreen(page, theme, 'profile');

      await page.goto('/#/join');
      await page.getByTestId('name-input').fill('Bé Na');
      await page.getByTestId('save-profile').click();
      for (const d of '12') await page.getByTestId(`key-${d}`).click();
      await checkScreen(page, theme, 'join');
    });

    test('online screens', async ({ browser }) => {
      const a = await player(browser, theme);
      const b = await player(browser, theme, 'Ông Nội');
      await a.goto('/#/numbers');
      await a.getByTestId('mode-online').click();
      await a.getByTestId('level-hard').click();
      const code = await createRoom(a, 'Bé Na Nguyễn Thị');
      await checkScreen(a, theme, 'room-waiting');

      await b.goto(`/#/join/${code}`);
      await expect(a.getByTestId('countdown')).toBeHidden({ timeout: 15_000 });
      await expect(b.getByTestId('countdown')).toBeHidden({ timeout: 15_000 });
      for (let n = 1; n <= 8; n++) await (n % 2 ? a : b).getByTestId(`num-${n}`).click();
      await expect(a.getByTestId('target')).toContainText('9');
      await expectUniformNumbers(a);
      await checkScreen(a, theme, 'numbers-hard');
      await a.getByTestId('exit').click();
      await checkScreen(a, theme, 'numbers-exit');
      await a.getByTestId('confirm-exit').click();

      const c = await player(browser, theme);
      const d = await player(browser, theme, 'Mẹ');
      await c.goto('/#/caro');
      await c.getByTestId('mode-online').click();
      await c.getByTestId('size-3').click();
      const code2 = await createRoom(c, 'Đức Anh');
      await d.goto(`/#/join/${code2}`);
      await expect(c.getByTestId('status')).toContainText('Đến lượt bạn', { timeout: 15_000 });
      await checkScreen(c, theme, 'caro-online');
      for (const [p, i] of [
        [c, 0],
        [d, 3],
        [c, 1],
        [d, 4],
        [c, 2],
      ] as const) {
        await expect(p.getByTestId('status')).toContainText('Đến lượt bạn');
        await p.getByTestId(`cell-${i}`).click();
      }
      await expect(d.getByTestId('result-title')).toBeVisible();
      await d.waitForTimeout(1200);
      await checkScreen(d, theme, 'caro-online-result');
    });
  });
}

test('numbers: easy and medium boards also use one size', async ({ browser }) => {
  for (const level of ['easy', 'medium'] as const) {
    const a = await player(browser, 'classic');
    const b = await player(browser, 'classic', 'B');
    await a.goto('/#/numbers');
    await a.getByTestId('mode-online').click();
    await a.getByTestId(`level-${level}`).click();
    const code = await createRoom(a, 'A');
    await b.goto(`/#/join/${code}`);
    await expect(a.getByTestId('countdown')).toBeHidden({ timeout: 15_000 });
    await a.getByTestId('num-1').click();
    await b.getByTestId('num-2').click();
    await expect(a.getByTestId('target')).toContainText('3');
    await expectUniformNumbers(a);
  }
});
