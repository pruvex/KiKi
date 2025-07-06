console.log('PRELOAD AKTIV');
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kiki_api', {
  saveApiKey: (key) => ipcRenderer.invoke('api-key:save', key),
  loadApiKey: () => ipcRenderer.invoke('api-key:load'),
  sendChatMessage: (payload) => ipcRenderer.invoke('chat:send-message', payload),
});

// Für Playwright- und sichere IPC-Tests: electron.ipcRenderer.invoke
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (...args) => ipcRenderer.invoke(...args)
  }
});

contextBridge.exposeInMainWorld('reportRendererError', (msg) => {
  ipcRenderer.send('renderer-error', msg);
});

window.addEventListener('error', (e) => {
  window.reportRendererError && window.reportRendererError(e.message || String(e));
});
window.addEventListener('unhandledrejection', (e) => {
  window.reportRendererError && window.reportRendererError(e.reason ? e.reason.message : String(e.reason));
});

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
