/**
 * Component for entering bot code to retrieve messages
 */
import { useState } from 'react';

export default function CodeInput({ onMessagesRetrieved, isLoading: externalLoading }) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCodeChange = (e) => {
    // Only allow alphanumeric, max 6 chars, uppercase
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(value);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (code.length !== 6) {
      setError('El código debe tener 6 caracteres');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bot/get-messages?code=${code}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Error al obtener mensajes');
        setIsLoading(false);
        return;
      }

      // Format messages for the translation system
      const formattedText = data.messages
        .map(msg => {
          // Try to preserve Telegram format
          // If forward_from has username/name, use it
          return msg.text;
        })
        .join('\n\n');

      // Call parent with the retrieved text
      onMessagesRetrieved(formattedText);

      // Reset
      setCode('');
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Error de conexión. Intentá de nuevo.');
      setIsLoading(false);
    }
  };

  const disabled = isLoading || externalLoading;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📱 Cómo usar el bot:</h3>
        <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
          <li>Abrí el bot: <a href="https://t.me/elizabethai_translator_bot" target="_blank" rel="noopener noreferrer" className="underline font-semibold">@elizabethai_translator_bot</a></li>
          <li>Enviá <code className="bg-blue-100 px-1 rounded">/new</code> para crear una sesión</li>
          <li>Reenvía (forward) los mensajes que querés traducir</li>
          <li>Enviá <code className="bg-blue-100 px-1 rounded">/done</code> cuando termines</li>
          <li>Ingresá el código de 6 dígitos aquí abajo</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="bot-code" className="block text-sm font-medium text-gray-700 mb-2">
            Código del Bot (6 caracteres)
          </label>
          <input
            id="bot-code"
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="ABC123"
            disabled={disabled}
            className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl hover:border-gray-400 focus-ring font-mono text-lg sm:text-xl text-center tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={disabled || code.length !== 6}
          className="w-full flex items-center justify-center gap-2 btn-gradient text-white font-semibold py-3 px-6 rounded-xl shadow-sm transition-colors transition-transform duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        >
          {isLoading ? (
            <>
              <span>⏳</span>
              <span>Obteniendo mensajes...</span>
            </>
          ) : (
            <>
              <span>📥</span>
              <span>Obtener Mensajes</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
