import { test, expect, _electron, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { deleteApiKeyFile } from './helpers/delete-api-key-file';

/**
 * Hilfsfunktion, um den API-Schlüssel-Speicher vor einem Test zurückzusetzen.
 * Dies ist entscheidend, um sicherzustellen, dass jeder Test unabhängig ist.
 * Wir gehen davon aus, dass `saveApiKey` mit null/leer den Key löscht.
 */
async function resetApiKeyStorage(page: Page) {
  // Robust: Wenn Seite schon geschlossen, ignoriere still
  if (typeof page.isClosed === 'function' && page.isClosed()) {
    return;
  }
  try {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        const check = () => (window.kiki_api ? resolve() : setTimeout(check, 100));
        check();
      });
      await window.kiki_api?.saveApiKey(null);
    });
    // Warte explizit, bis der Key wirklich gelöscht ist!
    await page.waitForFunction(async () => {
      const result = await window.kiki_api?.loadApiKey();
      return result && result.apiKey == null;
    }, null, { timeout: 2000 });
  } catch (e) {
    // Fehler nur loggen, aber Test nicht abbrechen!
    console.warn('resetApiKeyStorage konnte nicht ausgeführt werden:', (e && typeof e === 'object' && 'message' in e) ? (e as any).message : e);
  }
}

