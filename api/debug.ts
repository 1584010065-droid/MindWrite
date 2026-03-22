import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const steps: string[] = [];

  try {
    // Step 1: 检查环境变量
    steps.push('Checking env vars...');
    const dbUrl = process.env.DATABASE_URL;
    const jwtSecret = process.env.JWT_SECRET;

    if (!dbUrl) throw new Error('DATABASE_URL not set');
    if (!jwtSecret) throw new Error('JWT_SECRET not set');
    steps.push('Env vars OK');

    // Step 2: 连接数据库
    steps.push('Connecting to DB...');
    const pool = new Pool({ connectionString: dbUrl, ssl: true });
    steps.push('DB connected');

    // Step 3: 测试查询
    steps.push('Testing query...');
    const result = await pool.query('SELECT COUNT(*) FROM users');
    steps.push(`Users count: ${result.rows[0].count}`);

    // Step 4: 测试 bcrypt
    steps.push('Testing bcrypt...');
    const hash = await bcrypt.hash('test', 10);
    const isValid = await bcrypt.compare('test', hash);
    if (!isValid) throw new Error('bcrypt comparison failed');
    steps.push('bcrypt OK');

    await pool.end();

    res.status(200).json({ success: true, steps });
  } catch (error) {
    steps.push(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ success: false, steps, error: error instanceof Error ? error.message : String(error) });
  }
}