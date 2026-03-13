'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Database,
  RefreshCw,
  X,
  Save,
  Loader2,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import { getAdminToken } from '@/services/adminAuthService';

// SPU 数据接口
interface SPUItem {
  id: string;
  cas: string;
  name: string;
  name_en?: string;
  formula?: string;
  description?: string;
  image_url?: string;
  hs_code?: string;
  hs_code_extensions?: Record<string, string>;
  status: string;
  pubchem_cid?: number;
  molecular_weight?: string;
  exact_mass?: string;
  smiles?: string;
  smiles_canonical?: string;
  smiles_isomeric?: string;
  inchi?: string;
  inchi_key?: string;
  xlogp?: string;
  tpsa?: string;
  complexity?: number;
  h_bond_donor_count?: number;
  h_bond_acceptor_count?: number;
  rotatable_bond_count?: number;
  heavy_atom_count?: number;
  formal_charge?: number;
  structure_url?: string;
  structure_image_key?: string;
  structure_2d_svg?: string;
  product_image_key?: string;
  product_image_generated_at?: string;
  physical_description?: string;
  color_form?: string;
  odor?: string;
  boiling_point?: string;
  melting_point?: string;
  flash_point?: string;
  density?: string;
  solubility?: string;
  vapor_pressure?: string;
  refractive_index?: string;
  hazard_classes?: string;
  health_hazards?: string;
  ghs_classification?: string;
  toxicity_summary?: string;
  carcinogenicity?: string;
  first_aid?: string;
  storage_conditions?: string;
  incompatible_materials?: string;
  synonyms?: string[];
  applications?: string[];
  translations?: Record<string, any>;
  pubchem_synced_at?: string;
}

// 表单数据类型
interface FormData {
  cas: string;
  name: string;
  nameEn: string;
  formula: string;
  molecularWeight: string;
  exactMass: string;
  description: string;
  synonyms: string[];
  applications: string[];
  hsCode: string;
  hsCodeExtensions: Record<string, string>;
  status: string;
  smiles: string;
  smilesCanonical: string;
  smilesIsomeric: string;
  inchi: string;
  inchiKey: string;
  xlogp: string;
  tpsa: string;
  complexity: string;
  hBondDonorCount: string;
  hBondAcceptorCount: string;
  rotatableBondCount: string;
  heavyAtomCount: string;
  formalCharge: string;
  physicalDescription: string;
  colorForm: string;
  odor: string;
  boilingPoint: string;
  meltingPoint: string;
  flashPoint: string;
  density: string;
  solubility: string;
  vaporPressure: string;
  refractiveIndex: string;
  hazardClasses: string;
  healthHazards: string;
  ghsClassification: string;
  toxicitySummary: string;
  carcinogenicity: string;
  firstAid: string;
  storageConditions: string;
  incompatibleMaterials: string;
}

// 空表单数据
const emptyFormData: FormData = {
  cas: '',
  name: '',
  nameEn: '',
  formula: '',
  molecularWeight: '',
  exactMass: '',
  description: '',
  synonyms: [],
  applications: [],
  hsCode: '',
  hsCodeExtensions: {},
  status: 'ACTIVE',
  smiles: '',
  smilesCanonical: '',
  smilesIsomeric: '',
  inchi: '',
  inchiKey: '',
  xlogp: '',
  tpsa: '',
  complexity: '',
  hBondDonorCount: '',
  hBondAcceptorCount: '',
  rotatableBondCount: '',
  heavyAtomCount: '',
  formalCharge: '',
  physicalDescription: '',
  colorForm: '',
  odor: '',
  boilingPoint: '',
  meltingPoint: '',
  flashPoint: '',
  density: '',
  solubility: '',
  vaporPressure: '',
  refractiveIndex: '',
  hazardClasses: '',
  healthHazards: '',
  ghsClassification: '',
  toxicitySummary: '',
  carcinogenicity: '',
  firstAid: '',
  storageConditions: '',
  incompatibleMaterials: '',
};

// HS编码国家扩展
const hsCodeCountries = [
  { code: 'CN', name: '中国', digits: 10 },
  { code: 'US', name: '美国', digits: 10 },
  { code: 'EU', name: '欧盟', digits: 8 },
  { code: 'JP', name: '日本', digits: 9 },
  { code: 'KR', name: '韩国', digits: 10 },
];

