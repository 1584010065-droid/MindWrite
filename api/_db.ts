/**
 * Neon PostgreSQL 数据库连接池
 */
import { Pool } from '@neondatabase/serverless';

const globalForDb = globalThis as unknown as { pool: Pool | undefined };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

export const pool = globalForDb.pool ?? new Pool({
  connectionString,
  ssl: true,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

// 辅助函数：执行查询
export async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

// 辅助函数：执行单行查询
export async function queryOne<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}