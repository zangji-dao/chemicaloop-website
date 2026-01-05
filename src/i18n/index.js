import { ref, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import { DEFAULT_LANG, RTL_LANGS } from '@/constants/lang'

// 1. 语言包加载状态（用于组件内加载提示）
export const isLangLoading = ref(false)

// 2. 懒加载语言包
const messages = {
  zh: () => import('./lang/zh.json'),
  en: () => import('./lang/en.json'),
  ja: () => import('./lang/ja.json'),
  ko: () => import('./lang/ko.json'),
  ar: () => import('./lang/ar.json'),
  hi: () => import('./lang/hi.json'),
  de: () => import('./lang/de.json'),
  es: () => import('./lang/es.json'),
  pt: () => import('./lang/pt.json'),
  ru: () => import('./lang/ru.json'),
  id: () => import('./lang/id.json'),
}

// 3. 读取本地存储的语言（带有效性校验）
const getSavedLang = () => {
  const saved = localStorage.getItem('app-lang')
  return saved && Object.keys(messages).includes(saved) ? saved : DEFAULT_LANG
}

// 4. 提前初始化HTML lang和dir，避免布局闪烁
const initLang = getSavedLang()
document.documentElement.setAttribute('lang', initLang)
document.documentElement.setAttribute('dir', RTL_LANGS.includes(initLang) ? 'rtl' : 'ltr')

// 5. 创建i18n实例
const i18n = createI18n({
  legacy: false, // Vue3 必须关闭
  locale: initLang, // 默认语言
  fallbackLocale: 'en', // 翻译缺失兜底语言
  messages: {}, // 初始为空，手动加载语言包
  missingWarn: process.env.NODE_ENV === 'development', // 开发环境提示缺失翻译
  fallbackWarn: process.env.NODE_ENV === 'development', // 开发环境提示兜底
})

// 6. 手动加载语言包（带加载状态 + 失败兜底）
const loadLangMessage = async (lang) => {
  // 无效语言兜底
  if (!Object.keys(messages).includes(lang)) lang = DEFAULT_LANG
  try {
    isLangLoading.value = true
    // 异步加载语言包
    const messageModule = await messages[lang]()
    // 注册语言包到i18n
    const langMessages = messageModule.default || messageModule
    i18n.global.setLocaleMessage(lang, langMessages)
    return lang
  } catch (err) {
    console.error(`【i18n】加载 ${lang} 语言包失败，已切换到兜底语言 en`, err)
    // 加载失败时切换到fallbackLocale
    const fallbackLang = i18n.global.fallbackLocale.value
    const fallbackModule = await messages[fallbackLang]()
    i18n.global.setLocaleMessage(fallbackLang, fallbackModule.default || fallbackModule)
    return fallbackLang
  } finally {
    isLangLoading.value = false
  }
}

// 7. 全局语言变量
export const currentLang = ref(i18n.global.locale.value)

// 8. 封装安全的语言切换方法
export const changeLang = (targetLang) => {
  if (Object.keys(messages).includes(targetLang) && targetLang !== currentLang.value) {
    currentLang.value = targetLang
  } else {
    console.warn(`【i18n】无效语言：${targetLang}，已忽略`)
  }
}

// 9. 导出支持的语言列表（便于语言选择器复用）
export const supportLangs = Object.keys(messages).map((lang) => ({
  value: lang,
  label:
    {
      zh: '中文',
      en: 'English',
      ar: 'العربية',
      ja: '日本語',
      ko: '한국어',
      hi: 'हिन्दी',
      de: 'Deutsch',
      es: 'Español',
      pt: 'Português',
      ru: 'Русский',
      id: 'Bahasa Indonesia',
    }[lang] || lang,
}))

// 10. 监听语言变化，更新配置
watch(
  currentLang,
  async (newLang) => {
    const finalLang = await loadLangMessage(newLang)
    // 更新i18n locale
    i18n.global.locale.value = finalLang
    // 持久化到本地存储
    localStorage.setItem('app-lang', finalLang)
    // 更新HTML lang和dir
    document.documentElement.setAttribute('lang', finalLang)
    document.documentElement.setAttribute('dir', RTL_LANGS.includes(finalLang) ? 'rtl' : 'ltr')
  },
  { immediate: true },
)

// 11. 初始化默认语言包
loadLangMessage(initLang)

// 12. 开发环境语言包热更新（可选）
if (process.env.NODE_ENV === 'development') {
  const langFiles = import.meta.glob('./lang/*.json', { eager: true })
  Object.keys(langFiles).forEach((path) => {
    const match = path.match(/\.\/lang\/(.*)\.json/)
    if (match && match[1]) {
      const lang = match[1]
      if (Object.keys(messages).includes(lang)) {
        i18n.global.setLocaleMessage(lang, langFiles[path].default)
      }
    }
  })
}

export default i18n
