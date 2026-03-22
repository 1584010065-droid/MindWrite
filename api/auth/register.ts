/**
 * 用户注册 API
 * POST /api/auth/register
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { queryOne } from '../_db';
import { hashPassword, signTokens } from '../_auth';
import { handleOptions, success, error, parseBody } from '../_utils';

interface RegisterBody {
  email: string;
  password: string;
  nickname?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return error(req, res, 'Method not allowed', 405);
  }

  try {
    const { email, password, nickname } = await parseBody<RegisterBody>(req);

    // 验证输入
    if (!email || !password) {
      return error(req, res, '邮箱和密码不能为空');
    }

    if (password.length < 6) {
      return error(req, res, '密码至少需要6个字符');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return error(req, res, '邮箱格式不正确');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 检查邮箱是否已存在
    const existingUser = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser) {
      return error(req, res, '该邮箱已被注册', 409);
    }

    // 加密密码
    const passwordHash = await hashPassword(password);

    // 创建用户
    const user = await queryOne<{ id: string; email: string; nickname: string }>(
      `INSERT INTO users (email, password_hash, nickname)
       VALUES ($1, $2, $3)
       RETURNING id, email, nickname`,
      [normalizedEmail, passwordHash, nickname?.trim() || normalizedEmail.split('@')[0]]
    );

    if (!user) {
      return error(req, res, '创建用户失败', 500);
    }

    // 生成 Token
    const { accessToken, refreshToken } = await signTokens(user.id);

    success(req, res, {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
      accessToken,
      refreshToken,
    }, 201);
  } catch (err) {
    console.error('Register error:', err);
    error(req, res, '服务器错误', 500);
  }
}