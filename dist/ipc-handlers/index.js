"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpcHandlers = registerIpcHandlers;
const api_key_1 = require("./api-key"); // <--- ADD THIS LINE
const api_connector_1 = require("../modules/chat/api-connector"); // <--- ADD FOR API CONNECTOR
/**
 * Registers all IPC (Inter-Process Communication) event handlers.
 * This function serves as the entry point for all modules to register
 * their specific back-end functionality.
 * @param {IpcMain} ipcMain - The IpcMain instance from Electron.
 */
function registerIpcHandlers(ipcMain) {
    console.log('[IPC] Registering all IPC handlers...');
    // Register handlers from different modules
    (0, api_key_1.registerApiKeyHandlers)(ipcMain);
    (0, api_connector_1.registerApiConnector)(ipcMain);
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
