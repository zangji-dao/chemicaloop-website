/**
 * 产品同步服务
 * 
 * 提供 PubChem 同步和多语言翻译功能
 */

import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';

// 支持的语言列表
export const SUPPORTED_LANGUAGES = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'ar'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// PubChem API 配置
const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const PUBCHEM_VIEW_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug_view';
const FETCH_TIMEOUT = 60000;
const VIEW_TIMEOUT = 90000;

/**
 * 翻译文本到指定语言
 */
export async function translateText(
  text: string, 
  targetLang: string,
  baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/api/ai/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage: targetLang }),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.translatedText || null;
  } catch (error) {
    console.error(`[Translate] Error translating to ${targetLang}:`, error);
    return null;
  }
}

/**
 * 并发控制：限制并发请求数量
 */
async function limitConcurrency<T, R>(
  items: T[],
  limit: number,
  handler: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (const item of items) {
    const promise = handler(item).then(result => {
      results.push(result);
    });
    executing.push(promise);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
      // 移除已完成的 promise
      const completedIndex = executing.findIndex(p => 
        // @ts-ignore - 检查 promise 是否已完成
        p.status === 'fulfilled' || p.status === 'rejected'
      );
      if (completedIndex > -1) {
        executing.splice(completedIndex, 1);
      }
    }
  }
  
  await Promise.all(executing);
  return results;
}

/**
 * 批量翻译文本到所有支持的语言（并发优化版）
 */
export async function translateToAllLanguages(
  text: string,
  sourceLang: string = 'en',
  concurrency: number = 3
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  // 如果源语言是英语，直接使用原文
  if (sourceLang === 'en') {
    results['en'] = text;
  }
  
  // 需要翻译的语言列表
  const langsToTranslate = SUPPORTED_LANGUAGES.filter(lang => !results[lang]);
  
  // 并发翻译，限制并发数为 3
  const translations = await Promise.all(
    langsToTranslate.map(async lang => {
      try {
        const translated = await translateText(text, lang);
        return { lang, translated };
      } catch (error) {
        console.error(`[Translate] Error translating to ${lang}:`, error);
        return { lang, translated: null };
      }
    })
  );
  
  // 收集结果
  for (const { lang, translated } of translations) {
    if (translated) {
      results[lang] = translated;
    }
  }
  
  return results;
}

/**
 * 翻译数组到所有支持的语言（并发优化版）
 */
export async function translateArrayToAllLanguages(
  items: string[],
  maxItems: number = 5
): Promise<Record<string, string[]>> {
  const results: Record<string, string[]> = {};
  const toTranslate = items.slice(0, maxItems);
  
  // 英文原文
  results['en'] = toTranslate;
  
  // 需要翻译的语言列表
  const langsToTranslate = SUPPORTED_LANGUAGES.filter(lang => lang !== 'en');
  
  // 并发翻译每种语言
  const translations = await Promise.all(
    langsToTranslate.map(async lang => {
      // 对每种语言，并发翻译所有 items
      const translatedItems = await Promise.all(
        toTranslate.map(async item => {
          try {
            const translatedItem = await translateText(item, lang);
            return translatedItem || item;
          } catch (error) {
            console.error(`[Translate] Error translating item to ${lang}:`, error);
            return item;
          }
        })
      );
      return { lang, translated: translatedItems };
    })
  );
  
  // 收集结果
  for (const { lang, translated } of translations) {
    results[lang] = translated;
  }
  
  return results;
}

/**
 * 从 PubChem 获取产品信息
 */
