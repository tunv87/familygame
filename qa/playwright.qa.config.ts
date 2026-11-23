import { defineConfig } from '@playwright/test';

// QA suite (qa/test-cases.md). Run everything with: npm run qa
export default defineConfig({
  testDir: '../e2e/qa',
  timeout: 90_000,
  workers: 3,
  fullyParallel: true,
  retries: 0,
  outputDir: './runs/tmp/artifacts',
  reporter: [['list'], ['json', { outputFile: './runs/tmp/e2e.json' }]],
  use: { screenshot: 'only-on-failure', trace: 'off' },
  webServer: {
    command: 'vite --port 5176 --strictPort --host 127.0.0.1',
    cwd: '..',
    url: 'http://127.0.0.1:5176/',
    reuseExistingServer: false,
    env: { VITE_USE_EMULATOR: '1', VITE_EMULATOR_HOST: '127.0.0.1', VITE_BASE: '/' },
  },
});
