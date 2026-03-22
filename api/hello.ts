// 使用 CommonJS 语法
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: 'Hello from API!',
    time: new Date().toISOString()
  });
}