// Renders the source images @capacitor/assets needs from public/icon.svg:
//   assets/icon-only.png        1024² full-bleed square (iOS masks the corners itself)
//   assets/icon-foreground.png  1024² transparent, artwork inside Android's adaptive safe zone
//   assets/icon-background.png  1024² solid brand colour
//   assets/splash.png / splash-dark.png  2732² icon centred on brand colour
// Then: npx capacitor-assets generate
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

const BRAND = '#ffb703';
const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
// Inner artwork without the rounded-square background.
const art = svg.replace(/<rect width="512" height="512" rx="112" fill="#ffb703"\/>/, '');
const out = new URL('../assets/', import.meta.url);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
async function render(name, size, html) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${html}</body></html>`);
  await page.screenshot({ path: new URL(name, out).pathname, omitBackground: true });
}
const sized = (s, px) => s.replace('<svg ', `<svg width="${px}" height="${px}" `);
const box = (size, bg, inner, innerPx) =>
  `<div style="width:${size}px;height:${size}px;background:${bg};display:grid;place-items:center">${sized(inner, innerPx)}</div>`;

await render('icon-only.png', 1024, box(1024, BRAND, art, 1024));
await render('icon-foreground.png', 1024, box(1024, 'transparent', art, 700));
await render('icon-background.png', 1024, box(1024, BRAND, '<svg viewBox="0 0 1 1"></svg>', 1));
await render('splash.png', 2732, box(2732, BRAND, art, 900));
await render('splash-dark.png', 2732, box(2732, BRAND, art, 900));
await browser.close();
console.log('assets/ written');
