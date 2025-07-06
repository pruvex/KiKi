import { test, expect, _electron, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';

// Erweiterung des Window-Typs für die Preload-APIs
// (wird von der Electron-Preload-Script bereitgestellt)

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

// Funktion zum Abrufen des Hauptfensters der Anwendung
async function getAppWindow(electronApp: ElectronApplication): Promise<Page> {
  const maxRetries = 10;
  const retryDelay = 500; // ms

  for (let i = 0; i < maxRetries; i++) {
    const windows = electronApp.windows();

    // Diagnose-Log: Zeigt an, welche URLs bei jedem Versuch gefunden werden.
    console.log(`[getAppWindow] Versuch ${i + 1}: Gefundene Fenster-URLs:`, windows.map((w: Page) => w.url()));

    const appWindow = windows.find((w: Page) => w.url().includes('http://localhost'));

    if (appWindow) {
      // Warten, bis das Dokument tatsächlich bereit ist, um Folgefehler zu vermeiden.
      await appWindow.waitForLoadState('domcontentloaded');
      console.log('[getAppWindow] Hauptfenster gefunden und geladen:', appWindow.url());
      return appWindow;
    }

    // Warten, bevor der nächste Versuch gestartet wird.
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }

  // Wenn die Schleife ohne Erfolg beendet wird, den Fehler auslösen.
  throw new Error('Hauptfenster der Anwendung nach mehreren Versuchen nicht gefunden.');
}

// Variablen für die Electron-Anwendung und das Hauptfenster
let electronApp: ElectronApplication;
let appWindow: Page;

// Startet die Electron-Anwendung vor allen Tests in dieser Suite.
test.beforeAll(async () => {
  electronApp = await _electron.launch({
    args: [path.join(__dirname, '../../dist/main/index.js'), 'http://localhost:5175'],
  });
  appWindow = await getAppWindow(electronApp);
});

// Schließt die Electron-Anwendung nach allen Tests.
test.afterAll(async () => {
  await electronApp.close();
});

// Dieser Block wird vor jedem einzelnen Test ausgeführt.
// Er stellt sicher, dass ein gültiger API-Schlüssel für die Tests vorhanden ist.
test.beforeEach(async () => {
  const apiKey = process.env.OPENAI_API_KEY ?? '';
  expect(apiKey, 'OPENAI_API_KEY muss in der Umgebung gesetzt sein').toBeTruthy();

  // Robuster Aufruf, um den API-Schlüssel zu speichern.
  // Dieser Code wartet innerhalb des Renderers, bis die API bereit ist, und ruft sie dann auf.
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


  // --- Haupt-Test-Suite für den Chat API Connector (nur OpenAI) ---
test.describe('Chat API Connector Tests (OpenAI)', () => {
  let electronApp: ElectronApplication;
  let appWindow: Page;

  // Electron-App starten
  test.beforeAll(async () => {
    electronApp = await _electron.launch({
      args: [path.join(__dirname, '../../dist/main/index.js'), 'http://localhost:5175'],
    });
    appWindow = await getAppWindow(electronApp);
  });

  // Electron-App schließen
  test.afterAll(async () => {
    await electronApp.close();
  });

  // Vor jedem Test: API-Key setzen
  test.beforeEach(async () => {
    const apiKey = process.env.OPENAI_API_KEY ?? '';
    expect(apiKey, 'OPENAI_API_KEY muss in der Umgebung gesetzt sein').toBeTruthy();
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

  // --- UI-Test: Sende Nachricht und prüfe Antwort ---
  test('should send a message and see the reply on screen', async () => {
    const messageInput = appWindow.getByPlaceholder('Type your message here...');
    await messageInput.fill('Hallo, was kannst du?');
    const sendButton = appWindow.getByRole('button', { name: 'Send' });
    await sendButton.click();
    const lastMessage = appWindow.locator('p').last();
    await expect(lastMessage).toBeVisible({ timeout: 10000 });
    await expect(lastMessage).not.toHaveText('Hallo, was kannst du?');
  });

  // --- IPC-Test: Direkter Chat-API-Aufruf ---
  test('should send a message to OpenAI (default) and receive a valid reply', async () => {
    const payload = { message: 'Hallo, Welt!' };

    // Atomarer Aufruf: Warten und Ausführen in einem Schritt, um Race Conditions zu vermeiden.
    const result = await appWindow.evaluate(async (pld) => {
      // 1. Warten, bis die von Preload exponierte API im window-Objekt verfügbar ist.
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

      // 2. Die IPC-Methode sicher aufrufen.
      return window.electron.ipcRenderer.invoke('chat:send-message', pld);
    }, payload);

    // Überprüfen der Antwortstruktur
    expect(result).toBeDefined();
    expect(result.id).toContain('chatcmpl-');
    expect(result.object).toBe('chat.completion');
    expect(typeof result.created).toBe('number');
    expect(result.model).toContain('gpt-');
    expect(result.choices).toHaveLength(1);
    expect(typeof result.choices[0].message.content).toBe('string');
    expect(result.choices[0].message.content.length).toBeGreaterThan(0);
    
    // Robuste Überprüfung der 'usage' Eigenschaft mit Optional Chaining
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  });

  test('should send a streaming request and display a reply in the UI', async () => {
    // Benutzeraktion simulieren: Nachricht eintippen und senden
    const messageInput = appWindow.getByPlaceholder('Type your message here...');
    await messageInput.fill('Erzähle mir einen kurzen Witz');

    const sendButton = appWindow.getByRole('button', { name: 'Send' });
    await sendButton.click();

    // Ergebnis aus Benutzersicht verifizieren: Auf eine neue Nachricht warten
    const lastMessage = appWindow.locator('p').last();
    await expect(lastMessage).toBeVisible({ timeout: 15000 });
    await expect(lastMessage).not.toHaveText('Erzähle mir einen kurzen Witz');
    await expect(lastMessage).not.toContainText('[Fehler]');
  });
});