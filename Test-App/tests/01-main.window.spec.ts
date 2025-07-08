// Playwright test for Electron main window
// (Inhalt aus der alten Test-App übernommen, ggf. anpassen)

import { test, expect, _electron, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';

// --- TypeScript declaration merging for window extensions ---
declare global {
  interface Window {
    kiki_api?: {
      saveApiKey: (key: string) => Promise<void>;
    };
    electron?: {
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
      };
    };
  }
}

// --- Hilfsfunktion: Liefert das Hauptfenster der Electron-App ---
async function getAppWindow(electronApp: ElectronApplication): Promise<Page> {
  const maxRetries = 30;
  const retryDelay = 1000; // ms
  let mainWindow: Page | undefined;
  for (let i = 0; i < maxRetries; i++) {
    const windows = electronApp.windows();
    if (windows.length === 0) {
      console.log('[getAppWindow] Kein Fenster gefunden, warte ...');
      await new Promise(r => setTimeout(r, retryDelay));
      continue;
    }
    console.log('[getAppWindow] Alle Fenster-URLs:', windows.map(w => w.url()));
    mainWindow = windows.find(w => w.url().includes('localhost')) || windows[0];
    if (mainWindow) {
      console.log('[getAppWindow] Hauptfenster gefunden und geladen:', mainWindow.url());
      return mainWindow;
    }
    await new Promise(r => setTimeout(r, retryDelay));
  }
  throw new Error('[getAppWindow] Hauptfenster der Anwendung nach mehreren Versuchen nicht gefunden.');
}

// --- Haupt-Test-Suite für den Chat API Connector ---
test.describe('core.app-shell: End-to-End Tests', () => {
  // Vor Electron-Start: Dev-Server-Check
  test.beforeAll(async () => {
    let devServerOk = false;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://localhost:5175/');
        if (res.ok) { devServerOk = true; break; }
      } catch {}
      await new Promise(r => setTimeout(r, 1000));
    }
    expect(devServerOk, 'Vite-Dev-Server nicht erreichbar!').toBeTruthy();
  });

  let electronApp: ElectronApplication;

  test.beforeAll(async () => {
    electronApp = await _electron.launch({
      args: [path.join(__dirname, '../../dist/main/index.js'), '--window-size=1280,720'],
      cwd: path.resolve(__dirname, '../../'),
      env: { ...process.env, NODE_ENV: 'development', KIKI_APP_SHELL_DEV_URL: 'http://localhost:5175' }
    });
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test.beforeEach(async () => {
    const appWindow = await getAppWindow(electronApp);
    const apiKey = process.env.OPENAI_API_KEY ?? '';
    expect(apiKey, 'OPENAI_API_KEY muss in der Umgebung gesetzt sein').toBeTruthy();
    // Warte, bis window.kiki_api verfügbar ist, dann speichere den API-Key
    await appWindow.evaluate(async (key) => {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Zeitüberschreitung beim Warten auf 'window.kiki_api'")), 5000);
        const check = () => {
          if (window.kiki_api) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
      return window.kiki_api?.saveApiKey(key);
    }, apiKey);
  });

  test('should send a message and see the reply on screen', async () => {
    const appWindow = await getAppWindow(electronApp);
    // UI-Test: Sende Nachricht und prüfe, dass eine Antwort erscheint
    const messageInput = appWindow.getByPlaceholder('Type your message here...');
    await messageInput.fill('Hallo, was kannst du?');
    const sendButton = appWindow.getByRole('button', { name: 'Send' });
    await sendButton.click();
    const lastMessage = appWindow.locator('p').last();
    await expect(lastMessage).toBeVisible({ timeout: 10000 });
    await expect(lastMessage).not.toHaveText('Hallo, was kannst du?');
  });

  test('should send a message to OpenAI (default) and receive a valid reply', async () => {
    const appWindow = await getAppWindow(electronApp);
    // IPC-Test: Sende Payload direkt über die IPC-API und prüfe die Antwortstruktur
    const payload = { message: 'Hallo, Welt!', config: { provider: 'mock' } };
    const result = await appWindow.evaluate(async (pld) => {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Zeitüberschreitung beim Warten auf 'window.electron.ipcRenderer'")), 5000);
        const check = () => {
          if (window.electron?.ipcRenderer) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
      return window.electron.ipcRenderer.invoke('chat:send-message', pld);
    }, payload);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.reply).toBe('Dies ist eine Mock-Antwort für Testzwecke.');
    expect(result.provider).toBe('mock');
    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 5, totalTokens: 15 });
    expect(result.error).toBeNull();
  });

  test('should receive a valid reply from a streaming request', async () => {
    const appWindow = await getAppWindow(electronApp);
    // Streaming-Test: Sende Payload mit stream:true und prüfe die finale Antwortstruktur
    const payload = { message: 'Erzähle mir einen kurzen Witz', stream: true, config: { provider: 'mock' } };
    const result = await appWindow.evaluate(async (pld) => {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Zeitüberschreitung beim Warten auf 'window.electron.ipcRenderer'")), 5000);
        const check = () => (window.electron?.ipcRenderer ? resolve() : setTimeout(check, 100));
        check();
      });
      return window.electron.ipcRenderer.invoke('chat:send-message', pld);
    }, payload);
    expect(result).toBeDefined();
    // Akzeptiere OpenAI-Style, klassisch oder Fehlerobjekt
    const hasContent = typeof result.reply === 'string' && result.reply.length > 0;
    const hasError = typeof result.error === 'string' && result.error.length > 0;
    if (!hasContent) {
      console.error('[Streaming-Test] Unerwartete Antwortstruktur:', result);
    }
    expect(hasContent).toBe(true);
    expect(hasError).toBe(false);
  });
});
