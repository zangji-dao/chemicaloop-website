/**
 * 批量更新产品翻译脚本
 * 
 * 用法: npx tsx scripts/batch-update-all-translations.ts
 * 
 * 为所有产品翻译名称、描述、应用到所有10种语言
 */

import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '../src/storage/database/shared/schema';
import { 
  SUPPORTED_LANGUAGES, 
  translateText, 
  translateToAllLanguages,
  translateArrayToAllLanguages 
} from '../src/services/productSyncService';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function main() {
  console.log(`\n🌍 批量更新产品多语言翻译`);
  console.log(`支持的语言: ${SUPPORTED_LANGUAGES.join(', ')}\n`);
  
  const db = await getDb(schema);

  // 获取所有产品
  const productsResult = await db.execute(sql`
    SELECT id, cas, name, name_en, description, applications, translations
    FROM products
    ORDER BY created_at DESC
  `);

  const products = productsResult.rows;
  console.log(`📦 共找到 ${products.length} 个产品需要处理\n`);

  const results = {
    total: products.length,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  for (let i = 0; i < products.length; i++) {
    const product = products[i] as any;
    const existingTranslations = product.translations || {};
    const translations = { ...existingTranslations };
    let needsUpdate = false;

    console.log(`\n[${i + 1}/${products.length}] 处理: ${product.cas}`);
    console.log(`  当前名称: ${product.name || product.name_en}`);

    try {
      // 1. 翻译名称（所有语言）
      const nameToTranslate = product.name || product.name_en;
      if (nameToTranslate) {
        const existingNameLangs = Object.keys(existingTranslations.name || {});
        const missingNameLangs = SUPPORTED_LANGUAGES.filter(lang => !existingNameLangs.includes(lang));
        
        if (missingNameLangs.length > 0) {
          console.log(`  📝 翻译名称到 ${missingNameLangs.length} 种语言...`);
          
          if (!translations.name) translations.name = {};
          
          for (const lang of missingNameLangs) {
            // 英文可能直接用原文
            if (lang === 'en' && !containsChinese(nameToTranslate) && !containsJapanese(nameToTranslate)) {
              translations.name['en'] = nameToTranslate;
              console.log(`    ✅ en: ${nameToTranslate}`);
              continue;
            }
            
            // 中文可能直接用原名
            if (lang === 'zh' && containsChinese(nameToTranslate) && !containsJapanese(nameToTranslate)) {
              translations.name['zh'] = nameToTranslate;
              console.log(`    ✅ zh: ${nameToTranslate}`);
              continue;
            }
            
            const translated = await translateText(nameToTranslate, lang, BASE_URL);
            if (translated) {
              translations.name[lang] = translated;
              console.log(`    ✅ ${lang}: ${translated}`);
            }
            await sleep(200);
          }
          needsUpdate = true;
        } else {
          console.log(`  ✅ 名称已有全部翻译`);
        }
      }

      // 2. 翻译描述（所有语言）
      if (product.description) {
        const existingDescLangs = Object.keys(existingTranslations.description || {});
        const missingDescLangs = SUPPORTED_LANGUAGES.filter(lang => !existingDescLangs.includes(lang));
        
        if (missingDescLangs.length > 0) {
          console.log(`  📝 翻译描述到 ${missingDescLangs.length} 种语言...`);
          
          if (!translations.description) translations.description = {};
          
          for (const lang of missingDescLangs) {
            const translated = await translateText(product.description, lang, BASE_URL);
            if (translated) {
              translations.description[lang] = translated;
            }
            await sleep(200);
          }
          console.log(`    ✅ 描述翻译完成`);
          needsUpdate = true;
        } else {
          console.log(`  ✅ 描述已有全部翻译`);
        }
      }

      // 3. 翻译应用（所有语言）
      if (product.applications && (product.applications as string[]).length > 0) {
        const existingAppLangs = Object.keys(existingTranslations.applications || {});
        const missingAppLangs = SUPPORTED_LANGUAGES.filter(lang => !existingAppLangs.includes(lang));
        
        if (missingAppLangs.length > 0) {
          console.log(`  📝 翻译应用到 ${missingAppLangs.length} 种语言...`);
          
          if (!translations.applications) translations.applications = {};
          const apps = (product.applications as string[]).slice(0, 5);
          
          for (const lang of missingAppLangs) {
            if (!translations.applications[lang]) translations.applications[lang] = [];
            
            for (const app of apps) {
              const translated = await translateText(app, lang, BASE_URL);
              translations.applications[lang].push(translated || app);
              await sleep(200);
            }
          }
          console.log(`    ✅ 应用翻译完成`);
          needsUpdate = true;
        } else {
          console.log(`  ✅ 应用已有全部翻译`);
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
        results.updated++;
        console.log(`  💾 已保存到数据库`);
      } else {
        results.skipped++;
        console.log(`  ⏭️ 跳过（已有全部翻译）`);
      }

    } catch (error: any) {
      results.failed++;
      console.error(`  ❌ 失败: ${error.message}`);
    }
  }

  console.log(`\n\n📊 翻译完成！`);
  console.log(`   ✅ 更新: ${results.updated}`);
  console.log(`   ⏭️ 跳过: ${results.skipped}`);
  console.log(`   ❌ 失败: ${results.failed}`);
  console.log(`   📦 总计: ${results.total}\n`);
}

function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

function containsJapanese(text: string): boolean {
  return /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
