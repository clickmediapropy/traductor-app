/**
 * Área de input para pegar mensajes de Telegram
 * Usa contenteditable con workarounds específicos para iOS Safari
 */
import { useRef, useState } from 'react';

export default function InputArea({ onTranslate, onClear, isLoading, hasApiKey }) {
  const editableRef = useRef(null);
  const [hasContent, setHasContent] = useState(false);
  const [pasteWarning, setPasteWarning] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleTranslateClick = () => {
    if (!hasApiKey || isLoading) return;
    const value = editableRef.current ? editableRef.current.innerText : '';
    const trimmed = value.trim();
    if (!trimmed) return;
    onTranslate(trimmed);
  };

  const handleInput = () => {
    if (!editableRef.current) return;
    const text = editableRef.current.innerText;
    const hasText = Boolean(text && text.trim().length > 0);
    setHasContent(hasText);
    setShowPlaceholder(!hasText);

    // Debug logging for iOS
    if (isIOS) {
      console.log('[iOS Input] Length:', text.length, 'Lines:', text.split('\n').length);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    // Get clipboard data
    let pastedText = '';
    if (e.clipboardData && e.clipboardData.getData) {
      pastedText = e.clipboardData.getData('text/plain');
    }

    // Debug logging for iOS
    if (isIOS) {
      console.log('🔍 [iOS PASTE DEBUG]');
      console.log('User Agent:', navigator.userAgent);
      console.log('Clipboard types:', e.clipboardData?.types);
      console.log('Pasted text length:', pastedText.length);
      console.log('Pasted text lines:', pastedText.split('\n').length);
      console.log('Has newlines:', pastedText.includes('\n'));
      console.log('First 200 chars:', pastedText.substring(0, 200));
    }

    if (!pastedText) {
      console.warn('[Paste] No text data in clipboard');
      return;
    }

    // Insert text at cursor position
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      // No selection, append to end
      if (editableRef.current) {
        const currentText = editableRef.current.innerText;
        editableRef.current.innerText = currentText + (currentText ? '\n' : '') + pastedText;
      }
    } else {
      // Insert at cursor using execCommand (works better on iOS)
      try {
        document.execCommand('insertText', false, pastedText);
      } catch {
        // Fallback: manual insertion
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(pastedText);
        range.insertNode(textNode);

        // Move cursor to end of inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    setPasteWarning(false);
    handleInput();

    // Check for potential truncation on iOS
    if (isIOS) {
      setTimeout(() => {
        const finalText = editableRef.current?.innerText || '';
        const expectedMinLength = pastedText.length * 0.8; // Allow 20% variance

        if (finalText.length < expectedMinLength) {
          console.warn('[iOS Paste] Possible truncation detected!');
          console.log('Expected length:', pastedText.length);
          console.log('Actual length:', finalText.length);
          setPasteWarning(true);
        }
      }, 300);
    }
  };

  const handlePasteButton = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (editableRef.current) {
        editableRef.current.innerText = text;
        setPasteWarning(false);
        handleInput();
      }
    } catch (err) {
      console.error('[Paste Button] Error:', err);
      alert('No se pudo pegar. En iOS, probá el gesto de pegar manual (mantener presionado y seleccionar Pegar).');
    }
  };

  const handlePasteMore = () => {
    // Focus the editable div and show instruction
    if (editableRef.current) {
      editableRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    alert('Pegá el resto del contenido ahora. Se agregará al final del texto actual.');
  };

  const handleClearClick = () => {
    if (editableRef.current) {
      editableRef.current.innerText = '';
    }
    setHasContent(false);
    setShowPlaceholder(true);
    setPasteWarning(false);
    onClear();
  };

  // Handle focus/blur for placeholder
  const handleFocus = () => {
    if (!hasContent) {
      setShowPlaceholder(false);
    }
  };

  const handleBlur = () => {
    if (!hasContent) {
      setShowPlaceholder(true);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-md neon-border shadow-neonSoft rounded-2xl p-6 transition-shadow duration-200">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
        Mensajes de Telegram
      </h2>

      {/* ContentEditable div with iOS-specific CSS */}
      <div className="relative">
        {showPlaceholder && (
          <div className="absolute inset-0 p-3 sm:p-4 pointer-events-none font-mono text-sm text-gray-400 whitespace-pre-wrap">
{`Pegá todos los mensajes de Telegram aquí...

Ejemplo:
教授: Análisis del mercado...
30(女): Tengo una pregunta...
32: Gracias por la info...`}
          </div>
        )}
        <div
          ref={editableRef}
          contentEditable={!isLoading}
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full min-h-[220px] sm:min-h-[300px] p-3 sm:p-4 border border-gray-300 rounded-xl hover:border-gray-400 focus-ring font-mono text-sm resize-y overflow-y-auto whitespace-pre-wrap break-words"
          style={{
            WebkitUserSelect: 'text',
            userSelect: 'text',
            WebkitUserModify: 'read-write-plaintext-only',
            overflowWrap: 'break-word',
          }}
          aria-label="Área de texto para pegar mensajes de Telegram"
          role="textbox"
          aria-multiline="true"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-3 sm:mt-4">
        <button
          onClick={handlePasteButton}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-6 rounded-xl transition-colors transition-transform duration-200 active:scale-95 focus-ring"
        >
          <span>📋</span>
          <span>Pegar</span>
        </button>

        {pasteWarning && (
          <button
            onClick={handlePasteMore}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-orange-50 border border-orange-300 hover:bg-orange-100 text-orange-700 font-semibold py-2 px-6 rounded-xl transition-colors transition-transform duration-200 active:scale-95 focus-ring"
          >
            <span>➕</span>
            <span>Pegar más</span>
          </button>
        )}

        <button
          onClick={handleTranslateClick}
          disabled={!hasApiKey || !hasContent || isLoading}
          className="flex items-center gap-2 btn-gradient text-white font-semibold py-2 px-6 rounded-xl shadow-sm transition-colors transition-transform duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        >
          <span>{isLoading ? '⏳' : '🚀'}</span>
          <span>{isLoading ? 'Traduciendo...' : 'Traducir Todo'}</span>
        </button>

        <button
          onClick={handleClearClick}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-6 rounded-xl transition-colors transition-transform duration-200 active:scale-95 focus-ring"
        >
          <span>🗑️</span>
          <span>Limpiar</span>
        </button>
      </div>

      {pasteWarning && (
        <div className="text-orange-700 bg-orange-50 border border-orange-200 rounded-xl p-3 mt-2">
          ⚠️ Parece que no se pegó todo el contenido. Usá el botón "Pegar más" para agregar el resto, o pegá de nuevo manteniendo presionado y seleccionando Pegar.
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
