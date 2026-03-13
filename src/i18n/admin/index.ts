/**
 * 管理后台多语言配置
 * 
 * 复用统一的语言配置，导出带 admin 前缀的别名以保持兼容
 */

// 从统一配置导入
import { 
  locales, 
  defaultLocale, 
  localeNames, 
  localeFlags,
  type Locale 
} from '../config';

// 导出带 admin 前缀的别名（保持向后兼容）
export const adminLocales = locales;
export const adminDefaultLocale = defaultLocale;
export const adminLocaleNames = localeNames;
export const adminLocaleFlags = localeFlags;
export type AdminLocale = Locale;

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

// 合并翻译
export const adminTranslations: Record<Locale, Record<string, any>> = {
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
