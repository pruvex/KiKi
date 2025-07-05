"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object.
electron_1.contextBridge.exposeInMainWorld('kiki_api', {
    // Chat API Connector
    sendChatMessage: (payload) => electron_1.ipcRenderer.invoke('chat:send-message', payload),
    // API Key Management
    saveApiKey: (apiKey) => electron_1.ipcRenderer.invoke('api-key:save', apiKey),
    loadApiKey: () => electron_1.ipcRenderer.invoke('api-key:load'),
    // Example from previous step (add more as you need them)
    getAppVersion: () => electron_1.ipcRenderer.invoke('app:version'),
});
