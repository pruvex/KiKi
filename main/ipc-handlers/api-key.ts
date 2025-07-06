import { IpcMain } from 'electron';
import { saveApiKey, loadApiKey } from '../storage/api-key-store';

/**
 * Registers IPC handlers related to API key management.
 * @param ipcMain The IpcMain instance from Electron.
 */
export function registerApiKeyHandlers(ipcMain: IpcMain): void {
  // Handler to save an API key
  ipcMain.handle(
    'api-key:save',
    async (_event, apiKey: string | null): Promise<{ success: boolean; error?: string }> => {
      console.log('[IPC] Received api-key:save request.');
      // Allow null/empty string to clear the key
      if (apiKey === null || apiKey.trim() === '') {
        try {
          await saveApiKey(null);
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }
      // Basic backend validation for non-empty keys
      if (typeof apiKey !== 'string' || apiKey.trim().length < 10) {
        return { success: false, error: 'Invalid API key provided.' };
      }
      try {
        await saveApiKey(apiKey);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  // Handler to load an API key
  ipcMain.handle('api-key:load', async () => {
    console.log('[IPC] Received api-key:load request.');
    const key = await loadApiKey();
    if (key) {
      return { success: true, apiKey: key };
    } else {
      return { success: false, apiKey: null };
    }
  });
}
