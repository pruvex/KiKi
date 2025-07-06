import { IpcMain } from 'electron';
import { registerApiKeyHandlers } from './api-key';
import { registerChatHandlers } from './chat';
// import { registerApiConnector } from '../modules/chat/api-connector'; // (vorerst auskommentiert, bis implementiert)

/**
 * Registers all IPC (Inter-Process Communication) event handlers.
 * This function serves as the entry point for all modules to register
 * their specific back-end functionality.
 * @param {IpcMain} ipcMain - The IpcMain instance from Electron.
 */
export function registerIpcHandlers(ipcMain: IpcMain): void {
  console.log('[IPC] Registering all IPC handlers...');

  // Register handlers from different modules
  registerApiKeyHandlers(ipcMain);
  registerChatHandlers(ipcMain);
  // registerApiConnector(ipcMain); // (auskommentiert)

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
