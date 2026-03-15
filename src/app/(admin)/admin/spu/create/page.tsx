'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Database,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
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

// 搜索结果状态
type SearchStatus = 'idle' | 'searching' | 'found' | 'not_found';

function ProductCreateContent() {
  const router = useRouter();
  const { locale, t } = useAdminLocale();

  // ========== 搜索相关状态 ==========
  const [casInput, setCasInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [existingSPU, setExistingSPU] = useState<SPUItem | null>(null);
  const [searchedCas, setSearchedCas] = useState('');
  const [error, setError] = useState<string | null>(null);

  // ========== CAS 格式验证 ==========
  const validateCAS = (cas: string): boolean => {
    return CAS_REGEX.test(cas.trim());
  };

  // ========== 返回列表 ==========
  const handleBack = () => {
    router.push('/admin/spu');
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

    // 批量更新状态，减少重渲染
    setError(null);
    setExistingSPU(null);
    setSearchedCas(cas);
    setSearching(true);
    setSearchStatus('searching');

    try {
      // Step 2: 搜索本地SPU库
      const token = getAdminToken();
      const response = await fetch(`/api/admin/spu/search?q=${encodeURIComponent(cas)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        // 本地已存在 → 提示用户
        setExistingSPU(data.data[0]);
        setSearchStatus('found');
      } else {
        // 本地不存在 → 提示可以新建
        setSearchStatus('not_found');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(locale === 'zh' ? '搜索失败，请重试' : 'Search failed, please retry');
      setSearchStatus('idle');
    } finally {
      setSearching(false);
    }
  };

  // ========== 下一步：跳转到生成产品图页面 ==========
  const handleNext = () => {
    router.push(`/admin/spu/create/image?cas=${encodeURIComponent(searchedCas)}`);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white h-full">
      {/* 顶部导航 */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-5 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === 'zh' ? '返回列表' : 'Back'}
            </button>
            <h2 className="text-lg font-medium text-white">
              {t('spu.newSpu')}
            </h2>
            {searchStatus === 'not_found' ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm whitespace-nowrap"
              >
                {locale === 'zh' ? '下一步' : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="w-[88px]" />
            )}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-4xl mx-auto p-5 pb-20">
        {/* 搜索卡片 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Database className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-white">{t('spu.selectProduct')}</h3>
          </div>

          {/* 搜索框 */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-300 mb-2">
              {t('spu.casNumber')} <span className="text-red-400">*</span>
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
                className="flex-1 form-input-dark"
                disabled={searching}
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="flex items-center gap-2 px-5 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors disabled:opacity-50 text-sm"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {t('common.search')}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
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

          {/* 搜索结果：已存在 */}
          {searchStatus === 'found' && existingSPU && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <span className="font-semibold text-amber-400">
                  {locale === 'zh' ? '该CAS号已存在于系统中' : 'This CAS number already exists in the system'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">{t('spu.nameZh')}</div>
                  <div className="font-medium text-white">{existingSPU.name}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">{t('spu.nameEn')}</div>
                  <div className="font-medium text-white">{existingSPU.name_en || '-'}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">CAS Number</div>
                  <div className="font-mono font-medium text-blue-400">{existingSPU.cas}</div>
                </div>
                {existingSPU.formula && (
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">{t('spu.formula')}</div>
                    <div className="font-mono font-medium text-white">{existingSPU.formula}</div>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-400">
                {locale === 'zh' 
                  ? '如需修改该产品信息，请点击左上角「返回列表」按钮。' 
                  : 'To edit this product, click "Back" button on the top left.'}
              </p>
            </div>
          )}

          {/* 搜索结果：不存在，可以新建 */}
          {searchStatus === 'not_found' && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="font-semibold text-emerald-400">
                  {locale === 'zh' ? '该CAS号可新建产品' : 'This CAS number is available for new product'}
                </span>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-1">CAS Number</div>
                <div className="font-mono text-xl font-medium text-blue-400">{searchedCas}</div>
                <p className="text-xs text-slate-400 mt-2">
                  {locale === 'zh' 
                    ? '数据库中未找到该CAS号，点击右上角「下一步」继续新建流程。' 
                    : 'Not found in database. Click "Next" button on the top right to continue.'}
                </p>
              </div>
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
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      }
    >
      <ProductCreateContent />
    </Suspense>
  );
}
