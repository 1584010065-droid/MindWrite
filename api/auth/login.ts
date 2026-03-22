/**
 * 用户登录 API
 * POST /api/auth/login
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
    const { email, password } = JSON.parse(body || '{}');

    // Validate
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    // Connect to DB
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });

    // Find user
    const result = await pool.query(
      `SELECT id, email, nickname, password_hash, avatar_url,
              writing_preference, export_preset, model_selection,
              enable_web_search, email_verified
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      await pool.end();
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      await pool.end();
      return res.status(400).json({ error: '请使用OAuth登录' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      await pool.end();
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

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

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        writingPreference: user.writing_preference,
        exportPreset: user.export_preset,
        modelSelection: user.model_selection,
        enableWebSearch: user.enable_web_search,
        emailVerified: user.email_verified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}