import React, { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import ApiKeyManager, { maskApiKey } from './components/ApiKeyManager';

// Demo-Nachrichten für den Test
const initialMessages = [
  { role: 'assistant', content: 'Willkommen bei KiKi! Wie kann ich helfen?' },
  { role: 'user', content: 'Hallo, was kannst du?' },
  { role: 'assistant', content: 'Ich kann dich bei vielen Aufgaben unterstützen. Frag mich einfach!' }
];

const App: React.FC = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  // API-Key State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyMasked, setApiKeyMasked] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(true);

  // Lädt den gespeicherten API-Key beim Start
  useEffect(() => {
    async function fetchKey() {
      try {
        // @ts-ignore
        const key = await window.kiki_api.loadApiKey();
        setApiKey(key);
        setApiKeyMasked(maskApiKey(key));
      } catch {
        setApiKey(null);
        setApiKeyMasked(null);
      } finally {
        setLoadingKey(false);
      }
    }
    fetchKey();
  }, []);

  // Callback nach erfolgreichem Speichern eines neuen Keys
  const handleKeySaved = async () => {
    // @ts-ignore
    const key = await window.kiki_api.loadApiKey();
    setApiKey(key);
    setApiKeyMasked(maskApiKey(key));
  };

  // Sendet die User-Nachricht per IPC an die KI-API und fügt die Antwort ein
  const handleSendMessage = async (message: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);
    try {
      // @ts-ignore
      const response = await window.kiki_api.sendChatMessage({
        message,
        history: messages,
        config: { provider: 'openai', model: 'gpt-3.5-turbo' }
      });
      if (response.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.reply || '' }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '[Fehler] ' + (response.error || 'Unbekannter Fehler bei der KI-Anfrage.') }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '[Fehler] ' + (err.message || 'Kommunikationsfehler mit Backend.') }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingKey) {
    return <div className="flex items-center justify-center h-full w-full text-gray-400">Loading...</div>;
  }

  // Zeige zuerst das API-Key-UI, dann das Chat-UI
  return (
    <div className="w-full h-full">
      {!apiKey ? (
        <ApiKeyManager onKeySaved={handleKeySaved} currentKeyMasked={apiKeyMasked} />
      ) : (
        <ChatWindow messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
      )}
    </div>
  );
};

export default App;
