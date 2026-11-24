/**
 * Shared helpers for the QA suite (qa/test-cases.md).
 * Test titles start with case IDs, e.g. "[UI-01][UI-02] D1 iPhone SE", and soft
 * assertion messages start with the ID they check, so scripts/qa-report.mjs can map
 * every failure back to a test case.
 */
import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const BASE = 'http://127.0.0.1:5176';
export const EVIDENCE = join(import.meta.dirname, '../../qa/evidence');

export interface Device {
  id: string;
  name: string;
  width: number;
  height: number;
  mobile: boolean;
}

export const DEVICES: Device[] = [
  { id: 'D1', name: 'iPhone SE', width: 375, height: 667, mobile: true },
  { id: 'D2', name: 'iPhone 14', width: 390, height: 844, mobile: true },
  { id: 'D3', name: 'iPhone 15 Pro Max', width: 430, height: 932, mobile: true },
  { id: 'D4', name: 'Galaxy S8', width: 360, height: 740, mobile: true },
  { id: 'D5', name: 'Pixel 7', width: 412, height: 915, mobile: true },
  { id: 'D6', name: 'iPad mini', width: 768, height: 1024, mobile: true },
  { id: 'D7', name: 'iPad Pro 12.9', width: 1024, height: 1366, mobile: true },
  { id: 'D8', name: 'Laptop', width: 1366, height: 768, mobile: false },
  { id: 'D9', name: 'Desktop FHD', width: 1920, height: 1080, mobile: false },
  { id: 'D10', name: 'Phone landscape', width: 844, height: 390, mobile: true },
  { id: 'D11', name: 'iPad landscape', width: 1366, height: 1024, mobile: true },
];
/**
 * Which browser the suite runs in (qa/playwright.browsers.config.ts sets QA_PROJECT):
 * chromium (default, `npm run qa`), mobile-safari, mobile-chrome, firefox-smoke, edge-smoke,
 * safari-desktop-smoke.
 */
export const QA_PROJECT = process.env.QA_PROJECT ?? 'chromium';

// Real browser identities, so the app sees what a phone would send.
const UA = {
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  android:
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
};

export const PHONES = DEVICES.filter((d) => ['D1', 'D2', 'D3', 'D4', 'D5'].includes(d.id));
export const deviceById = (id: string) => DEVICES.find((d) => d.id === id)!;

export interface AppOptions {
  device?: Device;
  theme?: 'classic' | 'cute';
  lang?: 'vi' | 'en';
  name?: string;
  welcome?: boolean; // true = fresh first launch
  sound?: boolean;
  initScript?: () => void;
}

export interface App {
  ctx: BrowserContext;
  page: Page;
  /** JS errors and console.error messages seen so far */
  errors: string[];
}

export async function openApp(browser: Browser, o: AppOptions = {}): Promise<App> {
  const d = o.device ?? deviceById('D2');
  const engine = browser.browserType().name();
  // Firefox has no mobile emulation; iPhones and iPads get Safari's identity in WebKit,
  // phones get Android Chrome's in Chromium (desktop sizes keep the browser's own).
  const mobile = d.mobile && engine !== 'firefox';
  const ipad = d.id === 'D6' || d.id === 'D7' || d.id === 'D11';
  const userAgent = !mobile
    ? undefined
    : engine === 'webkit'
      ? ipad
        ? UA.ipad
        : UA.iphone
      : UA.android;
  const ctx = await browser.newContext({
    viewport: { width: d.width, height: d.height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    userAgent,
    locale: o.lang === 'en' ? 'en-US' : 'vi-VN',
    baseURL: BASE,
    storageState: { cookies: [], origins: [] },
  });
  await ctx.addInitScript(
    ([welcome, theme, lang, name, sound]) => {
      try {
        // only seed once per tab, so reloads keep what the test changed
        if (sessionStorage.getItem('qa-init')) return;
        sessionStorage.setItem('qa-init', '1');
        if (!welcome) localStorage.setItem('fg:onboarded', '{"done":true}');
        localStorage.setItem('fg:settings', JSON.stringify({ theme, lang, sound, bigText: false }));
        if (name) localStorage.setItem('fg:profile', JSON.stringify({ name, avatar: '🐰' }));
      } catch {
        /* storage blocked by the test itself */
      }
    },
    [!!o.welcome, o.theme ?? 'classic', o.lang ?? 'vi', o.name ?? '', o.sound ?? false] as const,
  );
  if (o.initScript) await ctx.addInitScript(o.initScript);
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  // remember which address failed, to name it in the "Failed to load resource" error below
  let lastFailed = '';
  page.on('requestfailed', (r) => {
    lastFailed = `${r.url().slice(0, 100)} ${r.failure()?.errorText ?? ''}`;
  });
  page.on('console', (m) => {
    if (m.type() === 'error')
      errors.push(
        `console.error: ${m.text()}${/Failed to load resource/.test(m.text()) && lastFailed ? ` (${lastFailed})` : ''}`,
      );
    // Firebase reports rejected writes as warnings; for the app they are failures
    else if (/permission_denied/i.test(m.text())) errors.push(`denied: ${m.text()}`);
  });
  return { ctx, page, errors };
}

/** Saves a compressed screenshot as evidence: qa/evidence/screens/<theme>/<device>/<name>.jpg */
export async function evidence(page: Page, theme: string, device: string, name: string) {
  const dir = QA_PROJECT === 'chromium' ? 'screens' : `screens-${QA_PROJECT}`;
  const path = join(EVIDENCE, dir, theme, device, `${name}.jpg`);
  mkdirSync(dirname(path), { recursive: true });
  await page.screenshot({ path, type: 'jpeg', quality: 60 });
}

export async function settle(page: Page, ms = 350) {
  await page.waitForTimeout(ms); // let pop/fade animations finish
}

/** Fails softly with a message that starts with the case ID. */
export function check(id: string, ok: boolean, detail: string) {
  expect.soft(ok, `[${id}] ${detail}`).toBe(true);
}

export async function waitCountdown(page: Page) {
  // The app module loads asynchronously: wait for the countdown to appear first,
  // otherwise "hidden" is true before the game screen has even rendered.
  await page
    .getByTestId('countdown')
    .waitFor({ state: 'visible', timeout: 5000 })
    .catch(() => {});
  await page.getByTestId('countdown').waitFor({ state: 'hidden', timeout: 10_000 });
}

export async function createRoomAs(page: Page, name: string) {
  await page.getByTestId('create-room').click();
  const input = page.getByTestId('name-input');
  if (await input.isVisible().catch(() => false)) {
    await input.fill(name);
    await page.getByTestId('save-profile').click();
  }
  const code = page.getByTestId('room-code');
  await expect(code).toHaveText(/^\d{4}$/, { timeout: 15_000 });
  return (await code.textContent())!.trim();
}

export async function joinAs(page: Page, code: string, name: string) {
  await page.goto(`/#/join/${code}`);
  const input = page.getByTestId('name-input');
  // isVisible() does not wait; give the profile dialog time to appear
  const asked = await input
    .waitFor({ timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  if (asked) {
    await input.fill(name);
    await page.getByTestId('save-profile').click();
  }
}
