/**
 * 数据库迁移脚本
 * 执行: node scripts/migrate.js
 */
import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 环境变量未设置');
    process.exit(1);
  }

  console.log('🔗 连接数据库...');
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('📄 读取 Schema 文件...');
    const schema = readFileSync(join(__dirname, '../api/schema.sql'), 'utf8');

    console.log('🚀 执行迁移...');
    await pool.query(schema);

    console.log('✅ 数据库迁移成功!');

    // 验证表是否创建成功
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 已创建的表:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();