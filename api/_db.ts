/**
 * 数据库操作封装
 */
import { Pool } from '@neondatabase/serverless';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });
  }
  return pool;
}

export async function query<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const p = getPool();
  const result = await p.query(sql, params);
  return result.rows as T[];
}

export async function queryOne<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<void> {
  const p = getPool();
  await p.query(sql, params);
}

// 关闭连接池（主要用于调试）
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}