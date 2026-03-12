/**
 * 中国海关数据导入脚本
 * 
 * 从 CSV 文件导入海关数据到数据库
 * 
 * 使用方法:
 * npx tsx scripts/import-customs-data.ts <csv_file_path>
 */

import fs from 'fs';
import path from 'path';
import { getDb } from 'coze-coding-dev-sdk';
import * as schema from '../../src/storage/database/shared/schema';
import { sql } from 'drizzle-orm';

// 解析 CSV 行（处理引号）
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// 解析金额（移除逗号）
function parseValue(valueStr: string): number {
  if (!valueStr) return 0;
  const cleaned = valueStr.replace(/,/g, '').trim();
  return parseFloat(cleaned) || 0;
}

// 解析年月
function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const ym = yearMonth.trim();
  return {
    year: parseInt(ym.substring(0, 4)),
    month: parseInt(ym.substring(4, 6)),
  };
}

async function importCustomsData(csvPath: string) {
  console.log(`开始导入海关数据: ${csvPath}`);
  
  // 读取文件
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    console.error('文件为空或只有标题行');
    return;
  }
  
  // 解析标题
  const headers = parseCSVLine(lines[0]);
  console.log('CSV 列:', headers);
  
  // 获取列索引
  const colIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    colIndex[h] = i;
  });
  
  // 数据行
  const dataLines = lines.slice(1);
  console.log(`共 ${dataLines.length} 条数据记录`);
  
  // 批量插入
  const batchSize = 500;
  let processed = 0;
  let inserted = 0;
  
  const db = await getDb(schema);
  
  // 清空现有数据
  console.log('清空现有数据...');
  await db.delete(schema.customsData);
  
  for (let i = 0; i < dataLines.length; i += batchSize) {
    const batch = dataLines.slice(i, i + batchSize);
    const records: any[] = [];
    
    for (const line of batch) {
      if (!line.trim()) continue;
      
      const cols = parseCSVLine(line);
      if (cols.length < 10) continue;
      
      const yearMonth = cols[0];
      const { year, month } = parseYearMonth(yearMonth);
      
      records.push({
        yearMonth,
        year,
        month,
        hsCode: cols[1] || '',
        productName: cols[2] || '',
        partnerCode: cols[3] || '',
        partnerName: cols[4] || '',
        tradeModeCode: cols[5] || '',
        tradeModeName: cols[6] || '',
        regionCode: cols[7] || '',
        regionName: cols[8] || '',
        value: parseValue(cols[9]),
      });
      
      processed++;
    }
    
    if (records.length > 0) {
      try {
        await db.insert(schema.customsData).values(records);
        inserted += records.length;
        console.log(`已导入 ${inserted}/${dataLines.length} 条记录`);
      } catch (err) {
        console.error('批量插入失败:', err);
      }
    }
  }
  
  console.log(`\n导入完成!`);
  console.log(`- 处理: ${processed} 条`);
  console.log(`- 成功: ${inserted} 条`);
  
  // 验证数据
  const result = await db.execute(sql`SELECT COUNT(*) as cnt FROM customs_data`);
  console.log(`数据库记录数: ${result.rows[0]?.cnt}`);
  
  // 数据概览
  const overview = await db.execute(sql`
    SELECT 
      MIN(year_month) as min_month,
      MAX(year_month) as max_month,
      COUNT(DISTINCT partner_name) as partner_count,
      COUNT(DISTINCT region_name) as region_count,
      SUM(value) as total_value
    FROM customs_data
  `);
  
  console.log('\n数据概览:');
  console.log(overview.rows[0]);
}

// 主函数
async function main() {
  const csvPath = process.argv[2] || '/tmp/customs_data.csv';
  
  try {
    await importCustomsData(csvPath);
    process.exit(0);
  } catch (err) {
    console.error('导入失败:', err);
    process.exit(1);
  }
}

main();
