import { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';

/**
 * Componente que muestra todos los mensajes traducidos en un solo bloque de texto
 * Formato: original + separador + traducción + separador entre mensajes (🔹 🔹 🔹)
 */
export default function ConsolidatedOutput({ messages }) {
  const [copyStatus, setCopyStatus] = useState('idle'); // idle | copying | copied

  /**
   * Genera el texto consolidado de todos los mensajes
   * Mantiene el prefijo original (教授:, 30(女):, etc.) y formato completo
   * Agrega triple backticks markdown solo en la traducción
   */
  const generateConsolidatedText = () => {
    return messages.map((msg, index) => {
      const messageSeparator = '🔹 🔹 🔹';

      // Construir el bloque de mensaje: original (sin markdown) + traducción (con triple backticks)
      let block = `${msg.originalWithFormat}\n\`\`\`\n${msg.translation}\n\`\`\``;

      // Agregar separador entre mensajes (excepto después del último)
      if (index < messages.length - 1) {
        block += `\n\n${messageSeparator}\n\n`;
      }

      return block;
    }).join('');
  };

  const consolidatedText = generateConsolidatedText();

  const handleCopy = async () => {
    setCopyStatus('copying');
    const success = await copyToClipboard(consolidatedText);

    if (success) {
      setCopyStatus('copied');
      // Reset después de 2 segundos
      setTimeout(() => setCopyStatus('idle'), 2000);
    } else {
      setCopyStatus('idle');
      alert('Error al copiar al portapapeles');
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm neon-border shadow-neon rounded-2xl p-4 sm:p-5 transition-all duration-300">
      {/* Header con botón de copiar */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b-2 border-gray-200">
        <h3 className="text-base sm:text-lg font-bold text-gray-800">
          📄 Todos los mensajes ({messages.length})
        </h3>
        <button
          onClick={handleCopy}
          disabled={copyStatus === 'copying'}
          className={`min-h-[44px] px-4 sm:px-5 py-2.5 text-white text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] focus-ring shadow-md hover:shadow-lg whitespace-nowrap ${
            copyStatus === 'copied'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-700 hover:bg-gray-800'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={copyStatus === 'copied' ? 'Todos los mensajes copiados' : 'Copiar todos los mensajes'}
        >
          {copyStatus === 'copied' ? '✓ Copiado!' : '📋 Copiar'}
        </button>
      </div>

      {/* Texto consolidado */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-xl border-2 border-purple-200 p-4 sm:p-5 overflow-x-auto shadow-sm">
        <pre className="font-sans text-sm sm:text-[15px] leading-7 text-gray-800 whitespace-pre-wrap break-words">
          {consolidatedText}
        </pre>
      </div>

      {/* Info footer */}
      <div className="mt-4 text-xs sm:text-sm text-gray-600 text-center font-medium">
        💡 Formato optimizado para copiar toda la conversación
      </div>
    </div>
  );
}
