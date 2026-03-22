/**
 * JWT 认证工具函数
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './_db';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

export interface JwtPayload {
  userId: string;
}

/**
 * 生成访问令牌和刷新令牌
 */
export async function signTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  // 生成访问令牌
  const accessToken = jwt.sign({ userId }, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN });

  // 生成刷新令牌（随机UUID）
  const refreshToken = crypto.randomUUID();
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  // 存储刷新令牌到数据库
  await query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '${REFRESH_TOKEN_EXPIRES_DAYS} days')`,
    [userId, refreshTokenHash]
  );

  return { accessToken, refreshToken };
}

/**
 * 验证访问令牌
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * 验证刷新令牌并返回用户ID
 */
export async function verifyRefreshToken(refreshToken: string): Promise<string | null> {
  const sessions = await query<{ user_id: string; token_hash: string }>(
    `SELECT user_id, token_hash FROM sessions
     WHERE expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 10`
  );

  for (const session of sessions) {
    const isValid = await bcrypt.compare(refreshToken, session.token_hash);
    if (isValid) {
      return session.user_id;
    }
  }

  return null;
}

/**
 * 撤销刷新令牌
 */
export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const sessions = await query<{ id: string; token_hash: string }>(
    `SELECT id, token_hash FROM sessions WHERE expires_at > NOW()`
  );

  for (const session of sessions) {
    const isValid = await bcrypt.compare(refreshToken, session.token_hash);
    if (isValid) {
      await query('DELETE FROM sessions WHERE id = $1', [session.id]);
      break;
    }
  }
}

/**
 * 清理过期的会话
 */
export async function cleanExpiredSessions(): Promise<void> {
  await query('DELETE FROM sessions WHERE expires_at < NOW()');
}

/**
 * 加密密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}