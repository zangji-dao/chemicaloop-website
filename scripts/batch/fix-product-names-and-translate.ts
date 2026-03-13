import { assertDevEnvironment } from '../lib/env-check';
assertDevEnvironment();

/**
 * 修复产品名称数据并重新翻译
 */

import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '../../src/storage/database/shared/schema';
import { SUPPORTED_LANGUAGES, translateText } from '../../src/services/productSyncService';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function detectLanguage(text: string): 'zh' | 'en' | 'ja' | 'ko' | 'mixed' | 'unknown' {
  if (!text) return 'unknown';
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
  const hasKorean = /[\uac00-\ud7af]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);
  
  if ((hasChinese || hasJapanese || hasKorean) && hasEnglish) return 'mixed';
  if (hasJapanese) return 'ja';
  if (hasKorean) return 'ko';
  if (hasChinese) return 'zh';
  if (hasEnglish) return 'en';
  return 'unknown';
}

function extractEnglish(text: string): string {
  const match = text.match(/[A-Z][a-z]+(?:\s+[A-Za-z]+)*/g);
  return match ? match.join(' ') : '';
}

function extractChinese(text: string): string {
  const match = text.match(/[\u4e00-\u9fa5]+/g);
  return match ? match.join('') : '';
}

async function main() {
  console.log(`\n🔧 修复产品名称数据\n`);
  
  const db = await getDb(schema);

  const productsResult = await db.execute(sql`
    SELECT id, cas, name, name_en, translations
    FROM products
    ORDER BY cas
  `);

  const products = productsResult.rows;
  console.log(`📦 共 ${products.length} 个产品\n`);

  for (const product of products) {
    const p = product as any;
    console.log(`\n处理: ${p.cas}`);
    console.log(`  当前 name: ${p.name}`);
    console.log(`  当前 nameEn: ${p.name_en || '(空)'}`);
    
    const nameLang = detectLanguage(p.name);
    const nameEnLang = detectLanguage(p.name_en);
    
    let cleanName = p.name;  // 中文名称（不能为空）
    let cleanNameEn = p.name_en;  // 英文名称
    
    // 分析并清洗
    if (nameLang === 'mixed') {
      // 混合文本（如 "丙烯酸 Acrylic Acid"）
      const chinese = extractChinese(p.name);
      const english = extractEnglish(p.name);
      
      if (chinese) cleanName = chinese;
      if (english) cleanNameEn = english;
      console.log(`  检测到混合文本: 中文="${chinese}", 英文="${english}"`);
      
    } else if (nameLang === 'en' && !cleanNameEn) {
      // name 是纯英文，需要翻译成中文
      cleanNameEn = p.name;
      console.log(`  检测到纯英文，需要翻译中文...`);
      
      // 翻译成中文作为 name
      const translatedZh = await translateText(p.name, 'zh', BASE_URL);
      if (translatedZh) {
        cleanName = translatedZh;
        console.log(`  翻译中文: ${translatedZh}`);
      }
      await sleep(200);
      
    } else if (nameLang === 'ja' || nameLang === 'ko') {
      // 日文或韩文，翻译成中文和英文
      console.log(`  检测到${nameLang === 'ja' ? '日文' : '韩文'}，翻译中英文...`);
      
      const translatedZh = await translateText(p.name, 'zh', BASE_URL);
      if (translatedZh) {
        cleanName = translatedZh;
        console.log(`  翻译中文: ${translatedZh}`);
      }
      await sleep(200);
      
      const translatedEn = await translateText(p.name, 'en', BASE_URL);
      if (translatedEn) {
        cleanNameEn = translatedEn;
        console.log(`  翻译英文: ${translatedEn}`);
      }
      await sleep(200);
      
    } else if (nameLang === 'zh') {
      // 纯中文，正确
      console.log(`  检测到纯中文，正确`);
    }
    
    // 如果 nameEn 是中文，name 是英文，交换
    if (nameEnLang === 'zh' && nameLang === 'en') {
      cleanName = p.name_en;
      cleanNameEn = p.name;
      console.log(`  交换中英文名称`);
    }
    
    console.log(`  清洗后 name(zh): ${cleanName}`);
    console.log(`  清洗后 nameEn(en): ${cleanNameEn || '(空)'}`);
    
    // 更新名称字段
    await db.execute(sql`
      UPDATE products 
      SET name = ${cleanName}, 
          name_en = ${cleanNameEn || null},
          updated_at = NOW()
      WHERE id = ${p.id}
    `);
    console.log(`  ✅ 已更新名称字段`);
    
    // 重新翻译名称到所有语言
    console.log(`  📝 重新翻译名称...`);
    const translations = p.translations || {};
    const newTranslations = { ...translations };
    
    // 使用英文作为翻译源
    const sourceText = cleanNameEn || cleanName;
    if (!newTranslations.name) newTranslations.name = {};
    
    // 英文翻译
    newTranslations.name['en'] = cleanNameEn || cleanName;
    
    // 中文翻译
    newTranslations.name['zh'] = cleanName;
    
    // 翻译其他语言
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === 'en' || lang === 'zh') continue;
      
      const translated = await translateText(cleanNameEn || cleanName, lang, BASE_URL);
      if (translated) {
        newTranslations.name[lang] = translated;
        console.log(`    ${lang}: ${translated}`);
      }
      await sleep(200);
    }
    
    // 更新翻译
    await db.execute(sql`
      UPDATE products 
      SET translations = ${JSON.stringify(newTranslations)}::jsonb,
          updated_at = NOW()
      WHERE id = ${p.id}
    `);
    console.log(`  ✅ 已更新翻译`);
  }
  
  console.log(`\n\n✅ 完成！\n`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
