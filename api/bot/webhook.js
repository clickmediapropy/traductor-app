/**
 * Telegram Bot Webhook Handler (Vercel Serverless Function)
 * Endpoint: POST /api/bot/webhook
 */
import { handleUpdate } from './telegram-bot.js';
import { cleanupExpired } from './storage.js';

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not set');
      return res.status(500).json({ error: 'Bot not configured' });
    }

    const update = req.body;

    // Cleanup expired sessions periodically
    cleanupExpired();

    // Handle the update
    await handleUpdate(botToken, update);

    // Telegram expects 200 OK
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to Telegram to avoid retries
    res.status(200).json({ ok: true });
  }
}
