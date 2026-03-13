import type { AdminLocale } from './config';
import en from './en.json';
import zh from './zh.json';
import ja from './ja.json';
import ko from './ko.json';
import de from './de.json';
import fr from './fr.json';
import es from './es.json';
import pt from './pt.json';
import ru from './ru.json';
import ar from './ar.json';

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
