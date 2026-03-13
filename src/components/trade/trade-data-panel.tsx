'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  Ship, Globe, Package, Info, RefreshCw, Loader2, MapPin,
  Calendar, BarChart3, Minus, AlertCircle
} from 'lucide-react';
import { CountrySelector } from '@/components/common/country-selector';
import { YearRangeSelector, QuickYearRangeButtons } from '@/components/common/year-selector';
import { REPORTER_COUNTRIES } from '@/lib/country-codes';
import { cn } from '@/lib/utils';

interface TradeDataItem {
  year: number;
  export: { value: number; formatted: string; quantity: string; quantityRaw?: string };
  import: { value: number; formatted: string; quantity: string; quantityRaw?: string };
  tradeBalance: { value: number; type: 'surplus' | 'deficit' | 'balanced' };
}

interface TradePartner {
  code: string;
  name: string;
  value: number;
  valueFormatted: string;
  percentage: number;
}

interface TradeDataResult {
  success: boolean;
  cas: string;
  productName: string;
  productNameEn: string;
  hsCode: string;
  hsCodeDesc: string;
  reporterCode: string;
  reporterName: string;
  startYear: number;
  endYear: number;
  yearlyData: TradeDataItem[];
  latestYear: number;
  latestData: {
    export: {
      value: number;
      valueFormatted: string;
      quantity: string;
    } | null;
    import: {
      value: number;
      valueFormatted: string;
      quantity: string;
    } | null;
    tradeBalance: {
      value: number;
      valueFormatted: string;
      type: 'surplus' | 'deficit' | 'balanced';
    };
    topExportPartners: TradePartner[];
    topImportPartners: TradePartner[];
  };
  availableYears: number[];
  dataSource: 'un_comtrade';
  generatedAt: string;
  disclaimer: string;
}

interface TradeDataPanelProps {
  cas: string;
  productName: string;
  productNameEn: string;
  initialReporterCode?: string;
  initialStartYear?: number;
  initialEndYear?: number;
}

