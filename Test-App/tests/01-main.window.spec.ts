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
  const maxRetries = 10;
  const retryDelay = 500; // ms
  for (let i = 0; i < maxRetries; i++) {
    const windows = electronApp.windows();
    console.log(`[getAppWindow] Versuch ${i + 1}: Gefundene Fenster-URLs:`, windows.map(w => w.url()));
    const appWindow = windows.find(w => w.url().includes('http://localhost'));
    if (appWindow) {
      await appWindow.waitForLoadState('domcontentloaded');
      console.log('[getAppWindow] Hauptfenster gefunden und geladen:', appWindow.url());
      return appWindow;
    }
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  throw new Error('Hauptfenster der Anwendung nach mehreren Versuchen nicht gefunden.');
}

// --- Haupt-Test-Suite für den Chat API Connector ---
test.describe('Chat API Connector Tests', () => {
  let electronApp: ElectronApplication;
  let appWindow: Page;

  test.beforeAll(async () => {
    electronApp = await _electron.launch({
      args: [path.join(__dirname, '../../dist/main/index.js'), 'http://localhost:5175'],
    });
    appWindow = await getAppWindow(electronApp);
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test.beforeEach(async () => {
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
    // IPC-Test: Sende Payload direkt über die IPC-API und prüfe die Antwortstruktur
    const payload = { message: 'Hallo, Welt!' };
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
    expect(result.id).toContain('chatcmpl-');
    expect(result.object).toBe('chat.completion');
    expect(typeof result.created).toBe('number');
    expect(result.model).toContain('gpt-');
    expect(result.choices).toHaveLength(1);
    expect(typeof result.choices[0].message.content).toBe('string');
    expect(result.choices[0].message.content.length).toBeGreaterThan(0);
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  });

  test('should receive a valid reply from a streaming request', async () => {
    // Streaming-Test: Sende Payload mit stream:true und prüfe die finale Antwortstruktur
    const payload = { message: 'Erzähle mir einen kurzen Witz', stream: true };
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
    const hasContent = typeof result.content === 'string' && result.content.length > 0;
    const hasChoices = typeof result.choices?.[0]?.message?.content === 'string' && result.choices[0].message.content.length > 0;
    const hasError = typeof result.error === 'string' && result.error.length > 0;
    if (!(hasContent || hasChoices)) {
      console.error('[Streaming-Test] Unerwartete Antwortstruktur:', result);
    }
    expect(hasContent || hasChoices).toBe(true);
    expect(hasError).toBe(false);
  });
});
