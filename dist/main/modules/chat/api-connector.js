"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerApiConnector = registerApiConnector;
const node_fetch_1 = __importDefault(require("node-fetch")); // Using node-fetch for CJS/ESM compatibility in Electron
const api_key_store_1 = require("../../storage/api-key-store"); // Assumes the storage helper from a previous step
// --- Main IPC Registration Function ---
function registerApiConnector(ipcMain) {
    ipcMain.handle('chat:send-message', async (_event, payload) => {
        const provider = payload.config?.provider || process.env.KIKI_AI_PROVIDER || 'openai';
        let apiKey = await (0, api_key_store_1.loadApiKey)();
        if (!apiKey) {
            return { success: false, error: 'No API key found. Please set your API key first.' };
        }
        try {
            if (provider === 'openai') {
                return await callOpenAI(apiKey, payload);
            }
            else {
                return { success: false, error: `Unknown provider: ${provider}` };
            }
        }
        catch (error) {
            return { success: false, error: error.message || 'Unknown error during API call.' };
        }
    });
}
// --- Provider Implementations ---
async function callOpenAI(apiKey, payload) {
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
    const response = await (0, node_fetch_1.default)(endpoint, {
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
    const data = await response.json();
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