export async function fetchFromPubChem(cas: string): Promise<{
  success: boolean;
  data?: {
    cid?: number;
    name?: string;
    nameEn?: string;
    formula?: string;
    molecularWeight?: string;
    smiles?: string;
    inchi?: string;
    inchiKey?: string;
    xlogp?: string;
    description?: string;
    boilingPoint?: string;
    meltingPoint?: string;
    flashPoint?: string;
    hazardClasses?: string;
    synonyms?: string[];
    applications?: string[];
  };
  error?: string;
}> {
  try {
    // 1. 通过 CAS 查询 CID
    const cidUrl = `${PUBCHEM_BASE_URL}/compound/name/${encodeURIComponent(cas)}/cids/JSON`;
    const cidResponse = await fetchWithTimeout(cidUrl, FETCH_TIMEOUT);
    
    if (!cidResponse || !cidResponse.ok) {
      return { success: false, error: '未找到对应的 PubChem CID' };
    }
    
    const cidData = await cidResponse.json();
    const cid = cidData?.IdentifierList?.CID?.[0];
    
    if (!cid) {
      return { success: false, error: '未找到 CID' };
    }
    
    // 2. 获取详细信息
    const [propData, viewData] = await Promise.all([
      fetchWithTimeout(`${PUBCHEM_BASE_URL}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IsomericSMILES,InChI,InChIKey,XLogP/JSON`, FETCH_TIMEOUT),
      fetchWithTimeout(`${PUBCHEM_VIEW_URL}/data/compound/${cid}/JSON`, VIEW_TIMEOUT),
    ]);
    
    const properties = propData ? await propData.json() : {};
    const viewInfo = viewData ? await viewData.json() : {};
    
    // 3. 提取物理化学性质和应用
    const extracted = extractPhysicochemicalProperties(viewInfo);
    
    // 4. 获取同义词
    let synonyms: string[] = [];
    try {
      const synResponse = await fetchWithTimeout(
        `${PUBCHEM_BASE_URL}/compound/cid/${cid}/synonyms/JSON`,
        FETCH_TIMEOUT
      );
      if (synResponse) {
        const synData = await synResponse.json();
        synonyms = synData?.InformationList?.Information?.[0]?.Synonym?.slice(0, 20) || [];
      }
    } catch (e) {
      console.log('[PubChem] Failed to fetch synonyms');
    }
    
    const prop = properties?.PropertyTable?.Properties?.[0] || {};
    
    return {
      success: true,
      data: {
        cid,
        name: extracted.description?.split('.')[0] || viewInfo?.Record?.RecordTitle || cas,
        nameEn: viewInfo?.Record?.RecordTitle || null,
        formula: prop.MolecularFormula,
        molecularWeight: prop.MolecularWeight?.toString(),
        smiles: prop.IsomericSMILES,
        inchi: prop.InChI,
        inchiKey: prop.InChIKey,
        xlogp: prop.XLogP?.toString(),
        description: extracted.description,
        boilingPoint: extracted.boilingPoint,
        meltingPoint: extracted.meltingPoint,
        flashPoint: extracted.flashPoint,
        hazardClasses: extracted.hazardClasses,
        synonyms,
        applications: extracted.applications,
      },
    };
  } catch (error: any) {
    console.error('[PubChem] Fetch error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 同步产品并翻译所有语言
 */
export async function syncProductWithTranslations(
  cas: string,
  productName?: string,
  baseUrl?: string
): Promise<{
  success: boolean;
  productId?: string;
  translations?: any;
  error?: string;
}> {
  const db = await getDb(schema);
  
  // 检查是否已存在
  const existingResult = await db.execute(sql`
    SELECT id, translations FROM products WHERE cas = ${cas}
  `);
  
  if (existingResult.rows.length > 0) {
    const existing = existingResult.rows[0] as any;
    return { 
      success: true, 
      productId: existing.id,
      translations: existing.translations 
    };
  }
  
  // 从 PubChem 获取数据
  const pubchemResult = await fetchFromPubChem(cas);
  
  if (!pubchemResult.success || !pubchemResult.data) {
    // 创建基础记录（无 PubChem 数据）
    const insertResult = await db.execute(sql`
      INSERT INTO products (cas, name, name_en, status, created_at, updated_at)
      VALUES (${cas}, ${productName || cas}, ${productName || cas}, 'ACTIVE', NOW(), NOW())
      RETURNING id
    `);
    
    const productId = (insertResult.rows[0] as any).id;
    return { success: true, productId, translations: {} };
  }
  
  const data = pubchemResult.data;
  
  // 创建产品记录
  const insertResult = await db.execute(sql`
    INSERT INTO products (
      cas, name, name_en, formula, description, status,
      pubchem_cid, molecular_weight, smiles, inchi, inchi_key, xlogp,
      boiling_point, melting_point, flash_point, hazard_classes,
      synonyms, applications, pubchem_synced_at, created_at, updated_at
    ) VALUES (
      ${cas}, ${data.name || productName || cas}, ${data.nameEn || null}, ${data.formula || null},
      ${data.description || null}, 'ACTIVE',
      ${data.cid || null}, ${data.molecularWeight || null}, ${data.smiles || null},
      ${data.inchi || null}, ${data.inchiKey || null}, ${data.xlogp || null},
      ${data.boilingPoint || null}, ${data.meltingPoint || null}, ${data.flashPoint || null},
      ${data.hazardClasses || null},
      ${data.synonyms && data.synonyms.length > 0 ? JSON.stringify(data.synonyms) : null}::jsonb,
      ${data.applications && data.applications.length > 0 ? JSON.stringify(data.applications) : null}::jsonb,
      NOW(), NOW(), NOW()
    )
    RETURNING id
  `);
  
  const productId = (insertResult.rows[0] as any).id;
  const translations: any = {};
  
  // 翻译名称
  if (data.name) {
    console.log(`[Sync] Translating name for ${cas}...`);
    translations.name = await translateToAllLanguages(data.name);
  }
  
  // 翻译描述
  if (data.description) {
    console.log(`[Sync] Translating description for ${cas}...`);
    translations.description = await translateToAllLanguages(data.description);
  }
  
  // 翻译应用
  if (data.applications && data.applications.length > 0) {
    console.log(`[Sync] Translating applications for ${cas}...`);
    translations.applications = await translateArrayToAllLanguages(data.applications);
  }
  
  // 更新翻译
  if (Object.keys(translations).length > 0) {
    await db.execute(sql`
      UPDATE products 
      SET translations = ${JSON.stringify(translations)}::jsonb,
          updated_at = NOW()
      WHERE id = ${productId}
    `);
  }
  
  return { success: true, productId, translations };
}

// ============ 辅助函数 ============

async function fetchWithTimeout(url: string, timeout: number): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    return null;
  }
}

function extractPhysicochemicalProperties(data: any): { 
  description?: string; 
  boilingPoint?: string; 
  meltingPoint?: string; 
  flashPoint?: string; 
  hazardClasses?: string;
  applications?: string[];
} {
  const result: any = {};
  const applications: string[] = [];
  
  try {
    const sections = data?.Record?.Section || [];
    
    for (const section of sections) {
      const heading = section.TOCHeading || '';
      
      if (heading === 'Chemical Safety') {
        const info = section.Information?.[0];
        if (info?.Value?.StringWithMarkup?.[0]?.String) {
          if (!result.description) {
            result.description = info.Value.StringWithMarkup[0].String;
          }
        }
      }
      
      if (!result.description && heading === 'Names and Identifiers') {
        for (const sub of section.Section || []) {
          if (sub.TOCHeading === 'Record Description') {
            const info = sub.Information?.[0];
            if (info?.Value?.StringWithMarkup?.[0]?.String) {
              result.description = info.Value.StringWithMarkup[0].String;
            }
          }
        }
      }
      
      if (heading === 'Use and Manufacturing') {
        for (const sub of section.Section || []) {
          const subHeading = sub.TOCHeading || '';
          const useSections = ['Uses', 'Consumption Patterns', 'General Manufacturing Information'];
          
          if (useSections.includes(subHeading)) {
            for (const info of sub.Information || []) {
              if (info.Value?.StringWithMarkup?.[0]?.String) {
                const use = info.Value.StringWithMarkup[0].String;
                if (use && !applications.includes(use) && use.length < 500) {
                  applications.push(use);
                }
              }
            }
          }
        }
      }
      
      if (heading === 'Chemical and Physical Properties') {
        for (const sub of section.Section || []) {
          if (sub.TOCHeading === 'Experimental Properties') {
            for (const prop of sub.Section || []) {
              const propName = prop.TOCHeading || '';
              const info = prop.Information?.[0];
              if (info?.Value?.StringWithMarkup?.[0]?.String) {
                const value = info.Value.StringWithMarkup[0].String;
                if (propName.includes('Boiling Point')) result.boilingPoint = value;
                else if (propName.includes('Melting Point')) result.meltingPoint = value;
                else if (propName.includes('Flash Point')) result.flashPoint = value;
              }
            }
          }
        }
      }
      
      if (heading === 'Safety and Hazards') {
        for (const sub of section.Section || []) {
          if (sub.TOCHeading === 'Hazards Identification') {
            for (const haz of sub.Section || []) {
              if (haz.TOCHeading === 'Hazards Identification') {
                const info = haz.Information?.[0];
                if (info?.Value?.StringWithMarkup?.[0]?.String) {
                  result.hazardClasses = info.Value.StringWithMarkup[0].String;
                }
              }
            }
          }
        }
      }
    }
    
    if (applications.length > 0) {
      result.applications = applications;
    }
  } catch (error) {
    console.error('Error extracting properties:', error);
  }
  
  return result;
}
