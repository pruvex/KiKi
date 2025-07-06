import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  fullyParallel: false,
  workers: 1,
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
  webServer: [
    {
      command: 'npm run dev:vite',
      url: 'http://localhost:5175',
      reuseExistingServer: !process.env.CI,
      cwd: 'C:/KiKi-NEU/renderer',
    },
    {
      command: 'cross-env NODE_ENV=development npm run dev:electron',
      url: 'http://localhost:5175',
      reuseExistingServer: !process.env.CI,
      cwd: 'C:/KiKi-NEU',
    },
  ],
  projects: [
    {
      name: 'Electron',
      use: {}, // Kein Browser-Device, echtes Electron
    },
  ],
});
