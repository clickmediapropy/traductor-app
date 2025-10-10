/**
 * Header component con título y botones de configuración
 */
export default function Header({ onOpenSettings, onOpenInstructions, hasApiKey, customInstructionsCount = 0 }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-3">
      <div className="mx-auto max-w-3xl flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-semibold font-display bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
          ElizabethAI
        </h1>

        <div className="flex items-center gap-2">
          {/* Botón de instrucciones personalizadas */}
          <button
            onClick={onOpenInstructions}
            className="focus-ring flex items-center gap-2 px-3 py-2 bg-white/70 backdrop-blur-md neon-border hover:shadow-neonSoft text-gray-700 rounded-xl transition-colors transition-transform duration-200 active:scale-95 relative"
            aria-label="Instrucciones Personalizadas"
          >
            <span className="text-base">📝</span>
            <span className="hidden sm:inline font-medium">Instrucciones</span>
            {customInstructionsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {customInstructionsCount}
              </span>
            )}
          </button>

          {/* Botón de API Key */}
          <button
            onClick={onOpenSettings}
            className="focus-ring flex items-center gap-2 px-3 py-2 bg-white/70 backdrop-blur-md neon-border hover:shadow-neonSoft text-gray-700 rounded-xl transition-colors transition-transform duration-200 active:scale-95"
            aria-label="Configurar API Key"
          >
            <span className="text-base">⚙️</span>
            <span className="hidden sm:inline font-medium">API Key</span>
            {hasApiKey ? (
              <span className="text-green-600 font-bold" aria-hidden>✓</span>
            ) : (
              <span className="text-yellow-600 font-bold" aria-hidden>⚠️</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
