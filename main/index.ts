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

    // Load the UI: either from the Vite dev server, a command-line argument, or the production build.
    const urlToLoad = process.argv[2] || VITE_DEV_SERVER_URL;

    if (urlToLoad) {
      console.log(`[Main] Lade URL: ${urlToLoad}`);
      mainWindow.loadURL(urlToLoad);
      if (IS_DEV) {
        mainWindow.webContents.openDevTools();
        mainWindow.webContents.on('did-finish-load', () => {
          if (mainWindow) {
            const [width, height] = mainWindow.getSize();
            console.log(`[Main] Fenstergröße nach Laden: ${width}x${height}`);
          }
        });
      }
    } else {
      console.log('[Main] Lade Produktions-Build.');
      mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'dist', 'index.html'));
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
app.whenReady().then(() => {
  console.log('[Main] App is ready.');
  createMainWindow();
  // Register all IPC handlers for the application.
  registerIpcHandlers(ipcMain);
  // Handle macOS 'activate' event.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
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
