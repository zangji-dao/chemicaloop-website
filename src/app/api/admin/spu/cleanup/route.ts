import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';

/**
 * POST /api/admin/spu/cleanup
 * 清理重复数据
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const body = await request.json();
    const { dryRun = true } = body;

    // 获取所有产品
    const result = await db.execute(sql`
      SELECT id, cas, hazard_classes, health_hazards, ghs_classification, translations
      FROM products
    `);

    const cleaned: any[] = [];
    const errors: string[] = [];

    for (const row of result.rows as any[]) {
      const updates: Record<string, any> = {};
      let needsUpdate = false;

      // 清理 hazard_classes
      if (row.hazard_classes) {
        const cleaned_hc = dedupeText(row.hazard_classes);
        if (cleaned_hc !== row.hazard_classes) {
          updates.hazard_classes = cleaned_hc;
          needsUpdate = true;
        }
      }

      // 清理 health_hazards
      if (row.health_hazards) {
        const cleaned_hh = dedupeText(row.health_hazards);
        if (cleaned_hh !== row.health_hazards) {
          updates.health_hazards = cleaned_hh;
          needsUpdate = true;
        }
      }

      // 清理 ghs_classification
      if (row.ghs_classification) {
        const cleaned_ghs = dedupeText(row.ghs_classification);
        if (cleaned_ghs !== row.ghs_classification) {
          updates.ghs_classification = cleaned_ghs;
          needsUpdate = true;
        }
      }

      // 清理 translations 中的重复
      if (row.translations) {
        const trans = row.translations;
        const transUpdates: Record<string, Record<string, string>> = {};
        let transNeedsUpdate = false;

        for (const field of ['hazardClasses', 'healthHazards', 'ghsClassification', 'firstAid', 'storageConditions', 'incompatibleMaterials', 'boilingPoint', 'meltingPoint', 'flashPoint']) {
          if (trans[field]) {
            const fieldTrans: Record<string, string> = {};
            for (const [lang, value] of Object.entries(trans[field])) {
              if (typeof value === 'string') {
                const cleaned = dedupeText(value);
                if (cleaned !== value) {
                  fieldTrans[lang] = cleaned;
                  transNeedsUpdate = true;
                }
              }
            }
            if (Object.keys(fieldTrans).length > 0) {
              transUpdates[field] = fieldTrans;
            }
          }
        }

        if (transNeedsUpdate) {
          // 合并更新
          updates.translations = { ...trans };
          for (const [field, langValues] of Object.entries(transUpdates)) {
            updates.translations[field] = { ...updates.translations[field], ...langValues };
          }
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        cleaned.push({
          id: row.id,
          cas: row.cas,
          ...updates,
        });

        if (!dryRun) {
          // 执行更新
          if (updates.hazard_classes) {
            await db.execute(sql`
              UPDATE products SET hazard_classes = ${updates.hazard_classes}, updated_at = NOW()
              WHERE id = ${row.id}
            `);
          }
          if (updates.health_hazards) {
            await db.execute(sql`
              UPDATE products SET health_hazards = ${updates.health_hazards}, updated_at = NOW()
              WHERE id = ${row.id}
            `);
          }
          if (updates.ghs_classification) {
            await db.execute(sql`
              UPDATE products SET ghs_classification = ${updates.ghs_classification}, updated_at = NOW()
              WHERE id = ${row.id}
            `);
          }
          if (updates.translations) {
            await db.execute(sql`
              UPDATE products SET translations = ${JSON.stringify(updates.translations)}::jsonb, updated_at = NOW()
              WHERE id = ${row.id}
            `);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      cleanedCount: cleaned.length,
      cleaned: cleaned.slice(0, 20), // 返回前 20 条预览
      totalAffected: cleaned.length,
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * 去重文本中的重复项（支持多种分隔符）
 */
function dedupeText(text: string): string {
  if (!text) return text;
  
  // 尝试不同的分隔符，优先换行
  let sep = '\n';
  let items: string[] = [];
  
  if (text.includes('\n')) {
    items = text.split('\n');
    sep = '\n';
  } else if (text.includes('、')) {
    items = text.split('、');
    sep = '、';
  } else if (text.includes(', ')) {
    items = text.split(', ');
    sep = ', ';
  } else if (text.includes(',')) {
    items = text.split(',');
    sep = ', ';
  } else {
    return text; // 无法分割，直接返回
  }

  items = items.map(item => item.trim()).filter(item => item);
  
  const seen = new Set<string>();
  const unique: string[] = [];
  
  for (const item of items) {
    // 提取 H 代码作为唯一标识（如 H225, H302）
    const hCodeMatch = item.match(/^H\d+/i);
    const key = hCodeMatch ? hCodeMatch[0].toLowerCase() : item.toLowerCase();
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }
  
  return unique.join(sep);
}
