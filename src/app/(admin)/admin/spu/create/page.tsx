'use client';

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from 'react';
import {
  Search,
  Database,
  Check,
  X,
  Loader2,
  ExternalLink,
  Save,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import { getAdminToken } from '@/services/adminAuthService';

// SPU 数据接口
interface PubChemData {
  cid?: number;
  cas: string;
  nameZh?: string;
  nameEn?: string;
  formula?: string;
  molecularWeight?: string;
  smiles?: string;
  inchi?: string;
  inchiKey?: string;
  xlogp?: string;
  boilingPoint?: string;
  meltingPoint?: string;
  flashPoint?: string;
  density?: string;
  solubility?: string;
  vaporPressure?: string;
  physicalDescription?: string;
  colorForm?: string;
  odor?: string;
  hazardClasses?: string;
  synonyms?: string[];
  applications?: string[];
  description?: string;
  structure2dUrl?: string;
  pubchemSyncedAt?: string;
}

interface SelectedSPU {
  id: string;
  cas: string;
  name: string;
  name_en?: string;
  formula?: string;
  description?: string;
  pubchem_cid?: number;
  molecular_weight?: string;
  hs_code?: string;
  synonyms?: string[];
  applications?: string[];
  physicalDescription?: string;
  colorForm?: string;
  odor?: string;
  hazardClasses?: string;
}

function ProductCreateContent() {
  const { locale, t } = useAdminLocale();

  // 视图模式：'search' 搜索页，'edit' 编辑页
  const [viewMode, setViewMode] = useState<'search' | 'edit'>('search');

  // ========== 搜索相关状态 ==========
  const [spuSearchQuery, setSpuSearchQuery] = useState('');
  const [searchingSPU, setSearchingSPU] = useState(false);
  const [searchingPubChem, setSearchingPubChem] = useState(false);
  const [spuSearchResults, setSpuSearchResults] = useState<SelectedSPU[]>([]);
  const [showNoSpuHint, setShowNoSpuHint] = useState(false);
  const [pubchemData, setPubchemData] = useState<PubChemData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'failed'>('idle');
  const [selectedSPU, setSelectedSPU] = useState<SelectedSPU | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ========== 编辑相关状态 ==========
  const [saving, setSaving] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    cas: '',
    name: '',
    nameEn: '',
    formula: '',
    molecularWeight: '',
    description: '',
    synonyms: [] as string[],
    applications: [] as string[],
    hsCode: '',
    hsCodeExtensions: {} as Record<string, string>,
    status: 'ACTIVE',
    smiles: '',
    inchi: '',
    inchiKey: '',
    xlogp: '',
    physicalDescription: '',
    colorForm: '',
    odor: '',
    boilingPoint: '',
    meltingPoint: '',
    flashPoint: '',
    density: '',
    solubility: '',
    vaporPressure: '',
    hazardClasses: '',
    generatedImageUrl: '',
  });

  // PubChem 信息（只读）
  const [pubchemInfo, setPubchemInfo] = useState<{
    cid?: number;
    syncedAt?: string;
  }>({});

  // 图片相关状态
  const [structureImageUrl, setStructureImageUrl] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  // ========== 搜索功能 ==========
  const handleUnifiedSearch = async () => {
    const query = spuSearchQuery.trim();
    if (!query) return;

    setErrors({});
    setSpuSearchResults([]);
    setShowNoSpuHint(false);
    setPubchemData(null);
    setSelectedSPU(null);
    setConnectionStatus('idle');

    // Step 1: 搜索本地 SPU
    setSearchingSPU(true);
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/spu-manage/search?q=${encodeURIComponent(query)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        setSpuSearchResults(data.data);
        setSearchingSPU(false);
        return;
      }
    } catch (error) {
      console.error('SPU search error:', error);
    }
    setSearchingSPU(false);

    // Step 2: 本地无结果，搜索 PubChem
    await searchPubChem(query);
  };

  const searchPubChem = async (cas: string) => {
    setSearchingPubChem(true);
    setConnectionStatus('connecting');

    try {
      // Step 1: 检测连接
      const connectionResponse = await fetch('/api/admin/spu/check-pubchem-connection');
      const connectionData = await connectionResponse.json();

      if (!connectionData.connected) {
        setConnectionStatus('failed');
        setSearchingPubChem(false);
        return;
      }

      // Step 2: 获取 PubChem 数据
      setConnectionStatus('success');
      const token = getAdminToken();
      const response = await fetch('/api/admin/spu/sync-pubchem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ preview: true, cas }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setPubchemData(data.data);
      } else {
        setErrors({ cas: t('spu.noDataFound') });
      }
    } catch (error) {
      console.error('PubChem search error:', error);
      setConnectionStatus('failed');
      setErrors({ cas: t('spu.searchFailed') });
    } finally {
      setSearchingPubChem(false);
    }
  };

  const handleSelectSPU = (spu: SelectedSPU) => {
    setSelectedSPU(spu);
    setSpuSearchResults([]);
    setPubchemData(null);
    setErrors({});
  };

  const handleClearSPU = () => {
    setSelectedSPU(null);
    setPubchemData(null);
    setSpuSearchResults([]);
    setErrors({});
  };

  // ========== 进入编辑模式 ==========
  const enterEditMode = () => {
    const dataSource = pubchemData || selectedSPU;
    if (!dataSource) return;

    // 初始化表单数据
    setFormData({
      cas: (dataSource as any).cas || '',
      name: (dataSource as any).nameZh || (dataSource as any).name || '',
      nameEn: (dataSource as any).nameEn || (dataSource as any).name_en || '',
      formula: (dataSource as any).formula || '',
      molecularWeight: (dataSource as any).molecularWeight || (dataSource as any).molecular_weight || '',
      description: (dataSource as any).description || '',
      synonyms: (dataSource as any).synonyms || [],
      applications: (dataSource as any).applications || [],
      hsCode: (dataSource as any).hsCode || (dataSource as any).hs_code || '',
      hsCodeExtensions: {},
      status: 'ACTIVE',
      smiles: (dataSource as any).smiles || '',
      inchi: (dataSource as any).inchi || '',
      inchiKey: (dataSource as any).inchiKey || '',
      xlogp: (dataSource as any).xlogp || '',
      physicalDescription: (dataSource as any).physicalDescription || '',
      colorForm: (dataSource as any).colorForm || '',
      odor: (dataSource as any).odor || '',
      boilingPoint: (dataSource as any).boilingPoint || '',
      meltingPoint: (dataSource as any).meltingPoint || '',
      flashPoint: (dataSource as any).flashPoint || '',
      density: (dataSource as any).density || '',
      solubility: (dataSource as any).solubility || '',
      vaporPressure: (dataSource as any).vaporPressure || '',
      hazardClasses: (dataSource as any).hazardClasses || '',
      generatedImageUrl: '',
    });

    // 设置 PubChem 信息
    if (pubchemData) {
      setPubchemInfo({
        cid: pubchemData.cid,
        syncedAt: pubchemData.pubchemSyncedAt,
      });
      setStructureImageUrl(pubchemData.structure2dUrl || null);
    } else if (selectedSPU) {
      setPubchemInfo({
        cid: selectedSPU.pubchem_cid,
      });
    }

    setViewMode('edit');
  };

  const backToSearch = () => {
    setViewMode('search');
    setFormData({
      cas: '',
      name: '',
      nameEn: '',
      formula: '',
      molecularWeight: '',
      description: '',
      synonyms: [],
      applications: [],
      hsCode: '',
      hsCodeExtensions: {},
      status: 'ACTIVE',
      smiles: '',
      inchi: '',
      inchiKey: '',
      xlogp: '',
      physicalDescription: '',
      colorForm: '',
      odor: '',
      boilingPoint: '',
      meltingPoint: '',
      flashPoint: '',
      density: '',
      solubility: '',
      vaporPressure: '',
      hazardClasses: '',
      generatedImageUrl: '',
    });
    setPubchemInfo({});
    setStructureImageUrl(null);
    setProductImageUrl(null);
  };

  // ========== 保存功能 ==========
  const handleSave = async (isListed: boolean = true) => {
    if (!formData.cas) {
      alert(locale === 'zh' ? 'CAS号不能为空' : 'CAS number is required');
      return;
    }

    const spuName = formData.name || formData.nameEn;
    if (!spuName) {
      alert(locale === 'zh' ? '产品名称不能为空' : 'Product name is required');
      return;
    }

    setSaving(true);
    try {
      const token = getAdminToken();

      const spuData = {
        cas: formData.cas,
        name: spuName,
        nameEn: formData.nameEn || null,
        formula: formData.formula || null,
        description: formData.description || pubchemData?.description || selectedSPU?.description || null,
        pubchemCid: pubchemInfo.cid || null,
        molecularWeight: formData.molecularWeight || pubchemData?.molecularWeight || selectedSPU?.molecular_weight || null,
        smiles: formData.smiles || pubchemData?.smiles || null,
        inchi: formData.inchi || pubchemData?.inchi || null,
        inchiKey: formData.inchiKey || pubchemData?.inchiKey || null,
        xlogp: formData.xlogp || pubchemData?.xlogp || null,
        boilingPoint: formData.boilingPoint || pubchemData?.boilingPoint || null,
        meltingPoint: formData.meltingPoint || pubchemData?.meltingPoint || null,
        flashPoint: formData.flashPoint || pubchemData?.flashPoint || null,
        hazardClasses: formData.hazardClasses || pubchemData?.hazardClasses || selectedSPU?.hazardClasses || null,
        synonyms: formData.synonyms.length > 0 ? formData.synonyms : pubchemData?.synonyms || selectedSPU?.synonyms || null,
        applications: formData.applications.length > 0 ? formData.applications : pubchemData?.applications || selectedSPU?.applications || null,
        imageUrl: formData.generatedImageUrl || productImageUrl || null,
        structureUrl: structureImageUrl || pubchemData?.structure2dUrl || null,
        hsCode: formData.hsCode || null,
        translations: null,
        physicalDescription: formData.physicalDescription || pubchemData?.physicalDescription || selectedSPU?.physicalDescription || null,
        colorForm: formData.colorForm || pubchemData?.colorForm || selectedSPU?.colorForm || null,
        odor: formData.odor || pubchemData?.odor || selectedSPU?.odor || null,
        density: formData.density || pubchemData?.density || null,
        solubility: formData.solubility || pubchemData?.solubility || null,
        vaporPressure: formData.vaporPressure || pubchemData?.vaporPressure || null,
        status: isListed ? 'ACTIVE' : 'INACTIVE',
      };

      const response = await fetch('/api/admin/spu-manage/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(spuData),
      });

      const result = await response.json();

      if (result.success) {
        alert(locale === 'zh' ? '保存成功！' : 'Saved successfully!');
        window.location.href = '/admin/spu';
      } else {
        alert(`${locale === 'zh' ? '保存失败' : 'Save failed'}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving SPU:', error);
      alert(locale === 'zh' ? '保存失败' : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ========== 生成产品图 ==========
  const handleGenerateProductImage = async () => {
    if (!pubchemInfo.cid) {
      alert(locale === 'zh' ? '请先同步 PubChem 数据' : 'Please sync PubChem data first');
      return;
    }

    setGeneratingImage(true);
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/products/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cas: formData.cas,
          name: formData.nameEn || formData.name,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProductImageUrl(data.imageUrl);
        setFormData(prev => ({ ...prev, generatedImageUrl: data.imageUrl }));
      } else {
        alert(`${locale === 'zh' ? '生成失败' : 'Generation failed'}: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert(locale === 'zh' ? '生成失败' : 'Generation failed');
    } finally {
      setGeneratingImage(false);
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
        {viewMode === 'search' && (
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
                  value={spuSearchQuery}
                  onChange={(e) => setSpuSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnifiedSearch()}
                  placeholder={t('spu.enterCas')}
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                />
                <button
                  onClick={handleUnifiedSearch}
                  disabled={searchingSPU || searchingPubChem}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 font-medium"
                >
                  {(searchingSPU || searchingPubChem) ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  {t('common.search')}
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {t('spu.systemSearchHint')}
              </p>
            </div>

            {/* 搜索状态指示 */}
            {(searchingSPU || searchingPubChem) && (
              <div className="flex items-center gap-2 text-blue-400 mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {searchingSPU
                    ? t('spu.searchingLibrary')
                    : t('spu.fetchingFromPubchem')}
                </span>
              </div>
            )}

            {/* 已选择的本地 SPU */}
            {selectedSPU && (
              <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-400" />
                    <span className="font-semibold text-green-400">
                      {t('spu.linkedSpu')}
                    </span>
                  </div>
                  <button
                    onClick={handleClearSPU}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {t('spu.unlink')}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">{t('spu.nameZh')}</div>
                    <div className="font-semibold text-white">{selectedSPU.name}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">{t('spu.nameEn')}</div>
                    <div className="font-semibold text-white">{selectedSPU.name_en || '-'}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">CAS Number</div>
                    <div className="font-mono font-semibold text-blue-400">{selectedSPU.cas}</div>
                  </div>
                  {selectedSPU.formula && (
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400 mb-1">{t('spu.formula')}</div>
                      <div className="font-mono font-semibold text-white">{selectedSPU.formula}</div>
                    </div>
                  )}
                </div>

                <button
                  onClick={enterEditMode}
                  className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {t('spu.next')}
                </button>
              </div>
            )}

            {/* SPU 搜索结果 */}
            {spuSearchResults.length > 0 && !selectedSPU && (
              <div className="border border-slate-600 rounded-lg divide-y divide-slate-700 mb-4">
                <div className="px-4 py-3 bg-slate-700">
                  <div className="text-sm text-slate-300 font-medium">
                    {t('spu.foundProducts', { count: spuSearchResults.length })}
                  </div>
                  <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {t('spu.spuAlreadyExists')}
                  </div>
                </div>
                {spuSearchResults.map((spu) => (
                  <button
                    key={spu.id}
                    onClick={() => handleSelectSPU(spu)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-700 transition-colors text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-blue-400 font-medium">{spu.cas}</span>
                        <span className="text-slate-600">|</span>
                        <span className="font-medium text-white">{spu.name}</span>
                        {spu.name_en && <span className="text-slate-400 text-sm">({spu.name_en})</span>}
                      </div>
                      {spu.formula && (
                        <div className="text-sm text-slate-500 mt-1">
                          {t('spu.formula')}: {spu.formula}
                        </div>
                      )}
                    </div>
                    <Check className="h-5 w-5 text-slate-500" />
                  </button>
                ))}
              </div>
            )}

            {/* PubChem 数据 */}
            {pubchemData && !selectedSPU && (
              <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="h-5 w-5 text-green-400" />
                  <span className="font-semibold text-green-400">
                    {t('spu.fetchedFromPubchem')}
                  </span>
                  <span className="ml-auto text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                    PubChem
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">{t('spu.nameZh')}</div>
                    <div className="font-semibold text-white">{pubchemData.nameZh || '-'}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">{t('spu.nameEn')}</div>
                    <div className="font-semibold text-white">{pubchemData.nameEn || '-'}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">CAS Number</div>
                    <div className="font-mono font-semibold text-blue-400">{pubchemData.cas}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">{t('spu.formula')}</div>
                    <div className="font-mono font-semibold text-white">{pubchemData.formula || '-'}</div>
                  </div>
                </div>

                <button
                  onClick={enterEditMode}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {t('spu.next')}
                </button>
              </div>
            )}

            {errors.cas && <p className="text-red-400 text-sm mt-1">{errors.cas}</p>}
          </div>
        )}

        {/* 编辑视图 */}
        {viewMode === 'edit' && (
          <div className="space-y-6">
            {/* 顶部导航 */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={backToSearch}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('spu.previous')}
              </button>
              <h2 className="text-xl font-bold text-white">{t('spu.editSpu')}</h2>
              <div className="w-32"></div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              {/* 图片展示区域 */}
              {(pubchemInfo.cid || structureImageUrl) && (
                <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                  <div className="grid grid-cols-2 gap-6">
                    {/* PubChem 2D 结构图 */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-slate-400">{t('spu.structure2D')}</span>
                        {pubchemInfo.cid && (
                          <a
                            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemInfo.cid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                        {structureImageUrl ? (
                          <img
                            src={structureImageUrl}
                            alt="2D Structure"
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-center text-slate-500">
                            <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{t('spu.noData')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 产品图 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">{t('spu.productImage')}</span>
                        <button
                          type="button"
                          onClick={handleGenerateProductImage}
                          disabled={generatingImage || !pubchemInfo.cid}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {generatingImage ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>{t('spu.generating')}</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              <span>{productImageUrl || formData.generatedImageUrl ? t('spu.redraw') : t('spu.clickToGenerate')}</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="aspect-square bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg border border-slate-600/50 flex items-center justify-center overflow-hidden">
                        {productImageUrl || formData.generatedImageUrl ? (
                          <img
                            src={productImageUrl || formData.generatedImageUrl}
                            alt="Product"
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-center text-slate-500">
                            <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">{pubchemInfo.cid ? t('spu.clickToGenerate') : t('spu.syncPubchemFirst')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 基本信息 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-4">{t('spu.basicInformation')}</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('spu.casNumber')}</label>
                    <input
                      type="text"
                      value={formData.cas}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-mono text-blue-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">{t('spu.name')}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('spu.nameEn')}</label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('spu.formula')}</label>
                    <input
                      type="text"
                      value={formData.formula}
                      onChange={(e) => setFormData(prev => ({ ...prev, formula: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('spu.hsCode')}</label>
                    <input
                      type="text"
                      value={formData.hsCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, hsCode: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('spu.status')}</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    >
                      <option value="ACTIVE">{t('spu.active')}</option>
                      <option value="INACTIVE">{t('spu.inactive')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 化学信息 */}
              {(formData.molecularWeight || formData.smiles || formData.inchiKey) && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white mb-4">{t('spu.chemicalInformation')}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {formData.molecularWeight && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">{t('spu.molecularWeight')}</label>
                        <input
                          type="text"
                          value={formData.molecularWeight}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-mono text-slate-300"
                        />
                      </div>
                    )}
                    {formData.smiles && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">SMILES</label>
                        <input
                          type="text"
                          value={formData.smiles}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-mono text-slate-300"
                        />
                      </div>
                    )}
                    {formData.inchiKey && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">InChI Key</label>
                        <input
                          type="text"
                          value={formData.inchiKey}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-mono text-slate-300"
                        />
                      </div>
                    )}
                    {formData.xlogp && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">XLogP</label>
                        <input
                          type="text"
                          value={formData.xlogp}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-mono text-slate-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 物理化学性质 */}
              {(formData.boilingPoint || formData.meltingPoint || formData.flashPoint || formData.density) && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white mb-4">{t('spu.physicochemicalProperties')}</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {formData.boilingPoint && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">{t('spu.boilingPoint')}</label>
                        <input
                          type="text"
                          value={formData.boilingPoint}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-300"
                        />
                      </div>
                    )}
                    {formData.meltingPoint && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">{t('spu.meltingPoint')}</label>
                        <input
                          type="text"
                          value={formData.meltingPoint}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-300"
                        />
                      </div>
                    )}
                    {formData.flashPoint && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">{t('spu.flashPoint')}</label>
                        <input
                          type="text"
                          value={formData.flashPoint}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-300"
                        />
                      </div>
                    )}
                    {formData.density && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">{t('spu.density')}</label>
                        <input
                          type="text"
                          value={formData.density}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-300"
                        />
                      </div>
                    )}
                    {formData.physicalDescription && (
                      <div className="md:col-span-3">
                        <label className="block text-xs text-slate-400 mb-1">{t('spu.physicalDescription')}</label>
                        <textarea
                          value={formData.physicalDescription}
                          readOnly
                          rows={2}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 产品描述 */}
              {formData.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white mb-4">{t('spu.description')}</h3>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* 危险性分类 */}
              {formData.hazardClasses && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white mb-4">{t('spu.hazardClassification')}</h3>
                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
                    <p className="text-sm text-slate-300">{formData.hazardClasses}</p>
                  </div>
                </div>
              )}

              {/* 行业应用 */}
              {formData.applications.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white mb-4">{t('spu.applications')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.applications.map((app, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm border border-blue-500/30">
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 同义词 */}
              {formData.synonyms.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white mb-4">{t('spu.synonymsAliases')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.synonyms.slice(0, 20).map((synonym, index) => (
                      <span key={index} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                        {synonym}
                      </span>
                    ))}
                    {formData.synonyms.length > 20 && (
                      <span className="px-2 py-1 bg-slate-700 text-slate-500 rounded text-xs">
                        +{formData.synonyms.length - 20} {t('spu.more')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 产品图 URL（可编辑） */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-4">{t('spu.productImage')}</h3>
                <input
                  type="text"
                  value={formData.generatedImageUrl || productImageUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, generatedImageUrl: e.target.value }))}
                  placeholder={t('spu.enterImageUrl')}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 保存按钮 */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t('spu.saveAsDraft')}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  {t('spu.saveToLibrary')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductCreatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ProductCreateContent />
    </Suspense>
  );
}
