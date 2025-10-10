/**
 * Overlay de loading que se muestra durante la traducción
 */
export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-40" aria-live="polite" role="status">
      <div className="bg-white/70 neon-border shadow-neonSoft rounded-2xl p-8 flex flex-col items-center">
        {/* Spinner animado */}
        <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-violet-500/20 border-t-cyan-400 rounded-full animate-spin mb-4"></div>

        {/* Texto */}
        <p className="text-lg sm:text-xl font-semibold text-gray-800">
          Traduciendo mensajes...
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Por favor esperá un momento
        </p>
      </div>
    </div>
  );
}
