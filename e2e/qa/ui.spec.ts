/**
 * UI – layout on common screen sizes (qa/test-cases.md: UI-01 … UI-08).
 * One test per device walks every main screen, checks layout rules softly and
 * saves a screenshot of each screen as evidence.
 */
import { test, type Page } from '@playwright/test';
import {
  DEVICES,
  check,
  deviceById,
  evidence,
  openApp,
  settle,
  waitCountdown,
  type Device,
} from './fixtures';

interface Layout {
  overflow: number;
  smallControls: string[];
  clippedText: string[];
  cutNames: string[];
}

/** UI-01, UI-02, UI-05 measured in the page. */
async function measure(page: Page): Promise<Layout> {
  return page.evaluate(() => {
    const vis = (el: Element) => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none';
    };
    const label = (el: Element) =>
      `${el.tagName.toLowerCase()}${el.getAttribute('data-testid') ? `[${el.getAttribute('data-testid')}]` : ''} "${(el.textContent ?? el.getAttribute('aria-label') ?? '').trim().slice(0, 24)}"`;
    const smallControls = [...document.querySelectorAll('button, a[href], input, [role=button]')]
      .filter((el) => vis(el) && !(el as HTMLButtonElement).disabled)
      .filter((el) => !el.closest('.caro-board, .numbers-board, .segmented'))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width < 43.5 || r.height < 43.5)
      .map(({ el, r }) => `${label(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
    // segmented buttons (settings) are 52px tall but may be narrower; height is what matters
    document.querySelectorAll('.segmented button').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (vis(el) && r.height < 43.5) smallControls.push(`${label(el)} h=${Math.round(r.height)}`);
    });
    const clippedText = [
      ...document.querySelectorAll(
        'button, h1, h2, h3, .title, .hint, .status-line, .banner, label, p',
      ),
    ]
      .filter((el) => vis(el) && !el.closest('.mini-name, .name'))
      .filter(
        (el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible',
      )
      .map((el) => label(el));
    // Player names up to 8 characters ("Người 1", "Bé Na") must be shown in full.
    const cutNames = [...document.querySelectorAll('.name, .mini-name')]
      .filter(
        (el) =>
          vis(el) &&
          (el.textContent ?? '').trim().length <= 8 &&
          el.scrollWidth > el.clientWidth + 1,
      )
      .map((el) => `"${el.textContent}"`);
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      smallControls,
      clippedText,
      cutNames,
    };
  });
}

async function boardInView(page: Page, testId: string) {
  return page.getByTestId(testId).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      inside:
        r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1,
      rect: `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)} in ${innerWidth}×${innerHeight}`,
    };
  });
}

async function minTarget(page: Page, selector: string) {
  return page
    .locator(selector)
    .evaluateAll((els) =>
      Math.min(
        ...els.map((e) =>
          Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height),
        ),
      ),
    );
}

async function primaryButtonVisible(page: Page) {
  return page
    .locator('.modal .btn')
    .first()
    .evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom <= innerHeight + 1 && r.top >= 0;
    });
}

async function screen(page: Page, d: Device, theme: string, name: string) {
  await settle(page);
  const m = await measure(page);
  check('UI-01', m.overflow <= 0, `${d.id} ${name}: page wider than screen by ${m.overflow}px`);
  if (['D1', 'D2', 'D3', 'D4', 'D5'].includes(d.id)) {
    check(
      'UI-02',
      m.smallControls.length === 0,
      `${d.id} ${name}: controls < 44px: ${m.smallControls.join('; ')}`,
    );
  }
  check(
    'UI-05',
    m.clippedText.length === 0,
    `${d.id} ${name}: clipped text: ${m.clippedText.join('; ')}`,
  );
  check(
    'UI-05',
    m.cutNames.length === 0,
    `${d.id} ${name}: short names cut off: ${m.cutNames.join('; ')}`,
  );
  await evidence(page, theme, d.id, name);
}

const FULL = DEVICES.map((d) => ({ d, theme: 'classic' as const }));
const CUTE = ['D1', 'D2', 'D7'].map((id) => ({ d: deviceById(id), theme: 'cute' as const }));

for (const { d, theme } of [...FULL, ...CUTE]) {
  test(`[UI-01][UI-02][UI-02b][UI-03][UI-04][UI-05][UI-06][UI-07][UI-09]${d.id === 'D11' ? '[UI-08]' : ''} ${d.id} ${d.name} ${d.width}×${d.height} ${theme}`, async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    const phone = ['D1', 'D2', 'D3', 'D4', 'D5'].includes(d.id);

    // first launch: welcome dialog
    const fresh = await openApp(browser, { device: d, theme, welcome: true });
    await fresh.page.goto('/');
    await fresh.page.getByTestId('welcome').waitFor();
    await settle(fresh.page);
    const startVisible = await fresh.page
      .getByTestId('welcome-start')
      .evaluate((el) => el.getBoundingClientRect().bottom <= innerHeight + 1);
    check('UI-06', startVisible, `${d.id} welcome: "Bắt đầu chơi" needs scrolling`);
    await screen(fresh.page, d, theme, '00-welcome');
    await fresh.ctx.close();

    const { page, ctx } = await openApp(browser, { device: d, theme, name: 'Bé Na' });
    await page.goto('/');
    await page.getByTestId('game-caro').waitFor();
    await screen(page, d, theme, '01-hub');
    await page.goto('/#/settings');
    await screen(page, d, theme, '02-settings');
    await page.goto('/#/about');
    await screen(page, d, theme, '03-about');

    // caro setup + boards
    await page.goto('/#/caro');
    await screen(page, d, theme, '04-caro-mode');
    await page.getByTestId('mode-solo').click();
    await screen(page, d, theme, '05-caro-size');
    await page.getByTestId('size-3').click();
    await screen(page, d, theme, '06-caro-level');
    await page.goto('/#/caro/play?mode=local&size=3');
    await page.getByTestId('cell-4').click();
    await screen(page, d, theme, '07-caro-3x3');
    const b3 = await boardInView(page, 'caro-board');
    check('UI-04', b3.inside, `${d.id} caro 3×3 board not fully visible: ${b3.rect}`);
    if (phone) {
      const t = await minTarget(page, '.caro-cell');
      check('UI-02b', t >= 43.5, `${d.id} caro 3×3 cells ${Math.round(t)}px < 44px`);
    }
    // exit confirm dialog
    await page.getByRole('button', { name: 'Quay lại' }).click();
    await settle(page);
    check(
      'UI-06',
      await primaryButtonVisible(page),
      `${d.id} exit dialog: main button needs scrolling`,
    );
    await screen(page, d, theme, '08-exit-confirm');
    await page.getByTestId('keep-playing').click();
    // X:4 so far; O:0, X:8, O:1, X:7, O:2 → O completes the top row
    for (const i of [0, 8, 1, 7, 2]) await page.getByTestId(`cell-${i}`).click();
    await page.getByTestId('result-title').waitFor();
    await settle(page, 600);
    check(
      'UI-06',
      await primaryButtonVisible(page),
      `${d.id} result dialog: main button needs scrolling`,
    );
    await screen(page, d, theme, '09-caro-result');

    await page.goto('/#/caro/play?mode=local&size=15');
    await page.getByTestId('cell-112').click();
    await screen(page, d, theme, '10-caro-15x15');
    if (phone) {
      const t = await minTarget(page, '.caro-cell');
      check('UI-02b', t >= 31.5, `${d.id} caro 15×15 cells ${Math.round(t)}px < 32px`);
    }

    // numbers
    await page.goto('/#/numbers');
    await screen(page, d, theme, '11-numbers-mode');
    await page.getByTestId('mode-practice').click();
    await screen(page, d, theme, '12-numbers-level');
    for (const [level, min] of [
      ['easy', 43.5],
      ['medium', 43.5],
      ['hard', 31.5],
    ] as const) {
      await page.goto(`/#/numbers/play?mode=practice&level=${level}`);
      await page.reload();
      await waitCountdown(page);
      await page.getByTestId('num-1').click();
      await screen(page, d, theme, `13-numbers-${level}`);
      const nb = await boardInView(page, 'numbers-board');
      check('UI-03', nb.inside, `${d.id} numbers ${level} board not fully visible: ${nb.rect}`);
      if (phone) {
        const t = await minTarget(page, '.num');
        check(
          'UI-02b',
          t >= min,
          `${d.id} numbers ${level} tap area ${Math.round(t)}px < ${min + 0.5}px`,
        );
      }
    }

    await page.goto('/#/coganh/play?mode=local');
    await page.getByTestId('pt-10').click();
    await screen(page, d, theme, '16-coganh');
    const cg = await boardInView(page, 'cg-board');
    check('UI-09', cg.inside, `${d.id} Cờ gánh board not fully visible: ${cg.rect}`);

    await page.goto('/#/join');
    await screen(page, d, theme, '14-join');
    await page.goto('/#/numbers');
    await page.getByTestId('mode-online').click();
    await page.getByTestId('level-easy').click();
    await screen(page, d, theme, '15-online-lobby');
    await ctx.close();
  });
}
