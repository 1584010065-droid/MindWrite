/**
 * 用户登出 API
 * POST /api/auth/logout
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

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
    // 解析请求体
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const { refreshToken } = JSON.parse(body || '{}');

    // 如果有 refreshToken，删除对应的 session
    if (refreshToken) {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
      });

      // 查找并删除匹配的 session
      const result = await pool.query(
        `SELECT id, token_hash FROM sessions WHERE expires_at > NOW() LIMIT 50`
      );

      for (const session of result.rows) {
        if (await bcrypt.compare(refreshToken, session.token_hash)) {
          await pool.query('DELETE FROM sessions WHERE id = $1', [session.id]);
          break;
        }
      }

      await pool.end();
    }

    res.status(200).json({ message: '登出成功' });
  } catch (error) {
    console.error('Logout error:', error);
    // 即使出错也返回成功，避免暴露错误信息
    res.status(200).json({ message: '登出成功' });
  }
}