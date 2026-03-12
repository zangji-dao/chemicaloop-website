/**
 * 批量翻译产品脚本
 * 
 * 用法: npx tsx scripts/batch-translate-products.ts
 * 
 * 翻译产品的 name, description, applications 到目标语言
 */

import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '../../src/storage/database/shared/schema';

const TARGET_LANGUAGE = 'zh';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const BATCH_SIZE = 5;

async function main() {
  console.log(`\n🚀 开始批量翻译产品到 ${TARGET_LANGUAGE}\n`);
  
  const db = await getDb(schema);

  // 获取需要翻译的产品
  const productsResult = await db.execute(sql`
    SELECT id, cas, name, name_en, description, applications, translations
    FROM products
    WHERE name IS NOT NULL OR description IS NOT NULL OR applications IS NOT NULL
    ORDER BY created_at DESC
  `);

  const products = productsResult.rows;
  console.log(`📦 共找到 ${products.length} 个产品需要处理\n`);

  const results = {
    total: products.length,
    translated: 0,
    skipped: 0,
    failed: 0,
  };

  for (let i = 0; i < products.length; i++) {
    const product = products[i] as any;
    const existingTranslations = product.translations || {};
    const translations = { ...existingTranslations };
    let needsUpdate = false;

    console.log(`[${i + 1}/${products.length}] 处理: ${product.cas}`);

    try {
      // 翻译名称
      if (product.name && !translations.name?.[TARGET_LANGUAGE]) {
        console.log(`  📝 翻译名称: ${product.name}`);
        const translatedName = await translateText(product.name);
        if (translatedName && translatedName !== product.name) {
          if (!translations.name) translations.name = {};
          translations.name[TARGET_LANGUAGE] = translatedName;
          needsUpdate = true;
          console.log(`  ✅ 名称翻译完成: ${translatedName}`);
        }
        await sleep(300);
      }

      // 翻译描述
      if (product.description && !translations.description?.[TARGET_LANGUAGE]) {
        console.log(`  📝 翻译描述...`);
        const translatedDesc = await translateText(product.description);
        if (translatedDesc && translatedDesc !== product.description) {
          if (!translations.description) translations.description = {};
          translations.description[TARGET_LANGUAGE] = translatedDesc;
          needsUpdate = true;
          console.log(`  ✅ 描述翻译完成`);
        }
        await sleep(300);
      }

      // 翻译应用
      if (product.applications && !translations.applications?.[TARGET_LANGUAGE]) {
        const applications = product.applications as string[];
        if (applications.length > 0) {
          console.log(`  📝 翻译应用 (${applications.length}个)...`);
          const translatedApps: string[] = [];
          for (const app of applications.slice(0, 5)) {
            const translatedApp = await translateText(app);
            translatedApps.push(translatedApp || app);
            await sleep(200);
          }
          if (!translations.applications) translations.applications = {};
          translations.applications[TARGET_LANGUAGE] = translatedApps;
          needsUpdate = true;
          console.log(`  ✅ 应用翻译完成`);
        }
      }

      // 更新数据库
      if (needsUpdate) {
        await db.execute(sql`
          UPDATE products
          SET translations = ${JSON.stringify(translations)}::jsonb,
              updated_at = NOW()
          WHERE id = ${product.id}
        `);
        results.translated++;
        console.log(`  💾 已保存到数据库\n`);
      } else {
        results.skipped++;
        console.log(`  ⏭️ 跳过（已有翻译）\n`);
      }

    } catch (error: any) {
      results.failed++;
      console.error(`  ❌ 失败: ${error.message}\n`);
    }
  }

  console.log(`\n📊 翻译完成！`);
  console.log(`   ✅ 成功翻译: ${results.translated}`);
  console.log(`   ⏭️ 跳过: ${results.skipped}`);
  console.log(`   ❌ 失败: ${results.failed}`);
  console.log(`   📦 总计: ${results.total}\n`);
}

async function translateText(text: string): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/ai/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage: TARGET_LANGUAGE }),
    });

    if (!response.ok) {
      console.error(`  ⚠️ 翻译API失败: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.translatedText || null;
  } catch (error) {
    console.error('  ⚠️ 翻译请求出错:', error);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
