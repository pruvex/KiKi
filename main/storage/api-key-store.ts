import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

const USER_DATA_PATH = app.getPath('userData');
const API_KEY_FILE_PATH = path.join(USER_DATA_PATH, 'kiki-api-key.json');

interface ApiKeyData {
  apiKey: string;
}

/**
 * Saves the provided API key to a secure file in the app's user data directory.
 * @param apiKey The API key string to save.
 * @returns A promise that resolves when the key is saved.
 */
export async function saveApiKey(apiKey: string | null): Promise<void> {
  try {
    if (!apiKey) {
      // If apiKey is null or empty, delete the file
      await fs.unlink(API_KEY_FILE_PATH);
      console.log('[ApiKeyStore] API Key file deleted.');
      return;
    }
    const data: ApiKeyData = { apiKey };
    // Ensure the directory exists
    await fs.mkdir(path.dirname(API_KEY_FILE_PATH), { recursive: true });
    await fs.writeFile(API_KEY_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log('[ApiKeyStore] API Key saved successfully.');
  } catch (error) {
    console.error('[ApiKeyStore] Failed to save API key:', error);
    throw new Error('Failed to save API key.');
  }
}

/**
 * Loads the API key from the app's user data directory.
 * @returns A promise that resolves with the API key string, or null if not found.
 */
export async function loadApiKey(): Promise<string | null> {
  try {
    const fileContent = await fs.readFile(API_KEY_FILE_PATH, 'utf-8');
    const data: ApiKeyData = JSON.parse(fileContent);
    console.log('[ApiKeyStore] API Key loaded successfully.');
    return data.apiKey || null;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('[ApiKeyStore] API key file not found. Returning null.');
      return null; // File doesn't exist, which is a normal state
    }
    console.error('[ApiKeyStore] Failed to load API key:', error);
    return null;
  }
}
