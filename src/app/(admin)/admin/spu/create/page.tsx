'use client';

import { useState, Suspense } from 'react';
import {
  Search,
  Database,
  Loader2,
  Save,
  ChevronLeft,
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
  const { locale, t } = useAdminLocale();

  // 视图模式：'search' 搜索页，'edit' 编辑页
  const [viewMode, setViewMode] = useState<'search' | 'edit'>('search');

  // ========== 搜索相关状态 ==========
  const [casInput, setCasInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [existingSPU, setExistingSPU] = useState<SPUItem | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  });

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
        // 本地不存在 → 直接进入编辑模式
        enterEditMode(cas);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(locale === 'zh' ? '搜索失败，请重试' : 'Search failed, please retry');
    } finally {
      setSearching(false);
    }
  };

  // ========== 进入编辑模式 ==========
  const enterEditMode = (cas: string) => {
    setFormData({
      cas: cas,
      name: '',
      nameEn: '',
      formula: '',
      molecularWeight: '',
      description: '',
      synonyms: [],
      applications: [],
      hsCode: '',
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
    });
    setViewMode('edit');
  };

  const backToSearch = () => {
    setViewMode('search');
    setCasInput('');
    setError(null);
    setExistingSPU(null);
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
        description: formData.description || null,
        molecularWeight: formData.molecularWeight || null,
        smiles: formData.smiles || null,
        inchi: formData.inchi || null,
        inchiKey: formData.inchiKey || null,
        xlogp: formData.xlogp || null,
        boilingPoint: formData.boilingPoint || null,
        meltingPoint: formData.meltingPoint || null,
        flashPoint: formData.flashPoint || null,
        hazardClasses: formData.hazardClasses || null,
        synonyms: formData.synonyms.length > 0 ? formData.synonyms : null,
        applications: formData.applications.length > 0 ? formData.applications : null,
        hsCode: formData.hsCode || null,
        physicalDescription: formData.physicalDescription || null,
        colorForm: formData.colorForm || null,
        odor: formData.odor || null,
        density: formData.density || null,
        solubility: formData.solubility || null,
        vaporPressure: formData.vaporPressure || null,
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
                  onClick={() => window.location.href = '/admin/spu'}
                  className="w-full py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-medium"
                >
                  {locale === 'zh' ? '前往产品列表' : 'Go to Product List'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 编辑视图 */}
        {viewMode === 'edit' && (
          <div className="space-y-8">
            {/* 顶部导航 */}
            <div className="flex items-center justify-between">
              <button
                onClick={backToSearch}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('spu.previous')}
              </button>
              <h2 className="text-xl font-bold text-white">{t('spu.editSpu')}</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors disabled:opacity-50"
                >
                  {locale === 'zh' ? '保存为草稿' : 'Save as Draft'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {locale === 'zh' ? '保存并上架' : 'Save & Publish'}
                </button>
              </div>
            </div>

            {/* 基本信息 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">{t('spu.basicInformation')}</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.casNumber')}</label>
                  <input
                    type="text"
                    value={formData.cas}
                    readOnly
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg font-mono text-blue-400"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.name')} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={locale === 'zh' ? '请输入产品中文名' : 'Enter product name in Chinese'}
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.nameEn')}</label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                    placeholder={locale === 'zh' ? '请输入产品英文名' : 'Enter product name in English'}
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.formula')}</label>
                  <input
                    type="text"
                    value={formData.formula}
                    onChange={(e) => setFormData(prev => ({ ...prev, formula: e.target.value }))}
                    placeholder="C2H5OH"
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.hsCode')}</label>
                  <input
                    type="text"
                    value={formData.hsCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, hsCode: e.target.value }))}
                    placeholder="2207.10"
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.status')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="ACTIVE">{t('spu.active')}</option>
                    <option value="INACTIVE">{t('spu.inactive')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 化学信息 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">{t('spu.chemicalInformation')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.molecularWeight')}</label>
                  <input
                    type="text"
                    value={formData.molecularWeight}
                    onChange={(e) => setFormData(prev => ({ ...prev, molecularWeight: e.target.value }))}
                    placeholder="46.07"
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">SMILES</label>
                  <input
                    type="text"
                    value={formData.smiles}
                    onChange={(e) => setFormData(prev => ({ ...prev, smiles: e.target.value }))}
                    placeholder="CCO"
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">InChI</label>
                  <input
                    type="text"
                    value={formData.inchi}
                    onChange={(e) => setFormData(prev => ({ ...prev, inchi: e.target.value }))}
                    placeholder="InChI=1S/C2H6O/c1-2-3/h3H,2H2,1H3"
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">InChI Key</label>
                  <input
                    type="text"
                    value={formData.inchiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, inchiKey: e.target.value }))}
                    placeholder="LFQSCWFLJHTTHZ-UHFFFAOYSA-N"
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* 物理性质 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">{t('spu.physicalProperties')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.boilingPoint')}</label>
                  <input
                    type="text"
                    value={formData.boilingPoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, boilingPoint: e.target.value }))}
                    placeholder="78.37 °C"
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.meltingPoint')}</label>
                  <input
                    type="text"
                    value={formData.meltingPoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, meltingPoint: e.target.value }))}
                    placeholder="-114.1 °C"
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.flashPoint')}</label>
                  <input
                    type="text"
                    value={formData.flashPoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, flashPoint: e.target.value }))}
                    placeholder="13 °C"
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.density')}</label>
                  <input
                    type="text"
                    value={formData.density}
                    onChange={(e) => setFormData(prev => ({ ...prev, density: e.target.value }))}
                    placeholder="0.789 g/cm³"
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.solubility')}</label>
                  <input
                    type="text"
                    value={formData.solubility}
                    onChange={(e) => setFormData(prev => ({ ...prev, solubility: e.target.value }))}
                    placeholder={locale === 'zh' ? '与水混溶' : 'Miscible with water'}
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.vaporPressure')}</label>
                  <input
                    type="text"
                    value={formData.vaporPressure}
                    onChange={(e) => setFormData(prev => ({ ...prev, vaporPressure: e.target.value }))}
                    placeholder="5.95 kPa (20 °C)"
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* 外观描述 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">{t('spu.appearanceDescription')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.physicalDescription')}</label>
                  <input
                    type="text"
                    value={formData.physicalDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, physicalDescription: e.target.value }))}
                    placeholder={locale === 'zh' ? '无色透明液体' : 'Colorless transparent liquid'}
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.colorForm')}</label>
                  <input
                    type="text"
                    value={formData.colorForm}
                    onChange={(e) => setFormData(prev => ({ ...prev, colorForm: e.target.value }))}
                    placeholder={locale === 'zh' ? '无色' : 'Colorless'}
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.odor')}</label>
                  <input
                    type="text"
                    value={formData.odor}
                    onChange={(e) => setFormData(prev => ({ ...prev, odor: e.target.value }))}
                    placeholder={locale === 'zh' ? '特殊气味' : 'Characteristic odor'}
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t('spu.hazardClasses')}</label>
                  <input
                    type="text"
                    value={formData.hazardClasses}
                    onChange={(e) => setFormData(prev => ({ ...prev, hazardClasses: e.target.value }))}
                    placeholder="3 (Flammable liquids)"
                    className="w-full h-12 px-4 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* 产品描述 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">{t('spu.description')}</h3>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={locale === 'zh' ? '请输入产品描述...' : 'Enter product description...'}
                rows={4}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 resize-none"
              />
            </div>
          </div>
        )}
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
