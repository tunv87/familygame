/**
 * Store screenshots for the App Store and Google Play, in Vietnamese and English.
 * Each scene is captured from the real app, then placed in a frame with a caption.
 *
 * Output (fastlane layout):
 *   fastlane/screenshots/<vi|en-US>/<n>_<device>.png            (App Store)
 *   fastlane/metadata/android/<vi|en-US>/images/phoneScreenshots/<n>.png
 *   fastlane/metadata/android/<vi|en-US>/images/featureGraphic.png, icon.png
 */
import { test, type Browser, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import captions from './captions.json' with { type: 'json' };

type Lang = 'vi' | 'en';
type Theme = 'classic' | 'cute';

// Final image sizes required by the stores, and the app viewport shown inside the frame.
const DEVICES = {
  // App Store: iPhone 6.9" (1320×2868) and iPad 13" (2064×2752)
  iphone: { frame: [440, 956], scale: 3, app: [390, 844], appScale: 3, mobile: true },
  ipad: { frame: [1032, 1376], scale: 2, app: [820, 1180], appScale: 2, mobile: true },
  // Google Play phone (1080×2400)
  android: { frame: [360, 800], scale: 3, app: [360, 780], appScale: 3, mobile: true },
} as const;
type Device = keyof typeof DEVICES;

const ROOT = join(import.meta.dirname, '..');
const font = (file: string) =>
  readFileSync(join(ROOT, 'node_modules/@fontsource/nunito/files', file)).toString('base64');
const FONT_CSS = ['latin', 'latin-ext', 'vietnamese']
  .map(
    (subset) =>
      `@font-face{font-family:Nunito;font-weight:900;src:url(data:font/woff2;base64,${font(`nunito-${subset}-900-normal.woff2`)}) format('woff2')}
       @font-face{font-family:Nunito;font-weight:700;src:url(data:font/woff2;base64,${font(`nunito-${subset}-700-normal.woff2`)}) format('woff2')}`,
  )
  .join('\n');

function write(path: string, data: Buffer) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
}

async function appPage(browser: Browser, device: Device, lang: Lang, theme: Theme, name: string) {
  const d = DEVICES[device];
  const ctx = await browser.newContext({
    viewport: { width: d.app[0], height: d.app[1] },
    deviceScaleFactor: d.appScale,
    isMobile: d.mobile,
    hasTouch: true,
    locale: lang === 'vi' ? 'vi-VN' : 'en-US',
  });
  await ctx.addInitScript(
    ([lang, theme, name]) => {
      localStorage.setItem('fg:onboarded', '{"done":true}');
      localStorage.setItem('fg:settings', JSON.stringify({ lang, theme, sound: false }));
      localStorage.setItem('fg:profile', JSON.stringify({ name, avatar: '🐰' }));
    },
    [lang, theme, name] as const,
  );
  return ctx.newPage();
}

/** Hide dialogs/confetti so the board itself is visible (e.g. a winning line). */
async function hideOverlays(page: Page) {
  await page.addStyleTag({ content: '.modal-backdrop,.confetti{display:none!important}' });
}

async function frame(
  browser: Browser,
  device: Device,
  shot: Buffer,
  title: string,
  sub: string,
  theme: Theme,
) {
  const d = DEVICES[device];
  const [W, H] = d.frame;
  const bg =
    theme === 'cute'
      ? 'linear-gradient(170deg,#ffd6ea 0%,#e9dcff 100%)'
      : 'linear-gradient(170deg,#ffb703 0%,#ffd166 100%)';
  const ink = theme === 'cute' ? '#7a1f5c' : '#3d2c00';
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: d.scale,
  });
  const page = await ctx.newPage();
  const capH = Math.round(H * 0.2);
  const imgH = H - capH - Math.round(H * 0.035);
  await page.setContent(`<html><head><style>${FONT_CSS}
    body{margin:0;width:${W}px;height:${H}px;background:${bg};font-family:Nunito,sans-serif;overflow:hidden;display:flex;flex-direction:column;align-items:center}
    .cap{height:${capH}px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:0 ${W * 0.06}px;color:${ink}}
    h1{margin:0;font-weight:900;font-size:${Math.round(W * 0.075)}px;line-height:1.15}
    p{margin:${Math.round(W * 0.015)}px 0 0;font-weight:700;font-size:${Math.round(W * 0.042)}px;opacity:.85}
    img{height:${imgH}px;border-radius:${Math.round(W * 0.06)}px;box-shadow:0 ${W * 0.02}px ${W * 0.06}px rgba(0,0,0,.25);border:${Math.max(4, W * 0.012)}px solid #fff}
  </style></head><body><div class="cap"><h1>${title}</h1><p>${sub}</p></div>
  <img src="data:image/png;base64,${shot.toString('base64')}"></body></html>`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  const out = await page.screenshot();
  await ctx.close();
  return out;
}

