// renderer/components/ChatWindow.tsx

import React, { useState, useEffect, useRef } from 'react';

/**
 * Defines the structure of a single chat message.
 * 'role' determines the sender and visual representation of the message.
 */
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * Defines the props accepted by the ChatWindow component.
 */
interface ChatWindowProps {
  // An array of message objects to be displayed in the chat.
  messages: Message[];
  // A callback function that is invoked when the user sends a new message.
  onSendMessage: (message: string) => void;
  // Optional flag to show a loading indicator.
  isLoading?: boolean;
}

/**
 * A reusable UI component for a chat window.
 * It displays a conversation and provides an input for the user to send messages.
 * This component is stateless regarding the message history, which is managed by its parent.
 *
 * @param {ChatWindowProps} props The properties for the component.
 * @returns {React.ReactElement} The rendered ChatWindow component.
 */
const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading = false }) => {
  // State to manage the content of the text input field.
  const [inputValue, setInputValue] = useState('');

  // A ref to the element at the end of the message list.
  // Used to automatically scroll to the latest message.
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scrolls the message container to the bottom smoothly.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // This effect triggers a scroll to the bottom whenever the `messages` array changes.
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handles the logic for sending a message.
   * It calls the onSendMessage prop and clears the input field.
   */
  const handleSendMessage = () => {
    const trimmedInput = inputValue.trim();
    if (trimmedInput) {
      onSendMessage(trimmedInput);
      setInputValue(''); // Clear input after sending
    }
  };

  /**
   * Handles the 'keydown' event on the input field.
   * If the 'Enter' key is pressed, it triggers the send message logic.
   * @param {React.KeyboardEvent<HTMLInputElement>} event The keyboard event.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevents adding a new line in the input
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white font-sans">
      {/* Message List Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-2xl px-4 py-2 rounded-xl shadow-md ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              {/* Using `whitespace-pre-wrap` to respect newlines in message content */}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start items-center gap-3">
             <div className="bg-gray-700 text-gray-200 px-4 py-2 rounded-xl shadow-md">
                <span className="animate-pulse">...</span>
              </div>
          </div>
        )}
        {/* This invisible div is the target for our auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="flex-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 text-white font-semibold px-5 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            disabled={!inputValue.trim() || isLoading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
