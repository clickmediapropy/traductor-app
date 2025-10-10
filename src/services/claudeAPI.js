import Anthropic from '@anthropic-ai/sdk';
import { buildTranslationPrompt } from './translationPrompt.js';

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
      model: 'claude-sonnet-4-20250514',
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
 * Traduce múltiples mensajes en paralelo (máximo 5 a la vez)
 * Esto ayuda a respetar los rate limits de la API
 *
 * @param {Array} messages - Array de objetos mensaje con {type, gender, original}
 * @returns {Promise<Array>} Array de mensajes con traducción agregada
 */
export async function translateBatch(messages) {
  const BATCH_SIZE = 5;
  const results = [];

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(msg =>
      translateMessage(msg.type, msg.gender, msg.original)
        .then(translation => ({ ...msg, translation }))
        .catch(error => ({ ...msg, translation: `[Error: ${error.message}]` }))
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}
