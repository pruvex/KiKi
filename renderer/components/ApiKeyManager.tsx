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
      // @ts-ignore: window.kiki_api is injected by preload
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
