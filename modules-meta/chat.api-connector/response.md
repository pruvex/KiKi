Of course. Here is a complete, production-ready implementation of the chat.api-connector module for the Electron main process.
This solution is modular, scalable, and includes all the requested features: provider switching, IPC handling, mock mode, and robust error management.
📂 File: main/modules/chat/api-connector.ts
This is the core module file that handles all the logic for connecting to external AI APIs.
Generated typescript
// main/modules/chat/api-connector.ts

import { IpcMain } from 'electron';
import fetch from 'node-fetch'; // Using node-fetch for CJS/ESM compatibility in Electron
import { loadApiKey } from '../../storage/api-key-store'; // Assumes the storage helper from a previous step

// --- Type Definitions ---

type MessageRole = 'user' | 'assistant' | 'system';

interface Message {
  role: MessageRole;
  content: string;
}

interface ChatRequestPayload {
  message: string;
  history?: Message[];
  config?: {
    provider?: 'openai' | 'gemini' | string;
    model?: string;
    temperature?: number;
  };
}

interface ChatResponse {
  success: boolean;
  reply?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider?: string;
  error?: string;
}

// --- Constants ---
const IS_MOCK_MODE = process.env.KIKI_FAKE_API === 'true';

// --- Helper to get API Key (Simulates the dependency) ---
// In a real app, you might have a more complex system for multiple keys.
// This uses the previously created `loadApiKey` function.
async function getApiKey(provider: string): Promise<string | null> {
  console.log(`[API Connector] Requesting API key for provider: ${provider}`);
  // For this implementation, we assume a single key is used.
  // This can be extended to look up a key based on the provider.
  return loadApiKey();
}

// --- OpenAI Provider Logic ---

async function callOpenAI(apiKey: string, payload: ChatRequestPayload): Promise<ChatResponse> {
  const { message, history = [], config = {} } = payload;
  const model = config.model || 'gpt-4-turbo-preview';
  const temperature = config.temperature ?? 0.7;

  const messages: Message[] = [
    ...history,
    { role: 'user', content: message },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      const errorMessage = errorBody.error?.message || `HTTP Error: ${response.status}`;
      console.error('[OpenAI] API Error:', errorMessage);
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content;
    const usage = data.usage;

    return {
      success: true,
      reply: reply.trim(),
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      provider: 'openai',
    };
  } catch (err: any) {
    console.error('[OpenAI] Network or fetch error:', err);
    return { success: false, error: err.message || 'A network error occurred.' };
  }
}

// --- Google Gemini Provider Logic ---

// Gemini has a different message format than OpenAI
function transformHistoryForGemini(history: Message[], userMessage: string) {
    return [
        ...history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        })),
        { role: 'user', parts: [{ text: userMessage }] }
    ];
}

async function callGemini(apiKey: string, payload: ChatRequestPayload): Promise<ChatResponse> {
    const { message, history = [], config = {} } = payload;
    const model = config.model || 'gemini-pro';
    const temperature = config.temperature ?? 0.7;
    
    const contents = transformHistoryForGemini(history, message);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: { temperature },
            }),
        });
        
        if (!response.ok) {
            const errorBody = await response.json();
            const errorMessage = errorBody.error?.message || `HTTP Error: ${response.status}`;
            console.error('[Gemini] API Error:', errorMessage);
            return { success: false, error: errorMessage };
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const usage = data.usageMetadata;

        if (!reply) {
          return { success: false, error: 'Received an empty reply from Gemini.' };
        }

        return {
            success: true,
            reply: reply.trim(),
            usage: {
              promptTokens: usage.promptTokenCount,
              completionTokens: usage.candidatesTokenCount,
              totalTokens: usage.totalTokenCount,
            },
            provider: 'gemini',
        };

    } catch (err: any) {
        console.error('[Gemini] Network or fetch error:', err);
        return { success: false, error: err.message || 'A network error occurred.' };
    }
}


// --- IPC Registration ---

/**
 * Registers the IPC handler for the chat API connector.
 * This function is exported and called from the main IPC setup file.
 * @param ipcMain The IpcMain instance from Electron.
 */
export function registerChatApiConnector(ipcMain: IpcMain): void {
  ipcMain.handle(
    'chat:send-message',
    async (_event, payload: ChatRequestPayload): Promise<ChatResponse> => {
      console.log('[API Connector] Received chat:send-message request.');

      // --- 1. Handle Mock Mode for Testing ---
      if (IS_MOCK_MODE) {
        console.log('[API Connector] In mock mode. Returning fake response.');
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          success: true,
          reply: 'This is a test response from the mock API.',
          provider: 'mock',
          usage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 },
        };
      }

      // --- 2. Get Provider and API Key ---
      const provider = payload.config?.provider || 'openai'; // Default to OpenAI
      const apiKey = await getApiKey(provider);

      if (!apiKey) {
        const error = 'API key not found. Please configure it in the settings.';
        console.error(`[API Connector] Error: ${error}`);
        return { success: false, error };
      }

      // --- 3. Route to the Correct Provider ---
      switch (provider) {
        case 'openai':
          return callOpenAI(apiKey, payload);
        case 'gemini':
          return callGemini(apiKey, payload);
        default:
          const error = `Unsupported provider: '${provider}'. Supported providers are 'openai', 'gemini'.`;
          console.error(`[API Connector] Error: ${error}`);
          return { success: false, error };
      }
    },
  );
}
Use code with caution.
TypeScript
🛠 Integration Instructions
To make this new module active, you need to call its registration function from your central IPC handler file.
Update main/ipc-handlers/index.ts
Generated typescript
// main/ipc-handlers/index.ts

import { IpcMain } from 'electron';
import { registerApiKeyHandlers } from './api-key';
import { registerChatApiConnector } from '../modules/chat/api-connector'; // <-- ADD THIS IMPORT

/**
 * Registers all IPC (Inter-Process Communication) event handlers.
 */
export function registerIpcHandlers(ipcMain: IpcMain): void {
  console.log('[IPC] Registering all IPC handlers...');

  // Register handlers from different modules
  registerApiKeyHandlers(ipcMain);
  registerChatApiConnector(ipcMain); // <-- ADD THIS LINE

  // Example handler
  ipcMain.handle('app:version', () => {
    return `KiKi Core Shell v0.1.0`;
  });

  console.log('[IPC] All IPC handlers registered.');
}
