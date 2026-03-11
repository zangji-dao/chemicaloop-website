import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';
import { verifyAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

interface TranslationRequest {
  productId: string;
  targetLanguage: string;
  fields?: ('name' | 'remark' | 'origin' | 'description' | 'applications')[];
  table?: 'agent_products' | 'products';  // 支持两个表
}

/**
 * 翻译产品信息并存储到数据库
 * POST /api/admin/products/translate
 */
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAdmin(request);
    if (!auth.success) {
      return auth.status === 401 
        ? unauthorizedResponse(auth.error)
        : forbiddenResponse(auth.error);
    }

    const { productId, targetLanguage, fields, table = 'agent_products' } = await request.json() as TranslationRequest;

    if (!productId || !targetLanguage) {
      return NextResponse.json({ error: 'Missing productId or targetLanguage' }, { status: 400 });
    }

    const db = await getDb(schema);

    // 根据表名选择不同的处理逻辑
    if (table === 'products') {
      return await translateProductsTable(db, productId, targetLanguage, fields as ('description' | 'applications')[] | undefined);
    } else {
      return await translateAgentProductsTable(db, productId, targetLanguage, fields as ('name' | 'origin' | 'remark')[] | undefined);
    }
  } catch (error: any) {
    console.error('Product translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to translate product' },
      { status: 500 }
    );
  }
}

/**
 * 翻译 products 表的 description 和 applications
 */
async function translateProductsTable(
  db: any,
  productId: string,
  targetLanguage: string,
  fields?: ('description' | 'applications')[]
): Promise<NextResponse> {
  const fieldsToTranslate = fields || ['description', 'applications'];
  
  // 获取产品信息
  const productResult = await db.execute(sql`
    SELECT id, cas, description, applications, translations
    FROM products
    WHERE id = ${productId}
  `);

  const product = productResult.rows[0];
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // 解析现有翻译
  const existingTranslations = product.translations as Record<string, any> || {};
  const translations = { ...existingTranslations };
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
    (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');

  // 翻译描述
  if (fieldsToTranslate.includes('description') && product.description) {
    const fieldKey = 'description';
    if (!translations[fieldKey]?.[targetLanguage]) {
      try {
        const response = await fetch(`${baseUrl}/api/ai/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: product.description,
            targetLanguage,
          }),
        });
        const data = await response.json();
        
        if (!translations[fieldKey]) {
          translations[fieldKey] = {};
        }
        translations[fieldKey][targetLanguage] = data.translatedText || product.description;
      } catch (error) {
        console.error('Failed to translate description:', error);
      }
    }
  }

  // 翻译应用（数组）
  if (fieldsToTranslate.includes('applications') && product.applications) {
    const fieldKey = 'applications';
    const applications = product.applications as string[];
    
    if (!translations[fieldKey]?.[targetLanguage] && applications.length > 0) {
      try {
        // 只翻译前5个应用
        const toTranslate = applications.slice(0, 5);
        const translatedApps: string[] = [];
        
        for (const app of toTranslate) {
          const response = await fetch(`${baseUrl}/api/ai/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: app,
              targetLanguage,
            }),
          });
          const data = await response.json();
          translatedApps.push(data.translatedText || app);
          await new Promise(resolve => setTimeout(resolve, 200)); // 避免请求过快
        }
        
        if (!translations[fieldKey]) {
          translations[fieldKey] = {};
        }
        translations[fieldKey][targetLanguage] = translatedApps;
      } catch (error) {
        console.error('Failed to translate applications:', error);
      }
    }
  }

  // 保存到数据库
  await db.execute(sql`
    UPDATE products
    SET translations = ${JSON.stringify(translations)}::jsonb,
        updated_at = NOW()
    WHERE id = ${productId}
  `);

  return NextResponse.json({
    success: true,
    translations: translations,
  });
}

/**
 * 翻译 agent_products 表的 name, remark, origin
 */
async function translateAgentProductsTable(
  db: any,
  productId: string,
  targetLanguage: string,
  fields?: ('name' | 'remark' | 'origin')[]
): Promise<NextResponse> {
  const fieldsToTranslate = fields || ['name', 'remark', 'origin'];

    // 获取产品信息
    const productResult = await db.execute(sql`
      SELECT id, name, remark, origin, translations
      FROM agent_products
      WHERE id = ${productId}
    `);

    const product = productResult.rows[0];
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 解析现有翻译
    const existingTranslations = product.translations as Record<string, Record<string, string>> || {};
    const translations = { ...existingTranslations };
    const needsTranslation: string[] = [];

    // 检查哪些字段需要翻译
    for (const field of fieldsToTranslate) {
      const fieldValue = product[field as keyof typeof product] as string;
      if (!fieldValue) continue;

      const fieldTranslations = translations[field];
      if (!fieldTranslations?.[targetLanguage]) {
        needsTranslation.push(field);
      }
    }

    // 如果没有需要翻译的字段，直接返回
    if (needsTranslation.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Translations already exist',
        translations: translations,
      });
    }

    // 调用翻译API
    const translatePromises = needsTranslation.map(async (field) => {
      const fieldValue = product[field as keyof typeof product] as string;
      if (!fieldValue) return null;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
          (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
        const response = await fetch(`${baseUrl}/api/ai/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: fieldValue,
            targetLanguage,
          }),
        });

        const data = await response.json();
        return {
          field,
          translatedText: data.translatedText || fieldValue,
        };
      } catch (error) {
        console.error(`Failed to translate ${field}:`, error);
        return {
          field,
          translatedText: fieldValue, // 翻译失败返回原文
        };
      }
    });

    const results = await Promise.all(translatePromises);

    // 更新翻译结果
    for (const result of results) {
      if (!result) continue;
      const { field, translatedText } = result;
      
      if (!translations[field]) {
        translations[field] = {};
      }
      translations[field][targetLanguage] = translatedText;
    }

    // 保存到数据库
    await db.execute(sql`
      UPDATE agent_products
      SET translations = ${JSON.stringify(translations)}::jsonb,
          updated_at = NOW()
      WHERE id = ${productId}
    `);

    return NextResponse.json({
      success: true,
      translations: translations,
    });
}
