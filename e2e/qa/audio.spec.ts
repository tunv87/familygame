/** AU – sounds and music (qa/test-cases.md: AU-02 … AU-07). */
import { expect, test, type Page } from '@playwright/test';
import { openApp, waitCountdown } from './fixtures';

const played = (page: Page) =>
  page.evaluate(() => [...((window as unknown as { __fgSounds?: string[] }).__fgSounds ?? [])]);

/** Counts oscillators (synthesised sounds) and decoded file sounds actually started. */
const COUNT_AUDIO = () => {
  const w = window as unknown as { __osc: number; __buf: number };
  w.__osc = 0;
  w.__buf = 0;
  const osc = AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator = function () {
    w.__osc++;
    return osc.call(this);
  };
  const buf = AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource = function () {
    w.__buf++;
    return buf.call(this);
  };
};

test('[AU-02] countdown: three ticks then "go"', async ({ browser }) => {
  const { page } = await openApp(browser, { sound: true });
  await page.goto('/');
  await page.getByTestId('game-caro').waitFor();
  await page.mouse.click(10, 10); // first tap unlocks audio
  await page.goto('/#/numbers/play?mode=practice&level=easy');
  await waitCountdown(page);
  const s = await played(page);
  expect(s.filter((x) => x === 'tick').length, `[AU-02] played: ${s.join(',')}`).toBe(3);
  expect(s.filter((x) => x === 'go').length, `[AU-02] played: ${s.join(',')}`).toBe(1);
});

test('[AU-03] results: win, draw and new record each have their sound', async ({ browser }) => {
  const { page } = await openApp(browser, { sound: true });
  await page.goto('/#/caro/play?mode=local&size=3');
  for (const i of [0, 3, 1, 4, 2]) await page.getByTestId(`cell-${i}`).click();
  await expect(page.getByTestId('result-title')).toBeVisible();
  expect(await played(page), '[AU-03] win').toContain('win');
  await page.getByTestId('play-again').click();
  // X O X / X O O / O X X → draw (player 2 starts this round)
  for (const i of [0, 1, 2, 4, 3, 5, 7, 6, 8]) await page.getByTestId(`cell-${i}`).click();
  await expect(page.getByTestId('result-title')).toHaveText(/Hoà/);
  expect(await played(page), '[AU-03] draw').toContain('draw');
  await page.goto('/#/numbers/play?mode=practice&level=easy');
  await page.reload();
  await waitCountdown(page);
  for (let n = 1; n <= 30; n++) await page.getByTestId(`num-${n}`).click();
  await expect(page.getByTestId('result-title')).toHaveText('Kỷ lục mới! 🏆');
  expect(await played(page), '[AU-03] record').toContain('record');
});

test('[AU-04] small feedback is silent: taps, right/wrong numbers and moves make no sound', async ({
  browser,
}) => {
  const { page } = await openApp(browser, { sound: true, initScript: COUNT_AUDIO });
  await page.goto('/#/numbers/play?mode=bot&level=easy');
  await waitCountdown(page);
  await page.waitForTimeout(500); // let the countdown's own \"go\" sound finish
  const before = await page.evaluate(
    () => (window as unknown as { __osc: number; __buf: number }).__osc,
  );
  await page.getByTestId('num-9').click(); // wrong
  await page.getByTestId('num-1').click(); // right
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => (window as unknown as { __osc: number }).__osc);
  expect(after - before, '[AU-04] a synthesised sound played on a tap').toBe(0);
  const s = await played(page);
  expect(
    s.filter((x) => !['tick', 'go'].includes(x)),
    '[AU-04] unexpected sounds',
  ).toEqual([]);
});

test('[AU-05] with sound off nothing plays', async ({ browser }) => {
  const { page } = await openApp(browser, { sound: false, initScript: COUNT_AUDIO });
  await page.goto('/#/caro/play?mode=local&size=3');
  for (const i of [0, 3, 1, 4, 2]) await page.getByTestId(`cell-${i}`).click();
  await expect(page.getByTestId('result-title')).toBeVisible();
  const n = await page.evaluate(() => {
    const w = window as unknown as { __osc: number; __buf: number };
    return w.__osc + w.__buf;
  });
  expect({ played: await played(page), started: n }, '[AU-05] audio while sound is off').toEqual({
    played: [],
    started: 0,
  });
});

test('[AU-06] music is off by default, starts when switched on, survives a reload, stops when off', async ({
  browser,
}) => {
  const { page } = await openApp(browser);
  const playing = () =>
    page.evaluate(
      () => (window as unknown as { __fgMusic?: () => boolean }).__fgMusic?.() ?? false,
    );
  await page.goto('/#/settings');
  await page.getByTestId('setting-music').waitFor();
  await page.mouse.click(5, 5);
  expect(await playing(), '[AU-06] music on by default').toBe(false);
  const row = page.getByTestId('setting-music');
  await expect(row.getByRole('button', { name: 'Tắt' }), '[AU-06] default not off').toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await row.getByRole('button', { name: 'Bật' }).click();
  await expect.poll(playing, { message: '[AU-06] music did not start' }).toBe(true);
  await page.reload();
  await page.getByTestId('setting-music').waitFor();
  await page.mouse.click(5, 5); // browsers need a tap before audio
  await expect.poll(playing, { message: '[AU-06] music setting not kept after reload' }).toBe(true);
  await page.getByTestId('setting-music').getByRole('button', { name: 'Tắt' }).click();
  await expect.poll(playing, { message: '[AU-06] music did not stop' }).toBe(false);
});

test('[AU-07] each theme loads its own sound set', async ({ browser }) => {
  const { page } = await openApp(browser, { sound: true, theme: 'classic' });
  const loaded: string[] = [];
  page.on('request', (r) => {
    const m = r.url().match(/sounds\/(\w+)\/\w+\.mp3/);
    if (m) loaded.push(m[1]);
  });
  await page.goto('/#/settings');
  await page.getByTestId('setting-music').waitFor();
  await page.mouse.click(5, 5);
  await expect
    .poll(() => loaded.includes('classic'), { message: '[AU-07] classic sounds not loaded' })
    .toBe(true);
  await page.getByTestId('theme-cute').click();
  await expect
    .poll(() => loaded.includes('cute'), {
      message: '[AU-07] cute sounds not loaded after switching theme',
    })
    .toBe(true);
});
