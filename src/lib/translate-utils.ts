/**
 * 通用翻译工具函数
 */

const ALL_LANGUAGES = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];

export interface TranslateOptions {
  fields: Array<{ key: string; value: string }>;
  token?: string | null;
  signal?: AbortSignal;
  onProgress?: (current: number, total: number) => void;
  onFieldStart?: (key: string) => void;
  onFieldEnd?: (key: string) => void;
}

export interface TranslateResult {
  translations: Record<string, Record<string, string>>;
  success: boolean;
  errors: string[];
}

/**
 * 并行翻译多个字段
 */
export async function translateFields(options: TranslateOptions): Promise<TranslateResult> {
  const { fields, token, signal, onProgress, onFieldStart, onFieldEnd } = options;
  
  const translations: Record<string, Record<string, string>> = {};
  const errors: string[] = [];
  let completedCount = 0;

  const translationPromises = fields.map(async (field) => {
    if (!field.value) return;
    
    onFieldStart?.(field.key);
    
    try {
      const response = await fetch('/api/common/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text: field.value,
          targetLanguages: ALL_LANGUAGES,
        }),
        signal,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.translations) {
          translations[field.key] = data.translations;
        }
      } else {
        errors.push(`${field.key}: HTTP ${response.status}`);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        errors.push(`${field.key}: ${error.message}`);
      }
    } finally {
      onFieldEnd?.(field.key);
      completedCount++;
      onProgress?.(completedCount, fields.length);
    }
  });

  await Promise.all(translationPromises);

  return {
    translations,
    success: errors.length === 0,
    errors,
  };
}

/**
 * 获取当前语言的翻译文本
 */
export function getCurrentLanguageTranslation(
  translations: Record<string, Record<string, string>> | undefined,
  fieldKey: string,
  locale: string
): string | undefined {
  return translations?.[fieldKey]?.[locale];
}

/**
 * 所有支持的语言
 */
export const SUPPORTED_LANGUAGES = ALL_LANGUAGES;
