/**
 * Área de input para pegar mensajes de Telegram
 */
export default function InputArea({ inputText, setInputText, onTranslate, onClear, isLoading, hasApiKey }) {
  const handleTranslateClick = () => {
    if (!hasApiKey || !inputText.trim() || isLoading) return;
    onTranslate();
  };

  return (
    <div className="bg-white/70 backdrop-blur-md neon-border shadow-neonSoft rounded-2xl p-6 transition-shadow duration-200">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
        Mensajes de Telegram
      </h2>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={`Pegá todos los mensajes de Telegram aquí...

Ejemplo:
教授: Análisis del mercado...
30(女): Tengo una pregunta...
32: Gracias por la info...`}
        className="w-full min-h-[300px] p-4 border border-gray-300 rounded-xl hover:border-gray-400 focus-ring font-mono text-sm resize-y placeholder:text-gray-400"
        disabled={isLoading}
      />

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleTranslateClick}
          disabled={!hasApiKey || !inputText.trim() || isLoading}
          className="flex items-center gap-2 btn-gradient text-white font-semibold py-2 px-6 rounded-xl shadow-sm transition-colors transition-transform duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        >
          <span>{isLoading ? '⏳' : '🚀'}</span>
          <span>{isLoading ? 'Traduciendo...' : 'Traducir Todo'}</span>
        </button>

        <button
          onClick={onClear}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-6 rounded-xl transition-colors transition-transform duration-200 active:scale-95 focus-ring"
        >
          <span>🗑️</span>
          <span>Limpiar</span>
        </button>
      </div>

      {!hasApiKey && (
        <p className="text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4">
          ⚠️ Configurá tu API key de Anthropic para comenzar a traducir
        </p>
      )}
    </div>
  );
}
