# 🧱 Modul: core.app-shell

## 📌 Zweck

Das Modul `core.app-shell` bildet das technische Fundament der App KiKi.  
Es initialisiert den Electron-Prozess, öffnet das Hauptfenster und lädt die Benutzeroberfläche.  
Alle weiteren Module (Chat, Dateioperationen, Memory usw.) bauen auf dieser Shell auf.

---

## 🎯 Ziel in dieser Version

Die App startet erfolgreich und zeigt ein leeres Fenster mit React-Frontend.  
Das Modul enthält die gesamte Logik zum Starten und Konfigurieren des Electron-Fensters.

---

## ⚙️ Funktionen in Phase 1

| Funktion | Beschreibung |
|----------|--------------|
| Electron-Fenster erstellen | Hauptfenster mit fixer Mindestgröße |
| Dev/Prod-Erkennung | DevTools öffnen im Entwicklungsmodus |
| UI laden | Lädt `index.html` oder Dev-Server von `vite` |
| Logging | Start-Logs und einfache Fehlerbehandlung |
| IPC vorbereiten | Electron IPC (aber noch keine Kanäle) |

---

## 🗂️ Struktur

```plaintext
/main
├── index.ts               → Electron-Hauptprozess (Eintrittspunkt)
├── ipc-handlers/          → Wird in späteren Modulen gefüllt

/renderer
└── index.html             → Einstiegspunkt für das UI (React wird später ergänzt)
📦 Technologie
Electron (aktuelle stabile Version, empfohlen: 25+)

TypeScript

Vorbereitung für React und Vite

keine Framework-spezifischen Abhängigkeiten im Main-Prozess

📐 Anforderungen
Muss auf allen Plattformen laufen (Windows, macOS, Linux)

Fenstergröße: mindestens 1024×600

Dev/Prod-Modus unterscheidbar über Umgebungsvariable

Entwicklermodus: Öffnet DevTools automatisch

Fenster reloadfähig (Hot Reload für Frontend)

✅ Tests (Phase 1)
 App startet ohne Fehler

 Fenster wird korrekt erstellt

 Im Dev-Modus öffnen sich die DevTools

 Das UI wird erfolgreich geladen

 Kein Inhalt nötig – nur Basisgerüst

🔄 Weitere Schritte
Dieses Modul wird von chat.ui-chat-window ergänzt, das die erste sichtbare UI-Komponente liefert.
IPC-Kanäle werden mit späteren Modulen wie fs.manager und memory.session-store implementiert.

✍️ Dokumentation
Zu diesem Modul gehören folgende Dateien in /modules-meta/core.app-shell/:

Datei	Inhalt
README.md	Diese Beschreibung
prompt.md	Der genaue Prompt für Google AI Studio
response.md	Antwort von AI Studio
test-notes.md	Eigene Tests & Debugging-Ergebnisse (Gemini CLI)