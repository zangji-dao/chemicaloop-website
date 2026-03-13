import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { verifyAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { API_CONFIG } from '@/lib/config';

interface BatchTranslateRequest {
  targetLanguage: string;
  fields?: ('name' | 'description' | 'applications')[];
  batchSize?: number;
}

/**
 * 批量翻译产品信息
 * POST /api/admin/products/batch-translate
 * 
 * 流式返回翻译进度
 */
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAdmin(request);
    if (!auth.success) {
      return auth.status === 401 
        ? unauthorizedResponse(auth.error)
        : forbiddenResponse(auth.error);
    }

    const { targetLanguage = 'zh', fields = ['name', 'description', 'applications'], batchSize = 10 } = await request.json() as BatchTranslateRequest;

    const db = await getDb(schema);
    const baseUrl = API_CONFIG.backendURL;

    // 获取需要翻译的产品（translations 为空或不包含目标语言）
    const productsResult = await db.execute(sql`
      SELECT id, cas, name, name_en, description, applications, translations
      FROM products
      WHERE name IS NOT NULL OR description IS NOT NULL OR applications IS NOT NULL
      ORDER BY created_at DESC
    `);

    const products = productsResult.rows;
    const results = {
      total: products.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{ cas: string; status: string; message?: string }>,
    };

    console.log(`[BatchTranslate] Starting batch translation for ${products.length} products to ${targetLanguage}`);

    // 逐个处理产品
    for (const product of products) {
      const productData = product as any;
      const existingTranslations = productData.translations || {};
      const translations = { ...existingTranslations };
      let needsUpdate = false;

      try {
        // 翻译名称
        if (fields.includes('name') && productData.name) {
          const nameKey = 'name';
          if (!translations[nameKey]?.[targetLanguage]) {
            const translatedName = await translateText(baseUrl, productData.name, targetLanguage);
            if (translatedName && translatedName !== productData.name) {
              if (!translations[nameKey]) translations[nameKey] = {};
              translations[nameKey][targetLanguage] = translatedName;
              needsUpdate = true;
            }
          }
        }

        // 翻译描述
        if (fields.includes('description') && productData.description) {
          const descKey = 'description';
          if (!translations[descKey]?.[targetLanguage]) {
            const translatedDesc = await translateText(baseUrl, productData.description, targetLanguage);
            if (translatedDesc && translatedDesc !== productData.description) {
              if (!translations[descKey]) translations[descKey] = {};
              translations[descKey][targetLanguage] = translatedDesc;
              needsUpdate = true;
            }
          }
        }

        // 翻译应用（数组）
        if (fields.includes('applications') && productData.applications) {
          const appKey = 'applications';
          const applications = productData.applications as string[];
          
          if (!translations[appKey]?.[targetLanguage] && applications.length > 0) {
            const translatedApps: string[] = [];
            for (const app of applications.slice(0, 5)) { // 只翻译前5个
              const translatedApp = await translateText(baseUrl, app, targetLanguage);
              translatedApps.push(translatedApp || app);
              await sleep(200); // 避免请求过快
            }
            
            if (translatedApps.length > 0) {
              if (!translations[appKey]) translations[appKey] = {};
              translations[appKey][targetLanguage] = translatedApps;
              needsUpdate = true;
            }
          }
        }

        // 更新数据库
        if (needsUpdate) {
          await db.execute(sql`
            UPDATE products
            SET translations = ${JSON.stringify(translations)}::jsonb,
                updated_at = NOW()
            WHERE id = ${productData.id}
          `);
          results.translated++;
          results.details.push({ cas: productData.cas, status: 'translated' });
          console.log(`[BatchTranslate] Translated: ${productData.cas}`);
        } else {
          results.skipped++;
          results.details.push({ cas: productData.cas, status: 'skipped', message: 'Already translated' });
        }

        // 避免请求过快
        await sleep(300);

      } catch (error: any) {
        results.failed++;
        results.details.push({ cas: productData.cas, status: 'failed', message: error.message });
        console.error(`[BatchTranslate] Failed: ${productData.cas}`, error.message);
      }
    }

    console.log(`[BatchTranslate] Completed: ${results.translated} translated, ${results.skipped} skipped, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Batch translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to batch translate' },
      { status: 500 }
    );
  }
}

/**
 * 调用翻译API
 */
async function translateText(baseUrl: string, text: string, targetLang: string): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/api/ai/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage: targetLang }),
    });

    if (!response.ok) {
      console.error(`[Translate] API failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.translatedText || null;
  } catch (error) {
    console.error('[Translate] Error:', error);
    return null;
  }
}

/**
 * 延迟函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