async function scene(
  browser: Browser,
  id: string,
  device: Device,
  lang: Lang,
): Promise<[Buffer, Theme]> {
  const name = lang === 'vi' ? 'Bé Na' : 'Lily';
  const theme: Theme = id === 'cute' ? 'cute' : 'classic';
  const page = await appPage(browser, device, lang, theme, name);
  switch (id) {
    case 'hub':
      await page.goto('/');
      await page.getByTestId('game-caro').waitFor();
      break;
    case 'numbers': {
      await page.addInitScript(() => {
        Math.random = () => 0.5; // stable board + medium bot speed
      });
      await page.goto('/#/numbers/play?mode=bot&level=medium');
      await page.getByTestId('countdown').waitFor({ state: 'hidden', timeout: 10_000 });
      for (let n = 1; n <= 14; n++) {
        const target = page.getByTestId('target');
        await page.waitForTimeout(n % 4 === 0 ? 2600 : 150); // let the computer win a few
        if ((await target.textContent())?.trim() !== String(n)) continue;
        await page.getByTestId(`num-${n}`).click();
      }
      break;
    }
    case 'caro-small':
      await page.goto('/#/caro/play?mode=local&size=3');
      // X takes the diagonal 2-4-6 and wins; the winning line is highlighted
      for (const i of [4, 0, 2, 1, 6]) await page.getByTestId(`cell-${i}`).click();
      await hideOverlays(page);
      break;
    case 'caro-big': {
      await page.goto('/#/caro/play?mode=local&size=15');
      const at = (r: number, c: number) => r * 15 + c;
      // a lively mid-game position with no winner yet
      const moves = [
        at(7, 7),
        at(7, 8),
        at(6, 6),
        at(8, 8),
        at(8, 6),
        at(6, 8),
        at(5, 5),
        at(4, 4),
        at(6, 7),
        at(9, 9),
        at(8, 7),
        at(7, 6),
      ];
      for (const m of moves) await page.getByTestId(`cell-${m}`).click();
      break;
    }
    case 'noitu':
      // a few words into the chain: the next word is being typed
      await page.goto('/#/noitu/play?mode=local');
      await page.getByTestId('nt-input').waitFor({ timeout: 15_000 });
      for (let i = 0; i < 3; i++) {
        await page.getByTestId('nt-hint').click();
        await page.getByTestId('nt-go').click();
      }
      await page.getByTestId('nt-hint').click();
      break;
    case 'oanquan':
      // one move each, then the player picks a field: the direction buttons light up
      await page.goto('/#/oanquan/play?mode=local');
      await page.getByTestId('cell-1').dispatchEvent('pointerdown');
      await page.getByTestId('dir-right').click();
      await page.getByTestId('cell-9').dispatchEvent('pointerdown');
      await page.getByTestId('dir-left').click();
      await page.waitForTimeout(1500);
      await page.getByTestId('cell-4').dispatchEvent('pointerdown');
      break;
    case 'coganh':
      // Black "opens" a gap, White is forced to Gánh and takes two pieces
      await page.goto('/#/coganh/play?mode=local');
      // the forced White piece is picked up automatically: just tap where it must go
      for (const i of [2, 7, 8]) await page.getByTestId(`pt-${i}`).click();
      await page.getByTestId('pt-10').click(); // Black picks up a piece: its moves are shown
      break;
    case 'online': {
      await page.goto('/#/caro');
      await page.getByTestId('mode-online').click();
      await page.getByTestId('size-15').click();
      await page.getByTestId('create-room').click();
      await page.getByTestId('room-code').waitFor({ timeout: 15_000 });
      break;
    }
    case 'cute':
      await page.goto('/#/caro/play?mode=solo&size=3&level=easy');
      await page.getByTestId('cell-4').click();
      await page.waitForTimeout(900);
      await page.locator('.caro-cell:not([disabled])').first().click();
      await page.waitForTimeout(900);
      break;
  }
  await page.waitForTimeout(500);
  const shot = await page.screenshot();
  await page.context().close();
  return [shot, theme];
}

for (const lang of ['vi', 'en'] as const) {
  test(`store screenshots ${lang}`, async ({ browser }) => {
    const iosLocale = lang === 'vi' ? 'vi' : 'en-US';
    const playLocale = lang === 'vi' ? 'vi' : 'en-US';
    const list = captions[lang];
    for (const [i, c] of list.entries()) {
      for (const device of Object.keys(DEVICES) as Device[]) {
        const [shot, theme] = await scene(browser, c.id, device, lang);
        const img = await frame(browser, device, shot, c.title, c.sub, theme);
        const n = i + 1;
        if (device === 'android')
          write(
            join(ROOT, `fastlane/metadata/android/${playLocale}/images/phoneScreenshots/${n}.png`),
            img,
          );
        else write(join(ROOT, `fastlane/screenshots/${iosLocale}/${n}_${device}.png`), img);
      }
    }
    // Play feature graphic (1024×500) and icon (512×512)
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 500 } });
    const page = await ctx.newPage();
    const icon = readFileSync(join(ROOT, 'assets/icon-only.png')).toString('base64');
    const title = 'Family Game';
    const sub = lang === 'vi' ? 'Trò chơi cho cả nhà' : 'Games for the whole family';
    await page.setContent(`<html><head><style>${FONT_CSS}
      body{margin:0;width:1024px;height:500px;background:linear-gradient(120deg,#ffb703,#ffd166);font-family:Nunito;display:flex;align-items:center;gap:56px;padding:0 72px;box-sizing:border-box;color:#3d2c00}
      img{width:300px;height:300px;border-radius:64px;box-shadow:0 12px 40px rgba(0,0,0,.2)} h1{font-size:72px;margin:0;line-height:1.05;font-weight:900} p{font-size:36px;margin:16px 0 0;font-weight:700}
    </style></head><body><img src="data:image/png;base64,${icon}"><div><h1>${title}</h1><p>${sub}</p></div></body></html>`);
    await page.evaluate(() => document.fonts.ready);
    write(
      join(ROOT, `fastlane/metadata/android/${playLocale}/images/featureGraphic.png`),
      await page.screenshot(),
    );
    await page.setViewportSize({ width: 512, height: 512 });
    await page.setContent(
      `<body style="margin:0"><img src="data:image/png;base64,${icon}" width="512" height="512"></body>`,
    );
    write(
      join(ROOT, `fastlane/metadata/android/${playLocale}/images/icon.png`),
      await page.screenshot(),
    );
    await ctx.close();
  });
}
