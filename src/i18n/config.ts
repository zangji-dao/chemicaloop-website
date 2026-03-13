/**
 * 统一多语言配置
 * 
 * 前端和后台共用同一套语言配置
 */

// 支持的语言列表
export const locales = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'ar'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

// 语言名称（原生名称）
export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '简体中文',
  ja: '日本語',
  ko: '한국어',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  ru: 'Русский',
  ar: 'العربية',
};

// 国旗图片路径
export const localeFlags: Record<Locale, string> = {
  en: '/assets/flags/en.png',
  zh: '/assets/flags/zh.png',
  ja: '/assets/flags/ja.png',
  ko: '/assets/flags/ko.png',
  de: '/assets/flags/de.png',
  fr: '/assets/flags/fr.png',
  es: '/assets/flags/es.png',
  pt: '/assets/flags/pt.png',
  ru: '/assets/flags/ru.png',
  ar: '/assets/flags/ar.png',
};
