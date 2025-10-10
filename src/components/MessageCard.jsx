import { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';

/**
 * Card individual para cada mensaje traducido
 * Incluye funcionalidad de edición inline y copia al portapapeles
 */
export default function MessageCard({ message, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranslation, setEditedTranslation] = useState(message.translation);
  const [copyStatus, setCopyStatus] = useState('idle'); // idle | copying | copied

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

    // Copiar ORIGINAL + TRADUCCIÓN
    const textToCopy = `${message.original}\n\n${message.translation}`;
    const success = await copyToClipboard(textToCopy);

    if (success) {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } else {
      setCopyStatus('idle');
      alert('Error al copiar al portapapeles');
    }
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm neon-border shadow-neon rounded-2xl p-4 transition-shadow duration-200 hover:shadow-neon ${getBorderColor()}`}>
      {/* Badge de tipo */}
      <div className="mb-3">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold badge-gradient`} aria-label={`Tipo de mensaje: ${getBadgeLabel()}`}>
          {getBadgeLabel()}
        </span>
      </div>

      {/* Texto original en chino */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          🇨🇳 ORIGINAL
        </label>
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
          <p className="font-chinese text-[15px] leading-7 text-gray-800 whitespace-pre-wrap">
            {message.original}
          </p>
        </div>
      </div>

      {/* Traducción */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          🇦🇷 TRADUCCIÓN
        </label>
        {isEditing ? (
          <textarea
            value={editedTranslation}
            onChange={(e) => setEditedTranslation(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl hover:border-gray-400 focus-ring min-h-[100px]"
          />
        ) : (
          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <p className="text-[15px] leading-7 text-gray-800 whitespace-pre-wrap">
              {message.translation}
            </p>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
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
              className="flex-1 px-3 py-2 btn-gradient text-white text-sm font-medium rounded-xl transition-colors transition-transform duration-200 active:scale-95 focus-ring"
            >
              ✏️ Editar
            </button>
            <button
              onClick={handleCopy}
              disabled={copyStatus === 'copying'}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors transition-transform duration-200 active:scale-95 disabled:opacity-50 focus-ring"
            >
              {copyStatus === 'copied' ? '✓ Copiado!' : '📋 Copiar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
