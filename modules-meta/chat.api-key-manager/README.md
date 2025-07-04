# 📦 Module: chat.api-key-manager

Manages the API key(s) used to access external AI services like OpenAI or Google Gemini.  
Provides a UI for secure input, validation, optional encryption, and persistence of keys in the local system.

---

## 🧠 Purpose

This module allows users to:

- Enter their API key(s) for different AI backends (e.g. OpenAI, Gemini, etc.)
- Validate the key format (basic checks)
- Optionally encrypt and store them locally (e.g. via filesystem, secure storage)
- Easily switch between keys/backends in future versions

---

## 🧱 Architecture

| Layer       | Responsibility                                                                 |
|-------------|---------------------------------------------------------------------------------|
| Renderer UI | React component with secure API key input field, basic validation, save button |
| IPC         | Sends key to main process for persistence                                       |
| Main        | Stores key using `fs` or secure storage (e.g. keytar, encrypted JSON)           |

---

## 📁 File Structure

```plaintext
chat.api-key-manager/
├── README.md           ← This file
├── response.md         ← AI-generated module implementation
├── meta.md             ← Instructions, notes, variations, versions
└── prompt.md           ← Prompt used to generate this module
UI and code files will be written into:

renderer/components/ApiKeyManager.tsx

main/api-key-storage.ts (or similar)

🔄 Data Flow
plaintext
Kopieren
Bearbeiten
[User Input] → [ApiKeyManager UI] → [IPC: save-api-key] → [Main: Store securely]
✅ Done When
UI component accepts user input for API key

Validates format (basic regex check)

Sends data via IPC to main process

Main process stores it (file system or keytar)

Key is retrievable and updatable

Fully integrated into the app shell

yaml
Kopieren
Bearbeiten
