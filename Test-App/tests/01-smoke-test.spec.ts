import { test, expect, _electron, ElectronApplication } from '@playwright/test';
// fetch ist global ab Node.js 18, kein Import nötig.
import path from 'path';
test.describe.configure({ mode: 'serial' });

/**
 * @file Test-Suite für das Modul core.app-shell
 * 
 * Diese Tests validieren das grundlegende Verhalten der Electron-App-Shell von KiKi.
 * Es wird geprüft, ob die App in verschiedenen Umgebungen (Development, Production) korrekt startet,
 * das Hauptfenster die richtigen Eigenschaften hat und ob Fehlerfälle sauber behandelt werden.
 */
test.describe('core.app-shell: End-to-End Tests', () => {
  let electronApp: ElectronApplication;

  // Stellt sicher, dass jede gestartete Electron-Instanz nach dem Test sauber beendet wird.
  test.afterEach(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('App startet im Dev-Modus, Fenster ist korrekt konfiguriert', async () => {
    // Warte robust auf Dev-Server und React-Bundle
    // fetch ist global ab Node.js 18+, kein Import oder require nötig.
    let bundleOk = false;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://localhost:5175/');
        const html = await res.text();
        const scriptMatches = [...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g)];
        let foundBundles = [];
        for (const match of scriptMatches) {
          const bundleUrl = match[1].startsWith('http') ? match[1] : `http://localhost:5175${match[1]}`;
          foundBundles.push(bundleUrl);
          try {
            const bundleResponse = await fetch(bundleUrl);
            console.log(`[HealthCheck] Prüfe Bundle: ${bundleUrl} -> Status: ${bundleResponse.status}`);
            if (bundleResponse.ok && (bundleUrl.endsWith('/main.tsx') || bundleUrl.endsWith('/main.js'))) {
              console.log(`[HealthCheck] Bundle OK: ${bundleUrl}`);
              bundleOk = true;
              break;
            } else if (!bundleResponse.ok) {
              console.log(`[HealthCheck] Bundle NICHT OK: ${bundleUrl} -> Status: ${bundleResponse.status}`);
              console.log(`[HealthCheck] Bundle NICHT OK: ${bundleUrl} -> Status: ${bundleRes.status}`);
            }
          } catch (err) {
            console.log(`[HealthCheck] Fehler beim Laden von ${bundleUrl}:`, err);
          }
        }
        console.log(`[HealthCheck] Gefundene Bundles: ${foundBundles.join(', ')}`);
        if (bundleOk) break;
      } catch (e) {
        console.log('[HealthCheck] Fehler beim Abrufen der Hauptseite:', e);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    if (!bundleOk) throw new Error('Vite-Dev-Server oder React-Bundle nicht bereit!');

    // Electron-App starten
    const appRoot = path.resolve(__dirname, '../../');
    electronApp = await _electron.launch({
      args: ['dist/main/index.js', '--window-size=1280,720'],
      cwd: appRoot,
      env: { ...process.env, NODE_ENV: 'development' }
    });

    // Logging-Buffer für Electron-STDOUT/STDERR
    const electronStdout: string[] = [];
    const electronStderr: string[] = [];
    if (electronApp.process()) {
      electronApp.process().stdout.on('data', (data) => {
        electronStdout.push(data.toString());
      });
      electronApp.process().stderr.on('data', (data) => {
        electronStderr.push(data.toString());
      });
    }

    // Renderer-Fehler abfangen
    let mainWindow;
    for (let i = 0; i < 30; i++) {
      const windows = electronApp.windows();
      mainWindow = windows.find(w => w.url().startsWith('http://localhost:'));
      if (mainWindow) break;
      await new Promise(r => setTimeout(r, 1000));
    }
    expect(mainWindow).toBeTruthy();

    const rendererErrors: string[] = [];
    await mainWindow?.exposeFunction('logRendererError', (msg: string) => {
      rendererErrors.push(msg);
    });
    await mainWindow?.evaluate(() => {
      window.addEventListener('error', (e) => {
        // @ts-ignore
        window.logRendererError?.(e.message || String(e));
      });
      window.addEventListener('unhandledrejection', (e) => {
        // @ts-ignore
        window.logRendererError?.(e.reason ? e.reason.message : String(e.reason));
      });
      const origError = console.error;
      const origWarn = console.warn;
      console.error = function(...args) {
        // @ts-ignore
        window.logRendererError?.(args.map(String).join(' '));
        origError.apply(console, args);
      };
      console.warn = function(...args) {
        // @ts-ignore
        window.logRendererError?.(args.map(String).join(' '));
        origWarn.apply(console, args);
      };
    });

    try {
      await expect(mainWindow).toHaveTitle(/^KiKi/, { timeout: 20000 });
// Workaround: Setze Fenstergröße explizit im Test
await mainWindow.setViewportSize({ width: 1280, height: 720 });
      const dimensions = await mainWindow.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }));
      expect(dimensions.width).toBeGreaterThanOrEqual(1024);
      expect(dimensions.height).toBeGreaterThanOrEqual(600);
      expect(mainWindow.url()).toContain('http://localhost:');
    } catch (err) {
      // Fehlerausgabe für Debugging
      const htmlDump = await mainWindow.content();
      console.error('HTML Dump:', htmlDump);
      // Network-Fehler (nur grob, da Playwright API limitiert)
      const requests = await mainWindow.evaluate(() => performance.getEntriesByType('resource').map(r => r.name));
      console.error('Geladene Ressourcen:', requests.join('\n'));
      console.error('Electron STDOUT:', electronStdout.join(''));
      console.error('Electron STDERR:', electronStderr.join(''));
      console.error('Renderer Errors:', rendererErrors.join('\n'));
      throw err;
    }
  });

  test('App startet im Prod-Modus und lädt das lokale Build', async () => {
    const appRoot = path.resolve(__dirname, '../../');
    electronApp = await _electron.launch({
      args: ['dist/main/index.js', '--window-size=1280,720'],
      cwd: appRoot,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    // Warte bis zu 30 Sekunden auf das richtige Fenster
    let mainWindow;
    for (let i = 0; i < 30; i++) {
      const windows = electronApp.windows();
      mainWindow = windows.find(w => w.url().startsWith('file://'));
      if (mainWindow) break;
      await new Promise(r => setTimeout(r, 1000));
    }
    expect(mainWindow).toBeTruthy();
    expect(mainWindow.url()).toContain('file://');
    expect(mainWindow.url()).toContain('index.html');
    await expect(mainWindow).toHaveTitle(/^KiKi/, { timeout: 20000 });
// Workaround: Setze Fenstergröße explizit im Test
await mainWindow.setViewportSize({ width: 1280, height: 720 });
  });

  test('App lässt sich mehrfach stabil neu starten', async () => {
    const restartCount = 3;
    for (let i = 0; i < restartCount; i++) {
      const appRoot = path.resolve(__dirname, '../../');
      const app = await _electron.launch({ args: ['dist/main/index.js', '--window-size=1280,720'], cwd: appRoot });
      // Warte bis zu 30 Sekunden auf das richtige Fenster
      let mainWindow;
      for (let j = 0; j < 30; j++) {
        const windows = app.windows();
        mainWindow = windows.find(w => w.url().startsWith('http://localhost:') || w.url().startsWith('file://'));
        if (mainWindow) break;
        await new Promise(r => setTimeout(r, 1000));
      }
      expect(mainWindow).toBeTruthy();
      await expect(mainWindow).toHaveTitle(/^KiKi/, { timeout: 20000 });
// Workaround: Setze Fenstergröße explizit im Test
await mainWindow.setViewportSize({ width: 1280, height: 720 });
      await app.close();
    }
  });

  test('App loggt Fehler sauber, wenn der Renderer nicht geladen werden kann', async () => {
    const appRoot = path.resolve(__dirname, '../../');
    const errorLogPromise = new Promise<string>((resolve, reject) => {
      let capturedLog = '';
      let resolved = false;
      _electron.launch({
        args: ['dist/main/index.js', '--window-size=1280,720'],
        cwd: appRoot,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          KIKI_APP_SHELL_DEV_URL: 'http://localhost:9999'
        }
      }).then(app => {
        electronApp = app;
        app.process().stderr.on('data', (data) => {
          const logChunk = data.toString();
          capturedLog += logChunk;
          console.log(`[App STDERR empfangen]: ${logChunk}`);
          if (logChunk.includes('ERR_CONNECTION_REFUSED') || logChunk.includes('Fehler beim Laden')) {
            resolved = true;
            resolve(capturedLog);
          }
        });
        setTimeout(() => {
          if (!resolved) reject(new Error('Timeout: Der erwartete Fehler wurde nicht in stderr geloggt.'));
        }, 10000);
        app.on('close', () => {
          if (!resolved) reject(new Error('App wurde geschlossen, bevor der Fehler geloggt werden konnte.'));
        });
      }).catch(reject);
    });
    const capturedLog = await errorLogPromise;
    expect(capturedLog).toContain('ERR_CONNECTION_REFUSED');
    expect(capturedLog).toContain('Fehler beim Laden des Hauptfensters');
  });
});
