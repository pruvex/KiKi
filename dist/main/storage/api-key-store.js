"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveApiKey = saveApiKey;
exports.loadApiKey = loadApiKey;
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = __importDefault(require("node:fs/promises"));
const USER_DATA_PATH = electron_1.app.getPath('userData');
const API_KEY_FILE_PATH = node_path_1.default.join(USER_DATA_PATH, 'kiki-api-key.json');
/**
 * Saves the provided API key to a secure file in the app's user data directory.
 * @param apiKey The API key string to save.
 * @returns A promise that resolves when the key is saved.
 */
async function saveApiKey(apiKey) {
    try {
        if (!apiKey) {
            // If apiKey is null or empty, delete the file
            await promises_1.default.unlink(API_KEY_FILE_PATH);
            console.log('[ApiKeyStore] API Key file deleted.');
            return;
        }
        const data = { apiKey };
        // Ensure the directory exists
        await promises_1.default.mkdir(node_path_1.default.dirname(API_KEY_FILE_PATH), { recursive: true });
        await promises_1.default.writeFile(API_KEY_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
        console.log('[ApiKeyStore] API Key saved successfully.');
    }
    catch (error) {
        console.error('[ApiKeyStore] Failed to save API key:', error);
        throw new Error('Failed to save API key.');
    }
}
/**
 * Loads the API key from the app's user data directory.
 * @returns A promise that resolves with the API key string, or null if not found.
 */
async function loadApiKey() {
    try {
        const fileContent = await promises_1.default.readFile(API_KEY_FILE_PATH, 'utf-8');
        const data = JSON.parse(fileContent);
        console.log('[ApiKeyStore] API Key loaded successfully.');
        return data.apiKey || null;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            console.log('[ApiKeyStore] API key file not found. Returning null.');
            return null; // File doesn't exist, which is a normal state
        }
        console.error('[ApiKeyStore] Failed to load API key:', error);
        return null;
    }
}
