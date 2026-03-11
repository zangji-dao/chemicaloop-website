'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdminLocale, adminDefaultLocale, adminLocales, adminLocaleNames, adminTranslations } from '@/lib/admin-i18n';
import { getAdminToken } from '@/services/adminAuthService';

interface AdminLocaleContextType {
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  localeNames: typeof adminLocaleNames;
  locales: typeof adminLocales;
  translateProduct: (productId: string, fields?: ('name' | 'remark' | 'origin')[]) => Promise<void>;
  getTranslatedField: (product: { translations?: { name?: Record<string, string>; remark?: Record<string, string>; origin?: Record<string, string> } }, field: 'name' | 'remark' | 'origin', originalValue?: string) => string;
}

const AdminLocaleContext = createContext<AdminLocaleContextType | undefined>(undefined);

export function AdminLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AdminLocale>(adminDefaultLocale);

  // 从 localStorage 加载语言设置
  useEffect(() => {
    const savedLocale = localStorage.getItem('admin_locale') as AdminLocale;
    if (savedLocale && adminLocales.includes(savedLocale)) {
      setLocaleState(savedLocale);
    } else {
      // 尝试从浏览器语言推断
      const browserLang = navigator.language.split('-')[0];
      if (adminLocales.includes(browserLang as AdminLocale)) {
        setLocaleState(browserLang as AdminLocale);
      }
    }
  }, []);

  // 保存语言设置到 localStorage
  const setLocale = useCallback((newLocale: AdminLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem('admin_locale', newLocale);
  }, []);

  // 翻译函数
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = adminTranslations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // 回退到英文
        value = adminTranslations['en'];
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
    
    let result = typeof value === 'string' ? value : key;
    
    // 替换模板参数，如 {current}, {total}
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }
    
    return result;
  }, [locale]);

  // 翻译产品字段
  const translateProduct = useCallback(async (productId: string, fields?: ('name' | 'remark' | 'origin')[]) => {
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/products/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          targetLanguage: locale,
          fields,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to translate product:', error);
      return { success: false };
    }
  }, [locale]);

  // 获取翻译后的字段值
  const getTranslatedField = useCallback((
    product: { translations?: { name?: Record<string, string>; remark?: Record<string, string>; origin?: Record<string, string> } },
    field: 'name' | 'remark' | 'origin',
    originalValue?: string
  ): string => {
    if (!product.translations?.[field]?.[locale]) {
      return originalValue || '';
    }
    return product.translations[field]![locale]!;
  }, [locale]);

  return (
    <AdminLocaleContext.Provider value={{ 
      locale, 
      setLocale, 
      t, 
      localeNames: adminLocaleNames,
      locales: adminLocales,
      translateProduct,
      getTranslatedField,
    }}>
      {children}
    </AdminLocaleContext.Provider>
  );
}

export function useAdminLocale() {
  const context = useContext(AdminLocaleContext);
  if (!context) {
    throw new Error('useAdminLocale must be used within AdminLocaleProvider');
  }
  return context;
}
