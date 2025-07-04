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
    async (_event, apiKey: string): Promise<{ success: boolean; error?: string }> => {
      console.log('[IPC] Received api-key:save request.');
      // Basic backend validation
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
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
  ipcMain.handle('api-key:load', async (): Promise<string | null> => {
    console.log('[IPC] Received api-key:load request.');
    return await loadApiKey();
  });
}
