import { useState, useEffect } from 'react';
import {
  getCustomInstructions,
  addCustomInstruction,
  removeCustomInstruction,
  clearAllCustomInstructions
} from '../services/translationPrompt';

/**
 * Modal para gestionar instrucciones personalizadas de traducción
 */
export default function CustomInstructionsModal({ onClose, onUpdate }) {
  const [instructions, setInstructions] = useState([]);
  const [newInstruction, setNewInstruction] = useState('');
  const [error, setError] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Cargar instrucciones al montar
  useEffect(() => {
    loadInstructions();
  }, []);

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showConfirmClear) {
          setShowConfirmClear(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, showConfirmClear]);

  const loadInstructions = () => {
    const loaded = getCustomInstructions();
    setInstructions(loaded);
  };

  const handleAdd = () => {
    if (!newInstruction.trim()) {
      setError('La instrucción no puede estar vacía');
      return;
    }

    try {
      addCustomInstruction(newInstruction);
      loadInstructions();
      setNewInstruction('');
      setError('');
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = (index) => {
    removeCustomInstruction(index);
    loadInstructions();
    if (onUpdate) onUpdate();
  };

  const handleClearAll = () => {
    clearAllCustomInstructions();
    loadInstructions();
    setShowConfirmClear(false);
    if (onUpdate) onUpdate();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Instrucciones Personalizadas"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Instrucciones Personalizadas
        </h2>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 text-lg">ℹ️</span>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Persistencia en memoria local</p>
              <p>
                Las instrucciones se guardan en la memoria local de este navegador
                y persistirán entre sesiones, pero solo en este dispositivo.
              </p>
              <p className="mt-2">
                <strong>Si deseas guardar tus instrucciones</strong>, cópialas a un archivo externo.
              </p>
            </div>
          </div>
        </div>

        {/* Priority Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-lg">⚠️</span>
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Prioridad máxima</p>
              <p>
                Las instrucciones personalizadas tienen <strong>prioridad absoluta</strong> sobre
                las reglas base. En caso de conflicto, tus instrucciones prevalecen.
              </p>
            </div>
          </div>
        </div>

        {/* Lista de instrucciones existentes */}
        {instructions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Instrucciones activas ({instructions.length})
            </h3>
            <div className="space-y-2">
              {instructions.map((instruction, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <span className="text-gray-500 font-medium text-sm mt-0.5">
                    {index + 1}.
                  </span>
                  <p className="flex-1 text-gray-800 text-sm">{instruction}</p>
                  <button
                    onClick={() => handleRemove(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    aria-label={`Eliminar instrucción ${index + 1}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agregar nueva instrucción */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agregar nueva instrucción
          </label>
          <textarea
            value={newInstruction}
            onChange={(e) => {
              setNewInstruction(e.target.value);
              setError('');
            }}
            placeholder="Ejemplo: Para clientes mujeres, usar más emojis de lo normal"
            className="w-full px-3 py-2 border border-gray-300 rounded-xl hover:border-gray-400 focus-ring min-h-[100px] resize-y"
            rows={3}
          />
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
          <button
            onClick={handleAdd}
            className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-xl shadow-sm transition-colors duration-200 focus-ring"
          >
            + Agregar Instrucción
          </button>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          {!showConfirmClear ? (
            <>
              {instructions.length > 0 && (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="flex-1 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-semibold py-2 px-6 rounded-xl transition-colors duration-200 focus-ring"
                >
                  Limpiar Todas
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl shadow-sm transition-colors duration-200 focus-ring"
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 text-sm text-gray-700 flex items-center">
                ¿Eliminar todas las instrucciones?
              </div>
              <button
                onClick={handleClearAll}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-xl shadow-sm transition-colors duration-200 focus-ring"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-xl transition-colors duration-200 focus-ring"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
