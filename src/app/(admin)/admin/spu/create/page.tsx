'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

/**
 * 验证 CAS 号校验位
 */
function validateCASCheckDigit(cas: string): boolean {
  const digits = cas.replace(/-/g, '');
  if (digits.length < 5) return false;

  const checkDigit = parseInt(digits[digits.length - 1], 10);
  
  let sum = 0;
  for (let i = digits.length - 2, multiplier = 1; i >= 0; i--, multiplier++) {
    sum += parseInt(digits[i], 10) * multiplier;
  }
  
  return sum % 10 === checkDigit;
}

// SPU 数据接口
interface SPUItem {
  id: string;
  cas: string;
  name: string;
  name_en?: string;
  formula?: string;
  structure_image_key?: string | null;
  pubchem_cid?: number | null;
}

// PubChem 预览数据接口（与 sync-pubchem preview 返回格式一致）
interface PubChemPreviewData {
  cas?: string;
  pubchemCid?: number | null;
  nameZh?: string | null;
  nameEn?: string | null;
  formula?: string | null;
  description?: string | null;
  molecularWeight?: string | null;
  structureUrl?: string | null;
  structureImageKey?: string | null;
  structureSdf?: string | null;
  structure2dSvg?: string | null;
  smiles?: string | null;
  inchi?: string | null;
  inchiKey?: string | null;
  synonyms?: string[];
  applications?: string[];
  hsCode?: string | null; // HS 编码
  // ... 其他字段
}

// sessionStorage key for preview data
const PREVIEW_DATA_KEY = 'spu_create_preview_data';

// 搜索结果状态
type SearchStatus = 'idle' | 'searching' | 'syncing' | 'found' | 'synced' | 'not_found' | 'error';

function ProductCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = useAdminLocale();

  // ========== 状态 ==========
  const [casInput, setCasInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [existingSPU, setExistingSPU] = useState<SPUItem | null>(null);
  const [previewData, setPreviewData] = useState<PubChemPreviewData | null>(null);
  const [searchedCas, setSearchedCas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [initialSearchDone, setInitialSearchDone] = useState(false);

  // ========== 从 URL 读取 CAS 参数并自动搜索 ==========
  useEffect(() => {
    const casFromUrl = searchParams.get('cas');
    if (casFromUrl && !initialSearchDone && !searching) {
      setCasInput(casFromUrl);
      setInitialSearchDone(true);
      // 延迟触发搜索，确保状态已更新
      setTimeout(() => {
        handleSearchWithCas(casFromUrl);
      }, 100);
    }
  }, [searchParams, initialSearchDone, searching]);

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
    await doSearch(cas);
  };

  // 带参数的搜索（用于 URL 参数自动触发）
  const handleSearchWithCas = async (cas: string) => {
    await doSearch(cas.trim());
  };

  // 实际搜索逻辑
  const doSearch = async (cas: string) => {
    
    // 验证CAS格式
    if (!cas) {
      setError(t('spu.casEmptyError'));
      return;
    }

    if (!validateCAS(cas)) {
      setError(t('spu.casFormatError'));
      return;
    }

    if (!validateCASCheckDigit(cas)) {
      setError(t('spu.casCheckDigitError'));
      return;
    }

    // 重置状态
    setError(null);
    setExistingSPU(null);
    setSearchedCas(cas);
    setSearching(true);
    setSearchStatus('searching');

    try {
      const token = getAdminToken();
      
      // Step 1: 搜索本地SPU库
      const response = await fetch(`/api/admin/spu/list/search?q=${encodeURIComponent(cas)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        // 本地已存在 → 提示用户，不显示下一步
        setExistingSPU(data.data[0]);
        setSearchStatus('found');
      } else {
        // 本地不存在 → 先获取 HS 码，再同步 PubChem
        setSearchStatus('syncing');
        
        // Step 2: 获取 HS 编码
        let hsCode: string | null = null;
        try {
          const hsResponse = await fetch('/api/admin/spu/create/match-hs-code', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ cas }),
          });
          const hsData = await hsResponse.json();
          if (hsData.success && hsData.hsCode) {
            hsCode = hsData.hsCode;
          }
        } catch (e) {
          console.warn('Failed to match HS code:', e);
        }
        
        // Step 3: 使用 preview 模式同步PubChem（不写入数据库）
        const syncResponse = await fetch('/api/admin/spu/create/sync-pubchem', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ cas, preview: true }),  // 使用 preview 模式
        });
        
        const syncData = await syncResponse.json();
        
        if (syncData.success && syncData.data) {
          // 将预览数据存入 sessionStorage，供后续页面使用
          const data: PubChemPreviewData = {
            cas: cas,
            ...syncData.data,
            hsCode: hsCode, // 添加 HS 编码
          };
          sessionStorage.setItem(PREVIEW_DATA_KEY, JSON.stringify(data));
          
          // 保存预览数据到状态，用于显示
          setPreviewData(data);
          
          // 同步成功 → 可以下一步
          setSearchStatus('synced');
        } else if (syncData.error === 'PUBCHEM_NOT_FOUND') {
          // PubChem中不存在
          setError(t('spu.pubchemNotFound'));
          setSearchStatus('not_found');
        } else {
          // 其他错误
          setError(syncData.message || t('spu.syncFailed'));
          setSearchStatus('error');
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(t('spu.searchFailed'));
      setSearchStatus('error');
    } finally {
      setSearching(false);
    }
  };

  // ========== 下一步：跳转到图片页面 ==========
  const handleNext = () => {
    router.push(`/admin/spu/create/image?cas=${encodeURIComponent(searchedCas)}`);
  };

  // ========== 渲染顶部操作按钮 ==========
  const renderActionButton = () => {
    // 同步中
    if (searchStatus === 'syncing') {
      return (
        <div className="flex items-center gap-2 px-5 py-2 text-blue-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{t('spu.syncing')}</span>
        </div>
      );
    }
    
    // 同步成功 → 显示下一步
    if (searchStatus === 'synced') {
      return (
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm whitespace-nowrap"
        >
          {t('spu.next')}
          <ArrowRight className="h-4 w-4" />
        </button>
      );
    }
    
    // 已存在或不存在 → 不显示按钮
    return <div className="w-[88px]" />;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white h-full pt-6">
      {/* 顶部导航 */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-5 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.previous')}
            </button>
            <h2 className="text-lg font-medium text-white">
              {t('spu.newSpu')}
            </h2>
            {renderActionButton()}
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
              {t('spu.casFormatHint')}
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* 搜索中 */}
          {searchStatus === 'searching' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin" />
                <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium mb-1">{t('spu.searchingLibrary')}</p>
                <p className="text-sm text-slate-400">{t('spu.searchingHint') || 'Searching local database...'}</p>
              </div>
            </div>
          )}

          {/* 同步中 */}
          {searchStatus === 'syncing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-purple-500 animate-spin" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-75" />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-150" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-medium mb-1">{t('spu.fetchingFromPubchem')}</p>
                <p className="text-sm text-slate-400">{t('spu.syncingHint') || 'Fetching chemical data from PubChem...'}</p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs text-slate-300">{t('spu.hsCodeMatched') || 'HS Code matched'}</span>
                </div>
              </div>
            </div>
          )}

          {/* 搜索结果：已存在（不显示下一步） */}
          {searchStatus === 'found' && existingSPU && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <span className="font-semibold text-amber-400">
                  {t('spu.casAlreadyExists')}
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
                {t('spu.editProductHint')}
              </p>
            </div>
          )}

          {/* 同步成功：可新建（显示下一步） */}
          {searchStatus === 'synced' && previewData && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="font-semibold text-emerald-400">
                  {t('spu.dataReady')}
                </span>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                {t('spu.dataReadyHint')}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">CAS Number</div>
                  <div className="font-mono text-lg font-medium text-blue-400">{searchedCas}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">{t('spu.nameEn')}</div>
                  <div className="font-medium text-white">{previewData.nameEn || previewData.nameZh || '-'}</div>
                </div>
                {previewData.formula && (
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">{t('spu.formula')}</div>
                    <div className="font-mono font-medium text-white">{previewData.formula}</div>
                  </div>
                )}
                {previewData.pubchemCid && (
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">PubChem CID</div>
                    <div className="font-medium text-blue-400">{previewData.pubchemCid}</div>
                  </div>
                )}
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