// === TEST SUITE: API Key Manager ===
// Erzwinge serielle Ausführung für robuste Electron-Tests
// (verhindert Race Conditions und "page closed"-Fehler)
test.describe.configure({ mode: 'serial' });
test.describe('API Key Manager E2E Tests', () => {
  // Jede Testfunktion bekommt eigene Electron-Instanz und eigenes Fenster
  let electronApp: ElectronApplication | undefined;
  let appWindow: Page | undefined;
  let testUserDataDir: string;

  // Hilfsfunktion für robustes Schließen
  async function safeCloseApp() {
    if (electronApp) {
      try {
        await electronApp.close();
      } catch (err) {
        console.warn('electronApp konnte nicht geschlossen werden:', (err && typeof err === 'object' && 'message' in err) ? (err as any).message : err);
      }
      electronApp = undefined;
    }
    appWindow = undefined;
  }

  // Hilfsfunktion für robustes Reload
  async function safeReload(page: Page | undefined) {
    if (!page || (typeof page.isClosed === 'function' && page.isClosed())) return;
    try {
      await page.reload();
    } catch (e) {
      console.warn('page.reload() konnte nicht ausgeführt werden:', (e && typeof e === 'object' && 'message' in e) ? (e as any).message : e);
    }
  }

  test.beforeEach(async () => {
    // Erzeuge ein frisches Temp-Verzeichnis für UserData
    testUserDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kiki-test-userdata-'));

    electronApp = await _electron.launch({
      args: [path.join(__dirname, '../../dist/main/index.js')],
      env: {
        ...process.env,
        ELECTRON_USER_DATA_PATH: testUserDataDir,
        OPENAI_API_KEY: '', // Verhindert automatische Initialisierung
      }
    });
    appWindow = await electronApp.firstWindow();
    await safeReload(appWindow);
  });

  test.afterEach(async () => {
    if (appWindow) {
      await resetApiKeyStorage(appWindow);
    }
    await safeCloseApp();
  });


  // --- Tests für die Preload/IPC-API-Schicht ---
  test.describe('Preload API Layer', () => {
    test('should save and subsequently load an API key', async () => {
      const testKey = 'sk-test-preload-12345';

      // 1. Speichern des Schlüssels über die Preload-API
      const saveResult = await appWindow.evaluate(async (key) => {
        return window.kiki_api.saveApiKey(key);
      }, testKey);
      expect(saveResult?.success).toBe(true);

      // 2. Laden des Schlüssels zur Überprüfung
      const loadedKey = await appWindow.evaluate(async () => {
        return window.kiki_api.loadApiKey();
      });

      // 3. Assertion: Das geladene Objekt muss den gespeicherten Key und success:true enthalten.
      expect(loadedKey).toMatchObject({ apiKey: testKey, success: true });
    });

    test('should return null or undefined when loading a key that does not exist', async () => {
      // Explizit: Key löschen und auf leeren Zustand warten
      await appWindow.evaluate(() => window.kiki_api?.saveApiKey(null));
      await appWindow.waitForFunction(async () => {
        const result = await window.kiki_api?.loadApiKey();
        return result && result.apiKey == null;
      }, null, { timeout: 2000 });

      const loadedKey = await appWindow.evaluate(async () => {
        return window.kiki_api.loadApiKey();
      });

      // Assertion: Das Ergebnis muss das erwartete Objekt sein.
      expect(loadedKey).toMatchObject({ apiKey: null, success: false });
    });

    test('should overwrite an existing API key', async () => {
      const initialKey = 'sk-test-initial-67890';
      const newKey = 'sk-test-overwritten-abcde';

      // 1. Ersten Schlüssel speichern
      await appWindow.evaluate(key => window.kiki_api.saveApiKey(key), initialKey);

      // 2. Neuen Schlüssel speichern, der den alten überschreiben soll
      await appWindow.evaluate(key => window.kiki_api.saveApiKey(key), newKey);

      // 3. Schlüssel laden und überprüfen
      const loadedKey = await appWindow.evaluate(() => window.kiki_api.loadApiKey());
      expect(loadedKey).toMatchObject({ apiKey: newKey, success: true });
      expect(loadedKey.apiKey).not.toBe(initialKey);
    });
  });

  // --- Tests für die UI-Interaktion ---
  test.describe('UI Interaction', () => {
    test('Save-Button ist nur nach gültiger Eingabe aktivierbar', async () => {
      // Warte explizit auf das Root-Element der App (Best Practice)
      await appWindow.waitForSelector('#root', { timeout: 15000 });
      // Debug: Logge das aktuelle HTML für Fehlersuche
      console.log('Aktuelles HTML:', await appWindow.content());
      // Jetzt: Sicherstellen, dass das Input-Feld und der Button erscheinen
      const keyInput = await appWindow.getByPlaceholder(/Enter your API key|Enter new key to update/i);
      await expect(keyInput).toBeVisible({ timeout: 10000 });
      const saveButton = await appWindow.getByRole('button', { name: /Save and Continue/i });
      await expect(saveButton).toBeDisabled();

      // 3. ACT: Realistische Tastatureingabe eines garantiert gültigen Keys (OpenAI-Format)
      const validKey = 'sk-test-abcdefghijklmnopqrstuvwxyz123456';
      await keyInput.pressSequentially(validKey, { delay: 20 });
      // Nach der Eingabe ein blur-Event, um Validierung sicher auszulösen
      await keyInput.blur();

      // Logging: Prüfe, ob unter dem Feld eine Fehlermeldung angezeigt wird
      const errorMsg = await appWindow.getByText(/invalid|ungültig|error/i).textContent().catch(() => null);
      console.log('Validation-Fehlermeldung:', errorMsg);

      // 4. ASSERT: Button wird aktiviert
      await expect(saveButton).toBeEnabled({ timeout: 5000 });

      // 5. ACT: Jetzt kann geklickt werden
      await saveButton.click();

      // Optional: Weitere Assertions (z.B. Persistenz, Success-Message)
    });

    test('sollte einen Key speichern und Persistenz robust prüfen', async () => {
      // Garantiert gültiger Key für die Validierung
      const testKey = 'sk-test-robust-1234567890';
      // 1. Warte auf das Eingabefeld
      const keyInput = appWindow.getByPlaceholder(/Enter your API key|Enter new key to update/i);
      await expect(keyInput).toBeVisible({ timeout: 10000 });
      // 2. Simuliere echte Benutzereingabe (löst alle Events aus)
      await keyInput.pressSequentially(testKey, { delay: 30 });
      // 3. Warte, bis der Button enabled ist
      const saveButton = appWindow.getByRole('button', { name: /Save and Continue/i });
      await expect(saveButton).toBeEnabled({ timeout: 10000 });
      // 4. Speicher-Button klicken
      await saveButton.click();
      // 5. ROBUST: Warte, bis der Key wirklich gespeichert ist (Persistenz statt UI-Feedback prüfen)
      await appWindow.waitForFunction(
        async (expectedKey) => {
          const loadedKey = await window.kiki_api.loadApiKey();
          return loadedKey === expectedKey;
        },
        testKey,
        { timeout: 5000 }
      );
      // 6. Explizite Assertion: Key wurde gespeichert
      const finalLoadedKey = await appWindow.evaluate(() => window.kiki_api.loadApiKey());
      expect(finalLoadedKey).toMatchObject({ apiKey: testKey, success: true });
    });

    test('verhindert Speichern bei leerem Key (Button bleibt deaktiviert, keine Fehlermeldung)', async () => {
      const keyInput = appWindow.getByPlaceholder(/Enter your API key|Enter new key to update/i);
      const saveButton = appWindow.getByRole('button', { name: /Save and Continue/i });

      // 1. Sicherstellen, dass das Eingabefeld leer ist
      await keyInput.clear();
      // 2. Button bleibt deaktiviert
      await expect(saveButton).toBeDisabled();

      // 3. Es wurde kein Schlüssel gespeichert
      const loadedKey = await appWindow.evaluate(() => window.kiki_api.loadApiKey());
      expect(loadedKey).toMatchObject({ apiKey: null, success: false });
    });

    // Optionaler Test für die Maskierung des Keys
    // test('should mask the API key in the input field after loading', async () => {
    //   const testKey = 'sk-test-masking-klmno';
          
    //   // 1. Schlüssel im Hintergrund speichern
    //   await appWindow.evaluate(key => window.kiki_api.saveApiKey(key), testKey);

    //   // 2. Seite neu laden, um den Ladevorgang der Komponente zu simulieren
    //   await appWindow.reload();
          
    //   // 3. Überprüfen, ob der Wert im Input-Feld maskiert ist (z.B. mit Passwort-Punkten)
    //   // und nicht der Klartext-Schlüssel ist.
    //   const keyInput = appWindow.getByPlaceholder(/API-Schlüssel eingeben/i);
    //   await expect(keyInput).not.toHaveValue(testKey);
    //   await expect(keyInput).toHaveValue(/•/); // Prüft, ob Maskierungszeichen vorhanden sind
    // });
  });

  // --- Test für die Persistenz über einen App-Neustart hinweg ---
  test('should persist the API key after an application restart', async () => {
    const persistentKey = 'sk-test-persistent-pqrst';
    
    // --- Phase 1: Speichern und Schließen ---
    // 1. Speichern des Schlüssels
    await appWindow.evaluate(key => window.kiki_api.saveApiKey(key), persistentKey);
    
    // 2. Anwendung schließen
    await electronApp.close();

    // --- Phase 2: Neu starten und Überprüfen ---
    // 3. Anwendung neu starten
    electronApp = await _electron.launch({
      args: [path.join(__dirname, '../../dist/main/index.js'), 'http://localhost:5175'],
      env: {
        ...process.env,
        ELECTRON_USER_DATA_PATH: testUserDataDir,
      }
    });
    const newAppWindow = await electronApp.firstWindow();

    // 4. Schlüssel laden, ohne ihn erneut zu speichern
    const loadedKeyAfterRestart = await newAppWindow.evaluate(() => window.kiki_api.loadApiKey());

    // 5. Assertion: Der geladene Schlüssel muss der aus der vorherigen Sitzung sein.
    expect(loadedKeyAfterRestart).toMatchObject({ apiKey: persistentKey, success: true });

    // --- Cleanup: Electron-App nach Test wieder schließen, um Speicherlecks zu vermeiden ---
    await electronApp.close();
  });
});
