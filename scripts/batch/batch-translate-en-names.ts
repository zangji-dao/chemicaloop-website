import { assertDevEnvironment } from '../lib/env-check';
assertDevEnvironment();

/**
 * 批量翻译产品英文名称脚本
 * 
 * 用法: npx tsx scripts/batch-translate-en-names.ts
 * 
 * 为产品生成英文名称翻译
 */

import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '../../src/storage/database/shared/schema';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// 检测是否包含中文
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

// 检测是否包含日文
function containsJapanese(text: string): boolean {
  return /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
}

// 检测是否主要是英文
function isMainlyEnglish(text: string): boolean {
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const japaneseChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  return englishChars > chineseChars + japaneseChars;
}

async function main() {
  console.log(`\n🔧 批量翻译产品英文名称\n`);
  
  const db = await getDb(schema);

  // 获取所有产品
  const productsResult = await db.execute(sql`
    SELECT id, cas, name, name_en, translations
    FROM products
    ORDER BY created_at DESC
  `);

  const products = productsResult.rows;
  console.log(`📦 共找到 ${products.length} 个产品\n`);

  const results = {
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  for (let i = 0; i < products.length; i++) {
    const product = products[i] as any;
    const existingTranslations = product.translations || {};
    const translations = { ...existingTranslations };

    console.log(`[${i + 1}/${products.length}] 处理: ${product.cas}`);
    console.log(`  name: ${product.name}`);
    console.log(`  nameEn: ${product.name_en || '(空)'}`);

    try {
      // 确定需要翻译的名称和目标
      let needEnglishTranslate = false;
      let needChineseTranslate = false;
      let sourceForEnglish = '';
      let sourceForChinese = '';

      // 分析现有数据
      const nameIsChinese = containsChinese(product.name) && !isMainlyEnglish(product.name);
      const nameIsEnglish = isMainlyEnglish(product.name) && !containsChinese(product.name) && !containsJapanese(product.name);
      const nameEnIsChinese = product.name_en && containsChinese(product.name_en) && !isMainlyEnglish(product.name_en);
      const nameEnIsEnglish = product.name_en && isMainlyEnglish(product.name_en);

      // 英文翻译
      if (!translations.name?.['en']) {
        if (nameIsEnglish) {
          // name本身就是英文
          if (!translations.name) translations.name = {};
          translations.name['en'] = product.name;
          console.log(`  ✅ name是英文，直接使用: ${product.name}`);
        } else if (nameEnIsEnglish) {
          // nameEn是英文
          if (!translations.name) translations.name = {};
          translations.name['en'] = product.name_en;
          console.log(`  ✅ nameEn是英文，直接使用: ${product.name_en}`);
        } else if (nameIsChinese && product.name_en && !containsChinese(product.name_en) && !containsJapanese(product.name_en)) {
          // name是中文，nameEn是英文（但没被检测到）
          if (!translations.name) translations.name = {};
          translations.name['en'] = product.name_en;
          console.log(`  ✅ nameEn作为英文: ${product.name_en}`);
        } else {
          // 需要翻译成英文
          needEnglishTranslate = true;
          sourceForEnglish = nameIsChinese ? product.name : (product.name_en || product.name);
        }
      }

      // 中文翻译
      if (!translations.name?.['zh']) {
        if (nameIsChinese) {
          // name本身就是中文
          if (!translations.name) translations.name = {};
          translations.name['zh'] = product.name;
          console.log(`  ✅ name是中文，直接使用: ${product.name}`);
        } else if (nameEnIsChinese) {
          // nameEn是中文
          if (!translations.name) translations.name = {};
          translations.name['zh'] = product.name_en;
          console.log(`  ✅ nameEn是中文，直接使用: ${product.name_en}`);
        } else {
          // 需要翻译成中文
          needChineseTranslate = true;
          sourceForChinese = nameIsEnglish ? product.name : (product.name_en || product.name);
        }
      }

      // 翻译英文
      if (needEnglishTranslate && sourceForEnglish) {
        console.log(`  📝 翻译英文名: ${sourceForEnglish}`);
        const translated = await translateToEnglish(sourceForEnglish);
        if (translated) {
          if (!translations.name) translations.name = {};
          translations.name['en'] = translated;
          console.log(`  ✅ 英文翻译完成: ${translated}`);
        }
        await sleep(300);
      }

      // 翻译中文
      if (needChineseTranslate && sourceForChinese) {
        console.log(`  📝 翻译中文名: ${sourceForChinese}`);
        const translated = await translateToChinese(sourceForChinese);
        if (translated) {
          if (!translations.name) translations.name = {};
          translations.name['zh'] = translated;
          console.log(`  ✅ 中文翻译完成: ${translated}`);
        }
        await sleep(300);
      }

      // 更新数据库
      if (translations.name && Object.keys(translations.name).length > 0) {
        await db.execute(sql`
          UPDATE products
          SET translations = ${JSON.stringify(translations)}::jsonb,
              updated_at = NOW()
          WHERE id = ${product.id}
        `);
        results.updated++;
        console.log(`  💾 已保存\n`);
      } else {
        results.skipped++;
        console.log(`  ⏭️ 跳过\n`);
      }

    } catch (error: any) {
      results.failed++;
      console.error(`  ❌ 失败: ${error.message}\n`);
    }
  }

  console.log(`\n📊 完成！`);
  console.log(`   ✅ 更新: ${results.updated}`);
  console.log(`   ⏭️ 跳过: ${results.skipped}`);
  console.log(`   ❌ 失败: ${results.failed}\n`);
}

async function translateToEnglish(text: string): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/ai/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage: 'en' }),
    });
    const data = await response.json();
    return data.translatedText || null;
  } catch (error) {
    console.error('翻译英文失败:', error);
    return null;
  }
}

async function translateToChinese(text: string): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/ai/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage: 'zh' }),
    });
    const data = await response.json();
    return data.translatedText || null;
  } catch (error) {
    console.error('翻译中文失败:', error);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
