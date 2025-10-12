/**
 * Telegram Bot Logic
 */
import {
  createSession,
  getSession,
  addMessage,
  closeSession,
  getActiveChatSession
} from './storage.js';

const TELEGRAM_API = 'https://api.telegram.org';

// Send message to user
export async function sendMessage(botToken, chatId, text, options = {}) {
  const url = `${TELEGRAM_API}/bot${botToken}/sendMessage`;

  const body = {
    chat_id: chatId,
    text,
    parse_mode: options.parseMode || 'Markdown',
    ...options
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Telegram API error:', error);
    throw new Error('Failed to send message');
  }

  return response.json();
}

// Handle /start command
export async function handleStart(botToken, chatId) {
  const message = `
🤖 *ElizabethAI Translator Bot*

Bienvenido! Este bot te ayuda a enviar mensajes de Telegram a la app de traducción.

*Cómo usar:*
1️⃣ Envía \`/new\` para crear una nueva sesión
2️⃣ Reenvía (forward) los mensajes que quieras traducir
3️⃣ Envía \`/done\` cuando termines
4️⃣ Usá el código en la web app: https://traductor-app-two.vercel.app

*Comandos:*
/new - Crear nueva sesión
/done - Finalizar sesión actual
/cancel - Cancelar sesión actual
/help - Ver esta ayuda
`;

  await sendMessage(botToken, chatId, message);
}

// Handle /new command
export async function handleNew(botToken, chatId) {
  // Check if already has active session
  const existingCode = getActiveChatSession(chatId);
  if (existingCode) {
    await sendMessage(
      botToken,
      chatId,
      `⚠️ Ya tenés una sesión activa con código: \`${existingCode}\`\n\nEnviá /done para finalizarla o /cancel para cancelarla.`
    );
    return;
  }

  // Create new session
  const code = createSession(chatId);

  await sendMessage(
    botToken,
    chatId,
    `✅ *Sesión creada!*

Tu código es: \`${code}\`

Ahora podés:
1️⃣ Reenviar (forward) los mensajes que querés traducir
2️⃣ Cuando termines, enviá /done
3️⃣ Ingresá el código \`${code}\` en la web app

El código expira en 1 hora.
`
  );
}

// Handle /done command
export async function handleDone(botToken, chatId) {
  const code = getActiveChatSession(chatId);

  if (!code) {
    await sendMessage(
      botToken,
      chatId,
      '⚠️ No tenés ninguna sesión activa.\n\nEnviá /new para crear una nueva.'
    );
    return;
  }

  const session = getSession(code);
  if (!session) {
    await sendMessage(botToken, chatId, '❌ Error: Sesión no encontrada.');
    return;
  }

  closeSession(code);

  await sendMessage(
    botToken,
    chatId,
    `✅ *Sesión finalizada!*

Código: \`${code}\`
Mensajes recibidos: ${session.messages.length}

Ahora ingresá el código en la web app:
https://traductor-app-two.vercel.app
`
  );
}

// Handle /cancel command
export async function handleCancel(botToken, chatId) {
  const code = getActiveChatSession(chatId);

  if (!code) {
    await sendMessage(
      botToken,
      chatId,
      '⚠️ No tenés ninguna sesión activa.'
    );
    return;
  }

  closeSession(code);

  await sendMessage(
    botToken,
    chatId,
    '❌ Sesión cancelada.'
  );
}

// Handle forwarded message
export async function handleForwardedMessage(botToken, chatId, message) {
  const code = getActiveChatSession(chatId);

  if (!code) {
    await sendMessage(
      botToken,
      chatId,
      '⚠️ Primero creá una sesión con /new'
    );
    return;
  }

  const success = addMessage(code, message);

  if (success) {
    const session = getSession(code);
    // Send confirmation with message count
    await sendMessage(
      botToken,
      chatId,
      `✅ Mensaje agregado (${session.messages.length} total)\n\nReenviá más mensajes o enviá /done para finalizar.`
    );
  } else {
    await sendMessage(
      botToken,
      chatId,
      '❌ Error al agregar mensaje. La sesión puede estar cerrada o expirada.'
    );
  }
}

// Handle regular text message (not command, not forwarded)
export async function handleRegularMessage(botToken, chatId) {
  await sendMessage(
    botToken,
    chatId,
    '⚠️ Por favor, reenvía (forward) mensajes en lugar de copiarlos.\n\nO enviá /help para ver los comandos disponibles.'
  );
}

// Main handler for incoming updates
export async function handleUpdate(botToken, update) {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id;
  const text = message.text || '';

  // Handle commands
  if (text.startsWith('/')) {
    const command = text.split(' ')[0].toLowerCase();

    switch (command) {
      case '/start':
      case '/help':
        await handleStart(botToken, chatId);
        break;
      case '/new':
        await handleNew(botToken, chatId);
        break;
      case '/done':
        await handleDone(botToken, chatId);
        break;
      case '/cancel':
        await handleCancel(botToken, chatId);
        break;
      default:
        await sendMessage(botToken, chatId, 'Comando no reconocido. Enviá /help para ver los comandos disponibles.');
    }
    return;
  }

  // Handle forwarded messages
  if (message.forward_from || message.forward_from_chat) {
    await handleForwardedMessage(botToken, chatId, message);
    return;
  }

  // Regular text message (not command, not forwarded)
  await handleRegularMessage(botToken, chatId);
}
