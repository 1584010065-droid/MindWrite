/**
 * 用户登录 API
 * POST /api/auth/login
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { queryOne } from '../_db';
import { verifyPassword, signTokens } from '../_auth';
import { handleOptions, success, error, parseBody } from '../_utils';

interface LoginBody {
  email: string;
  password: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return error(req, res, 'Method not allowed', 405);
  }

  try {
    const { email, password } = await parseBody<LoginBody>(req);

    // 验证输入
    if (!email || !password) {
      return error(req, res, '邮箱和密码不能为空');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 查找用户
    const user = await queryOne<{
      id: string;
      email: string;
      nickname: string;
      avatar_url: string | null;
      password_hash: string;
      writing_preference: string;
      export_preset: string;
      model_selection: string;
      enable_web_search: boolean;
      email_verified: boolean;
    }>(
      `SELECT id, email, nickname, avatar_url, password_hash,
              writing_preference, export_preset, model_selection,
              enable_web_search, email_verified
       FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (!user) {
      return error(req, res, '邮箱或密码错误', 401);
    }

    // 验证密码
    if (!user.password_hash) {
      return error(req, res, '请使用OAuth登录', 400);
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return error(req, res, '邮箱或密码错误', 401);
    }

    // 生成 Token
    const { accessToken, refreshToken } = await signTokens(user.id);

    success(req, res, {
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
  } catch (err) {
    console.error('Login error:', err);
    error(req, res, '服务器错误', 500);
  }
}