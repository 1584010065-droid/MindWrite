/**
 * OAuth 跳转 API
 * GET /api/oauth/{provider}
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleOptions, error } from '../_utils';

type OAuthProvider = 'github' | 'google';

interface OAuthConfig {
  authorizeUrl: string;
  clientId: string | undefined;
  clientSecret?: string;
  scope: string;
  getParams?: (redirectUri: string, state: string) => URLSearchParams;
}

const OAUTH_CONFIGS: Record<OAuthProvider, OAuthConfig> = {
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    clientId: process.env.GITHUB_CLIENT_ID,
    scope: 'read:user user:email',
  },
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: process.env.GOOGLE_CLIENT_ID,
    scope: 'openid email profile',
    getParams: (redirectUri, state) => {
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'offline',
        prompt: 'consent',
      });
      return params;
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return error(req, res, 'Method not allowed', 405);
  }

  const { provider } = req.query;
  const config = OAUTH_CONFIGS[provider as OAuthProvider];

  if (!config || !config.clientId) {
    return error(req, res, 'Invalid OAuth provider or not configured', 400);
  }

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const redirectUri = `${appUrl}/api/oauth/callback/${provider}`;
  const state = crypto.randomUUID();

  // 设置 state cookie 用于验证
  res.setHeader('Set-Cookie', [
    `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
    `oauth_provider=${provider}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
  ]);

  // 构建授权 URL
  let authorizeUrl: string;
  if (config.getParams) {
    const params = config.getParams(redirectUri, state);
    authorizeUrl = `${config.authorizeUrl}?${params.toString()}`;
  } else {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scope,
      state,
    });
    authorizeUrl = `${config.authorizeUrl}?${params.toString()}`;
  }

  res.redirect(authorizeUrl);
}