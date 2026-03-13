/**
 * 管理后台多语言配置
 * 
 * 拆分自原 admin-i18n.ts 文件
 * 各语言翻译存放在当前目录下
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
