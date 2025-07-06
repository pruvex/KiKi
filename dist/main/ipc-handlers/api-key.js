"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerApiKeyHandlers = registerApiKeyHandlers;
const api_key_store_1 = require("../storage/api-key-store");
/**
 * Registers IPC handlers related to API key management.
 * @param ipcMain The IpcMain instance from Electron.
 */
function registerApiKeyHandlers(ipcMain) {
    // Handler to save an API key
    ipcMain.handle('api-key:save', async (_event, apiKey) => {
        console.log('[IPC] Received api-key:save request.');
        // Allow null/empty string to clear the key
        if (apiKey === null || apiKey.trim() === '') {
            try {
                await (0, api_key_store_1.saveApiKey)(null);
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        }
        // Basic backend validation for non-empty keys
        if (typeof apiKey !== 'string' || apiKey.trim().length < 10) {
            return { success: false, error: 'Invalid API key provided.' };
        }
        try {
            await (0, api_key_store_1.saveApiKey)(apiKey);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    // Handler to load an API key
    ipcMain.handle('api-key:load', async () => {
        console.log('[IPC] Received api-key:load request.');
        const key = await (0, api_key_store_1.loadApiKey)();
        if (key) {
            return { success: true, apiKey: key };
        }
        else {
            return { success: false, apiKey: null };
        }
    });
}
