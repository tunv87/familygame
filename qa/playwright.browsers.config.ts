import { defineConfig, devices } from '@playwright/test';
import base from './playwright.qa.config';

/**
 * The QA suite in browsers other than desktop Chromium (CI: .github/workflows/browsers.yml).
 *  - mobile-safari / mobile-chrome: the UI and UX suites in full, on phone and tablet sizes
 *    (WebKit with iPhone Safari's identity; Chromium with Android Chrome's)
 *  - firefox-smoke / edge-smoke / safari-desktop-smoke: the BR smoke checks on a computer
 * Run one with: QA_PROJECT=mobile-safari npx playwright test --config qa/playwright.browsers.config.ts --project mobile-safari
 */
const UI_UX = [
  /ui\.spec\.ts/,
  /ux\.spec\.ts/,
  /coganh\.spec\.ts/,
  /oanquan\.spec\.ts/,
  /noitu\.spec\.ts/,
  /audio\.spec\.ts/,
  /browsers\.spec\.ts/,
];
const SMOKE = [/browsers\.spec\.ts/, /desktop\.spec\.ts/];

export default defineConfig({
  ...base,
  outputDir: './runs/tmp/artifacts-browsers',
  reporter: [['list'], ['json', { outputFile: './runs/tmp/e2e-browsers.json' }]],
  projects: [
    { name: 'mobile-safari', testMatch: UI_UX, use: { browserName: 'webkit' } },
    { name: 'mobile-chrome', testMatch: UI_UX, use: { browserName: 'chromium' } },
    { name: 'firefox-smoke', testMatch: SMOKE, use: { browserName: 'firefox' } },
    {
      name: 'edge-smoke',
      testMatch: SMOKE,
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    { name: 'safari-desktop-smoke', testMatch: SMOKE, use: { browserName: 'webkit' } },
  ],
});
