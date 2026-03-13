import { assertDevEnvironment } from '../lib/env-check';
assertDevEnvironment();

/**
 * 批量翻译 SPU 物理性质字段
 */

const TARGET_LANGUAGES = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];

interface Product {
  id: string;
  cas: string;
  name: string;
  boiling_point: string | null;
  melting_point: string | null;
  flash_point: string | null;
  hazard_classes: string | null;
  translations: any;
}

/**
 * 调用翻译 API (并行翻译多个语言)
 */
async function translateToAllLanguages(text: string): Promise<Record<string, string>> {
  const results: Record<string, string> = { en: text };
  
  // 并行翻译到所有目标语言
  const promises = TARGET_LANGUAGES.filter(l => l !== 'en').map(async (lang) => {
    try {
      const response = await fetch('http://localhost:5000/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: lang }),
      });
      const data = await response.json();
      return { lang, translated: data.translatedText || text };
    } catch (error) {
      console.error(`Translation failed for ${lang}:`, error);
      return { lang, translated: text };
    }
  });
  
  const translations = await Promise.all(promises);
  translations.forEach(({ lang, translated }) => {
    results[lang] = translated;
  });
  
  return results;
}

/**
 * 并行翻译一个产品的所有物理性质
 */
async function translateProductProperties(product: Product): Promise<any> {
  const translations = product.translations || {};
  
  // 并行翻译所有需要翻译的字段
  const tasks: Promise<void>[] = [];
  
  if (product.boiling_point && !translations.boilingPoint) {
    tasks.push(
      translateToAllLanguages(product.boiling_point).then(result => {
        translations.boilingPoint = result;
      })
    );
  }
  
  if (product.melting_point && !translations.meltingPoint) {
    tasks.push(
      translateToAllLanguages(product.melting_point).then(result => {
        translations.meltingPoint = result;
      })
    );
  }
  
  if (product.flash_point && !translations.flashPoint) {
    tasks.push(
      translateToAllLanguages(product.flash_point).then(result => {
        translations.flashPoint = result;
      })
    );
  }
  
  if (product.hazard_classes && !translations.hazardClasses) {
    tasks.push(
      translateToAllLanguages(product.hazard_classes).then(result => {
        translations.hazardClasses = result;
      })
    );
  }
  
  await Promise.all(tasks);
  return translations;
}

async function main() {
  console.log('Starting batch translation...\n');
  
  // 获取所有需要翻译的产品
  const response = await fetch('http://localhost:5000/api/admin/spu?limit=100', {
    headers: { 'Authorization': 'Bearer batch-script' }
  });
  const data = await response.json();
  const products: Product[] = data.data || [];
  
  console.log(`Found ${products.length} products to process\n`);
  
  // 处理每个产品
  for (const product of products) {
    // 检查是否需要翻译
    const needsTranslation = 
      (product.boiling_point && !product.translations?.boilingPoint) ||
      (product.melting_point && !product.translations?.meltingPoint) ||
      (product.flash_point && !product.translations?.flashPoint) ||
      (product.hazard_classes && !product.translations?.hazardClasses);
    
    if (!needsTranslation) {
      console.log(`✓ ${product.cas} - ${product.name} (已翻译)`);
      continue;
    }
    
    console.log(`⏳ ${product.cas} - ${product.name} (翻译中...)`);
    
    try {
      const newTranslations = await translateProductProperties(product);
      
      // 更新数据库
      const updateResponse = await fetch('http://localhost:5000/api/admin/spu', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer batch-script'
        },
        body: JSON.stringify({
          id: product.id,
          translations: newTranslations,
        }),
      });
      
      const result = await updateResponse.json();
      if (result.success) {
        console.log(`✓ ${product.cas} - ${product.name} (完成)`);
      } else {
        console.error(`✗ ${product.cas} - ${product.name} (失败: ${result.error})`);
      }
    } catch (error) {
      console.error(`✗ ${product.cas} - ${product.name} (错误)`, error);
    }
  }
  
  console.log('\nBatch translation completed!');
}

main().catch(console.error);
