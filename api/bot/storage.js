/**
 * Upstash Redis storage for bot sessions
 * Persistent storage across serverless function invocations
 */
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const SESSION_PREFIX = 'bot_session:';
const CHAT_SESSION_PREFIX = 'chat_active:';
const SESSION_TTL = 60 * 60; // 1 hour in seconds

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
export async function createSession(chatId) {
  const code = generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL * 1000);

  const session = {
    code,
    chatId,
    messages: [],
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    active: true
  };

  // Save session in Redis with TTL
  await redis.set(`${SESSION_PREFIX}${code}`, JSON.stringify(session), { ex: SESSION_TTL });

  // Map chatId to active code
  await redis.set(`${CHAT_SESSION_PREFIX}${chatId}`, code, { ex: SESSION_TTL });

  console.log('[Storage] Created session:', code, 'for chatId:', chatId);

  return code;
}

// Get session by code
export async function getSession(code) {
  const data = await redis.get(`${SESSION_PREFIX}${code}`);

  if (!data) {
    return null;
  }

  const session = typeof data === 'string' ? JSON.parse(data) : data;

  // Check if expired
  if (new Date() > new Date(session.expiresAt)) {
    await redis.del(`${SESSION_PREFIX}${code}`);
    return null;
  }

  return session;
}

// Add message to session
export async function addMessage(code, message) {
  const session = await getSession(code);
  if (!session || !session.active) return false;

  session.messages.push({
    text: message.text,
    forwardFrom: message.forward_from?.first_name || message.forward_from?.username || 'Unknown',
    timestamp: message.date,
    messageId: message.message_id
  });

  // Update session in Redis
  await redis.set(`${SESSION_PREFIX}${code}`, JSON.stringify(session), { ex: SESSION_TTL });

  return true;
}

// Close session (no more messages)
export async function closeSession(code) {
  const session = await getSession(code);
  if (!session) return false;

  session.active = false;

  // Update session in Redis
  await redis.set(`${SESSION_PREFIX}${code}`, JSON.stringify(session), { ex: SESSION_TTL });

  // Remove chat mapping
  await redis.del(`${CHAT_SESSION_PREFIX}${session.chatId}`);

  return true;
}

// Get active session for chat (returns code or null)
export async function getActiveChatSession(chatId) {
  const code = await redis.get(`${CHAT_SESSION_PREFIX}${chatId}`);

  if (!code) {
    return null;
  }

  // Verify session still exists and is active
  const session = await getSession(code);
  if (!session || !session.active) {
    await redis.del(`${CHAT_SESSION_PREFIX}${chatId}`);
    return null;
  }

  return code;
}

// Cleanup expired sessions (Redis handles this automatically with TTL)
export function cleanupExpired() {
  // No-op: Redis automatically deletes expired keys
  console.log('[Storage] Cleanup called (handled by Redis TTL)');
}

// Get all sessions (for debugging)
export async function getAllSessions() {
  // Get all session keys
  const keys = await redis.keys(`${SESSION_PREFIX}*`);

  if (!keys || keys.length === 0) {
    return [];
  }

  // Get all sessions
  const sessions = await Promise.all(
    keys.map(async (key) => {
      const data = await redis.get(key);
      return typeof data === 'string' ? JSON.parse(data) : data;
    })
  );

  return sessions.filter(s => s !== null);
}

// Initialize TEST99 session (runs on every cold start)
async function initTestSession() {
  const testCode = 'TEST99';

  // Check if already exists
  const existing = await redis.get(`${SESSION_PREFIX}${testCode}`);
  if (existing) {
    return;
  }

  const now = new Date();
  const neverExpires = new Date('2099-12-31T23:59:59Z');

  const session = {
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
    active: false
  };

  // Save without TTL (never expires)
  await redis.set(`${SESSION_PREFIX}${testCode}`, JSON.stringify(session));

  console.log('[Storage] TEST99 session initialized in Redis');
}

// Initialize test session on module load
initTestSession().catch(err => {
  console.error('[Storage] Error initializing TEST99:', err);
});
