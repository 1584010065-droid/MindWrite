/**
 * API 辅助工具
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  process.env.APP_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

/**
 * CORS 中间件
 */
export function corsHeaders(req: VercelRequest): Record<string, string> {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * 处理 OPTIONS 预检请求
 */
export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    res.status(200).set(corsHeaders(req)).end();
    return true;
  }
  return false;
}

/**
 * 成功响应
 */
export function success<T>(req: VercelRequest, res: VercelResponse, data: T, status = 200): void {
  res.status(status).json(data).set(corsHeaders(req));
}

/**
 * 错误响应
 */
export function error(req: VercelRequest, res: VercelResponse, message: string, status = 400): void {
  res.status(status).json({ error: message }).set(corsHeaders(req));
}

/**
 * 未授权响应
 */
export function unauthorized(req: VercelRequest, res: VercelResponse, message = 'Unauthorized'): void {
  error(req, res, message, 401);
}

/**
 * 从请求头获取用户ID
 */
export function getUserId(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  // 动态导入避免循环依赖
  const { verifyAccessToken } = { verifyAccessToken: (t: string) => {
    try {
      const jwt = require('jsonwebtoken');
      return jwt.verify(t, process.env.JWT_SECRET || '');
    } catch {
      return null;
    }
  } };
  const payload = verifyAccessToken(token);

  return payload?.userId ?? null;
}

/**
 * 解析请求体
 */
export async function parseBody<T>(req: VercelRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}