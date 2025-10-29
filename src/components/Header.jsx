/**
 * Header component con título y botones de configuración
 */
export default function Header({ onOpenSettings, onOpenInstructions, hasApiKey, customInstructionsCount = 0 }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4">
      <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <img src="/logo.png" alt="ElizabethAI Logo" className="w-11 h-11 sm:w-12 sm:h-12" />
          <h1 className="text-base sm:text-xl font-bold font-display bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
            ElizabethAI
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón de instrucciones personalizadas */}
          <button
            onClick={onOpenInstructions}
            className="focus-ring flex items-center gap-2 min-h-[44px] px-3 sm:px-4 py-2.5 bg-white/80 backdrop-blur-md neon-border hover:shadow-neonSoft text-gray-700 rounded-xl transition-all duration-200 active:scale-95 relative shadow-sm hover:shadow-md"
            aria-label="Instrucciones Personalizadas"
          >
            <span className="text-lg sm:text-xl">📝</span>
            <span className="hidden sm:inline font-semibold text-sm">Instrucciones</span>
            {customInstructionsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1 shadow-md">
                {customInstructionsCount}
              </span>
            )}
          </button>

          {/* Botón de API Key */}
          <button
            onClick={onOpenSettings}
            className="focus-ring flex items-center gap-2 min-h-[44px] px-3 sm:px-4 py-2.5 bg-white/80 backdrop-blur-md neon-border hover:shadow-neonSoft text-gray-700 rounded-xl transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
            aria-label="Configurar API Key"
          >
            <span className="text-lg sm:text-xl">⚙️</span>
            <span className="hidden sm:inline font-semibold text-sm">API Key</span>
            {hasApiKey ? (
              <span className="text-green-600 font-bold text-lg" aria-label="API Key configurada">✓</span>
            ) : (
              <span className="text-yellow-600 font-bold text-lg" aria-label="API Key no configurada">⚠️</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
