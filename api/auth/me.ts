/**
 * 获取当前用户 API
 * GET /api/auth/me
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { queryOne } from '../_db';
import { verifyAccessToken } from '../_auth';
import { handleOptions, success, error, unauthorized } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return error(req, res, 'Method not allowed', 405);
  }

  try {
    // 获取并验证 Token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return unauthorized(req, res);
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      return unauthorized(req, res, '无效的访问令牌');
    }

    // 获取用户信息
    const user = await queryOne<{
      id: string;
      email: string;
      nickname: string;
      avatar_url: string | null;
      writing_preference: string;
      export_preset: string;
      model_selection: string;
      enable_web_search: boolean;
      email_verified: boolean;
      created_at: Date;
    }>(
      `SELECT id, email, nickname, avatar_url,
              writing_preference, export_preset, model_selection,
              enable_web_search, email_verified, created_at
       FROM users WHERE id = $1`,
      [payload.userId]
    );

    if (!user) {
      return unauthorized(req, res, '用户不存在');
    }

    success(req, res, {
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
  } catch (err) {
    console.error('Get user error:', err);
    error(req, res, '服务器错误', 500);
  }
}