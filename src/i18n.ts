import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './lib/i18n';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validLocale = (locale && locales.includes(locale as any)) ? locale : defaultLocale;

  // 使用动态导入加载 messages
  let messages;
  try {
    const messagesModule = await import(`./i18n/www/${validLocale}.json`);
    messages = messagesModule.default;
  } catch (error) {
    console.error(`Failed to load messages for locale "${validLocale}":`, error);
    // 如果当前语言加载失败，fallback 到默认语言
    try {
      const defaultMessagesModule = await import(`./i18n/www/${defaultLocale}.json`);
      messages = defaultMessagesModule.default;
      console.warn(`Using default locale "${defaultLocale}" translations`);
    } catch (defaultError) {
      console.error(`Failed to load default locale messages:`, defaultError);
      messages = {};
    }
  }

  return {
    locale: validLocale,
    messages
  };
});
