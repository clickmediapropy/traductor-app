import { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';

/**
 * Card individual para cada mensaje traducido
 * Incluye funcionalidad de edición inline y copia al portapapeles
 */
export default function MessageCard({ message, onUpdate, onRetranslate, isRetranslating }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranslation, setEditedTranslation] = useState(message.translation);
  const [copyStatus, setCopyStatus] = useState('idle'); // idle | copying | copied
  const [showLiteral, setShowLiteral] = useState(false);

  // Determinar color del borde según tipo
  const getBorderColor = () => {
    if (message.type === 'profesor') return 'border-blue-500';
    if (message.type === 'asistente') return 'border-indigo-500';
    if (message.type === 'cliente') {
      return message.gender === 'mujer' ? 'border-pink-500' : 'border-green-500';
    }
    return 'border-gray-500';
  };

  // Determinar color del badge según tipo
  const getBadgeColor = () => {
    if (message.type === 'profesor') return 'bg-blue-100 text-blue-800';
    if (message.type === 'asistente') return 'bg-indigo-100 text-indigo-800';
    if (message.type === 'cliente') {
      return message.gender === 'mujer' ? 'bg-pink-100 text-pink-800' : 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Generar etiqueta del badge
  const getBadgeLabel = () => {
    if (message.type === 'profesor') return 'Profesor';
    if (message.type === 'asistente') return 'Asistente';
    if (message.type === 'cliente') {
      const genderLabel = message.gender === 'mujer' ? 'Mujer' : 'Hombre';
      return `Cliente ${message.clientNumber} (${genderLabel})`;
    }
    return 'Mensaje';
  };

  const handleSave = () => {
    onUpdate(message.id, editedTranslation);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    setCopyStatus('copying');

    // Copiar ORIGINAL + TRADUCCIÓN FINAL (sin markdown, formato simple)
    const textToCopy = `${message.originalWithFormat}\n${message.translation}`;
    const success = await copyToClipboard(textToCopy);

    if (success) {
      setCopyStatus('copied'); // Permanece en 'copied' para trackear visualmente
    } else {
      setCopyStatus('idle');
      alert('Error al copiar al portapapeles');
    }
  };

  return (
    <div className={`${copyStatus === 'copied' ? 'bg-green-200 !border-green-600 !border-4 shadow-green-500/50' : `bg-white/80 ${getBorderColor()}`} backdrop-blur-sm neon-border shadow-neon rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-neon`}>
      {/* Badge de tipo */}
      <div className="mb-4">
        <span className={`inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold badge-gradient`} aria-label={`Tipo de mensaje: ${getBadgeLabel()}`}>
          {getBadgeLabel()}
        </span>
      </div>

      {/* Texto original en chino */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          🇨🇳 ORIGINAL
        </label>
        <div className="bg-pink-50 p-4 rounded-xl border border-pink-200 shadow-sm">
          <p className="font-chinese text-base sm:text-[15px] leading-7 text-gray-800 whitespace-pre-wrap">
            {message.originalWithFormat}
          </p>
        </div>
      </div>

      {/* Traducción literal */}
      <div className="mb-4">
        <button
          onClick={() => setShowLiteral(!showLiteral)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 hover:text-gray-900 transition-colors min-h-[44px] -ml-2 pl-2 pr-4"
          aria-expanded={showLiteral}
        >
          <span className="text-lg">{showLiteral ? '▼' : '▶'}</span>
          <span>📖 TRADUCCIÓN LITERAL</span>
        </button>
        {showLiteral && (
          <div className="bg-orange-50 backdrop-blur-sm p-4 rounded-xl border border-orange-200 shadow-sm animate-fade-in">
            <p className="text-base sm:text-[15px] leading-7 text-gray-800 whitespace-pre-wrap">
              {message.literalTranslation || '[Cargando...]'}
            </p>
          </div>
        )}
      </div>

      {/* Traducción final */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          🇦🇷 TRADUCCIÓN FINAL
        </label>
        {isEditing ? (
          <textarea
            value={editedTranslation}
            onChange={(e) => setEditedTranslation(e.target.value)}
            className="w-full p-4 bg-green-50 border-2 border-green-300 rounded-xl hover:border-green-400 focus-ring min-h-[120px] text-base"
            autoFocus
          />
        ) : (
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm">
            <p className="text-base sm:text-[15px] leading-7 text-gray-800 whitespace-pre-wrap">
              {message.translation}
            </p>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="sm:col-span-2 min-h-[48px] px-4 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] focus-ring shadow-md hover:shadow-lg"
            >
              💾 Guardar
            </button>
            <button
              onClick={() => {
                setEditedTranslation(message.translation);
                setIsEditing(false);
              }}
              className="min-h-[48px] px-4 py-3 bg-white border-2 border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] focus-ring shadow-sm"
            >
              ✕ Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              disabled={isRetranslating}
              className="min-h-[48px] px-4 py-3 btn-gradient text-white text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-ring shadow-md hover:shadow-lg"
              aria-label="Editar traducción"
            >
              ✏️ Editar
            </button>
            <button
              onClick={handleCopy}
              disabled={copyStatus === 'copying' || isRetranslating}
              className="min-h-[48px] px-4 py-3 bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-ring shadow-md hover:shadow-lg"
              aria-label={copyStatus === 'copied' ? 'Copiado al portapapeles' : 'Copiar al portapapeles'}
            >
              {copyStatus === 'copied' ? '✓ Copiado!' : '📋 Copiar'}
            </button>
            <button
              onClick={() => onRetranslate(message.id)}
              disabled={isRetranslating}
              className="min-h-[48px] px-4 py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-ring shadow-md hover:shadow-lg"
              aria-label={isRetranslating ? 'Retraduciendo mensaje' : 'Retraducir mensaje'}
            >
              {isRetranslating ? '⏳ Re-traduciendo...' : '🔄 Re-traducir'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
