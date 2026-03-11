'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AdminLocale, adminLocaleNames, adminLocaleFlags, adminLocales } from '@/lib/admin-i18n';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';

interface AdminLanguageSwitcherProps {
  /** 自定义类名 */
  className?: string;
  /** 按钮样式变体 */
  variant?: 'default' | 'ghost' | 'outline';
}

/**
 * 管理后台语言切换器组件
 * 
 * 功能：
 * - 显示国旗图标 + 语言名称
 * - 下拉菜单展示所有支持的语言
 * - 自动保存选择到 localStorage
 */
export default function AdminLanguageSwitcher({
  className = '',
  variant = 'default',
}: AdminLanguageSwitcherProps) {
  const { locale, setLocale } = useAdminLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理语言选择
  const handleSelectLanguage = (lang: AdminLocale) => {
    setLocale(lang);
    setIsOpen(false);
  };

  // 按钮样式
  const getButtonStyles = () => {
    const baseStyles = 'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors';
    
    switch (variant) {
      case 'ghost':
        return `${baseStyles} text-slate-300 hover:text-white hover:bg-slate-700/50`;
      case 'outline':
        return `${baseStyles} text-slate-300 border border-slate-600 hover:bg-slate-700 hover:border-slate-500`;
      default:
        return `${baseStyles} text-slate-300 hover:text-white hover:bg-slate-700`;
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={getButtonStyles()}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <img
          src={adminLocaleFlags[locale]}
          alt={adminLocaleNames[locale]}
          className="w-5 h-auto"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        <span>{adminLocaleNames[locale]}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉菜单 */}
          <div
            className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20 py-1 max-h-[80vh] overflow-y-auto"
            role="listbox"
            aria-label="Available languages"
          >
            {adminLocales.map((lang) => (
              <button
                key={lang}
                onClick={() => handleSelectLanguage(lang)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-slate-700 transition-colors ${
                  locale === lang ? 'text-blue-400 bg-slate-700/50' : 'text-slate-300'
                }`}
                role="option"
                aria-selected={locale === lang}
              >
                <img
                  src={adminLocaleFlags[lang]}
                  alt={adminLocaleNames[lang]}
                  className="w-5 h-auto flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <span className="flex-1 truncate">{adminLocaleNames[lang]}</span>
                {locale === lang && (
                  <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
