import { defineConfig } from '@playwright/test';

// Generates store screenshots: npm run store:screenshots
export default defineConfig({
  testDir: '.',
  testMatch: 'screenshots.spec.ts',
  timeout: 600_000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5175/' },
  webServer: {
    command: 'vite --port 5175 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:5175/',
    reuseExistingServer: false,
    cwd: '..',
    env: { VITE_USE_EMULATOR: '1', VITE_EMULATOR_HOST: '127.0.0.1', VITE_BASE: '/' },
  },
});
