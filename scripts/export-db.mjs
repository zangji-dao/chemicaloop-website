import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

// 连接沙箱数据库
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function exportDatabase() {
  console.log('📤 开始导出沙箱数据库...\n');

  try {
    // 获取所有表
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    console.log(`发现 ${tablesResult.rows.length} 个表：`);
    tablesResult.rows.forEach(row => console.log(`  - ${row.tablename}`));
    console.log('');

    let sqlOutput = '-- Chemicaloop 数据库导出\n';
    sqlOutput += `-- 导出时间: ${new Date().toISOString()}\n\n`;

    // 导出每个表的结构和数据
    for (const { tablename } of tablesResult.rows) {
      console.log(`导出表: ${tablename}`);
      
      // 获取表结构
      const createTableResult = await pool.query(`
        SELECT 
          'CREATE TABLE IF NOT EXISTS ' || quote_ident('${tablename}') || ' (' ||
          string_agg(
            quote_ident(column_name) || ' ' || 
            CASE 
              WHEN data_type = 'USER-DEFINED' THEN udt_name
              WHEN data_type = 'character varying' THEN 'varchar(' || COALESCE(character_maximum_length::text, '') || ')'
              WHEN data_type = 'character' THEN 'char(' || COALESCE(character_maximum_length::text, '') || ')'
              WHEN data_type = 'numeric' THEN 'numeric(' || COALESCE(numeric_precision::text, '') || ',' || COALESCE(numeric_scale::text, '') || ')'
              ELSE data_type
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
            ', '
          ) || ');' as create_stmt
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${tablename}'
      `);

      if (createTableResult.rows[0]?.create_stmt) {
        sqlOutput += `-- 表: ${tablename}\n`;
        sqlOutput += `DROP TABLE IF EXISTS ${tablename} CASCADE;\n`;
        sqlOutput += createTableResult.rows[0].create_stmt + '\n\n';
      }

      // 获取数据
      const dataResult = await pool.query(`SELECT * FROM ${tablename}`);
      
      if (dataResult.rows.length > 0) {
        console.log(`  - ${dataResult.rows.length} 条记录`);
        
        for (const row of dataResult.rows) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          });
          
          sqlOutput += `INSERT INTO ${tablename} (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        sqlOutput += '\n';
      } else {
        console.log(`  - 0 条记录（空表）`);
      }
    }

    // 写入文件
    const outputPath = '/tmp/chemicaloop-export.sql';
    fs.writeFileSync(outputPath, sqlOutput);
    
    console.log(`\n✅ 导出完成: ${outputPath}`);
    console.log(`文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('导出失败:', error);
  } finally {
    await pool.end();
  }
}

exportDatabase();
