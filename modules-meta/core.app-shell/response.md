Here is the complete codebase for the Electron main process, structured as requested.
📂 Final Codebase
Here are the complete files, structured and ready to be used in your project.
main/index.ts
This is the main entry point for the Electron application. It handles window creation, dev/prod mode detection, and prepares for IPC.
Generated typescript
// main/index.ts

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { registerIpcHandlers } from './ipc-handlers';

// --- Constants ---
// This variable will be true if the app is running in development mode.
const IS_DEV = process.env.NODE_ENV === 'development';
// The URL for the Vite development server.
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

// --- Logging ---
console.log('--- KiKi Core Shell ---');
console.log(`[Main] Running in ${IS_DEV ? 'development' : 'production'} mode.`);

// --- Main Window ---
let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main application window.
 */
function createMainWindow(): void {
  console.log('[Main] Creating main window...');
  try {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      minWidth: 1024,
      minHeight: 600,
      resizable: true,
      title: 'KiKi',
      webPreferences: {
        // The preload script is essential for secure IPC communication.
        // It will be created in a future step.
        // preload: path.join(__dirname, 'preload.js'),
        
        // Security best practices:
        contextIsolation: true, // Isolate window context from backend
        nodeIntegration: false, // Prevent Node.js APIs in renderer
      },
    });

    // Load the UI: either from the Vite dev server or the production build.
    if (IS_DEV) {
      mainWindow.loadURL(VITE_DEV_SERVER_URL);
      // Automatically open the DevTools in development mode.
      mainWindow.webContents.openDevTools();
    } else {
      // In production, load the built HTML file. The path assumes the
      // renderer's build output is in `dist/` adjacent to the `main/` dir.
      // e.g., /project-root/dist/index.html
      mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    // Gracefully handle window closure.
    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    console.log('[Main] Main window created successfully.');

  } catch (error) {
    console.error('[Main] Failed to create main window:', error);
  }
}

// --- App Lifecycle ---

// This method will be called when Electron has finished initialization
// and is ready to create browser windows.
app.whenReady().then(() => {
  console.log('[Main] App is ready.');
  
  createMainWindow();

  // Register all IPC handlers for the application.
  // This is where modules will plug into the core shell.
  registerIpcHandlers(ipcMain);

  // Handle macOS 'activate' event.
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  // On macOS, it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

console.log('[Main] Main process script loaded.');
Use code with caution.
TypeScript
main/ipc-handlers/index.ts
This stub file is the central point for registering all future IPC handlers. Each module can provide its own set of handlers, which will be imported and registered here.
Generated typescript
// main/ipc-handlers/index.ts

import { IpcMain } from 'electron';

/**
 * Registers all IPC (Inter-Process Communication) event handlers.
 * This function serves as the entry point for all modules to register
 * their specific back-end functionality.
 *
 * @param {IpcMain} ipcMain - The IpcMain instance from Electron.
 */
export function registerIpcHandlers(ipcMain: IpcMain): void {
  console.log('[IPC] Registering IPC handlers...');

  // --- Example of how a module would register its handlers ---
  // import { registerChatHandlers } from './chat-module-handlers';
  // registerChatHandlers(ipcMain);
  
  // import { registerAudiobookHandlers } from './audiobook-module-handlers';
  // registerAudiobookHandlers(ipcMain);

  // For now, this is just a placeholder.
  ipcMain.handle('app:version', () => {
    return `KiKi Core Shell v0.1.0`;
  });

  console.log('[IPC] IPC handlers registered.');
}
Use code with caution.
TypeScript
renderer/index.html
A simple placeholder HTML file. In a real project, Vite will replace this with the compiled frontend application.
Generated html
<!-- renderer/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KiKi - Loading Application</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          Helvetica, Arial, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background-color: #282c34;
        color: #abb2bf;
        text-align: center;
      }
      h1 {
        font-weight: 300;
      }
    </style>
  </head>
  <body>
    <div>
      <h1>KiKi Core Shell</h1>
      <p>Loading application interface...</p>
    </div>
    <!-- In a Vite project, this script tag will be added automatically -->
    <!-- <script type="module" src="/src/main.ts"></script> -->
  </body>
</html>
Use code with caution.
Html
🚀 How to Run
Project Setup: Place these files into their respective directories (main/, renderer/).
Dependencies: Make sure you have electron and typescript installed as dev dependencies.
Generated bash
npm install --save-dev electron typescript
Use code with caution.
Bash
Development Mode:
Start your Vite dev server (for the renderer): npm run dev (or your equivalent script). This will typically run on localhost:5173.
In a separate terminal, set the NODE_ENV and start Electron:
Generated bash
# On macOS/Linux
NODE_ENV=development npx electron main/index.ts

# On Windows (PowerShell)
$env:NODE_ENV="development"; npx electron main/index.ts
Use code with caution.
Bash
Production Mode:
First, build your renderer code (e.g., npm run build), which should output to a dist folder in the project root.
Then, compile your TypeScript main process code.
Finally, run the packaged Electron application. The NODE_ENV will not be 'development', so it will correctly load from the dist folder.
This setup provides a robust and clean foundation for the KiKi application, perfectly aligning with the goal of modular, scalable architecture.