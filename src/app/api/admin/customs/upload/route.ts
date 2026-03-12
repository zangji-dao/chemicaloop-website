import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import * as schema from '@/storage/database/shared/schema';

/**
 * POST /api/customs-data/upload
 * 批量上传海关 CSV 数据
 * 
 * 支持 multipart/form-data 上传多个 CSV 文件
 * 参数:
 * - files: CSV 文件列表
 * - source: 数据源 (china|un, 默认 china)
 * - clearExisting: 是否清空现有数据
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const source = formData.get('source') as string || 'china';
    const clearExisting = formData.get('clearExisting') === 'true';
    
    if (files.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '请选择要上传的 CSV 文件' 
      }, { status: 400 });
    }
    
    // 根据数据源选择表（目前只有 china，后续可扩展 un 表）
    // const tableName = source === 'un' ? 'un_trade_data' : 'customs_data';
    
    const db = await getDb(schema);
    
    // 是否清空现有数据
    if (clearExisting) {
      await db.delete(schema.customsData);
    }
    
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalSkipped = 0;
    const errors: string[] = [];
    const yearStats: Record<number, { records: number; value: number }> = {};
    
    for (const file of files) {
      try {
        // 读取文件内容
        const buffer = await file.arrayBuffer();
        let content = new TextDecoder().decode(buffer);
        
        // 尝试 GBK 解码（中国海关数据通常是 GBK 编码）
        try {
          const gbkBuffer = Buffer.from(buffer);
          content = gbkBuffer.toString('utf8');
          // 检查是否有乱码，如果有则尝试 GBK
          if (content.includes('�') || content.includes('')) {
            const iconv = require('iconv-lite');
            content = iconv.decode(Buffer.from(buffer), 'gbk');
          }
        } catch (e) {
          // 使用 UTF-8
        }
        
        // 解析 CSV
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          errors.push(`${file.name}: 文件为空或只有标题行`);
          continue;
        }
        
        // 解析标题
        const headers = parseCSVLine(lines[0]);
        const colIndex: Record<string, number> = {};
        headers.forEach((h, i) => {
          colIndex[h.trim()] = i;
        });
        
        // 验证必需列
        const requiredCols = ['数据年月', '贸易伙伴名称', '注册地名称', '美元'];
        const missingCols = requiredCols.filter(col => !(col in colIndex));
        if (missingCols.length > 0) {
          errors.push(`${file.name}: 缺少必需列 ${missingCols.join(', ')}`);
          continue;
        }
        
        // 检查是否有进出口标识列（可选）
        const flowCodeCol = colIndex['进出口标志'] ?? colIndex['进出口编码'] ?? colIndex['贸易方向编码'] ?? colIndex['进出口代码'];
        const flowNameCol = colIndex['进出口名称'] ?? colIndex['进出口类型'] ?? colIndex['贸易方向'] ?? colIndex['进出口'];
        
        // 解析数据行
        const records: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const cols = parseCSVLine(line);
          if (cols.length < 10) {
            totalSkipped++;
            continue;
          }
          
          const yearMonth = cols[colIndex['数据年月']]?.trim() || '';
          const year = parseInt(yearMonth.substring(0, 4));
          const month = parseInt(yearMonth.substring(4, 6));
          
          const value = parseValue(cols[colIndex['美元']] || '0');
          
          // 解析进出口标识
          let flowCode: string | null = null;
          let flowName: string | null = null;
          if (flowCodeCol !== undefined) {
            const rawFlow = cols[flowCodeCol]?.trim() || '';
            // 常见编码: I/进口/1, E/出口/2
            if (rawFlow === 'I' || rawFlow === '进口' || rawFlow === '1') {
              flowCode = 'I';
              flowName = '进口';
            } else if (rawFlow === 'E' || rawFlow === '出口' || rawFlow === '2') {
              flowCode = 'E';
              flowName = '出口';
            } else if (rawFlow) {
              flowCode = rawFlow;
              flowName = flowNameCol !== undefined ? cols[flowNameCol]?.trim() || null : null;
            }
          }
          
          const record = {
            yearMonth,
            year,
            month,
            hsCode: cols[colIndex['商品编码']]?.trim() || '293349',
            productName: cols[colIndex['商品名称']]?.trim() || '',
            partnerCode: cols[colIndex['贸易伙伴编码']]?.trim() || '',
            partnerName: cols[colIndex['贸易伙伴名称']]?.trim() || '',
            tradeModeCode: cols[colIndex['贸易方式编码']]?.trim() || '',
            tradeModeName: cols[colIndex['贸易方式名称']]?.trim() || '',
            regionCode: cols[colIndex['注册地编码']]?.trim() || '',
            regionName: cols[colIndex['注册地名称']]?.trim() || '',
            flowCode,
            flowName,
            value,
          };
          
          records.push(record);
          
          // 统计年度数据
          if (!yearStats[year]) {
            yearStats[year] = { records: 0, value: 0 };
          }
          yearStats[year].records++;
          yearStats[year].value += value;
        }
        
        // 批量插入
        if (records.length > 0) {
          const batchSize = 500;
          for (let j = 0; j < records.length; j += batchSize) {
            const batch = records.slice(j, j + batchSize);
            try {
              await db.insert(schema.customsData).values(batch);
              totalInserted += batch.length;
            } catch (insertErr: any) {
              // 可能是重复数据，尝试逐条插入
              for (const rec of batch) {
                try {
                  await db.insert(schema.customsData).values(rec);
                  totalInserted++;
                } catch {
                  totalSkipped++;
                }
              }
            }
          }
        }
        
        totalProcessed += records.length;
        
      } catch (fileErr: any) {
        errors.push(`${file.name}: ${fileErr.message}`);
      }
    }
    
    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        filesProcessed: files.length,
        totalProcessed,
        totalInserted,
        totalSkipped,
        yearStats: Object.entries(yearStats).map(([year, stats]) => ({
          year: parseInt(year),
          records: stats.records,
          value: stats.value,
        })).sort((a, b) => a.year - b.year),
        errors: errors.length > 0 ? errors : undefined,
      }
    });
    
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || '上传处理失败' 
    }, { status: 500 });
  }
}

/**
 * 解析 CSV 行（处理引号）
 */
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

/**
 * 解析金额（移除逗号）
 */
function parseValue(valueStr: string): number {
  if (!valueStr) return 0;
  const cleaned = valueStr.replace(/,/g, '').trim();
  return parseFloat(cleaned) || 0;
}
