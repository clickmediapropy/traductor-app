/**
 * Simple in-memory storage for bot sessions
 * TODO: Migrate to Vercel KV or Redis for production
 */

// In-memory storage (resets on serverless cold start)
const sessions = new Map();

// Initialize test session that never expires
function initTestSession() {
  const testCode = 'TEST99';
  const now = new Date();
  const neverExpires = new Date('2099-12-31T23:59:59Z'); // Far future date

  sessions.set(testCode, {
    code: testCode,
    chatId: 0,
    messages: [
      {
        text: '教授: 这是一个测试消息',
        forwardFrom: 'Test User',
        timestamp: Math.floor(now.getTime() / 1000),
        messageId: 1
      },
      {
        text: '助理: 好的，我明白了',
        forwardFrom: 'Test Assistant',
        timestamp: Math.floor(now.getTime() / 1000),
        messageId: 2
      },
      {
        text: '30: 你好，我是客户',
        forwardFrom: 'Test Client',
        timestamp: Math.floor(now.getTime() / 1000),
        messageId: 3
      }
    ],
    createdAt: now.toISOString(),
    expiresAt: neverExpires.toISOString(),
    active: false // Already closed, ready to use
  });
}

// Initialize on module load
initTestSession();

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
