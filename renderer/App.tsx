import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow';

// Demo-Nachrichten für den Test
const initialMessages = [
  { role: 'assistant', content: 'Willkommen bei KiKi! Wie kann ich helfen?' },
  { role: 'user', content: 'Hallo, was kannst du?' },
  { role: 'assistant', content: 'Ich kann dich bei vielen Aufgaben unterstützen. Frag mich einfach!' }
];

const App: React.FC = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  // Simuliert das Senden einer User-Nachricht und eine KI-Antwort
  const handleSendMessage = (message: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Dies ist eine simulierte Antwort auf: ' + message }
      ]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full h-full">
      <ChatWindow messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;
