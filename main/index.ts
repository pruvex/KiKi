import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { registerIpcHandlers } from './ipc-handlers';

// --- Constants ---
const IS_DEV = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5175';

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
        // Security best practices:
        contextIsolation: true, // Isolate window context from backend
        nodeIntegration: false, // Prevent Node.js APIs in renderer
        preload: path.join(__dirname, 'preload.js'), // Bridge between renderer and main
      },
    });

    // Nachhaltige Ladelogik: Im Dev-Modus Dev-Server, im Prod-Modus IMMER das lokale Build
    if (IS_DEV && (process.env.KIKI_APP_SHELL_DEV_URL || VITE_DEV_SERVER_URL)) {
      const urlToLoad = process.env.KIKI_APP_SHELL_DEV_URL || VITE_DEV_SERVER_URL;
      console.log(`[Main] Lade Dev-Server: ${urlToLoad}`);
      mainWindow.loadURL(urlToLoad).catch(err => {
        console.error(`[Main] Fehler beim Laden der URL ${urlToLoad}:`, err);
      });
      mainWindow.webContents.openDevTools();
      mainWindow.webContents.on('did-finish-load', () => {
        if (mainWindow) {
          const [width, height] = mainWindow.getSize();
          console.log(`[Main] Fenstergröße nach Laden: ${width}x${height}`);
        }
      });
    } else {
      // Produktions-Build laden
      const prodPath = path.join(__dirname, '../index.html');
      console.log(`[Main] Lade Produktions-Build: ${prodPath}`);
      mainWindow.loadFile(prodPath).catch(err => {
        console.error(`[Main] Fehler beim Laden der Datei ${prodPath}:`, err);
      });
    }

    // Gracefully handle window closure.
    // Renderer-Fehler-Logging (hilft bei nachhaltiger Fehlersuche)
    mainWindow.webContents.on('console-message', (_e, level, message) => {
      console.log(`[Renderer][${level}]: ${message}`);
    });
    mainWindow.on('closed', () => {
      mainWindow = null;
    });

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
