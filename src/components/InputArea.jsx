/**
 * Área de input para pegar mensajes de Telegram (uncontrolled para soportar paste en móvil)
 */
import { useRef, useState } from 'react';

export default function InputArea({ onTranslate, onClear, isLoading, hasApiKey }) {
  const textareaRef = useRef(null);
  const [hasContent, setHasContent] = useState(false);
  const [pasteWarning, setPasteWarning] = useState(false);

  const handleTranslateClick = () => {
    if (!hasApiKey || isLoading) return;
    const value = textareaRef.current ? textareaRef.current.value : '';
    const trimmed = value.trim();
    if (!trimmed) return;
    onTranslate(trimmed);
  };

  const handleInput = () => {
    if (!textareaRef.current) return;
    setHasContent(Boolean(textareaRef.current.value && textareaRef.current.value.length > 0));
  };

  const handlePaste = async (e) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    let pastedText = '';

    // iOS: always intercept and insert manually to avoid native truncation
    if (isIOS) {
      e.preventDefault();

      // Prefer event clipboard data
      if (e.clipboardData && e.clipboardData.getData) {
        pastedText = e.clipboardData.getData('text/plain');
      }

      // Fallback to async API if needed
      if (!pastedText && navigator.clipboard && navigator.clipboard.readText) {
        try {
          pastedText = await navigator.clipboard.readText();
        } catch (err) {
          // keep pastedText empty if blocked
        }
      }

      if (!pastedText) {
        // Could not access clipboard contents; show warning and exit
        setPasteWarning(true);
        return;
      }

      const ta = textareaRef.current;
      if (!ta) return;

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const currentValue = ta.value;
      const newValue = currentValue.substring(0, start) + pastedText + currentValue.substring(end);
      ta.value = newValue;

      const newCursorPos = start + pastedText.length;
      ta.selectionStart = newCursorPos;
      ta.selectionEnd = newCursorPos;

      setPasteWarning(false);
      handleInput();
      return;
    }

    // Non‑iOS: try to read text; if available, prevent default and insert
    if (e.clipboardData && e.clipboardData.getData) {
      pastedText = e.clipboardData.getData('text/plain');
    }
    if (!pastedText && navigator.clipboard && navigator.clipboard.readText) {
      try {
        pastedText = await navigator.clipboard.readText();
      } catch (err) {
        // ignore; allow native paste
      }
    }

    if (!pastedText) {
      // Allow native paste path
      return;
    }

    e.preventDefault();
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const currentValue = ta.value;
    const newValue = currentValue.substring(0, start) + pastedText + currentValue.substring(end);
    ta.value = newValue;
    const newCursorPos = start + pastedText.length;
    ta.selectionStart = newCursorPos;
    ta.selectionEnd = newCursorPos;
    setPasteWarning(false);
    handleInput();
  };

  const handlePasteButton = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (textareaRef.current) {
        textareaRef.current.value = text;
        setPasteWarning(false);
        handleInput();
      }
    } catch (err) {
      alert('No se pudo pegar. Probá el gesto de pegar manual.');
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-md neon-border shadow-neonSoft rounded-2xl p-6 transition-shadow duration-200">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
        Mensajes de Telegram
      </h2>

      <textarea
        ref={textareaRef}
        onInput={handleInput}
        onPaste={handlePaste}
        placeholder={`Pegá todos los mensajes de Telegram aquí...

Ejemplo:
教授: Análisis del mercado...
30(女): Tengo una pregunta...
32: Gracias por la info...`}
        className="w-full min-h-[220px] sm:min-h-[300px] p-3 sm:p-4 border border-gray-300 rounded-xl hover:border-gray-400 focus-ring font-mono text-sm resize-y placeholder:text-gray-400"
        disabled={isLoading}
      />

      <div className="flex flex-col sm:flex-row gap-3 mt-3 sm:mt-4">
        <button
          onClick={handlePasteButton}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-6 rounded-xl transition-colors transition-transform duration-200 active:scale-95 focus-ring"
        >
          <span>📋</span>
          <span>Pegar</span>
        </button>

        <button
          onClick={handleTranslateClick}
          disabled={!hasApiKey || !hasContent || isLoading}
          className="flex items-center gap-2 btn-gradient text-white font-semibold py-2 px-6 rounded-xl shadow-sm transition-colors transition-transform duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        >
          <span>{isLoading ? '⏳' : '🚀'}</span>
          <span>{isLoading ? 'Traduciendo...' : 'Traducir Todo'}</span>
        </button>

        <button
          onClick={() => {
            if (textareaRef.current) {
              textareaRef.current.value = '';
            }
            setHasContent(false);
            onClear();
          }}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-6 rounded-xl transition-colors transition-transform duration-200 active:scale-95 focus-ring"
        >
          <span>🗑️</span>
          <span>Limpiar</span>
        </button>
      </div>

      {pasteWarning && (
        <div className="text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-2">
          ⚠️ Parece que no se pegó todo el contenido. Intentá de nuevo o usá el botón "Pegar".
        </div>
      )}

      {!hasApiKey && (
        <p className="text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4">
          ⚠️ Configurá tu API key de Anthropic para comenzar a traducir
        </p>
      )}
    </div>
  );
}
