# KiKi Test-App

## Was ist die Test-App?

Die KiKi Test-App ist das zentrale, agentische End-to-End-Testsystem für die modulare Electron+React-Desktop-App „KiKi“. Sie automatisiert und prüft alle Kernfunktionen, Module und Schnittstellen der App. Im Fokus stehen:
- **Robuste E2E-Tests** mit Playwright (Electron- und UI-Tests)
- **Dynamisches Port- und Umgebungsmanagement** (Vite, Electron, Supervisor)
- **Automatische Testintegration für neue Module**
- **Nahtlose Zusammenarbeit mit AI Studio und ChatGPT** für Prompts und Testblöcke

Die Test-App ist so konzipiert, dass jede neue Funktion oder jedes neue Modul sofort getestet werden kann – egal, ob von Menschen oder KI generiert!

---

## 🔄 Workflow: Neue Module & KI-Prompts optimal testen

**Ziel:** Jede Modulentwicklung (egal ob per Hand oder KI) bekommt einen optimalen Prompt und einen Testblock, der direkt in die Test-App passt und das Modul intensiv prüft.

### 1. Entwicklung eines neuen Moduls (z.B. per AI Studio/ChatGPT)
- Lass dir von ChatGPT/AI Studio einen **Prompt** für das Modul und einen **Testblock** (Playwright-Test) generieren.
- Der Prompt soll das Modul so beschreiben, dass es sofort in KiKi integriert und getestet werden kann.
- Der Testblock soll alle Kernfunktionen, Fehlerfälle und UI-Elemente des Moduls abdecken.

### 2. Integration in die Test-App
- **Prompt und Testblock** werden in die `README.md` und als `.spec.ts` unter `Test-App/tests/` eingefügt.
- Die Test-App erkennt und testet das neue Modul automatisch im nächsten Durchlauf.
- Die README dient als Referenz für Prompts und Teststruktur für zukünftige Module.

### 3. Automatisierte Prüfung
- Die Test-App läuft agentisch: Sie startet alle nötigen Prozesse (Vite, Electron), wartet auf die App und prüft alle Module mit Playwright.
- Ergebnisse, Fehler und Screenshots werden automatisch abgelegt und können für die Weiterentwicklung genutzt werden.

---

## 📄 Anleitung: Wie Prompts und Testblöcke optimal aussehen

**Prompt für ein neues Modul (Beispiel):**
```
Erstelle ein KiKi-Modul "Notizen", das ... (Beschreibung, Schnittstellen, UI, Events, etc.)
```

**Testblock für die Test-App (Beispiel):**
```typescript
import { test, expect, _electron } from '@playwright/test';
test('Notizen-Modul: Erstellen, Bearbeiten, Löschen', async () => {
  // ... Playwright-Code, der alle Kernfunktionen prüft
});
```

**Wichtig:**
- Testblöcke müssen robust, atomar und auf das jeweilige Modul zugeschnitten sein.
- Jeder Prompt und Testblock wird direkt im README dokumentiert und als `.spec.ts` implementiert.

---

## 🤖 KI-Workflow für die Zukunft

1. **ChatGPT/AI Studio generiert Prompt und Testblock für ein neues Modul.**
2. **Du fügst beides in die README.md und als Testdatei ein.**
3. **Ich optimiere und integriere Prompt und Testblock automatisch für KiKi und die Test-App.**
4. **Jedes neue Modul ist dadurch sofort optimal testbar und dokumentiert.**

---

## Best Practices & Referenz
- Die Test-App ist Referenz für automatisiertes, agentisches Testen in KiKi.
- Jeder neue Prompt/Testblock wird so gestaltet, dass er in die Test-App passt und das Modul umfassend prüft.
- Entwickler und KI können sich an der README und den bestehenden Testfällen orientieren.

---

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

*Diese Test-App ist nach dem vollständigen Neuaufbau robuster und agentischer als je zuvor. Du kannst dich jetzt voll auf die Entwicklung und das Hinzufügen neuer Testfälle konzentrieren!*
