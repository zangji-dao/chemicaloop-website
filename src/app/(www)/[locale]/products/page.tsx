'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import PageBanner from '@/components/PageBanner';
import { Search, Package, Loader2, AlertCircle, Users, Beaker, PlusCircle, X, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

type Locale = 'en' | 'zh' | 'ja' | 'ko' | 'de' | 'fr' | 'es' | 'pt' | 'ru' | 'ar';

// SPU 数据类型（从公开 API 返回）
interface SPU {
  id: string;
  cas: string;
  name: string;
  nameEn: string | null;
  formula: string | null;
  hsCode?: string | null;
  synonyms: string[] | null;
  translations: {
    name?: Record<string, string>;
    synonyms?: Record<string, string[]>;
  } | null;
  imageUrl: string | null;
  supplierCount: number;
  priceRange: {
    min: number;
    max: number;
  } | null;
}

// 产品卡片组件
function ProductCard({ 
  spu, 
  locale, 
  userRole 
}: { 
  spu: SPU; 
  locale: Locale; 
  userRole: string | null;
}) {
  // 获取显示名称（只显示当前语言）
  const getDisplayName = () => {
    // 优先使用翻译
    if (spu.translations?.name?.[locale]) {
      return spu.translations.name[locale];
    }
    // 中文环境用中文名，英文环境用英文名
    if (locale === 'zh') {
      return spu.name;
    }
    return spu.nameEn || spu.name;
  };
  
  const displayName = getDisplayName();

  // 是否显示价格（游客不显示具体价格）
  const showPrice = userRole === 'AGENT' || userRole === 'USER';

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col">
      {/* 产品图片区域 */}
      <Link href={`/${locale}/products/${spu.cas}`} className="block relative">
        <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative overflow-hidden">
          {/* 产品图片 */}
          {spu.imageUrl ? (
            <img
              src={spu.imageUrl}
              alt={displayName}
              className="w-3/4 h-3/4 object-contain relative z-10 group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center relative z-10">
              <Beaker className="w-12 h-12 text-gray-300 mb-1" />
              <span className="text-gray-400 text-xs">{locale === 'zh' ? '暂无图片' : 'No image'}</span>
            </div>
          )}
          
          {/* 供应商数量徽章 */}
          {spu.supplierCount > 0 && (
            <div className="absolute top-2 right-2 bg-white/90 text-gray-600 text-xs px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Users className="w-3 h-3" />
              {spu.supplierCount}
            </div>
          )}
          
          {/* CAS 号标签 */}
          <div className="absolute bottom-2 left-2 bg-gray-800/80 text-white text-xs font-mono px-2 py-0.5 rounded">
            {spu.cas}
          </div>
        </div>
      </Link>

      {/* 产品信息 */}
      <div className="p-4 flex-1 flex flex-col">
        {/* 产品名称 */}
        <Link href={`/${locale}/products/${spu.cas}`}>
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-1 hover:text-blue-600 transition-colors">
            {displayName}
          </h3>
        </Link>
        
        {/* CAS 和 HS Code 标签 */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-mono rounded">
            CAS: {spu.cas}
          </span>
          {spu.hsCode && (
            <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 text-xs font-mono rounded">
              HS: {spu.hsCode.slice(0, 6)}
            </span>
          )}
        </div>
        
        {/* 分子式 */}
        {spu.formula && (
          <div className="text-xs text-gray-500 font-mono mb-2">
            {spu.formula}
          </div>
        )}

        {/* 价格信息 */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          {spu.priceRange ? (
            showPrice ? (
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-lg font-bold text-gray-900">
                  ${spu.priceRange.min.toFixed(2)}
                </span>
                {spu.priceRange.max !== spu.priceRange.min && (
                  <>
                    <span className="text-gray-400">-</span>
                    <span className="text-base font-bold text-gray-900">
                      ${spu.priceRange.max.toFixed(2)}
                    </span>
                  </>
                )}
                <span className="text-xs text-gray-500">/kg</span>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-3">
                {locale === 'zh' ? '登录查看价格' : 'Sign in for price'}
              </p>
            )
          ) : (
            <p className="text-sm text-gray-400 mb-3">
              {locale === 'zh' ? '暂无报价' : 'No quotes'}
            </p>
          )}

          {/* 按钮区域 */}
          <div className="flex gap-2">
            <Link
              href={`/${locale}/products/${spu.cas}?action=supply`}
              className="flex-1 text-center py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              {locale === 'zh' ? '供货' : 'Supply'}
            </Link>
            <Link
              href={`/${locale}/products/${spu.cas}?action=purchase`}
              className="flex-1 text-center py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
            >
              {locale === 'zh' ? '采购' : 'Purchase'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const userRole = user?.role || null;

  const [spuList, setSpuList] = useState<SPU[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 12;
  
  // SPU申请弹窗状态
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestCas, setRequestCas] = useState('');
  const [requestReason, setRequestReason] = useState<string>('');
  const [requestReasonDetail, setRequestReasonDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // 申请原因选项
  const reasonOptions = [
    { value: 'purchase', label: locale === 'zh' ? '需要采购' : 'Need to Purchase' },
    { value: 'supply', label: locale === 'zh' ? '可以供货' : 'Can Supply' },
    { value: 'data_report', label: locale === 'zh' ? '查看数据报告' : 'View Data Report' },
    { value: 'other', label: locale === 'zh' ? '其他' : 'Other' },
  ];
  
  // CAS号格式化和验证
  const formatCasNumber = (input: string): { formatted: string; isValid: boolean; checkDigit: number | null } => {
    const casRegex = /^\d{1,7}-\d{2}-\d$/;
    let casNumber = input.replace(/\s+/g, '').toUpperCase();
    
    // 如果已经是标准格式，直接使用
    if (casRegex.test(casNumber)) {
      const parts = casNumber.split('-');
      const digits = parts[0] + parts[1];
      const checkDigit = parseInt(parts[2]);
      let calculatedCheck = 0;
      for (let i = 0; i < digits.length; i++) {
        calculatedCheck += parseInt(digits[digits.length - 1 - i]) * (i + 1);
      }
      calculatedCheck = calculatedCheck % 10;
      return { formatted: casNumber, isValid: calculatedCheck === checkDigit, checkDigit };
    }
    
    // 尝试格式化纯数字
    const digitsOnly = casNumber.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 4) {
      const checkDigit = parseInt(digitsOnly.slice(-1));
      const middle = digitsOnly.slice(-3, -1);
      const first = digitsOnly.slice(0, -3);
      casNumber = `${first}-${middle}-${checkDigit}`;
      
      // 验证校验位
      const allDigits = first + middle;
      let calculatedCheck = 0;
      for (let i = 0; i < allDigits.length; i++) {
        calculatedCheck += parseInt(allDigits[allDigits.length - 1 - i]) * (i + 1);
      }
      calculatedCheck = calculatedCheck % 10;
      return { formatted: casNumber, isValid: calculatedCheck === checkDigit, checkDigit };
    }
    
    return { formatted: input, isValid: false, checkDigit: null };
  };
  
  const casPreview = formatCasNumber(requestCas);

  // 获取 SPU 列表
  const fetchSPUs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        locale: locale,
      });
      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/public/products?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSpuList(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.error || 'Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchSPUs();
  }, [fetchSPUs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 打开申请弹窗
  const openRequestModal = () => {
    setRequestCas(searchTerm);
    setRequestReason('');
    setRequestReasonDetail('');
    setSubmitSuccess(false);
    setSubmitError(null);
    setShowRequestModal(true);
  };

  // 提交SPU申请
  const handleRequestSubmit = async () => {
    if (!requestCas.trim()) {
      setSubmitError(locale === 'zh' ? '请输入CAS号' : 'Please enter CAS number');
      return;
    }
    
    if (!requestReason) {
      setSubmitError(locale === 'zh' ? '请选择申请原因' : 'Please select a reason');
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await fetch('/api/private/www/spu-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cas: requestCas.trim(),
          reason: requestReason,
          reasonDetail: requestReason === 'other' ? requestReasonDetail : null,
          userId: user?.id,
          userEmail: user?.email,
          userName: user?.name,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setShowRequestModal(false);
        }, 2000);
      } else {
        setSubmitError(data.error || (locale === 'zh' ? '提交失败' : 'Failed to submit'));
      }
    } catch (err) {
      console.error('Submit request error:', err);
      setSubmitError(locale === 'zh' ? '提交失败，请重试' : 'Failed to submit, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Page Banner */}
      <PageBanner
        title={t('title')}
        subtitle={t('subtitle')}
      />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* 搜索框 */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={locale === 'zh' 
                  ? '搜索产品名称、CAS号...' 
                  : 'Search by name, CAS number...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 结果统计 */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 text-sm">
              {loading ? (
                locale === 'zh' ? '加载中...' : 'Loading...'
              ) : (
                <>
                  <span className="font-medium text-gray-900">{total}</span> {locale === 'zh' ? '个产品' : 'products'}
                </>
              )}
            </p>
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">
                {locale === 'zh' ? '加载中...' : 'Loading...'}
              </span>
            </div>
          )}

          {/* 错误状态 */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchSPUs}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                {locale === 'zh' ? '重试' : 'Retry'}
              </button>
            </div>
          )}

          {/* 空状态 - 显示申请入口 */}
          {!loading && !error && spuList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                {searchTerm 
                  ? (locale === 'zh' ? `未找到"${searchTerm}"相关的产品` : `No products found for "${searchTerm}"`)
                  : (locale === 'zh' ? '暂无产品' : 'No products found')
                }
              </p>
              
              {/* 如果有搜索词且未找到结果，显示申请入口 */}
              {searchTerm && (
                <div className="mt-4 text-center">
                  <p className="text-gray-500 text-sm mb-3">
                    {locale === 'zh' 
                      ? '找不到您需要的产品？可以申请添加' 
                      : 'Cannot find what you need? Request to add'}
                  </p>
                  <button
                    onClick={openRequestModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {locale === 'zh' ? '申请添加CAS' : 'Request New CAS'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 产品网格 */}
          {!loading && !error && spuList.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {spuList.map((spu) => (
                  <ProductCard 
                    key={spu.id} 
                    spu={spu} 
                    locale={locale}
                    userRole={userRole}
                  />
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    {locale === 'zh' ? '上一页' : 'Previous'}
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 rounded-lg text-sm ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    {locale === 'zh' ? '下一页' : 'Next'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* SPU申请弹窗 */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {/* 弹窗头部 */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {locale === 'zh' ? '申请添加CAS' : 'Request New CAS'}
              </h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 成功提示 */}
            {submitSuccess && (
              <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">
                    {locale === 'zh' ? '申请提交成功！' : 'Request submitted!'}
                  </p>
                  <p className="text-green-600 text-sm">
                    {locale === 'zh' 
                      ? '我们将在1-2个工作日内处理您的申请' 
                      : 'We will process your request in 1-2 business days'}
                  </p>
                </div>
              </div>
            )}

            {/* 表单内容 */}
            {!submitSuccess && (
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">
                  {locale === 'zh'
                    ? '请输入您需要添加的CAS号，我们的管理员将尽快审核。'
                    : 'Enter the CAS number you need, our admin will review it shortly.'}
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    CAS号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={requestCas}
                    onChange={(e) => setRequestCas(e.target.value)}
                    placeholder={locale === 'zh' ? '例如: 50-00-0 或 64175' : 'e.g., 50-00-0 or 64175'}
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 ${
                      requestCas && casPreview.formatted !== requestCas 
                        ? 'border-blue-300 focus:ring-blue-500'
                        : requestCas && !casPreview.isValid 
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {/* 实时预览格式化结果 */}
                  {requestCas && (
                    <div className="mt-2 text-xs">
                      {casPreview.formatted !== requestCas ? (
                        <div className="flex items-center gap-2 text-blue-600">
                          <span>→ {casPreview.formatted}</span>
                          <span className="text-blue-500">({locale === 'zh' ? '自动格式化' : 'auto-format'})</span>
                        </div>
                      ) : null}
                      {casPreview.checkDigit !== null && (
                        <div className={`flex items-center gap-1 mt-1 ${casPreview.isValid ? 'text-green-600' : 'text-red-500'}`}>
                          {casPreview.isValid ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>{locale === 'zh' ? '校验位正确' : 'Valid checksum'}</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span>{locale === 'zh' ? '校验位错误，请检查CAS号' : 'Invalid checksum, please verify'}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {locale === 'zh' 
                      ? '支持格式：50-00-0 或纯数字 64175（自动格式化）' 
                      : 'Format: 50-00-0 or digits only 64175 (auto-format)'}
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'zh' ? '申请原因' : 'Reason'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">{locale === 'zh' ? '请选择...' : 'Please select...'}</option>
                    {reasonOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 其他原因详情 */}
                {requestReason === 'other' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {locale === 'zh' ? '详细说明' : 'Details'}
                    </label>
                    <textarea
                      value={requestReasonDetail}
                      onChange={(e) => setRequestReasonDetail(e.target.value)}
                      placeholder={locale === 'zh' ? '请说明您的具体需求...' : 'Please describe your needs...'}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                )}

                {/* 错误提示 */}
                {submitError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {submitError}
                  </div>
                )}

                {/* 提示 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  <p className="font-medium mb-1">
                    {locale === 'zh' ? '温馨提示：' : 'Note:'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-600">
                    <li>
                      {locale === 'zh' 
                        ? '请确保CAS号格式正确' 
                        : 'Please ensure correct CAS format'}
                    </li>
                    <li>
                      {locale === 'zh'
                        ? '审核结果将通过站内信通知您'
                        : 'Result will be notified via message'}
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 底部按钮 */}
            {!submitSuccess && (
              <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {locale === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  onClick={handleRequestSubmit}
                  disabled={submitting || !requestCas.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {locale === 'zh' ? '提交中...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      {locale === 'zh' ? '提交申请' : 'Submit Request'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
