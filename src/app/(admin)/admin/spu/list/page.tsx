'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Database,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import { getAdminToken } from '@/services/adminAuthService';

interface SPUItem {
  id: string;
  cas: string;
  name: string;
  name_en?: string;
  formula?: string;
  hs_code?: string;
  status: string;
  pubchem_cid?: number;
  molecular_weight?: string;
  sku_count?: number;
  translations?: {
    name?: Record<string, string>;
  };
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 辅助函数：获取显示名称
function getDisplayName(
  spu: { name?: string; name_en?: string; translations?: { name?: Record<string, string> } },
  locale: string
): string {
  if (spu.translations?.name) {
    const translatedName = spu.translations.name[locale];
    if (translatedName) return translatedName;
  }
  
  if (locale === 'zh') {
    const name = spu.name || '';
    const hasChinese = /[\u4e00-\u9fff]/.test(name);
    if (hasChinese) return name;
    return spu.name_en || name;
  }
  
  if (locale === 'en') {
    return spu.name_en || spu.name || '';
  }
  
  return spu.name || spu.name_en || '';
}

export default function AdminSPUPage() {
  const router = useRouter();
  const { t, locale } = useAdminLocale();
  
  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    ACTIVE: { label: t('spu.active'), color: 'text-green-400', bgColor: 'bg-green-500/20' },
    INACTIVE: { label: t('spu.inactive'), color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
  };

  const [spuList, setSpuList] = useState<SPUItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // 获取SPU列表
  const fetchSPUList = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/spu?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setSpuList(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Fetch SPU list error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSPUList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter, searchTrigger]);

  // 搜索防抖
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    searchDebounceRef.current = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      setSearchTrigger(prev => prev + 1);
    }, 300);
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [search]);

  // 切换状态
  const toggleStatus = async (spu: SPUItem) => {
    const newStatus = spu.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/spu/list/${spu.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchSPUList();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  // 删除SPU
  const deleteSPU = async (spu: SPUItem) => {
    if (!confirm(locale === 'zh' ? `确定要删除 ${spu.name} 吗？` : `Are you sure to delete ${spu.name}?`)) {
      return;
    }
    
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/spu/list/${spu.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        fetchSPUList();
      }
    } catch (error) {
      console.error('Delete SPU error:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white h-full">
      <div className="max-w-7xl mx-auto pt-6 p-6">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="w-6 h-6" />
              {t('spu.title')}
            </h1>
            <p className="text-slate-400 mt-1">{t('spu.subtitle')}</p>
          </div>
          <button
            onClick={() => router.push('/admin/spu/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('spu.upload')}
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('spu.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="">{t('spu.allStatus')}</option>
            <option value="ACTIVE">{t('spu.active')}</option>
            <option value="INACTIVE">{t('spu.inactive')}</option>
          </select>
          <button
            onClick={fetchSPUList}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : spuList.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{t('spu.noData')}</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">CAS</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('spu.name')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('spu.formula')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('spu.mw')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('spu.hsCode')}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">{t('spu.skuCount')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">{t('spu.status')}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {spuList.map((spu) => (
                  <tr 
                    key={spu.id} 
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400">{spu.cas}</span>
                      {spu.pubchem_cid && (
                        <a
                          href={`https://pubchem.ncbi.nlm.nih.gov/compound/${spu.pubchem_cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-slate-400 hover:text-blue-400"
                        >
                          <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{getDisplayName(spu, locale)}</div>
                      {spu.name_en && <div className="text-sm text-slate-400">{spu.name_en}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{spu.formula || '-'}</td>
                    <td className="px-4 py-3 text-sm">{spu.molecular_weight || '-'}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-300">{spu.hs_code || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-sm ${(spu.sku_count || 0) > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                        {spu.sku_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${statusConfig[spu.status]?.bgColor} ${statusConfig[spu.status]?.color}`}>
                        {statusConfig[spu.status]?.label || spu.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleStatus(spu)}
                          className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                          title={spu.status === 'ACTIVE' ? t('spu.deactivate') : t('spu.activate')}
                        >
                          {spu.status === 'ACTIVE' ? (
                            <ArrowDownCircle className="w-4 h-4 text-orange-400 hover:text-orange-300" />
                          ) : (
                            <ArrowUpCircle className="w-4 h-4 text-green-400 hover:text-green-300" />
                          )}
                        </button>
                        <button
                          onClick={() => router.push(`/admin/spu/edit?id=${spu.id}`)}
                          className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit className="w-4 h-4 text-slate-400 hover:text-white" />
                        </button>
                        <button
                          onClick={() => deleteSPU(spu)}
                          className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
