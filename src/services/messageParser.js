/**
 * Parsea el texto de input y detecta tipo de mensaje automáticamente
 *
 * Reglas de detección:
 * - Profesor: contiene "教授" o "Professor:"
 * - Asistente: contiene "助理" o "Assistant:"
 * - Cliente: empieza con número seguido de ":" (ej: "30:", "32:")
 *   - Si contiene "(女)" → gender: 'mujer'
 *   - Si no → gender: 'hombre'
 *
 * NOTA: Maneja el formato de Telegram con metadatos (nombre canal + timestamp)
 *
 * @param {string} inputText - Texto completo pegado del Telegram
 * @returns {Array} Array de objetos mensaje
 */
export function parseMessages(inputText) {
  if (!inputText || !inputText.trim()) {
    return [];
  }

  // Pre-procesar: eliminar líneas de metadata de Telegram
  const cleanedText = preprocessTelegramText(inputText);

  // Dividir por líneas, limpiar vacías
  const lines = cleanedText.split('\n').filter(line => line.trim());

  const messages = [];
  let currentMessage = null;
  let messageCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detectar inicio de nuevo mensaje
    // Soportar tanto : como ： (fullwidth colon)
    const isProfessor = (line.includes('教授') && (line.includes(':') || line.includes('：'))) ||
                        line.toLowerCase().includes('professor:');
    const isAssistant = (line.includes('助理') && (line.includes(':') || line.includes('：'))) ||
                        line.toLowerCase().includes('assistant:');
    const clientMatch = line.match(/^(\d+)(\(女\)|（女）)?[:：]/);

    if (isProfessor || isAssistant || clientMatch) {
      // Guardar mensaje anterior si existe
      if (currentMessage) {
        messages.push(currentMessage);
      }

      // Iniciar nuevo mensaje
      messageCounter++;

      // Crear objeto mensaje
      currentMessage = {
        id: messageCounter,
        original: line
      };

      if (isProfessor) {
        currentMessage.type = 'profesor';
      } else if (isAssistant) {
        currentMessage.type = 'asistente';
      } else if (clientMatch) {
        currentMessage.type = 'cliente';
        currentMessage.clientNumber = parseInt(clientMatch[1]);
        currentMessage.gender = clientMatch[2] ? 'mujer' : 'hombre';
      }

      // Si la línea solo contiene el identificador (ej: "助理："),
      // agregar las siguientes líneas hasta encontrar otro mensaje
      const lineContent = line.replace(/^(教授|助理|Professor|Assistant|(\d+)(\(女\)|（女）)?)[:：]\s*/, '').trim();
      if (!lineContent && i + 1 < lines.length) {
        // La línea siguiente es parte del contenido
        continue;
      }

    } else {
      // Continuar mensaje actual (multiline)
      if (currentMessage) {
        currentMessage.original += '\n' + line;
      }
    }
  }

  // Agregar último mensaje si existe
  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}

/**
 * Pre-procesa el texto de Telegram para eliminar metadatos
 * Elimina líneas como: "blues 周伯通工作室, [10 de oct de 2025 a las 15:02]"
 *
 * @param {string} text - Texto crudo de Telegram
 * @returns {string} Texto limpio sin metadata
 */
function preprocessTelegramText(text) {
  const lines = text.split('\n');
  const cleanedLines = [];

  for (const line of lines) {
    // Detectar líneas de metadata de Telegram
    // Patrón: "nombre/canal, [cualquier formato de fecha]"
    const isMetadata = /^[^,]+,\s*\[[^\]]+\]\s*$/.test(line.trim());

    if (!isMetadata) {
      cleanedLines.push(line);
    }
  }

  return cleanedLines.join('\n');
}

/**
 * Limpia el texto original para enviar a traducción
 * Remueve etiquetas como "教授:", "30:", "Assistant:", etc.
 *
 * @param {string} text - Texto original del mensaje
 * @param {string} type - Tipo de mensaje (profesor, asistente, cliente)
 * @param {number} clientNumber - Número del cliente (si aplica)
 * @returns {string} Texto limpio sin etiquetas
 */
export function cleanOriginalText(text, type, clientNumber) {
  let cleaned = text;

  // Limpiar prefijos según el tipo
  // Soportar tanto : como ： (fullwidth colon)
  if (type === 'profesor') {
    cleaned = cleaned
      .replace(/^教授[:：]\s*/im, '')
      .replace(/^Professor[:：]\s*/im, '')
      .trim();
  } else if (type === 'asistente') {
    cleaned = cleaned
      .replace(/^助理[:：]\s*/im, '')
      .replace(/^Assistant[:：]\s*/im, '')
      .trim();
  } else if (type === 'cliente') {
    // Crear regex que maneje ambos formatos de parentesis y dos puntos
    const clientRegex = new RegExp(
      `^${clientNumber}(（女）|\\(女\\))?[:：]\\s*`,
      'im'
    );
    cleaned = cleaned.replace(clientRegex, '').trim();
  }

  return cleaned;
}
