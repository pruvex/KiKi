You are an expert TypeScript developer working in an Electron + React + Vite environment.  
Please implement the module `chat.api-key-manager` for the project "KiKi" as described below.

---

📦 Module name: `chat.api-key-manager`

🔍 Purpose:  
This module provides a secure and user-friendly UI to enter and manage API keys for external AI providers like OpenAI and Gemini. The key is validated in the frontend, and securely persisted by the Electron main process via IPC.

---

✅ Requirements:

1. **UI Component (Renderer):**
   - Create a reusable React component called `ApiKeyManager` in `renderer/components/ApiKeyManager.tsx`.
   - Input field for API key (masked input).
   - Basic validation (e.g. non-empty, basic format check).
   - "Save" button that triggers IPC call to persist key.
   - Optional: Display current status ("key saved", "invalid", etc.).
   - Use TailwindCSS for styling.
   - Component must be stateless: state is passed via props or managed by parent.

2. **IPC Communication:**
   - In `main/ipc-handlers/api-key.ts`, register an IPC handler (`ipcMain.handle`) to receive the key.
   - Use `ipcRenderer.invoke('api-key:save', apiKey)` to send from renderer.
   - Implement logic to store the key in a local file using Node.js `fs` (or optionally, encrypted).
   - Create another handler (`api-key:load`) that returns the current stored key to the renderer.

3. **File Storage:**
   - Store the API key in a file `kiki-api-key.json` inside the app’s user data directory (use `app.getPath('userData')`).
   - Format: `{ "apiKey": "..." }`
   - Make sure to catch errors and confirm successful save/load.

4. **Integration:**
   - Ensure `main/ipc-handlers/index.ts` imports and calls the `registerApiKeyHandlers(ipcMain)` function.
   - Provide example code to integrate the component in `App.tsx`.

---

💡 Notes:

- Do **not** use any external storage libraries unless absolutely necessary.
- Keep the implementation modular: UI, IPC, and storage must be clearly separated.
- Do not hardcode any keys or tokens.
- Focus on clean, production-ready code with logging where useful.

---

🧪 Bonus (optional):

- Display the currently saved key (partially masked) in the UI.
- Allow updating the key later.
- Add basic fade-in animation on success message.

---

🔁 Deliverables:

- `renderer/components/ApiKeyManager.tsx` (UI)
- `main/ipc-handlers/api-key.ts` (IPC handlers)
- Updates in `main/ipc-handlers/index.ts`
- Any helper files (e.g. `main/storage/api-key-store.ts`)
- Example integration in `App.tsx` or notes in comments

---

Please generate only the **full implementation files** as TypeScript source code.  
Assume TailwindCSS is available. Avoid unnecessary boilerplate.  
Structure the code cleanly and keep business logic in the main process.