function SPUEditContent() {
  const { t, locale } = useAdminLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 参数
  const spuId = searchParams.get('id');
  const casNumber = searchParams.get('cas');
  const isNewMode = !spuId && !!casNumber;
  const isEditMode = !!spuId;

  // 状态
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [spu, setSpu] = useState<SPUItem | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [showHsExtensions, setShowHsExtensions] = useState(false);
  const [synonymInput, setSynonymInput] = useState('');

  // PubChem 信息
  const [pubchemInfo, setPubchemInfo] = useState<{ cid?: number; syncedAt?: string }>({});
  const [structureImageUrl, setStructureImageUrl] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  
  // 同步状态
  const [syncingPubChem, setSyncingPubChem] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    step: 'connecting' | 'fetching' | 'updating';
    message: string;
  }>({ step: 'connecting', message: '' });
  
  // 翻译状态
  const [translating, setTranslating] = useState(false);
  const [translatingFields, setTranslatingFields] = useState<Set<string>>(new Set());
  const [translationProgress, setTranslationProgress] = useState<{
    current: number;
    total: number;
    status: 'idle' | 'translating' | 'completed';
  }>({ current: 0, total: 0, status: 'idle' });
  
  // 同步后状态
  const [justSynced, setJustSynced] = useState(false);
  const [syncedFields, setSyncedFields] = useState<Set<string>>(new Set());
  const [pendingTranslations, setPendingTranslations] = useState<Record<string, any>>({});
  
  // 原始数据（用于检测修改）
  const [originalFormData, setOriginalFormData] = useState<FormData | null>(null);
  
  // AbortController
  const syncAbortControllerRef = useRef<AbortController | null>(null);
  const translateAbortControllerRef = useRef<AbortController | null>(null);
  
  // Dialog 状态
  const [dialogConfig, setDialogConfig] = useState<{
    type: 'confirm' | 'success' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  // 加载 SPU 数据
  useEffect(() => {
    if (isEditMode && spuId) {
      fetchSPUData(spuId);
    } else if (isNewMode && casNumber) {
      // 新建模式：只设置 CAS 号
      setFormData(prev => ({ ...prev, cas: casNumber }));
      setLoading(false);
    }
  }, [spuId, casNumber]);

  // 获取 SPU 数据
  const fetchSPUData = async (id: string) => {
    setLoading(true);
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/spu-manage/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (data.success && data.data) {
        const spuData = data.data;
        setSpu(spuData);
        
        // 初始化表单数据
        initFormDataFromSPU(spuData);
        
        // 设置 PubChem 信息
        setPubchemInfo({
          cid: spuData.pubchem_cid,
          syncedAt: spuData.pubchem_synced_at,
        });
        
        // 设置图片
        if (spuData.structure_url) {
          setStructureImageUrl(spuData.structure_url);
        }
        if (spuData.image_url) {
          setProductImageUrl(spuData.image_url);
        }
      } else {
        alert(locale === 'zh' ? '加载失败' : 'Failed to load');
        router.push('/admin/spu');
      }
    } catch (error) {
      console.error('Error fetching SPU:', error);
      alert(locale === 'zh' ? '加载失败' : 'Failed to load');
      router.push('/admin/spu');
    } finally {
      setLoading(false);
    }
  };

  // 从 SPU 数据初始化表单
  const initFormDataFromSPU = (spu: SPUItem) => {
    const allLanguages = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];
    const currentLang = allLanguages.includes(locale) ? locale : 'en';

    setFormData({
      cas: spu.cas,
      name: spu.translations?.name?.[currentLang] || spu.name || '',
      nameEn: spu.name_en || '',
      formula: spu.formula || '',
      molecularWeight: spu.molecular_weight || '',
      exactMass: spu.exact_mass || '',
      description: spu.translations?.description?.[currentLang] || spu.description || '',
      synonyms: spu.synonyms || [],
      applications: spu.translations?.applications?.[currentLang] || spu.applications || [],
      hsCode: spu.hs_code || '',
      hsCodeExtensions: spu.hs_code_extensions || {},
      status: spu.status || 'ACTIVE',
      smiles: spu.smiles || '',
      smilesCanonical: spu.smiles_canonical || '',
      smilesIsomeric: spu.smiles_isomeric || '',
      inchi: spu.inchi || '',
      inchiKey: spu.inchi_key || '',
      xlogp: spu.xlogp || '',
      tpsa: spu.tpsa || '',
      complexity: spu.complexity?.toString() || '',
      hBondDonorCount: spu.h_bond_donor_count?.toString() || '',
      hBondAcceptorCount: spu.h_bond_acceptor_count?.toString() || '',
      rotatableBondCount: spu.rotatable_bond_count?.toString() || '',
      heavyAtomCount: spu.heavy_atom_count?.toString() || '',
      formalCharge: spu.formal_charge?.toString() || '',
      physicalDescription: spu.translations?.physicalDescription?.[currentLang] || spu.physical_description || '',
      colorForm: spu.color_form || '',
      odor: spu.odor || '',
      boilingPoint: spu.translations?.boilingPoint?.[currentLang] || spu.boiling_point || '',
      meltingPoint: spu.translations?.meltingPoint?.[currentLang] || spu.melting_point || '',
      flashPoint: spu.translations?.flashPoint?.[currentLang] || spu.flash_point || '',
      density: spu.density || '',
      solubility: spu.translations?.solubility?.[currentLang] || spu.solubility || '',
      vaporPressure: spu.translations?.vaporPressure?.[currentLang] || spu.vapor_pressure || '',
      refractiveIndex: spu.translations?.refractiveIndex?.[currentLang] || spu.refractive_index || '',
      hazardClasses: spu.translations?.hazardClasses?.[currentLang] || spu.hazard_classes || '',
      healthHazards: spu.translations?.healthHazards?.[currentLang] || spu.health_hazards || '',
      ghsClassification: spu.translations?.ghsClassification?.[currentLang] || spu.ghs_classification || '',
      toxicitySummary: spu.toxicity_summary || '',
      carcinogenicity: spu.carcinogenicity || '',
      firstAid: spu.translations?.firstAid?.[currentLang] || spu.first_aid || '',
      storageConditions: spu.translations?.storageConditions?.[currentLang] || spu.storage_conditions || '',
      incompatibleMaterials: spu.translations?.incompatibleMaterials?.[currentLang] || spu.incompatible_materials || '',
    });
  };

  // 返回列表
  const handleBack = () => {
    router.push('/admin/spu');
  };

  // 同步 PubChem 数据
  const handleSyncPubChem = async () => {
    if (!formData.cas) {
      alert(locale === 'zh' ? '请先输入CAS号' : 'Please enter CAS number first');
      return;
    }

    // 创建 AbortController
    const abortController = new AbortController();
    syncAbortControllerRef.current = abortController;

    setSyncingPubChem(true);
    setSyncProgress({ step: 'connecting', message: '' });

    try {
      const token = getAdminToken();
      
      // 步骤1：检测连接
      setSyncProgress({ step: 'connecting', message: locale === 'zh' ? '正在连接 PubChem...' : 'Connecting to PubChem...' });
      
      const connectionResponse = await fetch('/api/admin/spu/check-pubchem-connection', {
        signal: abortController.signal,
      });
      const connectionData = await connectionResponse.json();
      
      if (!connectionData.connected) {
        setSyncingPubChem(false);
        setSyncProgress({ step: 'connecting', message: '' });
        alert(locale === 'zh' 
          ? `PubChem 连接失败: ${connectionData.message}` 
          : `PubChem connection failed: ${connectionData.message}`);
        return;
      }

      // 步骤2：获取数据
      setSyncProgress({ step: 'fetching', message: locale === 'zh' ? `正在获取 ${formData.cas} 数据...` : `Fetching data for ${formData.cas}...` });
      
      const response = await fetch('/api/admin/spu/sync-pubchem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          preview: true,
          cas: formData.cas,
        }),
        signal: abortController.signal,
      });

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        
        // 步骤3：更新表单
        setSyncProgress({ step: 'updating', message: locale === 'zh' ? '正在更新表单...' : 'Updating form...' });
        
        // 设置 PubChem 信息
        setPubchemInfo({
          cid: data.pubchemCid,
          syncedAt: data.pubchemSyncedAt,
        });

        // 设置结构图
        if (data.structureUrl) {
          setStructureImageUrl(data.structureUrl);
        }

        // 填充表单数据（只填充空字段）
        setFormData(prev => ({
          ...prev,
          name: prev.name || data.nameZh || '',
          nameEn: prev.nameEn || data.nameEn || '',
          formula: prev.formula || data.formula || '',
          molecularWeight: prev.molecularWeight || data.molecularWeight || '',
          exactMass: prev.exactMass || data.exactMass || '',
          smiles: prev.smiles || data.smiles || '',
          smilesCanonical: prev.smilesCanonical || data.smilesCanonical || '',
          smilesIsomeric: prev.smilesIsomeric || data.smilesIsomeric || '',
          inchi: prev.inchi || data.inchi || '',
          inchiKey: prev.inchiKey || data.inchiKey || '',
          xlogp: prev.xlogp || data.xlogp || '',
          tpsa: prev.tpsa || data.tpsa || '',
          boilingPoint: prev.boilingPoint || data.boilingPoint || '',
          meltingPoint: prev.meltingPoint || data.meltingPoint || '',
          flashPoint: prev.flashPoint || data.flashPoint || '',
          density: prev.density || data.density || '',
          solubility: prev.solubility || data.solubility || '',
          vaporPressure: prev.vaporPressure || data.vaporPressure || '',
          refractiveIndex: prev.refractiveIndex || data.refractiveIndex || '',
          physicalDescription: prev.physicalDescription || data.physicalDescription || '',
          colorForm: prev.colorForm || data.colorForm || '',
          odor: prev.odor || data.odor || '',
          hazardClasses: prev.hazardClasses || data.hazardClasses || '',
          healthHazards: prev.healthHazards || data.healthHazards || '',
          ghsClassification: prev.ghsClassification || data.ghsClassification || '',
          firstAid: prev.firstAid || data.firstAid || '',
          storageConditions: prev.storageConditions || data.storageConditions || '',
          incompatibleMaterials: prev.incompatibleMaterials || data.incompatibleMaterials || '',
          description: prev.description || data.description || '',
          synonyms: prev.synonyms.length > 0 ? prev.synonyms : (data.synonyms || []),
          applications: prev.applications.length > 0 ? prev.applications : (data.applications || []),
        }));

        // 检测需要翻译的字段
        const translatableFields = [
          { key: 'description', value: data.description },
          { key: 'physicalDescription', value: data.physicalDescription },
          { key: 'colorForm', value: data.colorForm },
          { key: 'odor', value: data.odor },
          { key: 'density', value: data.density },
          { key: 'boilingPoint', value: data.boilingPoint },
          { key: 'meltingPoint', value: data.meltingPoint },
          { key: 'flashPoint', value: data.flashPoint },
          { key: 'hazardClasses', value: data.hazardClasses },
          { key: 'healthHazards', value: data.healthHazards },
          { key: 'ghsClassification', value: data.ghsClassification },
          { key: 'firstAid', value: data.firstAid },
          { key: 'storageConditions', value: data.storageConditions },
          { key: 'incompatibleMaterials', value: data.incompatibleMaterials },
          { key: 'solubility', value: data.solubility },
          { key: 'vaporPressure', value: data.vaporPressure },
          { key: 'refractiveIndex', value: data.refractiveIndex },
        ];
        
        const fieldsToTranslate = translatableFields
          .filter(({ value }) => value)
          .map(({ key }) => key);
        
        // 标记为刚同步完成
        if (fieldsToTranslate.length > 0) {
          setJustSynced(true);
          setSyncedFields(new Set(fieldsToTranslate));
          setPendingTranslations({});
          setDialogConfig({
            type: 'success',
            title: t('spu.syncSuccess'),
            message: locale === 'zh' 
              ? `PubChem 数据已获取，${fieldsToTranslate.length} 个字段需要翻译。点击"翻译并保存"按钮开始翻译，或直接点击"保存"保存数据。` 
              : `PubChem data fetched, ${fieldsToTranslate.length} fields need translation. Click "Translate & Save" or "Save" to save.`,
          });
        } else {
          setJustSynced(true);
          setDialogConfig({
            type: 'success',
            title: t('spu.syncSuccess'),
            message: locale === 'zh' 
              ? 'PubChem 数据已获取，点击"保存"保存数据。' 
              : 'PubChem data fetched. Click "Save" to save.',
          });
        }
      } else {
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '同步失败' : 'Sync Error',
          message: result.error || (locale === 'zh' ? '未找到 PubChem 数据' : 'PubChem data not found'),
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Sync aborted by user');
        return;
      }
      console.error('Error syncing PubChem:', error);
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '同步失败' : 'Sync Error',
        message: locale === 'zh' ? '同步失败' : 'Sync failed',
      });
    } finally {
      setSyncingPubChem(false);
      setSyncProgress({ step: 'connecting', message: '' });
      syncAbortControllerRef.current = null;
    }
  };

  // 翻译字段
  const translateFields = async (fieldsToTranslate: string[], translations: Record<string, any>) => {
    const allLanguages = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];
    const currentLang = allLanguages.includes(locale) ? locale : 'en';
    const token = getAdminToken();
    
    setTranslating(true);
    setTranslationProgress({ current: 0, total: fieldsToTranslate.length, status: 'translating' });
    
    const abortController = new AbortController();
    translateAbortControllerRef.current = abortController;
    
    for (let i = 0; i < fieldsToTranslate.length; i++) {
      const fieldName = fieldsToTranslate[i];
      const value = formData[fieldName as keyof typeof formData] as string;
      
      if (!value) continue;
      
      setTranslatingFields(new Set([fieldName]));
      
      try {
        const res = await fetch('/api/common/ai/translate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ 
            text: value, 
            targetLanguages: allLanguages 
          }),
          signal: abortController.signal,
        });
        const data = await res.json();
        
        if (data.translations) {
          translations[fieldName] = data.translations;
          
          // 更新当前语言的值
          const currentLangTranslation = data.translations[currentLang];
          if (currentLangTranslation) {
            setFormData(prev => ({ ...prev, [fieldName]: currentLangTranslation }));
          }
        }
        
        setTranslationProgress(prev => ({ ...prev, current: i + 1 }));
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Translation aborted');
          break;
        }
        console.error(`Error translating ${fieldName}:`, err);
      }
      
      setTranslatingFields(new Set());
    }
    
    translateAbortControllerRef.current = null;
    setTranslating(false);
    setTranslationProgress(prev => ({ ...prev, status: 'completed' }));
    setPendingTranslations({ ...translations });
    
    return translations;
  };

  // 保存
  const handleSave = async () => {
    if (!formData.cas) {
      alert(locale === 'zh' ? 'CAS号不能为空' : 'CAS number is required');
      return;
    }
    if (!formData.name && !formData.nameEn) {
      alert(locale === 'zh' ? '产品名称不能为空' : 'Product name is required');
      return;
    }

    const token = getAdminToken();
    let translations: Record<string, any> = { ...pendingTranslations };

    // 如果刚同步完成且有需要翻译的字段，先翻译
    if (justSynced && syncedFields.size > 0) {
      const fieldsToTranslate = Array.from(syncedFields);
      translations = await translateFields(fieldsToTranslate, translations);
    }

    setSaving(true);
    try {
      const spuData = {
        id: spuId || undefined,
        cas: formData.cas,
        name: formData.name || formData.nameEn,
        nameEn: formData.nameEn || null,
        formula: formData.formula || null,
        description: formData.description || null,
        molecularWeight: formData.molecularWeight || null,
        smiles: formData.smiles || null,
        inchi: formData.inchi || null,
        inchiKey: formData.inchiKey || null,
        xlogp: formData.xlogp || null,
        tpsa: formData.tpsa || null,
        boilingPoint: formData.boilingPoint || null,
        meltingPoint: formData.meltingPoint || null,
        flashPoint: formData.flashPoint || null,
        density: formData.density || null,
        solubility: formData.solubility || null,
        vaporPressure: formData.vaporPressure || null,
        refractiveIndex: formData.refractiveIndex || null,
        hazardClasses: formData.hazardClasses || null,
        healthHazards: formData.healthHazards || null,
        ghsClassification: formData.ghsClassification || null,
        firstAid: formData.firstAid || null,
        storageConditions: formData.storageConditions || null,
        incompatibleMaterials: formData.incompatibleMaterials || null,
        physicalDescription: formData.physicalDescription || null,
        colorForm: formData.colorForm || null,
        odor: formData.odor || null,
        synonyms: formData.synonyms.length > 0 ? formData.synonyms : null,
        applications: formData.applications.length > 0 ? formData.applications : null,
        hsCode: formData.hsCode || null,
        hsCodeExtensions: Object.keys(formData.hsCodeExtensions).length > 0 ? formData.hsCodeExtensions : null,
        status: formData.status,
        translations: Object.keys(translations).length > 0 ? translations : null,
        pubchemCid: pubchemInfo.cid || null,
        structureUrl: structureImageUrl || null,
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
        router.push('/admin/spu');
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

  // 自动调整 textarea 高度
  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white h-full relative">
      {/* 同步中遮罩层 */}
      {syncingPubChem && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-purple-500/30 flex flex-col items-center gap-4 max-w-sm mx-4">
            <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
            <div className="text-center w-full">
              <p className="text-lg font-medium text-white mb-3">
                {t('spu.syncingPubchem')}
              </p>
              <div className="space-y-2 text-left">
                <div className={`flex items-center gap-2 text-sm ${syncProgress.step === 'connecting' ? 'text-purple-400' : 'text-green-400'}`}>
                  {syncProgress.step !== 'connecting' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>{t('spu.connectingApi')}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${syncProgress.step === 'fetching' ? 'text-purple-400' : syncProgress.step === 'updating' ? 'text-green-400' : 'text-slate-500'}`}>
                  {syncProgress.step === 'updating' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : syncProgress.step === 'fetching' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-500" />
                  )}
                  <span>{t('spu.fetchingData')}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${syncProgress.step === 'updating' ? 'text-purple-400' : 'text-slate-500'}`}>
                  {syncProgress.step === 'updating' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-500" />
                  )}
                  <span>{t('spu.updatingForm')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 翻译中遮罩层 */}
      {translating && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-blue-500/30 flex flex-col items-center gap-4 max-w-sm mx-4 w-full">
            <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
            <div className="text-center w-full">
              <p className="text-lg font-medium text-white mb-3">
                {t('spu.translating')}
              </p>
              {translationProgress.status === 'translating' && (
                <>
                  {translatingFields.size > 0 && (
                    <div className="mb-3 p-2 bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">{t('spu.currentField')}</p>
                      <p className="text-sm text-blue-400 font-medium">
                        {Array.from(translatingFields).join(', ')}
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-slate-400 mb-2">
                    {translationProgress.current} / {translationProgress.total} {t('spu.fields')}
                  </p>
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{t('spu.translatingTo')}</p>
                </>
              )}
              {translationProgress.status === 'completed' && (
                <p className="text-sm text-green-400">{t('spu.translationCompleted')}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 顶部导航 */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-5 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {/* 左侧：返回 + 同步按钮 */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">{locale === 'zh' ? '返回' : 'Back'}</span>
              </button>
              
              <div className="w-px h-5 bg-slate-600" />
              
              <button
                type="button"
                onClick={handleSyncPubChem}
                disabled={syncingPubChem || saving || translating}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors disabled:opacity-50"
              >
                {syncingPubChem ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                )}
                <span>{t('spu.syncPubchem')}</span>
              </button>
              
              {pubchemInfo.syncedAt && (
                <span className="text-xs text-slate-500">
                  {t('spu.lastSync')}: {new Date(pubchemInfo.syncedAt).toLocaleString()}
                </span>
              )}
            </div>
            
            {/* 中间：标题 */}
            <h2 className="text-lg font-semibold text-white absolute left-1/2 -translate-x-1/2">
              {isNewMode ? t('spu.newSpu') : t('spu.editSpu')}
              {spu && <span className="ml-2 text-sm text-slate-500 font-mono">CAS: {spu.cas}</span>}
            </h2>
            
            {/* 右侧：翻译状态 + 保存按钮 */}
            <div className="flex items-center gap-3">
              {/* 翻译状态 */}
              {translating && (
                <span className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{t('spu.translating')}</span>
                  <span className="text-blue-300">{translationProgress.current}/{translationProgress.total}</span>
                </span>
              )}
              {translationProgress.status === 'completed' && !saving && (
                <span className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  <span>{t('spu.translationDoneClickSave')}</span>
                </span>
              )}
              
              {/* 保存按钮 */}
              <button
                onClick={handleSave}
                disabled={saving || translating || syncingPubChem}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors disabled:opacity-50 ${
                  justSynced 
                    ? 'bg-amber-600 hover:bg-amber-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : translating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 w-4" />
                )}
                <span>{justSynced ? t('spu.translateAndSave') : t('spu.save')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-4xl mx-auto p-5 pb-20">
          {/* 图片展示区域 */}
          <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">{t('spu.pubchemData')}</span>
              {pubchemInfo.cid && (
                <span className="text-xs text-slate-500">
                  CID: <span className="text-blue-400">{pubchemInfo.cid}</span>
                  {pubchemInfo.syncedAt && (
                    <span className="ml-2">| {t('spu.syncedOn')}: {new Date(pubchemInfo.syncedAt).toLocaleDateString()}</span>
                  )}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6">
              {/* 2D 结构图 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-slate-400">{t('spu.structure2D')}</span>
                  {pubchemInfo.cid && (
                    <a
                      href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemInfo.cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                  {structureImageUrl ? (
                    <img src={structureImageUrl} alt="2D Structure" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-center text-slate-500">
                      <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>{t('spu.syncPubchemToDisplay')}</p>
                    </div>
                  )}
                </div>
              </div>
              {/* 产品图 */}
              <div>
                <div className="text-sm text-slate-400 mb-2">{t('spu.productImage')}</div>
                <div className="aspect-square bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg border border-slate-600/50 flex items-center justify-center overflow-hidden">
                  {productImageUrl ? (
                    <img src={productImageUrl} alt="Product" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-center text-slate-500">
                      <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">{t('spu.noData')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">{t('spu.basicInformation')}</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* CAS号 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('spu.casNumber')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cas}
                  onChange={(e) => setFormData(prev => ({ ...prev, cas: e.target.value }))}
                  disabled={!!spuId}
                  placeholder="50-00-0"
                  className="form-input-dark disabled:opacity-50"
                />
              </div>
              {/* HS编码 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.hsCode')}</label>
                <input
                  type="text"
                  value={formData.hsCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, hsCode: e.target.value.replace(/[^0-9.]/g, '').slice(0, 20) }))}
                  placeholder="290241"
                  className="form-input-dark-mono"
                />
              </div>
              {/* 状态 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.status')}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="form-input-dark"
                >
                  <option value="ACTIVE">{t('spu.active')}</option>
                  <option value="INACTIVE">{t('spu.inactive')}</option>
                </select>
              </div>
              {/* 中文名称 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('spu.nameZh')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('spu.placeholderChineseName')}
                  className="form-input-dark"
                />
              </div>
              {/* 英文名称 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.nameEn')}</label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                  placeholder="English Name"
                  className="form-input-dark"
                />
              </div>
            </div>
            {/* HS编码国家扩展 */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowHsExtensions(!showHsExtensions)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {showHsExtensions ? t('spu.hideCountryExtensions') : t('spu.addCountryExtensions')}
              </button>
              {showHsExtensions && (
                <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-slate-700/30 rounded-lg">
                  {hsCodeCountries.map((country) => (
                    <div key={country.code} className="flex items-center gap-2">
                      <span className="w-12 text-xs text-slate-400">{country.code}</span>
                      <input
                        type="text"
                        value={formData.hsCodeExtensions[country.code] || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          hsCodeExtensions: { ...prev.hsCodeExtensions, [country.code]: e.target.value }
                        }))}
                        placeholder={`${country.digits}位编码`}
                        className="form-input-dark-sm font-mono"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 化学信息 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">{t('spu.chemicalInformation')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.formula')}</label>
                <input
                  type="text"
                  value={formData.formula}
                  onChange={(e) => setFormData(prev => ({ ...prev, formula: e.target.value }))}
                  placeholder="C2H5OH"
                  className="form-input-dark-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.molecularWeight')}</label>
                <input
                  type="text"
                  value={formData.molecularWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, molecularWeight: e.target.value }))}
                  placeholder="46.07"
                  className="form-input-dark-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">SMILES</label>
                <input
                  type="text"
                  value={formData.smiles}
                  onChange={(e) => setFormData(prev => ({ ...prev, smiles: e.target.value }))}
                  placeholder="CCO"
                  className="form-input-dark-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">InChI Key</label>
                <input
                  type="text"
                  value={formData.inchiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, inchiKey: e.target.value }))}
                  placeholder="LFQSCWFLJHTTHZ-UHFFFAOYSA-N"
                  className="form-input-dark-mono"
                />
              </div>
            </div>
          </div>

          {/* 物理性质 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">{t('spu.physicalProperties')}</h3>
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.physicalDescription')}</label>
              <textarea
                value={formData.physicalDescription}
                onChange={(e) => { autoResizeTextarea(e); setFormData(prev => ({ ...prev, physicalDescription: e.target.value })); }}
                className="form-input-dark overflow-hidden"
                style={{ height: 'auto' }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.colorForm')}</label>
                <input
                  type="text"
                  value={formData.colorForm}
                  onChange={(e) => setFormData(prev => ({ ...prev, colorForm: e.target.value }))}
                  className="form-input-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.odor')}</label>
                <input
                  type="text"
                  value={formData.odor}
                  onChange={(e) => setFormData(prev => ({ ...prev, odor: e.target.value }))}
                  className="form-input-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.density')}</label>
                <input
                  type="text"
                  value={formData.density}
                  onChange={(e) => setFormData(prev => ({ ...prev, density: e.target.value }))}
                  className="form-input-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.boilingPoint')}</label>
                <input
                  type="text"
                  value={formData.boilingPoint}
                  onChange={(e) => setFormData(prev => ({ ...prev, boilingPoint: e.target.value }))}
                  className="form-input-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.meltingPoint')}</label>
                <input
                  type="text"
                  value={formData.meltingPoint}
                  onChange={(e) => setFormData(prev => ({ ...prev, meltingPoint: e.target.value }))}
                  className="form-input-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.flashPoint')}</label>
                <input
                  type="text"
                  value={formData.flashPoint}
                  onChange={(e) => setFormData(prev => ({ ...prev, flashPoint: e.target.value }))}
                  className="form-input-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.solubility')}</label>
                <input
                  type="text"
                  value={formData.solubility}
                  onChange={(e) => setFormData(prev => ({ ...prev, solubility: e.target.value }))}
                  className="form-input-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.vaporPressure')}</label>
                <input
                  type="text"
                  value={formData.vaporPressure}
                  onChange={(e) => setFormData(prev => ({ ...prev, vaporPressure: e.target.value }))}
                  className="form-input-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.refractiveIndex')}</label>
                <input
                  type="text"
                  value={formData.refractiveIndex}
                  onChange={(e) => setFormData(prev => ({ ...prev, refractiveIndex: e.target.value }))}
                  className="form-input-dark"
                />
              </div>
            </div>
          </div>

          {/* 安全与毒性 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">{t('spu.safetyToxicity')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.hazardClasses')}</label>
                <input
                  type="text"
                  value={formData.hazardClasses}
                  onChange={(e) => setFormData(prev => ({ ...prev, hazardClasses: e.target.value }))}
                  className="form-input-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.healthHazards')}</label>
                <textarea
                  value={formData.healthHazards}
                  onChange={(e) => { autoResizeTextarea(e); setFormData(prev => ({ ...prev, healthHazards: e.target.value })); }}
                  className="form-input-dark overflow-hidden"
                  style={{ height: 'auto' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.firstAid')}</label>
                  <textarea
                    value={formData.firstAid}
                    onChange={(e) => { autoResizeTextarea(e); setFormData(prev => ({ ...prev, firstAid: e.target.value })); }}
                    className="form-input-dark overflow-hidden"
                    style={{ height: 'auto' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.storageConditions')}</label>
                  <textarea
                    value={formData.storageConditions}
                    onChange={(e) => { autoResizeTextarea(e); setFormData(prev => ({ ...prev, storageConditions: e.target.value })); }}
                    className="form-input-dark overflow-hidden"
                    style={{ height: 'auto' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 同义词 */}
          <div className="mb-8">
            <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.synonyms')}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.synonyms.map((syn, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 rounded text-xs">
                  {syn}
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, synonyms: prev.synonyms.filter((_, i) => i !== idx) }))} className="text-slate-400 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={synonymInput}
                onChange={(e) => setSynonymInput(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter' && synonymInput.trim()) { setFormData(prev => ({ ...prev, synonyms: [...prev.synonyms, synonymInput.trim()] })); setSynonymInput(''); } }}
                className="form-input-dark flex-1"
              />
              <button
                type="button"
                onClick={() => { if (synonymInput.trim()) { setFormData(prev => ({ ...prev, synonyms: [...prev.synonyms, synonymInput.trim()] })); setSynonymInput(''); } }}
                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => { autoResizeTextarea(e); setFormData(prev => ({ ...prev, description: e.target.value })); }}
              placeholder={t('spu.placeholderDescription')}
              className="form-input-dark overflow-hidden"
              style={{ height: 'auto' }}
            />
          </div>
        </div>
        
        {/* Dialog 弹窗 */}
        {dialogConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl max-w-md mx-4 border border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                {dialogConfig.type === 'success' && <CheckCircle className="w-6 h-6 text-green-400" />}
                {dialogConfig.type === 'error' && <X className="w-6 h-6 text-red-400" />}
                <h3 className="text-lg font-semibold text-white">{dialogConfig.title}</h3>
              </div>
              <p className="text-sm text-slate-300 mb-6">{dialogConfig.message}</p>
              <button
                onClick={() => setDialogConfig(null)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {locale === 'zh' ? '确定' : 'OK'}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

export default function SPUEditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>}>
      <SPUEditContent />
    </Suspense>
  );
}
