import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object.
contextBridge.exposeInMainWorld('kiki_api', {
  // Chat API Connector
  sendChatMessage: (payload: any) => ipcRenderer.invoke('chat:send-message', payload),
  // API Key Management
  saveApiKey: (apiKey: string) => ipcRenderer.invoke('api-key:save', apiKey),
  loadApiKey: () => ipcRenderer.invoke('api-key:load'),

  // Example from previous step (add more as you need them)
  getAppVersion: () => ipcRenderer.invoke('app:version'),
});
