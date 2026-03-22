/**
 * 用户注册 API
 * POST /api/auth/register
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
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
    // Parse body
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const { email, password, nickname } = JSON.parse(body || '{}');

    // Validate
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少需要6个字符' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Connect to DB
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });

    // Check existing user
    const existingResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );
    if (existingResult.rows.length > 0) {
      await pool.end();
      return res.status(409).json({ error: '该邮箱已被注册' });
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 12);
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, nickname)
       VALUES ($1, $2, $3)
       RETURNING id, email, nickname`,
      [normalizedEmail, passwordHash, nickname?.trim() || normalizedEmail.split('@')[0]]
    );
    const user = userResult.rows[0];

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    const refreshToken = crypto.randomUUID();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await pool.query(
      `INSERT INTO sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshTokenHash]
    );

    await pool.end();

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}