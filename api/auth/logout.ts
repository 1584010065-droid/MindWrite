/**
 * 用户登出 API
 * POST /api/auth/logout
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { revokeRefreshToken } from '../_auth';
import { handleOptions, success, error, parseBody } from '../_utils';

interface LogoutBody {
  refreshToken?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return error(req, res, 'Method not allowed', 405);
  }

  try {
    const { refreshToken } = await parseBody<LogoutBody>(req);

    // 撤销刷新令牌
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    success(req, res, { message: '登出成功' });
  } catch (err) {
    console.error('Logout error:', err);
    error(req, res, '服务器错误', 500);
  }
}