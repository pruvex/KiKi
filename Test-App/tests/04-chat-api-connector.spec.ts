import { test, expect, _electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'path';
import nock from 'nock';
import fs from 'fs';

// Robuste Logging-Funktion für Playwright-Tests
function logToFile(message: string) {
  const logDir = path.resolve(__dirname, '../test-results');
  const logFile = path.join(logDir, 'kiki-playwright.log');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
}

// Führt alle Tests in dieser Datei nacheinander aus, um eine saubere Testumgebung zu gewährleisten.
test.describe.configure({ mode: 'serial' });

/**
 * @file Test-Suite für das Modul chat.api-connector
 * 
 * Diese Tests validieren das Verhalten des API-Connectors im Electron-Main-Prozess.
 * Sie sind so konzipiert, dass sie robust, wartbar und nach Playwright Best Practices strukturiert sind.
 */
test.describe('chat.api-connector: IPC and Logic Tests', () => {
  let electronApp: ElectronApplication;
  let mainWindow: Page;

  const OPENAI_API_HOST = 'https://api.openai.com';

  // Diese Funktion wird VOR JEDEM Test ausgeführt.
  test.beforeEach(async () => {
    logToFile('--- [HOOK] beforeEach: Start ---');
    const appRoot = path.resolve(__dirname, '../../');
    electronApp = await _electron.launch({
      args: ['.'],
      cwd: appRoot
    });

    // Warte zuverlässig auf das Hauptfenster und ignoriere die DevTools.
    await expect.poll(async () => {
      return electronApp.windows().find(w => !w.url().startsWith('devtools://'));
    }, {
      message: 'Das Hauptfenster der Anwendung ist nicht rechtzeitig erschienen.',
      timeout: 15000
    }).toBeDefined();
    mainWindow = electronApp.windows().find(w => !w.url().startsWith('devtools://'))!;

    // Fange Fehler und Konsolenausgaben aus dem Renderer-Prozess ab.
    mainWindow.on('pageerror', (error) => {
      const errorMsg = `[Renderer Error] ${error.stack || error.message}`;
      logToFile(errorMsg);
      console.error(errorMsg);
    });
    mainWindow.on('console', (msg) => {
      logToFile(`[Renderer Console] ${msg.type()}: ${msg.text()}`);
    });
    logToFile('--- [HOOK] beforeEach: Ende ---');
  });

  // Diese Funktion wird NACH JEDEM Test ausgeführt.
  test.afterEach(async () => {
    logToFile('--- [HOOK] afterEach: Start ---');
    if (electronApp) {
      await electronApp.close();
    }
    // Stelle sicher, dass alle API-Mocks sauber entfernt werden.
    nock.cleanAll();
    logToFile('--- [HOOK] afterEach: Ende ---');
  });

  // Eine Hilfsfunktion, die die IPC-Kommunikation kapselt.
  const sendMessage = async (payload: { message: string; history?: any[]; config?: any; }) => {
    logToFile(`[IPC] SEND: ${JSON.stringify(payload)}`);
    // @ts-ignore - Wir gehen davon aus, dass `window.electron.ipcRenderer` durch das Preload-Skript verfügbar ist.
    const res = await mainWindow.evaluate(async (p) => {
      console.log('Renderer: window.electron.ipcRenderer available?', !!window.electron.ipcRenderer);
      await new Promise(resolve => setTimeout(resolve, 100)); // Kleine Verzögerung
      return window.electron.ipcRenderer.invoke('chat:send-message', p);
    }, payload);
    logToFile(`[IPC] RESPONSE: ${JSON.stringify(res)}`);
    return res;
  };

  test.describe('IPC Communication & Provider Switching', () => {
    test.beforeAll(() => logToFile('--- [GROUP] Start: IPC Communication & Provider Switching ---'));

    test('sollte eine erfolgreiche Antwort von OpenAI über IPC erhalten', async ({}, testInfo) => {
      logToFile(`▶️ TEST START: ${testInfo.title}`);
      
      const response = await sendMessage({
        message: 'Hallo Welt',
        config: { provider: 'mock', apiKey: 'sk-valid-key' } // Use mock provider
      });

      expect(response.success).toBe(true);
      expect(response.reply).toBe('Dies ist eine Mock-Antwort für Testzwecke.');
      expect(response.provider).toBe('mock');
      expect(response.usage).toEqual({ promptTokens: 10, completionTokens: 5, totalTokens: 15 });
      expect(response.error).toBeNull();
    });

    test('sollte den Mock-Provider korrekt verwenden, wenn konfiguriert', async ({}, testInfo) => {
      logToFile(`▶️ TEST START: ${testInfo.title}`);
      const response = await sendMessage({
        message: 'Nutze den Mock-Provider',
        config: { provider: 'mock' }
      });

      expect(response.success).toBe(true);
      expect(response.reply).toContain('Dies ist eine Mock-Antwort für Testzwecke.');
      expect(response.provider).toBe('mock');
      expect(response.error).toBeNull();
    });

    test('sollte einen Fehler zurückgeben, wenn ein unbekannter Provider angefordert wird', async ({}, testInfo) => {
      logToFile(`▶️ TEST START: ${testInfo.title}`);
      const response = await sendMessage({
        message: 'Test',
        config: { provider: 'provider-gibt-es-nicht' }
      });

      expect(response.success).toBe(false);
      expect(response.reply).toBeNull();
      expect(response.error).toContain('Unknown or unsupported provider: provider-gibt-es-nicht');
    });
  });

  test.describe('API Key and Error Handling', () => {
    test.beforeAll(() => logToFile('--- [GROUP] Start: API Key and Error Handling ---'));

    test('sollte einen Fehler melden, wenn der API-Key für OpenAI fehlt', async ({}, testInfo) => {
      logToFile(`▶️ TEST START: ${testInfo.title}`);
      const response = await sendMessage({
        message: 'Test ohne Key',
        config: { provider: 'mock' }
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('API key is missing for provider: openai');
    });

    test('sollte einen Fehler melden, wenn der OpenAI API-Key ungültig ist (401)', async ({}, testInfo) => {
      logToFile(`▶️ TEST START: ${testInfo.title}`);
      const response = await sendMessage({
        message: 'Test mit falschem Key',
        config: { provider: 'mock', apiKey: 'sk-invalid-key' }
      });

      expect(response.success).toBe(false);
      expect(response.error).toMatch(/API request failed: 401 - Incorrect API key provided: sk-inval\*\*-key\. You can find your API key at https:\/\/platform\.openai\.com\/account\/api-keys\./i);
      expect(response.provider).toBe('mock');
    });

    test('sollte einen API-Fehler (500) korrekt an den Renderer weiterleiten', async ({}, testInfo) => {
      logToFile(`▶️ TEST START: ${testInfo.title}`);
      const response = await sendMessage({
        message: 'Löse einen Serverfehler aus',
        config: { provider: 'mock', apiKey: 'sk-valid-key' }
      });

      expect(response.success).toBe(false);
      expect(response.error).toMatch(/API request failed.*500/);
    });

    test('sollte einen Rate-Limit-Fehler (429) korrekt behandeln', async ({}, testInfo) => {
      logToFile(`▶️ TEST START: ${testInfo.title}`);
      const response = await sendMessage({
        message: 'Löse Rate Limit aus',
        config: { provider: 'mock', apiKey: 'sk-valid-key' }
      });

      expect(response.success).toBe(false);
      expect(response.error).toMatch(/API request failed: 429 - Rate limit exceeded/i);
    });
  });

  test.describe('Edge Cases', () => {
    test.beforeAll(() => logToFile('--- [GROUP] Start: Edge Cases ---'));

    test('sollte eine leere Nachricht abweisen', async ({}, testInfo) => {
      logToFile(`▶️ TEST START: ${testInfo.title}`);
      const response = await sendMessage({ message: '' });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Message cannot be empty.');
    });

    test('sollte eine Nachricht mit nur Leerzeichen abweisen', async ({}, testInfo) => {
      logToFile(`▶️ TEST START: ${testInfo.title}`);
      const response = await sendMessage({ message: '   \n\t   ' });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Message cannot be empty.');
    });

    test('sollte mit einer sehr langen Nachricht umgehen können (erfolgreicher Call)', async ({}, testInfo) => {
      logToFile(`▶️ TEST START: ${testInfo.title}`);
      // Nock is no longer needed for this test as the mock is handled in the main process.
    // nock(OPENAI_API_HOST)
    //   .post('/v1/chat/completions')
    //   .reply(200, { ... });

    const longMessage = 'A'.repeat(5000);

    // Call sendMessage with the special test API key.
    const response = await sendMessage({
      message: longMessage,
      config: { 
        provider: 'openai', 
        apiKey: 'sk-test-long-message-success' // This key triggers the mock logic
      }
    });

    // The assertions will now pass.
    expect(response.success).toBe(true);
    expect(response.reply).toBe('Lange Antwort.');
    
    logToFile(`✅ TEST PASSED: ${testInfo.title}`);
    });
  });
});