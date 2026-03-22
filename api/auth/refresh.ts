/**
 * 刷新 Token API
 * POST /api/auth/refresh
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyRefreshToken, signTokens, revokeRefreshToken } from '../_auth';
import { handleOptions, success, error, parseBody } from '../_utils';

interface RefreshBody {
  refreshToken: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return error(req, res, 'Method not allowed', 405);
  }

  try {
    const { refreshToken } = await parseBody<RefreshBody>(req);

    if (!refreshToken) {
      return error(req, res, '缺少刷新令牌', 400);
    }

    // 验证刷新令牌
    const userId = await verifyRefreshToken(refreshToken);

    if (!userId) {
      return error(req, res, '无效或过期的刷新令牌', 401);
    }

    // 撤销旧的刷新令牌
    await revokeRefreshToken(refreshToken);

    // 生成新的 Token
    const tokens = await signTokens(userId);

    success(req, res, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    console.error('Refresh error:', err);
    error(req, res, '服务器错误', 500);
  }
}