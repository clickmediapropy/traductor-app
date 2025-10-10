import { useState, useEffect } from 'react';

/**
 * Modal para configurar la API key de Anthropic
 */
export default function ApiKeyModal({ onSave, onClose, currentKey }) {
  const [apiKey, setApiKey] = useState(currentKey || '');
  const [error, setError] = useState('');

  useEffect(() => {
    // Cerrar modal con tecla ESC
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('La API key no puede estar vacía');
      return;
    }

    if (!apiKey.startsWith('sk-ant-')) {
      setError('La API key debe comenzar con "sk-ant-"');
      return;
    }

    onSave(apiKey.trim());
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Configurar API Key"
    >
      <div className="bg-white/70 neon-border shadow-neonSoft rounded-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Configurar API Key
        </h2>

        <p className="text-gray-600 mb-4">
          Ingresá tu API key de Anthropic para usar el traductor.
          Podés obtenerla en{' '}
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            console.anthropic.com
          </a>
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError('');
            }}
            placeholder="sk-ant-..."
            className="w-full px-3 py-2 border border-gray-300 rounded-xl hover:border-gray-400 focus-ring"
          />
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 btn-gradient text-white font-semibold py-2 px-6 rounded-xl shadow-sm transition-colors transition-transform duration-200 active:scale-95 focus-ring"
          >
            Guardar
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-6 rounded-xl transition-colors transition-transform duration-200 active:scale-95 focus-ring"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
