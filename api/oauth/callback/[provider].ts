/**
 * OAuth 回调处理 API
 * GET /api/oauth/callback/{provider}
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { queryOne, query } from '../../_db';
import { signTokens } from '../../_auth';
import { handleOptions, error } from '../../_utils';

type OAuthProvider = 'github' | 'google';

interface OAuthUserInfo {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

// 获取 GitHub 用户信息
async function getGithubUserInfo(code: string): Promise<OAuthUserInfo> {
  // 获取 access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    throw new Error('Failed to get GitHub access token');
  }

  // 获取用户信息
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  const userData = await userResponse.json();

  // 获取用户邮箱
  const emailResponse = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  const emails = await emailResponse.json();
  const primaryEmail = emails.find((e: { primary: boolean; email: string }) => e.primary)?.email ||
                       emails[0]?.email;

  return {
    id: String(userData.id),
    email: primaryEmail,
    name: userData.name || userData.login,
    avatarUrl: userData.avatar_url,
  };
}

// 获取 Google 用户信息
async function getGoogleUserInfo(code: string): Promise<OAuthUserInfo> {
  const redirectUri = `${process.env.APP_URL}/api/oauth/callback/google`;

  // 获取 access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    throw new Error('Failed to get Google access token');
  }

  // 获取用户信息
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const userData = await userResponse.json();

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    avatarUrl: userData.picture,
  };
}

const OAUTH_HANDLERS: Record<OAuthProvider, (code: string) => Promise<OAuthUserInfo>> = {
  github: getGithubUserInfo,
  google: getGoogleUserInfo,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return error(req, res, 'Method not allowed', 405);
  }

  const { provider } = req.query;
  const { code, state, error: oauthError } = req.query;

  // 从 cookie 获取 state 验证
  const cookies = req.headers.cookie || '';
  const stateCookie = cookies.match(/oauth_state=([^;]+)/)?.[1];
  const providerCookie = cookies.match(/oauth_provider=([^;]+)/)?.[1];

  // OAuth 错误处理
  if (oauthError) {
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    return res.redirect(`${appUrl}/login?error=${encodeURIComponent(oauthError as string)}`);
  }

  // State 验证
  if (!stateCookie || stateCookie !== state) {
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    return res.redirect(`${appUrl}/login?error=invalid_state`);
  }

  // Provider 验证
  if (!code || provider !== providerCookie) {
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    return res.redirect(`${appUrl}/login?error=invalid_request`);
  }

  const oauthProvider = provider as OAuthProvider;
  const handler = OAUTH_HANDLERS[oauthProvider];

  if (!handler) {
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    return res.redirect(`${appUrl}/login?error=invalid_provider`);
  }

  try {
    // 获取 OAuth 用户信息
    const oauthUser = await handler(code as string);

    if (!oauthUser.email) {
      const appUrl = process.env.APP_URL || 'http://localhost:5173';
      return res.redirect(`${appUrl}/login?error=no_email`);
    }

    // 查找或创建用户
    let user = await queryOne<{ id: string; email: string; nickname: string }>(
      `SELECT u.id, u.email, u.nickname
       FROM users u
       JOIN oauth_accounts oa ON u.id = oa.user_id
       WHERE oa.provider = $1 AND oa.provider_user_id = $2`,
      [oauthProvider, oauthUser.id]
    );

    if (!user) {
      // 检查是否已有相同邮箱的用户
      user = await queryOne<{ id: string; email: string; nickname: string }>(
        'SELECT id, email, nickname FROM users WHERE email = $1',
        [oauthUser.email.toLowerCase()]
      );

      if (user) {
        // 关联 OAuth 账号
        await query(
          `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, provider_data)
           VALUES ($1, $2, $3, $4)`,
          [user.id, oauthProvider, oauthUser.id, JSON.stringify({ avatarUrl: oauthUser.avatarUrl })]
        );
      } else {
        // 创建新用户
        user = await queryOne<{ id: string; email: string; nickname: string }>(
          `INSERT INTO users (email, nickname, avatar_url)
           VALUES ($1, $2, $3)
           RETURNING id, email, nickname`,
          [oauthUser.email.toLowerCase(), oauthUser.name || oauthUser.email.split('@')[0], oauthUser.avatarUrl]
        );

        if (user) {
          // 创建 OAuth 关联
          await query(
            `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, provider_data)
             VALUES ($1, $2, $3, $4)`,
            [user.id, oauthProvider, oauthUser.id, JSON.stringify({ avatarUrl: oauthUser.avatarUrl })]
          );
        }
      }
    }

    if (!user) {
      throw new Error('Failed to create or find user');
    }

    // 生成 Token
    const { accessToken, refreshToken } = await signTokens(user.id);

    // 清除 OAuth cookies
    res.setHeader('Set-Cookie', [
      'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
      'oauth_provider=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    ]);

    // 重定向到前端回调页面
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const callbackUrl = new URL('/auth/callback', appUrl);
    callbackUrl.searchParams.set('accessToken', accessToken);
    callbackUrl.searchParams.set('refreshToken', refreshToken);

    res.redirect(callbackUrl.toString());
  } catch (err) {
    console.error('OAuth callback error:', err);
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    res.redirect(`${appUrl}/login?error=oauth_failed`);
  }
}