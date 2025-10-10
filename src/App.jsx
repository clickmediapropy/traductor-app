import { useState, useEffect } from 'react';
import Header from './components/Header';
import ApiKeyModal from './components/ApiKeyModal';
import CustomInstructionsModal from './components/CustomInstructionsModal';
import InputArea from './components/InputArea';
import MessageCard from './components/MessageCard';
import LoadingSpinner from './components/LoadingSpinner';
import { parseMessages, cleanOriginalText } from './services/messageParser';
import { translateBatch } from './services/claudeAPI';
import { getCustomInstructions } from './services/translationPrompt';

function App() {
  // Estado
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showCustomInstructionsModal, setShowCustomInstructionsModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [customInstructionsCount, setCustomInstructionsCount] = useState(0);
  const [error, setError] = useState(null);

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
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Resultados ({messages.length} mensajes)
            </h2>

            <div className="flex flex-col gap-4">
              {messages.map(message => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onUpdate={handleUpdateMessage}
                />
              ))}
            </div>
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
    </div>
  );
}

export default App;
