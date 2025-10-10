import Anthropic from '@anthropic-ai/sdk';
import { buildTranslationPrompt, buildLiteralTranslationPrompt } from './translationPrompt.js';

/**
 * Traduce un mensaje usando Claude API
 *
 * @param {string} type - Tipo de mensaje: 'profesor', 'asistente', 'cliente'
 * @param {string} gender - Género (para clientes): 'hombre', 'mujer'
 * @param {string} originalText - Texto original en chino a traducir
 * @returns {Promise<string>} Traducción en español argentino
 * @throws {Error} Si hay un error en la API o no hay API key
 */
export async function translateMessage(type, gender, originalText) {
  const apiKey = localStorage.getItem('claudeApiKey');

  if (!apiKey) {
    throw new Error('No se configuró la API key de Anthropic');
  }

  const client = new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Necesario para uso en frontend
  });

  const prompt = buildTranslationPrompt(type, gender, originalText);

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Extraer el texto de la respuesta
    const translation = message.content[0].text.trim();

    return translation;

  } catch (error) {
    console.error('Error en traducción:', error);
    throw new Error(`Error de API: ${error.message}`);
  }
}

/**
 * Traduce un mensaje de forma literal (sin aplicar estilos regionales)
 * Esta traducción es para referencia y control de calidad
 *
 * @param {string} originalText - Texto original en chino a traducir
 * @returns {Promise<string>} Traducción literal en español
 * @throws {Error} Si hay un error en la API o no hay API key
 */
export async function translateLiteral(originalText) {
  const apiKey = localStorage.getItem('claudeApiKey');

  if (!apiKey) {
    throw new Error('No se configuró la API key de Anthropic');
  }

  const client = new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  const prompt = buildLiteralTranslationPrompt(originalText);

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const translation = message.content[0].text.trim();
    return translation;

  } catch (error) {
    console.error('Error en traducción literal:', error);
    throw new Error(`Error de API: ${error.message}`);
  }
}

/**
 * Traduce múltiples mensajes en paralelo (máximo 5 a la vez)
 * Ahora incluye traducción literal + traducción final con estilo
 * Esto ayuda a respetar los rate limits de la API
 *
 * @param {Array} messages - Array de objetos mensaje con {type, gender, original}
 * @returns {Promise<Array>} Array de mensajes con literalTranslation y translation
 */
export async function translateBatch(messages) {
  const BATCH_SIZE = 5;
  const results = [];

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (msg) => {
      try {
        // Traducción literal (primera llamada)
        const literalTranslation = await translateLiteral(msg.original);

        // Traducción final con estilo (segunda llamada)
        const finalTranslation = await translateMessage(msg.type, msg.gender, msg.original);

        return {
          ...msg,
          literalTranslation,
          translation: finalTranslation
        };
      } catch (error) {
        return {
          ...msg,
          literalTranslation: `[Error: ${error.message}]`,
          translation: `[Error: ${error.message}]`
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}
