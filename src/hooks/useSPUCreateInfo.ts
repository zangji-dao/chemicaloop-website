/**
 * 新建产品 - 填写表单页面 Hook
 * 
 * 流程：
 * 1. 从 sessionStorage 读取预览数据（由搜索页面同步并缓存）
 * 2. 显示表单信息
 * 3. 用户点击翻译
 * 4. 用户点击保存 → 写入数据库，产品状态为 ACTIVE
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAdminToken } from '@/services/adminAuthService';
import { FormData, TranslationProgress } from '@/types/spu';

// sessionStorage key for preview data
const PREVIEW_DATA_KEY = 'spu_create_preview_data';

const emptyFormData: FormData = {
  cas: '',
  name: '',
  nameEn: '',
  formula: '',
  molecularWeight: '',
  exactMass: '',
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
  description: '',
  synonyms: [],
  applications: [],
  hsCode: '',
  hsCodeExtensions: {},
  status: 'ACTIVE',
};

interface UseSPUCreateInfoOptions {
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

interface UseSPUCreateInfoReturn {
  // 状态
  loading: boolean;
  saving: boolean;
  translating: boolean;
  translatingFields: Set<string>;
  translationProgress: TranslationProgress;
  needTranslate: boolean;
  
  // 数据
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  pendingTranslations: Record<string, any>;
  
  // 方法
  handleTranslate: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleBack: () => void;
  
  // 弹窗
  dialogConfig: any;
  setDialogConfig: (config: any) => void;
}

/**
 * 将预览数据转换为表单数据
 */
function previewToFormData(previewData: Record<string, any>, cas: string): FormData {
  return {
    cas: cas,
    name: previewData.nameZh || '',
    nameEn: previewData.nameEn || '',
    formula: previewData.formula || '',
    molecularWeight: previewData.molecularWeight || '',
    exactMass: previewData.exactMass || '',
    smiles: previewData.smiles || '',
    smilesCanonical: previewData.smilesCanonical || '',
    smilesIsomeric: previewData.smilesIsomeric || '',
    inchi: previewData.inchi || '',
    inchiKey: previewData.inchiKey || '',
    xlogp: previewData.xlogp || '',
    tpsa: previewData.tpsa || '',
    complexity: previewData.complexity?.toString() || '',
    hBondDonorCount: previewData.hBondDonorCount?.toString() || '',
    hBondAcceptorCount: previewData.hBondAcceptorCount?.toString() || '',
    rotatableBondCount: previewData.rotatableBondCount?.toString() || '',
    heavyAtomCount: previewData.heavyAtomCount?.toString() || '',
    formalCharge: previewData.formalCharge?.toString() || '',
    physicalDescription: previewData.physicalDescription || '',
    colorForm: previewData.colorForm || '',
    odor: previewData.odor || '',
    boilingPoint: previewData.boilingPoint || '',
    meltingPoint: previewData.meltingPoint || '',
    flashPoint: previewData.flashPoint || '',
    density: previewData.density || '',
    solubility: previewData.solubility || '',
    vaporPressure: previewData.vaporPressure || '',
    refractiveIndex: previewData.refractiveIndex || '',
    hazardClasses: previewData.hazardClasses || '',
    healthHazards: previewData.healthHazards || '',
    ghsClassification: previewData.ghsClassification || '',
    toxicitySummary: previewData.toxicitySummary || '',
    carcinogenicity: previewData.carcinogenicity || '',
    firstAid: previewData.firstAid || '',
    storageConditions: previewData.storageConditions || '',
    incompatibleMaterials: previewData.incompatibleMaterials || '',
    description: previewData.description || '',
    synonyms: previewData.synonyms || [],
    applications: previewData.applications || [],
    hsCode: '',
    hsCodeExtensions: {},
    status: 'ACTIVE',
  };
}

