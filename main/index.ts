import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { registerIpcHandlers } from './ipc-handlers';

// --- Constants ---
const IS_DEV = process.env.NODE_ENV === 'development';
const DEV_SERVER_URL = process.env.KIKI_APP_SHELL_DEV_URL || process.env.VITE_DEV_SERVER_URL || 'http://localhost:5175';
console.log('[Main] DEV_SERVER_URL:', DEV_SERVER_URL);

// --- Logging ---
console.log('--- KiKi Core Shell ---');
console.log(`[Main] Running in ${IS_DEV ? 'development' : 'production'} mode.`);

// --- Main Window ---
let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main application window.
 */
async function createMainWindow(): Promise<void> {
  console.log('[Main] Creating main window...');
  try {
    // --- Fenstergröße aus CLI-Argumenten lesen (z.B. --window-size=1280,720) ---
    let winWidth = 1280;
    let winHeight = 720;
    const sizeArg = process.argv.find(arg => arg.startsWith('--window-size='));
    if (sizeArg) {
      const [w, h] = sizeArg.replace('--window-size=', '').split(',').map(Number);
      if (!isNaN(w) && !isNaN(h)) {
        winWidth = w;
        winHeight = h;
      }
    }

    // Preload-Pfad prüfen und loggen
    const fs = require('fs');
    const preloadPath = path.join(__dirname, '../preload.js');
    console.log('[Main] Preload-Pfad:', preloadPath, 'Existiert:', fs.existsSync(preloadPath));

    mainWindow = new BrowserWindow({
      width: winWidth,
      height: winHeight,
      x: 0,
      y: 0,
      minWidth: 1024,
      minHeight: 600,
      resizable: true,
      title: 'KiKi',
      webPreferences: {
        // Security best practices:
        contextIsolation: true, // Isolate window context from backend
        nodeIntegration: false, // Prevent Node.js APIs in renderer
        preload: preloadPath, // Bridge between renderer and main
      },
    });

    // Robuster Fehler-Handler für Ladefehler (MUSS VOR JEDEM loadURL/loadFile stehen!)
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      const msg = `[Main] Fehler beim Laden des Hauptfensters: ${errorDescription} (${errorCode}) für ${validatedURL}`;
      console.error(msg);
      if (errorDescription && errorDescription.includes('ERR_CONNECTION_REFUSED')) {
        console.error('ERR_CONNECTION_REFUSED');
      }
    });

    // Load the UI: either from the Vite dev server or the production build.
    if (IS_DEV) {
      await mainWindow.loadURL(DEV_SERVER_URL);
      mainWindow.webContents.openDevTools();
    } else {
      await mainWindow.loadFile(path.join(__dirname, '../index.html'));
    }

    // Gracefully handle window closure.
    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // Nach dem Laden: Größe und Position explizit setzen (Workaround für Playwright)
    mainWindow.once('ready-to-show', () => {
      if (mainWindow) {
        mainWindow.setSize(winWidth, winHeight);
        mainWindow.setPosition(0, 0);
        mainWindow.show();
      }
    });

    // Robuster Fehler-Handler für Ladefehler
    if (mainWindow) {
      mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`[Main] Fehler beim Laden des Hauptfensters: ${errorDescription} (${errorCode}) für ${validatedURL}`);
        console.error(`[Main] Fehlercode: ${errorCode}, Fehlerbeschreibung: ${errorDescription}`);
        if (errorDescription && errorDescription.includes('ERR_CONNECTION_REFUSED')) {
          console.error('ERR_CONNECTION_REFUSED');
        }
      });
    }

    console.log('[Main] Main window created successfully.');
  } catch (error) {
    console.error('[Main] Failed to create main window:', error);
  }
}

// --- App Lifecycle ---
app.whenReady().then(async () => {
  console.log('[Main] App is ready.');
  await createMainWindow();
  // Register all IPC handlers for the application.
  registerIpcHandlers(ipcMain);
  // IPC-Handler für Fehler aus dem Renderer
  ipcMain.on('renderer-error', (_event, msg) => {
    console.log('[Renderer-IPC] Fehler empfangen:', msg);
    console.error('[Renderer] Fehler:', msg);
    if (msg && msg.includes('ERR_CONNECTION_REFUSED')) {
      console.error('ERR_CONNECTION_REFUSED');
    }
  });
  // Handle macOS 'activate' event.
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

console.log('[Main] Main process script loaded.');
