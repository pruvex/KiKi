import { test, expect, _electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'path';

// Führt alle Tests in dieser Datei nacheinander aus.
// Das ist entscheidend, da wir pro Test eine saubere Electron-Instanz wollen.
test.describe.configure({ mode: 'serial' });

/**
 * @file Test-Suite für das Modul core.app-shell
 *
 * Diese Tests validieren das grundlegende Verhalten der Electron-App-Shell.
 * Wir nutzen die eingebauten Warte-Mechanismen von Playwright, um die Tests
 * robust und wartbar zu machen.
 */
test.describe('core.app-shell: End-to-End Tests', () => {
  let electronApp: ElectronApplication;
  let mainWindow: Page;

  // Diese Funktion wird VOR JEDEM Test ausgeführt.
  // Sie startet die App mit der passenden Konfiguration.
  test.beforeEach(async ({}, testInfo) => {
    // Der "Fehlerfall"-Test hat seine eigene Startlogik, daher überspringen wir beforeEach für ihn.
    if (testInfo.title.includes('Fehlerfall')) {
      return;
    }
    
    const isProd = testInfo.title.includes('Prod-Modus');
    const appRoot = path.resolve(__dirname, '../../');

    const launchOptions = {
      args: ['.'], // Startet Electron über package.json -> main, der Standardweg!
      cwd: appRoot,
      env: {
        ...process.env,
        // Setze die Umgebung basierend auf dem Test-Titel
        NODE_ENV: isProd ? 'production' : 'development',
        // Stelle sicher, dass die Dev-URL nur im Dev-Modus gesetzt ist
        KIKI_APP_SHELL_DEV_URL: isProd ? undefined : 'http://localhost:5175',
      },
    };

    electronApp = await _electron.launch(launchOptions);

    // ================== DER FIX ==================
    // Verwende nicht `firstWindow()`, da dies das DevTools-Fenster sein kann.
    // Warte stattdessen explizit auf das Fenster, das NICHT das DevTools-Fenster ist.
    // Das DevTools-Fenster hat eine URL, die mit 'devtools://' beginnt.
    await expect.poll(async () => {
        return electronApp.windows().find(w => !w.url().startsWith('devtools://'));
    }, {
        message: 'Das Hauptfenster der Anwendung ist nicht rechtzeitig erschienen.',
        timeout: 15000 // Warte bis zu 15 Sekunden
    }).toBeDefined();

    // Jetzt können wir sicher sein, dass das korrekte Fenster existiert und es zuweisen.
    mainWindow = electronApp.windows().find(w => !w.url().startsWith('devtools://'))!;
    // =============================================

    // Best Practice: Immer auf Renderer-Fehler lauschen.
    // Das deckt die meisten Probleme auf, die eine leere Seite verursachen.
    mainWindow.on('pageerror', (error) => {
      console.error('💥 Uncaught exception in renderer process:', error);
    });
  });

  // Diese Funktion wird NACH JEDEM Test ausgeführt und schließt die App.
  test.afterEach(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  /**
   * Dieser Test prüft den Development-Modus.
   * Er wartet, bis die React-App ein Schlüsselelement gerendert hat, und prüft DANN den Titel.
   */
  test('Dev-Modus: App startet, rendert Inhalt und hat den korrekten Titel', async () => {
    // Locator für ein Schlüsselelement, das beweist, dass die App geladen ist.
    const welcomeMessage = mainWindow.locator('p:has-text("Willkommen bei KiKi! Wie kann ich helfen?")');

    // Playwright wartet automatisch, bis das Element sichtbar ist.
    await expect(welcomeMessage).toBeVisible({ timeout: 30000 });

    // Da wir wissen, dass der Inhalt da ist, können wir den Titel jetzt sicher prüfen.
    await expect(mainWindow).toHaveTitle(/^KiKi/);
    
    // Zusätzlicher Check: Die URL sollte die des Dev-Servers sein.
    expect(mainWindow.url()).toContain('http://localhost:5175');
  });

  /**
   * Dieser Test prüft den Production-Modus.
   * Die Logik ist identisch, aber die `beforeEach`-Hook konfiguriert die App anders.
   */
  test('Prod-Modus: App startet, rendert Inhalt und hat den korrekten Titel', async () => {
    const welcomeMessage = mainWindow.locator('p:has-text("Willkommen bei KiKi! Wie kann ich helfen?")');

    // Warte auch hier, bis der Inhalt aus dem lokalen Build geladen wurde.
    await expect(welcomeMessage).toBeVisible({ timeout: 20000 });

    // Prüfe den Titel.
    await expect(mainWindow).toHaveTitle(/^KiKi/);

    // Zusätzlicher Check: Die URL muss eine lokale Datei sein.
    expect(mainWindow.url()).toContain('file://');
  });

  /**
   * Dieser Test prüft das Fehlerverhalten, wenn der Dev-Server nicht erreichbar ist.
   * Er hat seine eigene Startlogik und überspringt die `beforeEach`-Hook.
   */
  test('Fehlerfall: App loggt Fehler, wenn Dev-Server nicht erreichbar ist', async () => {
    const errorPromise = new Promise<string>((resolve) => {
      let stderrOutput = '';
      const appRoot = path.resolve(__dirname, '../../');
      
      _electron.launch({
        args: ['.'],
        cwd: appRoot,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          KIKI_APP_SHELL_DEV_URL: 'http://localhost:9999', // Garantiert nicht erreichbar
        },
      }).then(app => {
        electronApp = app; // Wichtig für afterEach cleanup
        // Lausche auf den Standard-Error-Stream des Electron-Prozesses
        app.process().stderr?.on('data', (data) => {
          const chunk = data.toString();
          console.log(`[STDERR]: ${chunk}`);
          stderrOutput += chunk;
          // Wenn der erwartete Fehler auftritt, das Promise auflösen.
          if (chunk.includes('ERR_CONNECTION_REFUSED') || chunk.includes('Fehler beim Laden')) {
            resolve(stderrOutput);
          }
        });
      });
    });

    // Erwarte, dass das Promise innerhalb von 15 Sekunden aufgelöst wird und den Fehlertext enthält.
    await expect(errorPromise).resolves.toContain('ERR_CONNECTION_REFUSED');
  });
});