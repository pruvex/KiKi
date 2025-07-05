import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5175',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    headless: false, // Electron-Fenster immer sichtbar
  },
  projects: [
    {
      name: 'Electron',
      use: {}, // Kein Browser-Device, echtes Electron
    },
  ],
});
