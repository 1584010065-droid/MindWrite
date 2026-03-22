/**
 * 认证工具函数
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './_db';

export async function signTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  // 生成 access token
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  // 生成 refresh token
  const refreshToken = crypto.randomUUID();
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  // 存储session
  await query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [userId, refreshTokenHash]
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    return null;
  }
}