export function useSPUCreateInfo({ locale, t }: UseSPUCreateInfoOptions): UseSPUCreateInfoReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cas = searchParams.get('cas') || '';

  // 状态
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatingFields, setTranslatingFields] = useState<Set<string>>(new Set());
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress>({
    status: 'idle',
    current: 0,
    total: 0,
  });
  const [needTranslate, setNeedTranslate] = useState(false);
  
  // 数据
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [productImageKey, setProductImageKey] = useState<string>('');
  const [pendingTranslations, setPendingTranslations] = useState<Record<string, any>>({});
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  
  // 弹窗
  const [dialogConfig, setDialogConfig] = useState<any>(null);

  // 从 sessionStorage 加载预览数据
  useEffect(() => {
    const loadPreviewData = async () => {
      if (!cas) {
        setLoading(false);
        return;
      }

      try {
        // 从 sessionStorage 读取预览数据
        const cachedData = sessionStorage.getItem(PREVIEW_DATA_KEY);
        
        if (!cachedData) {
          setDialogConfig({
            type: 'error',
            title: t('spu.loadFailed'),
            message: t('spu.productDataNotFound'),
            onConfirm: () => router.push('/admin/spu/create'),
          });
          setLoading(false);
          return;
        }

        const data = JSON.parse(cachedData);
        
        // 验证 CAS 号匹配
        if (data.cas !== cas) {
          setDialogConfig({
            type: 'error',
            title: t('spu.loadFailed'),
            message: t('spu.productDataNotFound'),
            onConfirm: () => router.push('/admin/spu/create'),
          });
          setLoading(false);
          return;
        }

        // 保存预览数据
        setPreviewData(data);

        // 保存产品图 key（用于保存时写入数据库）
        if (data.productImageKey) {
          setProductImageKey(data.productImageKey);
        }

        // 填充表单数据
        setFormData(previewToFormData(data, cas));

        // 检查是否需要翻译（中文名称或描述为空）
        const hasChineseContent = data.nameZh || data.description;
        setNeedTranslate(!hasChineseContent);

      } catch (error: any) {
        console.error('Load preview data error:', error);
        setDialogConfig({
          type: 'error',
          title: t('spu.loadFailed'),
          message: error.message,
          onConfirm: () => router.push('/admin/spu/create'),
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreviewData();
  }, [cas]); // eslint-disable-line react-hooks/exhaustive-deps

  // 翻译
  const handleTranslate = useCallback(async () => {
    if (!formData.nameEn && !formData.description && !formData.physicalDescription) {
      setDialogConfig({
        type: 'error',
        title: t('common.error'),
        message: t('spu.noContentToTranslate'),
      });
      return;
    }

    setTranslating(true);
    setTranslationProgress({ status: 'translating', current: 0, total: 3 });
    setTranslatingFields(new Set(['name', 'description', 'physicalDescription']));
    setPendingTranslations({});

    try {
      const translations: Record<string, any> = {};

      // 翻译名称
      if (formData.nameEn) {
        setTranslationProgress(prev => ({ ...prev, current: 1 }));
        const response = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: formData.nameEn, targetLanguage: 'zh' }),
        });
        const data = await response.json();
        if (data.translatedText) {
          translations.name = data.translatedText;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 翻译描述
      if (formData.description) {
        setTranslationProgress(prev => ({ ...prev, current: 2 }));
        const response = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: formData.description, targetLanguage: 'zh' }),
        });
        const data = await response.json();
        if (data.translatedText) {
          translations.description = data.translatedText;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 翻译物理描述
      if (formData.physicalDescription) {
        setTranslationProgress(prev => ({ ...prev, current: 3 }));
        const response = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: formData.physicalDescription, targetLanguage: 'zh' }),
        });
        const data = await response.json();
        if (data.translatedText) {
          translations.physicalDescription = data.translatedText;
        }
      }

      // 应用翻译结果
      setPendingTranslations(translations);
      setFormData(prev => ({
        ...prev,
        name: translations.name || prev.name,
        description: translations.description || prev.description,
        physicalDescription: translations.physicalDescription || prev.physicalDescription,
      }));

      setNeedTranslate(false);
      setTranslationProgress({ status: 'completed', current: 3, total: 3 });

    } catch (error: any) {
      console.error('Translation error:', error);
      setDialogConfig({
        type: 'error',
        title: t('spu.translateFailed'),
        message: error.message,
      });
    } finally {
      setTranslating(false);
      setTranslatingFields(new Set());
    }
  }, [formData, t]);

  // 保存
  const handleSave = useCallback(async () => {
    if (!formData.cas || !formData.name) {
      setDialogConfig({
        type: 'error',
        title: t('common.error'),
        message: t('spu.requiredFieldsMissing'),
      });
      return;
    }

    setSaving(true);
    try {
      const token = getAdminToken();
      
      // 构建保存数据，合并预览数据和表单数据
      const saveData = {
        cas: formData.cas,
        name: formData.name,
        nameEn: formData.nameEn,
        formula: formData.formula,
        description: formData.description,
        molecularWeight: formData.molecularWeight,
        exactMass: formData.exactMass,
        smiles: formData.smiles,
        smilesCanonical: formData.smilesCanonical,
        smilesIsomeric: formData.smilesIsomeric,
        inchi: formData.inchi,
        inchiKey: formData.inchiKey,
        xlogp: formData.xlogp,
        tpsa: formData.tpsa,
        complexity: formData.complexity ? parseInt(formData.complexity) : null,
        hBondDonorCount: formData.hBondDonorCount ? parseInt(formData.hBondDonorCount) : null,
        hBondAcceptorCount: formData.hBondAcceptorCount ? parseInt(formData.hBondAcceptorCount) : null,
        rotatableBondCount: formData.rotatableBondCount ? parseInt(formData.rotatableBondCount) : null,
        heavyAtomCount: formData.heavyAtomCount ? parseInt(formData.heavyAtomCount) : null,
        formalCharge: formData.formalCharge ? parseInt(formData.formalCharge) : null,
        physicalDescription: formData.physicalDescription,
        colorForm: formData.colorForm,
        odor: formData.odor,
        boilingPoint: formData.boilingPoint,
        meltingPoint: formData.meltingPoint,
        flashPoint: formData.flashPoint,
        density: formData.density,
        solubility: formData.solubility,
        vaporPressure: formData.vaporPressure,
        refractiveIndex: formData.refractiveIndex,
        hazardClasses: formData.hazardClasses,
        healthHazards: formData.healthHazards,
        ghsClassification: formData.ghsClassification,
        toxicitySummary: formData.toxicitySummary,
        carcinogenicity: formData.carcinogenicity,
        firstAid: formData.firstAid,
        storageConditions: formData.storageConditions,
        incompatibleMaterials: formData.incompatibleMaterials,
        synonyms: formData.synonyms,
        applications: formData.applications,
        hsCode: formData.hsCode,
        hsCodeExtensions: formData.hsCodeExtensions,
        // PubChem 数据
        pubchemCid: previewData.pubchemCid,
        structureUrl: previewData.structureUrl,
        structureImageKey: previewData.structureImageKey,
        structureSdf: previewData.structureSdf,
        structure2dSvg: previewData.structure2dSvg,
        productImageKey: productImageKey,
        status: 'ACTIVE',
      };

      const response = await fetch('/api/admin/spu/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(saveData),
      });

      const result = await response.json();

      if (result.success) {
        // 清除 sessionStorage 中的预览数据
        sessionStorage.removeItem(PREVIEW_DATA_KEY);
        
        setDialogConfig({
          type: 'success',
          title: t('spu.saveSuccess'),
          message: t('spu.productCreated'),
          onConfirm: () => router.push('/admin/spu'),
        });
      } else {
        setDialogConfig({
          type: 'error',
          title: t('spu.saveFailed'),
          message: result.error || t('common.unknownError'),
        });
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setDialogConfig({
        type: 'error',
        title: t('spu.saveFailed'),
        message: error.message,
      });
    } finally {
      setSaving(false);
    }
  }, [formData, previewData, productImageKey, router, t]);

  // 返回上一步
  const handleBack = useCallback(() => {
    router.push(`/admin/spu/create/image?cas=${encodeURIComponent(cas)}`);
  }, [cas, router]);

  return {
    // 状态
    loading,
    saving,
    translating,
    translatingFields,
    translationProgress,
    needTranslate,
    
    // 数据
    formData,
    setFormData,
    pendingTranslations,
    
    // 方法
    handleTranslate,
    handleSave,
    handleBack,
    
    // 弹窗
    dialogConfig,
    setDialogConfig,
  };
}
