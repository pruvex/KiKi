// Playwright test for Electron main window
// (Inhalt aus der alten Test-App übernommen, ggf. anpassen)

import { test, expect, _electron as electron } from '@playwright/test';

let electronApp: any;

// Vor jedem Test Electron starten
// (Passe ggf. Pfade und Umgebungsvariablen an)
test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: ['.'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: 'http://localhost:5175'
    }
  });
});

test.afterAll(async () => {
  await electronApp.close();
});

test('should launch the main window and verify content', async () => {
  // Warte auf Fenster
  const windows = electronApp.windows();
  console.log('Alle Fenster:', windows.map((w: any) => w.url()));
  const mainWindow = windows.find((w: any) => w.url().startsWith('http://localhost:5175'));
  expect(mainWindow).toBeTruthy();
  const url = mainWindow.url();
  console.log('Window URL:', url);
  const actualTitle = await mainWindow.title();
  console.log('Window title:', actualTitle);
  const locator = mainWindow.locator('body');
  await expect(locator).toContainText('Send', { timeout: 15000 });
  await mainWindow.screenshot({ path: `test-results/screenshots/01-smoke-test-success.png` });
});
