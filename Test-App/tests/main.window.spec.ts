// Playwright test for Electron main window
// (Inhalt aus der alten Test-App übernommen, ggf. anpassen)

import { test, expect, _electron, type ElectronApplication } from '@playwright/test';
test.describe.configure({ mode: 'serial' });
import path from 'path';

let electronApp: ElectronApplication;

test.beforeAll(async () => {
  const appRoot = path.resolve(__dirname, '../../');
  electronApp = await _electron.launch({
    args: [appRoot],
    cwd: appRoot,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: 'http://localhost:5175'
    }
  });
  // Electron STDOUT/STDERR für Debugging ausgeben
  if (electronApp.process()) {
    electronApp.process().stdout.on('data', (data) => {
      console.log(`[Electron STDOUT]: ${data.toString()}`);
    });
    electronApp.process().stderr.on('data', (data) => {
      const msg = data.toString();
      // Filtere belanglose Autofill/DevTools-Fehler
      if (
        msg.includes("'Autofill.enable' wasn't found") ||
        msg.includes("'Autofill.setAddresses' wasn't found") ||
        msg.includes('devtools://devtools/bundled/core/protocol_client/protocol_client.js')
      ) {
        return; // Ignorieren
      }
      console.error(`[Electron STDERR]: ${msg}`);
    });
  }
});

test.afterAll(async () => {
  await electronApp.close();
});

test('should launch the main window and verify content', async () => {
  // Warte bis zu 30 Sekunden aktiv auf das App-Fenster
  let mainWindow;
  for (let i = 0; i < 30; i++) {
    const windows = electronApp.windows();
    mainWindow = windows.find(w => w.url().startsWith('http://localhost:5175'));
    if (mainWindow) break;
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('Alle Fenster nach Warten:', electronApp.windows().map(w => w.url()));
  expect(mainWindow).toBeTruthy();
  const url = mainWindow.url();
  console.log('Window URL:', url);
  const actualTitle = await mainWindow.title();
  console.log('Window title:', actualTitle);
  const locator = mainWindow.locator('body');
  await expect(locator).toContainText('Send', { timeout: 15000 });
  await mainWindow.screenshot({ path: `test-results/screenshots/01-smoke-test-success.png` });
});
