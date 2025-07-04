You are an expert in building cross-platform desktop apps using Electron and TypeScript.

We are building a modular desktop application called **KiKi** that aims to eventually replace ChatGPT and be extended with domain-specific modules (e.g., for creating audiobooks and other specialized tools). Each part of the app is treated as its own module with strict architectural separation.

You're now helping us implement the **core shell module** of the application.

---

## 🔧 Your Task

Create the full implementation for the Electron `main` process that:

- Sets up a **minimal Electron shell**
- Prepares for **modular expansion**
- Runs in **development and production mode**
- Loads a UI via **Vite dev server** or `dist/` folder
- Initializes the **main window** with a fixed minimum size
- Prepares the app for future **IPC communication**

The implementation should be clean, readable, and scalable. Avoid overengineering – just build the core scaffolding.

---

## 🎯 Requirements

1. **Main Window**
   - Create the main Electron window on app start
   - Minimum size: 1024×600
   - Auto-resizable
   - Do not define a full menu (leave default)

2. **Dev vs. Prod Mode**
   - Use `NODE_ENV` to detect development mode
   - In development, load from `http://localhost:5173` (Vite)
   - In production, load from `dist/index.html`
   - In development, open DevTools automatically

3. **Logging**
   - On app start, log current mode (dev or prod)
   - Log window creation and errors (if any)

4. **File Structure**
   Your code should match this layout:

/main
├── index.ts ← Electron main entry
├── ipc-handlers/ ← Folder (empty for now)

/renderer
└── index.html ← Placeholder file to load

yaml
Kopieren
Bearbeiten

5. **IPC Setup**
- Prepare IPC channels (but no actual handlers yet)
- You may create a stub for `ipc-handlers/index.ts` to be filled in later

---

## 📦 Technologies to Use

- Electron (latest stable)
- TypeScript
- Vite (for frontend, just as target – not your concern in this prompt)
- No frontend code needed – only the main Electron shell logic

---

## 🧪 Output Format

Return your answer as a **single codebase** structured for use in a typical Electron + Vite + TypeScript project.  
Your response should include:

- The full `main/index.ts` file
- Any stubs (like `ipc-handlers/index.ts`)
- A placeholder `renderer/index.html` file
- Optional: Instructions or comments in the code

---

## 📘 Context

This is the first foundational module (`core.app-shell`) of the app.  
Further modules (chat UI, file manager, memory, etc.) will plug into this shell using IPC and shared orchestrator logic.

Focus on reliability and clean structure. Your output will be used directly to scaffold the project in the next step.

Make sure everything works out-of-the-box.