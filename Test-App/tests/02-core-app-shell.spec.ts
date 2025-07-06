import { test, expect, _electron, ElectronApplication } from '@playwright/test';
import { Page } from 'playwright';

/**
 * @file Test-Suite für das Modul core.app-shell
 *
 * Diese Tests validieren das grundlegende Verhalten der Electron-App-Shell von KiKi.
 * Es wird geprüft, ob die App in verschiedenen Umgebungen (Development, Production) korrekt startet,
 * das Hauptfenster die richtigen Eigenschaften hat und ob Fehlerfälle sauber behandelt werden.
 *
 * Annahmen für diese Tests:
 * - Das Start-Skript für Electron befindet sich unter `dist/main/index.js`.
 * - Die App reagiert auf die Umgebungsvariable `NODE_ENV` ('development' oder 'production').
 * - Im Development-Modus wird der Vite-Server unter `http://localhost:5173` erwartet.
 * - Die App loggt wichtige Ereignisse und Fehler nach STDOUT/STDERR.
 */
test.describe('core.app-shell: End-to-End Tests', () => {
  let electronApp: ElectronApplication;

  const VITE_DEV_SERVER_URL = 'http://localhost:5175';
  test.beforeEach(async () => {
    electronApp = await _electron.launch({
      args: [require('path').join(__dirname, '../../dist/main/index.js'), VITE_DEV_SERVER_URL],
      env: {
        ...process.env,
        NODE_ENV: 'development',
        FORCE_OPEN_DEV_TOOLS: 'true',
      }
    });
    if (electronApp.process()) {
      electronApp.process().stdout.on('data', (data) => {
        console.log(`[Electron STDOUT]: ${data.toString()}`);
      });
      electronApp.process().stderr.on('data', (data) => {
        console.error(`[Electron STDERR]: ${data.toString()}`);
      });
    }
  });

  test.afterEach(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('App startet im Dev-Modus, Fenster ist korrekt konfiguriert', async () => {
    // 1. Finde gezielt das App-Fenster (nicht DevTools!)
    let appWindow;
    for (let i = 0; i < 15; i++) {
      const windows = electronApp.windows();
      appWindow = windows.find(w => w.url().startsWith('http://localhost:5175'));
      if (appWindow) break;
      await new Promise(r => setTimeout(r, 200));
    }
    if (!appWindow) {
      // Debug-Ausgabe aller Fenster-URLs zur Fehlersuche
      const allUrls = electronApp.windows().map(w => w.url());
      console.error('Alle Fenster-URLs:', allUrls);
      throw new Error('Kein App-Fenster mit Dev-Server-URL (5175) gefunden!');
    }
    await appWindow.waitForLoadState('domcontentloaded');

    // 2. Debug-Ausgaben: URL und Titel
    const actualUrl = appWindow.url();
    const actualTitle = await appWindow.title();
    console.log('DEBUG: Hauptfenster-URL:', actualUrl);
    console.log('DEBUG: Hauptfenster-Titel:', actualTitle);

    // 3. Prüfe, ob die URL auf einen Dev-Server zeigt (Port kann variieren)
    expect(actualUrl).toContain('localhost:');

    // Debug-Ausgaben: URL und Titel
    console.log('Fenster-URL:', appWindow.url());
    const currentTitle = await appWindow.title();
    console.log('Fenster-Titel vor waitForFunction:', currentTitle);
    // 4. Warte, bis der Ladezustand vorbei ist (Titel enthält nicht mehr 'loading')
    await appWindow.waitForFunction(() => !document.title.toLowerCase().includes('loading'), null, { timeout: 30000 });
    // 5. Assertion: Titel
    await expect(appWindow).toHaveTitle('KiKi', { timeout: 30000 });

    // 5. Assertion: Mindestgröße
    const dimensions = await appWindow.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    expect(dimensions.width).toBeGreaterThanOrEqual(600);
    expect(dimensions.height).toBeGreaterThanOrEqual(400);
    // Optional: DevTools sind im Test offen, prüfe im Netzwerk-Tab ob die App localhost lädt
  });

  // Weitere Tests für Prod-Modus, Fehlerfälle etc. können nach gleichem Muster ergänzt werden.
});
