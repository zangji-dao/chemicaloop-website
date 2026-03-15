/**
 * 批量更新 SPU HS 编码脚本
 * 
 * 运行方式：npx tsx scripts/update-hs-codes.ts
 */

import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 常见化学品 HS 编码参考表
const HS_CODE_REFERENCE: Record<string, { code: string; description: string }> = {
  // 农药类（杀虫剂、杀螨剂、除草剂等）
  'glyphosate': { code: '380893', description: '草甘膦除草剂' },
  'spirodiclofen': { code: '380893', description: '螺螨酯杀螨剂' },
  'abamectin': { code: '380893', description: '阿维菌素杀虫剂' },
  'imidacloprid': { code: '380893', description: '吡虫啉杀虫剂' },
  'chlorpyrifos': { code: '380893', description: '毒死蜱杀虫剂' },
  'cypermethrin': { code: '380893', description: '氯氰菊酯杀虫剂' },
  '2,4-dichlorophenoxyacetic acid': { code: '380893', description: '2,4-滴除草剂' },
  
  // 无机化学品
  'ferric chloride': { code: '282739', description: '三氯化铁' },
  'iron chloride': { code: '282739', description: '氯化铁' },
  'ferrous chloride': { code: '282739', description: '氯化亚铁' },
  'potassium iodide': { code: '282760', description: '碘化钾' },
  
  // 有机化学品
  'ethanol': { code: '220710', description: '未改性乙醇' },
  'methanol': { code: '290511', description: '甲醇' },
  'acetic acid': { code: '291521', description: '乙酸' },
  'acetone': { code: '291411', description: '丙酮' },
  'benzene': { code: '290220', description: '苯' },
  'toluene': { code: '290230', description: '甲苯' },
  'xylene': { code: '290244', description: '二甲苯' },
  'phenol': { code: '290711', description: '苯酚' },
  'formaldehyde': { code: '291211', description: '甲醛' },
  'urea': { code: '310210', description: '尿素' },
  'sodium hydroxide': { code: '281512', description: '氢氧化钠' },
  'hydrogen peroxide': { code: '284700', description: '过氧化氢' },
  'ammonia': { code: '281410', description: '氨' },
  'sulfuric acid': { code: '280700', description: '硫酸' },
  'hydrochloric acid': { code: '280610', description: '盐酸' },
  'nitric acid': { code: '280800', description: '硝酸' },
  'phosphoric acid': { code: '280920', description: '磷酸' },
  '1,3-butadiene': { code: '290124', description: '丁二烯' },
  'd-glucopyranose': { code: '294000', description: '葡萄糖' },
};

// HS 编码章节描述
const HS_CHAPTERS: Record<string, string> = {
  '28': 'Inorganic chemicals',
  '29': 'Organic chemicals',
  '30': 'Pharmaceutical products',
  '31': 'Fertilizers',
  '32': 'Dyes, pigments, paints',
  '33': 'Essential oils, cosmetics',
  '34': 'Soaps, detergents',
  '35': 'Albuminoidal substances',
  '38': 'Miscellaneous chemical products',
};

async function matchHSCode(
  cas: string,
  name: string,
  nameEn: string,
  formula?: string
): Promise<{ hsCode: string; confidence: number; source: string } | null> {
  // 1. 先从参考表查找
  const searchName = (nameEn || name || '').toLowerCase();
  for (const [chemical, info] of Object.entries(HS_CODE_REFERENCE)) {
    if (searchName.includes(chemical) || chemical.includes(searchName)) {
      return {
        hsCode: info.code,
        confidence: 0.95,
        source: 'reference',
      };
    }
  }
  
  // 2. 使用 LLM 智能匹配
  try {
    const config = new Config();
    const client = new LLMClient(config);

    const systemPrompt = `You are a customs tariff expert specializing in HS Code classification.
Your task is to determine the most appropriate 6-digit HS (Harmonized System) code for a chemical product.

Rules:
1. Return ONLY a JSON object, no other text
2. The JSON must have these fields: hsCode (6 digits), confidence (0-1), description (brief explanation)
3. HS Code must be exactly 6 digits
4. If uncertain, provide your best estimate with lower confidence

Common HS Code chapters for chemicals:
- Chapter 28: Inorganic chemicals (e.g., ferric chloride = 282739)
- Chapter 29: Organic chemicals
- Chapter 30: Pharmaceutical products
- Chapter 38: Miscellaneous chemical products (includes herbicides like glyphosate)

For herbicides and pesticides, typically use:
- 380893: Herbicides, anti-sprouting products and plant-growth regulators
- 291890: Carboxylic acids with additional oxygen function (like 2,4-D)

Example responses:
{"hsCode": "282739", "confidence": 0.95, "description": "Ferric chloride - inorganic salt"}
{"hsCode": "380893", "confidence": 0.90, "description": "Glyphosate herbicide"}`;

    const userContent = `Please classify this chemical product:
- CAS: ${cas || 'N/A'}
- Name (Chinese): ${name || 'N/A'}
- Name (English): ${nameEn || 'N/A'}
- Formula: ${formula || 'N/A'}

Return the 6-digit HS code.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userContent },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.3,
      model: 'doubao-seed-1-8-251228',
    });

    // 解析 LLM 响应
    const content = response.content.trim();
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      if (result.hsCode && /^\d{6}$/.test(result.hsCode)) {
        return {
          hsCode: result.hsCode,
          confidence: result.confidence || 0.8,
          source: 'ai',
        };
      }
    }
    
    // 尝试从响应中提取 6 位数字
    const codeMatch = content.match(/\b(\d{6})\b/);
    if (codeMatch) {
      return {
        hsCode: codeMatch[1],
        confidence: 0.7,
        source: 'ai',
      };
    }
  } catch (error) {
    console.error('LLM error:', error);
  }
  
  return null;
}

async function main() {
  console.log('=== 开始更新 HS 编码 ===\n');
  
  const db = await getDb(schema);
  
  // 获取没有 HS 编码的 SPU
  const result = await db.execute(sql`
    SELECT id, cas, name, name_en, formula 
    FROM products 
    WHERE hs_code IS NULL AND status = 'ACTIVE'
  `);
  
  if (result.rows.length === 0) {
    console.log('没有需要更新的 SPU');
    return;
  }
  
  console.log(`找到 ${result.rows.length} 个需要更新的 SPU:\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (const row of result.rows) {
    const spu = row as any;
    console.log(`处理: ${spu.name} (${spu.name_en})`);
    console.log(`  CAS: ${spu.cas}`);
    
    const match = await matchHSCode(
      spu.cas,
      spu.name,
      spu.name_en,
      spu.formula
    );
    
    if (match) {
      // 更新数据库
      await db.execute(sql`
        UPDATE products 
        SET hs_code = ${match.hsCode}, updated_at = NOW()
        WHERE id = ${spu.id}
      `);
      
      console.log(`  ✓ HS编码: ${match.hsCode} (置信度: ${match.confidence}, 来源: ${match.source})`);
      updated++;
    } else {
      console.log(`  ✗ 无法匹配 HS 编码`);
      failed++;
    }
    
    console.log('');
  }
  
  console.log('=== 更新完成 ===');
  console.log(`成功: ${updated}`);
  console.log(`失败: ${failed}`);
}

main().catch(console.error);
