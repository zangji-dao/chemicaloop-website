/**
 * 管理后台多语言配置
 * 
 * 拆分自原 admin-i18n.ts 文件
 * 各语言翻译存放在 locales/ 目录下
 */

// 导出配置
export {
  adminLocales,
  adminDefaultLocale,
  adminLocaleNames,
  adminLocaleFlags,
  type AdminLocale,
} from './config';

// 导出辅助函数
export { getAdminTranslation } from './translation-helper';

// 导入所有翻译
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

import type { AdminLocale } from './config';

// 合并翻译
export const adminTranslations: Record<AdminLocale, Record<string, any>> = {
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
