import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { verifyAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { translateText } from '@/services/productSyncService';

interface TranslationRequest {
  productId: string;
  targetLanguage: string;
  fields?: ('name' | 'remark' | 'origin')[];
}

/**
 * 翻译 SKU 产品信息并存储到数据库
 * POST /api/admin/sku/translate
 * 
 * 仅支持 agent_products 表，翻译 name, remark, origin 字段
 */
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAdmin(request);
    if (!auth.success) {
      return auth.status === 401 
        ? unauthorizedResponse(auth.error)
        : forbiddenResponse(auth.error);
    }

    const { productId, targetLanguage, fields = ['name', 'remark', 'origin'] } = await request.json() as TranslationRequest;

    if (!productId || !targetLanguage) {
      return NextResponse.json({ error: 'Missing productId or targetLanguage' }, { status: 400 });
    }

    const db = await getDb(schema);

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
    for (const field of fields) {
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

    // 并行翻译所有需要翻译的字段
    const translatePromises = needsTranslation.map(async (field) => {
      const fieldValue = product[field as keyof typeof product] as string;
      if (!fieldValue) return null;

      const translatedText = await translateText(fieldValue, targetLanguage);
      return {
        field,
        translatedText: translatedText || fieldValue,
      };
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
  } catch (error: any) {
    console.error('Product translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to translate product' },
      { status: 500 }
    );
  }
}
