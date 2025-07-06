# KiKi Test-App

## Vollständiger Neustart & Best Practices

Diese Test-App ist das zentrale End-to-End-Testsystem für die Electron+React-App „KiKi“. Sie wurde nach einem vollständigen Neuaufbau aus dem Remote-Repository eingerichtet und folgt jetzt einer klaren, robusten und agentischen Teststrategie.

---

## 🚀 Schnellstart (frisch geklontes Repo)

1. **Wechsle ins Test-App-Verzeichnis:**
   ```sh
   cd Test-App
   ```
2. **Installiere alle Abhängigkeiten:**
   ```sh
   npm install
   ```
3. **Starte die End-to-End-Tests automatisch:**
   ```sh
   start-test-app.cmd
   ```
   _(Das Skript killt Port 5175, startet den Dev-Server und führt Playwright-Tests aus)_

---

## 🌱 Branch-Strategie & Entwicklung
- **main:** Immer stabil, reviewed, CI/CD-grün. Nur gemergte, geprüfte Features.
- **test-app-1.2 (dev):** Aktueller Entwicklungsbranch für neue Testfälle und Optimierungen.
- **Feature-Branches:** Für größere Testmodule oder Experimente.

### Neues Feature/Modul testen:
1. Branch von `test-app-1.2` abzweigen
2. Testfall als eigene `.spec.ts`-Datei unter `tests/` anlegen
3. Commit & Push, Merge Request stellen

---

## 🛠️ CI/CD & Automatisierung
- **GitHub Actions**: Jeder Commit und PR löst automatisch alle Tests aus (`.github/workflows/playwright.yml`).
- **Berichte & Screenshots**: Ergebnisse und Fehler findest du im „Actions“-Tab auf GitHub.
- **Agentisches Testen**: Skripte und Configs sind so gestaltet, dass alles ohne manuelle Eingriffe läuft.

---

## 🧑‍💻 Best Practices
- Schreibe atomare, modulare Testfälle – pro Modul eine Datei.
- Nutze explizite Waits und robuste Assertions (keine Race Conditions).
- Vermeide Hardcodings, nutze Umgebungsvariablen wo möglich.
- Dokumentiere neue Testfälle und Besonderheiten direkt im Code oder als Markdown im Test-App-Ordner.

### ➕ **So fügst du einen neuen Testblock / ein neues Modul hinzu:**
1. **Neue Datei:** Lege eine neue Datei unter `Test-App/tests/` an, z.B. `02-dein-modul.spec.ts`.
2. **Test-Suite:** Erstelle eine eigene `test.describe('dein-modul', ...)`-Suite für das Modul.
3. **Setup:** Nutze die bestehenden Hilfsfunktionen und Umgebungsvariablen (siehe Beispiele in `01-smoke-test.spec.ts`).
4. **Assertions:** Prüfe alle Kernfunktionen und Fehlerfälle des Moduls.
5. **Dokumentation:** Schreibe am Anfang der Datei einen kurzen Kommentar, was genau getestet wird.
6. **Commit & Push:** Feature-Branch nutzen, Merge Request stellen.

**Beispiel-Template für neue Testblöcke:**
```typescript
// tests/02-dein-modul.spec.ts
import { test, expect, _electron } from '@playwright/test';

test.describe('dein-modul: E2E Tests', () => {
  test('Modul-Feature funktioniert', async () => {
    // ...
  });
});
```

**Tipp:** Bestehende Testblöcke wie `01-smoke-test.spec.ts` als Vorlage nutzen!

---

## 🆘 Troubleshooting
- **Port 5175 belegt?** Das Startskript killt automatisch Prozesse. Bei Problemen: Port manuell freigeben.
- **Dev-Server läuft nicht?** Prüfe Logs aus `renderer/` und im Testlauf.
- **Electron-Fenster bleibt leer?** Prüfe, ob der Dev-Server erreichbar ist und die URL stimmt.
- **CI/CD schlägt fehl?** Siehe GitHub Actions-Logs und Screenshots.
- **Repo/Branch beschädigt?** Klone das Repo neu und sichere lokale Änderungen manuell.

---

## 📚 Weitere Hinweise
- **Alle Testdaten und Artefakte** werden automatisch in `test-results/` bzw. `playwright-report/` abgelegt (siehe `.gitignore`).
- **Node_modules** und Build-Artefakte werden nicht versioniert.
- **README.md** wird regelmäßig aktualisiert – Änderungen bitte immer dokumentieren!

---

## 💤 Aktueller Stand (06.07.2025)

- **React-Hook-Fehler (`Rendered more hooks than during the previous render`) besteht weiterhin.**
- Doppelte React-Installationen im Projekt wurden beseitigt (`renderer/node_modules` gelöscht, alles über Hauptprojekt installiert).
- Build und Dev-Server laufen, aber Electron-Fenster bleibt weiß und React bricht mit Hook-Fehler ab.
- Nächster Schritt: **Untersuchen, warum App.tsx beim ersten Rendern unterschiedliche Hooks aufruft.**
- Hinweise: Keine bedingten Hooks in App.tsx, ApiKeyManager.tsx, ChatWindow.tsx. Problem könnte durch State-Initialisierung, fehlerhaften Import oder Hot-Reload verursacht sein.
- Siehe Chat-Verlauf/Fehlerkonsole für genaue Fehlermeldung.

**Morgen weitermachen:**
1. App.tsx und alle Imports prüfen: Gibt es dynamische/bedingte Komponenten, die Hooks unterschiedlich initialisieren?
2. Build/Cache komplett löschen und neu bauen (`node_modules`, `.vite`, `dist` usw. löschen, dann `npm install`, `npm run build`).
3. Prüfen, ob Hooks evtl. in einer Schleife oder in einer Funktion außerhalb der Komponente aufgerufen werden.
4. Notieren, welche Schritte schon gemacht wurden (siehe oben).

---

*Diese Test-App ist nach dem vollständigen Neuaufbau robuster und agentischer als je zuvor. Du kannst dich jetzt voll auf die Entwicklung und das Hinzufügen neuer Testfälle konzentrieren!*

