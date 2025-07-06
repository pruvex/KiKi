# 📦 KiKi Modul-Übersicht

Eine zentrale, fortlaufend gepflegte Übersicht aller Module für das KiKi-Projekt. Jedes Modul wird mit Datum, Name, Aufgabe und wichtigen Infos dokumentiert. Neue Module werden hier direkt ergänzt.

---

| Datum       | Modul-Name                | Aufgabe / Zweck                                                                                  | Wichtige Infos / Status         | Testblock vorhanden           |
|-------------|---------------------------|--------------------------------------------------------------------------------------------------|---------------------------------|-------------------------------|
| 2025-07-04  | core.app-shell            | Electron Main-Prozess: Fenster, Dev/Prod-Handling, IPC-Basis, Security-Basics                    | In main gemergt, stabil         | ja (`01-smoke-test.spec.ts`)  |
| 2025-07-04  | chat.ui-chat-window       | React-Komponente für Chat-UI: Nachrichten, Input, Loading, Styling, Integration mit Electron     | In main, produktionsreif        | nein                          |
| 2025-07-04  | chat.api-key-manager      | Sichere Verwaltung & Speicherung von API-Keys (UI, IPC, Storage, Maskierung, Integration)        | In main, produktionsreif        | nein                          |
| 2025-07-04  | chat.api-connector        | Backend-Modul für Kommunikation mit externen AI-Chat-APIs (OpenAI/Gemini), Provider-Switch, IPC | Dev-Branch, Backend funktionsfähig | ja (`02-chat-api-connector.spec.ts`) |

---

**Hinweis:**
- Diese Datei wird bei jedem neuen Modul ergänzt.
- Bitte Änderungen und neue Module immer hier dokumentieren!
