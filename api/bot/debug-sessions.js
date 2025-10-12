/**
 * Debug endpoint to view active sessions
 * Endpoint: GET /api/bot/debug-sessions
 */
import { getAllSessions } from './storage.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessions = getAllSessions();

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions: sessions.map(s => ({
        code: s.code,
        chatId: s.chatId,
        messageCount: s.messages.length,
        active: s.active,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt
      }))
    });
  } catch (error) {
    console.error('Debug sessions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
