/**
 * API 工具函数
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    corsHeaders(res);
    res.status(200).end();
    return true;
  }
  return false;
}

export function corsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function error(
  req: VercelRequest,
  res: VercelResponse,
  message: string,
  status: number = 400
): void {
  corsHeaders(res);
  res.status(status).json({ error: message });
}

export function success(res: VercelResponse, data: unknown, status: number = 200): void {
  corsHeaders(res);
  res.status(status).json(data);
}

export async function parseBody<T = unknown>(req: VercelRequest): Promise<T> {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }
  return JSON.parse(body || '{}');
}