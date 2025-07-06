const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kiki_api', {
  sendChatMessage: (payload) => ipcRenderer.invoke('chat:send-message', payload),
  saveApiKey: (apiKey) => ipcRenderer.invoke('api-key:save', apiKey),
  loadApiKey: () => ipcRenderer.invoke('api-key:load'),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
});
