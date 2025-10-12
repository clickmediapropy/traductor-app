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

    // Copiar ORIGINAL + TRADUCCIÓN FINAL (sin literal)
    const textToCopy = `${message.originalWithFormat}\n${'─'.repeat(5)}\n${message.translation}`;
    const success = await copyToClipboard(textToCopy);

    if (success) {
      setCopyStatus('copied'); // Permanece en 'copied' para trackear visualmente
    } else {
      setCopyStatus('idle');
      alert('Error al copiar al portapapeles');
    }
  };

  return (
    <div className={`${copyStatus === 'copied' ? 'bg-green-200 !border-green-600 !border-4 shadow-green-500/50' : `bg-white/80 ${getBorderColor()}`} backdrop-blur-sm neon-border shadow-neon rounded-2xl p-3 transition-all duration-300 hover:shadow-neon`}>
      {/* Badge de tipo */}
      <div className="mb-3">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold badge-gradient`} aria-label={`Tipo de mensaje: ${getBadgeLabel()}`}>
          {getBadgeLabel()}
        </span>
      </div>

      {/* Texto original en chino */}
      <div className="mb-2">
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          🇨🇳 ORIGINAL
        </label>
        <div className="bg-pink-50 p-3 rounded-xl border border-pink-200">
          <p className="font-chinese text-[15px] leading-7 text-gray-800 whitespace-pre-wrap">
            {message.originalWithFormat}
          </p>
        </div>
      </div>

      {/* Traducción literal */}
      <div className="mb-2">
        <button
          onClick={() => setShowLiteral(!showLiteral)}
          className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 hover:text-gray-900 transition-colors"
        >
          <span>{showLiteral ? '▼' : '▶'}</span>
          📖 TRADUCCIÓN LITERAL
        </button>
        {showLiteral && (
          <div className="bg-orange-50 backdrop-blur-sm p-3 rounded-xl border border-orange-200">
            <p className="text-[15px] leading-7 text-gray-800 whitespace-pre-wrap">
              {message.literalTranslation || '[Cargando...]'}
            </p>
          </div>
        )}
      </div>

      {/* Traducción final */}
      <div className="mb-2">
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          🇦🇷 TRADUCCIÓN FINAL
        </label>
        {isEditing ? (
          <textarea
            value={editedTranslation}
            onChange={(e) => setEditedTranslation(e.target.value)}
            className="w-full p-3 bg-green-50 border border-green-300 rounded-xl hover:border-green-400 focus-ring min-h-[100px]"
          />
        ) : (
          <div className="bg-green-50 p-3 rounded-xl border border-green-200">
            <p className="text-[15px] leading-7 text-gray-800 whitespace-pre-wrap">
              {message.translation}
            </p>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors transition-transform duration-200 active:scale-95 focus-ring"
            >
              💾 Guardar
            </button>
            <button
              onClick={() => {
                setEditedTranslation(message.translation);
                setIsEditing(false);
              }}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors transition-transform duration-200 active:scale-95 focus-ring"
            >
              ✕ Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              disabled={isRetranslating}
              className="flex-1 px-3 py-2 btn-gradient text-white text-sm font-medium rounded-xl transition-colors transition-transform duration-200 active:scale-95 disabled:opacity-50 focus-ring"
            >
              ✏️ Editar
            </button>
            <button
              onClick={handleCopy}
              disabled={copyStatus === 'copying' || isRetranslating}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors transition-transform duration-200 active:scale-95 disabled:opacity-50 focus-ring"
            >
              {copyStatus === 'copied' ? '✓ Copiado!' : '📋 Copiar'}
            </button>
            <button
              onClick={() => onRetranslate(message.id)}
              disabled={isRetranslating}
              className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors transition-transform duration-200 active:scale-95 disabled:opacity-50 focus-ring"
            >
              {isRetranslating ? '⏳ Re-traduciendo...' : '🔄 Re-traducir'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
