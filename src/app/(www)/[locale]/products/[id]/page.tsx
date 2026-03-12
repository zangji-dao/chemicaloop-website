'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import PageBanner from '@/components/PageBanner';
import TradeDataDisplay from '@/components/trade-data-display';
import { TradeDataPanel } from '@/components/trade-data-panel';
import { getToken } from '@/services/authService';
import { 
  ArrowLeft, Tag, DollarSign, Globe, Package, Droplet, Check, ChevronRight, Filter, 
  Thermometer, Beaker, AlertTriangle, ExternalLink, Loader2, FlaskConical, Shield, 
  Atom, FileText, Layers, Zap, TrendingUp, Ship, Send, X
} from 'lucide-react';
import Link from 'next/link';

// 产品数据接口（从数据库读取）
interface ProductData {
  id: string;
  cas: string;
  name: string;
  nameEn: string;
  formula: string | null;
  description: string | null;
  imageUrl: string | null;
  referencePrice: string | null;
  status: string;
  
  // PubChem 化学信息
  pubchemCid: number | null;
  molecularWeight: string | null;
  smiles: string | null;
  inchi: string | null;
  inchiKey: string | null;
  xlogp: string | null;
  
  // 物理化学性质
  physicalDescription: string | null;
  colorForm: string | null;
  odor: string | null;
  boilingPoint: string | null;
  meltingPoint: string | null;
  flashPoint: string | null;
  solubility: string | null;
  density: string | null;
  vaporPressure: string | null;
  
  // 计算属性
  hBondDonorCount: number | null;
  hBondAcceptorCount: number | null;
  rotatableBondCount: number | null;
  tpsa: string | null;
  heavyAtomCount: number | null;
  complexity: number | null;
  
  // 安全信息
  hazardClasses: string | null;
  healthHazards: string | null;
  ghsClassification: string | null;
  toxicitySummary: string | null;
  carcinogenicity: string | null;
  
  // 同义词
  synonyms: string[] | null;
  
  // 行业应用
  applications: string[] | null;
  
  // 多语言翻译
  translations: {
    name?: Record<string, string>;
    description?: Record<string, string>;
    applications?: Record<string, string[]>;
  } | null;
  
  // 数据来源
  pubchemDataSource: string | null;
  pubchemSyncedAt: string | null;
  
  // 供应商列表
  suppliers: SupplierData[];
  
  createdAt: string;
  updatedAt: string;
}

// 供应商数据接口
interface SupplierData {
  id: string;
  productId: string;
  name: string;
  company: string | null;
  price: string;
  moq: number;
  deliveryTime: string | null;
  location: string | null;
  rating: string | null;
  status: string;
  translations?: {
    name?: Record<string, string>;
  } | null;
}

// 数据字典 - 使用 key 对应翻译键
const physicalStateKeys = ['liquid', 'powder', 'crystal', 'granular'] as const;
const purityGradeKeys = ['industrial', 'laboratory', 'pharmaceutical', 'reagent', 'electronic'] as const;
const packagingTypeKeys = ['drum', 'bottle', 'bag', 'bulk'] as const;
const unitKeys = ['kg', 'L', 'g', 'ml'] as const;
const countryKeys = ['china', 'germany', 'usa', 'japan', 'india'] as const;

type Locale = 'en' | 'zh' | 'ja' | 'ko' | 'de' | 'fr' | 'es' | 'pt' | 'ru' | 'ar';

