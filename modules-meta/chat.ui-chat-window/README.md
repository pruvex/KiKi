# Modul: `chat.ui-chat-window`

## 🧩 Zweck
Dieses Modul stellt das zentrale Chatfenster der KiKi-Desktop-App dar. Es zeigt den Chatverlauf mit Nutzungsinteraktionen und erlaubt Texteingaben durch den Benutzer. Das Modul ist ausschließlich für die visuelle Darstellung und direkte Nutzereingabe zuständig – die Logik zur Verarbeitung der Eingaben übernimmt `chat.api-connector`.

## 📐 Funktionen
- Darstellung der Nachrichten im Verlauf (von Benutzer und System)
- Scrollbarer Nachrichtenbereich
- Texteingabefeld mit Senden-Button
- Absenden über Enter-Taste
- Einfache visuelle Trennung von Benutzer- und Systemnachrichten
- Integration in das bestehende Electron-Vite-Frontend

## 🗂 Komponentenstruktur
```text
src/
└── components/
    └── ChatWindow.tsx   // Hauptkomponente für das Chatfenster
📦 Abhängigkeiten
React (Frontend-Framework im Renderer-Prozess)

optionale UI-Bibliothek: TailwindCSS oder einfache CSS-Klassen

🔌 Anbindung
Nachrichten, die vom Benutzer eingegeben werden, werden an das Modul chat.api-connector übergeben (via IPC oder direkter Callback)

Das Modul erhält neue Nachrichten (Antworten vom KI-Modul) ebenfalls über eine externe Schnittstelle

🔄 Modulgrenzen
Dieses Modul verwaltet keine API-Keys

Dieses Modul kommuniziert nicht direkt mit dem Backend (nur UI)

Dieses Modul schreibt keine Dateien

🔧 Entwicklungsstatus
🟢 Geplant – Prompt für AI Studio folgt

📁 Dateien
README.md: Diese Dokumentation

prompt.txt: Prompt für Google AI Studio

ai-output.md: Generierter Code & Erläuterung von AI Studio
