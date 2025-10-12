/**
 * Get Messages API (Vercel Serverless Function)
 * Endpoint: GET /api/bot/get-messages?code=ABC123
 */
import { getSession } from './storage.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Code parameter required' });
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.toUpperCase().trim();

    // Get session
    const session = getSession(normalizedCode);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found or expired',
        message: 'El código no existe, expiró (1 hora) o ya fue usado.'
      });
    }

    if (session.active) {
      return res.status(400).json({
        error: 'Session still active',
        message: 'La sesión todavía está activa. Enviá /done al bot primero.'
      });
    }

    // Return messages
    return res.status(200).json({
      success: true,
      code: session.code,
      messageCount: session.messages.length,
      messages: session.messages,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error al obtener mensajes. Intentá de nuevo.'
    });
  }
}