export default function ProductDetailPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations('products.detail');
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const action = searchParams.get('action') as 'supply' | 'purchase' | null;
  
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'properties' | 'safety' | 'trade'>('suppliers');
  
  // 供货/采购表单状态
  const [showActionForm, setShowActionForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // 供货表单数据
  const [supplyForm, setSupplyForm] = useState({
    price: '',
    priceUnit: 'kg',
    quantity: '',
    quantityUnit: 'kg',
    moq: '',
    deliveryTime: '',
    packaging: '',
    purity: '',
    origin: '',
    validity: '',
    remarks: '',
  });
  
  // 采购表单数据
  const [purchaseForm, setPurchaseForm] = useState({
    quantity: '',
    quantityUnit: 'kg',
    targetPrice: '',
    targetPriceUnit: 'kg',
    deliveryLocation: '',
    deliveryTime: '',
    purity: '',
    packaging: '',
    paymentTerms: '',
    remarks: '',
  });

  const [selectedSpecs, setSelectedSpecs] = useState({
    physicalState: 'liquid',
    purityGrade: 'industrial',
    packagingType: 'drum',
    unit: 'kg',
    country: 'china',
  });

  // 从公开 API 获取产品信息
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/public/www/products/${productId}?locale=${locale}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setProductData(data.data);
        } else {
          setError(data.error || 'Product not found');
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Failed to load product data');
      } finally {
        setLoading(false);
      }
    };
    
    if (productId) {
      fetchProductData();
    }
  }, [productId]);

  // 检测 action 参数，自动显示表单
  useEffect(() => {
    if (action && productData) {
      setShowActionForm(true);
    }
  }, [action, productData]);

  // 提交供货信息
  const handleSupplySubmit = async () => {
    if (!supplyForm.price || !supplyForm.quantity) {
      setSubmitError(locale === 'zh' ? '请填写价格和数量' : 'Please fill in price and quantity');
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      const token = getToken();
      const response = await fetch('/api/private/www/supply-inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'supply',
          productId: productData?.id,
          cas: productData?.cas,
          productName: productData?.name,
          ...supplyForm,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setShowActionForm(false);
          setSubmitSuccess(false);
        }, 2000);
      } else {
        setSubmitError(data.error || t('supplyForm.error'));
      }
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError(t('supplyForm.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // 提交采购询价
  const handlePurchaseSubmit = async () => {
    if (!purchaseForm.quantity) {
      setSubmitError(locale === 'zh' ? '请填写需求数量' : 'Please fill in quantity');
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      const token = getToken();
      const response = await fetch('/api/private/www/supply-inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'purchase',
          productId: productData?.id,
          cas: productData?.cas,
          productName: productData?.name,
          ...purchaseForm,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setShowActionForm(false);
          setSubmitSuccess(false);
        }, 2000);
      } else {
        setSubmitError(data.error || t('purchaseForm.error'));
      }
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError(t('purchaseForm.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // 按价格排序供应商
  const sortedSuppliers = useMemo(() => {
    if (!productData?.suppliers) return [];
    return [...productData.suppliers].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  }, [productData?.suppliers]);

  // 计算参考价格（EXW）
  const referencePrice = useMemo(() => {
    if (!productData?.suppliers || productData.suppliers.length === 0) return null;
    const totalPrice = productData.suppliers.reduce((sum, s) => sum + parseFloat(s.price), 0);
    return totalPrice / productData.suppliers.length;
  }, [productData?.suppliers]);

  const handleSpecChange = (key: string, value: string) => {
    setSelectedSpecs((prev) => ({ ...prev, [key]: value }));
  };

  // 获取翻译标签
  const getPhysicalStateLabel = (key: string) => t(`physicalStates.${key}`);
  const getPurityGradeLabel = (key: string) => t(`purityGrades.${key}`);
  const getPackagingTypeLabel = (key: string) => t(`packagingTypes.${key}`);
  const getUnitLabel = (key: string) => key; // 单位直接返回 key
  const getCountryLabel = (key: string) => t(`countries.${key}`);
  
  // 获取翻译内容
  const getTranslatedName = (): string => {
    if (!productData) return '';
    
    // 优先使用翻译
    if (productData.translations?.name && typeof productData.translations.name === 'object') {
      const translatedName = productData.translations.name[locale];
      if (translatedName) return translatedName;
    }
    
    // 中文环境用中文名，英文环境用英文名
    if (locale === 'zh') {
      return productData.name || '';
    }
    return productData.nameEn || productData.name || '';
  };
  
  const getTranslatedDescription = () => {
    if (productData?.translations?.description?.[locale]) {
      return productData.translations.description[locale];
    }
    return productData?.description;
  };
  
  const getTranslatedApplications = () => {
    if (productData?.translations?.applications?.[locale]) {
      return productData.translations.applications[locale];
    }
    return productData?.applications;
  };

  // 获取供应商产品名称翻译
  const getSupplierName = (supplier: SupplierData): string => {
    // 优先使用翻译
    if (supplier.translations?.name?.[locale]) {
      return supplier.translations.name[locale];
    }
    // 返回默认名称
    return supplier.name || '';
  };

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20 lg:pt-56">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">{t('loading')}</span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !productData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20 lg:pt-56">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{error || t('productNotFound')}</p>
            <Link
              href={`/${locale}/products`}
              className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToProducts')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Page Banner */}
      <PageBanner
        title={getTranslatedName()}
        subtitle={`CAS: ${productData.cas}`}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToProducts')}
          </Link>
        </div>
      </div>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 左侧：产品基本信息 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 产品标题和基本信息 */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* 头部信息区 */}
                <div className="p-6 pb-0">
                  {/* CAS 标签 */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase bg-slate-100 text-slate-600">
                      CAS
                    </span>
                    <span className="font-mono text-sm text-slate-500">{productData.cas}</span>
                  </div>
                  
                  {/* 产品名称 */}
                  <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
                    {getTranslatedName()}
                  </h1>
                  
                  {/* 分子式 */}
                  {productData.formula && (
                    <div className="mt-3 font-mono text-lg text-slate-600">
                      {productData.formula}
                    </div>
                  )}
                </div>
                
                {/* 描述区域 */}
                {getTranslatedDescription() && (
                  <div className="px-6 py-5 mt-6 bg-slate-50/80 border-t border-b border-slate-100">
                    <p className="text-slate-600 text-[15px] leading-[1.75]">
                      {getTranslatedDescription()}
                    </p>
                  </div>
                )}
                
                {/* 行业应用 */}
                {getTranslatedApplications() && getTranslatedApplications()!.length > 0 && (
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      <Zap className="h-3.5 w-3.5" />
                      {t('applications')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getTranslatedApplications()!.slice(0, 6).map((app, index) => (
                        <span 
                          key={index}
                          className="inline-block px-3 py-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 产品图片 */}
                {productData.imageUrl && (
                  <div className="px-6 pb-6">
                    <div className="bg-slate-50 rounded-lg p-6 flex justify-center">
                      <img
                        src={productData.imageUrl}
                        alt={productData.nameEn}
                        className="w-64 h-64 object-contain"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 化学信息卡片 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                {/* 分子信息概览 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {productData.formula && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">{t('molecularFormula')}</div>
                      <div className="font-mono font-semibold text-gray-900">{productData.formula}</div>
                    </div>
                  )}
                  {productData.molecularWeight && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">{t('molecularWeight')}</div>
                      <div className="font-semibold text-gray-900">{productData.molecularWeight}</div>
                    </div>
                  )}
                  {productData.xlogp && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">XLogP</div>
                      <div className="font-semibold text-gray-900">{productData.xlogp}</div>
                    </div>
                  )}
                </div>

                {/* Tab 切换 */}
                <div className="border-b border-gray-200 mb-6">
                  <div className="flex gap-6">
                    <button
                      onClick={() => setActiveTab('suppliers')}
                      className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'suppliers'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Package className="h-4 w-4 inline mr-2" />
                      {t('suppliers')} ({sortedSuppliers.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('properties')}
                      className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'properties'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FlaskConical className="h-4 w-4 inline mr-2" />
                      {t('properties')}
                    </button>
                    <button
                        onClick={() => setActiveTab('safety')}
                        className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === 'safety'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Shield className="h-4 w-4 inline mr-2" />
                        {t('safety')}
                      </button>
                    <button
                        onClick={() => setActiveTab('trade')}
                        className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === 'trade'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Ship className="h-4 w-4 inline mr-2" />
                        {t('tradeData')}
                      </button>
                    </div>
                  </div>

                  {/* Tab 内容 */}
                  {activeTab === 'suppliers' && (
                    <div>
                      {/* 供应商列表头部 */}
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                          {t('supplierList')} ({sortedSuppliers.length})
                        </h2>
                        {sortedSuppliers.length > 0 && referencePrice && (
                          <div className="text-sm text-gray-600">
                            {t('referencePrice')}:{' '}
                            <span className="font-semibold text-blue-600">
                              ${referencePrice.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">EXW</span>
                          </div>
                        )}
                      </div>

                      {/* 无匹配结果 */}
                      {sortedSuppliers.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600">{t('noSupplierInfo')}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sortedSuppliers.map((supplier, index) => (
                            <div
                              key={supplier.id}
                              className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all"
                            >
                              {/* 供应商信息 */}
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900">{getSupplierName(supplier)}</h3>
                                    {supplier.location && (
                                      <span className="text-sm text-gray-500">
                                        {supplier.location}
                                      </span>
                                    )}
                                  </div>
                                  {supplier.company && (
                                    <div className="text-sm text-gray-600">
                                      {supplier.company}
                                    </div>
                                  )}
                                </div>
                                {index === 0 && (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    {t('bestPrice')}
                                  </span>
                                )}
                              </div>

                              {/* 商业信息 */}
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">{t('exwPrice')}</div>
                                  <div className="text-xl font-bold text-blue-600">
                                    ${parseFloat(supplier.price).toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">{t('moq')}</div>
                                  <div className="font-semibold text-gray-900">
                                    {supplier.moq}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">{t('delivery')}</div>
                                  <div className="font-semibold text-gray-900">{supplier.deliveryTime || '-'}</div>
                                </div>
                              </div>

                              {/* 操作按钮 */}
                              <div className="flex gap-3">
                                <button className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
                                  {t('requestQuote')}
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                                <button className="px-6 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                                  {t('details')}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 物理化学性质 Tab */}
                  {activeTab === 'properties' && (
                    <div className="space-y-6">
                      {/* 结构信息 */}
                      {(productData.smiles || productData.inchiKey) && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Atom className="h-5 w-5 text-blue-600" />
                            {t('structureInfo')}
                          </h3>
                          <div className="space-y-3">
                            {productData.smiles && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-xs text-gray-500 mb-1">SMILES</div>
                                <code className="text-sm text-gray-900 break-all font-mono">{productData.smiles}</code>
                              </div>
                            )}
                            {productData.inchi && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-xs text-gray-500 mb-1">InChI</div>
                                <code className="text-xs text-gray-900 break-all font-mono">{productData.inchi}</code>
                              </div>
                            )}
                            {productData.inchiKey && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-xs text-gray-500 mb-1">InChIKey</div>
                                <code className="text-sm text-gray-900 font-mono">{productData.inchiKey}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 物理性质 */}
                      {(productData.boilingPoint || productData.meltingPoint || productData.flashPoint || productData.density || productData.solubility) && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Thermometer className="h-5 w-5 text-blue-600" />
                            {t('physicalProperties')}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {productData.physicalDescription && (
                              <div className="bg-blue-50 rounded-lg p-4">
                                <div className="text-xs text-blue-600 mb-1">{t('appearance')}</div>
                                <div className="text-sm text-gray-900">{productData.physicalDescription.slice(0, 80)}...</div>
                              </div>
                            )}
                            {productData.colorForm && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-xs text-gray-500 mb-1">{t('colorForm')}</div>
                                <div className="text-sm text-gray-900">{productData.colorForm}</div>
                              </div>
                            )}
                            {productData.odor && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-xs text-gray-500 mb-1">{t('odor')}</div>
                                <div className="text-sm text-gray-900">{productData.odor.slice(0, 50)}...</div>
                              </div>
                            )}
                            {productData.meltingPoint && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-xs text-gray-500 mb-1">{t('meltingPoint')}</div>
                                <div className="text-sm font-semibold text-gray-900">{productData.meltingPoint}</div>
                              </div>
                            )}
                            {productData.boilingPoint && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-xs text-gray-500 mb-1">{t('boilingPoint')}</div>
                                <div className="text-sm font-semibold text-gray-900">{productData.boilingPoint}</div>
                              </div>
                            )}
                            {productData.flashPoint && (
                              <div className="bg-amber-50 rounded-lg p-4">
                                <div className="text-xs text-amber-600 mb-1">{t('flashPoint')}</div>
                                <div className="text-sm font-semibold text-amber-900">{productData.flashPoint}</div>
                              </div>
                            )}
                            {productData.density && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-xs text-gray-500 mb-1">{t('density')}</div>
                                <div className="text-sm text-gray-900">{productData.density}</div>
                              </div>
                            )}
                            {productData.solubility && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-xs text-gray-500 mb-1">{t('solubility')}</div>
                                <div className="text-sm text-gray-900">{productData.solubility.slice(0, 50)}...</div>
                              </div>
                            )}
                            {productData.vaporPressure && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-xs text-gray-500 mb-1">{t('vaporPressure')}</div>
                                <div className="text-sm text-gray-900">{productData.vaporPressure}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 计算属性 */}
                      {(productData.hBondDonorCount || productData.hBondAcceptorCount || productData.tpsa || productData.complexity) && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-blue-600" />
                            {t('computedProperties')}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {productData.xlogp && (
                              <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-gray-900">{productData.xlogp}</div>
                                <div className="text-xs text-gray-500">XLogP</div>
                              </div>
                            )}
                            {productData.hBondDonorCount && (
                              <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-gray-900">{productData.hBondDonorCount}</div>
                                <div className="text-xs text-gray-500">{t('hBondDonors')}</div>
                              </div>
                            )}
                            {productData.hBondAcceptorCount && (
                              <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-gray-900">{productData.hBondAcceptorCount}</div>
                                <div className="text-xs text-gray-500">{t('hBondAcceptors')}</div>
                              </div>
                            )}
                            {productData.tpsa && (
                              <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-gray-900">{productData.tpsa}</div>
                                <div className="text-xs text-gray-500">TPSA Å²</div>
                              </div>
                            )}
                            {productData.rotatableBondCount && (
                              <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-gray-900">{productData.rotatableBondCount}</div>
                                <div className="text-xs text-gray-500">{t('rotatableBonds')}</div>
                              </div>
                            )}
                            {productData.heavyAtomCount && (
                              <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-gray-900">{productData.heavyAtomCount}</div>
                                <div className="text-xs text-gray-500">{t('heavyAtoms')}</div>
                              </div>
                            )}
                            {productData.complexity && (
                              <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-gray-900">{productData.complexity}</div>
                                <div className="text-xs text-gray-500">{t('complexity')}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 同义词 */}
                      {productData.synonyms && productData.synonyms.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            {t('synonyms')}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {productData.synonyms.slice(0, 15).map((syn, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                                {syn}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 安全信息 Tab */}
                  {activeTab === 'safety' && (
                    <div className="space-y-6">
                      {/* 危险分类 */}
                      {productData.hazardClasses && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                          <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            {t('hazardClassification')}
                          </h3>
                          <div className="text-amber-800">{productData.hazardClasses}</div>
                        </div>
                      )}

                      {/* GHS 分类 */}
                      {productData.ghsClassification && productData.ghsClassification.trim() && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">GHS {t('ghsClassification')}</h3>
                          <div className="bg-gray-50 rounded-lg p-4 text-gray-700">{productData.ghsClassification}</div>
                        </div>
                      )}

                      {/* 健康危害 */}
                      {productData.healthHazards && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                          <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            {t('healthHazards')}
                          </h3>
                          <div className="text-sm text-red-800 leading-relaxed">{productData.healthHazards}</div>
                        </div>
                      )}

                      {/* 毒性摘要 */}
                      {productData.toxicitySummary && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('toxicitySummary')}</h3>
                          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">{productData.toxicitySummary.slice(0, 500)}...</div>
                        </div>
                      )}

                      {/* 致癌性 */}
                      {productData.carcinogenicity && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                          <h3 className="text-lg font-semibold text-purple-900 mb-3">{t('carcinogenicity')}</h3>
                          <div className="text-sm text-purple-800">{productData.carcinogenicity}</div>
                        </div>
                      )}

                      {/* 如果没有安全信息 */}
                      {!productData.hazardClasses && !productData.healthHazards && !productData.toxicitySummary && !productData.carcinogenicity && (
                        <div className="text-center py-8 text-gray-500">
                          <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>{t('noSafetyInfo')}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 贸易数据 Tab */}
                  {activeTab === 'trade' && productData?.cas && (
                    <TradeDataPanel
                      cas={productData.cas}
                      productName={productData.name || ''}
                      productNameEn={productData.nameEn || ''}
                      initialReporterCode="156"
                    />
                  )}
                </div>
            </div>

            {/* 右侧：规格选择器 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {t('selectSpecifications')}
                </h2>

                {/* 物理形态 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplet className="h-5 w-5 text-blue-600" />
                    <label className="font-semibold text-gray-900">
                      {t('physicalState')}
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {physicalStateKeys.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleSpecChange('physicalState', key)}
                        className={`px-4 py-2.5 rounded-lg border-2 transition-colors text-sm font-medium ${
                          selectedSpecs.physicalState === key
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {getPhysicalStateLabel(key)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 纯度等级 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="h-5 w-5 text-blue-600" />
                    <label className="font-semibold text-gray-900">
                      {t('purityGrade')}
                    </label>
                  </div>
                  <div className="space-y-2">
                    {purityGradeKeys.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleSpecChange('purityGrade', key)}
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-colors text-sm font-medium text-left flex items-center justify-between ${
                          selectedSpecs.purityGrade === key
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span>{getPurityGradeLabel(key)}</span>
                        {selectedSpecs.purityGrade === key && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 包装方式 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-5 w-5 text-blue-600" />
                    <label className="font-semibold text-gray-900">
                      {t('packagingType')}
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {packagingTypeKeys.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleSpecChange('packagingType', key)}
                        className={`px-4 py-2.5 rounded-lg border-2 transition-colors text-sm font-medium ${
                          selectedSpecs.packagingType === key
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {getPackagingTypeLabel(key)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 单位 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <label className="font-semibold text-gray-900">
                      {t('unit')}
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {unitKeys.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleSpecChange('unit', key)}
                        className={`px-3 py-2 rounded-lg border-2 transition-colors text-sm font-medium text-center ${
                          selectedSpecs.unit === key
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {getUnitLabel(key)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 国家 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <label className="font-semibold text-gray-900">
                      {t('country')}
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {countryKeys.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleSpecChange('country', key)}
                        className={`px-4 py-2.5 rounded-lg border-2 transition-colors text-sm font-medium ${
                          selectedSpecs.country === key
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {getCountryLabel(key)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 参考价格提示 */}
                {referencePrice && sortedSuppliers.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        {t('referencePriceExw')}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700 mb-2">
                      ${referencePrice.toFixed(2)}/{selectedSpecs.unit}
                    </div>
                    <p className="text-xs text-blue-600">
                      {t('basedOnSuppliers', { count: sortedSuppliers.length })}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      💡 {t('excludesShipping')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 供货/采购表单弹窗 */}
      {showActionForm && productData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {action === 'supply' ? t('supplyForm.title') : t('purchaseForm.title')}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {action === 'supply' ? t('supplyForm.subtitle') : t('purchaseForm.subtitle')}
                </p>
              </div>
              <button
                onClick={() => setShowActionForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* 产品信息 */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{productData.name}</div>
                  <div className="text-sm text-gray-500">CAS: {productData.cas}</div>
                </div>
              </div>
            </div>

            {/* 成功提示 */}
            {submitSuccess && (
              <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  {action === 'supply' ? t('supplyForm.success') : t('purchaseForm.success')}
                </span>
              </div>
            )}

            {/* 错误提示 */}
            {submitError && (
              <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{submitError}</span>
              </div>
            )}

            {/* 表单内容 */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {action === 'supply' ? (
                // 供货表单
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('supplyForm.price')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={supplyForm.price}
                        onChange={(e) => setSupplyForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder={t('supplyForm.pricePlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('supplyForm.priceUnit')}
                      </label>
                      <select
                        value={supplyForm.priceUnit}
                        onChange={(e) => setSupplyForm(prev => ({ ...prev, priceUnit: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="kg">$/kg</option>
                        <option value="MT">$/MT</option>
                        <option value="drum">$/Drum</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('supplyForm.quantity')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={supplyForm.quantity}
                        onChange={(e) => setSupplyForm(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder={t('supplyForm.quantityPlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('supplyForm.quantityUnit')}
                      </label>
                      <select
                        value={supplyForm.quantityUnit}
                        onChange={(e) => setSupplyForm(prev => ({ ...prev, quantityUnit: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="kg">kg</option>
                        <option value="MT">MT</option>
                        <option value="drum">Drum</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('supplyForm.moq')}
                      </label>
                      <input
                        type="text"
                        value={supplyForm.moq}
                        onChange={(e) => setSupplyForm(prev => ({ ...prev, moq: e.target.value }))}
                        placeholder={t('supplyForm.moqPlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('supplyForm.deliveryTime')}
                      </label>
                      <input
                        type="text"
                        value={supplyForm.deliveryTime}
                        onChange={(e) => setSupplyForm(prev => ({ ...prev, deliveryTime: e.target.value }))}
                        placeholder={t('supplyForm.deliveryTimePlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('supplyForm.packaging')}
                      </label>
                      <input
                        type="text"
                        value={supplyForm.packaging}
                        onChange={(e) => setSupplyForm(prev => ({ ...prev, packaging: e.target.value }))}
                        placeholder={t('supplyForm.packagingPlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('supplyForm.purity')}
                      </label>
                      <input
                        type="text"
                        value={supplyForm.purity}
                        onChange={(e) => setSupplyForm(prev => ({ ...prev, purity: e.target.value }))}
                        placeholder={t('supplyForm.purityPlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('supplyForm.origin')}
                      </label>
                      <input
                        type="text"
                        value={supplyForm.origin}
                        onChange={(e) => setSupplyForm(prev => ({ ...prev, origin: e.target.value }))}
                        placeholder={t('supplyForm.originPlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('supplyForm.validity')}
                      </label>
                      <input
                        type="text"
                        value={supplyForm.validity}
                        onChange={(e) => setSupplyForm(prev => ({ ...prev, validity: e.target.value }))}
                        placeholder={t('supplyForm.validityPlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('supplyForm.remarks')}
                    </label>
                    <textarea
                      value={supplyForm.remarks}
                      onChange={(e) => setSupplyForm(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder={t('supplyForm.remarksPlaceholder')}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              ) : (
                // 采购表单
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('purchaseForm.quantity')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={purchaseForm.quantity}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder={t('purchaseForm.quantityPlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('purchaseForm.quantityUnit')}
                      </label>
                      <select
                        value={purchaseForm.quantityUnit}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, quantityUnit: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="kg">kg</option>
                        <option value="MT">MT</option>
                        <option value="drum">Drum</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('purchaseForm.targetPrice')}
                      </label>
                      <input
                        type="number"
                        value={purchaseForm.targetPrice}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, targetPrice: e.target.value }))}
                        placeholder={t('purchaseForm.targetPricePlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('purchaseForm.targetPriceUnit')}
                      </label>
                      <select
                        value={purchaseForm.targetPriceUnit}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, targetPriceUnit: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="kg">$/kg</option>
                        <option value="MT">$/MT</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('purchaseForm.deliveryLocation')}
                      </label>
                      <input
                        type="text"
                        value={purchaseForm.deliveryLocation}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                        placeholder={t('purchaseForm.deliveryLocationPlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('purchaseForm.deliveryTime')}
                      </label>
                      <input
                        type="text"
                        value={purchaseForm.deliveryTime}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, deliveryTime: e.target.value }))}
                        placeholder={t('purchaseForm.deliveryTimePlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('purchaseForm.purity')}
                      </label>
                      <input
                        type="text"
                        value={purchaseForm.purity}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, purity: e.target.value }))}
                        placeholder={t('purchaseForm.purityPlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('purchaseForm.packaging')}
                      </label>
                      <input
                        type="text"
                        value={purchaseForm.packaging}
                        onChange={(e) => setPurchaseForm(prev => ({ ...prev, packaging: e.target.value }))}
                        placeholder={t('purchaseForm.packagingPlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('purchaseForm.paymentTerms')}
                    </label>
                    <input
                      type="text"
                      value={purchaseForm.paymentTerms}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      placeholder={t('purchaseForm.paymentTermsPlaceholder')}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('purchaseForm.remarks')}
                    </label>
                    <textarea
                      value={purchaseForm.remarks}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder={t('purchaseForm.remarksPlaceholder')}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 表单底部 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowActionForm(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {locale === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={action === 'supply' ? handleSupplySubmit : handlePurchaseSubmit}
                disabled={submitting || submitSuccess}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {action === 'supply' ? t('supplyForm.submitting') : t('purchaseForm.submitting')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {action === 'supply' ? t('supplyForm.submit') : t('purchaseForm.submit')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-300">&copy; 2024 Chemicaloop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
