'use client';

import { useTranslations, useLocale } from 'next-intl';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  Ship, Globe, DollarSign, Package, Info, ExternalLink, FileText,
  Minus
} from 'lucide-react';

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
  year: number;
  reporter: {
    code: string;
    name: string;
  };
  export: {
    value: number;
    valueFormatted: string;
    quantity: number;
    quantityFormatted: string;
  };
  import: {
    value: number;
    valueFormatted: string;
    quantity: number;
    quantityFormatted: string;
  };
  tradeBalance: {
    value: number;
    valueFormatted: string;
    type: 'surplus' | 'deficit' | 'balanced';
  };
  topExportPartners: TradePartner[];
  topImportPartners: TradePartner[];
  unitPrice: {
    export: number;
    import: number;
  };
  generatedAt: string;
  dataSource: string;
  disclaimer: string;
  // Web Search 回退时的字段
  summary?: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
    siteName: string;
    publishTime?: string;
  }>;
  keyData?: {
    hsCode?: string;
    mentionedCountries?: string[];
    priceRange?: string[];
  };
}

interface TradeDataDisplayProps {
  tradeData: TradeDataResult;
}

export default function TradeDataDisplay({ tradeData }: TradeDataDisplayProps) {
  const t = useTranslations('products.detail');
  const locale = useLocale();

  // 判断数据来源
  const isFromComtrade = tradeData.dataSource === 'un-comtrade';
  const isFromWebSearch = tradeData.dataSource === 'web-search';

  return (
    <div className="space-y-6">
      {/* 数据来源标识 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isFromComtrade ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <Globe className="h-4 w-4" />
              UN Comtrade 官方数据
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <FileText className="h-4 w-4" />
              网络搜索数据
            </span>
          )}
          <span className="text-sm text-gray-500">
            {tradeData.year} 年数据
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {locale === 'zh' ? '报告国' : 'Reporter'}: {tradeData.reporter.name}
        </span>
      </div>

      {/* HS 编码信息 */}
      {tradeData.hsCode && (
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-1">HS 编码</div>
            <div className="font-mono font-bold text-lg text-gray-900">{tradeData.hsCode}</div>
            {tradeData.hsCodeDesc && (
              <div className="text-sm text-gray-600 mt-1">{tradeData.hsCodeDesc}</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">产品名称</div>
            <div className="font-medium text-gray-900">{locale === 'zh' ? tradeData.productName : tradeData.productNameEn}</div>
          </div>
        </div>
      )}

      {/* UN Comtrade 结构化数据展示 */}
      {isFromComtrade && tradeData.export && (
        <>
          {/* 进出口概览 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 出口数据 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">出口</span>
              </div>
              <div className="text-2xl font-bold text-green-700 mb-1">
                {tradeData.export.valueFormatted}
              </div>
              <div className="text-sm text-green-600">
                {tradeData.export.quantityFormatted}
              </div>
            </div>

            {/* 进口数据 */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownRight className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-800">进口</span>
              </div>
              <div className="text-2xl font-bold text-orange-700 mb-1">
                {tradeData.import.valueFormatted}
              </div>
              <div className="text-sm text-orange-600">
                {tradeData.import.quantityFormatted}
              </div>
            </div>

            {/* 贸易差额 */}
            <div className={`rounded-xl p-5 border ${
              tradeData.tradeBalance.type === 'surplus' 
                ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100' 
                : tradeData.tradeBalance.type === 'deficit'
                ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-100'
                : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {tradeData.tradeBalance.type === 'surplus' ? (
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                ) : tradeData.tradeBalance.type === 'deficit' ? (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                ) : (
                  <Minus className="h-5 w-5 text-gray-600" />
                )}
                <span className={`font-semibold ${
                  tradeData.tradeBalance.type === 'surplus' 
                    ? 'text-blue-800' 
                    : tradeData.tradeBalance.type === 'deficit'
                    ? 'text-red-800'
                    : 'text-gray-800'
                }`}>
                  贸易差额
                </span>
              </div>
              <div className={`text-2xl font-bold mb-1 ${
                tradeData.tradeBalance.type === 'surplus' 
                  ? 'text-blue-700' 
                  : tradeData.tradeBalance.type === 'deficit'
                  ? 'text-red-700'
                  : 'text-gray-700'
              }`}>
                {tradeData.tradeBalance.type === 'deficit' ? '-' : '+'}
                {tradeData.tradeBalance.valueFormatted}
              </div>
              <div className="text-sm text-gray-600">
                {tradeData.tradeBalance.type === 'surplus' 
                  ? '贸易顺差' 
                  : tradeData.tradeBalance.type === 'deficit'
                  ? '贸易逆差'
                  : '贸易平衡'}
              </div>
            </div>
          </div>

          {/* 主要贸易伙伴 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 主要出口目的国 */}
            {tradeData.topExportPartners && tradeData.topExportPartners.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Ship className="h-5 w-5 text-green-600" />
                  主要出口目的国
                </h4>
                <div className="space-y-3">
                  {tradeData.topExportPartners.map((partner, index) => (
                    <div key={partner.code} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-medium">
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

            {/* 主要进口来源国 */}
            {tradeData.topImportPartners && tradeData.topImportPartners.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  主要进口来源国
                </h4>
                <div className="space-y-3">
                  {tradeData.topImportPartners.map((partner, index) => (
                    <div key={partner.code} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-medium">
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

          {/* 单价信息 */}
          {(tradeData.unitPrice.export > 0 || tradeData.unitPrice.import > 0) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">出口均价</div>
                <div className="font-semibold text-gray-900">
                  ${tradeData.unitPrice.export.toFixed(2)}/吨
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">进口均价</div>
                <div className="font-semibold text-gray-900">
                  ${tradeData.unitPrice.import.toFixed(2)}/吨
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Web Search 数据展示（备选） */}
      {isFromWebSearch && tradeData.summary && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('tradeOverview')}</h3>
          </div>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {tradeData.summary}
          </p>
        </div>
      )}

      {/* Web Search 的关键数据 */}
      {isFromWebSearch && tradeData.keyData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tradeData.keyData.hsCode && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">HS {t('hsCode')}</div>
              <div className="font-mono font-semibold text-gray-900">{tradeData.keyData.hsCode}</div>
            </div>
          )}
          {tradeData.keyData.mentionedCountries && tradeData.keyData.mentionedCountries.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 col-span-2">
              <div className="text-xs text-gray-500 mb-1">{t('mainCountries')}</div>
              <div className="flex flex-wrap gap-1">
                {tradeData.keyData.mentionedCountries.map((country: string) => (
                  <span key={country} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">
                    {country}
                  </span>
                ))}
              </div>
            </div>
          )}
          {tradeData.keyData.priceRange && tradeData.keyData.priceRange.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">{t('priceRange')}</div>
              <div className="font-semibold text-gray-900 text-sm">
                {tradeData.keyData.priceRange[0]}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 数据来源链接 */}
      {tradeData.sources && tradeData.sources.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            {t('dataSources')} ({tradeData.sources.length})
          </h3>
          <div className="space-y-3">
            {tradeData.sources.slice(0, 5).map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 line-clamp-2 hover:text-blue-600">
                      {source.title}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {source.snippet}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>{source.siteName}</span>
                      {source.publishTime && (
                        <>
                          <span>•</span>
                          <span>{new Date(source.publishTime).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 生成时间和免责声明 */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>
            {t('generatedAt')}: {new Date(tradeData.generatedAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}
          </span>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex gap-2">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>{t('disclaimer')}:</strong> {tradeData.disclaimer || t('disclaimerText')}
          </div>
        </div>
      </div>
    </div>
  );
}
