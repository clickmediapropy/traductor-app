/**
 * Simple in-memory storage for bot sessions
 * TODO: Migrate to Vercel KV or Redis for production
 */

// In-memory storage (resets on serverless cold start)
const sessions = new Map();

// Generate random 6-character code
export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (0, O, I, 1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create new session
export function createSession(chatId) {
  const code = generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

  sessions.set(code, {
    code,
    chatId,
    messages: [],
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    active: true
  });

  return code;
}

// Get session by code
export function getSession(code) {
  const session = sessions.get(code);
  if (!session) return null;

  // Check if expired
  if (new Date() > new Date(session.expiresAt)) {
    sessions.delete(code);
    return null;
  }

  return session;
}

// Add message to session
export function addMessage(code, message) {
  const session = getSession(code);
  if (!session || !session.active) return false;

  session.messages.push({
    text: message.text,
    forwardFrom: message.forward_from?.first_name || message.forward_from?.username || 'Unknown',
    timestamp: message.date,
    messageId: message.message_id
  });

  return true;
}

// Close session (no more messages)
export function closeSession(code) {
  const session = getSession(code);
  if (!session) return false;

  session.active = false;
  return true;
}

// Get active session for chat (returns code or null)
export function getActiveChatSession(chatId) {
  for (const [code, session] of sessions.entries()) {
    if (session.chatId === chatId && session.active) {
      // Check not expired
      if (new Date() < new Date(session.expiresAt)) {
        return code;
      } else {
        sessions.delete(code);
      }
    }
  }
  return null;
}

// Cleanup expired sessions (call periodically)
export function cleanupExpired() {
  const now = new Date();
  for (const [code, session] of sessions.entries()) {
    if (now > new Date(session.expiresAt)) {
      sessions.delete(code);
    }
  }
}
