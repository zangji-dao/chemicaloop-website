'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Eye,
  Loader2,
  AlertCircle,
  ImageIcon,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import { getAdminToken } from '@/services/adminAuthService';

// 获取翻译后的字段值
function getTranslatedField(
  product: ProductItem,
  field: 'name' | 'remark' | 'origin',
  locale: string,
  originalValue?: string
): string {
  if (product.translations?.[field]?.[locale]) {
    return product.translations[field]![locale]!;
  }
  return originalValue || '';
}

interface ProductItem {
  id: string;
  cas: string;
  name: string;
  purity?: string;
  package_spec?: string;
  price?: number;
  min_order?: number;
  stock?: number;
  stock_public?: boolean;
  origin?: string;
  status: string;
  review_note?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at?: string;
  agent_id: string;
  agent_name: string;
  agent_email: string;
  country?: string;
  city?: string;
  catalog_id?: string;
  image_key?: string;
  remark?: string;
  translations?: {
    name?: Record<string, string>;
    remark?: Record<string, string>;
    origin?: Record<string, string>;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  active: number;
  inactive: number;
}

interface ReviewDetail {
  product: ProductItem;
  catalog: {
    id?: string;
    exists: boolean;
    isNew?: boolean;
    hasImage?: boolean;
    needsGeneration?: boolean;
    isGenerating?: boolean;
    imageKey?: string;
    imageUrl?: string;
    imageError?: boolean;
    imageErrorMessage?: string;
    message?: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: '待审核', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: Clock },
  approved: { label: '已通过', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: XCircle },
  active: { label: '已上架', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle },
  inactive: { label: '已下架', color: 'text-slate-400', bgColor: 'bg-slate-500/20', icon: Package },
};

export default function AdminProductsPage() {
  const { t, locale } = useAdminLocale();
  
  // 状态配置（使用翻译）
  const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
    pending: { label: t('products.pending'), color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: Clock },
    approved: { label: t('products.approved'), color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: CheckCircle },
    rejected: { label: t('products.rejected'), color: 'text-red-400', bgColor: 'bg-red-500/20', icon: XCircle },
    active: { label: t('products.active'), color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle },
    inactive: { label: t('products.inactive'), color: 'text-slate-400', bgColor: 'bg-slate-500/20', icon: Package },
  };

