import type { AdminLocale } from './config';
import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import ar from './locales/ar.json';

// 翻译数据
const translations: Record<AdminLocale, Record<string, any>> = {
  en,
  zh,
  ja,
  ko,
  de,
  fr,
  es,
  pt,
  ru,
  ar,
};

export function getAdminTranslation(locale: AdminLocale, key: string): string {
  const keys = key.split('.');
  let value: any = translations[locale];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // 回退到英文
      value = translations['en'];
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // 找不到翻译，返回 key
        }
      }
      break;
    }
  }
  
  return typeof value === 'string' ? value : key;
}
