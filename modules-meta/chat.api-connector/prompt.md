# Prompt: Create a modular AI API connector for Electron (Main Process)

## 📦 Module Name
chat.api-connector

## 🎯 Purpose
Build a backend module that connects to external AI chat APIs (e.g. OpenAI, Google Gemini).  
It receives a message and optional chat history from the renderer process via IPC, sends a request to the appropriate API, and returns the reply.

## 📁 Target File
main/modules/chat/api-connector.ts

---

## 🧩 Features

- Written in **TypeScript**
- Runs in the **Electron main process**
- Exposes an **IPC handler** for `'chat:send-message'`
- Accepts:
  - user message (string)
  - optional message history (array)
  - optional config (e.g., temperature, model)
- Calls external AI APIs (e.g., OpenAI or Gemini) using the API key provided via `chat.api-key-manager`
- Supports **provider switching** via config (e.g. `"openai"`, `"gemini"`)
- Returns:
  - AI reply (string)
  - optional usage info (tokens, latency)
  - optional error details (on failure)

---

## 🔌 IPC Interface

```ts
// Renderer sends:
ipcRenderer.invoke('chat:send-message', {
  message: 'Hello!',
  history: [...],
  config: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7
  }
});

// Main process responds:
{
  reply: 'Hello! How can I help you?',
  usage: { promptTokens: 17, completionTokens: 42 },
  provider: 'openai'
}
🔒 API Key Access
Use an imported helper function:

ts
Kopieren
Bearbeiten
import { getApiKey } from '../chat/api-key-manager';
const apiKey = await getApiKey('openai'); // or 'gemini'
🌐 External Request
Use fetch (or axios) to send the request to the chosen provider.
The module should include separate request builders per provider (e.g., buildOpenAiRequest, buildGeminiRequest).

⚠️ Error Handling
Catch network/API errors

Return structured error responses via IPC

Do not crash the Electron app

🧪 Testing
If process.env.KIKI_FAKE_API === 'true', always return:

ts
Kopieren
Bearbeiten
{
  reply: 'This is a test response.',
  provider: 'mock'
}
🛠 File Export
The module should export a single registration function:

ts
Kopieren
Bearbeiten
export function registerChatApiConnector(ipcMain: IpcMain): void;
📁 Folder & File Path
Target file: main/modules/chat/api-connector.ts
Assume the IPC registration will be called from main/ipc-handlers/index.ts.

✅ Style
Clean, well-commented TypeScript

Modular, scalable structure

Each provider-specific logic (URL, headers, body) in a helper function

📌 Summary
Write a complete, production-ready Electron main-process module that:

Registers chat:send-message as an IPC handler

Retrieves the appropriate API key via chat.api-key-manager

Dispatches a request to OpenAI or Gemini (configurable)

Returns the AI-generated reply to the renderer

Supports mock mode and extensibility

yaml
Kopieren
Bearbeiten