  const tabs = [
    { key: 'pending', label: t('products.pending') },
    { key: 'active', label: t('products.active') },
    { key: 'approved', label: t('products.approved') },
    { key: 'rejected', label: t('products.rejected') },
    { key: 'inactive', label: t('products.inactive') },
  ];
  
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    active: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);

  // 审核详情弹窗状态
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDetail, setReviewDetail] = useState<ReviewDetail | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const token = getAdminToken();
        const params = new URLSearchParams({
          page: '1',
          limit: '20',
          status: activeTab,
        });

        if (search) params.append('search', search);

        const response = await fetch(`/api/admin/products?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setProducts(data.data);
          setPagination((prev) => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
        }
      } catch (error) {
        console.error('Fetch products error:', error);
      } finally {
        setLoading(false);
      }

      // Fetch stats
      try {
        const token = getAdminToken();
        const response = await fetch('/api/admin/products/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Fetch stats error:', error);
      }
    };

    loadData();
  }, [activeTab, search]);

  // 语言切换时触发翻译
  useEffect(() => {
    if (products.length === 0) return;

    // 检查是否有产品需要翻译
    const productsNeedingTranslation = products.filter(p => {
      const hasNameTranslation = p.translations?.name?.[locale];
      const hasOriginTranslation = !p.origin || p.translations?.origin?.[locale];
      return !hasNameTranslation || !hasOriginTranslation;
    });

    if (productsNeedingTranslation.length === 0) return;

    // 异步翻译（不阻塞UI）
    const translateProducts = async () => {
      const token = getAdminToken();
      
      // 只翻译前5个产品，避免一次性太多请求
      const toTranslate = productsNeedingTranslation.slice(0, 5);
      
      for (const product of toTranslate) {
        try {
          await fetch('/api/admin/products/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId: product.id,
              targetLanguage: locale,
              fields: ['name', 'origin'],
            }),
          });
        } catch (error) {
          console.error('Translation error:', error);
        }
      }

      // 重新加载数据以获取翻译
      reloadData();
    };

    // 延迟执行，避免与数据加载冲突
    const timer = setTimeout(translateProducts, 1000);
    return () => clearTimeout(timer);
  }, [locale, products.length]);

  const handleSearch = () => {
    // 搜索会通过 useEffect 重新触发
  };

  const reloadData = async () => {
    const token = getAdminToken();
    
    // Fetch products
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        status: activeTab,
      });
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
        setPagination((prev) => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
      }
    } catch (error) {
      console.error('Reload products error:', error);
    } finally {
      setLoading(false);
    }

    // Fetch stats
    try {
      const response = await fetch('/api/admin/products/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Reload stats error:', error);
    }
  };

  // 打开审核详情弹窗
  const openReviewModal = async (productId: string) => {
    setLoadingReview(true);
    setShowReviewModal(true);
    setReviewDetail(null);

    try {
      const token = getAdminToken();
      
      // 快速获取产品信息
      const response = await fetch(`/api/admin/products/${productId}/review`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setReviewDetail(data);
        
        // 如果需要生成图片，异步生成
        if (data.catalog?.needsGeneration) {
          // 设置图片加载状态
          setReviewDetail((prev) => prev ? {
            ...prev,
            catalog: { ...prev.catalog, isGenerating: true }
          } : prev);
          
          // 异步生成图片
          fetch(`/api/admin/products/generate-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ productId }),
          })
            .then(res => res.json())
            .then(imgData => {
              if (imgData.success) {
                setReviewDetail((prev) => prev ? {
                  ...prev,
                  catalog: {
                    ...prev.catalog,
                    id: imgData.catalogId,
                    imageKey: imgData.imageKey,
                    imageUrl: imgData.imageUrl,
                    isNew: imgData.isNew,
                    needsGeneration: false,
                    isGenerating: false,
                    hasImage: true,
                  }
                } : prev);
              } else {
                setReviewDetail((prev) => prev ? {
                  ...prev,
                  catalog: {
                    ...prev.catalog,
                    isGenerating: false,
                    imageError: true,
                    imageErrorMessage: imgData.error || '图片生成失败',
                  }
                } : prev);
              }
            })
            .catch(() => {
              setReviewDetail((prev) => prev ? {
                ...prev,
                catalog: {
                  ...prev.catalog,
                  isGenerating: false,
                  imageError: true,
                  imageErrorMessage: '图片生成失败',
                }
              } : prev);
            });
        }
      } else {
        alert(data.error || '获取审核详情失败');
        setShowReviewModal(false);
      }
    } catch (error) {
      console.error('Get review detail error:', error);
      alert('获取审核详情失败');
      setShowReviewModal(false);
    } finally {
      setLoadingReview(false);
    }
  };

  // 确认审核通过
  const handleConfirmApprove = async () => {
    if (!reviewDetail) return;

    setUpdating(true);
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/products/${reviewDetail.product.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'approved',
          catalogId: reviewDetail.catalog.id,
          confirmImage: reviewDetail.catalog.isNew,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowReviewModal(false);
        setReviewDetail(null);
        reloadData();
        setSelectedIds([]);
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Approve product error:', error);
      alert('操作失败');
    } finally {
      setUpdating(false);
    }
  };

  // 重新生成图片
  const handleRegenerateImage = async () => {
    if (!reviewDetail) return;

    // 设置图片加载状态
    setReviewDetail((prev) => prev ? {
      ...prev,
      catalog: { ...prev.catalog, isGenerating: true, imageError: false }
    } : prev);

    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/products/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          productId: reviewDetail.product.id,
          force: true  // 强制重新生成
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReviewDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            catalog: {
              ...prev.catalog,
              id: data.catalogId,
              imageKey: data.imageKey,
              imageUrl: data.imageUrl,
              isNew: data.isNew,
              needsGeneration: false,
              isGenerating: false,
              hasImage: true,
            },
          };
        });
      } else {
        alert(data.error || '重新生成图片失败');
        setReviewDetail((prev) => prev ? {
          ...prev,
          catalog: { ...prev.catalog, isGenerating: false }
        } : prev);
      }
    } catch (error) {
      console.error('Regenerate image error:', error);
      alert('重新生成图片失败');
      setReviewDetail((prev) => prev ? {
        ...prev,
        catalog: { ...prev.catalog, isGenerating: false }
      } : prev);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, note?: string) => {
    setUpdating(true);
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/products/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, review_note: note }),
      });

      const data = await response.json();

      if (data.success) {
        reloadData();
        setSelectedIds([]);
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Update status error:', error);
      alert('操作失败');
    } finally {
      setUpdating(false);
    }
  };

  const handleBatchUpdate = async (status: string, note?: string) => {
    if (selectedIds.length === 0) {
      alert('请先选择产品');
      return;
    }

    setUpdating(true);
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/products/batch-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds, status, review_note: note }),
      });

      const data = await response.json();

      if (data.success) {
        reloadData();
        setSelectedIds([]);
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Batch update error:', error);
      alert('操作失败');
    } finally {
      setUpdating(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const formatPrice = (price?: number | string) => {
    if (!price) return '-';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '-';
    return `$${numPrice.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.bgColor} ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">产品管理</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setPagination((prev) => ({ ...prev, page: 1 }));
              setSelectedIds([]);
            }}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
            {stats[tab.key as keyof Stats] > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  tab.key === 'pending' ? 'bg-yellow-500 text-black' : 'bg-slate-600 text-white'
                }`}
              >
                {stats[tab.key as keyof Stats]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Batch Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="搜索 CAS 或产品名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
          />
          <button
            onClick={handleSearch}
            className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Batch Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">已选择 {selectedIds.length} 项</span>
            {activeTab === 'pending' && (
              <>
                <button
                  onClick={() => handleBatchUpdate('approved')}
                  disabled={updating}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  批量通过
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  disabled={updating}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  批量拒绝
                </button>
              </>
            )}
            {activeTab === 'approved' && (
              <button
                onClick={() => handleBatchUpdate('active')}
                disabled={updating}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                批量上架
              </button>
            )}
            {activeTab === 'active' && (
              <button
                onClick={() => handleBatchUpdate('inactive')}
                disabled={updating}
                className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                批量下架
              </button>
            )}
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Package className="h-12 w-12 mb-2" />
            <p>暂无产品</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-600 bg-slate-700"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('products.cas')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('products.productName')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('products.specInfo')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('products.agent')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('products.price')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('products.status')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('products.submitTime')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('products.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded border-slate-600 bg-slate-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-blue-400 font-mono text-sm">{product.cas}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{getTranslatedField(product, 'name', locale, product.name)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1 text-xs">
                        {product.purity && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">{t('products.purity')}:</span>
                            <span className="text-slate-300">{product.purity}</span>
                          </div>
                        )}
                        {product.package_spec && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">{t('products.packaging')}:</span>
                            <span className="text-slate-300">{product.package_spec}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          {product.origin && (
                            <span className="text-slate-300">{t('products.origin')}: {getTranslatedField(product, 'origin', locale, product.origin)}</span>
                          )}
                          {product.stock !== null && product.stock !== undefined && (
                            <span className="text-slate-300">
                              {t('products.stock')}: {product.stock_public ? `${product.stock} kg` : t('products.confidential')}
                            </span>
                          )}
                          {product.min_order && (
                            <span className="text-slate-300">{t('products.minOrder')}: {product.min_order} kg</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white">{product.agent_name}</p>
                        <p className="text-slate-500 text-xs">{product.agent_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{formatDate(product.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {activeTab === 'pending' && (
                          <>
                            <button
                              onClick={() => openReviewModal(product.id)}
                              disabled={updating}
                              className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30 disabled:opacity-50 flex items-center gap-1"
                              title={t('products.review')}
                            >
                              <Eye className="h-4 w-4" />
                              {t('products.review')}
                            </button>
                            <button
                              onClick={() => {
                                setRejectId(product.id);
                                setShowRejectModal(true);
                              }}
                              disabled={updating}
                              className="p-1.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 disabled:opacity-50"
                              title={t('products.reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {activeTab === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(product.id, 'active')}
                            disabled={updating}
                            className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs hover:bg-green-600/30 disabled:opacity-50"
                          >
                            {t('products.list')}
                          </button>
                        )}
                        {activeTab === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(product.id, 'inactive')}
                            disabled={updating}
                            className="px-2 py-1 bg-slate-600/20 text-slate-400 rounded text-xs hover:bg-slate-600/30 disabled:opacity-50"
                          >
                            {t('products.unlist')}
                          </button>
                        )}
                        {activeTab === 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(product.id, 'pending')}
                            disabled={updating}
                            className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs hover:bg-yellow-600/30 disabled:opacity-50"
                          >
                            {t('products.reReview')}
                          </button>
                        )}
                        {activeTab === 'inactive' && (
                          <button
                            onClick={() => handleUpdateStatus(product.id, 'active')}
                            disabled={updating}
                            className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs hover:bg-green-600/30 disabled:opacity-50"
                          >
                            {t('products.relist')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              共 {pagination.total} 条记录
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-slate-400 text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 审核详情弹窗 */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Eye className="h-5 w-5" />
                审核产品
              </h2>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewDetail(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {loadingReview ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-slate-400">正在加载审核信息...</span>
              </div>
            ) : reviewDetail ? (
              <div className="p-4 space-y-4">
                {/* 产品信息 */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-slate-400 mb-2">{t('products.productInfo')}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">{t('products.casNumber')}</p>
                      <p className="text-blue-400 font-mono">{reviewDetail.product.cas}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('products.productName')}</p>
                      <p className="text-white">{getTranslatedField(reviewDetail.product, 'name', locale, reviewDetail.product.name)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('products.purity')}</p>
                      <p className="text-slate-300">{reviewDetail.product.purity || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('products.packageSpec')}</p>
                      <p className="text-slate-300">{reviewDetail.product.package_spec || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('products.price')}</p>
                      <p className="text-white">
                        {formatPrice(reviewDetail.product.price)}
                        <span className="text-slate-400 text-xs ml-1">
                          /{reviewDetail.product.package_spec?.includes('kg') ? t('products.unitPerKg').replace('/', '') : 
                             reviewDetail.product.package_spec?.includes('L') || reviewDetail.product.package_spec?.includes('Drum') ? t('products.unitPerDrum').replace('/', '') : 
                             reviewDetail.product.package_spec?.includes('Bag') ? t('products.unitPerBag').replace('/', '') : ''}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('products.minOrder')}</p>
                      <p className="text-slate-300">
                        {reviewDetail.product.min_order 
                          ? `${reviewDetail.product.min_order} ${reviewDetail.product.package_spec?.includes('kg') ? 'kg' : 
                               reviewDetail.product.package_spec?.includes('L') || reviewDetail.product.package_spec?.includes('Drum') ? t('products.unitPerDrum').replace('/', '') : 
                               reviewDetail.product.package_spec?.includes('Bag') ? t('products.unitPerBag').replace('/', '') : ''}`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('products.origin')}</p>
                      <p className="text-slate-300">{reviewDetail.product.origin || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('products.stock')}</p>
                      <p className="text-slate-300">
                        {reviewDetail.product.stock_public
                          ? `${reviewDetail.product.stock || 0} kg`
                          : t('products.confidential')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('products.agent')}</p>
                      <p className="text-white">{reviewDetail.product.agent_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('products.contact')}</p>
                      <p className="text-slate-300 text-xs">{reviewDetail.product.agent_email || '-'}</p>
                    </div>
                    {reviewDetail.product.remark && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500">{t('products.remark')}</p>
                        <p className="text-slate-300 text-xs">{reviewDetail.product.remark}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 图片信息 */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                      {reviewDetail.catalog.isNew ? (
                        <>
                          <Sparkles className="h-4 w-4 text-yellow-400" />
                          {t('products.aiRecommended')}
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4" />
                          {t('products.catalogImage')}
                        </>
                      )}
                    </h3>
                    {reviewDetail.catalog.imageUrl && !reviewDetail.catalog.isGenerating && (
                      <button
                        onClick={handleRegenerateImage}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        {t('products.regenerateImage')}
                      </button>
                    )}
                  </div>

                  {/* 图片生成中 */}
                  {reviewDetail.catalog.isGenerating && (
                    <div className="flex items-center justify-center h-64 bg-slate-600/30 rounded-lg border border-dashed border-blue-500">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">{t('products.generating')}</p>
                      </div>
                    </div>
                  )}

                  {/* 图片生成失败 */}
                  {reviewDetail.catalog.imageError && !reviewDetail.catalog.isGenerating && (
                    <div className="flex items-center justify-center h-64 bg-slate-600/30 rounded-lg border border-dashed border-slate-500">
                      <div className="text-center">
                        <AlertCircle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">{reviewDetail.catalog.imageErrorMessage}</p>
                        <button
                          onClick={handleRegenerateImage}
                          className="mt-1 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          {t('common.confirm')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 显示图片 */}
                  {reviewDetail.catalog.imageUrl && !reviewDetail.catalog.isGenerating && (
                    <div className="relative">
                      <img
                        src={reviewDetail.catalog.imageUrl}
                        alt={t('products.productName')}
                        className="w-full max-h-64 object-contain rounded-lg bg-slate-600/30"
                      />
                      {reviewDetail.catalog.isNew && (
                        <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-black text-xs rounded-full flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {t('products.newCasCode')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 等待生成 */}
                  {!reviewDetail.catalog.imageUrl && !reviewDetail.catalog.isGenerating && !reviewDetail.catalog.imageError && (
                    <div className="flex items-center justify-center h-64 bg-slate-600/30 rounded-lg border border-dashed border-slate-500">
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">{t('products.noImage')}</p>
                        <button
                          onClick={handleRegenerateImage}
                          className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          {t('products.generateImage')}
                        </button>
                      </div>
                    </div>
                  )}

                  {reviewDetail.catalog.isNew && reviewDetail.catalog.message && (
                    <p className="mt-2 text-xs text-yellow-400/80">{reviewDetail.catalog.message}</p>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setReviewDetail(null);
                      setRejectId(reviewDetail.product.id);
                      setShowRejectModal(true);
                    }}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                  >
                    {t('products.reject')}
                  </button>
                  <button
                    onClick={handleConfirmApprove}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                    <CheckCircle className="h-4 w-4" />
                    {t('products.approve')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">拒绝原因</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectId(null);
                  setReviewNote('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="请输入拒绝原因（可选）"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                rows={4}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectId(null);
                    setReviewNote('');
                  }}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (rejectId) {
                      handleUpdateStatus(rejectId, 'rejected', reviewNote);
                    } else {
                      handleBatchUpdate('rejected', reviewNote);
                    }
                    setShowRejectModal(false);
                    setRejectId(null);
                    setReviewNote('');
                  }}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                  确认拒绝
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
