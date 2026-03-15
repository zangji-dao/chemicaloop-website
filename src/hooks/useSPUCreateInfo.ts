/**
 * 新建产品 - 填写表单页面 Hook
 * 
 * 流程：
 * 1. 从 sessionStorage 获取上一个页面传来的数据
 * 2. 显示表单信息
 * 3. 用户点击翻译
 * 4. 用户点击保存
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAdminToken } from '@/services/adminAuthService';
import { FormData, TranslationProgress } from '@/types/spu';

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

interface TransferData {
  cas: string;
  pubchemData: any;
  productImageKey: string;
  productImageUrl: string;
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
  pubchemData: any;
  productImageUrl: string;
  pendingTranslations: Record<string, any>;
  
  // 方法
  handleTranslate: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleBack: () => void;
  
  // 弹窗
  dialogConfig: any;
  setDialogConfig: (config: any) => void;
}

export function useSPUCreateInfo(locale: string): UseSPUCreateInfoReturn {
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
  const [pubchemData, setPubchemData] = useState<any>(null);
  const [productImageKey, setProductImageKey] = useState<string>('');
  const [productImageUrl, setProductImageUrl] = useState<string>('');
  const [pendingTranslations, setPendingTranslations] = useState<Record<string, any>>({});
  const [structureData, setStructureData] = useState<{
    sdf?: string;
    imageKey?: string;
    svg?: string;
  }>({});
  
  // 弹窗
  const [dialogConfig, setDialogConfig] = useState<any>(null);

  // 从 sessionStorage 加载数据
  useEffect(() => {
    const loadData = async () => {
      const storedData = sessionStorage.getItem('spu_create_data');
      if (storedData) {
        try {
          const data: TransferData = JSON.parse(storedData);
          setPubchemData(data.pubchemData);
          setProductImageKey(data.productImageKey);
          setProductImageUrl(data.productImageUrl);

          // 填充表单数据
          if (data.pubchemData) {
            const pd = data.pubchemData;
            setFormData({
              ...emptyFormData,
              cas: data.cas,
              name: pd.nameZh || '',
              nameEn: pd.nameEn || '',
              formula: pd.formula || '',
              molecularWeight: pd.molecularWeight || '',
              exactMass: pd.exactMass || '',
              smiles: pd.smiles || '',
              smilesCanonical: pd.smilesCanonical || '',
              smilesIsomeric: pd.smilesIsomeric || '',
              inchi: pd.inchi || '',
              inchiKey: pd.inchiKey || '',
              xlogp: pd.xlogp || '',
              tpsa: pd.tpsa || '',
              complexity: pd.complexity || '',
              hBondDonorCount: pd.hBondDonorCount || '',
              hBondAcceptorCount: pd.hBondAcceptorCount || '',
              rotatableBondCount: pd.rotatableBondCount || '',
              heavyAtomCount: pd.heavyAtomCount || '',
              formalCharge: pd.formalCharge || '',
              physicalDescription: pd.physicalDescription || '',
              colorForm: pd.colorForm || '',
              odor: pd.odor || '',
              boilingPoint: pd.boilingPoint || '',
              meltingPoint: pd.meltingPoint || '',
              flashPoint: pd.flashPoint || '',
              density: pd.density || '',
              solubility: pd.solubility || '',
              vaporPressure: pd.vaporPressure || '',
              refractiveIndex: pd.refractiveIndex || '',
              hazardClasses: pd.hazardClasses || '',
              healthHazards: pd.healthHazards || '',
              ghsClassification: pd.ghsClassification || '',
              toxicitySummary: pd.toxicitySummary || '',
              carcinogenicity: pd.carcinogenicity || '',
              firstAid: pd.firstAid || '',
              storageConditions: pd.storageConditions || '',
              incompatibleMaterials: pd.incompatibleMaterials || '',
              description: pd.description || '',
              synonyms: pd.synonyms || [],
              applications: pd.applications || [],
            });

            // 保存结构数据
            setStructureData({
              sdf: pd.structureSdf,
              imageKey: pd.structureImageKey,
              svg: pd.structure2dSvg,
            });

            // 检查需要翻译的字段
            const translatableFields = [
              { key: 'name', value: pd.nameEn },
              { key: 'description', value: pd.description },
              { key: 'physicalDescription', value: pd.physicalDescription },
              { key: 'boilingPoint', value: pd.boilingPoint },
              { key: 'meltingPoint', value: pd.meltingPoint },
              { key: 'flashPoint', value: pd.flashPoint },
              { key: 'hazardClasses', value: pd.hazardClasses },
              { key: 'healthHazards', value: pd.healthHazards },
              { key: 'ghsClassification', value: pd.ghsClassification },
              { key: 'firstAid', value: pd.firstAid },
              { key: 'storageConditions', value: pd.storageConditions },
              { key: 'incompatibleMaterials', value: pd.incompatibleMaterials },
              { key: 'solubility', value: pd.solubility },
              { key: 'vaporPressure', value: pd.vaporPressure },
              { key: 'refractiveIndex', value: pd.refractiveIndex },
            ];

            const fieldsToTranslate = translatableFields
              .filter(({ value }) => value && value !== '-')
              .map(({ key }) => key);

            if (fieldsToTranslate.length > 0) {
              setNeedTranslate(true);
            }
          }
        } catch (error) {
          console.error('Failed to parse stored data:', error);
        }
      }
      setLoading(false);
    };

    loadData();
  }, [cas]);

  // 翻译
  const handleTranslate = useCallback(async () => {
    if (!pubchemData) return;

    const token = getAdminToken();
    setTranslating(true);
    setTranslationProgress({ status: 'translating', current: 0, total: 0 });

    const translatableFields = [
      { key: 'name', value: pubchemData.nameEn },
      { key: 'description', value: pubchemData.description },
      { key: 'physicalDescription', value: pubchemData.physicalDescription },
      { key: 'boilingPoint', value: pubchemData.boilingPoint },
      { key: 'meltingPoint', value: pubchemData.meltingPoint },
      { key: 'flashPoint', value: pubchemData.flashPoint },
      { key: 'hazardClasses', value: pubchemData.hazardClasses },
      { key: 'healthHazards', value: pubchemData.healthHazards },
      { key: 'ghsClassification', value: pubchemData.ghsClassification },
      { key: 'firstAid', value: pubchemData.firstAid },
      { key: 'storageConditions', value: pubchemData.storageConditions },
      { key: 'incompatibleMaterials', value: pubchemData.incompatibleMaterials },
      { key: 'solubility', value: pubchemData.solubility },
      { key: 'vaporPressure', value: pubchemData.vaporPressure },
      { key: 'refractiveIndex', value: pubchemData.refractiveIndex },
    ];

    const fieldsToTranslate = translatableFields.filter(({ value }) => value && value !== '-');
    setTranslatingFields(new Set(fieldsToTranslate.map(({ key }) => key)));
    setTranslationProgress({ status: 'translating', current: 0, total: fieldsToTranslate.length });

    const translations: Record<string, any> = { ...pendingTranslations };

    for (let i = 0; i < fieldsToTranslate.length; i++) {
      const { key, value } = fieldsToTranslate[i];
      setTranslationProgress({ status: 'translating', current: i + 1, total: fieldsToTranslate.length });

      try {
        const response = await fetch('/api/admin/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text: value, targetLang: 'zh' }),
        });

        const data = await response.json();
        if (data.success && data.translatedText) {
          translations[key] = data.translatedText;
        }
      } catch (error) {
        console.error(`Failed to translate ${key}:`, error);
      }
    }

    setPendingTranslations(translations);
    setTranslating(false);
    setTranslationProgress({ status: 'completed', current: fieldsToTranslate.length, total: fieldsToTranslate.length });
    setNeedTranslate(false);
    setDialogConfig({
      type: 'success',
      title: locale === 'zh' ? '翻译完成' : 'Translation Completed',
      message: locale === 'zh'
        ? `已翻译 ${fieldsToTranslate.length} 个字段。点击"保存"按钮保存数据。`
        : `Translated ${fieldsToTranslate.length} fields. Click "Save" button to save.`,
    });
  }, [pubchemData, pendingTranslations, locale]);

  // 保存
  const handleSave = useCallback(async () => {
    if (!formData.cas) {
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '提示' : 'Notice',
        message: locale === 'zh' ? 'CAS 号不能为空' : 'CAS number is required',
      });
      return;
    }

    if (!formData.name && !formData.nameEn) {
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '提示' : 'Notice',
        message: locale === 'zh' ? '产品名称不能为空' : 'Product name is required',
      });
      return;
    }

    const token = getAdminToken();
    setSaving(true);

    try {
      const translations = Object.keys(pendingTranslations).length > 0 ? pendingTranslations : undefined;

      const spuData = {
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
        toxicitySummary: formData.toxicitySummary || null,
        carcinogenicity: formData.carcinogenicity || null,
        firstAid: formData.firstAid || null,
        storageConditions: formData.storageConditions || null,
        incompatibleMaterials: formData.incompatibleMaterials || null,
        hsCode: formData.hsCode || null,
        hsCodeExtensions: formData.hsCodeExtensions || null,
        status: formData.status,
        synonyms: formData.synonyms || [],
        applications: formData.applications || [],
        translations,
        pubchemCid: pubchemData?.cid,
        // 结构数据
        structureSdf: structureData.sdf || null,
        structureImageKey: structureData.imageKey || null,
        structure2dSvg: structureData.svg || null,
        // 产品图
        productImageKey: productImageKey || null,
      };

      const response = await fetch('/api/admin/spu/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(spuData),
      });

      const result = await response.json();

      if (result.success) {
        // 清除 sessionStorage
        sessionStorage.removeItem('spu_create_data');
        
        setDialogConfig({
          type: 'success',
          title: locale === 'zh' ? '保存成功' : 'Success',
          message: locale === 'zh' ? '产品已创建成功！' : 'Product created successfully!',
          onConfirm: () => router.push('/admin/spu'),
        });
      } else {
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '保存失败' : 'Save Failed',
          message: result.error || (locale === 'zh' ? '未知错误' : 'Unknown error'),
        });
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '保存失败' : 'Save Failed',
        message: error.message,
      });
    } finally {
      setSaving(false);
    }
  }, [formData, pubchemData, structureData, productImageKey, pendingTranslations, locale, router]);

  // 返回
  const handleBack = useCallback(() => {
    router.push(`/admin/spu/create/image?cas=${encodeURIComponent(cas)}`);
  }, [router, cas]);

  return {
    loading,
    saving,
    translating,
    translatingFields,
    translationProgress,
    needTranslate,
    formData,
    setFormData,
    pubchemData,
    productImageUrl,
    pendingTranslations,
    handleTranslate,
    handleSave,
    handleBack,
    dialogConfig,
    setDialogConfig,
  };
}
