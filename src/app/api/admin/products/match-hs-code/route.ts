import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';
import jwt from 'jsonwebtoken';

// 验证管理员权限
async function verifyAdmin(request: NextRequest): Promise<{ userId: string; role: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { 
      userId: string; 
      role?: string;
    };
    
    if (decoded.role !== 'admin') return null;

    return { userId: decoded.userId, role: decoded.role };
  } catch (error) {
    return null;
  }
}

// 常见化学品 HS 编码参考表
const HS_CODE_REFERENCE: Record<string, { code: string; description: string }> = {
  // 有机化学品
  'ethanol': { code: '220710', description: '未改性乙醇，按容量计酒精浓度≥80%' },
  'methanol': { code: '290511', description: '甲醇' },
  'acetic acid': { code: '291521', description: '乙酸' },
  'acetone': { code: '291411', description: '丙酮' },
  'benzene': { code: '290220', description: '苯' },
  'toluene': { code: '290230', description: '甲苯' },
  'xylene': { code: '290244', description: '二甲苯' },
  'phenol': { code: '290711', description: '苯酚' },
  'formaldehyde': { code: '291211', description: '甲醛' },
  'ethylene glycol': { code: '290531', description: '乙二醇' },
  'propylene glycol': { code: '290532', description: '丙二醇' },
  'glycerol': { code: '290545', description: '甘油' },
  'citric acid': { code: '291814', description: '柠檬酸' },
  'lactic acid': { code: '291811', description: '乳酸' },
  'tartaric acid': { code: '291812', description: '酒石酸' },
  'salicylic acid': { code: '291821', description: '水杨酸' },
  'aspirin': { code: '291822', description: '乙酰水杨酸' },
  'urea': { code: '310210', description: '尿素' },
  'sodium hydroxide': { code: '281512', description: '氢氧化钠' },
  'sodium carbonate': { code: '283620', description: '碳酸钠' },
  'sodium bicarbonate': { code: '283630', description: '碳酸氢钠' },
  'hydrogen peroxide': { code: '284700', description: '过氧化氢' },
  'ammonia': { code: '281410', description: '氨' },
  'sulfuric acid': { code: '280700', description: '硫酸' },
  'hydrochloric acid': { code: '280610', description: '盐酸' },
  'nitric acid': { code: '280800', description: '硝酸' },
  'phosphoric acid': { code: '280920', description: '磷酸' },
  // 无机化学品
  'sodium chloride': { code: '250100', description: '氯化钠' },
  'calcium carbonate': { code: '283650', description: '碳酸钙' },
  'titanium dioxide': { code: '320611', description: '二氧化钛' },
  // 其他常见化学品
  'paracetamol': { code: '292429', description: '对乙酰氨基酚' },
  'ibuprofen': { code: '291631', description: '布洛芬' },
  'vitamin c': { code: '293627', description: '维生素C' },
  'caffeine': { code: '293930', description: '咖啡因' },
};

interface MatchRequest {
  cas?: string;
  name?: string;
  nameEn?: string;
  formula?: string;
  description?: string;
  applications?: string[];
}

/**
 * HS 编码自动匹配 API
 * POST /api/admin/products/match-hs-code
 * 
 * 基于 AI 智能匹配 6 位 HS 编码
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json() as MatchRequest;
    const { cas, name, nameEn, formula, description, applications } = body;

    if (!cas && !name && !nameEn) {
      return NextResponse.json({ error: '需要提供 CAS、产品名称或英文名称' }, { status: 400 });
    }

    // 1. 先从本地数据库查找
    const db = await getDb(schema);
    
    if (cas) {
      const existingResult = await db.execute(sql`
        SELECT hs_code FROM products 
        WHERE cas = ${cas} AND hs_code IS NOT NULL 
        LIMIT 1
      `);
      
      if (existingResult.rows.length > 0) {
        const row = existingResult.rows[0] as any;
        return NextResponse.json({
          success: true,
          hsCode: row.hs_code,
          confidence: 1.0,
          source: 'database',
          message: '从数据库获取 HS 编码',
        });
      }
    }

    // 2. 从参考表查找
    const searchName = (nameEn || name || '').toLowerCase();
    for (const [chemical, info] of Object.entries(HS_CODE_REFERENCE)) {
      if (searchName.includes(chemical) || chemical.includes(searchName)) {
        return NextResponse.json({
          success: true,
          hsCode: info.code.substring(0, 6),
          confidence: 0.95,
          source: 'reference',
          description: info.description,
          message: '从参考表匹配 HS 编码',
        });
      }
    }

    // 3. 使用 LLM 智能匹配
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config);

    const systemPrompt = `You are a customs tariff expert specializing in HS Code classification.
Your task is to determine the most appropriate 6-digit HS (Harmonized System) code for a chemical product.

Rules:
1. Return ONLY a JSON object, no other text
2. The JSON must have these fields: hsCode (6 digits), confidence (0-1), description (brief explanation)
3. HS Code must be exactly 6 digits
4. If uncertain, provide your best estimate with lower confidence

Common HS Code chapters for chemicals:
- Chapter 28: Inorganic chemicals
- Chapter 29: Organic chemicals
- Chapter 30: Pharmaceutical products
- Chapter 31: Fertilizers
- Chapter 32: Dyes, pigments, paints
- Chapter 33: Essential oils, cosmetics
- Chapter 34: Soaps, detergents
- Chapter 35: Albuminoidal substances
- Chapter 38: Miscellaneous chemical products

Example response:
{"hsCode": "290511", "confidence": 0.95, "description": "Methanol - Chapter 29 organic chemical"}`;

    const userContent = `Please classify this chemical product:
- CAS: ${cas || 'N/A'}
- Name (Chinese): ${name || 'N/A'}
- Name (English): ${nameEn || 'N/A'}
- Formula: ${formula || 'N/A'}
- Description: ${description || 'N/A'}
- Applications: ${applications?.slice(0, 3).join(', ') || 'N/A'}

Return the 6-digit HS code.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userContent },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.3,
      model: 'doubao-seed-1-8-251228',
    }, undefined, customHeaders);

    // 解析 LLM 响应
    let result;
    try {
      // 尝试提取 JSON
      const content = response.content.trim();
      const jsonMatch = content.match(/\{[^}]+\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // 尝试直接解析
        result = JSON.parse(content);
      }
    } catch (e) {
      // 如果解析失败，尝试从响应中提取 6 位数字
      const codeMatch = response.content.match(/\b(\d{6})\b/);
      if (codeMatch) {
        result = {
          hsCode: codeMatch[1],
          confidence: 0.7,
          description: 'Extracted from AI response',
        };
      } else {
        return NextResponse.json({
          success: false,
          error: '无法解析 HS 编码',
          rawResponse: response.content,
        }, { status: 500 });
      }
    }

    // 验证 HS 编码格式
    if (!/^\d{6}$/.test(result.hsCode)) {
      return NextResponse.json({
        success: false,
        error: 'HS 编码格式无效，必须是 6 位数字',
        rawResponse: result,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      hsCode: result.hsCode,
      confidence: result.confidence || 0.8,
      source: 'ai',
      description: result.description,
      message: 'AI 智能匹配 HS 编码',
    });
  } catch (error: any) {
    console.error('HS code matching error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'HS 编码匹配失败',
    }, { status: 500 });
  }
}
