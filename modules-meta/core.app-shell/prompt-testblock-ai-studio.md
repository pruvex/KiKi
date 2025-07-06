# Prompt für AI Studio: Testblock für Modul core.app-shell

## Kontext
Das Modul `core.app-shell` ist das technische Fundament der Desktop-App KiKi. Es initialisiert den Electron-Hauptprozess, öffnet das Hauptfenster und lädt das React-Frontend (über Vite-Dev-Server oder Build). Es gibt noch keine Business-Logik, aber die Shell muss robust, plattformübergreifend und modular erweiterbar sein.

**Architektur & Anforderungen:**
- Electron Main-Prozess (TypeScript)
- Hauptfenster (min. 1024x600, resizable)
- Dev/Prod-Modus (Vite-Dev-Server oder Build laden)
- DevTools öffnen im Dev-Modus
- Logging für Start, Fehler und Fenster-Events
- IPC vorbereitet, aber noch keine Kanäle
- Keine Framework-Logik im Main-Prozess

## Ziel
Erzeuge einen **Playwright-Testblock** (TypeScript), der das Modul `core.app-shell` in der KiKi-Test-App intensiv prüft. Der Test soll sicherstellen:
- Die App startet fehlerfrei im Electron-Kontext
- Das Hauptfenster wird korrekt erstellt (Größe, Titel, Resizing)
- Im Dev-Modus wird die richtige URL geladen und DevTools sind offen
- Im Prod-Modus wird das Build geladen
- Logging funktioniert (prüfbar via STDOUT/STDERR)
- Die App kann mehrfach neu gestartet werden (Stabilität)
- Fehlerfälle (z.B. Port blockiert, Renderer nicht erreichbar) werden sauber geloggt

## Format & Anforderungen an den Testblock
- Playwright-Test (TypeScript, für @playwright/test und _electron)
- Test muss robust und atomar sein (keine Race Conditions)
- Test-Output und Logs müssen verständlich sein
- Test soll als Vorlage für weitere Shell-Tests dienen
- Kommentiere die wichtigsten Assertions

## Beispiel für die Einleitung des Testblocks
```typescript
import { test, expect, _electron } from '@playwright/test';

test('core.app-shell: Electron-Hauptfenster startet und lädt UI', async () => {
  // ...
});
```

**Bitte generiere jetzt einen vollständigen, optimierten Testblock für das Modul `core.app-shell` nach obigen Vorgaben.**

---

_Dokumentation: Diese Datei wurde automatisch von Cascade erzeugt, um AI Studio optimal für die Test-App anzuleiten._
