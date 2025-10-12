import { useState, useEffect } from 'react';
import Header from './components/Header';
import ApiKeyModal from './components/ApiKeyModal';
import CustomInstructionsModal from './components/CustomInstructionsModal';
import InputArea from './components/InputArea';
import MessageCard from './components/MessageCard';
import ConsolidatedOutput from './components/ConsolidatedOutput';
import LoadingSpinner from './components/LoadingSpinner';
import InstallPWA from './components/InstallPWA';
import { parseMessages, cleanOriginalText } from './services/messageParser';
import { translateBatch, translateMessage, translateLiteral } from './services/claudeAPI';
import { getCustomInstructions } from './services/translationPrompt';
// v2.0 - Bot integration

function App() {
  // Estado
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showCustomInstructionsModal, setShowCustomInstructionsModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [customInstructionsCount, setCustomInstructionsCount] = useState(0);
  const [error, setError] = useState(null);
  const [retranslatingMessageId, setRetranslatingMessageId] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'consolidated'

  // Verificar API key al cargar
  useEffect(() => {
    const apiKey = localStorage.getItem('claudeApiKey');
    setHasApiKey(!!apiKey);

    // Mostrar modal si no hay API key
    if (!apiKey) {
      setShowApiModal(true);
    }
  }, []);

  // Cargar count de instrucciones personalizadas al inicio
  useEffect(() => {
    updateCustomInstructionsCount();
  }, []);

  // Función para actualizar el count de instrucciones
  const updateCustomInstructionsCount = () => {
    const instructions = getCustomInstructions();
    setCustomInstructionsCount(instructions.length);
  };

  // Manejar traducción
  const handleTranslate = async (textToTranslate) => {
    if (!textToTranslate || !textToTranslate.trim() || !hasApiKey) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Parsear mensajes
      const parsedMessages = parseMessages(textToTranslate);

      if (parsedMessages.length === 0) {
        setError('No se detectaron mensajes válidos');
        setIsLoading(false);
        return;
      }

      // 2. Limpiar textos originales
      const cleanedMessages = parsedMessages.map(msg => ({
        ...msg,
        originalWithFormat: msg.original, // Mantener formato completo para UI
        original: cleanOriginalText(msg.original, msg.type, msg.clientNumber) // Texto limpio para traducir
      }));

      // 3. Traducir en lote
      const translatedMessages = await translateBatch(cleanedMessages);

      // 4. Actualizar estado
      setMessages(translatedMessages);

    } catch (err) {
      console.error('Error en traducción:', err);
      setError(err.message || 'Error al traducir mensajes');
    } finally {
      setIsLoading(false);
    }
  };

  // Limpiar todo
  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  // Actualizar traducción de un mensaje
  const handleUpdateMessage = (id, newTranslation) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === id ? { ...msg, translation: newTranslation } : msg
      )
    );
  };

  // Re-traducir un mensaje específico
  const handleRetranslate = async (id) => {
    if (!hasApiKey || retranslatingMessageId) return;

    setRetranslatingMessageId(id);

    try {
      // Encontrar el mensaje
      const messageToRetranslate = messages.find(msg => msg.id === id);
      if (!messageToRetranslate) return;

      // Re-traducir con las mismas funciones que translateBatch
      const literalTranslation = await translateLiteral(messageToRetranslate.original);
      const finalTranslation = await translateMessage(
        messageToRetranslate.type,
        messageToRetranslate.gender,
        messageToRetranslate.original
      );

      // Actualizar el mensaje con las nuevas traducciones
      setMessages(prev =>
        prev.map(msg =>
          msg.id === id
            ? { ...msg, literalTranslation, translation: finalTranslation }
            : msg
        )
      );
    } catch (err) {
      console.error('Error al re-traducir:', err);
      alert(`Error al re-traducir: ${err.message}`);
    } finally {
      setRetranslatingMessageId(null);
    }
  };

  // Guardar API key
  const handleSaveApiKey = (apiKey) => {
    localStorage.setItem('claudeApiKey', apiKey);
    setHasApiKey(true);
    setShowApiModal(false);
  };

  return (
    <div className="min-h-screen bg-aurora-light text-gray-900 pb-safe">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200">
        <Header
          onOpenSettings={() => setShowApiModal(true)}
          onOpenInstructions={() => setShowCustomInstructionsModal(true)}
          hasApiKey={hasApiKey}
          customInstructionsCount={customInstructionsCount}
        />
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        {/* Input Area */}
        <section className="animate-fade-in">
          <InputArea
            onTranslate={handleTranslate}
            onClear={handleClear}
            isLoading={isLoading}
            hasApiKey={hasApiKey}
          />

          {/* Mensaje de error */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
        </section>

        {/* Results List */}
        {messages.length > 0 && (
          <section className="animate-fade-in">
            {/* Header con toggle de vista */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Resultados ({messages.length} mensajes)
              </h2>

              {/* Toggle buttons */}
              <div className="flex gap-2 bg-white rounded-xl p-1 border border-gray-200">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    viewMode === 'cards'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🃏 Tarjetas
                </button>
                <button
                  onClick={() => setViewMode('consolidated')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    viewMode === 'consolidated'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📄 Todo Junto
                </button>
              </div>
            </div>

            {/* Render condicional según viewMode */}
            {viewMode === 'cards' ? (
              <div className="flex flex-col gap-3">
                {messages.map(message => (
                  <MessageCard
                    key={message.id}
                    message={message}
                    onUpdate={handleUpdateMessage}
                    onRetranslate={handleRetranslate}
                    isRetranslating={retranslatingMessageId === message.id}
                  />
                ))}
              </div>
            ) : (
              <ConsolidatedOutput messages={messages} />
            )}
          </section>
        )}

        {/* Loading Overlay */}
        {isLoading && <LoadingSpinner />}
      </main>

      {/* API Key Modal */}
      {showApiModal && (
        <ApiKeyModal
          onSave={handleSaveApiKey}
          onClose={() => setShowApiModal(false)}
          currentKey={localStorage.getItem('claudeApiKey') || ''}
        />
      )}

      {/* Custom Instructions Modal */}
      {showCustomInstructionsModal && (
        <CustomInstructionsModal
          onClose={() => setShowCustomInstructionsModal(false)}
          onUpdate={updateCustomInstructionsCount}
        />
      )}

      {/* PWA Install Prompt */}
      <InstallPWA />
    </div>
  );
}

export default App;
