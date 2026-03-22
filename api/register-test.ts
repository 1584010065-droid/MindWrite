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

  const steps: string[] = [];

  try {
    // Parse body
    steps.push('Parsing body...');
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const { email, password, nickname } = JSON.parse(body || '{}');
    steps.push(`Email: ${email}, Nickname: ${nickname}`);

    if (!email || !password) {
      throw new Error('Email and password required');
    }

    // Hash password
    steps.push('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);
    steps.push('Password hashed');

    // Connect to DB
    steps.push('Connecting to DB...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });
    steps.push('DB connected');

    // Check existing user
    steps.push('Checking existing user...');
    const existingResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (existingResult.rows.length > 0) {
      throw new Error('Email already registered');
    }
    steps.push('Email is available');

    // Create user
    steps.push('Creating user...');
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, nickname)
       VALUES ($1, $2, $3)
       RETURNING id, email, nickname`,
      [email.toLowerCase().trim(), passwordHash, nickname || email.split('@')[0]]
    );
    const user = userResult.rows[0];
    steps.push(`User created: ${user.id}`);

    // Generate tokens
    steps.push('Generating tokens...');
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    const refreshToken = crypto.randomUUID();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    steps.push('Saving session...');
    await pool.query(
      `INSERT INTO sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshTokenHash]
    );
    steps.push('Session saved');

    await pool.end();

    res.status(201).json({
      success: true,
      steps,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    steps.push(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      steps,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}