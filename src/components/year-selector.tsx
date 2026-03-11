'use client';

import { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { ChevronDown, Calendar, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YearSelectorProps {
  value: number;
  onChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
  className?: string;
  availableYears?: number[]; // 数据库中有数据的年份
}

export function YearSelector({
  value,
  onChange,
  minYear = 2015,
  maxYear,
  disabled = false,
  className,
  availableYears,
}: YearSelectorProps) {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  // 默认最大年份为前一年（贸易数据通常有延迟）
  const actualMaxYear = maxYear || new Date().getFullYear() - 1;

  // 生成年份列表（从最新到最旧）
  const years = useMemo(() => {
    const list = [];
    for (let year = actualMaxYear; year >= minYear; year--) {
      list.push(year);
    }
    return list;
  }, [minYear, actualMaxYear]);

  // 检查年份是否有数据
  const hasData = (year: number) => {
    return availableYears ? availableYears.includes(year) : true;
  };

  // 数据可用性说明
  const getAvailabilityNote = (year: number) => {
    if (availableYears && !hasData(year)) {
      return locale === 'zh' ? '无数据' : 'No data';
    }
    const currentYear = new Date().getFullYear();
    if (year >= currentYear - 1) {
      return locale === 'zh' ? '最新' : 'Latest';
    }
    return '';
  };

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
          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">{value}</span>
        </div>
        <ChevronDown className={cn(
          'h-4 w-4 text-gray-400 flex-shrink-0 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <div className={cn(
          'absolute z-50 mt-2 w-48',
          'bg-white border border-gray-200 rounded-xl shadow-xl',
          'overflow-hidden'
        )}>
          {/* 头部说明 */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
            {locale === 'zh' ? '选择年度' : 'Select year'}
          </div>

          {/* 年份列表 */}
          <div className="max-h-[280px] overflow-y-auto">
            {years.map(year => {
              const available = hasData(year);
              const note = getAvailabilityNote(year);
              
              return (
                <button
                  key={year}
                  onClick={() => {
                    if (available) {
                      onChange(year);
                      setIsOpen(false);
                    }
                  }}
                  disabled={!available}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-4 py-2.5',
                    'text-left text-sm transition-colors',
                    value === year && 'bg-blue-50',
                    available ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "font-mono font-medium",
                      available ? "text-gray-900" : "text-gray-400"
                    )}>
                      {year}
                    </span>
                    {note && (
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        note === (locale === 'zh' ? '无数据' : 'No data') 
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-green-100 text-green-700'
                      )}>
                        {note}
                      </span>
                    )}
                  </div>
                  {value === year && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 底部提示 */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            {locale === 'zh' 
              ? '贸易数据通常有 1-2 年延迟'
              : 'Trade data typically has 1-2 year delay'}
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
 * 年度范围选择器
 */
interface YearRangeSelectorProps {
  startYear: number;
  endYear: number;
  onStartYearChange: (year: number) => void;
  onEndYearChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
  className?: string;
  availableYears?: number[];
}

export function YearRangeSelector({
  startYear,
  endYear,
  onStartYearChange,
  onEndYearChange,
  minYear = 2015,
  maxYear,
  disabled = false,
  className,
  availableYears,
}: YearRangeSelectorProps) {
  const locale = useLocale();

  // 确保开始年份不大于结束年份
  const handleStartYearChange = (year: number) => {
    if (year > endYear) {
      onEndYearChange(year);
    }
    onStartYearChange(year);
  };

  const handleEndYearChange = (year: number) => {
    if (year < startYear) {
      onStartYearChange(year);
    }
    onEndYearChange(year);
  };

  const actualMaxYear = maxYear || new Date().getFullYear() - 1;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">
            {locale === 'zh' ? '起始年' : 'From'}
          </label>
          <YearSelector
            value={startYear}
            onChange={handleStartYearChange}
            minYear={minYear}
            maxYear={endYear}
            disabled={disabled}
            availableYears={availableYears}
            className="w-full"
          />
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400 mt-5 flex-shrink-0" />
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">
            {locale === 'zh' ? '结束年' : 'To'}
          </label>
          <YearSelector
            value={endYear}
            onChange={handleEndYearChange}
            minYear={startYear}
            maxYear={actualMaxYear}
            disabled={disabled}
            availableYears={availableYears}
            className="w-full"
          />
        </div>
      </div>
      
      {/* 年份跨度显示 */}
      <div className="text-xs text-gray-500 text-center">
        {locale === 'zh' 
          ? `共 ${endYear - startYear + 1} 年数据` 
          : `${endYear - startYear + 1} years of data`}
      </div>
    </div>
  );
}

/**
 * 快捷年份范围按钮
 */
interface QuickYearRangeProps {
  onSelect: (start: number, end: number) => void;
  currentStart: number;
  currentEnd: number;
  disabled?: boolean;
  className?: string;
}

export function QuickYearRangeButtons({
  onSelect,
  currentStart,
  currentEnd,
  disabled = false,
  className,
}: QuickYearRangeProps) {
  const locale = useLocale();
  const currentYear = new Date().getFullYear() - 1;

  const presets = [
    { label: locale === 'zh' ? '近1年' : '1 Year', start: currentYear, end: currentYear },
    { label: locale === 'zh' ? '近3年' : '3 Years', start: currentYear - 2, end: currentYear },
    { label: locale === 'zh' ? '近5年' : '5 Years', start: currentYear - 4, end: currentYear },
    { label: locale === 'zh' ? '近10年' : '10 Years', start: currentYear - 9, end: currentYear },
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {presets.map(preset => {
        const isActive = currentStart === preset.start && currentEnd === preset.end;
        return (
          <button
            key={preset.label}
            onClick={() => onSelect(preset.start, preset.end)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
