# 📡 Module: chat.api-connector

## 🔍 Zweck
Dieses Modul übernimmt die Kommunikation mit externen AI-Chat-APIs (z. B. OpenAI, Google Gemini, Claude etc.).  
Es empfängt Chat-Nachrichten vom UI (über IPC), verarbeitet diese zu API-kompatiblen Requests und sendet sie an den konfigurierten AI-Anbieter.  
Anschließend wird die Antwort wieder zurück über IPC an das UI gegeben.

---

## 🧱 Architektur

- **Ort:** `main/modules/chat/api-connector.ts`
- **Schnittstelle:** IPC (`ipcMain.handle('chat:send-message', ...)`)
- **Verwendung von:**  
  - `chat.api-key-manager` → zum Zugriff auf gespeicherte API-Keys  
  - `.env` oder App-Konfiguration → für Modus (z. B. `"openai"` oder `"gemini"`)

```text
[UI]
 │
 │ IPC: chat:send-message
 ▼
[Main Process]
  └── chat.api-connector
        └── sendet POST zu OpenAI/Gemini/etc.
             ↓
          Antwort
             ↑
        Übergabe an UI via IPC
⚙️ Abhängigkeiten
chat.api-key-manager (für den API-Key-Zugriff)

node-fetch oder axios (für HTTP-Requests)

.env oder config-Objekt mit API-Base, Modell etc.

🔄 Ablauf (Message Flow)
UI sendet IPC-Aufruf: chat:send-message mit Nutzereingabe (message), Kontextverlauf etc.

Modul ruft den passenden API-Endpunkt auf (abhängig von aktivem Provider).

Antwort wird analysiert, normalisiert und an UI zurückgegeben.

Fehler werden sauber per IPC kommuniziert.

📤 IPC-Schnittstelle
chat:send-message

input: { message: string, history?: Message[], config?: {...} }

output: { reply: string, usage?: {...}, model?: string }

🧩 Erweiterbarkeit
Das Modul verwendet jetzt eine Provider-Map für maximale Flexibilität. Jeder Provider (z.B. OpenAI, Gemini, lokale LLMs) erhält eine eigene Funktion und kann einfach über die Map ergänzt werden.

Umschaltbarer Provider-Modus (provider = "openai" | "gemini" | ...), Standard ist "openai". Weitere Provider können durch Implementierung einer Funktion und einen Eintrag in die Map ergänzt werden.

Beispiel:
```typescript
const PROVIDERS = {
  openai: callOpenAI,
  // gemini: callGemini,
  // local: callLocalLLM,
};
```
Die Hauptlogik bleibt unverändert, neue Provider werden modular ergänzt.

Rate-Limit- und Fehlerhandling sind zentralisiert.

Prompt-Templating pro Provider möglich

🧪 Teststrategie
Dummy-Modus (Mock-API): antwortet immer mit "This is a test response."

Real-Call mit Test-Key gegen echten Anbieter

Unit-Tests für Request-Builder & Response-Parser

📁 Dateistruktur
text
Kopieren
Bearbeiten
chat.api-connector/
│
├─ README.md            ← diese Datei
├─ prompt.md            ← Prompt für AI Studio
├─ response.md          ← KI-generierter Code
└─ status.md            ← Fortschrittsdokumentation
🗂 Modulstatus
 README erstellt

 Prompt erstellt

 AI-Code generiert (response.md)

 Implementierung geprüft

 Getestet & committed

yaml
Kopieren
Bearbeiten
