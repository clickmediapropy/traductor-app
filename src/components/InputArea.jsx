/**
 * Área de input para pegar mensajes de Telegram
 * Soporta: paste directo O código del bot
 */
import { useRef, useState } from 'react';
import CodeInput from './CodeInput';

export default function InputArea({ onTranslate, onClear, isLoading, hasApiKey }) {
  const editableRef = useRef(null);
  const [hasContent, setHasContent] = useState(false);
  const [pasteWarning, setPasteWarning] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' or 'bot'

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Helper to add debug log
  const addDebugLog = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, data };
    setDebugLogs(prev => [...prev, logEntry]);
    console.log(message, data || '');
  };

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

  // Helper function to extract clean text from HTML
  const extractTextFromHTML = (html) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      // Get text content, preserving line breaks
      return doc.body.textContent || doc.body.innerText || '';
    } catch (err) {
      console.error('[HTML Parse] Error:', err);
      return '';
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    // Clear previous logs for new paste
    setDebugLogs([]);

    // Log ALL available clipboard types (critical for debugging Telegram)
    const types = e.clipboardData ? Array.from(e.clipboardData.types) : [];
    addDebugLog('📋 Clipboard Types', types);

    let pastedText = '';
    let sourceType = '';
    let htmlContent = '';
    let plainContent = '';

    // PRIORITY 1: Try text/html FIRST (Telegram often puts full content here)
    if (e.clipboardData && types.includes('text/html')) {
      htmlContent = e.clipboardData.getData('text/html');
      if (htmlContent) {
        pastedText = extractTextFromHTML(htmlContent);
        sourceType = 'text/html';
        addDebugLog('✅ Used text/html', {
          htmlLength: htmlContent.length,
          extractedTextLength: pastedText.length,
          lines: pastedText.split('\n').length
        });
      }
    }

    // PRIORITY 2: Fallback to text/plain
    if (!pastedText && e.clipboardData && types.includes('text/plain')) {
      plainContent = e.clipboardData.getData('text/plain');
      pastedText = plainContent;
      sourceType = 'text/plain';
      addDebugLog('⚠️ Fell back to text/plain', {
        length: pastedText.length,
        lines: pastedText.split('\n').length
      });
    }

    // Get both for comparison
    if (!plainContent && e.clipboardData && types.includes('text/plain')) {
      plainContent = e.clipboardData.getData('text/plain');
    }
    if (!htmlContent && e.clipboardData && types.includes('text/html')) {
      htmlContent = e.clipboardData.getData('text/html');
    }

    // Debug logging for iOS with comparison
    if (isIOS) {
      addDebugLog('🔍 iOS PASTE DEBUG', {
        userAgent: navigator.userAgent.substring(0, 100),
        sourceType,
        finalTextLength: pastedText.length,
        finalTextLines: pastedText.split('\n').length,
        hasNewlines: pastedText.includes('\n'),
        first200chars: pastedText.substring(0, 200)
      });

      // Compare text/plain vs text/html if both exist
      if (types.includes('text/plain') && types.includes('text/html')) {
        addDebugLog('📊 Comparison Plain vs HTML', {
          plainTextLength: plainContent.length,
          plainTextLines: plainContent.split('\n').length,
          htmlLength: htmlContent.length,
          extractedFromHtmlLength: extractTextFromHTML(htmlContent).length,
          extractedFromHtmlLines: extractTextFromHTML(htmlContent).split('\n').length,
          difference: htmlContent.length - plainContent.length
        });
      }
    }

    if (!pastedText) {
      addDebugLog('❌ No text data in clipboard');
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

  // Handle messages retrieved from bot
  const handleBotMessages = (text) => {
    console.log('[InputArea] handleBotMessages called with text length:', text.length);

    // Switch to paste tab first
    setActiveTab('paste');
    console.log('[InputArea] Switched to paste tab');

    // Use requestAnimationFrame + setTimeout to ensure React completes the render cycle
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (editableRef.current) {
          editableRef.current.innerText = text;
          setHasContent(true);
          setShowPlaceholder(false);
          // Trigger input event to update state
          handleInput();
          console.log('[InputArea] Text inserted into editable div');
        } else {
          console.error('[InputArea] editableRef.current is null after tab switch!');
        }
      }, 50);
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-md neon-border shadow-neonSoft rounded-2xl p-4 sm:p-6 transition-shadow duration-200">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
        Mensajes de Telegram
      </h2>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-4 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('paste')}
          className={`min-h-[44px] px-4 sm:px-5 py-2.5 font-semibold text-sm sm:text-base transition-all ${
            activeTab === 'paste'
              ? 'text-purple-600 border-b-2 border-purple-600 -mb-[2px]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-selected={activeTab === 'paste'}
          role="tab"
        >
          <span className="inline-flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="hidden xs:inline">Pegar Texto</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('bot')}
          className={`min-h-[44px] px-4 sm:px-5 py-2.5 font-semibold text-sm sm:text-base transition-all relative ${
            activeTab === 'bot'
              ? 'text-purple-600 border-b-2 border-purple-600 -mb-[2px]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-selected={activeTab === 'bot'}
          role="tab"
        >
          <span className="inline-flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="hidden xs:inline">Código Bot</span>
          </span>
          {isIOS && (
            <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
              iOS
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'paste' ? (
        <>
          {/* ContentEditable div with iOS-specific CSS */}
          <div className="relative">
        {showPlaceholder && (
          <div className="absolute inset-0 p-4 pointer-events-none font-mono text-sm sm:text-base text-gray-400 whitespace-pre-wrap">
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
          className="w-full min-h-[240px] sm:min-h-[320px] p-4 border-2 border-gray-300 rounded-xl hover:border-gray-400 focus:border-purple-500 focus-ring font-mono text-sm sm:text-base resize-y overflow-y-auto whitespace-pre-wrap break-words shadow-sm"
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
        <button
          onClick={handlePasteButton}
          disabled={isLoading}
          className="min-h-[48px] flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-sm sm:text-base px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] focus-ring shadow-sm"
        >
          <span className="text-lg">📋</span>
          <span>Pegar</span>
        </button>

        <button
          onClick={handleTranslateClick}
          disabled={!hasApiKey || !hasContent || isLoading}
          className="min-h-[48px] col-span-2 flex items-center justify-center gap-2 btn-gradient text-white font-bold text-sm sm:text-base px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        >
          <span className="text-lg">{isLoading ? '⏳' : '🚀'}</span>
          <span>{isLoading ? 'Traduciendo...' : 'Traducir'}</span>
        </button>

        <button
          onClick={handleClearClick}
          disabled={isLoading}
          className="min-h-[48px] flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-sm sm:text-base px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] focus-ring shadow-sm"
        >
          <span className="text-lg">🗑️</span>
          <span>Limpiar</span>
        </button>

        {pasteWarning && (
          <button
            onClick={handlePasteMore}
            disabled={isLoading}
            className="min-h-[48px] col-span-2 sm:col-span-4 flex items-center justify-center gap-2 bg-orange-50 border-2 border-orange-300 hover:bg-orange-100 active:bg-orange-200 text-orange-700 font-semibold text-sm sm:text-base px-6 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] focus-ring shadow-sm"
          >
            <span className="text-lg">➕</span>
            <span>Pegar Más</span>
          </button>
        )}

        {/* Debug button - shows paste logs */}
        {isIOS && debugLogs.length > 0 && (
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="min-h-[48px] col-span-2 sm:col-span-4 flex items-center justify-center gap-2 bg-purple-50 border-2 border-purple-300 hover:bg-purple-100 active:bg-purple-200 text-purple-700 font-semibold text-sm sm:text-base px-6 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] focus-ring shadow-sm"
          >
            <span className="text-lg">🐛</span>
            <span>Debug</span>
          </button>
        )}
      </div>

      {pasteWarning && (
        <div className="text-orange-800 bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mt-4 shadow-sm text-sm sm:text-base font-medium">
          <span className="text-lg mr-2">⚠️</span>
          Parece que no se pegó todo el contenido. Usá el botón "Pegar Más" para agregar el resto.
        </div>
      )}

      {!hasApiKey && (
        <p className="text-yellow-800 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mt-4 shadow-sm text-sm sm:text-base font-semibold">
          <span className="text-lg mr-2">⚠️</span>
          Configurá tu API key de Anthropic para comenzar a traducir
        </p>
      )}
        </>
      ) : (
        /* Bot Code Tab */
        <CodeInput onMessagesRetrieved={handleBotMessages} isLoading={isLoading} />
      )}

      {/* Debug Panel Modal */}
      {showDebugPanel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDebugPanel(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">🐛 Debug Logs - Último Paste</h3>
              <button
                onClick={() => setShowDebugPanel(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)] space-y-3">
              {debugLogs.map((log, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-900">{log.message}</span>
                    <span className="text-xs text-gray-500">{log.timestamp}</span>
                  </div>
                  {log.data && (
                    <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto font-mono">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  const logText = debugLogs.map(log =>
                    `[${log.timestamp}] ${log.message}\n${log.data ? JSON.stringify(log.data, null, 2) : ''}\n`
                  ).join('\n---\n\n');
                  navigator.clipboard.writeText(logText).then(() => {
                    alert('Logs copiados al portapapeles! Ahora podés compartirlos.');
                  }).catch(() => {
                    alert('No se pudo copiar. Tomá screenshot del panel.');
                  });
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                📋 Copiar Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
