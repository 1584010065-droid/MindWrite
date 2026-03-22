import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    return res.status(500).json({ error: 'DATABASE_URL not set' });
  }

  try {
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: true,
    });

    const result = await pool.query('SELECT NOW() as time');
    await pool.end();

    res.status(200).json({
      message: 'Database connection successful!',
      time: result.rows[0].time,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}