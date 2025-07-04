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
const VITE_DEV_SERVER_URL = 'http://localhost:5173';
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
        // Load the UI: either from the Vite dev server or the production build.
        if (IS_DEV) {
            mainWindow.loadURL(VITE_DEV_SERVER_URL);
            mainWindow.webContents.openDevTools();
        }
        else {
            mainWindow.loadFile(node_path_1.default.join(__dirname, '..', 'renderer', 'dist', 'index.html'));
        }
        // Gracefully handle window closure.
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
electron_1.app.whenReady().then(() => {
    console.log('[Main] App is ready.');
    createMainWindow();
    // Register all IPC handlers for the application.
    (0, ipc_handlers_1.registerIpcHandlers)(electron_1.ipcMain);
    // Handle macOS 'activate' event.
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
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
