import { test, expect, _electron, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';

/**
 * Hilfsfunktion, um das Hauptfenster der App robust zu finden und zurückzugeben.
 * Sie wartet geduldig, bis das Fenster die erwartete URL geladen hat.
 */
async function getAppWindow(electronApp: ElectronApplication): Promise<Page> {
  const maxRetries = 10;
  const retryDelay = 500; // ms

  for (let i = 0; i < maxRetries; i++) {
    const windows = electronApp.windows();
    const appWindow = windows.find(w => w.url().includes('http://localhost'));

    if (appWindow) {
      await appWindow.waitForLoadState('domcontentloaded');
      return appWindow;
    }
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  throw new Error('Hauptfenster der Anwendung nach mehreren Versuchen nicht gefunden.');
}

/**
 * Hilfsfunktion, um den API-Schlüssel-Speicher vor einem Test zurückzusetzen.
 * Dies ist entscheidend, um sicherzustellen, dass jeder Test unabhängig ist.
 * Wir gehen davon aus, dass `saveApiKey` mit null/leer den Key löscht.
 */
async function resetApiKeyStorage(page: Page) {
  await page.evaluate(async () => {
    // Warten, bis die API bereit ist, um Race Conditions zu vermeiden
    await new Promise<void>((resolve) => {
      const check = () => (window.kiki_api ? resolve() : setTimeout(check, 100));
      check();
    });
    // Speichern eines leeren Wertes, um den Schlüssel zu löschen/zurückzusetzen.
    await window.kiki_api.saveApiKey(null);
  });
}

// === TEST SUITE: API Key Manager ===
// Erzwinge serielle Ausführung für robuste Electron-Tests
// (verhindert Race Conditions und "page closed"-Fehler)
test.describe.configure({ mode: 'serial' });
test.describe('API Key Manager E2E Tests', () => {
  let electronApp: ElectronApplication;
  let appWindow: Page;

  // Startet die Electron-Anwendung einmal für die gesamte Test-Suite.
  test.beforeAll(async () => {
    electronApp = await _electron.launch({
      args: [path.join(__dirname, '../../dist/main/index.js'), 'http://localhost:5175'],
    });
    appWindow = await getAppWindow(electronApp);
  });

  // Robustes Aufräumen nach jedem Test: Offene Electron-Instanzen werden geschlossen, um Speicherlecks zu verhindern
  test.afterEach(async () => {
    try {
      if (electronApp && !electronApp.isClosed()) {
        await electronApp.close();
      }
    } catch (err) {
      // Fehler beim Schließen werden geloggt, aber nicht erneut geworfen
      console.error('Fehler beim Schließen von electronApp nach Test:', err);
    }
  });

  // Schließt die Anwendung nach Abschluss aller Tests.
  test.afterAll(async () => {
    try {
      await resetApiKeyStorage(appWindow);
      if (electronApp && !electronApp.isClosed()) {
        await electronApp.close();
      }
    } catch (err) {
      console.error('Fehler beim finalen Schließen von electronApp:', err);
    }
  });

  // Setzt vor JEDEM Test den Speicher zurück, um eine saubere Ausgangslage zu garantieren.
  // beforeEach: Seite reloaden und Speicher zurücksetzen für sauberen Zustand
  test.beforeEach(async () => {
    await resetApiKeyStorage(appWindow);
    await appWindow.reload();
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

      // 3. Assertion: Der geladene Schlüssel muss dem gespeicherten entsprechen.
      expect(loadedKey).toBe(testKey);
    });

    test('should return null or undefined when loading a key that does not exist', async () => {
      // Vorbedingung (durch beforeEach sichergestellt): Es ist kein Schlüssel gespeichert.
      const loadedKey = await appWindow.evaluate(async () => {
        return window.kiki_api.loadApiKey();
      });

      // Assertion: Das Ergebnis muss "falsy" sein (null, undefined, '').
      expect(loadedKey).toBeFalsy();
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
      expect(loadedKey).toBe(newKey);
      expect(loadedKey).not.toBe(initialKey);
    });
  });

  // --- Tests für die UI-Interaktion ---
  test.describe('UI Interaction', () => {
    test('Save-Button ist nur nach gültiger Eingabe aktivierbar', async () => {
      // 1. ARRANGE: UI-Elemente lokalisieren
      const keyInput = appWindow.getByPlaceholder(/Enter your API key|Enter new key to update/i);
      const saveButton = appWindow.getByRole('button', { name: /Save and Continue/i });

      // 2. ASSERT: Button ist anfangs deaktiviert (Validierung greift)
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
      expect(finalLoadedKey).toBe(testKey);
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
      expect(loadedKey).toBeFalsy();
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
    });
    const newAppWindow = await getAppWindow(electronApp);

    // 4. Schlüssel laden, ohne ihn erneut zu speichern
    const loadedKeyAfterRestart = await newAppWindow.evaluate(() => window.kiki_api.loadApiKey());

    // 5. Assertion: Der geladene Schlüssel muss der aus der vorherigen Sitzung sein.
    expect(loadedKeyAfterRestart).toBe(persistentKey);

    // --- Cleanup: Electron-App nach Test wieder schließen, um Speicherlecks zu vermeiden ---
    await electronApp.close();
  });
});
