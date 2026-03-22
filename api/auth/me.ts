/**
 * 获取当前用户 API
 * GET /api/auth/me
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    if (!payload) {
      return res.status(401).json({ error: '无效的访问令牌' });
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });

    const result = await pool.query(
      `SELECT id, email, nickname, avatar_url,
              writing_preference, export_preset, model_selection,
              enable_web_search, email_verified, created_at
       FROM users WHERE id = $1`,
      [payload.userId]
    );

    await pool.end();

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户不存在' });
    }

    const user = result.rows[0];

    res.status(200).json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      writingPreference: user.writing_preference,
      exportPreset: user.export_preset,
      modelSelection: user.model_selection,
      enableWebSearch: user.enable_web_search,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: '无效的访问令牌' });
  }
}