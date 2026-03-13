'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronDown, Search, Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REPORTER_COUNTRIES, COMMON_COUNTRIES, COUNTRIES_BY_REGION, type Country } from '@/data/country-codes';

interface CountrySelectorProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CountrySelector({
  value,
  onChange,
  placeholder = '选择报告国',
  disabled = false,
  className,
}: CountrySelectorProps) {
  const t = useTranslations('products.detail');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<string>('all');

  // 过滤国家列表
  const filteredCountries = useMemo(() => {
    let countries = REPORTER_COUNTRIES;

    // 按地区过滤
    if (activeRegion !== 'all') {
      countries = COUNTRIES_BY_REGION[activeRegion] || [];
    }

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      countries = countries.filter(
        c => c.name.toLowerCase().includes(query) || 
             c.nameEn.toLowerCase().includes(query) ||
             c.code.includes(query)
      );
    }

    return countries;
  }, [activeRegion, searchQuery]);

  // 当前选中的国家
  const selectedCountry = REPORTER_COUNTRIES.find(c => c.code === value);

  // 地区列表
  const regions = [
    { key: 'all', label: '全部' },
    { key: '东亚', label: '东亚' },
    { key: '东南亚', label: '东南亚' },
    { key: '西欧', label: '西欧' },
    { key: '东欧', label: '东欧' },
    { key: '北美洲', label: '北美洲' },
    { key: '南美洲', label: '南美洲' },
    { key: '大洋洲', label: '大洋洲' },
    { key: '西亚', label: '西亚/中东' },
    { key: '北非', label: '北非' },
    { key: '东非', label: '东非' },
    { key: '西非', label: '西非' },
  ];

  return (
    <div className={cn('relative', className)}>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3',
          'bg-white border border-gray-300 rounded-lg',
          'text-left text-sm font-medium',
          'hover:border-blue-400 hover:bg-gray-50',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'transition-all duration-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
          {selectedCountry ? (
            <span className="truncate">
              {locale === 'zh' ? selectedCountry.name : selectedCountry.nameEn}
            </span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn(
          'h-4 w-4 text-gray-400 flex-shrink-0 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <div className={cn(
          'absolute z-50 mt-2 w-[400px]',
          'bg-white border border-gray-200 rounded-xl shadow-xl',
          'overflow-hidden'
        )}>
          {/* 搜索框 */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'zh' ? '搜索国家名称或代码...' : 'Search country name or code...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 地区筛选标签 */}
          <div className="px-3 py-2 border-b border-gray-100 overflow-x-auto">
            <div className="flex gap-1 flex-wrap">
              {regions.map(region => (
                <button
                  key={region.key}
                  onClick={() => setActiveRegion(region.key)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                    activeRegion === region.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {region.label}
                </button>
              ))}
            </div>
          </div>

          {/* 常用国家 */}
          {!searchQuery && activeRegion === 'all' && (
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="text-xs font-medium text-gray-500 mb-2">常用国家</div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_COUNTRIES.map(country => (
                  <button
                    key={country.code}
                    onClick={() => {
                      onChange(country.code);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                      value === country.code
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-400'
                    )}
                  >
                    {locale === 'zh' ? country.name : country.nameEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 国家列表 */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredCountries.length > 0 ? (
              <div className="py-1">
                {filteredCountries.map(country => (
                  <button
                    key={country.code}
                    onClick={() => {
                      onChange(country.code);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-4 py-2.5',
                      'text-left text-sm hover:bg-gray-50 transition-colors',
                      value === country.code && 'bg-blue-50'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={cn(
                        'w-8 h-6 rounded flex items-center justify-center text-xs font-mono',
                        'bg-gray-100 text-gray-600'
                      )}>
                        {country.code}
                      </span>
                      <span className="font-medium text-gray-900 truncate">
                        {locale === 'zh' ? country.name : country.nameEn}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{country.region}</span>
                      {value === country.code && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 text-sm">
                {locale === 'zh' ? '未找到匹配的国家' : 'No matching countries found'}
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            {locale === 'zh' 
              ? `共 ${REPORTER_COUNTRIES.length} 个国家/地区可选`
              : `${REPORTER_COUNTRIES.length} countries/regions available`}
          </div>
        </div>
      )}

      {/* 点击外部关闭 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * 简化版国家选择器（用于表单）
 */
export function CountrySelect({
  value,
  onChange,
  placeholder = '选择国家',
  disabled = false,
  className,
}: CountrySelectorProps) {
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-lg',
          'text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <option value="">{placeholder}</option>
        <optgroup label="常用国家">
          {COMMON_COUNTRIES.map(country => (
            <option key={country.code} value={country.code}>
              {locale === 'zh' ? country.name : country.nameEn} ({country.code})
            </option>
          ))}
        </optgroup>
        <optgroup label="全部国家">
          {REPORTER_COUNTRIES.map(country => (
            <option key={country.code} value={country.code}>
              {locale === 'zh' ? country.name : country.nameEn} ({country.code})
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
