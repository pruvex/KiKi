Of course. As an expert TypeScript developer, I will provide a complete, production-ready implementation for the chat.api-key-manager module.
This solution follows best practices by separating concerns:
Storage (main/storage): Handles direct file system interaction.
IPC Handler (main/ipc-handlers): Acts as a secure bridge, validating and orchestrating calls.
Preload Script (renderer/preload.ts): Securely exposes IPC channels to the renderer in a type-safe way.
UI Component (renderer/components): A "dumb" component focused solely on presentation and user interaction.
Container (App.tsx): Manages state and orchestrates the UI components.
Here are the complete implementation files.
📂 File: main/storage/api-key-store.ts
This new file cleanly encapsulates all file system logic for the API key.
Generated typescript
// main/storage/api-key-store.ts

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
export async function saveApiKey(apiKey: string): Promise<void> {
  try {
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
Use code with caution.
TypeScript
📂 File: main/ipc-handlers/api-key.ts
This new file defines the IPC channels for saving and loading the key.
Generated typescript
// main/ipc-handlers/api-key.ts

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
Use code with caution.
TypeScript
📂 File: main/ipc-handlers/index.ts (Updated)
Update your main IPC registrar to include the new API key handlers.
Generated typescript
// main/ipc-handlers/index.ts

import { IpcMain } from 'electron';
import { registerApiKeyHandlers } from './api-key'; // <--- ADD THIS LINE

/**
 * Registers all IPC (Inter-Process Communication) event handlers.
 */
export function registerIpcHandlers(ipcMain: IpcMain): void {
  console.log('[IPC] Registering all IPC handlers...');

  // Register handlers from different modules
  registerApiKeyHandlers(ipcMain); // <--- ADD THIS LINE

  // Example handler from previous step
  ipcMain.handle('app:version', () => {
    return `KiKi Core Shell v0.1.0`;
  });

  console.log('[IPC] All IPC handlers registered.');
}
Use code with caution.
TypeScript
📂 File: renderer/preload.ts (Crucial for Security & Type-Safety)
This preload script exposes the IPC channels to your React app securely.
Generated typescript
// renderer/preload.ts

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object.
contextBridge.exposeInMainWorld('kiki_api', {
  // API Key Management
  saveApiKey: (apiKey: string) => ipcRenderer.invoke('api-key:save', apiKey),
  loadApiKey: () => ipcRenderer.invoke('api-key:load'),
  
  // Example from previous step (add more as you need them)
  getAppVersion: () => ipcRenderer.invoke('app:version'),
});
Use code with caution.
TypeScript
📂 File: renderer/kiki-api.d.ts (For TypeScript Intellisense)
This declaration file makes the preloaded API available to TypeScript in your renderer code.
Generated typescript
// renderer/kiki-api.d.ts

// This tells TypeScript that the `window` object will have our `kiki_api`.
export interface IKikiApi {
  saveApiKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  loadApiKey: () => Promise<string | null>;
  getAppVersion: () => Promise<string>;
}

declare global {
  interface Window {
    kiki_api: IKikiApi;
  }
}
Use code with caution.
TypeScript
📂 File: renderer/components/ApiKeyManager.tsx
The final React component, implementing all requirements and bonus features.
Generated tsx
// renderer/components/ApiKeyManager.tsx

import React, { useState, useEffect } from 'react';

interface ApiKeyManagerProps {
  // Callback invoked when a key is successfully saved.
  onKeySaved: () => void;
  // A masked version of the currently stored key, e.g., "sk-••••••••••••1234".
  currentKeyMasked: string | null;
}

/**
 * Masks an API key, showing only the first and last few characters.
 * @param key The API key string.
 * @returns A masked string or an empty string if key is invalid.
 */
export const maskApiKey = (key: string | null): string | null => {
  if (!key || key.length < 8) return null;
  return `${key.substring(0, 4)}••••••••••••${key.substring(key.length - 4)}`;
};

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeySaved, currentKeyMasked }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showStatus, setShowStatus] = useState(false);

  // Effect to fade out the status message after a few seconds
  useEffect(() => {
    if (status) {
      setShowStatus(true);
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSave = async () => {
    if (!apiKeyInput.trim()) {
      setStatus({ type: 'error', message: 'API Key cannot be empty.' });
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const result = await window.kiki_api.saveApiKey(apiKeyInput);
      if (result.success) {
        setStatus({ type: 'success', message: 'API Key saved successfully!' });
        setApiKeyInput('');
        onKeySaved(); // Notify parent component
      } else {
        setStatus({ type: 'error', message: result.error || 'An unknown error occurred.' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to communicate with the main process.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-800 p-8 text-white">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-lg shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-2">API Key Required</h2>
        <p className="text-center text-gray-400 mb-6">
          Please provide your API key to continue.
        </p>
        
        {currentKeyMasked && (
            <div className="bg-gray-800 p-3 rounded-md mb-4 text-center">
                <p className="text-sm text-gray-400">Current Key:</p>
                <p className="font-mono text-green-400">{currentKeyMasked}</p>
            </div>
        )}

        <div className="space-y-4">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentKeyMasked ? "Enter new key to update" : "Enter your API key"}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSaving}
          />
          <button
            onClick={handleSave}
            disabled={isSaving || !apiKeyInput.trim()}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSaving ? 'Saving...' : 'Save and Continue'}
          </button>
        </div>
        
        <div className={`mt-4 h-6 text-center transition-opacity duration-300 ${showStatus ? 'opacity-100' : 'opacity-0'}`}>
          {status && (
            <p className={status.type === 'success' ? 'text-green-400' : 'text-red-400'}>
              {status.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
Use code with caution.
Tsx
📂 Example Integration in renderer/App.tsx
This shows how to use the ApiKeyManager and ChatWindow components together.
Generated tsx
// renderer/App.tsx

import React, { useState, useEffect } from 'react';
import ApiKeyManager, { maskApiKey } from './components/ApiKeyManager';
import ChatWindow from './components/ChatWindow';

// Define the structure of a message for the ChatWindow
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const App: React.FC = () => {
  const [apiKeyExists, setApiKeyExists] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dummy data for the chat window
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am KiKi. How can I assist you today?' }
  ]);

  // Check for an existing API key when the app loads
  const checkApiKey = async () => {
    setIsLoading(true);
    const key = await window.kiki_api.loadApiKey();
    if (key) {
      setApiKeyExists(true);
      setMaskedKey(maskApiKey(key));
    } else {
      setApiKeyExists(false);
      setMaskedKey(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkApiKey();
  }, []);

  // This function is passed to ApiKeyManager and called on success
  const handleKeySaved = () => {
    console.log("Key has been saved, re-validating...");
    checkApiKey(); // Re-check the key status to update the UI
  };

  const handleSendMessage = (message: string) => {
    // Add user message to the chat
    const newMessages = [...messages, { role: 'user' as const, content: message }];
    setMessages(newMessages);

    // TODO: Here you would call your AI provider with the message
    // and then add the assistant's response.
    console.log(`Sending to AI: "${message}"`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-800 text-white">Loading...</div>;
  }
  
  return (
    <div className="h-screen w-screen">
      {apiKeyExists ? (
        <ChatWindow messages={messages} onSendMessage={handleSendMessage} />
      ) : (
        <ApiKeyManager onKeySaved={handleKeySaved} currentKeyMasked={maskedKey} />
      )}
    </div>
  );
};

export default App;