import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// 语言映射
const langMap: Record<string, string> = {
  'zh': 'Chinese (Simplified)',
  'en': 'English',
  'ja': 'Japanese',
  'ko': 'Korean',
  'de': 'German',
  'fr': 'French',
  'es': 'Spanish',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ar': 'Arabic',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguage, targetLanguages, sourceLanguage } = body;

    // 批量翻译模式：一次翻译到多个语言
    if (targetLanguages && Array.isArray(targetLanguages) && targetLanguages.length > 0) {
      return await batchTranslate(request.headers, text, targetLanguages);
    }

    // 单语言翻译模式（向后兼容）
    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required parameters: text and targetLanguage (or targetLanguages)' },
        { status: 400 }
      );
    }

    const result = await translateSingle(request.headers, text, targetLanguage);
    return NextResponse.json({
      translatedText: result,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to translate text' },
      { status: 500 }
    );
  }
}

/**
 * 单语言翻译
 */
async function translateSingle(
  headers: Headers,
  text: string,
  targetLanguage: string
): Promise<string> {
  const customHeaders = HeaderUtils.extractForwardHeaders(headers);
  const config = new Config();
  const client = new LLMClient(config);

  const targetLanguageName = langMap[targetLanguage] || 'English';

  const systemPrompt = `You are a professional translator.
Your task is to translate the given text to ${targetLanguageName}.
Only return the translated text, no explanations, no notes, no additional content.
Preserve the original formatting and structure.
If the text is already in the target language, return it as-is.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: text },
  ];

  const response = await client.invoke(messages, {
    temperature: 0.3,
    model: 'doubao-seed-1-8-251228',
  }, undefined, customHeaders);

  return response.content.trim();
}

/**
 * 批量翻译：根据文本长度智能选择策略
 * 
 * 策略：
 * - 短文本（<150字符）：批量翻译（最多2种语言/批）
 * - 长文本（>=150字符）：直接逐个翻译（并行）
 * 
 * 原因：长文本的多语言 JSON 太大，LLM 经常无法完整生成
 */
const SHORT_TEXT_THRESHOLD = 150; // 短文本阈值
const BATCH_SIZE_SHORT = 2; // 短文本每批最多 2 种语言

async function batchTranslate(
  headers: Headers,
  text: string,
  targetLanguages: string[]
): Promise<NextResponse> {
  const isShortText = text.length < SHORT_TEXT_THRESHOLD;
  
  // 长文本：直接逐个翻译（并行），避免 JSON 解析失败
  if (!isShortText) {
    console.log(`[Translate] Long text (${text.length} chars), using individual translation`);
    return await translateIndividually(headers, text, targetLanguages);
  }
  
  // 短文本：批量翻译，每批最多 2 种语言
  if (targetLanguages.length <= BATCH_SIZE_SHORT) {
    return await batchTranslateSingle(headers, text, targetLanguages);
  }

  // 分批处理
  console.log(`[Batch Translate] Short text (${text.length} chars), splitting ${targetLanguages.length} languages into batches of ${BATCH_SIZE_SHORT}`);
  
  const allTranslations: Record<string, string> = {};
  const batches: string[][] = [];
  
  for (let i = 0; i < targetLanguages.length; i += BATCH_SIZE_SHORT) {
    batches.push(targetLanguages.slice(i, i + BATCH_SIZE_SHORT));
  }

  // 串行处理每批
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`[Batch Translate] Processing batch ${i + 1}/${batches.length}: ${batch.join(', ')}`);
    
    try {
      const response = await batchTranslateSingle(headers, text, batch);
      const data = await response.json();
      
      if (data.translations) {
        Object.assign(allTranslations, data.translations);
      }
    } catch (e) {
      console.error(`[Batch Translate] Batch ${i + 1} failed:`, e);
      // 批次失败，逐个翻译该批次
      for (const lang of batch) {
        try {
          allTranslations[lang] = await translateSingle(headers, text, lang);
        } catch {
          allTranslations[lang] = text;
        }
      }
    }
  }

  return NextResponse.json({
    translations: allTranslations,
    sourceText: text,
  });
}

/**
 * 逐个翻译（并行执行）
 */
async function translateIndividually(
  headers: Headers,
  text: string,
  targetLanguages: string[]
): Promise<NextResponse> {
  const translations: Record<string, string> = {};
  
  // 并行翻译所有语言
  await Promise.all(
    targetLanguages.map(async (lang) => {
      try {
        translations[lang] = await translateSingle(headers, text, lang);
      } catch (e) {
        console.error(`[Translate] Failed for ${lang}:`, e);
        translations[lang] = text; // 翻译失败使用原文
      }
    })
  );
  
  return NextResponse.json({
    translations,
    sourceText: text,
  });
}

/**
 * 单批次翻译（内部函数）
 * 如果 JSON 解析失败，自动回退到逐个翻译
 */
async function batchTranslateSingle(
  headers: Headers,
  text: string,
  targetLanguages: string[]
): Promise<NextResponse> {
  const customHeaders = HeaderUtils.extractForwardHeaders(headers);
  const config = new Config();
  const client = new LLMClient(config);

  // 构建语言列表描述
  const languageList = targetLanguages
    .map(lang => `- ${lang}: ${langMap[lang] || lang}`)
    .join('\n');

  const systemPrompt = `You are a professional translator.
Your task is to translate the given text to multiple languages.
Return a valid JSON object with language codes as keys and translations as values.
Example output format:
{"zh": "中文翻译", "ja": "日本語訳", "ko": "한국어 번역"}

Important:
- Only return the JSON object, no other text
- Preserve the original formatting and structure in translations
- If the text is already in a target language, keep it as-is for that language

Target languages:
${languageList}`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: text },
  ];

  try {
    const response = await client.invoke(messages, {
      temperature: 0.3,
      model: 'doubao-seed-1-8-251228',
    }, undefined, customHeaders);

    // 解析 JSON 响应
    const content = response.content.trim();
    
    // 尝试提取 JSON（可能包含 markdown 代码块）
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    // 尝试找到 JSON 对象的开始和结束
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
      throw new Error('No valid JSON object found in response');
    }
    
    const jsonContent = jsonStr.substring(jsonStart, jsonEnd + 1);
    const translations = JSON.parse(jsonContent);
    
    // 验证返回的翻译是否完整
    const hasAllLanguages = targetLanguages.every(lang => translations[lang]);
    if (!hasAllLanguages) {
      throw new Error('Incomplete translations in response');
    }
    
    return NextResponse.json({
      translations,
      sourceText: text,
    });
  } catch (parseError) {
    // JSON 解析失败，回退到逐个翻译
    console.error('Failed to parse batch translation, falling back to individual:', text.substring(0, 100));
    
    const translations: Record<string, string> = {};
    
    // 并行翻译每种语言
    await Promise.all(
      targetLanguages.map(async (lang) => {
        try {
          translations[lang] = await translateSingle(headers, text, lang);
        } catch (e) {
          console.error(`Translation failed for ${lang}:`, e);
          translations[lang] = text; // 翻译失败使用原文
        }
      })
    );
    
    return NextResponse.json({
      translations,
      sourceText: text,
    });
  }
}
