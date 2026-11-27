/** Computers: boards use most of the screen (qa/test-cases.md: UI-12). */
import { expect, test } from '@playwright/test';
import { DEVICES, evidence, openApp } from './fixtures';

const DESKTOPS = DEVICES.filter((d) => ['D8', 'D9', 'D11'].includes(d.id));
const SCREENS: [string, string, string, 'h' | 'w', number][] = [
  // name, route, board test id, which side to measure, minimum share of the window
  ['coganh', '/#/coganh/play?mode=local', 'cg-board', 'h', 0.75],
  ['caro3', '/#/caro/play?mode=local&size=3', 'caro-board', 'h', 0.75],
  ['caro15', '/#/caro/play?mode=local&size=15', 'caro-board', 'h', 0.75],
  ['numbers', '/#/numbers/play?mode=practice&level=medium', 'numbers-board', 'h', 0.75],
  ['oanquan', '/#/oanquan/play?mode=local', 'oaq-board', 'w', 0.5],
];

for (const d of DESKTOPS) {
  test(`[UI-12] boards fill the screen on ${d.id} ${d.name}`, async ({ browser }) => {
    const { page, ctx } = await openApp(browser, { device: d });
    await page.goto('/');
    // the website has the computer layout; the iOS / Android app never loads it
    expect(await page.evaluate(() => document.documentElement.dataset.shell)).toBe('web');
    for (const [name, route, id, side, min] of SCREENS) {
      await page.goto(route);
      const board = page.getByTestId(id);
      await board.waitFor({ timeout: 15_000 });
      await page.waitForTimeout(name === 'numbers' ? 3500 : 400);
      const r = await board.evaluate((el) => {
        const b = el.getBoundingClientRect();
        return {
          h: b.height / innerHeight,
          w: b.width / innerWidth,
          inside:
            b.left >= -1 && b.top >= -1 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1,
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect
        .soft(r[side], `[UI-12] ${d.id} ${name}: board uses ${Math.round(r[side] * 100)}%`)
        .toBeGreaterThanOrEqual(min);
      expect.soft(r.inside, `[UI-12] ${d.id} ${name}: board not fully visible`).toBe(true);
      expect
        .soft(r.overflow, `[UI-12] ${d.id} ${name}: horizontal overflow`)
        .toBeLessThanOrEqual(0);
      if (name === 'oanquan') {
        // the wide board must not cover the buttons under it
        const overlap = await page.evaluate(() => {
          const b = document.querySelector('[data-testid="oaq-board"]')!.getBoundingClientRect();
          const btn = document.querySelector('[data-testid="dir-right"]')!.getBoundingClientRect();
          return b.bottom - btn.top;
        });
        expect
          .soft(overlap, `[UI-12] ${d.id} oanquan: board covers the buttons`)
          .toBeLessThanOrEqual(0);
      }
      await evidence(page, 'desktop', d.id, `19-${name}`);
    }
    await ctx.close();
  });
}
