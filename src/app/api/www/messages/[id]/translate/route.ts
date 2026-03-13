import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { messages } from '@/db';
import { sql } from 'drizzle-orm';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import * as schema from '@/db';

/**
 * 检测文本的主要语言
 * 返回 ISO 语言代码，如果无法确定则返回 null
 */
function detectLanguage(text: string): string | null {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const sample = text.substring(0, 1000); // 只检测前 1000 个字符

  // 中文字符检测
  const chineseChars = (sample.match(/[\u4e00-\u9fa5]/g) || []).length;
  
  // 日文字符检测（平假名 + 片假名）
  const japaneseChars = (sample.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  
  // 韩文字符检测（谚文）
  const koreanChars = (sample.match(/[\uac00-\ud7af]/g) || []).length;
  
  // 阿拉伯语字符检测
  const arabicChars = (sample.match(/[\u0600-\u06ff]/g) || []).length;
  
  // 西里尔字母（俄语等）
  const cyrillicChars = (sample.match(/[\u0400-\u04ff]/g) || []).length;

  // 计算总字符数（排除空格和标点）
  const totalChars = sample.replace(/[\s\p{P}]/gu, '').length;
  if (totalChars === 0) return null;

  // 计算各语言字符占比
  const ratios = {
    zh: chineseChars / totalChars,
    ja: japaneseChars / totalChars,
    ko: koreanChars / totalChars,
    ar: arabicChars / totalChars,
    ru: cyrillicChars / totalChars,
  };

  // 如果某种语言字符占比超过 10%，认为该语言为主
  const threshold = 0.1;
  
  if (ratios.zh > threshold && ratios.zh > ratios.ja) {
    return 'zh';
  }
  if (ratios.ja > threshold) {
    return 'ja';
  }
  if (ratios.ko > threshold) {
    return 'ko';
  }
  if (ratios.ar > threshold) {
    return 'ar';
  }
  if (ratios.ru > threshold) {
    return 'ru';
  }

  // 对于拉丁字母语言（en, de, fr, es, pt），无法简单区分
  // 返回 null，让 LLM 处理
  return null;
}

/**
 * 自动翻译消息并缓存
 * 
 * 新逻辑：
 * 1. 所有消息都尝试翻译成用户目标语言
 * 2. 后端智能检测内容语言，如果已是目标语言则直接返回原文（节省 LLM 费用）
 * 3. 翻译结果缓存到数据库，下次直接返回缓存
 * 
 * GET /api/messages/[id]/translate?lang={language}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang');

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    if (!lang) {
      return NextResponse.json(
        { error: 'Language parameter is required' },
        { status: 400 }
      );
    }

    // 支持的语言列表
    const supportedLanguages = ['en', 'zh', 'ar', 'es', 'fr', 'de', 'ru', 'pt', 'ja', 'ko'];
    if (!supportedLanguages.includes(lang)) {
      return NextResponse.json(
        { error: 'Unsupported language' },
        { status: 400 }
      );
    }

    const db = await getDb(schema);

    // 查询消息详情
    const query = sql`
      SELECT id, title, content, translations
      FROM messages
      WHERE id = ${id}
    `;
    const result = await db.execute(query);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    const message = result.rows[0] as { id: string; title: string; content: string; translations: Record<string, { title: string; content: string }> | null };

    // 如果已经有翻译缓存，直接返回缓存
    if (message.translations && message.translations[lang]) {
      const cachedTranslation = message.translations[lang];
      console.log(`[Translation] Using cache for message ${id} to ${lang}`);
      return NextResponse.json({
        success: true,
        message: 'Translation from cache',
        translatedTitle: cachedTranslation.title || '',
        translatedContent: cachedTranslation.content || '',
        fromCache: true,
        detectedLanguage: null,
      });
    }

    // 检测内容语言
    const fullText = (message.title || '') + '\n\n' + (message.content || '');
    const detectedLang = detectLanguage(fullText);
    console.log(`[Translation] Detected language for message ${id}: ${detectedLang || 'unknown (Latin script)'}`);

    // 如果检测到的语言与目标语言相同，直接返回原文
    // 这可以节省 LLM API 调用费用
    if (detectedLang === lang) {
      console.log(`[Translation] Content already in target language ${lang}, returning original`);
      
      // 将原文缓存（避免重复检测）
      const translationResult = {
        title: message.title || '',
        content: message.content || '',
      };
      
      // 更新数据库缓存
      const updateQuery = sql`
        UPDATE messages
        SET translations = COALESCE(translations, '{}'::jsonb) || ${JSON.stringify({ [lang]: translationResult })}::jsonb
        WHERE id = ${id}
      `;
      await db.execute(updateQuery);

      return NextResponse.json({
        success: true,
        message: 'Content already in target language',
        translatedTitle: message.title || '',
        translatedContent: message.content || '',
        fromCache: false,
        detectedLanguage: detectedLang,
        skipped: true, // 标记为跳过翻译
      });
    }

    // 需要调用 LLM 翻译
    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化LLM客户端
    const config = new Config();
    const client = new LLMClient(config);

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

    const targetLanguageName = langMap[lang] || 'English';

    // 构建system prompt
    const systemPrompt = `You are a professional translator.
Your task is to translate the given text to ${targetLanguageName}.
Only return the translated text, no explanations, no notes, no additional content.
Preserve the original formatting and structure.
If the text is already in the target language, return it as-is.`;

    // 构建messages
    const messagesLLM = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: fullText },
    ];

    console.log(`[Translation] Calling LLM for message ${id} to ${lang}`);
    
    // 调用LLM
    const response = await client.invoke(messagesLLM, {
      temperature: 0.3,
      model: 'doubao-seed-1-8-251228',
    }, undefined, customHeaders);
    
    // 解析翻译结果
    const translatedText = response.content.trim();

    if (!translatedText) {
      throw new Error('Translation API returned empty result');
    }

    // 将翻译结果分割为 title 和 content
    // LLM 输入格式：title + '\n\n' + content
    // 尝试以双换行符分割（原始标题和内容之间）
    let translatedTitle = '';
    let translatedContent = translatedText;

    const firstDoubleNewline = translatedText.indexOf('\n\n');
    if (firstDoubleNewline > 0) {
      // 找到双换行符，分割标题和内容
      translatedTitle = translatedText.substring(0, firstDoubleNewline).trim();
      translatedContent = translatedText.substring(firstDoubleNewline + 2).trim();
    } else {
      // 没有双换行符，尝试以单换行符分割
      const firstNewline = translatedText.indexOf('\n');
      if (firstNewline > 0) {
        translatedTitle = translatedText.substring(0, firstNewline).trim();
        translatedContent = translatedText.substring(firstNewline + 1).trim();
      }
    }

    // 确保翻译内容不为空
    if (!translatedContent) {
      translatedContent = translatedText;
    }

    // 更新数据库中的翻译缓存
    const translationResult = {
      title: translatedTitle,
      content: translatedContent,
    };
    
    const updateQuery = sql`
      UPDATE messages
      SET translations = COALESCE(translations, '{}'::jsonb) || ${JSON.stringify({ [lang]: translationResult })}::jsonb
      WHERE id = ${id}
    `;
    await db.execute(updateQuery);

    console.log(`[Translation] Completed for message ${id} to ${lang}`);

    return NextResponse.json({
      success: true,
      message: 'Translation completed and cached',
      translatedTitle,
      translatedContent,
      fromCache: false,
      detectedLanguage: detectedLang,
      skipped: false,
    });
  } catch (error: any) {
    console.error('Translate message error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to translate message' },
      { status: 500 }
    );
  }
}
