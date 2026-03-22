/**
 * Neon PostgreSQL 数据库连接池
 */
import { Pool } from '@neondatabase/serverless';

// 使用全局变量避免在开发模式下创建多个连接池
const globalForDb = globalThis as unknown as { pool: Pool | undefined };

export const pool = globalForDb.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
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