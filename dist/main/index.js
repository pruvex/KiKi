"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const ipc_handlers_1 = require("./ipc-handlers");
// --- Constants ---
const IS_DEV = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5175';
// --- Logging ---
console.log('--- KiKi Core Shell ---');
console.log(`[Main] Running in ${IS_DEV ? 'development' : 'production'} mode.`);
// --- Main Window ---
let mainWindow = null;
/**
 * Creates the main application window.
 */
function createMainWindow() {
    console.log('[Main] Creating main window...');
    try {
        mainWindow = new electron_1.BrowserWindow({
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
                preload: node_path_1.default.join(__dirname, 'preload.js'), // Bridge between renderer and main
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
        }
        else {
            // Produktions-Build laden
            const prodPath = node_path_1.default.join(__dirname, '../index.html');
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
    }
    catch (error) {
        console.error('[Main] Failed to create main window:', error);
    }
}
// --- App Lifecycle ---
electron_1.app.whenReady().then(async () => {
    console.log('[Main] App is ready.');
    await createMainWindow();
    // Register all IPC handlers for the application.
    (0, ipc_handlers_1.registerIpcHandlers)(electron_1.ipcMain);
    // IPC-Handler für Fehler aus dem Renderer
    electron_1.ipcMain.on('renderer-error', (_event, msg) => {
        console.log('[Renderer-IPC] Fehler empfangen:', msg);
        console.error('[Renderer] Fehler:', msg);
        if (msg && msg.includes('ERR_CONNECTION_REFUSED')) {
            console.error('ERR_CONNECTION_REFUSED');
        }
    });
    // Handle macOS 'activate' event.
    electron_1.app.on('activate', async () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            await createMainWindow();
        }
    });
});
// Quit when all windows are closed, except on macOS.
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
console.log('[Main] Main process script loaded.');