export function TradeDataPanel({
  cas,
  productName,
  productNameEn,
  initialReporterCode = '156',
  initialStartYear,
  initialEndYear,
}: TradeDataPanelProps) {
  const locale = useLocale();
  
  // 默认年份范围为近3年
  const currentYear = new Date().getFullYear() - 1;
  const defaultStartYear = initialStartYear || currentYear - 2;
  const defaultEndYear = initialEndYear || currentYear;
  
  const [reporterCode, setReporterCode] = useState(initialReporterCode);
  const [startYear, setStartYear] = useState(defaultStartYear);
  const [endYear, setEndYear] = useState(defaultEndYear);
  const [tradeData, setTradeData] = useState<TradeDataResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取贸易数据
  const fetchTradeData = useCallback(async (
    code: string, 
    start: number, 
    end: number
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/trade-data/${cas}?reporterCode=${code}&startYear=${start}&endYear=${end}`
      );
      const data = await response.json();
      
      if (data.success) {
        setTradeData(data.data);
      } else {
        setError(data.error || '获取数据失败');
      }
    } catch (err) {
      setError('网络请求失败，请稍后重试');
      console.error('Trade data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cas]);

  // 国家变更时重新获取数据
  const handleCountryChange = useCallback((code: string) => {
    setReporterCode(code);
    fetchTradeData(code, startYear, endYear);
  }, [fetchTradeData, startYear, endYear]);

  // 年份范围变更
  const handleYearRangeChange = useCallback((start: number, end: number) => {
    setStartYear(start);
    setEndYear(end);
    fetchTradeData(reporterCode, start, end);
  }, [fetchTradeData, reporterCode]);

  // 快捷年份选择
  const handleQuickYearSelect = useCallback((start: number, end: number) => {
    handleYearRangeChange(start, end);
  }, [handleYearRangeChange]);

  // 初始加载
  useEffect(() => {
    fetchTradeData(reporterCode, startYear, endYear);
  }, []);

  // 获取当前国家名称
  const reporterCountry = REPORTER_COUNTRIES.find(c => c.code === reporterCode);
  const reporterName = reporterCountry 
    ? (locale === 'zh' ? reporterCountry.name : reporterCountry.nameEn)
    : reporterCode;

  return (
    <div className="space-y-6">
      {/* 筛选器面板 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="space-y-4">
          {/* 国家选择 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {locale === 'zh' ? '报告国/地区' : 'Reporter Country'}
              </span>
            </div>
            <CountrySelector
              value={reporterCode}
              onChange={handleCountryChange}
              placeholder={locale === 'zh' ? '选择报告国' : 'Select Reporter'}
              disabled={isLoading}
              className="w-full max-w-md"
            />
          </div>

          {/* 年份范围选择 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {locale === 'zh' ? '数据年度范围' : 'Year Range'}
              </span>
            </div>
            <YearRangeSelector
              startYear={startYear}
              endYear={endYear}
              onStartYearChange={(y) => handleYearRangeChange(y, endYear)}
              onEndYearChange={(y) => handleYearRangeChange(startYear, y)}
              minYear={2015}
              maxYear={currentYear}
              disabled={isLoading}
              availableYears={tradeData?.availableYears}
              className="max-w-md"
            />
          </div>

          {/* 快捷年份按钮 */}
          <div>
            <QuickYearRangeButtons
              onSelect={handleQuickYearSelect}
              currentStart={startYear}
              currentEnd={endYear}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">
              {locale === 'zh' 
                ? `正在查询 ${reporterName} ${startYear}-${endYear} 贸易数据...` 
                : `Loading ${startYear}-${endYear} trade data for ${reporterName}...`}
            </p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <Info className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium mb-2">
            {locale === 'zh' ? '数据获取失败' : 'Failed to load data'}
          </p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchTradeData(reporterCode, startYear, endYear)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            {locale === 'zh' ? '重试' : 'Retry'}
          </button>
        </div>
      )}

      {/* 数据展示 */}
      {!isLoading && !error && tradeData && (
        <>
          {/* 数据来源标识 */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <Globe className="h-4 w-4" />
                UN Comtrade 官方数据
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {locale === 'zh' 
                ? `${tradeData.startYear}-${tradeData.endYear} 年度数据` 
                : `${tradeData.startYear}-${tradeData.endYear} Data`}
            </span>
          </div>

          {/* 无数据提示 */}
          {tradeData.yearlyData.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
              <p className="text-yellow-700 font-medium mb-2">
                {locale === 'zh' ? '暂无数据' : 'No Data Available'}
              </p>
              <p className="text-yellow-600 text-sm">
                {locale === 'zh' 
                  ? `暂无 ${reporterName} 在 ${startYear}-${endYear} 年的贸易数据。请联系管理员同步数据。`
                  : `No trade data available for ${reporterName} from ${startYear}-${endYear}. Please contact admin to sync data.`}
              </p>
            </div>
          )}

          {/* 年度数据趋势 */}
          {tradeData.yearlyData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                {locale === 'zh' ? '年度贸易趋势' : 'Annual Trade Trend'}
              </h3>
              
              {/* 数据表格 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-500">
                        {locale === 'zh' ? '年度' : 'Year'}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-green-600">
                        {locale === 'zh' ? '出口' : 'Export'}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-orange-600">
                        {locale === 'zh' ? '进口' : 'Import'}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500">
                        {locale === 'zh' ? '差额' : 'Balance'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeData.yearlyData.map((item) => (
                      <tr key={item.year} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-3 font-mono font-medium">{item.year}</td>
                        <td className="text-right py-3 px-3 text-green-700">{item.export.formatted}</td>
                        <td className="text-right py-3 px-3 text-orange-700">{item.import.formatted}</td>
                        <td className={cn(
                          "text-right py-3 px-3 font-medium",
                          item.tradeBalance.type === 'surplus' ? 'text-blue-600' :
                          item.tradeBalance.type === 'deficit' ? 'text-red-600' : 'text-gray-600'
                        )}>
                          {item.tradeBalance.type === 'surplus' ? '+' : 
                           item.tradeBalance.type === 'deficit' ? '-' : ''}
                          {formatValue(item.tradeBalance.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 最新年度详细数据 */}
          {tradeData.yearlyData.length > 0 && tradeData.latestData && (
            <>
              {/* HS 编码信息 */}
              {tradeData.hsCode && (
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">HS 编码</div>
                    <div className="font-mono font-bold text-lg text-gray-900">{tradeData.hsCode}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">
                      {locale === 'zh' ? '最新数据年度' : 'Latest Year'}
                    </div>
                    <div className="font-medium text-gray-900">{tradeData.latestYear}</div>
                  </div>
                </div>
              )}

              {/* 进出口概览（最新年度） */}
              {tradeData.latestData.export && tradeData.latestData.import && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 出口数据 */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">
                        {locale === 'zh' ? '出口' : 'Export'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-700 mb-1">
                      {tradeData.latestData.export.valueFormatted}
                    </div>
                    {tradeData.latestData.export.quantity && tradeData.latestData.export.quantity !== '-' && (
                      <div className="text-sm text-green-600">
                        <span className="text-green-500">{locale === 'zh' ? '重量: ' : 'Weight: '}</span>
                        {tradeData.latestData.export.quantity}
                      </div>
                    )}
                  </div>

                  {/* 进口数据 */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowDownRight className="h-5 w-5 text-orange-600" />
                      <span className="font-semibold text-orange-800">
                        {locale === 'zh' ? '进口' : 'Import'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-orange-700 mb-1">
                      {tradeData.latestData.import.valueFormatted}
                    </div>
                    {tradeData.latestData.import.quantity && tradeData.latestData.import.quantity !== '-' && (
                      <div className="text-sm text-orange-600">
                        <span className="text-orange-500">{locale === 'zh' ? '重量: ' : 'Weight: '}</span>
                        {tradeData.latestData.import.quantity}
                      </div>
                    )}
                  </div>

                  {/* 贸易差额 */}
                  <div className={cn(
                    'rounded-xl p-5 border',
                    tradeData.latestData.tradeBalance.type === 'surplus' 
                      ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100' 
                      : tradeData.latestData.tradeBalance.type === 'deficit'
                      ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-100'
                      : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
                  )}>
                    <div className="flex items-center gap-2 mb-3">
                      {tradeData.latestData.tradeBalance.type === 'surplus' ? (
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      ) : tradeData.latestData.tradeBalance.type === 'deficit' ? (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      ) : (
                        <Minus className="h-5 w-5 text-gray-600" />
                      )}
                      <span className={cn(
                        'font-semibold',
                        tradeData.latestData.tradeBalance.type === 'surplus' 
                          ? 'text-blue-800' 
                          : tradeData.latestData.tradeBalance.type === 'deficit'
                          ? 'text-red-800'
                          : 'text-gray-800'
                      )}>
                        {locale === 'zh' ? '贸易差额' : 'Trade Balance'}
                      </span>
                    </div>
                    <div className={cn(
                      'text-2xl font-bold mb-1',
                      tradeData.latestData.tradeBalance.type === 'surplus' 
                        ? 'text-blue-700' 
                        : tradeData.latestData.tradeBalance.type === 'deficit'
                        ? 'text-red-700'
                        : 'text-gray-700'
                    )}>
                      {tradeData.latestData.tradeBalance.type === 'deficit' ? '-' : '+'}
                      {tradeData.latestData.tradeBalance.valueFormatted}
                    </div>
                    <div className="text-sm text-gray-600">
                      {tradeData.latestData.tradeBalance.type === 'surplus' 
                        ? (locale === 'zh' ? '贸易顺差' : 'Trade Surplus')
                        : tradeData.latestData.tradeBalance.type === 'deficit'
                        ? (locale === 'zh' ? '贸易逆差' : 'Trade Deficit')
                        : (locale === 'zh' ? '贸易平衡' : 'Balanced')}
                    </div>
                  </div>
                </div>
              )}

              {/* 贸易伙伴列表 - 全部展示（排除未列明国家） */}
              {(tradeData.latestData.topExportPartners.length > 0 || tradeData.latestData.topImportPartners.length > 0) && (
                <>
                  {/* 说明提示 */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    <Info className="h-3.5 w-3.5" />
                    <span>
                      {locale === 'zh' 
                        ? '注：已排除"未列明国家"统计代码，展示明确归属的贸易伙伴数据' 
                        : 'Note: "Unspecified countries" code excluded, showing identified trade partners only'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 出口目的国列表 */}
                  {tradeData.latestData.topExportPartners.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Ship className="h-5 w-5 text-green-600" />
                        {locale === 'zh' ? '出口目的国' : 'Export Destinations'}
                        <span className="text-sm font-normal text-gray-500">
                          ({tradeData.latestData.topExportPartners.length} {locale === 'zh' ? '个国家/地区' : 'countries/regions'})
                        </span>
                      </h4>
                      <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                        {tradeData.latestData.topExportPartners.map((partner, index) => (
                          <div key={partner.code} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded">
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                                index < 3 ? "bg-green-500 text-white" : "bg-green-100 text-green-700"
                              )}>
                                {index + 1}
                              </span>
                              <span className="font-medium text-gray-800">{partner.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{partner.valueFormatted}</div>
                              <div className="text-xs text-gray-500">{partner.percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 进口来源国列表 */}
                  {tradeData.latestData.topImportPartners.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="h-5 w-5 text-orange-600" />
                        {locale === 'zh' ? '进口来源国' : 'Import Sources'}
                        <span className="text-sm font-normal text-gray-500">
                          ({tradeData.latestData.topImportPartners.length} {locale === 'zh' ? '个国家/地区' : 'countries/regions'})
                        </span>
                      </h4>
                      <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                        {tradeData.latestData.topImportPartners.map((partner, index) => (
                          <div key={`${partner.code}-${index}`} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded">
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                                index < 3 ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-700"
                              )}>
                                {index + 1}
                              </span>
                              <span className="font-medium text-gray-800">{partner.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{partner.valueFormatted}</div>
                              <div className="text-xs text-gray-500">{partner.percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </>
              )}

              {/* 单价信息已移除 - HS 大类均价无参考价值 */}
            </>
          )}

          {/* 免责声明 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>
                {locale === 'zh' ? '生成时间' : 'Generated at'}: {new Date(tradeData.generatedAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}
              </span>
              <button
                onClick={() => fetchTradeData(reporterCode, startYear, endYear)}
                disabled={isLoading}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
                {locale === 'zh' ? '刷新数据' : 'Refresh'}
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex gap-2">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>{locale === 'zh' ? '免责声明' : 'Disclaimer'}:</strong>{' '}
                {tradeData.disclaimer}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 格式化金额
function formatValue(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)} 十亿美元`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)} 百万美元`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} 千美元`;
  }
  return `${value.toFixed(2)} 美元`;
}

export default TradeDataPanel;
