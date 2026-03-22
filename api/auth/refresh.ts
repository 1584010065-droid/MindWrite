/**
 * 刷新 Token API
 * POST /api/auth/refresh
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const { refreshToken } = JSON.parse(body || '{}');

    if (!refreshToken) {
      return res.status(400).json({ error: '缺少刷新令牌' });
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });

    // Find valid session
    const result = await pool.query(
      `SELECT id, user_id, token_hash FROM sessions
       WHERE expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 50`
    );

    let userId: string | null = null;
    let sessionId: string | null = null;

    for (const session of result.rows) {
      if (await bcrypt.compare(refreshToken, session.token_hash)) {
        userId = session.user_id;
        sessionId = session.id;
        break;
      }
    }

    if (!userId) {
      await pool.end();
      return res.status(401).json({ error: '无效的刷新令牌' });
    }

    // Delete old session
    await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);

    // Generate new tokens
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    const newRefreshToken = crypto.randomUUID();
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await pool.query(
      `INSERT INTO sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [userId, refreshTokenHash]
    );

    await pool.end();

    res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}