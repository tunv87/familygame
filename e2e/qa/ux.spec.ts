/** UX – game experience (qa/test-cases.md: UX-01 … UX-15). Device: iPhone 14 unless noted. */
import { expect, test } from '@playwright/test';
import { check, evidence, openApp, settle, waitCountdown } from './fixtures';

test('[UX-01] correct tap gives visual feedback within 100 ms', async ({ browser }) => {
  const { page } = await openApp(browser);
  await page.goto('/#/numbers/play?mode=practice&level=easy');
  await waitCountdown(page);
  await page.evaluate(() => {
    const w = window as unknown as { __tap: number; __times: number[] };
    w.__times = [];
    document.addEventListener('pointerdown', () => (w.__tap = performance.now()), true);
    new MutationObserver((list) => {
      for (const m of list) {
        const el = m.target as HTMLElement;
        if (m.attributeName === 'class' && el.className.includes('mine') && !el.dataset.timed) {
          el.dataset.timed = '1';
          w.__times.push(performance.now() - w.__tap);
        }
      }
    }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  });
  for (let n = 1; n <= 5; n++) await page.getByTestId(`num-${n}`).click();
  await page.waitForTimeout(300);
  const times = (
    await page.evaluate(() => (window as unknown as { __times: number[] }).__times)
  ).map((t) => Math.round(t));
  expect(times.length, '[UX-01] taps not registered').toBe(5);
  expect(Math.max(...times), `[UX-01] feedback times ms: ${times.join(', ')}`).toBeLessThanOrEqual(
    100,
  );
});

test('[UX-02] computer answers within 1 second on the 15×15 board (hard)', async ({ browser }) => {
  const { page } = await openApp(browser);
  await page.goto('/#/caro/play?mode=solo&size=15&level=hard');
  const times: number[] = [];
  const mine = [112, 96, 128, 98, 126, 80];
  for (const idx of mine) {
    const cell = page.getByTestId(`cell-${idx}`);
    if (!(await cell.isEnabled()) || (await page.getByTestId('result-title').isVisible())) break;
    const before = await page.locator('.caro-cell.o').count();
    const t0 = Date.now();
    await cell.click();
    await expect(page.locator('.caro-cell.o')).toHaveCount(before + 1, { timeout: 5000 });
    times.push(Date.now() - t0);
  }
  expect(Math.max(...times), `[UX-02] response times ms: ${times.join(', ')}`).toBeLessThanOrEqual(
    1000,
  );
});

test('[UX-03] every screen has a way back or out', async ({ browser }) => {
  const { page } = await openApp(browser, { name: 'Bé Na' });
  const routes = [
    '/#/settings',
    '/#/about',
    '/#/debug',
    '/#/caro',
    '/#/caro/play?mode=solo&size=3&level=easy',
    '/#/caro/play?mode=local&size=15',
    '/#/numbers',
    '/#/numbers/play?mode=bot&level=easy',
    '/#/numbers/play?mode=practice&level=hard',
    '/#/join',
  ];
  for (const r of routes) {
    await page.goto(r);
    await page.reload();
    await settle(page);
    const ways = await page
      .locator('[aria-label="Quay lại"], [data-testid="exit"]')
      .filter({ visible: true })
      .count();
    check('UX-03', ways > 0, `${r}: no back/exit control`);
  }
});

test('[UX-04] leaving mid-game asks first and "keep playing" keeps the game', async ({
  browser,
}) => {
  const { page } = await openApp(browser);
  await page.goto('/#/caro/play?mode=local&size=3');
  await page.getByTestId('cell-4').click();
  await page.getByTestId('cell-0').click();
  await page.getByRole('button', { name: 'Quay lại' }).click();
  await expect(page.getByTestId('keep-playing'), '[UX-04] caro: no confirmation').toBeVisible();
  await page.getByTestId('keep-playing').click();
  await expect(page.locator('.caro-cell.x, .caro-cell.o'), '[UX-04] caro: moves lost').toHaveCount(
    2,
  );

  await page.goto('/#/numbers/play?mode=practice&level=easy');
  await page.reload();
  await waitCountdown(page);
  for (const n of [1, 2, 3]) await page.getByTestId(`num-${n}`).click();
  await page.getByTestId('exit').click();
  await expect(page.getByTestId('keep-playing'), '[UX-04] numbers: no confirmation').toBeVisible();
  await page.getByTestId('keep-playing').click();
  await expect(page.getByTestId('target'), '[UX-04] numbers: progress lost').toContainText('4');
});

test('[UX-05][UX-12] end of a round shows the result, play again and home; replay counts down', async ({
  browser,
}) => {
  const { page } = await openApp(browser);
  await page.goto('/#/numbers/play?mode=practice&level=easy');
  await waitCountdown(page);
  for (let n = 1; n <= 30; n++) await page.getByTestId(`num-${n}`).click();
  await expect(page.getByTestId('result-title'), '[UX-05] no result title').toBeVisible();
  await expect(page.getByTestId('play-again'), '[UX-05] no play again').toBeVisible();
  await expect(
    page.getByRole('button', { name: /Trang chủ/ }),
    '[UX-05] no home button',
  ).toBeVisible();
  await evidence(page, 'ux', 'D2', 'UX-05-result');
  await page.getByTestId('play-again').click();
  await expect(page.getByTestId('countdown'), '[UX-12] no countdown on replay').toBeVisible();
});

test('[UX-06] the next number is hinted after 15 s without progress', async ({ browser }) => {
  const { page } = await openApp(browser);
  await page.clock.install();
  await page.goto('/#/numbers/play?mode=practice&level=easy');
  await page.clock.runFor(3000);
  await waitCountdown(page);
  await expect(page.getByTestId('num-1')).not.toHaveClass(/hint/);
  await page.clock.runFor(16_000);
  await expect(page.getByTestId('num-1'), '[UX-06] no hint after 16 s').toHaveClass(/hint/);
  await evidence(page, 'ux', 'D2', 'UX-06-hint');
});

test('[UX-07] undo vs computer removes both moves', async ({ browser }) => {
  const { page } = await openApp(browser);
  await page.goto('/#/caro/play?mode=solo&size=3&level=easy');
  await page.getByTestId('cell-4').click();
  await expect(page.locator('.caro-cell.o')).toHaveCount(1, { timeout: 3000 });
  await page.getByRole('button', { name: /Đi lại/ }).click();
  await expect(
    page.locator('.caro-cell.x, .caro-cell.o'),
    '[UX-07] board not empty after undo',
  ).toHaveCount(0);
});

test('[UX-08] large text makes text bigger', async ({ browser }) => {
  const { page } = await openApp(browser);
  await page.goto('/#/settings');
  const before = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  await page
    .locator('.setting-row', { hasText: 'Chữ to' })
    .getByRole('button', { name: 'Bật' })
    .click();
  const after = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  expect(after, `[UX-08] font ${before}px → ${after}px`).toBeGreaterThan(before);
  await evidence(page, 'ux', 'D2', 'UX-08-bigtext');
});

test('[UX-09] settings survive a reload', async ({ browser }) => {
  const { page } = await openApp(browser);
  await page.goto('/#/settings');
  await page.getByTestId('theme-cute').click();
  await page.getByRole('button', { name: 'English' }).click();
  await page
    .locator('.setting-row', { hasText: 'Sound' })
    .getByRole('button', { name: 'Off' })
    .click();
  await page.reload();
  await expect(page.locator('html'), '[UX-09] theme lost').toHaveAttribute('data-theme', 'cute');
  await expect(
    page.getByRole('heading', { name: 'Settings' }),
    '[UX-09] language lost',
  ).toBeVisible();
  await expect(
    page.locator('.setting-row', { hasText: 'Sound' }).getByRole('button', { name: 'Off' }),
    '[UX-09] sound setting lost',
  ).toHaveAttribute('aria-pressed', 'true');
});

test('[UX-10] with sound off there is no sound and no vibration', async ({ browser }) => {
  const { page } = await openApp(browser, {
    sound: false,
    initScript: () => {
      const w = window as unknown as { __audio: number; __vibrate: number; AudioContext: unknown };
      w.__audio = 0;
      w.__vibrate = 0;
      const Real = window.AudioContext;
      w.AudioContext = function (...a: unknown[]) {
        w.__audio++;
        return new (Real as unknown as new (...x: unknown[]) => AudioContext)(...a);
      };
      navigator.vibrate = () => {
        w.__vibrate++;
        return true;
      };
    },
  });
  await page.goto('/#/numbers/play?mode=practice&level=easy');
  await waitCountdown(page);
  await page.getByTestId('num-5').click(); // wrong → "bad" sound + vibration
  await page.getByTestId('num-1').click(); // right → "good" sound
  const counts = await page.evaluate(() => {
    const w = window as unknown as { __audio: number; __vibrate: number };
    return { audio: w.__audio, vibrate: w.__vibrate };
  });
  expect(counts, '[UX-10] audio/vibration used while sound is off').toEqual({
    audio: 0,
    vibrate: 0,
  });
});

test('[UX-11] text contrast meets WCAG AA in both themes', async ({ browser }) => {
  test.setTimeout(120_000);
  for (const theme of ['classic', 'cute'] as const) {
    const { page, ctx } = await openApp(browser, { theme, name: 'Bé Na' });
    const routes = [
      '/',
      '/#/settings',
      '/#/about',
      '/#/caro',
      '/#/numbers',
      '/#/join',
      '/#/caro/play?mode=solo&size=3&level=easy',
      '/#/numbers/play?mode=bot&level=easy',
    ];
    for (const r of routes) {
      await page.goto(r);
      await page.reload();
      await settle(page, 3500); // past the countdown on game screens
      const bad = await page.evaluate(() => {
        const parse = (c: string) => {
          const m = c.match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const [r, g, b, a = '1'] = m[1].split(',').map((x) => x.trim());
          return { r: +r, g: +g, b: +b, a: +a };
        };
        const lum = ({ r, g, b }: { r: number; g: number; b: number }) => {
          const f = (v: number) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const bgOf = (el: Element | null): { r: number; g: number; b: number } | 'complex' => {
          for (let e = el; e; e = e.parentElement) {
            const st = getComputedStyle(e);
            if (st.backgroundImage && st.backgroundImage !== 'none' && !e.matches('body'))
              return 'complex';
            const c = parse(st.backgroundColor);
            if (c && c.a > 0.9) return c;
          }
          return (
            parse(getComputedStyle(document.body).backgroundColor) ?? { r: 255, g: 255, b: 255 }
          );
        };
        const out: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const seen = new Set<Element>();
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const el = n.parentElement!;
          if (seen.has(el) || !/[\p{L}\p{N}]/u.test(n.textContent ?? '')) continue;
          seen.add(el);
          const rect = el.getBoundingClientRect();
          if (!rect.width || el.closest('button:disabled, .log-view, .modal-backdrop, .countdown'))
            continue;
          const st = getComputedStyle(el);
          const fg = parse(st.color);
          const bg = bgOf(el);
          if (!fg || bg === 'complex') continue;
          const op = parseFloat(st.opacity);
          if (op < 1) continue; // faded items (claimed numbers) are decorative
          const L1 = lum(fg);
          const L2 = lum(bg);
          const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
          const size = parseFloat(st.fontSize);
          const large = size >= 24 || (size >= 18.66 && parseInt(st.fontWeight) >= 700);
          if (ratio < (large ? 3 : 4.5))
            out.push(
              `"${(n.textContent ?? '').trim().slice(0, 20)}" ${ratio.toFixed(2)}:1 (${st.color} on rgb(${bg.r},${bg.g},${bg.b}))`,
            );
        }
        return out;
      });
      check(
        'UX-11',
        bad.length === 0,
        `${theme} ${r}: low contrast: ${bad.slice(0, 6).join(' | ')}`,
      );
    }
    await ctx.close();
  }
});

test('[UX-13] a wrong room code gives a clear message within 5 s', async ({ browser }) => {
  const { page } = await openApp(browser, { name: 'Bé Na' });
  await page.goto('/#/join');
  const t0 = Date.now();
  for (const d of '0000') await page.getByTestId(`key-${d}`).click();
  await expect(page.getByText('Không tìm thấy phòng 0000'), '[UX-13] no message').toBeVisible({
    timeout: 5000,
  });
  expect(Date.now() - t0).toBeLessThanOrEqual(5000);
  await expect(page.getByTestId('key-1'), '[UX-13] keypad locked after error').toBeEnabled();
  await evidence(page, 'ux', 'D2', 'UX-13-wrong-code');
});

test('[UX-14] creating a room while offline reports the problem within 10 s', async ({
  browser,
}) => {
  const { page, ctx } = await openApp(browser, { name: 'Bé Na' });
  await page.goto('/#/caro');
  await page.getByTestId('mode-online').click();
  await page.getByTestId('size-3').click();
  await ctx.setOffline(true);
  await page.getByTestId('create-room').click();
  await expect(
    page.getByText('Không kết nối được'),
    '[UX-14] no error message within 10 s (spinner forever)',
  ).toBeVisible({ timeout: 10_000 });
  await evidence(page, 'ux', 'D2', 'UX-14-offline');
  await ctx.setOffline(false);
});

test('[UX-15] welcome shows on first launch only', async ({ browser }) => {
  const { page } = await openApp(browser, { welcome: true });
  await page.goto('/');
  await expect(page.getByTestId('welcome'), '[UX-15] no welcome on first launch').toBeVisible();
  await page.getByTestId('welcome-start').click();
  await page.reload();
  await page.getByTestId('game-caro').waitFor();
  await expect(page.getByTestId('welcome'), '[UX-15] welcome shown again').toHaveCount(0);
});
