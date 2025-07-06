Absolut. Basierend auf Ihren detaillierten Anforderungen habe ich einen vollständigen und robusten Playwright-Testblock in TypeScript erstellt. Dieser Block ist modular aufgebaut, kommentiert und deckt die geforderten Szenarien (Dev, Prod, Stabilität, Fehlerfall) ab.
Playwright-Testblock für core.app-shell
Generated typescript
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
 * - Das Start-Skript für Electron befindet sich unter `dist/main.js`.
 * - Die App reagiert auf die Umgebungsvariable `NODE_ENV` ('development' oder 'production').
 * - Im Development-Modus wird der Vite-Server unter `http://localhost:5173` erwartet.
 * - Die App loggt wichtige Ereignisse und Fehler nach STDOUT/STDERR.
 */
test.describe('core.app-shell: End-to-End Tests', () => {

  let electronApp: ElectronApplication;

  // Diese Hook stellt sicher, dass jede gestartete Electron-Instanz nach dem Test sauber beendet wird.
  test.afterEach(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('App startet im Dev-Modus, Fenster ist korrekt konfiguriert', async () => {
    // Startet die Electron-App mit der Umgebungsvariable für den Entwicklungsmodus.
    electronApp = await _electron.launch({
      args: ['dist/main.js'],
      env: { ...process.env, NODE_ENV: 'development' }
    });

    // Warten auf das Erscheinen des ersten Fensters (das Hauptfenster).
    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Assertion 1: Der Fenstertitel ist korrekt gesetzt.
    // Dies ist ein einfacher Indikator, dass das richtige Fenster geladen wurde.
    await expect(window).toHaveTitle('KiKi');

    // Assertion 2: Das Fenster hat die korrekte Mindestgröße.
    const dimensions = await window.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    expect(dimensions.width).toBeGreaterThanOrEqual(1024);
    expect(dimensions.height).toBeGreaterThanOrEqual(600);

    // Assertion 3: Das Fenster ist in der Größe veränderbar (resizable).
    // Wichtig für eine gute User Experience.
    const isResizable = await window.evaluate(() => {
      // Zugriff auf Electron-spezifische APIs aus dem Renderer-Kontext.
      const electronWindow = require('@electron/remote').getCurrentWindow();
      return electronWindow.isResizable();
    });
    expect(isResizable).toBe(true);

    // Assertion 4: Die korrekte URL des Vite-Dev-Servers wird geladen.
    // Der Port kann variieren, daher wird auf den Host geprüft.
    await expect(window.url()).toContain('http://localhost:');

    // Assertion 5: Die Entwicklertools sind im Dev-Modus geöffnet.
    // Ein guter Indikator ist die Anzahl der Fenster (Hauptfenster + DevTools).
    // Eine robustere Methode prüft die `webContents`.
    const devToolsOpened = await window.evaluate(() => {
        const { webContents } = require('@electron/remote').getCurrentWindow();
        return webContents.isDevToolsOpened();
    });
    expect(devToolsOpened, 'DevTools sollten im Development-Modus geöffnet sein.').toBe(true);
  });

  test('App startet im Prod-Modus und lädt das lokale Build', async () => {
    // Startet die App im Produktionsmodus.
    electronApp = await _electron.launch({
      args: ['dist/main.js'],
      env: { ...process.env, NODE_ENV: 'production' }
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Assertion 1: Im Prod-Modus wird die App über das file:// Protokoll geladen.
    // Dies bestätigt, dass der lokale Build und nicht ein Dev-Server verwendet wird.
    expect(window.url()).toContain('file://');
    expect(window.url()).toContain('index.html');
    
    // Assertion 2: Die Entwicklertools sind im Prod-Modus standardmäßig geschlossen.
    const devToolsOpened = await window.evaluate(() => {
        const { webContents } = require('@electron/remote').getCurrentWindow();
        return webContents.isDevToolsOpened();
    });
    expect(devToolsOpened, 'DevTools sollten im Production-Modus geschlossen sein.').toBe(false);

    // Assertion 3: Der Fenstertitel ist auch im Prod-Modus korrekt.
    await expect(window).toHaveTitle('KiKi');
  });

  test('App lässt sich mehrfach stabil neu starten', async () => {
    // Dieser Test prüft die Stabilität der App, indem er sie mehrmals startet und schließt.
    // Er hilft, Probleme wie hängende Prozesse oder nicht freigegebene Ressourcen zu finden.
    const restartCount = 3;

    for (let i = 0; i < restartCount; i++) {
      const app = await _electron.launch({ args: ['dist/main.js'] });
      
      const window = await app.firstWindow();
      // Eine einfache, schnelle Prüfung, um sicherzustellen, dass die App lauffähig ist.
      await expect(window).toHaveTitle('KiKi');
      
      // Sauberes Schließen der App-Instanz.
      await app.close();
      
      // Stellen Sie sicher, dass der Prozess wirklich beendet ist.
      // `close()` gibt ein Promise zurück, das nach dem Beenden aufgelöst wird.
    }
  });

  test('App loggt Fehler sauber, wenn der Renderer nicht geladen werden kann', async () => {
    const errorLogs: string[] = [];
    
    // Wir starten die App mit einer ungültigen URL für den Renderer, um einen Ladefehler zu provozieren.
    // Die App-Shell muss so konfiguriert sein, dass sie diese Test-Variable auswertet.
    // z.B. `const devUrl = process.env.TEST_INVALID_URL || 'http://localhost:5173';`
    electronApp = await _electron.launch({
      args: ['dist/main.js'],
      env: {
        ...process.env,
        NODE_ENV: 'development',
        // Überschreiben der Dev-Server-URL mit einer nicht erreichbaren Adresse.
        KIKI_APP_SHELL_DEV_URL: 'http://localhost:9999'
      }
    });

    // Wir hören auf den STDERR-Stream, um die Fehler-Logs der App abzufangen.
    electronApp.stderr().on('data', (data) => {
      console.log(`[App STDERR]: ${data}`);
      errorLogs.push(data.toString());
    });

    // Warten auf ein Signal, dass der Ladevorgang fehlgeschlagen ist.
    // Hier warten wir auf ein 'close'-Event des ersten Fensters, da Electron es bei
    // einem schweren Ladefehler oft schließt oder gar nicht erst anzeigt.
    // Das 'close' Event auf der App selbst ist hier ein guter Indikator.
    await electronApp.waitForEvent('close', { timeout: 15000 });

    const fullLog = errorLogs.join('');

    // Assertion 1: Der technische Fehler von Electron muss im Log auftauchen.
    expect(fullLog).toContain('ERR_CONNECTION_REFUSED');

    // Assertion 2: Die App sollte einen anwendungsfreundlichen Log-Eintrag erzeugen.
    // Dies zeigt, dass unsere eigene Fehlerbehandlung im Main-Prozess funktioniert.
    expect(fullLog).toContain('Fehler beim Laden des Hauptfensters');
  });

});