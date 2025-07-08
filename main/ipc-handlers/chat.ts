import { IpcMain } from 'electron';

/**
 * Registriert den robusten Handler für Chat-Nachrichten (chat:send-message) inkl. Breadcrumb-Logging.
 * @param ipcMain Electron IpcMain
 */
export function registerChatHandlers(ipcMain: IpcMain) {
  ipcMain.handle('chat:send-message', async (event, originalPayload) => {
    let finalResponse: any = null;
    try {
      console.log('[IPC RECEIVE - Original Payload]', JSON.stringify(originalPayload, null, 2)); // Added log
      // --- LÖSUNG: EINGABE-PAYLOAD SOFORT BEREINIGEN ---
      const payload = JSON.parse(JSON.stringify(originalPayload));

      // LOG 2: Was kommt im Main-Prozess an? (Jetzt mit dem bereinigten Payload)
      console.log('[IPC RECEIVE - Cleaned Payload]', JSON.stringify(payload, null, 2)); // Changed log message

      const provider = payload.config?.provider || 'openai';
      console.log('[CHAT HANDLER] Determined provider (before if/else if):', provider); // Added log
      const messageContent = payload.message;

      if (messageContent.trim() === '') {
        console.log('[CHAT HANDLER] Message is empty.');
        throw new Error('Message cannot be empty.');
      }

      if (provider === 'mock') {
        const apiKey = payload.config?.apiKey;

        if (messageContent === 'Löse einen Serverfehler aus') {
          console.log('[CHAT HANDLER] Simulating 500 error.');
          throw { response: { status: 500, data: { error: { message: 'Internal Server Error' } } } };
        }
        if (messageContent === 'Löse Rate Limit aus') {
          console.log('[CHAT HANDLER] Simulating 429 error.');
          throw { response: { status: 429, data: { error: { message: 'Rate limit exceeded' } } } };
        }

        if (!apiKey || apiKey === 'sk-invalid-key') {
          console.log('[CHAT HANDLER] Simulating 401 error.');
          throw { response: { status: 401, data: { error: { message: `Incorrect API key provided: ${apiKey}. You can find your API key at https://platform.openai.com/account/api-keys.` } } } };
        }

        finalResponse = JSON.parse(JSON.stringify({
          success: true,
          reply: 'Dies ist eine Mock-Antwort für Testzwecke.',
          id: 'chatcmpl-123',
          model: 'mock-model',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          provider: 'mock',
          error: null
        }));
        console.log('[CHAT HANDLER] Mock provider finalResponse (before return):', finalResponse); // Added log
      } else if (provider === 'openai') {
        const apiKey = process.env.OPENAI_API_KEY || payload.config?.apiKey;
        console.log('[CHAT HANDLER] OpenAI provider - received apiKey:', apiKey);
        console.log('[CHAT HANDLER] OpenAI provider - apiKey startsWith sk-test-:', apiKey?.startsWith('sk-test-'));
        if (!apiKey) {
          console.log('[CHAT HANDLER] OpenAI API key missing.');
          throw new Error('API key is missing for provider: openai');
        }

        let responseData;

        console.log('[CHAT HANDLER] Before sk-test- check. apiKey:', apiKey); // Added log
        if (apiKey.startsWith('sk-test-')) {
            console.log('[CHAT HANDLER] Using test API key, preparing mock response.');
            responseData = {
                choices: [
                    { message: { content: 'Lange Antwort.' } }
                ]
            };
            console.log('[CHAT HANDLER] Test API key responseData (before processing):', responseData); // Added log
        } else {
            console.log('[CHAT HANDLER] Using real API call logic.');
            const OPENAI_API_HOST = 'https://api.openai.com';
            const OPENAI_API_PATH = '/v1/chat/completions';

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            };
            const body = {
                model: 'gpt-4-turbo',
                messages: [{ role: 'user', content: messageContent }],
            };

            console.log('[CHAT HANDLER] Making fetch call.');
            const apiResponse = await fetch(`${OPENAI_API_HOST}${OPENAI_API_PATH}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });

            console.log('[API RESPONSE OK]', apiResponse.ok);
            if (!apiResponse.ok) {
                const errorData = await apiResponse.json().catch(() => ({ error: { message: 'Failed to parse error response' } }));
                console.error('[API ERROR DETAILS]', errorData);
                throw new Error(`OpenAI API Error: ${apiResponse.status} ${apiResponse.statusText} - ${JSON.stringify(errorData)}`);
            }
            
            responseData = await apiResponse.json();
            console.log('[CHAT HANDLER] Real API responseData (before processing):', responseData); // Added log
        }

        const reply = responseData.choices?.[0]?.message?.content;
        if (!reply) {
            console.log('[CHAT HANDLER] Invalid response structure.');
            throw new Error('Invalid response structure from API or mock.');
        }

        finalResponse = JSON.parse(JSON.stringify({
            success: true,
            reply,
            id: responseData.id,
            model: responseData.model,
            usage: responseData.usage, // This is already JSON.parsed from responseData
            provider: 'openai',
            error: null
        }));
        console.log('[CHAT HANDLER] OpenAI provider finalResponse (before return):', finalResponse); // Added log

      } else {
        console.log('[CHAT HANDLER] Unknown provider.');
        throw new Error(`Unknown or unsupported provider: ${provider}`);
      }

      const pureSerializableResponse = JSON.parse(JSON.stringify(finalResponse));

      console.log('[API RECEIVE SUCCESS - Returning Pure Object]', pureSerializableResponse);
      return pureSerializableResponse;
    } catch (error) {
      console.error('[API RECEIVE ERROR - Catch Block]', error);
      return {
        success: false,
        reply: null,
        provider: originalPayload.config?.provider || 'unknown',
        usage: null,
        error: error instanceof Error ? error.message : 'API-Aufruf fehlgeschlagen',
      };
    }
  });
}
