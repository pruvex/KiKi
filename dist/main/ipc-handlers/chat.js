"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatHandlers = registerChatHandlers;
/**
 * Registriert den robusten Handler für Chat-Nachrichten (chat:send-message) inkl. Breadcrumb-Logging.
 * @param ipcMain Electron IpcMain
 */
function registerChatHandlers(ipcMain) {
    ipcMain.handle('chat:send-message', async (event, payload) => {
        // LOG 2: Was kommt im Main-Prozess an?
        console.log('[IPC RECEIVE]', JSON.stringify(payload, null, 2));
        let apiKey = null;
        let requestBody = null;
        try {
            // Beispiel: API-Key aus sicherem Store laden (ggf. anpassen)
            apiKey = process.env.OPENAI_API_KEY || 'NO_KEY_FOUND';
            requestBody = {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: payload.message }],
                // ggf. weitere Felder aus payload übernehmen
            };
            // LOG 3: Was geht an die externe API raus? (Body & Key)
            console.log('[API SEND] Body:', JSON.stringify(requestBody, null, 2));
            console.log('[API SEND] Verwendeter API Key (erste 5 Zeichen):', apiKey ? `sk...${apiKey.slice(-5)}` : 'KEIN API KEY!');
            // --- Hier sollte der tatsächliche API-Call stehen ---
            // const response = await openai.chat.completions.create(requestBody);
            // Simulierter Dummy-Response für Demo:
            const response = { id: 'chatcmpl-123', object: 'chat.completion', created: Date.now(), model: 'gpt-3.5-turbo', choices: [{ message: { content: 'Dies ist eine Beispielantwort.' } }], usage: { total_tokens: 42 } };
            // LOG 4: Was kommt von der externen API zurück? (Erfolgsfall)
            console.log('[API RECEIVE SUCCESS]', JSON.stringify(response, null, 2));
            return response;
        }
        catch (error) {
            // LOG 5: Was ist der GENAUE Fehler von der API? (Fehlerfall)
            console.error('[API RECEIVE ERROR]', error);
            if (typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                error.response?.data) {
                console.error('[API ERROR DETAILS]', error.response.data);
            }
            return { error: 'API-Aufruf fehlgeschlagen' };
        }
    });
}
