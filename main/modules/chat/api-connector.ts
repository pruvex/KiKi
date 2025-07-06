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

// --- Main IPC Registration Function ---
export function registerApiConnector(ipcMain: IpcMain) {
  ipcMain.handle('chat:send-message', async (_event, payload: ChatRequestPayload): Promise<ChatResponse> => {
    const provider = payload.config?.provider || process.env.KIKI_AI_PROVIDER || 'openai';
    let apiKey = await loadApiKey();
    if (!apiKey) {
      return { success: false, error: 'No API key found. Please set your API key first.' };
    }

    try {
      if (provider === 'openai') {
        return await callOpenAI(apiKey, payload);
      } else {
        return { success: false, error: `Unknown provider: ${provider}` };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error during API call.' };
    }
  });
}

// --- Provider Implementations ---
async function callOpenAI(apiKey: string, payload: ChatRequestPayload): Promise<ChatResponse> {
  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const model = payload.config?.model || 'gpt-3.5-turbo';
  const temperature = payload.config?.temperature ?? 0.7;
  const messages = [
    ...(payload.history || []),
    { role: 'user', content: payload.message }
  ];

  const body = {
    model,
    messages,
    temperature
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: `OpenAI API Error: ${response.status} ${errorText}` };
  }

  const data: any = await response.json();
  return {
    success: true,
    reply: data.choices?.[0]?.message?.content || '',
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
    provider: 'openai'
  };
}
