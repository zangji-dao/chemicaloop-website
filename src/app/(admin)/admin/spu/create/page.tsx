'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Database,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import { getAdminToken } from '@/services/adminAuthService';

// CAS号格式验证正则：XXXXXXXX-XX-X
const CAS_REGEX = /^\d{2,7}-\d{2}-\d$/;

// SPU 数据接口
interface SPUItem {
  id: string;
  cas: string;
  name: string;
  name_en?: string;
  formula?: string;
}

function ProductCreateContent() {
  const router = useRouter();
  const { locale, t } = useAdminLocale();

  // ========== 搜索相关状态 ==========
  const [casInput, setCasInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [existingSPU, setExistingSPU] = useState<SPUItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ========== CAS 格式验证 ==========
  const validateCAS = (cas: string): boolean => {
    return CAS_REGEX.test(cas.trim());
  };

  // ========== 搜索功能 ==========
  const handleSearch = async () => {
    const cas = casInput.trim();
    
    // Step 1: 验证CAS格式
    if (!cas) {
      setError(locale === 'zh' ? '请输入CAS号' : 'Please enter CAS number');
      return;
    }

    if (!validateCAS(cas)) {
      setError(locale === 'zh' ? 'CAS号格式不正确，正确格式如：64-17-5' : 'Invalid CAS format. Example: 64-17-5');
      return;
    }

    setError(null);
    setExistingSPU(null);
    setSearching(true);

    try {
      // Step 2: 搜索本地SPU库
      const token = getAdminToken();
      const response = await fetch(`/api/admin/spu-manage/search?q=${encodeURIComponent(cas)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        // 本地已存在 → 提示用户
        setExistingSPU(data.data[0]);
      } else {
        // 本地不存在 → 跳转到编辑页面
        router.push(`/admin/spu/edit?cas=${encodeURIComponent(cas)}`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(locale === 'zh' ? '搜索失败，请重试' : 'Search failed, please retry');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white min-h-screen">
      <div className="max-w-5xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('spu.upload')}
          </h1>
          <p className="text-slate-400">
            {t('spu.uploadSubtitle')}
          </p>
        </div>

        {/* 搜索视图 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Database className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">{t('spu.selectProduct')}</h2>
          </div>

          {/* 搜索框 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              {t('spu.searchProduct')}
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={casInput}
                onChange={(e) => {
                  setCasInput(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('spu.enterCas')}
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 font-medium"
              >
                {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                {t('common.search')}
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {locale === 'zh' ? '请输入CAS号，格式如：64-17-5' : 'Enter CAS number, format: 64-17-5'}
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* 已存在提示 */}
          {existingSPU && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <span className="font-semibold text-amber-400">
                  {locale === 'zh' ? '该CAS号已存在于系统中' : 'This CAS number already exists in the system'}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">{t('spu.nameZh')}</div>
                  <div className="font-semibold text-white">{existingSPU.name}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">{t('spu.nameEn')}</div>
                  <div className="font-semibold text-white">{existingSPU.name_en || '-'}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">CAS Number</div>
                  <div className="font-mono font-semibold text-blue-400">{existingSPU.cas}</div>
                </div>
                {existingSPU.formula && (
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">{t('spu.formula')}</div>
                    <div className="font-mono font-semibold text-white">{existingSPU.formula}</div>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-400 mb-4">
                {locale === 'zh' 
                  ? '如需修改该产品信息，请前往产品列表进行编辑。' 
                  : 'To edit this product, please go to the product list.'}
              </p>

              <button
                onClick={() => router.push('/admin/spu')}
                className="w-full py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-medium"
              >
                {locale === 'zh' ? '前往产品列表' : 'Go to Product List'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateSPUPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <ProductCreateContent />
    </Suspense>
  );
}
