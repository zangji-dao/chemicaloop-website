import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

interface TranslateRequest {
  text: string;
  targetLanguage: string;
}

// 语言代码到语言名称的映射
const LANGUAGE_NAMES: Record<string, string> = {
  zh: 'Chinese (Simplified)',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  ja: 'Japanese',
  ko: 'Korean',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ru: 'Russian',
  pt: 'Portuguese',
  ar: 'Arabic',
  en: 'English',
};

/**
 * AI 翻译接口
 * POST /api/ai/translate
 * 
 * 使用 LLM 进行文本翻译
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TranslateRequest;
    const { text, targetLanguage } = body;

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing text or targetLanguage' },
        { status: 400 }
      );
    }

    // 获取目标语言名称
    const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

    // 初始化 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config);

    // 构建翻译 prompt
    const messages = [
      {
        role: 'system' as const,
        content: `You are a professional translator. Translate the following text to ${targetLangName}. 
Only output the translated text, without any explanations, notes, or additional content.
Preserve the original formatting and structure.
If the text is already in ${targetLangName}, return it unchanged.`,
      },
      {
        role: 'user' as const,
        content: text,
      },
    ];

    // 调用 LLM 进行翻译（使用较低温度保证翻译准确性）
    const response = await client.invoke(messages, {
      temperature: 0.3,
      model: 'doubao-seed-1-6-flash-250615', // 使用快速模型
    });

    return NextResponse.json({
      translatedText: response.content.trim(),
    });
  } catch (error: any) {
    console.error('[AI Translate] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    );
  }
}
